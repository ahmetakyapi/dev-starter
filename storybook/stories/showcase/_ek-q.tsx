"use client";

import { CalendarDays, Compass, Inbox, ListChecks, PackageCheck, Reply, Truck } from "lucide-react";
import { AppWindow } from "@/components/ui/app-window";
import { ArtMat } from "@/components/ui/art-mat";
import { Badge } from "@/components/ui/badge";
import { FeatureList } from "@/components/ui/feature-list";
import { HeadMark } from "@/components/ui/head-mark";
import { Orb } from "@/components/ui/orb";
import { SectionHeading } from "@/components/ui/section-heading";
import { SignalHub } from "@/components/ui/signal-hub";
import { StageFlow } from "@/components/ui/stage-flow";
import { StepTabs, type StepTab } from "@/components/ui/step-tabs";
import type { ReactNode } from "react";

/**
 * Sergi turu (25 Kasım 2026) Pusula'da: Tanıtım sayfasında "nasıl çalışır"
 * (adım sekmeleri + paspartu + özellik listesi), Asistan'ın boş ekranında
 * arka planda çalışanlar (sinyal göbeği). Sayılar Pusula kurgusundan, ÖRNEK.
 */

function Window({ title, icon, rows }: { title: string; icon: ReactNode; rows: [string, string, "success" | "warning" | "neutral"][] }) {
  return (
    <AppWindow title={title} icon={icon} focused>
      <ul role="list" className="grid gap-1.5 p-3 text-small">
        {rows.map(([a, b, tone]) => (
          <li key={a} className="flex items-center justify-between gap-3 rounded-md bg-surface px-3 py-2">
            <span className="truncate text-strong">{a}</span>
            <Badge tone={tone}>{b}</Badge>
          </li>
        ))}
      </ul>
    </AppWindow>
  );
}

const STEPS: StepTab[] = [
  {
    id: "topla",
    title: "Talebi Topla",
    description: "E-posta, form ve mağaza mesajları tek gelen kutusuna düşer.",
    icon: <Inbox />,
    panel: (
      <ArtMat variant="wash" edge="torn" crop pad="lg" className="h-64 sm:h-80" contentClassName="max-w-2xl">
        <Window title="Gelen Kutusu" icon={<Inbox className="size-3.5" />} rows={[["Kargo nerede? · Elif T.", "Yeni", "warning"], ["İade talebi · Can D.", "Yeni", "warning"], ["Fatura kopyası · Ayşe K.", "Yanıtlandı", "success"]]} />
      </ArtMat>
    ),
  },
  {
    id: "planla",
    title: "İşi Planla",
    description: "Her talep sahibine ve gününe atanır; takvim kendini doldurur.",
    icon: <CalendarDays />,
    panel: (
      <ArtMat variant="grid" edge="torn" crop pad="lg" className="h-64 sm:h-80" contentClassName="max-w-2xl">
        <Window title="Takvim" icon={<CalendarDays className="size-3.5" />} rows={[["09.00 · Haftalık özet", "Bugün", "neutral"], ["14.30 · Kargo eşitleme", "Bugün", "neutral"], ["10.00 · Tedarikçi görüşmesi", "Yarın", "neutral"]]} />
      </ArtMat>
    ),
  },
  {
    id: "teslim",
    title: "Teslim Et",
    description: "Kargo durumu talebe yazılır, müşteri kendiliğinden bilgilenir.",
    icon: <Truck />,
    panel: (
      <ArtMat variant="strata" tone="earth" edge="torn" crop pad="lg" className="h-64 sm:h-80" contentClassName="max-w-2xl">
        <Window title="Siparişler" icon={<PackageCheck className="size-3.5" />} rows={[["#3105 · Filtre Kahve", "Yolda", "warning"], ["#3104 · Soğuk Demleme", "Teslim", "success"], ["#3102 · Kakule Latte", "Teslim", "success"]]} />
      </ArtMat>
    ),
  },
];

/** Tanıtım sayfası: "nasıl çalışır" bölümü. Künyeli iki bölümden biri (sahne dili 3). */
export function SergiSection() {
  return (
    <section aria-labelledby="tanitim-sergi-baslik" className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-4 pb-28 sm:px-6">
      <SectionHeading
        id="tanitim-sergi-baslik"
        eyebrow="Nasıl Çalışır"
        title={
          <>
            <HeadMark variant="highlight" icon={<Compass />}>
              Talepten
            </HeadMark>{" "}
            Teslime
          </>
        }
        soft="Tek Bir Akışta"
        description="Pusula üç adımı tek ekranda toplar; hangi işin kimde olduğunu sormana gerek kalmaz."
        layout="split"
      />
      <StepTabs label="Pusula nasıl çalışır" steps={STEPS} autoPlay={6000} />
      <FeatureList
        className="max-w-3xl"
        items={[
          { id: "a", title: "Tek Gelen Kutusu", description: "Bütün kanallardan gelen talepler aynı listede, aynı etiketlerle.", icon: <Inbox />, color: 1 },
          { id: "b", title: "Hazır Yanıtlar", description: "Sık sorulan sorulara tek tıkla, markanın sesiyle cevap.", icon: <Reply />, color: 4 },
          { id: "c", title: "Görev Listesi", description: "Talepten doğan iş, sahibi ve tarihiyle görevlere düşer.", icon: <ListChecks />, color: 2 },
        ]}
      />
    </section>
  );
}

/** Asistan'ın boş ekranı: arka planda çalışan ajanlar ve bitirdikleri. */
export function AgentHubPanel() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-8">
      <SignalHub
        label="Arka planda çalışan ajanlar (örnek)"
        mark={<Orb size={56} />}
        nodes={[
          { id: "a", name: "Gelen Kutusu", status: "Etkin", progress: 0.5, detail: "48 e-postanın 24'ü sınıflandı", icon: <Inbox /> },
          { id: "b", name: "Takvim", status: "Etkin", progress: 0.75, detail: "3 toplantı önerisi hazır", icon: <CalendarDays /> },
          { id: "c", name: "Kargo Takip", status: "Beklemede", progress: 0.25, detail: "12 gönderinin 3'ü güncellendi", icon: <Truck /> },
        ]}
        done={["Sabah özeti hazırlandı", "2 yanıt taslağı yazıldı"]}
      />
    </div>
  );
}

/** Raporlar: talebin aşamalardan akışı; nerede takıldığı (Pusula kurgusu, ÖRNEK). */
export function TicketFlowWell({ className }: { className?: string }) {
  return (
    <section aria-labelledby="rapor-akis" className={`flex h-full flex-col rounded-xl bg-overlay p-4 shadow-raised ring-1 ring-line sm:p-5 ${className ?? ""}`}>
      <div className="-mx-4 mb-4 border-b border-line-soft px-4 pb-3 sm:-mx-5 sm:px-5">
        <h2 id="rapor-akis" className="text-read font-semibold text-strong">
          Talep Akışı
        </h2>
        <p className="mt-0.5 text-small text-muted">Bu ay açılan talepler; aradaki sayı bir sonraki aşamaya geçemeyen</p>
      </div>
      <StageFlow
        title="Talep akışı"
        stages={[
          { label: "Açıldı", value: 186 },
          { label: "Atandı", value: 171 },
          { label: "İlk Yanıt", value: 158 },
          { label: "Çözüldü", value: 131 },
          { label: "Onaylandı", value: 124 },
        ]}
      />
    </section>
  );
}
