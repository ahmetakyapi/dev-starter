"use client";

import { Calculator, CalendarDays, Coffee, Inbox, Package, Sparkles, Store, Truck } from "lucide-react";
import { useState } from "react";
import { AppWindow } from "@/components/ui/app-window";
import { CategoryCard, CategoryGrid } from "@/components/ui/category-card";
import { CornerLabel } from "@/components/ui/corner-label";
import { BentoGrid, FeatureTile, GlassFrame } from "@/components/ui/feature-tile";
import { FloatCard, FloatCards } from "@/components/ui/float-cards";
import { FocusStack } from "@/components/ui/focus-stack";
import { HorizonScene } from "@/components/ui/horizon-scene";
import { IntegrationCard, IntegrationGrid } from "@/components/ui/integration-card";
import { PermissionList } from "@/components/ui/permission-list";
import { RequirementList } from "@/components/ui/requirement-list";
import { ScheduleList } from "@/components/ui/schedule-list";
import { StatStrip } from "@/components/ui/stat-strip";
import { StatusList } from "@/components/ui/status-list";
import { StepRail } from "@/components/ui/step-rail";
import { StoryCard } from "@/components/ui/story-card";
import { TickMeter } from "@/components/ui/tick-meter";
import { ToneText } from "@/components/ui/tone-text";
import { Wallpaper } from "@/components/ui/wallpaper";
import { BRAND, CAFES, OCTOBER_GOALS, ROAST_TOTAL, SUBSCRIBERS, REVENUE_TOTAL, fromK, num } from "./_data";
import { Cell } from "./_ui";

/**
 * İkinci görsel turunun kuyuları (Socialscale, Synais, StatiQ, Forge,
 * MailPulse, AgentPay, Plotline turları): her biri kendi grubunun
 * ızgarasına son satır olarak girer. Aynı Kıyı Kahve kurgusu; rakamlar
 * `_data.ts`ten türer, müşteri sözü ÖRNEK künyelidir.
 */

/* ── Seçim ──────────────────────────────────────────────────────────────── */
export function SecimYeni() {
  const [linked, setLinked] = useState<ReadonlySet<string>>(new Set(["takvim"]));
  const connect = (id: string) => setLinked((p) => new Set(p).add(id));
  const status = (id: string) => (linked.has(id) ? "connected" : "missing");
  return (
    <>
      <Cell file="requirement-list" name="Gerekenler Listesi" note="Akışın ihtiyaç duyduğu uygulamalar: Bağlı hapı ya da Bağla butonu; eksik sayısı özette." span={3} align="stretch">
        <RequirementList
          title="Kargo Akışı İçin Gerekenler"
          items={[
            { id: "kargo", name: "Kargo Takip", icon: <Truck />, status: status("kargo") },
            { id: "muhasebe", name: "Muhasebe", icon: <Calculator />, status: status("muhasebe") },
            { id: "takvim", name: "Takvim Eşitleme", icon: <CalendarDays />, status: status("takvim") },
          ]}
          onConnect={connect}
        />
      </Cell>
      <Cell file="permission-list" name="İzin Listesi" note="Bağlanmadan önce ne okunacak, ne yazılacak; Okur/Yazar rozeti metinle." span={3} align="stretch">
        <PermissionList
          title="Kargo Takip şunları yapabilecek"
          items={[
            { id: "a", text: "Sipariş adresini okur", access: "read" },
            { id: "b", text: "Teslim durumunu siparişe yazar", access: "write" },
            { id: "c", text: "Gecikme için bildirim gönderir", access: "write" },
          ]}
          footnote="İzinleri ayarlardan her an geri alabilirsin."
        />
      </Cell>
      <Cell file="integration-card" name="Entegrasyon Kartı" note="Bağlıysa eşitleme anahtarı, değilse Bağla butonu ve kurulum süresi." span={6} align="stretch">
        <IntegrationGrid>
          {[
            { id: "kargo", name: "Kargo Takip", category: "Lojistik", icon: <Truck />, description: "Paketin yolculuğunu siparişe işler." },
            { id: "muhasebe", name: "Muhasebe", category: "Finans", icon: <Calculator />, description: "Toptan siparişten proforma ve fatura çıkarır." },
            { id: "takvim", name: "Takvim Eşitleme", category: "Zaman", icon: <CalendarDays />, description: "Kavrum günlerini takvimlere yazar." },
          ].map((a) => (
            <IntegrationCard key={a.id} {...a} connected={linked.has(a.id)} lastSync="2 dk önce eşitlendi" onConnect={() => connect(a.id)} />
          ))}
        </IntegrationGrid>
      </Cell>
    </>
  );
}

