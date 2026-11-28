"use client";

import { Bean, Coffee, Gift, PackageCheck, Receipt, Repeat, ShoppingBag, Store, Truck } from "lucide-react";
import { CardFan } from "@/components/ui/card-fan";
import { DeviceFrame } from "@/components/ui/device-frame";
import { DocExtract } from "@/components/ui/doc-extract";
import { EdgeBlur } from "@/components/ui/edge-blur";
import { FolderCard } from "@/components/ui/folder-card";
import { FrameRails, RuledCell, RuledRow } from "@/components/ui/frame-rails";
import { GlossArc, GlossTile } from "@/components/ui/gloss-tile";
import { OfferCard } from "@/components/ui/offer-card";
import { PromptBar } from "@/components/ui/prompt-bar";
import { QueryDemo } from "@/components/ui/query-demo";
import { Wallpaper } from "@/components/ui/wallpaper";
import { WorkflowTrace } from "@/components/ui/workflow-trace";
import { BRAND, CAFES } from "./_data";
import { Cell } from "./_ui";

/**
 * Manzara turunun kuyuları (28 Kasım 2026): ürünü manzaranın içinde
 * sergileyen tanıtım parçaları. Kıyı Kahve kurgusu; veriler ÖRNEK.
 * Görseller `wallpaper` illüstrasyonları, fotoğraf yok.
 */

const BLENDS = [
  { title: "Kıyı Harmanı", tag: "Harman", rating: 4.8, reviews: 312, meta: "Orta Kavrum", price: "₺690", scene: "dunes" },
  { title: "Ege Filtre", tag: "Filtre", rating: 4.6, reviews: 188, meta: "Açık Kavrum", price: "₺540", scene: "lagoon" },
  { title: "Dağ Köken", tag: "Tek Köken", rating: 4.9, reviews: 94, meta: "Etiyopya", price: "₺820", scene: "valley" },
  { title: "Akşam Espresso", tag: "Espresso", rating: 4.7, reviews: 256, meta: "Koyu Kavrum", price: "₺760", scene: "summit" },
] as const;

