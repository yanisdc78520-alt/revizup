"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { extractText } from "@/components/extract";
import Markdown from "@/components/Markdown";
import { PRO_PRICE_LABEL } from "@/lib/plans";

type Course = { id: string; title: string; source: string; topics: string[]; chars: number };
type Question = { q: string; options: string[]; answer: number; explanation: string };
type Output = {
  id: string;
  kind: "fiche" | "quiz";
  topic: string;
  options: Record<string, unknown>;
  body: { md?: string; questions?: Question[] };
  created_at: string;
};

type Props = {
  email: string;
  plan: "free" | "pro";
  used: number;
  freeLimit: number;
  maxQuiz: number;
  initialCourses: Course[];
  justUpgraded: boolean;
};

export default function Workspace({ email, plan, used: usedInit, freeLimit, maxQuiz, initialCourses, justUpgraded }: Props) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [courseId, setCourseId] = useState<string | null>(initialCourses[0]?.id ?? null);
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [loadingOutputs, setLoadingOutputs] = useState(false);
  const [used, setUsed] = useState(usedInit);

  const [tab, setTab] = useState<"fiche" | "quiz">("fiche");
  const [topic, setTopic] = useState("");
  const [len, setLen] = useState<"courte" | "détaillée">("courte");
  const [nq, setNq] = useState(5);
  const [level, setLevel] = useState<"facile" | "examen">("examen");
  const [qtype, setQtype] = useState<"QCM" | "Vrai/Faux" | "Mixte">("QCM");
  const [refine, setRefine] = useState("");

  const [busy, setBusy] = useState<null | { kind: "fiche" | "quiz"; text: string }>(null);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [paywall, setPaywall] = useState<string | null>(null);
  const [notice, setNotice] = useState(justUpgraded ? "Bienvenue dans RevizUp Pro ! Tes générations sont maintenant illimitées." : "");

  const [importMsg, setImportMsg] = useState<{ text: string; err?: boolean } | null>(null);
  const [importing, setImporting] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(initialCourses.length === 0);
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const course = courses.find((c) => c.id === courseId) ?? null;
  const out = outputs.find((o) => o.id === current) ?? null;
  const left = Math.max(0, freeLimit - used);

  const loadOutputs = useCallback(async (id: string, prefer?: "fiche" | "quiz") => {
    setLoadingOutputs(true);
    try {
      const r = await fetch(`/api/courses/${id}`);
      const j = await r.json();
      const list: Output[] = j.outputs ?? [];
      setOutputs(list);
      const first = list.find((o) => !prefer || o.kind === prefer);
      setCurrent(first?.id ?? null);
    } catch {
      setOutputs([]);
    } finally {
      setLoadingOutputs(false);
    }
  }, []);

  useEffect(() => {
    if (courseId) loadOutputs(courseId);
    else setOutputs([]);
    setTopic("");
    setError("");
    setAnswers({});
    setConfirmDelete(false);
  }, [courseId, loadOutputs]);

  // ---------- import ----------
  async function addCourse(title: string, text: string, source: string) {
    setImporting(true);
    setImportMsg({ text: "Analyse du cours et repérage des grands thèmes…" });
    try {
      const r = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, text, source }),
      });
      const j = await r.json();
      if (!r.ok) {
        if (j.code === "quota") setPaywall(j.error);
        setImportMsg({ text: j.error ?? "Le cours n'a pas pu être ajouté.", err: true });
        return;
      }
      const c: Course = { id: j.course.id, title: j.course.title, source: j.course.source ?? "", topics: j.course.topics ?? [], chars: j.course.chars };
      setCourses((cs) => [c, ...cs]);
      setCourseId(c.id);
      setTab("fiche");
      setPasteOpen(false);
      setImportMsg({
        text: j.truncated
          ? "Cours ajouté, mais il était trop long : seul le début a été gardé. Importe-le en plusieurs parties."
          : "Cours ajouté.",
        err: j.truncated,
      });
    } catch {
      setImportMsg({ text: "Connexion impossible. Vérifie ta connexion internet et réessaie.", err: true });
    } finally {
      setImporting(false);
    }
  }

  async function handleFile(file?: File) {
    if (!file || importing) return;
    setImportMsg({ text: `Lecture de « ${file.name} »…` });
    try {
      const { text, source } = await extractText(file, (m) => setImportMsg({ text: m }));
      const title = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
      await addCourse(title, text, source);
    } catch (e) {
      setImportMsg({ text: e instanceof Error ? e.message : "Impossible de lire ce fichier. Colle plutôt le texte du cours.", err: true });
    }
  }

  // ---------- génération ----------
  async function generate(refineOf?: string) {
    if (!course || busy) return;
    setError("");
    const kind = refineOf ? out!.kind : tab;
    const ctl = new AbortController();
    abortRef.current = ctl;
    setBusy({ kind, text: "" });
    try {
      const payload = refineOf
        ? { courseId: course.id, refineOf, refine }
        : { courseId: course.id, kind, topic, len, nq, level, qtype };
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: ctl.signal,
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        if (j.code === "quota") setPaywall(j.error);
        else setError(j.error ?? "La génération a échoué. Réessaie.");
        return;
      }
      if (kind === "quiz") {
        const j = await r.json();
        setOutputs((o) => [j.output, ...o]);
        setCurrent(j.output.id);
        setAnswers({});
      } else {
        const reader = r.body!.getReader();
        const dec = new TextDecoder();
        let text = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          text += dec.decode(value, { stream: true });
          setBusy({ kind, text });
        }
        if (text.includes("[[ERREUR]]")) {
          setError(text.split("[[ERREUR]]")[1].trim());
          return;
        }
        await loadOutputs(course.id, "fiche");
      }
      setTab(kind);
      setRefine("");
      if (plan === "free") setUsed((u) => u + 1);
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") setError("Connexion interrompue. Réessaie.");
    } finally {
      setBusy(null);
      abortRef.current = null;
    }
  }

  async function deleteCourse() {
    if (!course) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await fetch(`/api/courses/${course.id}`, { method: "DELETE" });
    const rest = courses.filter((c) => c.id !== course.id);
    setCourses(rest);
    setCourseId(rest[0]?.id ?? null);
  }

  async function goCheckout() {
    const r = await fetch("/api/stripe/checkout", { method: "POST" });
    const j = await r.json().catch(() => ({}));
    if (j.url) window.location.href = j.url;
    else setPaywall(j.error ?? "Le paiement n'est pas disponible pour le moment.");
  }
  async function goPortal() {
    const r = await fetch("/api/stripe/portal", { method: "POST" });
    const j = await r.json().catch(() => ({}));
    if (j.url) window.location.href = j.url;
    else setNotice(j.error ?? "Impossible d'ouvrir la gestion de l'abonnement.");
  }

  const visibleOutput = busy ? null : out && out.kind === tab ? out : outputs.find((o) => o.kind === tab) ?? null;
  const history = outputs.filter((o) => o.id !== visibleOutput?.id);

  return (
    <div className="wrap">
      <header className="top">
        <Link href="/app" className="logo">
          Reviz<span className="up">Up</span>
        </Link>
        <div className="spacer" />
        {plan === "pro" ? (
          <span className="pill pro-pill">Pro</span>
        ) : (
          <span className="pill" title="Générations gratuites restantes">
            Essai gratuit
            <span className="dots">
              {Array.from({ length: freeLimit }, (_, i) => (
                <i key={i} className={i < left ? "" : "used"} />
              ))}
            </span>
            {left}/{freeLimit}
          </span>
        )}
        {plan === "pro" ? (
          <button className="btn" onClick={goPortal}>
            Mon abonnement
          </button>
        ) : (
          <button className="btn pro" onClick={() => setPaywall("")}>
            Passer en Pro
          </button>
        )}
        <form action="/auth/deconnexion" method="post">
          <button className="btn ghost" title={email}>
            Déconnexion
          </button>
        </form>
      </header>

      {notice && (
        <p className="notice" role="status">
          {notice} <button className="linkbtn" onClick={() => setNotice("")}>Fermer</button>
        </p>
      )}

      <div className="grid">
        <aside className="shelf">
          <h2 className="label">Mes cours</h2>
          <div className="courses">
            {courses.map((c) => (
              <button key={c.id} className={"course" + (c.id === courseId ? " on" : "")} onClick={() => setCourseId(c.id)}>
                <b>{c.title}</b>
                <small>{c.source || "Cours"}</small>
              </button>
            ))}
            {!courses.length && <p className="muted small">Aucun cours pour l&apos;instant.</p>}
          </div>

          <div
            className={"drop" + (dragOver ? " over" : "")}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFile(e.dataTransfer.files[0]);
            }}
          >
            <p>
              <b>Ajouter un cours</b>
              <br />
              PDF, Word ou texte. Glisse le fichier ici ou choisis-le.
            </p>
            <label className={"file" + (importing ? " disabled" : "")} htmlFor="file">
              Choisir un fichier
            </label>
            <input
              id="file"
              type="file"
              accept=".pdf,.docx,.txt,.md"
              className="visually-hidden"
              disabled={importing}
              onChange={(e) => {
                handleFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <button className="linkbtn" onClick={() => setPasteOpen((v) => !v)}>
              ou coller le texte du cours
            </button>
            {pasteOpen && (
              <div className="paste">
                <input
                  id="pasteTitle"
                  type="text"
                  placeholder="Titre du cours (ex. Droit des sociétés, chap. 2)"
                  value={pasteTitle}
                  onChange={(e) => setPasteTitle(e.target.value)}
                />
                <textarea
                  id="pasteText"
                  placeholder="Colle ici le texte de ton cours…"
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                />
                <button
                  className="btn primary wide"
                  disabled={importing || pasteText.trim().length < 200}
                  onClick={async () => {
                    await addCourse(pasteTitle.trim() || "Cours collé", pasteText, "Texte collé");
                    setPasteText("");
                    setPasteTitle("");
                  }}
                >
                  Ajouter ce cours
                </button>
              </div>
            )}
            {importMsg && (
              <p className={"status" + (importMsg.err ? " err" : "")} aria-live="polite">
                {importMsg.text}
              </p>
            )}
          </div>
        </aside>

        <main className="panel">
          {!course ? (
            <div className="empty-state">
              <h1 className="ctitle">Ajoute ton premier cours</h1>
              <p>
                Importe un PDF ou un fichier Word, ou colle le texte de ton cours à gauche. RevizUp repère les grands thèmes, puis
                te fait des fiches et des quiz sur le point que tu choisis.
              </p>
              <ol className="steps">
                <li>Ajoute un cours</li>
                <li>Choisis un point précis, ou tout le cours</li>
                <li>Génère ta fiche ou ton quiz, puis affine-les</li>
              </ol>
            </div>
          ) : (
            <>
              <h1 className="ctitle">{course.title}</h1>
              <div className="cmeta">
                <span>{course.source}</span>
                <span>{Math.round(course.chars / 6).toLocaleString("fr-FR")} mots environ</span>
                <button className={"del" + (confirmDelete ? " danger" : "")} onClick={deleteCourse}>
                  {confirmDelete ? "Confirmer la suppression" : "Supprimer ce cours"}
                </button>
              </div>

              <div className="tabs" role="tablist">
                {(["fiche", "quiz"] as const).map((t) => (
                  <button
                    key={t}
                    role="tab"
                    aria-selected={tab === t}
                    className={"tab" + (tab === t ? " on" : "")}
                    onClick={() => {
                      setTab(t);
                      setError("");
                      setAnswers({});
                    }}
                  >
                    {t === "fiche" ? "Fiche" : "Quiz"}
                  </button>
                ))}
              </div>

              <div className="ask">
                <label className="l" htmlFor="topic">
                  {tab === "fiche" ? "Sur quel point veux-tu une fiche ?" : "Sur quel point veux-tu être interrogé ?"}
                </label>
                <input
                  id="topic"
                  type="text"
                  placeholder="Laisse vide pour tout le cours, ou écris un point précis"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      generate();
                    }
                  }}
                />
                {course.topics.length > 0 && (
                  <div className="chips">
                    {course.topics.map((t) => (
                      <button key={t} className={"chip" + (topic === t ? " on" : "")} onClick={() => setTopic(topic === t ? "" : t)}>
                        {t}
                      </button>
                    ))}
                  </div>
                )}
                <div className="opts">
                  {tab === "fiche" ? (
                    <Seg label="Longueur" value={len} values={["courte", "détaillée"] as const} onChange={setLen} />
                  ) : (
                    <>
                      <Seg label="Questions" value={nq} values={[5, 10, 15, 20].filter((n) => n <= maxQuiz)} onChange={setNq} />
                      <Seg label="Niveau" value={level} values={["facile", "examen"] as const} onChange={setLevel} />
                      <Seg label="Type" value={qtype} values={["QCM", "Vrai/Faux", "Mixte"] as const} onChange={setQtype} />
                    </>
                  )}
                  <button className="btn primary" disabled={!!busy} onClick={() => generate()}>
                    {tab === "fiche" ? "Générer la fiche" : "Générer le quiz"}
                  </button>
                </div>
                {error && <p className="status err">{error}</p>}
              </div>

              <section className="out">
                {busy ? (
                  <>
                    <div className="outhead">
                      <h3>{busy.kind === "fiche" ? "Fiche en cours…" : "Quiz en préparation…"}</h3>
                      <button className="btn" onClick={() => abortRef.current?.abort()}>
                        Arrêter
                      </button>
                    </div>
                    {busy.text ? (
                      <div className="fiche">
                        <Markdown src={busy.text} />
                      </div>
                    ) : (
                      <p className="thinking">RevizUp lit ton cours…</p>
                    )}
                  </>
                ) : loadingOutputs ? (
                  <p className="muted">Chargement…</p>
                ) : visibleOutput ? (
                  <>
                    {visibleOutput.kind === "fiche" ? (
                      <FicheView o={visibleOutput} />
                    ) : (
                      <QuizView o={visibleOutput} answers={answers} setAnswers={setAnswers} />
                    )}
                    <div className="refine">
                      <input
                        id="refine"
                        type="text"
                        placeholder={
                          visibleOutput.kind === "fiche"
                            ? "Affiner : ex. plus courte, ajoute les exemples, explique plus simplement"
                            : "Affiner : ex. questions plus dures, plus sur les définitions"
                        }
                        value={refine}
                        onChange={(e) => setRefine(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && refine.trim()) generate(visibleOutput.id);
                        }}
                      />
                      <button className="btn primary" disabled={!refine.trim()} onClick={() => generate(visibleOutput.id)}>
                        Affiner
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="muted">
                    Choisis un point ou laisse vide, puis clique sur « {tab === "fiche" ? "Générer la fiche" : "Générer le quiz"} ».
                  </p>
                )}
              </section>

              {!busy && history.length > 0 && (
                <div className="hist">
                  <h2 className="label">Déjà générés pour ce cours</h2>
                  <div className="chips">
                    {history.map((o) => (
                      <button
                        key={o.id}
                        className="chip"
                        onClick={() => {
                          setCurrent(o.id);
                          setTab(o.kind);
                          setAnswers({});
                        }}
                      >
                        {o.kind === "fiche" ? "Fiche" : "Quiz"} · {o.topic}
                        {o.options?.request ? " (affiné)" : ""}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {paywall !== null && (
        <div className="modal" onClick={(e) => e.target === e.currentTarget && setPaywall(null)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="pw">
            <h2 id="pw">Révise sans limite avec RevizUp Pro</h2>
            <p className="muted">{paywall || "Débloque les fiches et quiz illimités."}</p>
            <div className="plans">
              <div className="plan">
                <b>Gratuit</b>
                <div className="price">0 €</div>
                <ul>
                  <li>{freeLimit} fiches ou quiz pour essayer</li>
                  <li>3 cours</li>
                  <li>Quiz de 10 questions</li>
                </ul>
              </div>
              <div className="plan best">
                <b>Pro</b>
                <div className="price">
                  {PRO_PRICE_LABEL} <small>/ mois</small>
                </div>
                <ul>
                  <li>Fiches et quiz illimités</li>
                  <li>Cours longs, jusqu&apos;à 150 pages</li>
                  <li>Quiz de 20 questions</li>
                  <li>Sans engagement</li>
                </ul>
                <button className="btn primary" onClick={goCheckout}>
                  S&apos;abonner
                </button>
              </div>
            </div>
            <div className="row">
              <button className="btn" onClick={() => setPaywall(null)}>
                Plus tard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Seg<T extends string | number>({ label, value, values, onChange }: { label: string; value: T; values: readonly T[]; onChange: (v: T) => void }) {
  return (
    <div className="seg">
      <span>{label}</span>
      <div>
        {values.map((v) => (
          <button key={String(v)} className={v === value ? "on" : ""} aria-pressed={v === value} onClick={() => onChange(v)}>
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

function FicheView({ o }: { o: Output }) {
  const [copied, setCopied] = useState("");
  return (
    <>
      <div className="outhead">
        <h3>Fiche · {o.topic}</h3>
        <button
          className="btn"
          onClick={() =>
            navigator.clipboard
              .writeText((o.body.md ?? "").replace(/\*\*/g, ""))
              .then(() => setCopied("Copié"))
              .catch(() => setCopied("Copie impossible"))
          }
        >
          {copied || "Copier"}
        </button>
      </div>
      <div className="fiche">
        <Markdown src={o.body.md ?? ""} />
      </div>
    </>
  );
}

function QuizView({ o, answers, setAnswers }: { o: Output; answers: Record<number, number>; setAnswers: (a: Record<number, number>) => void }) {
  const qs = o.body.questions ?? [];
  const done = Object.keys(answers).length;
  const good = qs.filter((q, i) => answers[i] === q.answer).length;
  return (
    <>
      <div className="outhead">
        <h3>Quiz · {o.topic}</h3>
        <span className="score">
          {good} / {done} · {qs.length} questions
        </span>
        <button className="btn" onClick={() => setAnswers({})}>
          Recommencer
        </button>
      </div>
      <div className="qs">
        {qs.map((q, i) => {
          const a = answers[i];
          return (
            <div className="q" key={i}>
              <div className="n">Question {i + 1}</div>
              <div className="txt">{q.q}</div>
              <div className="os">
                {q.options.map((op, j) => {
                  let cls = "o";
                  if (a !== undefined) {
                    if (j === q.answer) cls += " right";
                    else if (j === a) cls += " wrong";
                  }
                  return (
                    <button key={j} className={cls} disabled={a !== undefined} onClick={() => setAnswers({ ...answers, [i]: j })}>
                      <span className="k">{"ABCDEF"[j]}</span>
                      <span>{op}</span>
                    </button>
                  );
                })}
              </div>
              {a !== undefined && (
                <div className="ex">
                  <b>{a === q.answer ? "Bonne réponse." : "Pas tout à fait."}</b> {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {done === qs.length && qs.length > 0 && (
        <p className="final">
          Score final : <b>{good} / {qs.length}</b>
          {good === qs.length ? ". Parfait !" : good >= qs.length / 2 ? ". Bien, revois les questions ratées." : ". Relis la fiche de ce point et retente."}
        </p>
      )}
    </>
  );
}
