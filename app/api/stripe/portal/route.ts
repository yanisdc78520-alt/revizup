import { NextResponse } from "next/server";
import { getUserAndProfile } from "@/lib/supabase/server";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { siteUrl } from "@/lib/env";

export const runtime = "nodejs";

// Espace Stripe où l'abonné change sa carte, télécharge ses factures ou résilie.
export async function POST() {
  const { user, profile } = await getUserAndProfile();
  if (!user || !profile) return NextResponse.json({ error: "Connecte-toi d'abord." }, { status: 401 });
  if (!stripeConfigured() || !profile.stripe_customer_id)
    return NextResponse.json({ error: "Aucun abonnement à gérer." }, { status: 400 });
  try {
    const session = await stripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${siteUrl()}/app`,
      locale: "fr",
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("portal", e);
    return NextResponse.json({ error: "Impossible d'ouvrir la gestion de l'abonnement." }, { status: 500 });
  }
}
