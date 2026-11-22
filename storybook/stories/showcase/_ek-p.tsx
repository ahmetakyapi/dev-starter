"use client";

import { Building2 } from "lucide-react";
import { useState } from "react";
import { AttentionList } from "@/components/ui/attention-list";
import { ContactList } from "@/components/ui/contact-list";
import { DetailPanel, DetailSection } from "@/components/ui/detail-panel";
import { KeyValueList } from "@/components/ui/key-value-list";
import { Money } from "@/components/ui/money";
import { Stamp } from "@/components/ui/stamp";
import { WorkspaceSwitcher } from "@/components/ui/workspace-switcher";
import { CUSTOMERS, DELAYED, ORDERS, TODAY, WORKSPACE, customer, daysBetween, num, tl, type Ticket } from "./_data";
import { Well, WellTitle, useApp } from "./_ui";

/**
 * Dördüncü görsel turunun Pusula yerleşimleri (Fixora, Brick, Noticeline ve
 * Clearbill ekranları): her bileşen gerçek bir ihtiyaca bağlı. Sayılar
 * `_data.ts`ten türer; müşteri telefon ve e-postası KURGUDUR (555 numaraları,
 * ayrılmış `.example` alanı).
 */

const DAY = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long" });

/* ── Pano: gecikenler ─────────────────────────────────────────────────── */

/** En eski geciken siparişler: kim, kaç gündür, ne tutarda; tek tıkla müşteriye yazmaya götürür. */
export function DelayedAttentionCard({ className }: { className?: string }) {
  const { navigate } = useApp();
  return (
    <Well labelledBy="pano-geciken" className={className}>
      <WellTitle id="pano-geciken" hint="En eski gecikmeden başlayarak; her satırda müşteriye yazmak tek tık.">
        Geciken Siparişler
      </WellTitle>
      <AttentionList
        title="Bugün Bakılacaklar"
        headingLevel={3}
        emptyText="Geciken sipariş yok."
        items={DELAYED.slice(0, 4).map((o) => ({
          id: o.id,
          title: customer(o.customerId).name,
          subject: o.id,
          tone: "danger" as const,
          detail: `${num.format(Math.max(0, daysBetween(o.date, TODAY)))} gündür gecikmiş · ${tl.format(o.total)}`,
          action: (
            <button type="button" onClick={() => navigate("inbox")}>
              Müşteriye Yaz
            </button>
          ),
        }))}
      />
    </Well>
  );
}

/* ── Gelen Kutusu: müşteri paneli ─────────────────────────────────────── */

/** Kurgusal iletişim: telefon 555'li, e-posta ayrılmış `.example` alanında. */
const contactOf = (id: string) => {
  const i = Math.max(0, CUSTOMERS.findIndex((c) => c.id === id));
  return { phone: `0 212 555 01 ${String(10 + i * 7).padStart(2, "0")}`, email: `satinalma@${id}.example` };
};

/** Talebin müşterisi: iletişim, sipariş özeti ve çözüldüyse karar damgası. */
export function TicketCustomerPanel({ t }: { t: Ticket }) {
  const c = customer(t.customerId);
  const mine = ORDERS.filter((o) => o.customerId === c.id);
  const spent = mine.filter((o) => o.status === "Teslim Edildi").reduce((a, o) => a + o.total, 0);
  const late = mine.filter((o) => o.status === "Gecikti").length;
  const contact = contactOf(c.id);
  return (
    <DetailPanel
      title={c.name}
      subtitle={`${c.contact} · ${c.city}`}
      icon={<Building2 />}
      headingLevel={3}
      className="shadow-none ring-1 ring-line"
    >
      <DetailSection title="İletişim" headingLevel={4}>
        <ContactList
          items={[
            { kind: "phone", label: c.contact.split(" ")[0], value: contact.phone },
            { kind: "email", value: contact.email },
            { kind: "address", label: "Teslimat", value: `${c.street}, ${c.district}, ${c.city}` },
          ]}
        />
      </DetailSection>
      <DetailSection title="Sipariş Özeti" count={mine.length} headingLevel={4}>
        <KeyValueList
          items={[
            { label: "Teslim Edilen Tutar", value: <Money value={spent} currency="TRY" /> },
            { label: "Geciken Sipariş", value: num.format(late), tone: late ? "danger" : "neutral" },
          ]}
        />
      </DetailSection>
      {t.status === "Çözüldü" ? (
        <DetailSection title="Karar" headingLevel={4}>
          <div className="grid place-items-center py-2">
            <Stamp tone="success" label="Çözüldü" date={DAY.format(t.date)} />
          </div>
        </DetailSection>
      ) : null}
    </DetailPanel>
  );
}

/* ── Ayarlar: çalışma alanları ────────────────────────────────────────── */

/** Birden çok alanı olan hesaplarda alan değiştirici; seçili alanın özeti yanında. */
export function WorkspaceWell() {
  const [current, setCurrent] = useState("lidya");
  const spaces = [
    { id: "lidya", name: WORKSPACE.name, subtitle: WORKSPACE.plan },
    { id: "deneme", name: `${WORKSPACE.name} Deneme`, subtitle: "Test Ortamı" },
  ];
  const active = spaces.find((s) => s.id === current) ?? spaces[0];
  return (
    <Well labelledBy="ayar-alanlar" className="lg:col-span-2">
      <WellTitle id="ayar-alanlar" hint="Gerçek müşteri verisi yalnız ana alanda; deneme alanı boş başlar.">
        Çalışma Alanları
      </WellTitle>
      <div className="grid gap-6 lg:grid-cols-2">
        <WorkspaceSwitcher workspaces={spaces} value={current} onValueChange={setCurrent} className="h-fit" />
        <KeyValueList
          items={[
            { label: "Açık Alan", value: active.name },
            { label: "Plan", value: active.subtitle },
            { label: "Koltuk", value: current === "lidya" ? `${WORKSPACE.seats.used} / ${WORKSPACE.seats.total}` : "1 / 2", mono: true },
          ]}
        />
      </div>
    </Well>
  );
}
