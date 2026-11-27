"use client";

import { BarChart3, CreditCard, Link2, PenLine, Search, Workflow, GitBranch, Table2, Activity, ShieldCheck, Mail, CalendarClock } from "lucide-react";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BentoGrid, FeatureTile, GlassFrame } from "@/components/ui/feature-tile";
import { StatStrip } from "@/components/ui/stat-strip";
import { StepRail } from "@/components/ui/step-rail";
import { StoryCard, StoryGrid } from "@/components/ui/story-card";
import { Sparkline } from "@/components/ui/sparkline";
import { ToneText } from "@/components/ui/tone-text";
import { Wallpaper } from "@/components/ui/wallpaper";

/**
 * Tanıtım bölümleri. Kişi, marka ve sayı kurgusal; her alıntı kartı
 * "ÖRNEK" künyeli (guides/08 veri dürüstlüğü). Görsel yerine `wallpaper`.
 */

const BTN =
  "inline-flex h-10 items-center rounded-full px-4 text-small font-medium outline-none focus-visible:ring-2 focus-visible:ring-line-focus focus-visible:ring-offset-2";

export function Section({ eyebrow, title, lead, children, id }: { eyebrow?: string; title: ReactNode; lead?: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        {eyebrow ? <p className="mb-3 inline-block rounded-full bg-primary-wash px-3 py-1 text-small font-medium text-primary-ink">{eyebrow}</p> : null}
        <ToneText as="h2" className="text-display font-medium">
          {title}
        </ToneText>
        {lead ? <p className="mt-4 text-lead text-muted">{lead}</p> : null}
      </div>
      <div className="mt-12">{children}</div>
    </section>
  );
}

/* 1 — Özellik karoları ---------------------------------------------------- */

const row = (icon: ReactNode, title: string, sub: string) => (
  <div className="flex items-center gap-2.5">
    <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-md bg-primary-wash text-primary-ink [&_svg]:size-4">
      {icon}
    </span>
    <div className="min-w-0">
      <p className="truncate text-base font-medium">{title}</p>
      <p className="truncate text-small text-muted">{sub}</p>
    </div>
  </div>
);

/** Karoların sahnesi: tek satır yerine küçük bir liste, alt boşluk dolsun. */
const rows = (items: readonly [ReactNode, string, string][]) => (
  <div className="grid gap-3">
    {items.map(([icon, title, sub]) => (
      <div key={title}>{row(icon, title, sub)}</div>
    ))}
  </div>
);

export function FeatureTiles() {
  return (
    <Section eyebrow="Çatı" title={<>Gerçekten dönüştüren <ToneText.Soft>yapıya göre</ToneText.Soft> kurulu</>} lead="Her çıktı performans verisine dayanır; eğilime ya da sezgiye değil.">
      <BentoGrid>
        <FeatureTile tone="light" title="Brifing gönder" description="Yaratıcı istekleri doğrudan platformdan ilet; referans ekle, öncelik belirle." media={<GlassFrame>{rows([[<PenLine key="a" />, "Brifing Taslağı", "3 teslim edilecek iş"], [<Search key="b" />, "Referanslar", "5 dosya eklendi"], [<CalendarClock key="c" />, "Teslim", "Cuma 17.00"]])}</GlassFrame>} />
        <FeatureTile tone="dark" title="İlerlemeyi izle" description="Her isteği brifingden teslimata kadar canlı izle." media={<GlassFrame>{rows([[<Workflow key="a" />, "Kavram", "4 iş"], [<GitBranch key="b" />, "Revizyon", "2 iş"], [<ShieldCheck key="c" />, "Hazır", "6 iş"]])}</GlassFrame>} />
        <FeatureTile tone="dark" title="Kavramları onayla" description="Gelen yönleri kendi takvimine göre onayla, değişiklik iste ya da reddet." media={<GlassFrame>{rows([[<GitBranch key="a" />, "Koşul", "Güven puanı yeterliyse onayla"], [<Mail key="b" />, "Bildirim", "Karar sonrası ekibe haber"]])}</GlassFrame>} />
        <FeatureTile
          tone="light"
          title="Çıktıları teslim al"
          description="Üretime hazır dosyalar bittiği anda iner, yığına ve kampanyaya göre düzenli."
          media={
            <GlassFrame>
              <p className="flex items-center gap-2 text-small text-muted">
                <Activity aria-hidden className="size-3.5" /> Aktif çalıştırma
              </p>
              <p className="mt-1 text-heading font-medium tabular-nums">Örnek</p>
              <Sparkline values={[4, 6, 5, 9, 8, 12]} title="Örnek çalıştırma eğrisi" width={180} height={36} className="mt-2" />
            </GlassFrame>
          }
        />
      </BentoGrid>
    </Section>
  );
}

