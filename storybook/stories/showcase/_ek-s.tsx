"use client";

import { Bell, CalendarCheck, FileText, Inbox, ListChecks, Mail, MessageCircle, PackageX, Repeat, Truck } from "lucide-react";
import { CardFan } from "@/components/ui/card-fan";
import { DeviceFrame, DeviceRow } from "@/components/ui/device-frame";
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
import { PRODUCT, WORKSPACE } from "./_data";
import { H2 } from "./_tanitim-ek";

/**
 * Tanıtım sayfası: Manzara turu bölümleri (28 Kasım 2026). Üç bölüm:
 *   1. "Pusula'yı Dene": cetvel çizgili çerçevede sorgu şeridi + çizgili
 *      entegrasyon satırı (ürünün API'si sayfada denenir).
 *   2. "Hazır Akışlar": niyet çubuğu + kenarları buğulu şablon kartları;
 *      yanında yelpaze özet.
 *   3. "Arka Planda": çayır panelinde iş akışı izi, belge çıkarma ve iş
 *      klasörleri; altında "Cepte Pusula" telefon üçlüsü.
 * Sayfada manzara zemini en çok iki yerde (çayır paneli, telefon sahnesi).
 * Veriler Lidya Tekstil kurgusu, ÖRNEK.
 */

const TEMPLATES = [
  { title: "İade Akışı", tag: "Destek", rating: 4.8, meta: "12 Adım", price: "5 dk", scene: "lagoon" },
  { title: "Fatura Onayı", tag: "Muhasebe", rating: 4.6, meta: "8 Adım", price: "3 dk", scene: "dunes" },
  { title: "Yeni Otel Müşterisi", tag: "Satış", rating: 4.9, meta: "10 Adım", price: "4 dk", scene: "valley" },
  { title: "Haftalık Özet", tag: "Yönetim", rating: 4.7, meta: "5 Adım", price: "2 dk", scene: "summit" },
] as const;

function TrySection() {
  return (
    <section aria-labelledby="tanitim-dene-baslik" className="pb-28">
      <FrameRails top bottom marks width="max-w-6xl">
        <div className="grid justify-items-center gap-4 px-4 py-14 text-center sm:px-8 sm:py-20">
          <h2 id="tanitim-dene-baslik" className={H2}>
            {PRODUCT.name}&apos;yı Burada Dene
          </h2>
          <p className="max-w-xl text-lead text-muted">Bir ekip seç, bir soru seç; isteğin nasıl gittiğini ve ne döndüğünü gör.</p>
          <QueryDemo
            className="mt-6 w-full max-w-4xl min-w-0 text-left"
            fields={{ label: "Ekip", placeholder: "Ör. Destek", defaultValue: "Destek" }}
            presetsLabel="Hazır Bir Soru"
            presets={[
              { value: "geciken iade", label: "Geciken İade" },
              { value: "bekleyen teklif", label: "Bekleyen Teklif" },
              { value: "kargo hasarı", label: "Kargo Hasarı" },
            ]}
            request={{ method: "GET", path: "/api/v1/talepler", params: [{ key: "q", value: "{preset}" }, { key: "ekip", value: "{input}" }, { key: "adet", value: "3" }] }}
            results={[
              { title: "#1042 · Otel Mavi Koy", detail: "İade bekliyor · 2 gün", value: "0,94" },
              { title: "#1038 · Pamuk Butik", detail: "İade onaylandı · dün", value: "0,87" },
              { title: "#1021 · Kale Otel", detail: "Kısmi iade · geçen hafta", value: "0,70" },
            ]}
          />
        </div>
      </FrameRails>
      <FrameRails bottom marks width="max-w-6xl">
        <RuledRow label={`${WORKSPACE.name} Bunlarla Çalışıyor`} edges="none">
          <RuledCell icon={<Mail aria-hidden />}>E-posta</RuledCell>
          <RuledCell icon={<Truck aria-hidden />}>Kargoya</RuledCell>
          <RuledCell icon={<FileText aria-hidden />}>Defter</RuledCell>
          <RuledCell icon={<MessageCircle aria-hidden />}>Sohbet</RuledCell>
        </RuledRow>
      </FrameRails>
    </section>
  );
}