export function TanitimS() {
  return (
    <>
      <Cell file="query-demo" name="Sorgu Deneme Şeridi" note="Çip seç, istek satırı anında değişir; Çalıştır örnek sonucu getirir." span={6} size="lg" align="stretch">
        <QueryDemo
          fields={{ label: "Şube", placeholder: "Ör. Bornova", defaultValue: "Bornova" }}
          presetsLabel="Ne Arıyorsun"
          presets={[
            { value: "bekleyen sipariş", label: "Bekleyen Sipariş" },
            { value: "stok azaldı", label: "Stok Azaldı" },
            { value: "geç teslim", label: "Geç Teslim" },
          ]}
          request={{ method: "GET", path: "/api/v1/siparis", params: [{ key: "q", value: "{preset}" }, { key: "sube", value: "{input}" }, { key: "adet", value: "3" }] }}
          results={[
            { title: "KK-3192 · Alsancak Demleme", detail: "24 kg · hazırlanıyor", value: "0,93" },
            { title: "KK-3189 · Urla Bağ Evi", detail: "12 kg · gecikti", value: "0,81" },
            { title: "KK-3186 · Bornova Kitap Kafe", detail: "18 kg · teslim edildi", value: "0,64" },
          ]}
        />
      </Cell>
      <Cell file="prompt-bar" name="Niyet Çubuğu" note="Yaz, kapsamı aç kapa, gönder; kahramanın tek odağı." span={3}>
        <PromptBar
          placeholder="Ör. her cuma Urla'ya 12 kg gönder"
          submitLabel="Planla"
          scopes={[
            { value: "toptan", label: "Toptan", icon: <Store aria-hidden /> },
            { value: "abone", label: "Abonelik", icon: <Repeat aria-hidden /> },
            { value: "hediye", label: "Hediye", icon: <Gift aria-hidden /> },
          ]}
          defaultScopes={["toptan"]}
          onSubmit={() => {}}
        />
      </Cell>
      <Cell file="frame-rails" name="Çizgili Çerçeve" note="Cetvel rayları ve kıl çizgiyle bölünmüş araç satırı." span={3} align="stretch">
        <FrameRails top bottom marks width="max-w-full">
          <RuledRow label="Birlikte Çalışır" edges="none" cellBg="var(--color-surface)">
            <RuledCell icon={<Truck aria-hidden />}>Kargoya</RuledCell>
            <RuledCell icon={<Receipt aria-hidden />}>Defter</RuledCell>
            <RuledCell icon={<ShoppingBag aria-hidden />}>Mağaza</RuledCell>
          </RuledRow>
        </FrameRails>
      </Cell>
      <Cell file="edge-blur" name="Kenar Buğusu" note="Şeridin kenarları kademeli buğulanır; kaydırdıkça kenar açılır." span={4} size="lg" align="stretch">
        <EdgeBlur scrollable label="Harmanlar" fadeColor="var(--color-surface)" itemClassName="w-56 shrink-0">
          {BLENDS.map((blend) => (
            <OfferCard
              key={blend.title}
              title={blend.title}
              tag={blend.tag}
              headingLevel={3}
              media={<Wallpaper scene={blend.scene} className="size-full" />}
              rating={{ value: blend.rating, reviews: blend.reviews }}
              meta={[blend.meta]}
              price={blend.price}
              priceUnit="/ 250 g"
              action={{ label: "Sepete Ekle", onClick: () => {} }}
            />
          ))}
        </EdgeBlur>
      </Cell>
      <Cell file="offer-card" name="Teklif Kartı" note="Görsel, künye, kaydet, puan, fiyat ve tam genişlik eylem." span={2} size="lg">
        <div className="mx-auto w-56">
          <OfferCard
            title="Urla Bağ Evi"
            tag="Kafe"
            headingLevel={3}
            media={<Wallpaper scene="meadow" className="size-full" />}
            rating={{ value: 4.9, reviews: 128 }}
            meta={["Urla"]}
            price="₺1.150"
            priceUnit="/ ay"
            action={{ label: "Aboneliği Gör", onClick: () => {} }}
          />
        </div>
      </Cell>
      <Cell file="folder-card" name="Klasör Kartı" note="Üzerine gel: ön kapak yatar, kağıtlar yükselir." span={2}>
        <FolderCard title="Bahar Menüsü" subtitle="Ece Doğan" status="Taslak" tone="chart-3" papers={3} href="#b-folder-card" className="mx-auto w-52" />
      </Cell>
      <Cell file="card-fan" name="Yelpaze Kartlar" note="Bölüm başlığının yanında özet; üzerine gelince açılır." span={2}>
        <CardFan
          className="mx-auto"
          label="Üç koleksiyon: şubeler, harmanlar, abonelikler"
          cards={[
            { title: "Şubeler", meta: `${CAFES.length} Kafe`, tone: "chart-1" },
            { title: "Harmanlar", meta: "6 Çeşit", tone: "chart-4" },
            { title: "Abonelik", meta: "212 Üye", badge: "Yeni", tone: "chart-2" },
          ]}
        />
      </Cell>
      <Cell file="gloss-tile" name="Parlak Karo" note="Yumuşak 3B ikon karosu; yay şeridinde yavaşça döner." span={2}>
        <div className="grid justify-items-center gap-4">
          <div className="relative h-28 w-full overflow-hidden">
            <GlossArc
              className="absolute inset-x-0 top-2"
              tiles={[
                { icon: Coffee, tone: "chart-1" },
                { icon: Bean, tone: "chart-2" },
                { icon: Truck, tone: "chart-3" },
                { icon: Gift, tone: "chart-4" },
                { icon: PackageCheck, tone: "chart-5" },
              ]}
              radius={200}
              arc={100}
              size="sm"
            />
          </div>
          <GlossTile icon={Coffee} tone="primary" size="lg" label={`${BRAND.name} uygulaması`} />
        </div>
      </Cell>
      <Cell file="device-frame" name="Telefon Çerçevesi" note="Mobil yüz canlı bileşenle; durum çubuğu, ada, ev çubuğu." span={2} size="lg">
        <DeviceFrame size={200} label={`${BRAND.name} uygulaması, sipariş ekranı`} className="mx-auto">
          <div inert className="grid gap-2 px-3 pt-2 text-left">
            <p className="text-small font-semibold text-strong">Günaydın Selin</p>
            <div className="rounded-lg bg-surface p-2.5">
              <p className="text-micro text-muted">Bu Hafta</p>
              <p className="text-title font-semibold text-strong tabular-nums">186 kg</p>
            </div>
            {CAFES.slice(0, 3).map((cafe) => (
              <p key={cafe.value} className="truncate rounded-md bg-surface px-2.5 py-2 text-micro text-body">
                {cafe.label}
              </p>
            ))}
          </div>
        </DeviceFrame>
      </Cell>
    </>
  );
}

export function AjanS() {
  return (
    <>
      <Cell file="workflow-trace" name="İş Akışı İzi" note="Bir siparişin adım adım izi; görününce dolar, sonuç kutusuyla biter." span={3} align="stretch">
        <WorkflowTrace
          title="Kargo Gecikmesi Algılandı"
          subtitle="KK-3189 · 4 dk önce"
          icon={<Truck aria-hidden className="size-4" />}
          steps={[
            { title: "Gecikme Algılandı", detail: "Çiğli aktarmada bir gün bekledi", time: "10.12", tone: "danger" },
            { title: "Asistan İnceledi", detail: "Stok ve kargo kaydı okundu", time: "10.12", tone: "primary" },
            { title: "Urla Bağ Evi'ne Haber Verildi", detail: "Yeni teslim: yarın 11.00", time: "10.14", tone: "warning" },
          ]}
          result={{ title: "Çözüldü", detail: "Kargo ve fatura eşitlendi", time: "10.15" }}
          animate
        />
      </Cell>
      <Cell file="doc-extract" name="Belge Çıkarma" note="Faturadan alanlar sırayla okunur; bitince Hazır." span={3}>
        <DocExtract
          title="Tedarikçi Faturası"
          fields={[
            { label: "Tedarikçi", value: "Ege Çiğ Kahve" },
            { label: "Fatura No", value: "EÇK-2026-0412" },
            { label: "Tarih", value: "26 Kasım 2026" },
            { label: "Tutar", value: "₺48.600,00" },
          ]}
          animate
        />
      </Cell>
    </>
  );
}
