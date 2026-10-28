import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// Lien reçu par e-mail : échange le code contre une session puis ouvre l'app.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/app";
  if (code) {
    const supabase = supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(dest, url.origin));
  }
  return NextResponse.redirect(new URL("/connexion?erreur=lien", url.origin));
}
