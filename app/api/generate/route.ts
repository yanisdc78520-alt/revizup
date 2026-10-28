import { NextResponse } from "next/server";
import { getUserAndProfile, supabaseAdmin } from "@/lib/supabase/server";
import { LIMITS, quizLimit } from "@/lib/plans";
import { chat, chatStream, LlmError, parseJsonLoose, type ChatMessage } from "@/lib/llm";
import {
  cleanQuiz,
  fichePrompt,
  quizPrompt,
  refineMessages,
  type FicheOptions,
  type QuizOptions,
} from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 120;

type Body = {
  courseId?: string;
  kind?: "fiche" | "quiz";
  topic?: string;
  len?: FicheOptions["len"];
  nq?: number;
  level?: QuizOptions["level"];
  qtype?: QuizOptions["qtype"];
  refineOf?: string; // id d'une fiche/quiz à affiner
  refine?: string; // demande d'affinage
};

type StoredOptions = { len?: FicheOptions["len"]; nq?: number; level?: QuizOptions["level"]; qtype?: QuizOptions["qtype"]; refinedFrom?: string; request?: string };

export async function POST(req: Request) {
  const { supabase, user, profile } = await getUserAndProfile();
  if (!user || !profile) return NextResponse.json({ error: "Connecte-toi pour générer." }, { status: 401 });

  const b = ((await req.json().catch(() => null)) ?? {}) as Body;
  if (!b.courseId) return NextResponse.json({ error: "Cours manquant." }, { status: 400 });

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, content")
    .eq("id", b.courseId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!course) return NextResponse.json({ error: "Cours introuvable." }, { status: 404 });

  // Construit la demande (nouvelle génération ou affinage).
  let kind: "fiche" | "quiz";
  let topic = String(b.topic ?? "").trim().slice(0, 200);
  let options: StoredOptions;
  let messages: ChatMessage[];

  if (b.refineOf) {
    const request = String(b.refine ?? "").trim().slice(0, 400);
    if (!request) return NextResponse.json({ error: "Écris ce que tu veux changer." }, { status: 400 });
    const { data: prev } = await supabase
      .from("outputs")
      .select("kind, topic, options, body")
      .eq("id", b.refineOf)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!prev) return NextResponse.json({ error: "Fiche ou quiz introuvable." }, { status: 404 });
    kind = prev.kind;
    topic = prev.topic === "Tout le cours" ? "" : prev.topic;
    const po = (prev.options ?? {}) as StoredOptions;
    const original =
      kind === "fiche"
        ? fichePrompt(course.title, course.content, topic, { len: po.len ?? "courte" })
        : quizPrompt(course.title, course.content, topic, { nq: po.nq ?? 10, level: po.level ?? "examen", qtype: po.qtype ?? "QCM" });
    const previous = kind === "fiche" ? String(prev.body?.md ?? "") : JSON.stringify({ questions: prev.body?.questions ?? [] });
    messages = refineMessages(original, previous, request, kind);
    options = { ...po, refinedFrom: b.refineOf, request };
  } else {
    kind = b.kind === "quiz" ? "quiz" : "fiche";
    if (kind === "fiche") {
      const len: FicheOptions["len"] = b.len === "détaillée" ? "détaillée" : "courte";
      options = { len };
      messages = fichePrompt(course.title, course.content, topic, { len });
    } else {
      const nq = Math.max(3, Math.min(Number(b.nq) || 10, quizLimit(profile.plan)));
      const level: QuizOptions["level"] = b.level === "facile" ? "facile" : "examen";
      const qtype: QuizOptions["qtype"] = b.qtype === "Vrai/Faux" || b.qtype === "Mixte" ? b.qtype : "QCM";
      options = { nq, level, qtype };
      messages = quizPrompt(course.title, course.content, topic, { nq, level, qtype });
    }
  }

  // Quota, vérifié et consommé côté serveur de façon atomique.
  const admin = supabaseAdmin();
  const { data: allowed, error: quotaErr } = await admin.rpc("consume_generation", {
    p_user: user.id,
    p_free_limit: LIMITS.free.generations,
    p_pro_monthly_limit: LIMITS.pro.generationsPer30Days,
  });
  if (quotaErr) {
    console.error(quotaErr);
    return NextResponse.json({ error: "Erreur du serveur. Réessaie." }, { status: 500 });
  }
  if (!allowed) {
    return NextResponse.json(
      profile.plan === "pro"
        ? { error: "Tu as atteint la limite de 500 générations sur 30 jours. Elle se libère au fil des jours." }
        : { error: "Tu as utilisé tes 5 générations gratuites.", code: "quota" },
      { status: profile.plan === "pro" ? 429 : 402 },
    );
  }
  const refund = () => admin.rpc("refund_generation", { p_user: user.id });
  const topicLabel = topic || "Tout le cours";

  // ---- Quiz : réponse JSON, avec une seconde tentative si le format est mauvais.
  if (kind === "quiz") {
    try {
      const maxTokens = 400 + (options.nq ?? 10) * 220;
      let raw = await chat(messages, { json: true, maxTokens });
      let questions = [] as ReturnType<typeof cleanQuiz>;
      try {
        questions = cleanQuiz(parseJsonLoose(raw));
      } catch {
        /* seconde tentative ci-dessous */
      }
      if (!questions.length) {
        raw = await chat(
          [...messages, { role: "assistant", content: raw }, { role: "user", content: 'Ta réponse n\'est pas au bon format. Renvoie UNIQUEMENT le JSON {"questions":[...]} demandé.' }],
          { json: true, maxTokens },
        );
        questions = cleanQuiz(parseJsonLoose(raw));
      }
      if (!questions.length) throw new LlmError("Le quiz n'a pas pu être créé. Réessaie ou choisis un point plus précis.");
      const { data: saved, error } = await supabase
        .from("outputs")
        .insert({ user_id: user.id, course_id: course.id, kind, topic: topicLabel, options, body: { questions } })
        .select("id, kind, topic, options, body, created_at")
        .single();
      if (error) throw error;
      return NextResponse.json({ output: saved });
    } catch (e) {
      await refund();
      const status = e instanceof LlmError ? e.status : 500;
      const message = e instanceof LlmError ? e.message : "La génération a échoué. Réessaie.";
      console.error("quiz", e);
      return NextResponse.json({ error: message }, { status });
    }
  }

  // ---- Fiche : texte envoyé au fur et à mesure, enregistré à la fin.
  let stream: AsyncGenerator<string>;
  try {
    stream = await chatStream(messages, { maxTokens: options.len === "détaillée" ? 3500 : 1800, signal: req.signal });
  } catch (e) {
    await refund();
    const message = e instanceof LlmError ? e.message : "La génération a échoué. Réessaie.";
    return NextResponse.json({ error: message }, { status: e instanceof LlmError ? e.status : 500 });
  }

  const encoder = new TextEncoder();
  let full = "";
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const delta of stream) {
          full += delta;
          controller.enqueue(encoder.encode(delta));
        }
        if (!full.trim()) throw new LlmError("Réponse vide.");
        const { error } = await supabase
          .from("outputs")
          .insert({ user_id: user.id, course_id: course.id, kind: "fiche", topic: topicLabel, options, body: { md: full } });
        if (error) throw error;
        controller.close();
      } catch (e) {
        console.error("fiche", e);
        await refund();
        try {
          controller.enqueue(encoder.encode("\n\n[[ERREUR]] La génération a été interrompue. Elle n'a pas été décomptée, réessaie."));
          controller.close();
        } catch {
          // l'utilisateur a déjà fermé la connexion
        }
      }
    },
  });
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
