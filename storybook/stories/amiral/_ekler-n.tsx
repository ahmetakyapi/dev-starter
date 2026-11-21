"use client";

import { Coffee, Sparkles, Store, Truck } from "lucide-react";
import { useState } from "react";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { FactorList } from "@/components/ui/factor-list";
import { ImpactBar } from "@/components/ui/impact-bar";
import { InsightCallout } from "@/components/ui/insight-callout";
import { LeverCard, LeverGrid } from "@/components/ui/lever-card";
import { OptionCards } from "@/components/ui/option-cards";
import { PolicyChecks } from "@/components/ui/policy-checks";
import { SetupCard } from "@/components/ui/setup-card";
import { ValueDiff } from "@/components/ui/value-diff";
import { Button } from "@/components/ui/Button";
import { CAFES, OCTOBER_GOALS, ROAST_TOTAL, num } from "./_data";
import { Cell } from "./_ui";

/**
 * Onlu turun kuyuları: karar anı bileşenleri. Kıyı Kahve kurgusu; rakamlar
 * `_data.ts`ten türer.
 */

/* ── Seçim ──────────────────────────────────────────────────────────────── */
function ShipOptions() {
  const [v, setV] = useState("kargo");
  return (
    <OptionCards
      legend="Siparişi Nasıl Gönderelim"
      value={v}
      onValueChange={setV}
      options={[
        { value: "kargo", title: "Kargo ile Gönder", description: "Ertesi gün kapıda; 400 ₺ üzeri ücretsiz.", badge: "Önerilen" },
        { value: "kafe", title: "Kafeden Teslim Al", description: "Bornova şubesinde hazır olunca haber veririz." },
        { value: "kurye", title: "Aynı Gün Kurye", description: "Yalnız İzmir içi.", locked: { reason: "Bu adrese kurye hizmeti yok." } },
      ]}
    />
  );
}

function CafeChips() {
  const [v, setV] = useState<string[]>([CAFES[0].value]);
  return (
    <ChoiceChips
      legend="Hangi Kafelere Uygulansın"
      options={CAFES.map((c) => ({ value: c.value, label: c.label }))}
      value={v}
      onValueChange={setV}
      max={3}
      showCount
    />
  );
}

function RoastLevers() {
  const [on, setOn] = useState<Record<string, boolean>>({ a: true });
  const set = (k: string) => (c: boolean) => setOn((p) => ({ ...p, [k]: c }));
  return (
    <LeverGrid label="Kavurma Kolları">
      <LeverCard title="Hafta Sonu Kavurmayı Artır" effect="+%6 Ciro" effectNote="tahmini" progress={0.7} progressLabel="Etki Güveni" checked={!!on.a} onCheckedChange={set("a")} icon={<Coffee />} description="Cumartesi ikinci parti." />
      <LeverCard title="Kargo Eşiğini Düşür" effect="+%3 Sipariş" effectNote="tahmini" progress={0.45} progressLabel="Etki Güveni" checked={!!on.b} onCheckedChange={set("b")} icon={<Truck />} description="Eşik 400 ₺ yerine 350 ₺." />
      <LeverCard title="Yeni Kafe Ortaklığı" effect="+%9 Ciro" effectNote="tahmini" progress={0.25} progressLabel="Etki Güveni" checked={!!on.c} onCheckedChange={set("c")} icon={<Store />} description="Karşıyaka için görüşme." />
    </LeverGrid>
  );
}

export function SecimN() {
  return (
    <>
      <Cell file="option-cards" name="Seçenek Kartları" note="Tek seçimli büyük kartlar: Önerilen rozeti, kilitli seçenekte gerekçe." span={3} align="stretch">
        <ShipOptions />
      </Cell>
      <Cell file="choice-chips" name="Seçim Hapları" note="Çoklu seçim, üst sınır ve sayaç; sınıra gelince kalanlar pasifleşir." span={3} align="stretch">
        <CafeChips />
      </Cell>
      <Cell file="lever-card" name="Kol Kartı" note="Açınca tahmine eklenen varsayım: etki ve güven çubuğu yan yana." span={6} align="stretch">
        <RoastLevers />
      </Cell>
    </>
  );
}

