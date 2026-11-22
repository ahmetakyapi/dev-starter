"use client";

import { Building2, CalendarX, Plus } from "lucide-react";
import { useState } from "react";
import { AttentionList } from "@/components/ui/attention-list";
import { CopyButton } from "@/components/ui/copy-button";
import { ContactList } from "@/components/ui/contact-list";
import { DetailPanel, DetailSection } from "@/components/ui/detail-panel";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { KeyValueList } from "@/components/ui/key-value-list";
import { Money } from "@/components/ui/money";
import { Stamp } from "@/components/ui/stamp";
import { WorkspaceSwitcher } from "@/components/ui/workspace-switcher";
import { CAFES, ROAST_TOTAL, num } from "./_data";
import { Cell } from "./_ui";

/**
 * Yönetim panosu turunun kuyuları: kayıt ayrıntısı bileşenleri. Kıyı Kahve
 * kurgusu; tutarlar ve sayılar `_data.ts`ten türer. Telefon ve e-posta
 * KURGUDUR (555 numaraları, ayrılmış `.example` alanı).
 */

/* ── Veri ─────────────────────────────────────────────────────────────── */
export function VeriP() {
  return (
    <>
      <Cell file="money" name="Para Değeri" note="Tam kısım güçlü, ondalık sönük; büyük tutarlar sütunda hızlı taranır." span={2} align="stretch">
        <div className="grid content-center gap-3">
          <Money value={ROAST_TOTAL * 412.5} currency="TRY" className="text-display" />
          <Money value={-1840.9} currency="TRY" tone="danger" className="text-heading" />
        </div>
      </Cell>
      <Cell file="key-value-list" name="Anahtar Değer Listesi" note="Bir kaydın alanları; satır sonunda kopyala, değer tonu." span={2} align="stretch">
        <KeyValueList
          title="Sipariş"
          items={[
            { label: "Kanal", value: "Web Mağaza" },
            { label: "Sipariş No", value: "KK-3105", mono: true, action: <CopyButton value="KK-3105" label="Sipariş numarasını kopyala" /> },
            { label: "Bakiye", value: "1.920,00 ₺", tone: "danger" },
          ]}
        />
      </Cell>
      <Cell file="contact-list" name="İletişim Listesi" note="Tür etiketi ve kopyala; bağlantı türden üretilir, güvensiz şema düz metin." span={2} align="stretch">
        <ContactList
          items={[
            { kind: "phone", label: "Atölye", value: "0 232 555 01 10" },
            { kind: "email", value: "siparis@kiyikahve.example" },
            { kind: "address", label: "Kavurmahane", value: "Alsancak Mah. 1453 Sok. No. 7, Konak, İzmir" },
          ]}
        />
      </Cell>
      <Cell file="attention-list" name="Dikkat Listesi" note="Kim ne durumda, tek tıkla çözüm; sayaç satırlardan türer." span={3} align="stretch">
        <AttentionList
          title="Bugün Bakılacaklar"
          items={[
            { id: "a", title: "Cumartesi Kavurması", subject: CAFES[0].label, tone: "danger", detail: "Stok bitti · 2 gün" },
            { id: "b", title: "Abonelik Yenileme", tone: "warning", icon: <CalendarX aria-hidden strokeWidth={1.75} className="size-4 shrink-0" />, detail: "Geçersiz tarih · 5 Kas", action: <a href="#abonelik">Tarihi düzelt</a> },
          ]}
        />
      </Cell>
      <Cell file="detail-panel" name="Ayrıntı Paneli" note="Listenin yanında seçili kaydın özeti: başlık ve başlıklı bölümler." span={3} align="stretch">
        <DetailPanel icon={<Building2 />} title={CAFES[0].label} subtitle="Toptan müşteri · İzmir" className="shadow-none ring-1 ring-line">
          <DetailSection title="Açık Sipariş" count={num.format(3)} action={<a href="#siparis">Tümünü Gör</a>}>
            <KeyValueList items={[{ label: "Haftalık Kavurma", value: `${num.format(ROAST_TOTAL / 10)} kg` }]} />
          </DetailSection>
        </DetailPanel>
      </Cell>
    </>
  );
}

/* ── Geri bildirim ────────────────────────────────────────────────────── */
export function GeriP() {
  return (
    <Cell file="stamp" name="Damga" note="Kararın damgası: bilgi metinde, eğim ve renk süs; açılışta kısa vurma." span={3} align="center">
      <Stamp tone="success" label="Sipariş Onaylandı" date="2 Kasım 2026" />
    </Cell>
  );
}

/* ── Gezinme ──────────────────────────────────────────────────────────── */
export function GezinmeP() {
  const [v, setV] = useState("kiyi");
  return (
    <Cell file="workspace-switcher" name="Çalışma Alanı Değiştirici" note="Kenar çubuğu tepesinde hesap seçici; tek alanda düz kart." span={3} align="stretch">
      <div className="grid content-center">
        <WorkspaceSwitcher
          value={v}
          onValueChange={setV}
          workspaces={[
            { id: "kiyi", name: "Kıyı Kahve", subtitle: "Atölye" },
            { id: "kafe", name: "Kıyı Kafe", subtitle: "Bornova Şubesi" },
          ]}
          footer={<DropdownMenuItem icon={<Plus />}>Yeni Çalışma Alanı</DropdownMenuItem>}
        />
      </div>
    </Cell>
  );
}
