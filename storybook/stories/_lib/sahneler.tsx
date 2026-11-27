"use client";

import {
  ArrowLeft,
  BookOpen,
  Bot,
  Calendar,
  ChartColumn,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Filter,
  Hash,
  Home,
  Inbox,
  Link2,
  ListTodo,
  Megaphone,
  MessageSquarePlus,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  SlidersHorizontal,
  Users,
  Workflow,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { AreaChart } from "@/components/ui/area-chart";
import { Avatar } from "@/components/ui/avatar";
import { DigitRoll } from "@/components/ui/digit-roll";
import { Sparkline } from "@/components/ui/sparkline";
import { StatusIcon } from "@/components/ui/status-icon";
import { cn } from "@/lib/utils";

/**
 * Akış sahneleri: çalışma kartlarının (`shot-card fit`) içindeki ürün ekranları.
 * Ekran görüntüsü ya da video YOK: hepsi token'la ve katalog bileşenleriyle
 * çizilir, palet ve temayla döner. Sakin Akış ritmi: gri kuyu + beyaz karo,
 * 12-14 px tek boy metin (yalnız sayılar büyür), kayıt kimliği 2 px renkli
 * çizgi, durum ikon şekliyle, eylem koyu hap.
 *
 * Her sahne bir "ekran kaydı" gibi oynar: görünümdeyken adım adım ilerler
 * (`useSceneLoop`), görünümden çıkınca durur, sona gelince başa sarar.
 * Hareketi azaltan ziyaretçide döngü yok; sahne anlamlı son karesinde durur.
 * Sahneler süs değil ama tanıtım: içerikleri `aria-hidden`, kartın başlığı
 * ve açıklaması ne gösterdiğini söyler.
 */

const subscribe = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const AUTOMATED = typeof navigator !== "undefined" && navigator.webdriver === true;

/** Görünümdeyken `count` adım arasında `ms` aralıkla döner; azaltmada ve otomasyonda `still` adımda durur. */
export function useSceneLoop(count: number, ms: number, still = count - 1) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useSyncExternalStore(subscribe, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => false);
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const frozen = reduced || AUTOMATED;
  useEffect(() => {
    const el = ref.current;
    if (!el || frozen) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [frozen]);
  useEffect(() => {
    if (frozen || !visible) return;
    const t = window.setInterval(() => setStep((s) => (s + 1) % count), ms);
    return () => window.clearInterval(t);
  }, [frozen, visible, count, ms]);
  return { ref, step: frozen ? still : step, frozen };
}

/* ── Küçük parçalar ───────────────────────────────────────────────────── */

type Status = "todo" | "progress" | "done" | "blocked";

/** Durum halkası: katalogdaki `status-icon` (şekil durumu söyler, renk ikinci işaret). */
function Ring({ status, className }: { status: Status; className?: string }) {
  return <StatusIcon status={status} size={14} className={className} />;
}

/** "12 / 12" sayacı: ilk sayı koyu, bölü ve toplam soluk. */
function Count({ value, total }: { value: number; total: number }) {
  return (
    <span className="rounded-md bg-surface px-1.5 py-0.5 text-[12px] tabular-nums">
      <span className="text-strong">
        <DigitRoll value={value} />
      </span>
      <span className="text-soft"> / {total}</span>
    </span>
  );
}

function Bars() {
  return (
    <span aria-hidden className="flex h-2.5 items-end gap-px">
      <span className="h-1 w-0.5 rounded-full bg-muted" />
      <span className="h-1.5 w-0.5 rounded-full bg-muted" />
      <span className="h-2.5 w-0.5 rounded-full bg-line-strong" />
    </span>
  );
}

const SCENE_CSS = `
.scene-tick { stroke-dasharray: 10; stroke-dashoffset: 0; animation: scene-draw 360ms var(--ease-brand) both; }
@keyframes scene-draw { from { stroke-dashoffset: 10; } }
.scene-in { animation: scene-in 480ms var(--ease-brand) both; }
@keyframes scene-in { from { opacity: 0; translate: 0 6px; filter: blur(2px); } }
.scene-row { transition: background-color 300ms var(--ease-brand); }
@media (prefers-reduced-motion: reduce) { .scene-tick, .scene-in { animation: none; } .scene-row { transition: none; } }
`;

function SceneStyle() {
  return (
    <style href="kapak-sahneler" precedence="default">
      {SCENE_CSS}
    </style>
  );
}

/* ── 1. Talep süreci: kenar çubuğu + aşamalı liste + ayrıntı paneli ───── */

const NAV: [typeof Home, string, number?][] = [
  [Inbox, "Gelen Kutusu", 12],
  [ListTodo, "Talepler"],
  [BookOpen, "Bilgi Bankası"],
  [FileText, "Formlar"],
  [Bot, "Ajanlar"],
  [Workflow, "Akışlar"],
  [Workflow, "Süreçler"],
  [ChartColumn, "Raporlar"],
  [Megaphone, "Duyurular"],
  [Users, "Ekip"],
];

const TASKS = [
  { id: "PS-3981", title: "Bordro ve Vergi Kaydını Tamamla", who: "Selin Başaran" },
  { id: "PS-3982", title: "Yan Haklar ve Sigortaya Kaydet", who: "Kerem Arıkan" },
  { id: "PS-3983", title: "Masraf İadesi Profilini Aç", who: "Onur Tekin" },
  { id: "PS-3984", title: "Dizüstü Bilgisayarı Sipariş Et", who: "Ece Doğan" },
  { id: "PS-3985", title: "E-posta ve Takvim Hesabını Aç", who: "Selin Başaran" },
  { id: "PS-3986", title: "İlk Gün Kurulum Oturumunu Planla", who: "Kerem Arıkan" },
];

export function ProcessScene() {
  // 0: hiçbiri bitmedi … 6: hepsi bitti; 7-8: bekleme kareleri.
  const { ref, step } = useSceneLoop(9, 1100, 6);
  const done = Math.min(step, 6);
  return (
    <div ref={ref} aria-hidden className="grid w-[1040px] grid-cols-[184px_minmax(0,1fr)_300px] overflow-hidden rounded-[14px] bg-page text-[13px] leading-5 text-body ring-1 ring-line">
      <SceneStyle />
      {/* Kenar çubuğu */}
      <aside className="flex flex-col gap-0.5 bg-surface p-2">
        <div className="flex items-center gap-1.5 px-1.5 py-1 text-strong">
          <span className="grid size-4 place-items-center rounded bg-strong text-[9px] font-medium text-page">P</span>
          Pusula <ChevronDown className="size-3 text-soft" />
        </div>
        <div className="flex items-center gap-1 px-1 py-1 text-muted">
          <span className="flex items-center gap-1 rounded-md bg-overlay px-1.5 py-0.5 text-strong shadow-raised">
            <Home className="size-3" /> Ana Sayfa
          </span>
          <Search className="ml-auto size-3" />
        </div>
        <span className="mb-1 flex items-center gap-1.5 rounded-md bg-overlay px-2 py-1 text-strong ring-1 ring-line-soft">
          <MessageSquarePlus className="size-3" /> Yeni Sohbet
        </span>
        {NAV.map(([Icon, label, n]) => (
          <span key={label} className={cn("flex items-center gap-1.5 rounded-md px-2 py-[3px]", label === "Süreçler" ? "bg-overlay text-strong shadow-raised" : "text-muted")}>
            <Icon className="size-3" /> {label}
            {n && <span className="ml-auto rounded bg-primary-wash px-1 text-[11px] text-primary-ink">{n}</span>}
          </span>
        ))}
        <div className="mt-auto grid gap-1 rounded-lg bg-overlay p-2 ring-1 ring-line-soft">
          <span className="w-fit rounded bg-primary-wash px-1 text-[11px] text-primary-ink">Yeni</span>
          <span className="text-[12px] leading-4 text-strong">Gezinme Kolaylaştı</span>
        </div>
      </aside>

      {/* Ana alan */}
      <section className="flex min-w-0 flex-col gap-3 border-x border-line-soft px-4 py-3">
        <div className="flex items-center gap-1.5 border-b border-line-soft pb-2 text-muted">
          <ArrowLeft className="size-3" /> / <Workflow className="size-3" /> Süreçler <span className="rounded bg-surface px-1 text-[11px]">6</span> /
          <span className="truncate text-strong">İşe Alım: Ece Doğan</span>
          <span className="ml-auto flex items-center gap-1 rounded-md px-1.5 ring-1 ring-line">
            <Download className="size-3" /> Dışa Aktar
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <Avatar name="Ece Doğan" size="md" />
          <div className="grid">
            <span className="flex items-center gap-1.5 text-[14px] text-strong">
              Ece Doğan <span className="rounded bg-primary-wash px-1 text-[11px] text-primary-ink">Etkin</span>
            </span>
            <span className="text-muted">Kıdemli Yazılım Mühendisi</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
          <span className="rounded-md px-1.5 py-0.5 text-danger ring-1 ring-line">5 Gün Gecikti</span>
          <span className="rounded-md px-1.5 py-0.5 ring-1 ring-line">
            <span className="text-muted">Süreç</span> <span className="text-strong">Mühendislik İşe Alımı</span>
          </span>
          <span className="rounded-md px-1.5 py-0.5 ring-1 ring-line">
            <span className="text-muted">Bitiş</span> <span className="text-strong">23 Nis 2026</span>
          </span>
          <span className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 ring-1 ring-line">
            <span className="text-strong tabular-nums">
              <DigitRoll value={9 + done} />
            </span>
            <span className="text-soft">/ 17</span>
            <span className="h-1 w-14 overflow-hidden rounded-full bg-chart-track">
              <span className="block h-full rounded-full bg-primary transition-[width] duration-500 ease-(--ease-brand)" style={{ width: `${((9 + done) / 17) * 100}%` }} />
            </span>
          </span>
        </div>
        <dl className="grid grid-cols-3 divide-x divide-line-soft rounded-xl ring-1 ring-line">
          {[
            ["Etkin Görev", 16 - done],
            ["Tamamlanan", 10 + done],
            ["Dikkat Bekleyen", 2],
          ].map(([label, value]) => (
            <div key={label} className="grid gap-0.5 px-3 py-2">
              <dt className="text-[12px] text-muted">{label}</dt>
              <dd className="text-[18px] leading-6 text-strong tabular-nums">
                <DigitRoll value={value as number} />
              </dd>
            </div>
          ))}
        </dl>
        <div className="flex items-center gap-2 text-muted">
          <span className="flex items-center gap-1 rounded-md px-1.5 py-0.5 ring-1 ring-line">
            <Filter className="size-3" /> Filtre
          </span>
          <span className="ml-auto flex w-36 items-center gap-1 rounded-md px-1.5 py-0.5 ring-1 ring-line">
            <Search className="size-3" /> Talep Ara
          </span>
          <span className="flex items-center gap-1">
            <SlidersHorizontal className="size-3" /> Görünüm
          </span>
        </div>
        {/* Aşamalar: solda düğüm çizelgesi */}
        <ol className="relative grid gap-1.5 pl-6">
          <span aria-hidden className="absolute top-2 bottom-2 left-[7px] w-px bg-line" />
          {[
            { name: "2 Hafta Önce", v: 12, t: 12, state: "done" as const },
            { name: "1 Hafta Önce", v: 2, t: 2, state: "done" as const },
          ].map((g) => (
            <li key={g.name} className="relative flex items-center gap-2 rounded-lg px-2 py-1 ring-1 ring-line">
              <Ring status="done" className="absolute -left-[22px] size-[15px] bg-page" />
              <ChevronRight className="size-3 text-soft" /> {g.name} <Count value={g.v} total={g.t} />
              <span className="ml-auto flex items-center gap-0.5 text-soft">
                <Plus className="size-3" /> Görev Ekle
              </span>
            </li>
          ))}
          <li className="relative grid gap-1 rounded-lg p-1 ring-1 ring-line">
            <Ring status={done === 6 ? "done" : "progress"} className="absolute top-1.5 -left-[22px] size-[15px] bg-page" />
            <div className="flex items-center gap-2 px-1">
              <ChevronDown className="size-3 text-soft" /> 5 Gün Önce <Count value={done} total={6} />
              <span className="ml-auto flex items-center gap-0.5 text-soft">
                <Plus className="size-3" /> Görev Ekle
              </span>
            </div>
            <ul className="grid">
              {TASKS.map((task, i) => {
                const isDone = i < done;
                const active = i === done;
                return (
                  <li key={task.id} className={cn("scene-row flex items-center gap-2 rounded-md px-1.5 py-[3px]", active && "bg-primary-wash")}>
                    <span className={cn("grid size-3 place-items-center rounded-[3px] ring-1", isDone ? "bg-strong ring-strong" : "ring-line-strong")}>
                      {isDone && (
                        <svg viewBox="0 0 12 12" className="size-2.5 text-page">
                          <path d="M3 6.2 5 8.2 9 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="scene-tick" />
                        </svg>
                      )}
                    </span>
                    <Bars />
                    <span className="text-[12px] text-soft tabular-nums">{task.id}</span>
                    <Ring status={isDone ? "done" : active ? "progress" : "todo"} />
                    <Avatar name={task.who} size="sm" className="size-4 text-[7px]" />
                    <span className={cn("truncate", isDone ? "text-muted line-through decoration-line-strong" : "text-strong")}>{task.title}</span>
                  </li>
                );
              })}
            </ul>
          </li>
          <li className="relative flex items-center gap-2 rounded-lg px-2 py-1 ring-1 ring-line">
            <Ring status="todo" className="absolute -left-[22px] size-[15px] bg-page text-soft" />
            <ChevronRight className="size-3 text-soft" /> İzin Günü <Count value={0} total={3} />
          </li>
        </ol>
      </section>

      {/* Ayrıntı paneli */}
      <aside className="flex flex-col gap-2.5 bg-surface/50 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-strong">Yan Haklara Kayıt</span>
          <span className={cn("rounded-full px-2 py-0.5 text-[12px] transition-colors duration-300", done >= 2 ? "bg-success-wash text-success" : "bg-strong text-page")}>
            {done >= 2 ? "Bitti" : "Bitti Olarak İşaretle"}
          </span>
        </div>
        <dl className="grid grid-cols-[84px_minmax(0,1fr)] gap-y-1.5 rounded-xl bg-page p-2.5 ring-1 ring-line-soft">
          {[
            ["Durum", <span key="d" className={done >= 2 ? "text-success" : "text-danger"}>{done >= 2 ? "Tamamlandı" : "5 Gün Gecikti"}</span>],
            ["Tür", <span key="t" className="flex items-center gap-1 text-strong"><ListTodo className="size-3" /> Talep</span>],
            ["Sahip", <span key="s" className="text-strong">BT Ekibi</span>],
            ["Açılış", <span key="a" className="flex items-center gap-1 text-strong"><Calendar className="size-3" /> 11 Eki 2026</span>],
            ["Talep", <span key="k" className="flex items-center gap-1 text-strong"><Hash className="size-3" /> PS-100</span>],
            ["Bekleyen", <span key="b" className="flex items-center gap-1 text-strong"><Ring status={done >= 4 ? "done" : "todo"} /> Dizüstü Siparişi</span>],
            ["Açtığı", <span key="u" className="flex items-center gap-1 truncate text-strong">İlk Gün Kurulumu <span className="rounded bg-surface px-1 text-[11px] text-muted">Engelli</span></span>],
          ].map(([k, v]) => (
            <div key={k as string} className="contents">
              <dt className="text-muted">{k}</dt>
              <dd className="min-w-0 truncate">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="grid gap-1 rounded-xl bg-page p-2.5 ring-1 ring-line-soft">
          <span className="flex items-center gap-1 text-strong">
            <ListTodo className="size-3" /> Alt Görevler <ChevronDown className="size-3 text-soft" />
          </span>
          {["Haftalık Toplantılara Katıl", "Tanıtım Yazısını Hazırla", "Geri Bildirimleri Gözden Geçir", "Ölçüm Raporunu İncele"].map((t, i) => (
            <span key={t} className="flex items-center gap-1.5">
              <span className={cn("size-3 rounded-[3px] ring-1", i < Math.max(0, done - 2) ? "bg-strong ring-strong" : "ring-line-strong")} />
              <span className="min-w-0 flex-1 truncate">{t}</span>
              <span className="text-[11px] text-soft">{["23 Şub", "1 Mar", "5 Mar", "10 Mar"][i]}</span>
            </span>
          ))}
          <span className="flex items-center gap-1 text-soft">
            <Plus className="size-3" /> Görev Ekle
          </span>
        </div>
        {/* Son Hareketler: panelin altı boş kalmasın; satırlar sahnenin adımıyla birlikte akar. */}
        <div className="grid gap-2 rounded-xl bg-page p-2.5 ring-1 ring-line-soft">
          <span className="text-strong">Son Hareketler</span>
          {[
            { who: "Selin Başaran", text: "Bordro Kaydını Tamamladı", at: "2 dk", from: 1 },
            { who: "Kerem Arıkan", text: "Sigorta Formunu Onayladı", at: "8 dk", from: 2 },
            { who: "Ece Doğan", text: "Dizüstü Siparişini Aldı", at: "1 sa", from: 4 },
          ]
            .filter((row) => done >= row.from)
            .map((row) => (
              <span key={row.text} className="scene-in flex items-center gap-2">
                <Avatar name={row.who} size="sm" className="size-5 text-[8px]" />
                <span className="min-w-0 flex-1 truncate">{row.text}</span>
                <span className="text-[11px] text-soft">{row.at}</span>
              </span>
            ))}
          {done < 1 && <span className="text-soft">Henüz Hareket Yok</span>}
        </div>
      </aside>
    </div>
  );
}

/* ── 2. Yanıt şablonları + asistana sor ───────────────────────────────── */

const PRESETS = [
  { min: 5, name: "Kısa Yanıt", bar: "bg-chart-4", note: "Sık Sorulanlar" },
  { min: 15, name: "İade Süreci", bar: "bg-chart-2", note: "Fatura ve Ödeme" },
  { min: 30, name: "Kargo Gecikmesi", bar: "bg-chart-1", note: "Lojistik Ekibi" },
];
const PROMPTS = ["Bugünkü İadeleri Tek Yanıtta Topla", "Yalnız Acil Talepleri Göster", "Müşteri Yanıtlayınca Haber Ver"];

export function RepliesScene() {
  // 0-2: çipler tek tek gelir; 3: anahtar açılır; 4-5: bekleme.
  const { ref, step } = useSceneLoop(6, 1000, 5);
  return (
    <div ref={ref} aria-hidden className="grid w-[620px] gap-2 rounded-[20px] bg-surface p-2.5 text-[13px] leading-5 ring-1 ring-line-soft">
      <SceneStyle />
      <span className="px-1.5 pt-0.5 text-muted">Yanıt Şablonları</span>
      <div className="grid gap-2 rounded-[14px] bg-overlay p-2 shadow-raised ring-1 ring-line-soft">
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((p, i) => (
            <div key={p.name} className="grid gap-2 rounded-[10px] bg-surface p-3">
              <span className="text-[20px] leading-6 text-strong tabular-nums">
                {p.min} <span className="text-[13px] text-muted">dk</span>
              </span>
              <span className="flex items-center gap-1.5 text-strong">
                <span className={cn("h-3.5 w-0.5 rounded-full", p.bar)} /> {p.name}
              </span>
              <span className="text-[12px] leading-4 text-muted">
                {p.note}
                <br />
                Hafta İçi · 09-18
              </span>
              {i === 1 && (
                <span className="mt-1 flex items-center gap-2 text-muted">
                  <Copy className="size-3.5" /> <MoreHorizontal className="size-3.5" />
                  <span className={cn("ml-auto flex h-4 w-7 items-center rounded-full p-0.5 transition-colors duration-300", step >= 3 ? "bg-strong" : "bg-line-strong")}>
                    <span className={cn("size-3 rounded-full bg-page shadow-raised transition-transform duration-300 ease-(--ease-brand)", step >= 3 && "translate-x-3")} />
                  </span>
                </span>
              )}
            </div>
          ))}
        </div>
        <span className="flex items-center justify-center gap-1.5 py-1 text-muted">
          <Plus className="size-3.5" /> Özel Şablon Oluştur
        </span>
      </div>
      <span className="px-1.5 text-muted">Ya da Asistana Sor</span>
      <div className="flex min-h-[60px] flex-wrap content-start gap-1.5 px-1 pb-1">
        {PROMPTS.map((t, i) =>
          i <= step ? (
            <span key={t} className="scene-in flex items-center gap-1.5 rounded-md bg-overlay px-2 py-1 text-strong ring-1 ring-line-soft">
              {t} <X className="size-3 text-soft" />
            </span>
          ) : null,
        )}
      </div>
    </div>
  );
}

/* ── 3. Duyuru düzenleyici ────────────────────────────────────────────── */

const BODY = [
  "Herkese merhaba,",
  "Ödeme altyapımızda bu cumartesi 22.00 ile 23.00 arasında planlı bakım yapacağız.",
  "Bu sürede kartla ödeme ve iade işlemleri geçici olarak bekleyecek; talepler kaybolmaz, bakım bitince sırayla işlenir.",
];
const TODO = ["Açık iadeleri cuma akşamına kadar tamamlayın.", "Müşteriye söz verdiğiniz ödemeleri not alın.", "Sorun olursa @destek-ekibi'ne yazın."];

export function BroadcastScene() {
  // 0-5: paragraf ve maddeler sırayla belirir; 6: ipucu balonu; 7: bekleme.
  const { ref, step } = useSceneLoop(8, 900, 7);
  const shown = step + 1;
  return (
    <div ref={ref} aria-hidden className="grid w-[640px] gap-4 rounded-[14px] bg-page px-10 pt-4 pb-6 text-[13px] leading-[22px] text-body ring-1 ring-line-soft">
      <SceneStyle />
      <div className="-mx-6 flex items-center gap-1.5 border-b border-line-soft pb-2.5 text-muted">
        <ArrowLeft className="size-3.5" /> / <Megaphone className="size-3.5" /> Duyurular <span className="rounded bg-surface px-1 text-[12px]">6</span> /
        <span className="text-strong">Planlı Bakım: Ödeme Altyapısı</span> <ChevronDown className="size-3" />
        <MoreHorizontal className="ml-auto size-3.5" />
      </div>
      <div className="grid gap-0.5">
        <span className="text-[17px] leading-6 font-medium text-strong">Planlı Bakım: Ödeme Altyapısı</span>
        <span className="text-[12px] text-primary-ink italic">*E-posta alanlar bunu bildirim satırında görür</span>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-strong text-[12px] font-medium text-page">P</span>
        <span className="grid leading-4">
          <span className="text-strong">Pusula</span>
          <span className="text-[12px] text-muted">Duyuru Gönderen</span>
        </span>
      </div>
      <div className="grid min-h-[230px] content-start gap-3 pl-[42px]">
        {BODY.map((p, i) => (i < shown ? <p key={p} className="scene-in">{p}</p> : null))}
        {shown > BODY.length && (
          <div className="scene-in grid gap-1">
            <p>Yapmanız gerekenler:</p>
            <ul className="grid list-disc gap-0.5 pl-4">
              {TODO.map((t, i) => (i < shown - BODY.length ? <li key={t} className="scene-in">{t}</li> : null))}
            </ul>
          </div>
        )}
      </div>
      <div className="relative flex items-center gap-3 pl-[42px] text-muted">
        <span className={cn("grid size-6 place-items-center rounded-md transition-colors duration-200", step >= 6 && "bg-surface text-strong")}>
          <Paperclip className="size-3.5" />
        </span>
        <Link2 className="size-3.5" />
        {step >= 6 && <span className="scene-in absolute -top-8 left-6 rounded-md bg-strong px-2 py-1 text-[12px] text-page shadow-floating">Ek Ekle</span>}
      </div>
    </div>
  );
}

/* ── 4. Metrik sekmeleri → grafik ─────────────────────────────────────── */

const MONTHS = ["Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas"];
const METRICS = [
  { label: "Çözüm Süresi", value: "3,4 sa", goal: "Hedef 4 sa", series: [6.1, 5.4, 5.8, 4.9, 4.1, 3.4], verdict: "hedefin altında", tone: "text-success", bar: "bg-chart-1" },
  { label: "İlk Yanıt", value: "12 dk", goal: "Hedef 15 dk", series: [22, 19, 18, 16, 14, 12], verdict: "her ay hızlanıyor", tone: "text-success", bar: "bg-chart-2" },
  { label: "Memnuniyet", value: "%91", goal: "Hedef %90", series: [84, 86, 85, 88, 90, 91], verdict: "hedefi geçti", tone: "text-success", bar: "bg-chart-3" },
  { label: "Açık Talep", value: "48", goal: "Hedef 40", series: [62, 58, 55, 57, 51, 48], verdict: "hedefin üstünde", tone: "text-warning", bar: "bg-chart-4" },
];

export function MetricsScene() {
  const { ref, step } = useSceneLoop(4, 2600, 0);
  const m = METRICS[step];
  return (
    <div ref={ref} aria-hidden className="grid w-[760px] gap-3 rounded-[16px] bg-surface p-3 text-[12px] leading-[18px] ring-1 ring-line-soft">
      <SceneStyle />
      <div className="grid grid-cols-4 gap-2">
        {METRICS.map((x, i) => (
          <div key={x.label} className={cn("grid gap-1 rounded-[12px] p-2.5 transition-[background-color,box-shadow] duration-500 ease-(--ease-brand)", i === step ? "bg-overlay shadow-raised ring-1 ring-line-soft" : "bg-transparent")}>
            <span className="flex items-center gap-1.5 text-muted">
              <span className={cn("h-3 w-0.5 rounded-full", x.bar)} /> {x.label}
            </span>
            <span className="flex items-end justify-between gap-2">
              <span className="text-[18px] leading-6 text-strong tabular-nums">{x.value}</span>
              <Sparkline values={x.series} title={x.label} width={56} height={20} />
            </span>
            <span className="text-[12px] text-soft">{x.goal}</span>
          </div>
        ))}
      </div>
      <div key={m.label} className="scene-in grid gap-2 rounded-[12px] bg-overlay p-4 shadow-raised ring-1 ring-line-soft">
        <p className="text-[15px] leading-6 text-strong">
          {m.label} şu an <span className="tabular-nums">{m.value}</span>; <span className={cn("underline decoration-dotted underline-offset-4", m.tone)}>{m.verdict}</span>.
        </p>
        <p className="text-[12px] text-muted">Saatlik toplanır · son güncelleme 5 dk önce</p>
        <AreaChart title={`${m.label}: son altı ay`} labels={MONTHS} series={[{ label: m.label, values: m.series, series: 1 }]} height="h-40" />
      </div>
    </div>
  );
}

/* Kart künyeleri: sahne + kartın başlığı ve açıklaması tek yerde. */
export const SCENES: { id: string; title: string; description: string; meta: string[]; fit: number; ratio?: number; tone: "surface" | "page"; render: () => ReactNode }[] = [
  { id: "surec", title: "İşe Alım Süreci", description: "Aşamalar sırayla kapanır; sayaçlar, ilerleme ve ayrıntı paneli birlikte güncellenir.", meta: ["Pusula", "Ürün"], fit: 1040, tone: "page", render: () => <ProcessScene /> },
  { id: "sablon", title: "Yanıt Şablonları", description: "Önce hazır seçenek, sonra doğal dil: asistan önerileri aynı kuyuda.", meta: ["Pusula", "Yapay Zeka"], fit: 620, tone: "surface", render: () => <RepliesScene /> },
  { id: "duyuru", title: "Müşteri Duyurusu", description: "Kanal ipucu, gönderen satırı ve sakin gövde; metin yazıldıkça akar.", meta: ["Pusula", "İçerik"], fit: 640, tone: "page", render: () => <BroadcastScene /> },
  { id: "metrik", title: "Metrik Sekmeleri", description: "Başlık bir yargı cümlesi; sekme değişince grafik ve hüküm birlikte döner.", meta: ["Pusula", "Pano"], fit: 760, tone: "surface", render: () => <MetricsScene /> },
];
