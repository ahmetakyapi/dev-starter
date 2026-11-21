"use client";

import { Clock, Layers, Repeat, Save, Share2, Tag } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/dialog";
import { ForecastChart } from "@/components/ui/forecast-chart";
import { Input } from "@/components/ui/input";
import { LeverCard, LeverGrid } from "@/components/ui/lever-card";
import { RecordList, type RecordItem } from "@/components/ui/record-list";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";
import { Toaster, toast } from "@/components/ui/toast";
import type { ShellNavGroup } from "@/components/ui/app-shell";
import { cn } from "@/lib/utils";
import { BrandMark, MetricStrip, Page, PageHead, Panel, SampleStamp, Shell } from "./_panolar";

/**
 * Marj tahmin ve senaryo ekranı (margin referansı: yapı ve davranış; ad,
 * metin, rakam kurgusal, ÖRNEK VERİ). Dört kaldıraç anahtarı marjı, hedefe
 * farkı ve grafikteki yeşil yolu canlı değiştirir; sonuç "Senaryoyu Kaydet"
 * penceresiyle adlandırılıp kayıtlı senaryolar listesine eklenir.
 */

const LABELS = ["Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"] as const;
const ACTUAL = [32.8, 33.5, 34.4, 35.1, 34.9, 35.2, null, null, null] as const;
const CURRENT = [null, null, null, null, null, 35.2, 35.6, 35.9, 36.1] as const;
const LOW = [null, null, null, null, null, 35.2, 34.1, 33.8, 33.6] as const;
const HIGH = [null, null, null, null, null, 35.2, 36.9, 37.6, 38.2] as const;
/** Kaldıraç etkisi aylara yayılır: ay sonu payı. */
const RAMP = [0, 0, 0, 0, 0, 0, 0.73, 0.87, 1] as const;
const TARGET = 38;

const pct = (v: number) => `%${v.toFixed(1).replace(".", ",")}`;
const pts = (v: number) => v.toFixed(1).replace(".", ",");
const round1 = (v: number) => Math.round(v * 10) / 10;

type LeverDef = { id: string; title: string; full: number; monthly: string; progress: number; icon: ReactNode; text: string; short: string };

const LEVERS: readonly LeverDef[] = [
  { id: "emek", title: "Emek Maliyetini Tahminde Tut", full: 1.5, monthly: "aylık 27,6 bin ₺", progress: 0.62, icon: <Clock />, text: "Montaj 7,8 saatte biter, acil işler teklife sadık kalır.", short: "Emek" },
  { id: "malzeme", title: "Malzeme Fiyatlarını Sabitle", full: 0.7, monthly: "aylık 12,9 bin ₺", progress: 0.29, icon: <Layers />, text: "Mart zammını fiyat listesine yansıt.", short: "Malzeme" },
  { id: "geri", title: "Geri Dönüşleri %4'e İndir", full: 0.4, monthly: "aylık 7,0 bin ₺", progress: 0.16, icon: <Repeat />, text: "Her teslimde tahliye hattı kontrolü ekle.", short: "Geri Dönüş" },
  { id: "indirim", title: "İndirimi %5 ile Sınırla", full: 0.2, monthly: "aylık 3,7 bin ₺", progress: 0.08, icon: <Tag />, text: "%5 üstü talepler onay için sahibine gider.", short: "İndirim" },
];

const NAV: readonly ShellNavGroup[] = [
  {
    label: "Finans",
    items: [
      { href: "#tahmin", label: "Tahmin", icon: <Clock aria-hidden /> },
      { href: "#senaryolar", label: "Senaryolar", icon: <Layers aria-hidden /> },
    ],
  },
];

function Cell({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "danger" | "success" }) {
  return (
    <div className="min-w-0 p-4 sm:p-5">
      <p className="truncate text-small font-medium text-muted">{label}</p>
      <p className={cn("mt-1 text-title font-semibold tracking-tight tabular-nums", tone === "danger" ? "text-danger" : tone === "success" ? "text-success" : "text-strong")}>{value}</p>
      {hint ? <p className="mt-0.5 text-small text-muted">{hint}</p> : null}
    </div>
  );
}

