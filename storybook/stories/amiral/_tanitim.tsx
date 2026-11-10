"use client";

import { Coffee, Package, ShoppingBag, Store, Truck } from "lucide-react";
import { useState } from "react";
import { AppWindow, WindowStrip } from "@/components/ui/app-window";
import { BlurIn } from "@/components/ui/blur-in";
import { CornerMascot } from "@/components/ui/corner-mascot";
import { Dock } from "@/components/ui/dock";
import { DockingNav } from "@/components/ui/docking-nav";
import { DriftColumns } from "@/components/ui/drift-columns";
import { HandCallout } from "@/components/ui/hand-callout";
import { LiquidGlass, LiquidGlassButton } from "@/components/ui/liquid-glass";
import { NoticeDeck } from "@/components/ui/notice-deck";
import { TrustLine } from "@/components/ui/trust-line";
import { WALLPAPER_NAMES, WALLPAPER_SCENES, Wallpaper } from "@/components/ui/wallpaper";
import { BRAND, CAFES, ORDERS, SUBSCRIBERS, num } from "./_data";
import { Cell, CellGrid } from "./_ui";

/* Tanıtım grubu (Ribbon ve offscreen.wtf turları, 2026-11-07): ziyaretçiye
   dönük açılış sayfasının parçaları. Sabit konumlu üç bileşen (menü, maskot,
   deste) sayfayı kaplamasın diye kuyunun içinde gösterilir: menü `contain:paint`
   kabında (sabit konum kaba göre çözülür), maskot `absolute` ile. */

type AppId = "siparis" | "toptan" | "kargo";

const APPS: readonly { id: AppId; label: string; icon: typeof Coffee }[] = [
  { id: "siparis", label: "Siparişler", icon: ShoppingBag },
  { id: "toptan", label: "Toptan", icon: Store },
  { id: "kargo", label: "Kargo", icon: Truck },
];

function DesktopDemo() {
  const [focus, setFocus] = useState<AppId>("siparis");
  return (
    <Wallpaper scene="dunes" className="rounded-2xl p-3 ring-1 ring-line sm:p-5">
      <WindowStrip role="img" aria-label={`${BRAND.name} pencereleri, odakta ${APPS.find((a) => a.id === focus)?.label}`} className="h-44">
        <AppWindow title="Siparişler" icon={<ShoppingBag />} focused={focus === "siparis"} className="w-60">
          <ul className="divide-y divide-line-soft">
            {ORDERS.slice(0, 3).map((o) => (
              <li key={o.id} className="px-3 py-1.5">
                <p className="truncate text-small font-medium text-strong">{o.customer}</p>
                <p className="text-micro text-muted">{o.id}</p>
              </li>
            ))}
          </ul>
        </AppWindow>
        <AppWindow title="Toptan" icon={<Store />} focused={focus === "toptan"} className="w-52">
          <ul className="space-y-1.5 p-3">
            {CAFES.slice(0, 3).map((c) => (
              <li key={c.value} className="truncate rounded-md bg-primary-wash px-2 py-1 text-micro font-medium text-primary-ink">
                {c.label}
              </li>
            ))}
          </ul>
        </AppWindow>
        <AppWindow title="Kargo" icon={<Truck />} ghost={focus !== "kargo"} focused={focus === "kargo"} className="w-52" />
      </WindowStrip>
      <div className="mt-4 flex justify-center">
        <Dock
          label={`${BRAND.name} uygulamaları`}
          size="sm"
          onSelect={(id) => setFocus(id as AppId)}
          items={APPS.map((a) => {
            const Icon = a.icon;
            return { id: a.id, label: a.label, icon: <Icon className="text-body" />, active: a.id === focus };
          })}
        />
      </div>
    </Wallpaper>
  );
}

/** Ziyaretçi menüsü: `contain:paint` kabı sabit konumu kendi kutusuna bağlar, menü sayfanın üstüne çıkmaz. */
function NavFrame() {
  return (
    <div className="relative h-40 w-full overflow-hidden rounded-2xl bg-surface ring-1 ring-line [contain:paint]">
      <DockingNav
        label={`${BRAND.name} menüsü`}
        brand={
          <span className="flex items-center gap-2 text-small font-bold tracking-tight text-strong">
            <span aria-hidden className="grid size-6 place-items-center rounded-sm bg-brand text-on-brand">
              <Coffee className="size-3.5" />
            </span>
            {BRAND.name}
          </span>
        }
        links={[
          { href: "#b-docking-nav", label: "Çekirdekler" },
          { href: "#b-trust-line", label: "Abonelik" },
        ]}
        action={
          <a href="#b-liquid-glass" className="inline-flex min-h-9 items-center rounded-full bg-cta px-4 text-small font-medium text-on-brand shadow-cta">
            Sipariş Ver
          </a>
        }
      />
      <p className="absolute inset-x-4 bottom-4 text-center text-small text-muted">Sayfa kaydıkça hap üst kenara oturur.</p>
    </div>
  );
}

