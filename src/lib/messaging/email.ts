/**
 * Email via Resend. Until RESEND_API_KEY is set, sends are SIMULATED (logged).
 */
export type EmailResult = {
  ok: boolean;
  simulated: boolean;
  providerResponse: Record<string, unknown>;
  error?: string;
};

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "cikgurohani <no-reply@cikgurohani.com>";
  if (!key) {
    console.info(`[email simulated] -> ${opts.to}: ${opts.subject}`);
    return { ok: true, simulated: true, providerResponse: { simulated: true, ...opts } };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html }),
    });
    const json = (await res.json()) as Record<string, unknown>;
    if (!res.ok) return { ok: false, simulated: false, providerResponse: json, error: `HTTP ${res.status}` };
    return { ok: true, simulated: false, providerResponse: json };
  } catch (e) {
    return { ok: false, simulated: false, providerResponse: {}, error: (e as Error).message };
  }
}
