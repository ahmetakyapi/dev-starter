"use client";

import { CalendarDays, Calculator, Compass, CreditCard, Headphones, ListChecks, Truck } from "lucide-react";
import { useState, type ReactNode } from "react";
import { CategoryCard, CategoryGrid } from "@/components/ui/category-card";
import { IntegrationCard, IntegrationGrid } from "@/components/ui/integration-card";
import { PermissionList } from "@/components/ui/permission-list";
import { RequirementList } from "@/components/ui/requirement-list";
import { StatusList } from "@/components/ui/status-list";
import { PRODUCT } from "./_data";
import { Well, WellTitle, useApp } from "./_ui";

/**
 * Ayarlar eki (MailPulse turu): entegrasyon kartları, "Gerekenler" listesi
 * ve bağlantı izinleri; altta yardım kategorileri ve sistem durumu. Uygulama
 * adları kurgusaldır (kargo takibi, muhasebe, takvim eşitleme).
 */

type AppId = "kargo" | "muhasebe" | "takvim";
const APPS: readonly { id: AppId; name: string; category: string; description: string; icon: ReactNode; setup: string }[] = [
  { id: "kargo", name: "Kargo Takip", category: "Lojistik", description: "Gönderi durumunu siparişe işler; geciken kargo için talep açar.", icon: <Truck />, setup: "Ücretsiz · 2 dk kurulum" },
  { id: "muhasebe", name: "Muhasebe", category: "Finans", description: "Teklif onaylanınca proforma ve faturayı oluşturur.", icon: <Calculator />, setup: "Ücretsiz · 5 dk kurulum" },
  { id: "takvim", name: "Takvim Eşitleme", category: "Zaman", description: "Teslimat ve görüşmeleri kişisel takvimlerle eşitler.", icon: <CalendarDays />, setup: "Ücretsiz · 1 dk kurulum" },
];

export function IntegrationsWell() {
  const { notify } = useApp();
  const [connected, setConnected] = useState<ReadonlySet<AppId>>(new Set<AppId>(["takvim"]));
  const [syncing, setSyncing] = useState<Record<AppId, boolean>>({ kargo: true, muhasebe: true, takvim: true });
  const connect = (id: AppId) => {
    setConnected((prev) => new Set(prev).add(id));
    notify({ title: `${APPS.find((a) => a.id === id)?.name} bağlandı`, tone: "success" });
  };
  return (
    <Well labelledBy="ayar-entegrasyon" className="lg:col-span-2">
      <WellTitle id="ayar-entegrasyon" hint="Bağlanan uygulamalar siparişle ve takvimle aynı kayıttan çalışır.">
        Entegrasyonlar
      </WellTitle>
      <IntegrationGrid>
        {APPS.map((a) => (
          <IntegrationCard
            key={a.id}
            name={a.name}
            category={a.category}
            description={a.description}
            icon={a.icon}
            setup={a.setup}
            connected={connected.has(a.id)}
            lastSync="2 dk önce eşitlendi"
            syncing={syncing[a.id]}
            onToggle={(next) => setSyncing((p) => ({ ...p, [a.id]: next }))}
            onConnect={() => connect(a.id)}
          />
        ))}
      </IntegrationGrid>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <RequirementList
          title="Teklif Akışını Açmak İçin"
          items={[
            { id: "muhasebe", name: "Muhasebe", icon: <CreditCard />, status: connected.has("muhasebe") ? "connected" : "missing" },
            { id: "kargo", name: "Kargo Takip", icon: <Truck />, status: connected.has("kargo") ? "connected" : "missing" },
            { id: "takvim", name: "Takvim Eşitleme", icon: <CalendarDays />, status: connected.has("takvim") ? "connected" : "missing" },
          ]}
          onConnect={(id) => connect(id as AppId)}
        />
        <PermissionList
          title="Kargo Takip'e Verilen İzinler"
          items={[
            { id: "r1", text: "Siparişlerin teslimat adresini okur", access: "read" },
            { id: "r2", text: "Müşteri adı ve telefonunu okur", access: "read" },
            { id: "w1", text: "Siparişe kargo durumunu yazar", access: "write" },
            { id: "w2", text: "Gecikme için yeni talep açar", access: "write" },
          ]}
          footnote={`İzinleri ${PRODUCT.name} ayarlarından her an geri alabilirsin.`}
        />
      </div>
    </Well>
  );
}

export function HelpWell() {
  return (
    <Well labelledBy="ayar-yardim" className="lg:col-span-2">
      <WellTitle id="ayar-yardim" hint="Konuya göre rehberler ve hizmetin şu anki durumu.">
        Yardım Merkezi
      </WellTitle>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <CategoryGrid className="lg:grid-cols-2">
          <CategoryCard href="#ayar-yardim" tone="primary" icon={<Compass />} title="Başlangıç" description="Çalışma alanını kur, kanalları bağla, ilk talebi yanıtla." meta="12 makale" />
          <CategoryCard href="#ayar-yardim" tone="chart-2" icon={<Headphones />} title="Destek ve Gelen Kutusu" description="Öncelik, etiket, devretme ve yanıt şablonları." meta="18 makale" />
          <CategoryCard href="#ayar-yardim" tone="chart-6" icon={<ListChecks />} title="Görevler ve Takvim" description="Pano, son tarih, teslimat ve görüşme planı." meta="9 makale" />
          <CategoryCard href="#ayar-yardim" tone="warning" icon={<CreditCard />} title="Plan ve Fatura" description="Koltuk, depolama ve fatura bilgileri." meta="6 makale" />
        </CategoryGrid>
        <StatusList
          title="Sistem Durumu"
          items={[
            { id: "gelen", label: "Gelen Kutusu", status: "operational" },
            { id: "api", label: "API ve Webhook", status: "operational" },
            { id: "bildirim", label: "Bildirim Gönderimi", status: "degraded" },
            { id: "asistan", label: "Asistan", status: "operational" },
          ]}
          incident="Son olay 28 Ekim · 18 dakikada çözüldü"
        />
      </div>
    </Well>
  );
}
