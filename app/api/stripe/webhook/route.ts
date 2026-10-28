import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIVE = new Set(["active", "trialing", "past_due"]);

// Stripe prévient ici quand un abonnement commence, change ou s'arrête.
export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, signature ?? "", env("STRIPE_WEBHOOK_SECRET"));
  } catch (e) {
    console.error("webhook signature", e);
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  const admin = supabaseAdmin();

  async function applySubscription(sub: Stripe.Subscription) {
    const customer = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const plan = ACTIVE.has(sub.status) ? "pro" : "free";
    const userId = sub.metadata?.userId;
    const update = { plan, stripe_subscription_id: sub.id, stripe_customer_id: customer };
    const q = userId
      ? admin.from("profiles").update(update).eq("id", userId)
      : admin.from("profiles").update(update).eq("stripe_customer_id", customer);
    const { error } = await q;
    if (error) throw error;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
          const sub = await stripe().subscriptions.retrieve(subId);
          if (!sub.metadata?.userId && session.client_reference_id) sub.metadata = { ...sub.metadata, userId: session.client_reference_id };
          await applySubscription(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await applySubscription(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }
  } catch (e) {
    console.error("webhook", event.type, e);
    return NextResponse.json({ error: "Traitement impossible." }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
