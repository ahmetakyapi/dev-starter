"use client";

import { CircleCheck, FileWarning, Inbox, LayoutDashboard, Receipt, Settings2, ShieldAlert, Truck, Users } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { ShellNavGroup } from "@/components/ui/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { FactorList } from "@/components/ui/factor-list";
import { InsightCallout } from "@/components/ui/insight-callout";
import { OptionCards } from "@/components/ui/option-cards";
import { toast } from "@/components/ui/toast";
import { ValueDiff } from "@/components/ui/value-diff";
import { cn } from "@/lib/utils";
import { FlatShell } from "./_onay";

/**
 * İstisna çözümü (Clearbill görselinden YAPI ve akış; ad, metin, veri kurgusal):
 * fatura işleme hattında otomatik kontrolden geçemeyen bir kaydı insan çözer.
 *
 * - Üst bant: durum, sorumlu, sonraki eylem, risk (tek satır, dört alan).
 * - Kanıt: fatura kesiti (token'la çizilmiş) + `ValueDiff` (farklı grup vurgulu).
 * - "Neden Başarısız Oldu" `InsightCallout`; "Nasıl Çözmek İstiyorsun?"
 *   `OptionCards` (biri kilitli ve nedeni yazılı), gönder butonu.
 * - Sağda `FactorList` ("Neden Önce") ve tedarikçi kartı.
 * - Akış: Gönder → "Düzeltme Bekleniyor" → (simüle) "Kabul Edildi".
 */

const CARD = "rounded-xl bg-overlay shadow-raised ring-1 ring-line";

const NAV: readonly ShellNavGroup[] = [
  {
    label: "Fatura Hattı",
    items: [
      { href: "#pano", label: "Pano", icon: <LayoutDashboard /> },
      { href: "#faturalar", label: "Faturalar", icon: <Receipt /> },
      { href: "#istisnalar", label: "İstisnalar", icon: <FileWarning /> },
      { href: "#gelen", label: "Gelen Kutusu", icon: <Inbox /> },
      { href: "#tedarikciler", label: "Tedarikçiler", icon: <Truck /> },
      { href: "#ekip", label: "Ekip", icon: <Users /> },
    ],
  },
  { items: [{ href: "#ayarlar", label: "Ayarlar", icon: <Settings2 /> }] },
];

type Phase = "acik" | "bekliyor" | "kabul" | "reddedildi";

const PHASE: Record<Phase, { badge: string; tone: "warning" | "primary" | "success" | "danger"; status: string; next: string }> = {
  acik: { badge: "Açık", tone: "warning", status: "Karar Bekliyor", next: "Çözüm yolunu seç" },
  bekliyor: { badge: "Düzeltme Bekleniyor", tone: "primary", status: "Tedarikçide", next: "Tedarikçi yanıtı (2 gün)" },
  kabul: { badge: "Çözüldü", tone: "success", status: "Çözüldü", next: "Ödeme hattına devredildi" },
  reddedildi: { badge: "Reddedildi", tone: "danger", status: "Reddedildi", next: "Tedarikçi yeni fatura keser" },
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 px-4 py-3 sm:px-5">
      <dt className="text-small font-medium text-muted">{label}</dt>
      <dd className="mt-0.5 truncate text-base font-semibold text-strong">{children}</dd>
    </div>
  );
}

/** Fatura kesiti: gerçek görsel yok, token'la çizilmiş satırlar; vergi numarası alanı vurgulu. */
function InvoiceCrop() {
  return (
    <figure
      role="img"
      aria-label="Fatura kesiti: Mavi Liman Ticaret, fatura numarası F-2026-0481, vergi numarası 1003847256000 3 olarak yazılmış."
      className="m-0 rounded-lg bg-surface p-4 ring-1 ring-line"
    >
      <div aria-hidden className="grid gap-2.5">
        <div className="flex items-center justify-between gap-4">
          <span className="h-3 w-28 rounded-sm bg-line-strong" />
          <span className="font-mono text-micro text-muted">F-2026-0481</span>
        </div>
        <span className="h-2 w-48 rounded-sm bg-line" />
        <span className="h-2 w-40 rounded-sm bg-line" />
        <div className="mt-1 flex flex-wrap items-center gap-2 rounded-md bg-danger-wash px-2.5 py-2 ring-1 ring-danger/30">
          <span className="text-micro font-medium text-body">VKN</span>
          <span className="font-mono text-small font-semibold text-danger">100 3847 2560 0003</span>
        </div>
        <div className="mt-1 grid grid-cols-[1fr_auto] gap-x-6 gap-y-2">
          <span className="h-2 w-36 rounded-sm bg-line" />
          <span className="h-2 w-14 rounded-sm bg-line" />
          <span className="h-2 w-28 rounded-sm bg-line" />
          <span className="h-2 w-16 rounded-sm bg-line" />
        </div>
      </div>
    </figure>
  );
}

