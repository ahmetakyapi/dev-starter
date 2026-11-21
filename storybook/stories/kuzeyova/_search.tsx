"use client";

import { useMemo, type ReactNode } from "react";
import { ClipboardList, Gauge, Headset, Receipt, Scale, ShieldAlert, Users, Wrench, Zap } from "lucide-react";
import type { Command } from "@/components/ui/command-palette";
import { createSlice, useDerived } from "./_core";
import { customer, PERIODS, type Period } from "./_data";
import { allCustomers } from "./_data-musteri";
import { CALL_KIND_LABEL } from "./_data-yeni";
import { allInvoices, getFinance } from "./_data-finans";
import { effectiveMeters, effectiveOutages } from "./_ops";
import { WORK_TYPE_LABEL, getApplications, getCalls, getDisputes, getLeaks, getWorkOrders, useApplications, useCalls, useDisputes, useLeaks, useWorkOrders } from "./_store";
import { fmtTl } from "./_kit";
import type { Page } from "./_ui";

/**
 * Genel arama (komut paleti) verisi: sayfalar + abone, sayaç, fatura, arıza, iş emri,
 * çağrı, başvuru, vaka, itiraz. Boş sorguda "Son Aramalar" ve "Öneriler"; yazınca
 * türe göre gruplu sonuç. Seçilen kayıt "son aramalar"a eklenir (oturum boyunca).
 */

const recents = createSlice<readonly string[]>([]);
export const useRecentSearches = () => recents.use();

type Navigate = (page: Page, params?: Record<string, string | undefined>) => void;

type Entry = { id: string; label: string; hint?: string; group: string; icon: ReactNode; keywords?: readonly string[]; to: () => void };

