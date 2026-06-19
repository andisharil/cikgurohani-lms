"use server";

import { cookies } from "next/headers";
import type { Lang } from "./i18n";

/** Persist the portal language preference (read by getLang on next render). */
export async function setLang(formData: FormData): Promise<void> {
  const lang = formData.get("lang") === "en" ? "en" : "ms";
  const store = await cookies();
  store.set("lang", lang as Lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
