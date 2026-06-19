import crypto from "node:crypto";

/**
 * BayarCash integration boundary (PRD §16.4).
 *
 * This is the structural skeleton: signature verification + checkout creation.
 * Wire the real API once BAYARCASH_* credentials exist. Until then,
 * createCheckout returns a simulated URL and verifyCallback trusts dev payloads.
 *
 * Real integration TODO:
 *  - createCheckout: POST to BayarCash create-intent, return their payment URL.
 *  - verifyCallback: validate the checksum/signature per BayarCash docs.
 */

export function isConfigured(): boolean {
  return Boolean(process.env.BAYARCASH_API_TOKEN && process.env.BAYARCASH_SECRET_KEY);
}

export type CheckoutInput = {
  reference: string; // our renewal code
  amount: number;
  payerName: string;
  payerEmail: string;
  returnUrl: string;
};

export async function createCheckout(input: CheckoutInput): Promise<{ url: string; simulated: boolean }> {
  if (!isConfigured()) {
    // Dev: route straight to our own success callback so the flow is testable.
    const url = `${input.returnUrl}?status=success&ref=${encodeURIComponent(input.reference)}&simulated=1`;
    return { url, simulated: true };
  }
  // TODO: real BayarCash create-intent call here.
  throw new Error("BayarCash live integration not yet implemented.");
}

/** Verify a webhook payload's signature. Dev: accept; prod: HMAC check. */
export function verifyCallback(rawBody: string, signature: string | null): boolean {
  const secret = process.env.BAYARCASH_SECRET_KEY;
  if (!secret) return process.env.NODE_ENV !== "production"; // dev: accept
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
