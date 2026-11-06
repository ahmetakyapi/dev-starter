import { DocsContainer, type DocsContainerProps } from "@storybook/addon-docs/blocks";
import { useEffect, useState, type PropsWithChildren } from "react";
import { GLOBALS_UPDATED } from "storybook/internal/core-events";
import { THEMES } from "./manager-theme";

/* Belge sayfası da araç çubuğundaki temayı izler. Storybook'un varsayılanı
   belgeyi her zaman açık çizer ("The default theme for Docs is always the
   light theme"); koyu temada tuval koyu, belge beyaz kalıyordu.
   İlk değer `store.userGlobals` iç API'sinden (SB 10.6.3'te var, tipsiz);
   kırılırsa belge açık başlar ve ilk değişimde düzelir (zararsız düşüş). */

type Mode = "light" | "dark";
const modeOf = (theme: unknown): Mode => (theme === "dark" || theme === "Koyu" ? "dark" : "light");

function initialMode(context: unknown): Mode {
  const store = (context as { store?: { userGlobals?: { get?: () => Record<string, unknown> } } }).store;
  return modeOf(store?.userGlobals?.get?.().theme);
}

export function ThemedDocsContainer(props: PropsWithChildren<DocsContainerProps>) {
  const { context } = props;
  const [mode, setMode] = useState<Mode>(() => initialMode(context));
  useEffect(() => {
    const onGlobals = ({ globals }: { globals: Record<string, unknown> }) => setMode(modeOf(globals.theme));
    context.channel.on(GLOBALS_UPDATED, onGlobals);
    return () => context.channel.off(GLOBALS_UPDATED, onGlobals);
  }, [context.channel]);
  return <DocsContainer {...props} theme={THEMES[mode]} />;
}