/* ── Veri ───────────────────────────────────────────────────────────────── */
export function VeriYeni() {
  return (
    <>
      <Cell file="schedule-list" name="Sıradakiler" note="Saat ve gün solda, renkli çubuk, başlık ve tek satır ayrıntı; sağda uygulama." span={3} align="stretch">
        <ScheduleList
          label="Atölyenin sıradaki işleri"
          items={[
            { id: "1", at: "2026-11-02T14:00", time: "14:00", day: "Pzt 2", title: "Kargo alımı", detail: "Toptan siparişler · 3 koli", color: 1, apps: <Truck aria-hidden className="size-4 text-muted" /> },
            { id: "2", at: "2026-11-03T09:00", time: "09:00", day: "Sal 3", title: "Kolombiya lotu kavrumu", detail: "Orta kavrum · 40 kg", color: 4, apps: <Coffee aria-hidden className="size-4 text-muted" /> },
            { id: "3", at: "2026-11-05T11:30", time: "11:30", day: "Per 5", title: "Kafe tadım günü", detail: `${CAFES[0].label}`, color: 2, apps: <Store aria-hidden className="size-4 text-muted" /> },
          ]}
        />
      </Cell>
      <Cell file="status-list" name="Durum Listesi" note="Bileşen bileşen durum, renk ve metinle; genel durum en kötüden türer." span={3} align="stretch">
        <StatusList
          title="Sistem Durumu"
          items={[
            { id: "web", label: "Web Mağaza", status: "operational" },
            { id: "odeme", label: "Ödeme", status: "operational" },
            { id: "kargo", label: "Kargo Eşitleme", status: "degraded" },
          ]}
          incident="Son olay 28 Ekim · 18 dakikada çözüldü"
        />
      </Cell>
      <Cell file="category-card" name="Kategori Kartı" note="Renkli ikon karosu, açıklama, makale sayısı; kartın tamamı tek bağlantı." span={6} align="stretch">
        <CategoryGrid>
          <CategoryCard href="#b-category-card" tone="primary" icon={<Coffee />} title="Çekirdekler" description="Köken, kavrum derecesi ve demleme önerileri." meta="14 makale" />
          <CategoryCard href="#b-category-card" tone="chart-2" icon={<Package />} title="Sipariş ve Kargo" description="Teslim süresi, iade ve adres değişikliği." meta="9 makale" />
          <CategoryCard href="#b-category-card" tone="chart-6" icon={<Store />} title="Toptan" description="Kafeler için fiyat listesi ve sipariş akışı." meta="6 makale" />
        </CategoryGrid>
      </Cell>
    </>
  );
}