type Saved = { id: string; name: string; levers: string[]; margin: number; period: string; compare: boolean; date: string };

const SEED: readonly Saved[] = [
  { id: "s1", name: "Emek ve Malzeme Odağı", levers: ["emek", "malzeme"], margin: 38.3, period: "Q4", compare: true, date: "14 Eki" },
  { id: "s2", name: "Yalnız Emek", levers: ["emek"], margin: 37.6, period: "Q4", compare: false, date: "2 Eki" },
];

export function TahminSenaryoPage() {
  const [period, setPeriod] = useState<"eki" | "q4">("q4");
  const [on, setOn] = useState<readonly string[]>(["emek"]);
  const [saved, setSaved] = useState<readonly Saved[]>(SEED);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | undefined>();
  const [compare, setCompare] = useState(true);

  const idx = period === "eki" ? 6 : 8;
  const ramp = RAMP[idx];
  const total = LEVERS.filter((l) => on.includes(l.id)).reduce((s, l) => s + l.full, 0);

  const withChanges = useMemo(
    () => (on.length === 0 ? undefined : CURRENT.map((v, i) => (v === null ? null : round1(v + total * RAMP[i])))),
    [on, total],
  );

  const base = CURRENT[idx] ?? 0;
  const projected = round1(base + total * ramp);
  const gap = round1(base - TARGET);
  const gapNow = round1(projected - TARGET);
  const revenue = period === "eki" ? "₺812 bin" : "₺2,48 mn";
  const periodLabel = period === "eki" ? "Ekim" : "Q4";

  function toggle(id: string, next: boolean) {
    setOn((prev) => (next ? [...prev, id] : prev.filter((x) => x !== id)));
  }

  function openSave() {
    setName("");
    setNameError(undefined);
    setCompare(true);
    setOpen(true);
  }

  function save() {
    if (name.trim().length < 2) {
      setNameError("Senaryoya bir ad ver.");
      return;
    }
    setSaved((s) => [{ id: `s${Date.now()}`, name: name.trim(), levers: [...on], margin: projected, period: periodLabel, compare, date: "Bugün" }, ...s]);
    setOpen(false);
    toast.success("Senaryo kaydedildi", { description: compare ? "Her Pazartesi gerçekleşenle karşılaştırılacak." : name.trim() });
  }

  const items: RecordItem[] = saved.map((s) => ({
    id: s.id,
    title: s.name,
    subtitle: `${s.date} · ${s.levers.length ? s.levers.map((l) => LEVERS.find((d) => d.id === l)?.short).join(", ") : "Kaldıraç yok"}`,
    value: pct(s.margin),
    meta: `${s.period} sonu tahmini marj`,
    status: (
      <>
        {s.compare ? <Badge tone="primary">Haftalık Karşılaştırma</Badge> : null}
        <Badge tone={s.margin >= TARGET ? "success" : "warning"} dot>
          {s.margin >= TARGET ? "Hedefte" : `Hedefe ${pts(round1(TARGET - s.margin))} puan`}
        </Badge>
      </>
    ),
  }));

  return (
    <>
      <Shell brand={{ name: "Marj Takibi", href: "#tahmin", logo: <BrandMark><Clock /></BrandMark> }} groups={NAV} current="#tahmin" user={{ name: "Nizam", detail: "Finans" }}>
        <Page>
          <PageHead
            title="Tahmin"
            description="Mevcut gidişin nereye vardığını ve hangi değişikliğin hedefi kapattığını gör."
            badge={<SampleStamp />}
            actions={
              <>
                <SegmentedControl
                  aria-label="Dönem"
                  size="sm"
                  value={period}
                  onValueChange={setPeriod}
                  options={[
                    { value: "eki", label: "Ekim" },
                    { value: "q4", label: "Q4" },
                  ]}
                />
                <Button variant="secondary" onClick={() => toast("Paylaşım bağlantısı kopyalandı (örnek)")}>
                  <Share2 aria-hidden /> Paylaş
                </Button>
                <Button variant="primary" onClick={openSave}>
                  <Save aria-hidden /> Senaryoyu Kaydet
                </Button>
              </>
            }
          />
          <MetricStrip>
            <Cell label="Tahmini Marj" value={pct(base)} hint={`${periodLabel} sonu, mevcut gidiş`} />
            <Cell label="Tahmini Gelir" value={revenue} hint={`${periodLabel} sonu`} />
            <Cell label="Hedefe Fark" value={`${gap < 0 ? "−" : "+"}${pts(Math.abs(gap))} puan`} hint={`Hedef ${pct(TARGET)}`} tone={gap < 0 ? "danger" : "success"} />
            <Cell
              label="Değişikliklerle Marj"
              value={pct(projected)}
              hint={on.length === 0 ? "Kaldıraç açık değil" : gapNow >= 0 ? `Hedefin ${pts(gapNow)} puan üstünde` : `Hedefe ${pts(Math.abs(gapNow))} puan kaldı`}
              tone={on.length === 0 ? undefined : gapNow >= 0 ? "success" : undefined}
            />
          </MetricStrip>
          <Panel id="marj-gorunumu" title="Marj Görünümü" note="Gerçekleşen, mevcut yol ve açık kaldıraçlarla yol">
            <ForecastChart
              title="Marj Görünümü"
              labels={LABELS}
              actual={ACTUAL}
              current={CURRENT}
              withChanges={withChanges}
              range={{ low: LOW, high: HIGH }}
              target={{ value: TARGET, label: "Hedef" }}
              format={pct}
              names={{ actual: "Gerçekleşen", current: "Mevcut Yol", withChanges: "Değişikliklerle", range: "Olası Aralık" }}
            />
          </Panel>
          <section aria-labelledby="kaldiraclar" className="grid gap-3">
            <div>
              <h2 id="kaldiraclar" className="text-read font-semibold tracking-tight text-strong">
                Marj Kaldıraçları
              </h2>
              <p className="text-small text-muted">Bir anahtarı aç, grafikteki yeşil yol ve marj anında güncellenir.</p>
            </div>
            <LeverGrid label="Marj Kaldıraçları">
              {LEVERS.map((l) => (
                <LeverCard
                  key={l.id}
                  title={l.title}
                  effect={`+${pts(round1(l.full * ramp))} puan`}
                  effectNote={l.monthly}
                  progress={l.progress}
                  icon={l.icon}
                  description={l.text}
                  headingLevel={3}
                  checked={on.includes(l.id)}
                  onCheckedChange={(next) => toggle(l.id, next)}
                />
              ))}
            </LeverGrid>
          </section>
          <Panel id="kayitli-senaryolar" title="Kayıtlı Senaryolar" note={`${saved.length} senaryo`} bodyClassName="p-0">
            <RecordList label="Kayıtlı Senaryolar" items={items} />
          </Panel>
        </Page>
      </Shell>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Senaryoyu Kaydet"
        description="Açık kaldıraçlar ve sonuç, seçili dönem için kaydedilir."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button variant="primary" onClick={save}>
              Kaydet
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Input label="Senaryo Adı" value={name} onChange={(e) => setName(e.target.value)} error={nameError} placeholder="Örnek: Emek ve Geri Dönüş" />
          <p className="rounded-lg bg-surface p-3 text-base text-body">
            {on.length === 0
              ? "Hiçbir kaldıraç açık değil: senaryo mevcut yolu kaydeder."
              : `${on.map((id) => LEVERS.find((l) => l.id === id)?.short).join(" + ")} açık. ${periodLabel} sonu marj ${pct(base)} yerine ${pct(projected)}${gapNow >= 0 ? ", hedefin üstünde." : `, hedefe ${pts(Math.abs(gapNow))} puan kaldı.`}`}
          </p>
          <Switch label="Her Pazartesi Gerçekleşenle Karşılaştır" hint="Hafta başında gerçekleşen marj bu senaryoyla yan yana raporlanır." checked={compare} onChange={(e) => setCompare(e.target.checked)} />
        </div>
      </Dialog>
      <Toaster />
    </>
  );
}