/* 2 — Müşteri hikayeleri -------------------------------------------------- */

export function Stories() {
  return (
    <Section title={<>En hızlı büyüyen markalar <ToneText.Soft>bu yapıyı kullanır</ToneText.Soft></>} lead="Örnek kartlar: yayına çıkmadan önce gerçek, onaylı alıntılarla değiştirilir.">
      <StoryGrid>
        <StoryCard
          tone="photo"
          sample
          background={<Wallpaper scene="dunes" className="absolute inset-0 -z-10 size-full" />}
          logo={<span className="text-title font-bold tracking-tight">KUZEYMOTO</span>}
          quote="Örnek alıntı: sosyal ticaret gündemimizin üst sırasında; keşiften satın almaya kesintisiz bir yol sunuyor ve ekip her adımı aynı yerden görüyor."
          href="https://example.com/hikayeler/kuzeymoto"
        />
        <StoryCard
          tone="plain"
          sample
          logo={<span className="text-title font-bold text-chart-4">SÜTAJANS</span>}
          quote="Örnek alıntı: altyapı katmanı gibi çalışıyor; bütün müşterilerimizi daha verimli yönetiyoruz ve çıktımızı belirgin biçimde ölçekleyebiliyoruz."
          author={{ name: "Örnek Kişi", role: "Dijital Direktör, Süt Ajans", avatar: <Avatar name="Örnek Kişi" size="md" /> }}
          href="https://example.com/hikayeler/sutajans"
        />
        <StoryCard
          tone="plain"
          sample
          logo={<span className="text-title font-bold text-chart-2">TELEMARKA</span>}
          quote="Örnek alıntı: TikTok'un genel stratejimize etkisini anlamamıza yardım etti; hangi içeriğin satışa döndüğünü artık görüyoruz."
          author={{ name: "Örnek Kişi", role: "E-Ticaret Direktörü", avatar: <Avatar name="Örnek Kişi" size="md" /> }}
          href="https://example.com/hikayeler/telemarka"
        />
        <StoryCard
          tone="stat"
          sample
          background={<Wallpaper scene="lagoon" className="absolute inset-0 -z-10 size-full" />}
          logo={<span className="text-title font-bold">Ampulbaş</span>}
          quote="Örnek alıntı: haftada birkaç videodan ayda binlerce içeriğe geçtik."
          stat={{ value: "12x", label: "İçerik çıktısı (ÖRNEK)" }}
          href="https://example.com/hikayeler/ampulbas"
        />
      </StoryGrid>
    </Section>
  );
}

/* 3 — Süreç --------------------------------------------------------------- */

/* Bilinçli ters tema: bölüm `bg-strong` + `text-page` kullanır, yani açık temada
   koyu, koyu temada açık bant olur (ritmi kıran tek ters bölüm; metin kontrastı
   iki temada da token çiftinden gelir). */
