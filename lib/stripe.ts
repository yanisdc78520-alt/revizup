import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";

let client: Stripe | null = null;
export function stripe(): Stripe {
  if (!client) client = new Stripe(env("STRIPE_SECRET_KEY"));
  return client;
}

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}