function TemplatesSection() {
  return (
    <section aria-labelledby="tanitim-akislar-baslik" className="pb-28">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div>
          <h2 id="tanitim-akislar-baslik" className={H2}>
            Anlat, Akışı O Kursun
          </h2>
          <p className="mt-3 max-w-lg text-lead text-muted">Ne olmasını istediğini yaz; {PRODUCT.name} adımları kurar, sen yalnız onaylarsın.</p>
          <PromptBar
            className="mt-7 max-w-xl"
            placeholder="Ör. iade taleplerini muhasebeye yönlendir"
            submitLabel="Akışı Kur"
            scopes={[
              { value: "e-posta", label: "E-posta", icon: <Mail aria-hidden /> },
              { value: "form", label: "Form", icon: <ListChecks aria-hidden /> },
              { value: "sohbet", label: "Sohbet", icon: <MessageCircle aria-hidden /> },
            ]}
            defaultScopes={["e-posta"]}
            onSubmit={() => {}}
          />
        </div>
        <CardFan
          className="max-md:hidden"
          label="Üç alan: talepler, görevler, raporlar"
          cards={[
            { title: "Talepler", meta: "38 Açık", tone: "chart-1" },
            { title: "Görevler", meta: "12 Bugün", tone: "chart-4" },
            { title: "Raporlar", meta: "Haftalık", badge: "Yeni", tone: "chart-2" },
          ]}
        />
      </div>
      <EdgeBlur scrollable label="Hazır akış şablonları" className="mt-10" inset="max(1rem, calc((100% - 72rem) / 2))" listClassName="gap-4 pb-4" itemClassName="w-60 shrink-0 sm:w-64">
        {TEMPLATES.map((t) => (
          <OfferCard
            key={t.title}
            title={t.title}
            tag={t.tag}
            headingLevel={3}
            media={<Wallpaper scene={t.scene} className="size-full" />}
            rating={{ value: t.rating }}
            meta={[t.meta]}
            price={t.price}
            priceUnit="kurulum"
            action={{ label: "Şablonu Aç", onClick: () => {} }}
          />
        ))}
      </EdgeBlur>
    </section>
  );
}