/* ── Geri Bildirim ──────────────────────────────────────────────────────── */
export function GeriYeni() {
  const web = OCTOBER_GOALS[1];
  return (
    <Cell file="tick-meter" name="Çentikli Çubuk" note="Sayılabilir işin gidişatı: dolu, aşan ve planlanan çentikler; eşik işaretçisi." span={3} align="stretch">
      <div className="grid gap-5">
        <div className="grid gap-1.5">
          <p className="flex justify-between text-small text-muted">
            <span>Kavurucu Kapasitesi</span>
            <span className="tabular-nums">{num.format(ROAST_TOTAL)} / 1.600 kg</span>
          </p>
          <TickMeter label="Kavurucu Kapasitesi" value={ROAST_TOTAL} max={1600} ticks={32} marker={0.9} text={`%${Math.round((ROAST_TOTAL / 1600) * 100)}`} valueText={`${num.format(ROAST_TOTAL)} / 1.600 kg`} size="md" />
        </div>
        <div className="grid gap-1.5">
          <p className="flex justify-between text-small text-muted">
            <span>Web Siparişi, Ekim Hedefi</span>
            <span className="tabular-nums">
              {num.format(web.value)} / {num.format(web.goal)}
            </span>
          </p>
          <TickMeter label="Web Siparişi" value={web.value} max={web.goal} ticks={26} text={`%${Math.round((web.value / web.goal) * 100)}`} valueText={`${num.format(web.value)} / ${num.format(web.goal)} sipariş`} size="md" />
        </div>
      </div>
    </Cell>
  );
}