export function Process() {
  return (
    <section className="bg-strong text-page">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center">
        <div>
          <Badge tone="neutral" className="bg-page text-strong">
            Akış
          </Badge>
          <h2 className="mt-5 max-w-md text-display font-medium text-page">Paranı Yönetmenin Daha Akıllı Yolu</h2>
          <p className="mt-4 max-w-md text-lead text-page/70">Finansının kontrolünü al: yenilikçi araçlar, uzman içgörüler ve pratik stratejiler.</p>
        </div>
        <StepRail
          tone="dark"
          current={2}
          steps={[
            { icon: <PenLine />, title: "Kaydol", description: "Hesabını dakikalar içinde aç." },
            { icon: <Link2 />, title: "Hesapları Bağla", description: "Finansal hesaplarını güvenle bağla." },
            { icon: <Search />, title: "Çözümle", description: "Ayrıntılı içgörü ve analizlere eriş." },
            { icon: <CreditCard />, title: "İşlem Yap", description: "Ödemeleri gönder ve al." },
            { icon: <BarChart3 />, title: "İyileştir", description: "Araçlarla kararlarını geliştir." },
          ]}
        />
      </div>
    </section>
  );
}

/* 4 — Sayılar ve görüş ---------------------------------------------------- */

export function NumbersAndQuote() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <div>
          <Badge>Görüşler</Badge>
          <ToneText as="h2" className="mt-5 text-display font-medium">
            Binlerce kişinin <ToneText.Soft>güvendiği</ToneText.Soft> hikâyeler
          </ToneText>
        </div>
        <StoryGrid className="!grid-cols-1">
          <StoryCard
            tone="plain"
            sample
            logo={<span className="text-title font-bold">Örnek Marka</span>}
            quote="Örnek alıntı: analizler tam yerinde; her kuruşu kolayca izliyorum ve bütçem üzerinde daha iyi denetimim var."
            author={{ name: "Örnek Kişi", role: "Kullanıcı", avatar: <Avatar name="Örnek Kişi" size="md" /> }}
          />
        </StoryGrid>
      </div>
      <div className="mt-16">
        <StatStrip
          items={[
            { value: "%98,6", label: "İşlem başarı oranı (ÖRNEK)" },
            { value: "₺11.840", label: "Ortalama tasarruf (ÖRNEK)" },
            { value: "%81", label: "Gelişen finansal büyüme (ÖRNEK)" },
            { value: "47.320", label: "Dünya çapında kullanıcı (ÖRNEK)" },
          ]}
        />
        <p className="mt-4 text-center text-small text-muted">Bu sayılar örnektir; yayına çıkmadan önce kaynaklı gerçek sayılarla değiştir.</p>
      </div>
    </section>
  );
}

/* 5 — Üç sütun gökyüzü ---------------------------------------------------- */

export function SkyColumns() {
  const items = [
    { icon: <Table2 />, title: "Doğru kişileri bul", description: "Yapay zekâ hesapları araştırır, satın alma işaretlerini izler ve en etkili fırsatları öne çıkarır.", sub: "Nitelikli Hat" },
    { icon: <CalendarClock />, title: "Sen hazır olmadan hazır", description: "Sen uyurken ajanın bütün iş gününü hazırlar: araştırma, takip taslakları, görüşme özetleri.", sub: "Görüşme tamamlandı" },
    { icon: <ShieldCheck />, title: "CRM'i bir daha güncelleme", description: "Her arama, e-posta ve toplantı otomatik kaydedilir; anlaşma aşamaları kendiliğinden güncellenir.", sub: "CRM güncellendi" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-3 inline-flex items-center gap-1.5 text-small font-medium text-primary-ink">
            <Mail aria-hidden className="size-3.5" /> Özellikler
          </p>
          <ToneText as="h2" className="max-w-lg text-display font-medium">
            Satış ekiplerine <em>sabahlarını</em> geri ver
          </ToneText>
        </div>
        <div className="flex gap-2">
          <button type="button" className={`${BTN} bg-cta text-on-brand shadow-cta`}>
            Demo İste
          </button>
          <button type="button" className={`${BTN} border border-line bg-overlay text-strong shadow-raised`}>
            Demoyu İzle
          </button>
        </div>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <FeatureTile
            key={item.title}
            tone="sky"
            title={item.title}
            description={item.description}
            media={<GlassFrame>{rows([[item.icon, item.sub, "Örnek kayıt"], [<Activity key="x" />, "Son güncelleme", "2 dakika önce"]])}</GlassFrame>}
          />
        ))}
      </div>
    </section>
  );
}
