import { NextResponse } from "next/server";
import { getUserAndProfile, supabaseAdmin } from "@/lib/supabase/server";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { env, siteUrl } from "@/lib/env";

export const runtime = "nodejs";

// Ouvre la page de paiement Stripe pour l'abonnement Pro.
export async function POST() {
  const { user, profile } = await getUserAndProfile();
  if (!user || !profile) return NextResponse.json({ error: "Connecte-toi d'abord." }, { status: 401 });
  if (profile.plan === "pro") return NextResponse.json({ error: "Tu es déjà abonné à RevizUp Pro." }, { status: 400 });
  if (!stripeConfigured()) return NextResponse.json({ error: "Le paiement n'est pas encore activé sur RevizUp." }, { status: 503 });

  try {
    const s = stripe();
    let customer = profile.stripe_customer_id;
    if (!customer) {
      const c = await s.customers.create({ email: user.email ?? undefined, metadata: { userId: user.id } });
      customer = c.id;
      await supabaseAdmin().from("profiles").update({ stripe_customer_id: customer }).eq("id", user.id);
    }
    const session = await s.checkout.sessions.create({
      mode: "subscription",
      customer,
      client_reference_id: user.id,
      line_items: [{ price: env("STRIPE_PRICE_ID"), quantity: 1 }],
      subscription_data: { metadata: { userId: user.id } },
      allow_promotion_codes: true,
      locale: "fr",
      success_url: `${siteUrl()}/app?pro=ok`,
      cancel_url: `${siteUrl()}/app`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("checkout", e);
    return NextResponse.json({ error: "Le paiement n'a pas pu démarrer. Réessaie dans un instant." }, { status: 500 });
  }
}
