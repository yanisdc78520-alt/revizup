"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function Connexion() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("erreur")) {
      setState("error");
      setMessage("Ce lien de connexion a expiré ou a déjà servi. Demande-en un nouveau.");
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/app` },
    });
    if (error) {
      setState("error");
      setMessage(
        error.status === 429
          ? "Trop de demandes. Attends une minute avant de redemander un lien."
          : "Impossible d'envoyer le lien. Vérifie ton adresse e-mail.",
      );
    } else setState("sent");
  }

  return (
    <main className="auth">
      <Link href="/" className="logo">
        Reviz<span className="up">Up</span>
      </Link>
      <div className="auth-card">
        {state === "sent" ? (
          <>
            <h1>Regarde tes e-mails</h1>
            <p>
              On t&apos;a envoyé un lien de connexion à <b>{email}</b>. Clique dessus depuis cet appareil pour ouvrir RevizUp.
            </p>
            <p className="muted">Rien reçu ? Regarde dans les spams, ou</p>
            <button className="btn" onClick={() => setState("idle")}>
              Utiliser une autre adresse
            </button>
          </>
        ) : (
          <form onSubmit={submit}>
            <h1>Connexion ou inscription</h1>
            <p className="muted">Pas de mot de passe : on t&apos;envoie un lien par e-mail. L&apos;essai gratuit démarre tout de suite.</p>
            <label htmlFor="email">Adresse e-mail</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="prenom.nom@exemple.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="btn primary wide" disabled={state === "sending"}>
              {state === "sending" ? "Envoi…" : "Recevoir mon lien de connexion"}
            </button>
            {state === "error" && <p className="err">{message}</p>}
            <p className="fine">
              En continuant, tu acceptes les <Link href="/cgv">conditions générales</Link> et la{" "}
              <Link href="/confidentialite">politique de confidentialité</Link>.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
