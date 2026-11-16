"use client";

import type { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

/**
 * Kanal tablosu: satırlar olay ("Acil talep", "Bahsedilme"), sütunlar
 * teslimat kanalı ("Uygulama İçi", "E-Posta", "SMS"); her kesişim bir onay
 * kutusu. Bildirim tercihleri, abonelik ve izin matrisleri için.
 *
 * NE ZAMAN: aynı olay listesi birden çok kanala ya da role dağılıyorsa ve
 * kullanıcı bütün tabloyu bir bakışta görmeliyse. NE ZAMAN DEĞİL: tek kanal
 * varsa `switch.tsx` satırları (her satır bir aç/kapa); iki-üç olayda
 * kanal başına ayrı grup daha sade.
 *
 * Sütun başlığındaki kutu o sütunun TAMAMINI açar/kapar ve üç durumlu
 * (hepsi / bir kısmı / hiçbiri; `indeterminate`). Kilitli satır (`locked`)
 * değiştirilemez: zorunlu güvenlik bildirimi gibi; nedeni `hint`te yazılır.
 * Yöntem Axon/Auton referans turundan (2026-11; davranış, kod değil).
 *
 * Erişilebilirlik: gerçek `<table>` (`caption`, `th scope`); her kutunun
 * adı "Olay, Kanal" ("Acil Talep, E-Posta") — ekran okuyucu tablo
 * gezintisinde başlığı da okur, ama kutu tek başına odaklanınca da anlamlı.
 * Dar ekranda tablo yatay kayar, olay sütunu yapışkan (opak `surface-solid`:
 * yarı saydam `surface` yapışkan hücrede iki kat binip koyulaşıyordu).
 *
 * Örnek:
 *   <ChannelMatrix caption="Bildirim Tercihleri" channels={[{ id: "app", label: "Uygulama İçi" }]}
 *     rows={[{ id: "acil", label: "Acil Talep", hint: "Öncelik Acil" }]}
 *     value={{ acil: ["app"] }} onValueChange={setValue} />
 */

export type MatrixChannel = { id: string; label: string };
export type MatrixRow = { id: string; label: string; hint?: ReactNode; locked?: boolean };
export type MatrixValue = Readonly<Record<string, readonly string[]>>;

type ChannelMatrixProps = {
  caption: string;
  /** Başlığı görsel olarak gizle (çevreleyen başlık zaten adlandırıyorsa). */
  hideCaption?: boolean;
  channels: readonly MatrixChannel[];
  rows: readonly MatrixRow[];
  value: MatrixValue;
  onValueChange: (value: MatrixValue) => void;
  /** Olay sütununun başlığı. */
  rowHeader?: string;
  className?: string;
};

export function ChannelMatrix({ caption, hideCaption = true, channels, rows, value, onValueChange, rowHeader = "Olay", className }: ChannelMatrixProps) {
  const has = (row: string, ch: string) => (value[row] ?? []).includes(ch);
  const toggle = (row: string, ch: string) => {
    const list = value[row] ?? [];
    onValueChange({ ...value, [row]: list.includes(ch) ? list.filter((c) => c !== ch) : [...list, ch] });
  };
  const editable = rows.filter((r) => !r.locked);
  const setColumn = (ch: string, on: boolean) => {
    const next: Record<string, readonly string[]> = { ...value };
    for (const r of editable) {
      const list = next[r.id] ?? [];
      next[r.id] = on ? (list.includes(ch) ? list : [...list, ch]) : list.filter((c) => c !== ch);
    }
    onValueChange(next);
  };

  return (
    <div className={cn("overflow-x-auto rounded-xl ring-1 ring-line", className)}>
      <table className="w-full min-w-[30rem] border-collapse text-base">
        <caption className={cn(hideCaption ? "sr-only" : "px-4 pt-3 text-start text-small font-medium text-muted")}>{caption}</caption>
        <thead>
          <tr className="bg-surface-solid">
            <th scope="col" className="sticky left-0 z-10 bg-surface-solid px-4 py-2.5 text-start text-small font-medium text-muted">
              {rowHeader}
            </th>
            {channels.map((ch) => {
              const on = editable.filter((r) => has(r.id, ch.id)).length;
              const all = editable.length > 0 && on === editable.length;
              return (
                <th key={ch.id} scope="col" className="w-28 px-3 py-2.5 text-small font-medium whitespace-nowrap text-muted">
                  <span className="flex flex-col items-center gap-1.5">
                    {ch.label}
                    <Checkbox
                      aria-label={`${ch.label}: bütün olaylar`}
                      checked={all}
                      ref={(el) => {
                        if (el) el.indeterminate = on > 0 && !all;
                      }}
                      onChange={() => setColumn(ch.id, !all)}
                    />
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-line-soft">
          {rows.map((row) => (
            <tr key={row.id} className="group/row transition-colors hover:bg-surface-solid">
              <th scope="row" className="sticky left-0 z-10 bg-overlay px-4 py-2.5 text-start font-normal transition-colors group-hover/row:bg-surface-solid">
                <span className="block font-medium text-strong">{row.label}</span>
                {row.hint ? <span className="block text-small text-muted">{row.hint}</span> : null}
              </th>
              {channels.map((ch) => (
                <td key={ch.id} className="px-3 py-2.5 text-center">
                  <span className="inline-grid place-items-center">
                    <Checkbox
                      aria-label={`${row.label}, ${ch.label}`}
                      checked={has(row.id, ch.id)}
                      disabled={row.locked}
                      onChange={() => toggle(row.id, ch.id)}
                    />
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
