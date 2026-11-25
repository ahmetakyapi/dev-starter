"use client";

import { Bot, Boxes, Building2, Coffee, Frame, Globe, Grid3x3, Leaf, PenLine, ShoppingBag, Truck } from "lucide-react";
import { AppWindow } from "@/components/ui/app-window";
import { ArtMat } from "@/components/ui/art-mat";
import { FeatureList } from "@/components/ui/feature-list";
import { HeadMark } from "@/components/ui/head-mark";
import { SectionHeading } from "@/components/ui/section-heading";
import { SignalHub } from "@/components/ui/signal-hub";
import { StepTabs } from "@/components/ui/step-tabs";
import { BRAND, CAFES, num } from "./_data";
import { Cell } from "./_ui";

/**
 * Sergi turunun kuyuları (25 Kasım 2026): ürünü dokulu zeminde sergileme,
 * iki tonlu bölüm başlığı, adım sekmeleri, özellik listesi, başlık işareti
 * ve sinyal göbeği. Kıyı Kahve kurgusu; sayılar `_data.ts`ten.
 */

function Mini({ title }: { title: string }) {
  return (
    <AppWindow title={title} icon={<Coffee className="size-3.5" />} focused>
      <ul className="grid gap-1.5 p-3 text-small">
        {CAFES.slice(0, 3).map((c, i) => (
          <li key={c.value} className="flex items-center justify-between gap-2 rounded-md bg-surface px-2.5 py-1.5">
            <span className="truncate text-strong">{c.label}</span>
            <span className="shrink-0 text-muted tabular-nums">{num.format([1240, 860, 512][i])} sipariş</span>
          </li>
        ))}
      </ul>
    </AppWindow>
  );
}

/* ── Tanıtım ──────────────────────────────────────────────────────────── */
export function TanitimQ() {
  return (
    <>
      <Cell file="art-mat" name="Sergi Paspartusu" note="Ürün penceresi boyalı, kareli ya da sulu boya zeminde; yırtık kenar, palet ile döner." span={3} size="lg" align="stretch">
        <div className="grid gap-3 sm:grid-cols-2">
          <ArtMat variant="strata" tone="earth" edge="torn" pad="sm">
            <Mini title={`${BRAND.name} · Şubeler`} />
          </ArtMat>
          <ArtMat variant="grid" edge="torn" pad="sm" crop className="h-40">
            <Mini title="Kavrum Planı" />
          </ArtMat>
        </div>
      </Cell>
      <Cell file="section-heading" name="Bölüm Başlığı" note="Kesik çizgili mono künye, güçlü iddia + soluk bağlam, yanda açıklama." span={3} align="start">
        <SectionHeading eyebrow="Nasıl Çalışır" title="Çekirdekten Fincana" soft="Tek Bir Akışta" description="Kavrum, stok ve sipariş aynı panoda; şube değişikliği hepsine yansır." layout="split" />
      </Cell>
      <Cell file="step-tabs" name="Adım Sekmeleri" note="Yatay adım şeridi; seçili adım tam renk, sahne altında. Ok tuşlarıyla gezilir." span={4} size="lg" align="stretch">
        <StepTabs
          label="Kıyı Kahve nasıl çalışır"
          defaultValue="kavur"
          steps={[
            { id: "sec", title: "Çekirdeği Seç", description: "Menşe ve harmanı belirle.", icon: <Leaf /> },
            { id: "kavur", title: "Kavrumu Planla", description: "Şube talebine göre parti aç.", icon: <Frame /> },
            { id: "gonder", title: "Şubeye Gönder", description: "Sevkiyat siparişe bağlanır.", icon: <Truck /> },
          ]}
        />
      </Cell>
      <Cell file="head-mark" name="Başlık İşareti" note="Başlığın içinde tek işaret: ikon karesi, kalem şeridi ya da noktalı alt çizgi." span={2} align="start">
        <p className="font-display text-display leading-none font-semibold tracking-[-0.04em] text-balance text-strong">
          Her <HeadMark variant="highlight" icon={<Coffee />}>Fincan</HeadMark> Aynı Tatta
        </p>
      </Cell>
      <Cell file="feature-list" name="Özellik Listesi" note="Renkli çizgi ikon, başlık, soluk açıklama; kıl çizgiyle ayrılır, kart yok." span={3} align="start">
        <FeatureList
          dense
          items={[
            { id: "a", title: "Abonelik Kutusu", description: "Her ay yeni harman, kapıda.", icon: <ShoppingBag />, color: 4 },
            { id: "b", title: "Şube Ağı", description: `${CAFES.length} şubenin stoku tek panoda.`, icon: <Globe />, color: 2 },
            { id: "c", title: "Kavrum Günlüğü", description: "Her partinin sıcaklık eğrisi kayıtlı.", icon: <PenLine />, color: 3 },
          ]}
        />
      </Cell>
    </>
  );
}

/* ── Yapay Zeka ───────────────────────────────────────────────────────── */
export function AjanQ() {
  return (
    <Cell file="signal-hub" name="Sinyal Göbeği" note="Ortada işaret, altında çalışan ajan kartları, çevrede bitmiş işler. Çizgiler bir kez çizilir." span={6} size="lg" align="stretch">
      <SignalHub
        label="Kıyı Kahve ajanları (örnek)"
        mark={<Grid3x3 />}
        nodes={[
          { id: "a", name: "Stok Ajanı", status: "Etkin", progress: 0.5, detail: "4 şubenin 2'si sayıldı", icon: <Boxes /> },
          { id: "b", name: "Kavrum Planı", status: "Etkin", progress: 0.75, detail: "Yarınki 3 parti hazır", icon: <Building2 /> },
          { id: "c", name: "Müşteri Yanıtı", status: "Beklemede", progress: 0.25, detail: "12 mesajın 3'ü yanıtlandı", icon: <Bot /> },
        ]}
        done={["Haftalık özet yazıldı", "2 tedarik siparişi açıldı"]}
      />
    </Cell>
  );
}