export function useSearchCommands({
  navigate,
  setPeriod,
  badges,
  pages,
  icons,
}: {
  navigate: Navigate;
  setPeriod: (period: Period) => void;
  badges: { invoices: number; readings: number; outages: number; calls: number; compliance: number };
  pages: readonly { id: Page; label: string }[];
  icons: Record<Page, ReactNode>;
}): { commands: Command[]; emptyCommands: Command[] } {
  const customers = useDerived(() => allCustomers());
  const meters = useDerived(() => effectiveMeters());
  const invoices = useDerived(() => allInvoices(getFinance()).filter((i) => !i.cancelled));
  const outages = useDerived(() => effectiveOutages());
  useWorkOrders();
  useCalls();
  useApplications();
  useLeaks();
  useDisputes();
  const recent = recents.use();

  return useMemo(() => {
    const remember = (key: string) => recents.set((r) => [key, ...r.filter((x) => x !== key)].slice(0, 5));

    const entries: Entry[] = [
      ...pages.map((p) => ({ id: `git-${p.id}`, label: p.label, hint: "Sayfa", group: "Sayfalar", icon: icons[p.id], to: () => navigate(p.id) })),
      { id: "yeni-musteri", label: "Yeni Abone Kaydet", hint: "Abone Kaydı", group: "Eylemler", icon: icons.register, keywords: ["abone", "kayıt", "yeni"], to: () => navigate("register") },
      { id: "geciken", label: "Geciken Faturaları Göster", hint: `${badges.invoices} fatura`, group: "Eylemler", icon: <Receipt />, keywords: ["borç", "vadesi geçen"], to: () => navigate("invoices", { status: "gecikti" }) },
      { id: "supheli", label: "Şüpheli Okumaları İncele", hint: `${badges.readings} okuma`, group: "Eylemler", icon: icons.readings, keywords: ["anomali", "endeks"], to: () => navigate("readings", { status: "supheli" }) },
      { id: "acik-ariza", label: "Açık Arızaları Göster", hint: `${badges.outages} kayıt`, group: "Eylemler", icon: <Zap />, keywords: ["kesinti", "elektrik"], to: () => navigate("outages", { status: "acik" }) },
      { id: "acik-cagri", label: "Açık Çağrıları Göster", hint: `${badges.calls} çağrı`, group: "Eylemler", icon: <Headset />, keywords: ["ihbar", "çağrı merkezi"], to: () => navigate("calls", { status: "acik" }) },
      { id: "bekleyen-onay", label: "Bekleyen Onayları Göster", hint: `${badges.compliance} kayıt`, group: "Eylemler", icon: icons.compliance, keywords: ["iki göz", "onay"], to: () => navigate("compliance", { tab: "onaylar" }) },
      ...PERIODS.map((p) => ({ id: `donem-${p.value}`, label: `Dönem: ${p.label}`, group: "Pano", icon: icons.dashboard, keywords: ["ay", "dönem"], to: () => { setPeriod(p.value); navigate("dashboard"); } })),
      ...customers.map((c) => ({ id: c.id, label: `${c.id} · ${c.name}`, hint: `Tesisat ${c.installation} · ${c.district}`, group: "Aboneler", icon: <Users />, keywords: [c.installation, c.district], to: () => navigate("customers", { id: c.id }) })),
      ...meters.map((m) => ({ id: m.id, label: m.serial, hint: `${customer(m.customerId).name} · ${m.id}`, group: "Sayaçlar", icon: <Gauge />, keywords: [m.id, customer(m.customerId).installation], to: () => navigate("meters", { id: m.id }) })),
      ...invoices.map((i) => ({ id: i.id, label: i.id, hint: `${customer(i.customerId).name} · ${fmtTl(i.total)}`, group: "Faturalar", icon: <Receipt />, keywords: [i.customerId], to: () => navigate("invoices", { id: i.id }) })),
      ...outages.map((o) => ({ id: o.id, label: o.id, hint: `${o.cause} · ${o.affected} abone`, group: "Arızalar", icon: <Zap />, keywords: [o.substationId], to: () => navigate("outages", { id: o.id }) })),
      ...getWorkOrders().map((w) => ({ id: w.id, label: w.id, hint: WORK_TYPE_LABEL[w.type] ?? w.type, group: "İş Emirleri", icon: <Wrench />, to: () => navigate("workorders", { id: w.id }) })),
      ...getCalls().map((c) => ({ id: c.id, label: c.id, hint: `${CALL_KIND_LABEL[c.kind]}${c.customerId ? ` · ${customer(c.customerId).name}` : ""}`, group: "Çağrılar", icon: <Headset />, to: () => navigate("calls", { id: c.id }) })),
      ...getApplications().map((a) => ({ id: a.id, label: a.id, hint: a.applicant, group: "Başvurular", icon: <ClipboardList />, keywords: [a.address], to: () => navigate("applications", { id: a.id }) })),
      ...getLeaks().map((l) => ({ id: l.id, label: l.id, hint: `Kaçak vakası · ${customer(l.customerId).name}`, group: "Kaçak Vakaları", icon: <ShieldAlert />, to: () => navigate("leaks", { id: l.id }) })),
      ...getDisputes().map((d) => ({ id: d.id, label: d.id, hint: `İtiraz · ${customer(d.customerId).name}`, group: "İtirazlar", icon: <Scale />, to: () => navigate("disputes", { id: d.id }) })),
    ];

    const commands: Command[] = entries.map((e) => ({
      id: e.id,
      label: e.label,
      hint: e.hint,
      group: e.group,
      icon: e.icon,
      keywords: e.keywords,
      onSelect: () => {
        remember(e.id);
        e.to();
      },
    }));

    const byId = new Map(commands.map((c) => [c.id, c]));
    const last: Command[] = recent
      .map((id) => byId.get(id))
      .filter((c): c is Command => Boolean(c))
      .map((c) => ({ ...c, id: `son-${c.id}`, group: "Son Aramalar" }));
    const suggestions: Command[] = ["geciken", "supheli", "acik-ariza", "acik-cagri", "yeni-musteri", "bekleyen-onay"]
      .map((id) => byId.get(id))
      .filter((c): c is Command => Boolean(c))
      .map((c) => ({ ...c, id: `oneri-${c.id}`, group: "Öneriler" }));
    const quickPages: Command[] = ["git-dashboard", "git-customers", "git-meters", "git-invoices", "git-outages", "git-workorders"]
      .map((id) => byId.get(id))
      .filter((c): c is Command => Boolean(c))
      .map((c) => ({ ...c, id: `sayfa-${c.id}`, group: "Sayfalar" }));
    return { commands, emptyCommands: [...last, ...suggestions, ...quickPages] };
  }, [navigate, setPeriod, badges, pages, icons, customers, meters, invoices, outages, recent, getWorkOrders(), getCalls(), getApplications(), getLeaks(), getDisputes()]);
}
