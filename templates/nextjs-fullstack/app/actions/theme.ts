"use server";

import { cookies } from "next/headers";
import { THEME_COOKIE, THEME_COOKIE_MAX_AGE, isTheme } from "@/lib/theme";

/**
 * Tema tercihini çereze yazar. DOM'u istemci zaten değiştirdi; bu yalnızca
 * bir sonraki sunucu çiziminin aynı temayla gelmesi için.
 *
 * Girdi istemciden geldiği için doğrulanır: TypeScript imzası çalışma
 * zamanında yoktur.
 */
export async function setThemeAction(theme: unknown): Promise<void> {
  if (!isTheme(theme)) return;
  (await cookies()).set(THEME_COOKIE, theme, {
    path: "/",
    maxAge: THEME_COOKIE_MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
