"use client";

import { ArrowLeft, Bot, ChevronDown, Filter, Inbox, ListChecks, Mail, MessageSquare, Phone, Search, Sparkles, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { DigitRoll } from "@/components/ui/digit-roll";
import { StatusIcon } from "@/components/ui/status-icon";
import { cn } from "@/lib/utils";
import { useSceneLoop } from "../_lib/sahneler";
import { OPEN_TICKETS, customer } from "./_data";

/**
 * Tanıtım kahramanının vitrini: Pusula gelen kutusu, kendi kendine oynayan
 * "ekran kaydı" (Sakin Akış → akış karesi). Adımlar: sıradaki talep seçilir,
 * asistan yanıt taslağını yazar, gönderilince satır "Yanıtlandı" olur ve
 * sayaç düşer. Görünüm dışında ve hareket azaltmada son karede durur.
 * Ekran görüntüsü değil: katalog bileşenleri ve Pusula verisi (`_data.ts`).
 * İçerik `aria-hidden`; kartın başlığı ne gösterdiğini söyler.
 */

const CHANNEL = { E: Mail, T: Phone, S: MessageSquare } as const;
const ROWS = OPEN_TICKETS.slice(0, 6).map((t, i) => ({
  id: t.id,
  subject: t.subject,
  who: customer(t.customerId).contact,
  company: customer(t.customerId).name,
  channel: (["E", "T", "S", "E", "S", "E"] as const)[i],
  sla: ["12 dk", "28 dk", "1 sa", "2 sa", "3 sa", "5 sa"][i],
}));
const DRAFT = "Merhaba, siparişiniz bugün öğleden sonra kargoya verildi; takip numarasını ekte bulabilirsiniz. İyi günler dileriz.";

export function InboxScene() {
  // 0: ilk satır seçili · 1-3: taslak yazılır · 4: gönderildi · 5: sıradaki seçilir · 6: bekleme.
  const { ref, step } = useSceneLoop(7, 1100, 4);
  const sent = step >= 4;
  const active = step >= 5 ? 1 : 0;
  const words = DRAFT.split(" ");
  const shown = step === 0 ? 0 : step >= 3 ? words.length : Math.round((words.length * step) / 3);
  const row = ROWS[active];
  return (
    <div ref={ref} aria-hidden className="grid h-[600px] w-[1040px] grid-cols-[180px_340px_minmax(0,1fr)] overflow-hidden rounded-[14px] bg-page text-[13px] leading-5 text-body ring-1 ring-line">
      {/* Kenar çubuğu */}
      <aside className="flex flex-col gap-0.5 bg-surface p-2">
        <div className="flex items-center gap-1.5 px-1.5 py-1 text-strong">
          <span className="grid size-5 place-items-center rounded-md bg-strong text-[10px] font-medium text-page">P</span>
          Pusula <ChevronDown className="size-3 text-soft" />
        </div>
        {[
          [Inbox, "Gelen Kutusu", sent ? 7 : 8],
          [ListChecks, "Görevler", 8],
          [Users, "Müşteriler"],
          [Bot, "Asistan"],
        ].map(([Icon, label, n], i) => {
          const I = Icon as typeof Inbox;
          return (
            <span key={label as string} className={cn("flex items-center gap-2 rounded-lg px-2 py-1.5", i === 0 ? "bg-overlay text-strong shadow-raised" : "text-muted")}>
              <I className="size-3.5" /> {label as string}
              {n !== undefined && (
                <span className="ml-auto rounded bg-primary-wash px-1 text-[11px] text-primary-ink tabular-nums">
                  <DigitRoll value={n as number} />
                </span>
              )}
            </span>
          );
        })}
        <div className="mt-auto grid gap-1 rounded-lg bg-overlay p-2 ring-1 ring-line-soft">
          <span className="text-[12px] text-muted">Bu Hafta</span>
          <span className="text-[18px] leading-6 text-strong tabular-nums">
            <DigitRoll value={sent ? 43 : 42} /> <span className="text-[12px] text-soft">yanıt</span>
          </span>
        </div>
      </aside>

      {/* Liste */}
      <section className="flex min-w-0 flex-col border-x border-line-soft">
        <div className="flex items-center gap-2 border-b border-line-soft px-3 py-2.5">
          <span className="text-[14px] font-medium text-strong">Gelen Kutusu</span>
          <span className="ml-auto flex items-center gap-1 rounded-md px-1.5 text-muted ring-1 ring-line">
            <Filter className="size-3" /> Öncelik
          </span>
          <Search className="size-3.5 text-muted" />
        </div>
        <ul className="grid">
          {ROWS.map((r, i) => {
            const Icon = CHANNEL[r.channel];
            const done = i === 0 && sent;
            return (
              <li key={r.id} className={cn("grid gap-0.5 border-b border-line-soft px-3 py-2.5 transition-colors duration-300", i === active ? "bg-primary-wash" : "")}>
                <span className="flex items-center gap-2">
                  <StatusIcon status={done ? "done" : i < 2 ? "progress" : "todo"} size={14} />
                  <span className="min-w-0 flex-1 truncate font-medium text-strong">{r.company}</span>
                  <span className={cn("text-[11px] tabular-nums", done ? "text-success" : i === 0 ? "text-danger" : "text-soft")}>{done ? "Yanıtlandı" : r.sla}</span>
                </span>
                <span className="flex items-center gap-2 pl-[22px] text-[12px] text-muted">
                  <Icon className="size-3 shrink-0" />
                  <span className="truncate">{r.subject}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Konuşma */}
      <section className="flex min-w-0 flex-col">
        <div className="flex items-center gap-2 border-b border-line-soft px-4 py-2.5 text-muted">
          <ArrowLeft className="size-3.5" />
          <span className="truncate text-strong">{row.subject}</span>
          <span className="ml-auto font-mono text-[11px] text-soft">{row.id}</span>
        </div>
        <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
          <div className="flex items-start gap-2.5">
            <Avatar name={row.who} size="sm" className="size-7 text-[10px]" />
            <div className="grid gap-1 rounded-xl bg-surface px-3 py-2">
              <span className="text-[12px] text-muted">
                {row.who} · {row.company}
              </span>
              <span className="text-strong">Siparişim ne zaman kargoya verilecek? Hafta sonu etkinliğimiz var.</span>
            </div>
          </div>
          <span className="mx-auto rounded-full bg-surface px-2.5 py-0.5 text-[11px] text-muted">Selin Başaran talebi üstlendi · 09.12</span>
          {/* Asistan taslağı: kelime kelime yazılır, göndermeden önce insan okur. */}
          <div className="mt-auto grid gap-2 rounded-xl bg-overlay p-3 ring-1 ring-line">
            <span className="flex items-center gap-1.5 text-[12px] text-primary-ink">
              <Sparkles className="size-3.5" /> Hazırlayan: Asistan
              <span className="ml-auto text-soft">{sent ? "Gönderildi" : step >= 3 ? "Taslak Hazır" : "Yazıyor"}</span>
            </span>
            <p className="min-h-[60px] text-strong">
              {words.slice(0, shown).join(" ")}
              {!sent && step > 0 && step < 3 && <span className="ml-0.5 inline-block h-4 w-px translate-y-0.5 animate-pulse bg-strong motion-reduce:animate-none" />}
            </p>
            <div className="flex items-center gap-2">
              <span className="rounded-full px-3 py-1 text-muted ring-1 ring-line">Düzenle</span>
              <span className={cn("ml-auto rounded-full px-3.5 py-1 transition-colors duration-300", sent ? "bg-success-wash text-success" : "bg-strong text-page")}>
                {sent ? "Gönderildi" : "Gönder"}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
