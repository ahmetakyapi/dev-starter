/// <reference types="vite/client" />
import { GROUP_OF, type GroupId } from "./_data";

/**
 * Kapsam ELLE YAZILMAZ (showcase/Kapsam.stories.tsx ile aynı yöntem):
 *   1. `snippets/ui/*.tsx`: kataloğun bütün bileşen dosyaları (vitrin/ hariç).
 *   2. Bu klasörün kaynak dosyaları (ham metin): içlerindeki
 *      `@/components/ui/<ad>` içe aktarımları.
 * Bir snippet eklenip bu sayfada kullanılmazsa rozet 73/74'e düşer ve dizinde kırmızı görünür.
 */
export const SNIPPETS = Object.keys(import.meta.glob("../../../snippets/ui/*.tsx"))
  .map((path) => path.split("/").pop()!.replace(/\.tsx$/, ""))
  .sort((a, b) => a.localeCompare(b, "tr-TR"));

const SOURCES = import.meta.glob("./*.tsx", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

const IMPORTED = new Set<string>();
for (const text of Object.values(SOURCES)) {
  for (const match of text.matchAll(/from\s+["']@\/components\/ui\/([\w-]+)["']/g)) {
    if (SNIPPETS.includes(match[1])) IMPORTED.add(match[1]); // şablonun kendi Button'ı kapsam dışı
  }
}

export const USED = SNIPPETS.filter((name) => IMPORTED.has(name));
export const COVERED = USED.length;
export const TOTAL = SNIPPETS.length;

/** Paket kitindeki bileşen sayısı: elle yazılmaz, `packages/@ahmet/ui/src/kit/`ten sayılır. */
export const KIT_COUNT = Object.keys(import.meta.glob("../../../packages/@ahmet/ui/src/kit/*.tsx")).length;

/** Sınıflandırılmamış dosya (yeni snippet, grubu yok): dizinde "Grupsuz" altında görünür. */
export const UNGROUPED = SNIPPETS.filter((name) => !GROUP_OF[name]);
export const inGroup = (group: GroupId) => SNIPPETS.filter((name) => GROUP_OF[name] === group);

/** Dizindeki bağlantı: çoğu bileşenin kendi kuyusu var; bloğun içinde yaşayanlar bloğa gider. */
const ANCHOR_OVERRIDE: Record<string, string> = {
  "chat-thread": "b-app-shell",
  "chat-composer": "b-app-shell",
  "agent-plan": "b-app-shell",
};
export const anchorOf = (name: string) => `#${ANCHOR_OVERRIDE[name] ?? `b-${name}`}`;

/** Katalogdaki hikâye sayısı: bütün hikâye dosyalarındaki `export const X: Story` bildirimleri. */
const STORY_SOURCES = import.meta.glob("../**/*.stories.tsx", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
export const STORY_COUNT = Object.values(STORY_SOURCES).reduce((n, text) => n + (text.match(/^export const \w+\s*:\s*Story\b/gm)?.length ?? 0), 0);
export const STORY_FILES = Object.keys(STORY_SOURCES).length;