function BackgroundSection() {
  return (
    <section aria-labelledby="tanitim-arka-baslik" className="mx-auto grid max-w-6xl gap-10 px-4 pb-28 sm:px-6">
      <div className="max-w-2xl">
        <h2 id="tanitim-arka-baslik" className={H2}>
          Sen Uyurken Akış Yürür
        </h2>
        <p className="mt-3 text-lead text-muted">Gecikmeyi görür, müşteriye haber verir, faturayı okur; sen sabah sonucu görürsün.</p>
      </div>
      <div className="relative isolate overflow-hidden rounded-xl">
        <Wallpaper scene="meadow" className="absolute inset-0 -z-10" />
        <div className="grid gap-4 p-3 sm:p-8 md:grid-cols-2 lg:p-12">
          <div className="rounded-xl bg-on-brand/25 p-1.5 ring-1 ring-on-brand/35 backdrop-blur-md ring-inset">
            <WorkflowTrace
              title="Teslimat Gecikmesi Algılandı"
              subtitle="Talep #1042 · 2 dk önce"
              icon={<PackageX aria-hidden className="size-4" />}
              steps={[
                { title: "Sorun Algılandı", detail: "Otel Mavi Koy gecikmeyi bildirdi", time: "09.42", tone: "danger" },
                { title: "Asistan İnceledi", detail: "Sipariş, stok ve kargo okundu", time: "09.42", tone: "primary" },
                { title: "Kargo Güncellendi", detail: "Denizli deposundan yeniden çıkış", time: "09.43", tone: "success" },
              ]}
              result={{ title: "Çözüldü", detail: "Bütün kayıtlar eşitlendi", time: "2 dk" }}
              animate
              className="h-full"
            />
          </div>
          <div className="grid content-between gap-4 rounded-xl bg-on-brand/25 p-1.5 ring-1 ring-on-brand/35 backdrop-blur-md ring-inset">
            <div className="rounded-lg bg-overlay p-4 shadow-raised">
              <DocExtract
                title="Tedarikçi Faturası"
                fields={[
                  { label: "Tedarikçi", value: "Buldan Dokuma" },
                  { label: "Fatura No", value: "BD-2026-0388" },
                  { label: "Tutar", value: "₺64.250,00" },
                ]}
                animate
              />
            </div>
            <div className="flex flex-wrap items-end justify-center gap-6 px-2 pt-4 pb-2">
              <FolderCard title="Otel Mavi Koy" subtitle="Selin Başaran" status="İade" tone="chart-1" papers={3} decorative className="w-40" />
              <FolderCard title="Kale Otel" subtitle="Kerem Arıkan" status="Teklif" tone="chart-4" papers={2} decorative className="w-40 max-sm:hidden" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MobileSection() {
  return (
    <section aria-labelledby="tanitim-cep-baslik" className="pb-28">
      <div className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-xl px-4 pt-14 sm:px-6">
        <Wallpaper scene="mesh" className="absolute inset-0 -z-10" />
        <h2 id="tanitim-cep-baslik" className="text-center font-display text-heading font-semibold tracking-[-0.03em] text-on-brand sm:text-display">
          Cepte {PRODUCT.name}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-center text-lead text-on-brand/80">Bildirim gelir, tek dokunuşla onaylarsın.</p>
        <div className="relative mx-auto mt-6 h-24 max-w-xl overflow-hidden max-sm:hidden">
          <GlossArc
            className="absolute inset-x-0 top-4"
            tiles={[
              { icon: Inbox, tone: "chart-1" },
              { icon: CalendarCheck, tone: "chart-2" },
              { icon: Truck, tone: "chart-3" },
              { icon: Repeat, tone: "chart-4" },
              { icon: MessageCircle, tone: "chart-5" },
              { icon: Bell, tone: "chart-6" },
            ]}
            radius={420}
            arc={60}
            size="md"
            drift
          />
        </div>
        <div className="mt-10 h-[22rem] overflow-hidden sm:h-[26rem]">
          <DeviceRow label="Pusula mobil: gelen kutusu, ana ekran, kısayollar">
            <DeviceFrame size={210} tone="dark">
              <div inert className="grid gap-2 px-3 pt-2 text-left">
                <p className="text-small font-medium">Gelen Kutusu</p>
                {["Otel Mavi Koy", "Pamuk Butik", "Kale Otel"].map((n) => (
                  <p key={n} className="truncate rounded-md bg-page/10 px-2.5 py-2 text-micro">{n}</p>
                ))}
              </div>
            </DeviceFrame>
            <DeviceFrame size={240}>
              <div inert className="grid gap-2 px-3 pt-2 text-left">
                <p className="text-small font-semibold text-strong">Günaydın Aylin</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-surface p-2.5">
                    <p className="text-micro text-muted">Açık</p>
                    <p className="text-title font-semibold text-strong tabular-nums">38</p>
                  </div>
                  <div className="rounded-lg bg-surface p-2.5">
                    <p className="text-micro text-muted">Bugün</p>
                    <p className="text-title font-semibold text-strong tabular-nums">12</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-surface p-2.5">
                  <GlossTile icon={Bell} tone="warning" size="sm" />
                  <p className="text-micro text-body">İade onayı bekliyor</p>
                </div>
              </div>
            </DeviceFrame>
            <DeviceFrame size={210} tone="dark">
              <div inert className="grid gap-3 px-3 pt-3 text-left">
                <p className="text-small font-medium">Kısayollar</p>
                <div className="grid grid-cols-3 justify-items-center gap-3">
                  {(
                    [
                      [Inbox, "chart-1"],
                      [CalendarCheck, "chart-2"],
                      [Truck, "chart-3"],
                      [Repeat, "chart-4"],
                      [MessageCircle, "chart-5"],
                      [Bell, "chart-6"],
                    ] as const
                  ).map(([Icon, tone]) => (
                    <GlossTile key={tone} icon={Icon} tone={tone} size="sm" />
                  ))}
                </div>
              </div>
            </DeviceFrame>
          </DeviceRow>
        </div>
      </div>
    </section>
  );
}

export function ManzaraSections() {
  return (
    <>
      <TrySection />
      <TemplatesSection />
      <BackgroundSection />
      <MobileSection />
    </>
  );
}
