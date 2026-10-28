import { NextResponse } from "next/server";
import { getUserAndProfile } from "@/lib/supabase/server";
import { charLimit, courseLimit } from "@/lib/plans";
import { chat, parseJsonLoose } from "@/lib/llm";
import { topicsPrompt } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

// Ajoute un cours (le texte est extrait dans le navigateur, on ne reçoit que du texte).
export async function POST(req: Request) {
  const { supabase, user, profile } = await getUserAndProfile();
  if (!user || !profile) return NextResponse.json({ error: "Connecte-toi pour ajouter un cours." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const title = String(body?.title ?? "").trim().slice(0, 200) || "Cours sans titre";
  const source = String(body?.source ?? "").slice(0, 100);
  let text = String(body?.text ?? "").replace(/\u0000/g, "").trim();

  if (text.length < 200) {
    return NextResponse.json(
      { error: "Le texte du cours est trop court ou illisible. Un PDF scanné (en image) ne contient pas de texte : colle plutôt le texte." },
      { status: 400 },
    );
  }

  const { count } = await supabase.from("courses").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  if ((count ?? 0) >= courseLimit(profile.plan)) {
    return NextResponse.json(
      {
        error:
          profile.plan === "pro"
            ? "Tu as atteint le nombre maximal de cours. Supprime un ancien cours pour en ajouter un."
            : "L'essai gratuit permet 3 cours. Supprime un cours ou passe en Pro.",
        code: profile.plan === "pro" ? undefined : "quota",
      },
      { status: profile.plan === "pro" ? 400 : 402 },
    );
  }

  let truncated = false;
  const max = charLimit(profile.plan);
  if (text.length > max) {
    text = text.slice(0, max);
    truncated = true;
  }

  let topics: string[] = [];
  try {
    const raw = await chat(topicsPrompt(title, text), { fast: true, json: true, maxTokens: 400, signal: AbortSignal.timeout(25000) });
    const data = parseJsonLoose(raw) as { topics?: unknown } | unknown[];
    const arr = Array.isArray(data) ? data : Array.isArray((data as { topics?: unknown }).topics) ? ((data as { topics: unknown[] }).topics) : [];
    topics = arr.map((t) => String(t).trim()).filter((t) => t && t.length < 80).slice(0, 8);
  } catch (e) {
    console.error("topics", e);
  }

  const { data, error } = await supabase
    .from("courses")
    .insert({ user_id: user.id, title, source, content: text, topics })
    .select("id, title, source, topics, created_at")
    .single();
  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Le cours n'a pas pu être enregistré. Réessaie." }, { status: 500 });
  }
  return NextResponse.json({ course: { ...data, chars: text.length }, truncated });
}