export function IstisnaCozumu({ initialPhase = "acik" }: { initialPhase?: Phase } = {}) {
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [choice, setChoice] = useState("iste");
  const p = PHASE[phase];

  function submit() {
    if (choice === "reddet") {
      setPhase("reddedildi");
      toast.success("Fatura Reddedildi", { description: "Mavi Liman Ticaret'e iade bildirimi gönderildi." });
      return;
    }
    setPhase("bekliyor");
    toast.success("Düzeltme İstendi", { description: "Mavi Liman Ticaret'e hazır mesaj ve güvenli bağlantı gönderildi." });
  }

  function accept() {
    setPhase("kabul");
    toast.success("Düzeltildi ve Kabul Edildi", { description: "F-2026-0481 ödeme hattına döndü." });
  }


  return (
    <FlatShell brand="Fatura Hattı" logo={<ShieldAlert />} groups={NAV} current="#istisnalar" user={{ name: "Deniz Arda", detail: "Hesaplar Ödenecek" }}>
      <div className="flex w-full min-w-0 flex-col gap-5 px-4 py-6 sm:px-6 lg:py-7">
        <nav aria-label="Yol" className="flex flex-wrap items-center gap-1.5 text-small text-muted">
          <a href="#istisnalar" className="rounded-sm hover:text-strong hover:underline">
            İstisnalar
          </a>
          <span aria-hidden>/</span>
          <span aria-current="page" className="font-medium text-strong">
            KDV Numarası Uyuşmuyor
          </span>
        </nav>

        <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="min-w-[min(100%,18rem)] flex-1">
            <h1 className="flex flex-wrap items-center gap-x-3 gap-y-1 text-heading font-semibold tracking-tight text-strong">
              KDV Numarası Uyuşmuyor
              <Badge tone={p.tone} dot>
                {p.badge}
              </Badge>
              <span className="rounded-sm bg-surface-raised px-1.5 py-0.5 font-mono text-micro tracking-wide text-body">ÖRNEK VERİ</span>
            </h1>
            <p className="mt-1 text-base text-muted">Fatura F-2026-0481 · Mavi Liman Ticaret · ₺48.250</p>
          </div>
        </header>

        <dl className={cn(CARD, "grid grid-cols-2 divide-line-soft max-lg:[&>*:nth-child(n+3)]:border-t max-lg:[&>*:nth-child(2n)]:border-s lg:grid-cols-4 lg:[&>*+*]:border-s [&>*]:border-line-soft")}>
          <Field label="Durum">{p.status}</Field>
          <Field label="Sorumlu">Deniz Arda</Field>
          <Field label="Sonraki Eylem">{p.next}</Field>
          <Field label="Risk">
            <span className={phase === "kabul" ? "text-success" : "text-danger"}>{phase === "kabul" ? "Düştü" : "Yüksek"}</span>
          </Field>
        </dl>

        <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="grid min-w-0 gap-5">
            <section aria-labelledby="kanit" className={cn(CARD, "grid gap-4 p-4 sm:p-5")}>
              <h2 id="kanit" className="text-read font-semibold text-strong">
                Kanıt
              </h2>
              <InvoiceCrop />
              <ValueDiff
                rows={[
                  { label: "Faturada Yazan", groups: ["100", "3847", "2560", "0003"], tone: "bad", note: "Tedarikçi faturaya elle yazmış" },
                  { label: "Doğrulanmış Kayıt", groups: ["100", "3847", "2650", "0003"], tone: "good", note: "Vergi sicilinden 3 Mart'ta doğrulandı" },
                ]}
              />
            </section>

            <InsightCallout title="Neden Başarısız Oldu" kind="warning" label="Dikkat">
              Faturadaki vergi numarasının üçüncü grubu, doğrulanmış tedarikçi kaydıyla uyuşmuyor. İki rakam yer değiştirmiş gibi görünüyor; bu hata türü ödemenin yanlış tüzel kişiye gitmesine yol açabilir.
            </InsightCallout>

            <section aria-labelledby="coz" className={cn(CARD, "grid gap-4 p-4 sm:p-5")}>
              <h2 id="coz" className="sr-only">
                Çözüm
              </h2>
              {phase === "kabul" ? (
                <InsightCallout title="Düzeltildi ve Kabul Edildi" kind="success" label="Sonuç" icon={CircleCheck}>
                  Mavi Liman Ticaret düzeltilmiş faturayı gönderdi. Vergi numarası kayıtla eşleşti ve fatura ödeme hattına döndü.
                </InsightCallout>
              ) : phase === "reddedildi" ? (
                <InsightCallout title="Fatura Reddedildi" kind="warning" label="Sonuç">
                  Tedarikçiye iade bildirimi gitti. Yeni fatura geldiğinde hat yeniden başlar.
                </InsightCallout>
              ) : phase === "bekliyor" ? (
                <div className="grid gap-3">
                  <p className="text-base text-body">Mavi Liman Ticaret'e düzeltme isteği gitti. Yanıt gelince fatura kendiliğinden yeniden kontrol edilir.</p>
                  <div>
                    <Button variant="secondary" size="sm" onClick={accept}>
                      Tedarikçi Yanıtını Simüle Et
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <OptionCards
                    legend="Nasıl Çözmek İstiyorsun?"
                    value={choice}
                    onValueChange={setChoice}
                    options={[
                      { value: "iste", title: "Tedarikçiden Düzeltme İste", description: "Hazır mesaj ve güvenli bağlantı gönderilir; düzeltilmiş fatura gelince hat devam eder.", badge: "Önerilen" },
                      { value: "burada", title: "Burada Düzelt", description: "Numarayı kendin düzeltip faturayı yeniden gönder.", locked: { reason: "Mevcut değil: vergi numarasını yalnız tedarikçi değiştirebilir." } },
                      { value: "reddet", title: "Faturayı Reddet", description: "Fatura iade edilir; tedarikçi yeni fatura keser." },
                    ]}
                  />
                  <div className="flex justify-end">
                    <Button variant="primary" onClick={submit}>
                      {choice === "reddet" ? "Faturayı Reddet" : "Düzeltme İste"}
                    </Button>
                  </div>
                </>
              )}
            </section>
          </div>

          <aside aria-label="Bağlam" className="grid min-w-0 gap-5">
            <div className={cn(CARD, "p-4 sm:p-5")}>
              <FactorList
                title="Neden Önce"
                severity={phase === "kabul" ? "low" : "critical"}
                factors={[
                  { label: "Vergi numarası", value: "Uyuşmuyor", hint: "3. grup: 2560 ≠ 2650", tone: "danger" },
                  { label: "Tutar", value: "₺48.250", hint: "Aylık ortalamanın 3 katı", tone: "warning" },
                  { label: "Banka hesabı", value: "Değişmiş", hint: "Son faturadan farklı IBAN", tone: "warning" },
                  { label: "Tedarikçi geçmişi", value: "14 temiz fatura" },
                ]}
              />
            </div>
            <section aria-labelledby="ted" className={cn(CARD, "p-4 sm:p-5")}>
              <h2 id="ted" className="text-read font-semibold text-strong">
                Tedarikçi
              </h2>
              <p className="mt-2 text-base font-semibold text-strong">Mavi Liman Ticaret</p>
              <p className="text-small text-muted">Lojistik · 2022'den beri tedarikçi</p>
              <dl className="mt-3 grid gap-2 text-small">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Toplam Fatura</dt>
                  <dd className="font-medium text-strong tabular-nums">14</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Açık İstisna</dt>
                  <dd className="font-medium text-strong tabular-nums">{phase === "kabul" ? 0 : 1}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Ort. Yanıt Süresi</dt>
                  <dd className="font-medium text-strong">1,8 gün</dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      </div>
    </FlatShell>
  );
}