/* ── Veri ───────────────────────────────────────────────────────────────── */
export function VeriN() {
  return (
    <>
      <Cell file="value-diff" name="Değer Farkı" note="Eski ve yeni değer alt alta; değişen parçalar vurgulu." span={3} align="stretch">
        <ValueDiff
          rows={[
            { label: "Yürürlükteki Fiyat", groups: ["250", "gr", "Çekirdek", "180 ₺"], tone: "neutral" },
            { label: "Yeni Fiyat", groups: ["250", "gr", "Çekirdek", "195 ₺"], tone: "good", note: "Çekirdek maliyeti arttı." },
          ]}
        />
      </Cell>
      <Cell file="factor-list" name="Etken Listesi" note="Bir önerinin ya da önceliğin nedenleri: ağırlıklı satırlar ve ipucu." span={3} align="stretch">
        <FactorList
          title="Neden Öncelikli"
          severity="high"
          factors={[
            { label: "Hafta Kavurması", value: `${num.format(ROAST_TOTAL)} kg` },
            { label: "Ciro Hedefi", value: `%${Math.round((OCTOBER_GOALS[0].value / OCTOBER_GOALS[0].goal) * 100)}`, hint: "Hedefin altında", tone: "warning" },
            { label: "Bekleyen Sipariş", value: "14", hint: "Ortalama 2 gün" },
          ]}
        />
      </Cell>
    </>
  );
}

/* ── Geri bildirim ──────────────────────────────────────────────────────── */
export function GeriN() {
  return (
    <>
      <Cell file="insight-callout" name="İçgörü Notu" note="Verinin yanında tek öneri: etiket, başlık, gerekçe ve eylem." span={3} align="stretch">
        <InsightCallout
          title="Cumartesi Kavurmayı Öne Al"
          label="Öneri"
          icon={Sparkles}
          actions={<Button size="sm">Planla</Button>}
        >
          Web siparişlerinin çoğu hafta sonu geliyor; ikinci parti stok boşluğunu kapatır.
        </InsightCallout>
      </Cell>
      <Cell file="policy-checks" name="Ön Kontroller" note="Onaydan önce kural denetimi: geçti, uyarı ya da kaldı." span={3} align="stretch">
        <PolicyChecks
          title="Ön Kontroller"
          checks={[
            { id: "a", label: "İndirim sınırı içinde", state: "pass" },
            { id: "b", label: "Yönetici onayı gerekli", detail: "Aboneliklerde tek onay yetmiyor.", state: "warn" },
            { id: "c", label: "Kafe seçimi", detail: "En az bir kafe seç.", state: "fail" },
          ]}
        />
      </Cell>
      <Cell file="impact-bar" name="Etki Çubuğu" note="Mevcut + eklenecek miktar, sınıra karşı; aşımda uyarı rengi." span={6} size="sm">
        <ImpactBar label="Aylık Kavurma Kapasitesi" current={ROAST_TOTAL * 3} added={ROAST_TOTAL} limit={ROAST_TOTAL * 5} format={(v) => `${num.format(v)} kg`} />
      </Cell>
    </>
  );
}

/* ── Gezinme ────────────────────────────────────────────────────────────── */
export function GezinmeN() {
  const [step, setStep] = useState(2);
  return (
    <Cell file="setup-card" name="Kurulum Kartı" note="Adım sayacı, atla ve ilerle; bitince tamamlandı metni." span={3} align="stretch">
      <SetupCard
        title="Kafeni Bağla"
        description="Sipariş akışı için bir kafe seç."
        step={step}
        total={4}
        onSkip={() => setStep((s) => Math.min(s + 1, 5))}
        onNext={() => setStep((s) => Math.min(s + 1, 5))}
        doneText="Kurulum tamam."
      />
    </Cell>
  );
}
