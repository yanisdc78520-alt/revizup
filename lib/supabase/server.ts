import { createServerClient } from "@supabase/ssr";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

// Client lié à l'utilisateur connecté (respecte la sécurité par ligne).
export function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Appelé depuis un composant serveur : le middleware rafraîchit la session.
        }
      },
    },
  });
}

// Client administrateur : uniquement côté serveur (quota, plan, webhook Stripe).
export function supabaseAdmin() {
  return createAdmin(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type Profile = {
  id: string;
  email: string | null;
  plan: "free" | "pro";
  generations_used: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

export async function getUserAndProfile() {
  const supabase = supabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return { supabase, user: null, profile: null as Profile | null };
  let { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile) {
    // Filet de sécurité si le déclencheur n'a pas créé le profil.
    const admin = supabaseAdmin();
    await admin.from("profiles").upsert({ id: user.id, email: user.email }, { onConflict: "id" });
    ({ data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle());
  }
  return { supabase, user, profile: profile as Profile | null };
}
