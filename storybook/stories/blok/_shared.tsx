import {
  Bot,
  FileText,
  Inbox,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Orbit,
  Settings,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import type { PlanStep } from "@/components/ui/agent-plan";
import type { ShellNavGroup } from "@/components/ui/app-shell";
import { CommandPalette, type Command } from "@/components/ui/command-palette";

/**
 * Blok ve ekran hikâyelerinin ortak verisi: tek bir hayalî ürün ("Pusula",
 * destek ekibinin yapay zekâ çalışma alanı). Bütün ekranlar aynı kabuğu,
 * aynı kullanıcıyı ve aynı planı paylaşır ki katalog tek ürün gibi okunsun.
 */

export const ROUTES = {
  pano: "/pano",
  gelen: "/gelen-kutusu",
  asistan: "/asistan",
  ekip: "/ekip-sohbeti",
  raporlar: "/raporlar",
  ajanlar: "/ajanlar",
  ayarlar: "/ayarlar",
} as const;

export const BRAND = {
  name: "Pusula",
  href: ROUTES.pano,
  logo: (
    <span className="inline-grid size-7 place-items-center rounded-sm bg-brand text-on-brand">
      <Orbit className="!size-4" strokeWidth={2} />
    </span>
  ),
};

export const NAV: readonly ShellNavGroup[] = [
  {
    items: [
      { href: ROUTES.pano, label: "Pano", icon: <LayoutDashboard /> },
      { href: ROUTES.gelen, label: "Gelen Kutusu", icon: <Inbox />, badge: 12 },
      { href: ROUTES.asistan, label: "Asistan", icon: <MessageSquare /> },
    ],
  },
  {
    label: "Çalışma Alanı",
    items: [
      { href: ROUTES.ekip, label: "Ajan Ekibi", icon: <Users />, badge: 3 },
      { href: ROUTES.raporlar, label: "Raporlar", icon: <FileText /> },
      { href: ROUTES.ajanlar, label: "Ajanlar", icon: <Bot /> },
      { href: ROUTES.ayarlar, label: "Ayarlar", icon: <Settings /> },
    ],
  },
];

export const USER = { name: "Elif Yıldırım", detail: "Destek Ekibi" };

export function SignOutButton() {
  return (
    <button
      type="button"
      aria-label="Çıkış Yap"
      title="Çıkış Yap"
      className="inline-grid size-10 place-items-center rounded-md text-muted transition-colors hover:bg-surface-raised hover:text-strong [&_svg]:size-4"
    >
      <LogOut aria-hidden strokeWidth={1.75} />
    </button>
  );
}

/** Kabuğun arama düğmesi ⌘K paletini açar: palet sayfada olmalı. */
export function ShellCommands() {
  const commands: Command[] = NAV.flatMap((group) =>
    group.items.map((item) => ({
      id: item.href,
      label: item.label,
      group: "Gezinme",
      onSelect: () => undefined,
    })),
  );
  return <CommandPalette commands={commands} />;
}

export const PLAN: readonly PlanStep[] = [
  { id: "oku", title: "Destek Kayıtlarını Oku" },
  { id: "ayikla", title: "Yinelenen Talepleri Ayıkla" },
  { id: "grupla", title: "Talepleri Konuya Göre Grupla" },
  { id: "sec", title: "En Sık Üç Sorunu Seç", detail: "1.284 talep içinde 41 konu kümesi karşılaştırılıyor" },
  { id: "ornek", title: "Her Sorun için Örnek Talep Bul" },
  { id: "yaz", title: "Özet Raporu Yaz" },
  { id: "paylas", title: "Ekip için Paylaşım Taslağı Hazırla" },
];
export const PLAN_LABELS = PLAN.map((step) => String(step.title));

export const MODELS = ["Fable 5", "Fable 5 Mini", "Atlas 2"] as const;

export const SUGGESTIONS = [
  "Bu haftanın satış özetini çıkar",
  "Açık talepleri önceliğe göre sırala",
  "Toplantı notlarından görev listesi yap",
] as const;

/** İçerik karosunun üst satırı: başlık solda, eylemler sağda. */
export function ContentBar({ title, meta, children }: { title: ReactNode; meta?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex h-14 shrink-0 items-center gap-3 border-b border-line-soft px-4 sm:px-5">
      <h1 className="min-w-0 truncate text-base font-semibold text-strong">{title}</h1>
      {meta ? <span className="hidden shrink-0 text-small text-muted sm:inline">{meta}</span> : null}
      <div className="ml-auto flex shrink-0 items-center gap-1">{children}</div>
    </div>
  );
}

/** Bir parça yanıtı kelime kelime akıtır; her adımda `onChunk` tam metni alır. */
export function streamText(text: string, onChunk: (partial: string) => void, onDone: () => void, speed = 45) {
  const words = text.split(" ");
  let index = 0;
  const id = window.setInterval(() => {
    index += 1;
    onChunk(words.slice(0, index).join(" "));
    if (index >= words.length) {
      window.clearInterval(id);
      onDone();
    }
  }, speed);
  return () => window.clearInterval(id);
}
