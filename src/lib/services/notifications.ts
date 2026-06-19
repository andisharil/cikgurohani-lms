import type { DB } from "./activity";
import { sendEmail } from "@/lib/messaging/email";
import { sendWhatsAppText, sendWhatsAppTemplate } from "@/lib/messaging/whatsapp";

type BaseTarget = {
  parentId: string;
  studentId?: string | null;
  type: string; // notification type key, e.g. 'renewal', 'refund', 'reminder_7d'
  message: string;
};

/**
 * Create an in-portal notification (immediate; status Berjaya). Returns the row id.
 */
export async function notifyPortal(db: DB, t: BaseTarget): Promise<string | null> {
  const { data, error } = await db
    .from("notifications")
    .insert({
      parent_id: t.parentId,
      student_id: t.studentId ?? null,
      channel: "Portal",
      type: t.type,
      message: t.message,
      status: "Berjaya",
    })
    .select("id")
    .single();
  if (error) {
    console.error("notifyPortal failed:", error.message);
    return null;
  }
  return data.id;
}

/** Send an email and record the notification with success/failure + provider data. */
export async function notifyEmail(
  db: DB,
  t: BaseTarget & { to: string; subject: string; html: string },
): Promise<void> {
  const res = await sendEmail({ to: t.to, subject: t.subject, html: t.html });
  await db.from("notifications").insert({
    parent_id: t.parentId,
    student_id: t.studentId ?? null,
    channel: "Email",
    type: t.type,
    message: t.message,
    status: res.ok ? "Berjaya" : "Gagal",
    provider_response: res.providerResponse as never,
  });
}

/** Send a WhatsApp message (text or template) and record the notification. */
export async function notifyWhatsApp(
  db: DB,
  t: BaseTarget & { to: string; template?: { name: string; params?: string[] } },
): Promise<void> {
  const res = t.template
    ? await sendWhatsAppTemplate(t.to, t.template.name, t.template.params ?? [])
    : await sendWhatsAppText(t.to, t.message);
  await db.from("notifications").insert({
    parent_id: t.parentId,
    student_id: t.studentId ?? null,
    channel: "WhatsApp",
    type: t.type,
    message: t.message,
    status: res.ok ? "Berjaya" : "Gagal",
    provider_response: res.providerResponse as never,
  });
}

/**
 * Retry a failed notification by re-dispatching on its channel and updating the
 * row's status + provider_response (PRD §12 retry). Returns success.
 */
export async function retryNotification(db: DB, notificationId: string): Promise<boolean> {
  const { data: n } = await db
    .from("notifications")
    .select("*")
    .eq("id", notificationId)
    .single();
  if (!n) return false;

  let ok = false;
  let providerResponse: Record<string, unknown> = {};
  const { data: parent } = n.parent_id
    ? await db.from("parents").select("emel, telefon").eq("id", n.parent_id).maybeSingle()
    : { data: null };

  if (n.channel === "Portal") {
    ok = true;
  } else if (n.channel === "Email" && parent?.emel) {
    const r = await sendEmail({ to: parent.emel, subject: "cikgurohani", html: n.message ?? "" });
    ok = r.ok;
    providerResponse = r.providerResponse;
  } else if (n.channel === "WhatsApp" && parent?.telefon) {
    const r = await sendWhatsAppText(parent.telefon, n.message ?? "");
    ok = r.ok;
    providerResponse = r.providerResponse;
  }

  await db
    .from("notifications")
    .update({ status: ok ? "Berjaya" : "Gagal", provider_response: providerResponse as never })
    .eq("id", notificationId);
  return ok;
}