export function TanitimGroup() {
  return (
    <CellGrid>
      <Cell file="blur-in" name="Bulanıktan Netleşen Başlık" note="Sayfanın tek kahraman başlığı; sözcükler buğudan çıkıp oturur." span={3}>
        <BlurIn as="p" className="text-center font-display text-heading leading-tight font-semibold tracking-tight text-strong text-balance">
          Kahveni <em className="font-[family-name:var(--font-serif-face),serif] font-normal">taze</em> kavrulmuş iç.
        </BlurIn>
      </Cell>
      <Cell file="liquid-glass" name="Sıvı Cam" note="Görsel zeminin üstünde tek birincil eylem; düz zeminde değil." span={3} className="p-0">
        <Wallpaper scene="mesh" className="grid min-h-60 w-full place-items-center rounded-2xl">
          <div className="flex flex-wrap items-center justify-center gap-3 p-6">
            <LiquidGlassButton tone="media" className="h-12 px-7">
              Aboneliği Başlat
            </LiquidGlassButton>
            <LiquidGlass tone="media">{num.format(SUBSCRIBERS)} abone</LiquidGlass>
          </div>
        </Wallpaper>
      </Cell>
      <Cell file="trust-line" name="Güven Satırı" note="Eylemin dibinde en çok üç doğrulanabilir güvence." span={3}>
        <div className="grid justify-items-center gap-3">
          <a href="#b-trust-line" className="inline-flex min-h-11 items-center rounded-full bg-cta px-6 text-base font-medium text-on-brand shadow-cta">
            İlk Paketi Seç
          </a>
          <TrustLine items={["Kart gerekmez", "İstediğin ay dondur", `${BRAND.city} içi aynı gün kargo`]} />
        </div>
      </Cell>
      <Cell file="hand-callout" name="El Yazısı Not" note="Kenardan, okla tek bir noktayı gösterir; sayfada bir tane." span={3}>
        <div className="relative grid justify-items-center pt-16">
          <HandCallout direction="down-left" className="absolute top-0 left-1/2">
            en çok bu seçiliyor
          </HandCallout>
          <span className="inline-flex items-center gap-2 rounded-xl bg-overlay px-4 py-3 text-small font-medium text-strong shadow-raised">
            <Package aria-hidden className="size-4 text-primary-ink" /> Aylık 1 kg Harman
          </span>
          <span className="sr-only">En çok seçilen paket: aylık 1 kg harman.</span>
        </div>
      </Cell>
      <Cell file="app-window" name="Uygulama Penceresi" note="Ürünü ekran görüntüsü değil, token'la çizilmiş canlı maketle anlatır." span={4} align="stretch">
        <DesktopDemo />
      </Cell>
      <Cell file="dock" name="Uygulama Rafı" note="Simge yükselir, komşuları da biraz; basınca pencere odağa gelir." span={2}>
        <div className="grid justify-items-center gap-3">
          <Dock
            items={[
              { id: "kavurma", label: "Kavurma", icon: <Coffee className="text-body" />, active: true },
              { id: "depo", label: "Depo", icon: <Package className="text-body" /> },
              { id: "kargo", label: "Kargo", icon: <Truck className="text-body" /> },
            ]}
          />
          <p className="text-center text-small text-muted">Pencere maketindeki raf aynı bileşen, düğmeli kipte.</p>
        </div>
      </Cell>
      <Cell file="docking-nav" name="Yuvaya Oturan Menü" note="Baştan hap; kaydırınca üst kenara oturur, köşeleri düzleşir." span={3} align="stretch">
        <NavFrame />
      </Cell>
      <Cell file="notice-deck" name="Duyuru Destesi" note="Üst üste kartlar; öndeki arkaya kayar, sayaç kaçıncıda olduğunu söyler." span={3}>
        <NoticeDeck
          label={`${BRAND.name} duyuruları`}
          items={[
            { id: "hasat", eyebrow: "Yeni Hasat", title: "Etiyopya Sidamo geldi", body: "250 g paketler cuma kavrumunda." },
            { id: "atolye", eyebrow: "Atölye", title: "Cumartesi 11.00'de V60 dersi" },
            { id: "toptan", eyebrow: "Toptan", title: `${CAFES.length} kafe her hafta bizden alıyor` },
          ]}
        />
      </Cell>
      <Cell file="wallpaper" name="Duvar Kâğıdı" note="Çözünürlükten bağımsız sekiz sahne; maketin arkası ya da indirilen resim." span={3} className="p-0">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl">
          <Wallpaper scene="lagoon" className="absolute inset-0" />
          <span className="absolute bottom-3 left-3 rounded-full bg-overlay px-3 py-1 text-micro font-medium text-strong shadow-raised">
            {WALLPAPER_NAMES.lagoon}
          </span>
        </div>
      </Cell>
      <Cell file="drift-columns" name="Süzülen Sütunlar" note="Komşu sütunlar zıt yönde yavaşça akar; üzerine gelince durur." span={3} align="stretch">
        <DriftColumns columns={3} duration={60} gap={10} className="h-72">
          {[...WALLPAPER_SCENES, ...WALLPAPER_SCENES].map((scene, i) => (
            <figure key={i} className="overflow-hidden rounded-lg ring-1 ring-line">
              <div className="aspect-[3/4]">
                <Wallpaper scene={scene} />
              </div>
              <figcaption className="bg-overlay px-2 py-1 text-micro font-medium text-soft">{WALLPAPER_NAMES[scene]}</figcaption>
            </figure>
          ))}
        </DriftColumns>
      </Cell>
      <Cell file="corner-mascot" name="Köşe Maskotu" note="Gözleri imleci izler, dokununca konuşur; yalnız tanıtım sayfasında." span={6} size="sm" className="relative">
        <p className="max-w-md text-center text-small text-muted">
          Gerçek sayfada sağ alt köşede durur; burada kuyunun köşesinde. Dokununca sıradaki cümleyi söyler.
        </p>
        <CornerMascot
          className="absolute right-4 bottom-4 sm:right-4 sm:bottom-4"
          label="Kıyı maskotuna merhaba de"
          messages={["Merhaba!", `${CAFES.length} kafeye kahve gönderiyoruz.`, "Deneme paketi aşağıda."]}
        />
      </Cell>
    </CellGrid>
  );
}