/* ── Tanıtım ────────────────────────────────────────────────────────────── */
export function TanitimYeni() {
  return (
    <>
      <Cell file="tone-text" name="İki Tonlu Başlık" note="Cümlenin bir bölümü güçlü, öbürü soluk; metin tek parça okunur." span={3}>
        <ToneText as="p" className="font-display text-heading font-bold text-balance">
          Kıyıdan gelen <ToneText.Soft>taze kavrulmuş kahve</ToneText.Soft>
        </ToneText>
      </Cell>
      <Cell file="corner-label" name="Köşe Etiketi" note="Köşe ayraçlı mono etiket; görsel zeminli tanıtımda eyebrow." span={3} size="sm">
        <CornerLabel>Kasım Harmanı</CornerLabel>
      </Cell>
      <Cell file="float-cards" name="Süzülen Kartlar" note="Başlığın çevresinde dönmüş kartlar; süs, telefonda gizli." span={6} size="lg" align="stretch" className="p-0">
        <FloatCards className="h-full min-h-80 rounded-2xl">
          <FloatCard at={{ left: "4%", top: "14%" }} rotate={-5} depth={2} className="w-48 rounded-xl bg-overlay p-3 text-strong">
            <p className="text-small font-medium">Lot 44 · Cerrado</p>
            <p className="text-micro text-muted">Kavrum tamamlandı</p>
          </FloatCard>
          <FloatCard at={{ right: "4%", top: "20%" }} rotate={4} depth={2} delay={1.2} className="w-48 rounded-xl bg-overlay p-3 text-strong">
            <p className="text-small font-medium">{CAFES[1].label}</p>
            <p className="text-micro text-muted">Sipariş yolda</p>
          </FloatCard>
          <FloatCard at={{ right: "12%", bottom: "8%" }} rotate={-3} depth={1} delay={2.4} className="w-44 rounded-xl bg-overlay p-3 text-strong">
            <p className="text-micro text-muted">Abone</p>
            <p className="text-title font-semibold tabular-nums">{num.format(SUBSCRIBERS)}</p>
          </FloatCard>
          <div className="relative z-10 mx-auto grid max-w-md place-items-center gap-3 px-6 py-24 text-center">
            <p className="font-display text-heading font-bold text-strong text-balance">{BRAND.name}</p>
            <p className="text-base text-body">Kartlar süstür; bilgi sayfanın başka yerinde de yazılıdır.</p>
          </div>
        </FloatCards>
      </Cell>
      <Cell file="focus-stack" name="Odak Yığını" note="Ortadaki net, uzaktakiler küçülür ve solar; kendiliğinden döner, ok tuşları gezdirir." span={3} align="stretch">
        <FocusStack
          label="Harmanlar"
          itemHeight={68}
          items={["Sabah", "Dağ", "Kıyı", "Ev", "Dükkan"].map((t) => ({ id: t, icon: <Coffee aria-hidden />, title: `${t} Harmanı`, subtitle: "250 g" }))}
        />
      </Cell>
      <Cell file="step-rail" name="Adım Rayı" note="Tanıtımda süreç: dolan ray, ikonlu daireler; form akışı için Stepper." span={3} align="stretch">
        <StepRail
          current={1}
          fill="static"
          aria-label="Abonelik adımları"
          steps={[
            { icon: <Coffee />, title: "Çekirdeği seç", description: "Köken ve kavrum." },
            { icon: <Package />, title: "Paketi belirle", description: "Gramaj ve sıklık." },
            { icon: <Truck />, title: "Kapına gelsin", description: "Ayda iki teslimat." },
          ]}
        />
      </Cell>
      <Cell file="feature-tile" name="Özellik Karosu" note="Başlık, tek cümle, altta kırpılan sahne; dört ton, GlassFrame ve BentoGrid." span={6} align="stretch">
        <BentoGrid>
          <FeatureTile tone="brand" title="Taze Kavrum" description="Siparişten sonra kavrulur, aynı gün paketlenir." media={<GlassFrame><p className="text-small font-medium">Lot 44 · Cerrado</p></GlassFrame>} />
          <FeatureTile tone="light" title="Abonelik" description="Ayda iki paket, istediğin gün duraklat." media={<div className="rounded-xl bg-overlay p-3 shadow-raised text-small text-body">Sonraki teslimat: 9 Kasım</div>} />
          <FeatureTile tone="dark" title="Toptan" description="Kafeler için haftalık sipariş." media={<GlassFrame><p className="text-small font-medium">{CAFES[0].label}</p></GlassFrame>} />
          <FeatureTile tone="light" title="Tadım Notları" description="Her lotun tadım notu pakette." media={<div className="flex items-center gap-2 rounded-xl bg-overlay p-3 shadow-raised"><Sparkles aria-hidden className="size-4 text-primary-ink" /><p className="text-small text-body">Şeftali, yasemin</p></div>} />
        </BentoGrid>
      </Cell>
      <Cell file="story-card" name="Hikâye Karosu" note="Logo, alıntı, kişi ya da kaynaklı rakam; örnek veri ÖRNEK künyeli." span={3} align="stretch" className="p-0">
        <StoryCard sample tone="photo" background={<Wallpaper scene="sunset" />} logo={CAFES[0].label} quote="Her sabah aynı tazelikte geliyor; müşterilerimiz farkı ilk fincanda anlıyor." author={{ name: "Kafe sahibi" }} href="#b-story-card" className="min-h-72 rounded-2xl" />
      </Cell>
      <Cell file="stat-strip" name="Sayı Şeridi" note="Üç dört büyük sayı, etiket, ince ayraç; rakamlar veriden türer." span={3}>
        <StatStrip items={[{ value: num.format(SUBSCRIBERS), label: "abone" }, { value: num.format(CAFES.length), label: "kafe" }, { value: fromK(REVENUE_TOTAL), label: "son 12 ay ciro" }]} />
      </Cell>
      <Cell file="horizon-scene" name="Ufuk Sahnesi" note="Ürün penceresi manzaranın arkasından doğar ve sayfa zeminine solar." span={6} size="lg" align="stretch" className="p-0">
        <HorizonScene
          frame={
            <AppWindow title="Siparişler" icon={<Inbox />} focused className="mx-auto w-full max-w-xl">
              <ul className="divide-y divide-line-soft">
                {CAFES.slice(0, 3).map((c) => (
                  <li key={c.value} className="px-3 py-2 text-small font-medium text-strong">
                    {c.label}
                  </li>
                ))}
              </ul>
            </AppWindow>
          }
          scene={<Wallpaper scene="dunes" className="size-full" />}
        >
          <ToneText as="p" className="font-display text-heading font-bold text-balance text-strong">
            Sabah vardiyası <ToneText.Soft>hazır</ToneText.Soft>
          </ToneText>
        </HorizonScene>
      </Cell>
    </>
  );
}
