/**
 * WhatsApp Cloud API wrapper. Until WHATSAPP_* env vars are set, sends are
 * SIMULATED (logged + recorded as success) so flows work end-to-end in dev.
 * Swap the simulated branch for real Graph API calls once credentials exist.
 */

export type WaSendResult = {
  ok: boolean;
  simulated: boolean;
  providerResponse: Record<string, unknown>;
  error?: string;
};

function isConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

async function callGraph(payload: Record<string, unknown>): Promise<WaSendResult> {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const token = process.env.WHATSAPP_ACCESS_TOKEN!;
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
    });
    const json = (await res.json()) as Record<string, unknown>;
    if (!res.ok) return { ok: false, simulated: false, providerResponse: json, error: `HTTP ${res.status}` };
    return { ok: true, simulated: false, providerResponse: json };
  } catch (e) {
    return { ok: false, simulated: false, providerResponse: {}, error: (e as Error).message };
  }
}

/** Send a free-form text message (only valid inside the 24h service window). */
export async function sendWhatsAppText(to: string, body: string): Promise<WaSendResult> {
  if (!isConfigured()) {
    console.info(`[WA simulated] text -> ${to}: ${body}`);
    return { ok: true, simulated: true, providerResponse: { simulated: true, to, body } };
  }
  return callGraph({ to, type: "text", text: { body } });
}

/** Send an approved template message with positional body params ({{1}},{{2}}...). */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  params: string[] = [],
  language = "ms",
): Promise<WaSendResult> {
  if (!isConfigured()) {
    console.info(`[WA simulated] template '${templateName}' -> ${to} params=${JSON.stringify(params)}`);
    return { ok: true, simulated: true, providerResponse: { simulated: true, to, templateName, params } };
  }
  return callGraph({
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: language },
      components: params.length
        ? [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }]
        : [],
    },
  });
}

/** Send an OTP via the configured authentication template (falls back to text). */
export async function sendWhatsAppOtp(to: string, code: string): Promise<WaSendResult> {
  const template = process.env.WHATSAPP_OTP_TEMPLATE_NAME;
  if (isConfigured() && template) {
    return sendWhatsAppTemplate(to, template, [code]);
  }
  return sendWhatsAppText(to, `Kod log masuk cikgurohani anda: ${code}. Sah selama 5 minit.`);
}
