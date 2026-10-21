import { cookies } from "next/headers";
import { DEFAULT_THEME, THEME_COOKIE, isTheme, type Theme } from "@/lib/theme";

/**
 * Yalnızca sunucuda: bileşen, layout ya da `generateViewport` içinden.
 * `lib/theme.ts` istemciden de okunduğu için `next/headers` orada duramaz.
 */
export async function getTheme(): Promise<Theme> {
  const value = (await cookies()).get(THEME_COOKIE)?.value;
  return isTheme(value) ? value : DEFAULT_THEME;
}
