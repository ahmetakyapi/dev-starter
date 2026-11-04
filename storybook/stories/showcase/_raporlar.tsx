"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, FileSpreadsheet, FileText } from "lucide-react";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Avatar } from "@/components/ui/avatar";
import { BannerAlert } from "@/components/ui/banner-alert";
import { Carousel } from "@/components/ui/carousel";
import { ChartCard } from "@/components/ui/chart-card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { LineChart } from "@/components/ui/line-chart";
import { LoadingMark } from "@/components/ui/loading-mark";
import { Meter, SegmentedMeter } from "@/components/ui/meter";
import { Progress } from "@/components/ui/progress";
import { Rating } from "@/components/ui/rating";
import { ScatterChart } from "@/components/ui/scatter-chart";
import { Select } from "@/components/ui/select";
import { Skeleton, SkeletonRow, SkeletonText } from "@/components/ui/skeleton";
import { Sparkline } from "@/components/ui/sparkline";
import { Spinner } from "@/components/ui/spinner";
import { SplitButton } from "@/components/ui/split-button";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/Button";
import {
  CHANNELS,
  CHANNEL_SERIES,
  MONTHLY_TARGET,
  PERIODS,
  REPORT_FAQ,
  SAVED_REPORTS,
  TEAM,
  TICKETS,
  WORKSPACE,
  num,
  pct,
  periodStats,
  survey,
  tl,
  type Customer,
  type Period,
} from "./_data";
import { PageBar, Well, WellTitle, useApp } from "./_ui";

type Row = { customer: Customer; orders: number; revenue: number };

const TL_COMPACT: Intl.NumberFormatOptions = { style: "currency", currency: "TRY", notation: "compact", maximumFractionDigits: 1 };

const PERIOD_NAMES: Record<Period, string> = { hafta: "Son 7 Gün", ay: "Son 30 Gün", yil: "Son 12 Ay" };

function SalesTable({ rows, total }: { rows: readonly Row[]; total: number }) {
  const columns: Column<Row>[] = [
    {
      key: "musteri",
      header: "Müşteri",
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          <Avatar name={r.customer.name} size="sm" />
          <span className="grid grid-cols-1">
            <span className="font-medium text-strong">{r.customer.name}</span>
            <span className="text-small text-muted">{r.customer.city}</span>
          </span>
        </span>
      ),
    },
    { key: "siparis", header: "Sipariş", numeric: true, render: (r) => num.format(r.orders) },
    { key: "sepet", header: "Ort. Sepet", numeric: true, render: (r) => tl.format(Math.round(r.revenue / r.orders)) },
    { key: "pay", header: "Pay", numeric: true, render: (r) => `%${pct(r.revenue, total).toLocaleString("tr-TR")}` },
    { key: "ciro", header: "Ciro", numeric: true, render: (r) => tl.format(r.revenue), bar: { value: (r) => r.revenue } },
  ];
  return <DataTable caption="Müşteri Bazında Ciro" columns={columns} rows={rows} rowKey={(r) => r.customer.id} minWidth="38rem" density="compact" stickyFirst={false} />;
}

function SalesSkeleton() {
  return (
    <div aria-busy="true" className="grid grid-cols-1 gap-3 rounded-xl bg-surface p-4">
      <p className="sr-only">Rapor yükleniyor</p>
      <Skeleton className="h-4 w-40" />
      {Array.from({ length: 6 }, (_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export function RaporlarPage() {
  const { period, setPeriod, params, notify } = useApp();
  const s = useMemo(() => periodStats(period), [period]);
  const month = useMemo(() => periodStats("ay"), []);
  const [tab, setTab] = useState(params.tab ?? "sales");
  const forceLoading = params.preview === "loading";
  const [loading, setLoading] = useState(false);
  const first = useRef(true);
  const [exporting, setExporting] = useState<"idle" | "pending" | "running" | "done">("idle");
  const [format, setFormat] = useState<"csv" | "xlsx" | "pdf">("csv");
  const [upload, setUpload] = useState<{ name: string; value: number } | null>(null);

  // Dönem değişince tablo kısa bir süre iskelet gösterir (sunucudan geliyormuş gibi).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setLoading(true);
    const id = window.setTimeout(() => setLoading(false), 650);
    return () => window.clearTimeout(id);
  }, [period]);

  useEffect(() => {
    if (exporting === "pending") {
      const id = window.setTimeout(() => setExporting("running"), 700);
      return () => window.clearTimeout(id);
    }
    if (exporting === "running") {
      const id = window.setTimeout(() => {
        setExporting("done");
        notify({ tone: "success", title: "Dışa Aktarma Hazır", body: `${num.format(s.orderCount)} sipariş · siparisler-${period}.${format}` });
      }, 1400);
      return () => window.clearTimeout(id);
    }
  }, [exporting, notify, period, s.orderCount, format]);

  useEffect(() => {
    if (!upload || upload.value >= 100) return;
    const id = window.setTimeout(() => setUpload((u) => (u ? { ...u, value: Math.min(100, u.value + 20) } : u)), 300);
    return () => window.clearTimeout(id);
  }, [upload]);

  const showSkeleton = loading || forceLoading;
  const openByMember = TEAM.map((m) => ({ m, open: TICKETS.filter((t) => t.assignee === m.id && t.status !== "Çözüldü").length }));
  const channelTotal = s.channels.reduce((a, c) => a + c.orders, 0);
  const poll = survey(s.tickets);

  // İlk dört müşterinin birikimli cirosu: çizgilerin son noktası tablodaki ciro.
  const top = s.byCustomer.slice(0, 4);
  let running = top.map(() => 0);
  const cumulative = s.window.buckets.map((b) => {
    running = top.map((r, i) => running[i] + s.orders.filter((o) => o.customerId === r.customer.id && o.date >= b.start && o.date < b.end).reduce((a, o) => a + o.total, 0));
    return running;
  });
  // Müşteri haritası: tablonun üç sütunu (sipariş, ortalama sepet, ciro); renk en çok kullandığı kanal.
  const points = s.byCustomer.map((r) => {
    const own = s.orders.filter((o) => o.customerId === r.customer.id);
    const channel = CHANNELS.reduce((a, c) => (own.filter((o) => o.channel === c).length > own.filter((o) => o.channel === a).length ? c : a));
    return { label: r.customer.name, x: r.orders, y: Math.round(r.revenue / r.orders), size: r.revenue, category: channel };
  });

  const slides = SAVED_REPORTS.map((r) => {
    const rs = periodStats(r.period);
    return (
      <article key={r.id} className="flex h-full flex-col rounded-xl bg-overlay p-5 shadow-raised">
        <p className="text-micro font-semibold text-muted">
          {r.tag} · {PERIOD_NAMES[r.period]}
        </p>
        <h3 className="mt-1 text-title font-semibold text-strong">{r.title}</h3>
        <p className="mt-1 text-base text-body">{r.body}</p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="text-small text-muted">Ciro</p>
            <p className="text-base font-semibold text-strong tabular-nums">{tl.format(rs.revenue)}</p>
          </div>
          <Sparkline title={`${r.title} ciro eğilimi`} values={rs.revenueSeries} width={110} height={34} tone="auto" />
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => {
            setPeriod(r.period);
            setTab(r.tag === "Destek" ? "support" : "sales");
            document.getElementById("rapor-sekmeler")?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          Raporu Aç
          <ArrowUpRight aria-hidden />
        </Button>
      </article>
    );
  });

  const satis = (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="grid grid-cols-1 min-w-0 content-start gap-3 lg:col-span-2">
        {showSkeleton ? <SalesSkeleton /> : <SalesTable rows={s.byCustomer} total={s.revenue} />}
        <p className="flex flex-wrap justify-between gap-2 px-1 text-small text-muted">
          <span>
            {num.format(s.orderCount)} sipariş · {s.window.caption}
          </span>
          <span className="font-semibold text-strong tabular-nums">Toplam {tl.format(s.revenue)}</span>
        </p>
      </div>
      <Well labelledBy="rapor-hedef">
        <WellTitle id="rapor-hedef" hint="Hedef ve kota ölçüleri dönemden bağımsız.">
          Hedefler
        </WellTitle>
        <div className="grid grid-cols-1 gap-6">
          <Meter
            label="Aylık Ciro Hedefi"
            value={month.revenue}
            max={MONTHLY_TARGET}
            valueText={`${tl.format(month.revenue)} / ${tl.format(MONTHLY_TARGET)}`}
            hint="Son 30 gün; hedefe yaklaştıkça iyi."
            inverted
            thresholds={{ warn: 0.4, danger: 0.6 }}
            statusText={{ warn: "Hedefin Gerisinde", danger: "Hedefin Çok Gerisinde" }}
          />
          <SegmentedMeter
            label={`Kanal Dağılımı · ${PERIOD_NAMES[period]}`}
            max={channelTotal}
            format={(n) => `${num.format(n)} sipariş`}
            segments={s.channels.map((c) => ({ label: c.channel, value: c.orders, series: c.series }))}
          />
          <Meter
            label="Ekip Koltukları"
            value={WORKSPACE.seats.used}
            max={WORKSPACE.seats.total}
            valueText={`${WORKSPACE.seats.used} / ${WORKSPACE.seats.total}`}
            statusText={{ warn: "Az Koltuk Kaldı", danger: "Bir Koltuk Kaldı" }}
          />
          <Meter
            label="Dosya Alanı"
            value={WORKSPACE.storage.usedGb}
            max={WORKSPACE.storage.totalGb}
            valueText={`${WORKSPACE.storage.usedGb.toLocaleString("tr-TR")} GB / ${WORKSPACE.storage.totalGb} GB`}
          />
        </div>
      </Well>
      <div className="grid grid-cols-1 gap-4 lg:col-span-3 lg:grid-cols-2">
        <ChartCard id="rapor-birikim" label={`İlk Dört Müşteri · Birikimli Ciro`} value={tl.format(top.reduce((a, r) => a + r.revenue, 0))}>
          <LineChart
            title="İlk Dört Müşterinin Birikimli Cirosu"
            labels={s.window.buckets.map((b) => b.label)}
            valueFormat={TL_COMPACT}
            series={top.map((r, i) => ({ label: r.customer.name, values: cumulative.map((c) => c[i]), series: ([1, 2, 3, 5] as const)[i] }))}
          />
        </ChartCard>
        <ChartCard id="rapor-harita" label="Müşteri Haritası" value={`${num.format(points.length)} müşteri`}>
          <ScatterChart
            title="Sipariş Sayısına Göre Ortalama Sepet"
            points={points}
            categories={CHANNELS.map((c) => ({ key: c, label: c, series: CHANNEL_SERIES[c] }))}
            x={{ label: "Sipariş", unit: "sipariş" }}
            y={{ label: "Ortalama Sepet", format: { style: "currency", currency: "TRY", maximumFractionDigits: 0 } }}
            size={{ label: "Ciro", format: { style: "currency", currency: "TRY", maximumFractionDigits: 0 } }}
            height="h-60"
          />
        </ChartCard>
      </div>
    </div>
  );

  const destek = (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Well labelledBy="rapor-yuk">
        <WellTitle id="rapor-yuk" hint="Açık ve bekleyen talepler, kişi başı en fazla 4.">
          Ekip Yükü
        </WellTitle>
        <ul className="grid grid-cols-1 gap-4">
          {openByMember.map(({ m, open }) => (
            <li key={m.id} className="flex items-center gap-3">
              <Avatar name={m.name} size="sm" />
              <Meter
                className="flex-1"
                label={`${m.name} · ${m.role}`}
                value={open}
                max={4}
                valueText={`${open} / 4`}
                thresholds={{ warn: 0.5, danger: 0.75 }}
                statusText={{ warn: "Yoğun", danger: "Çok Yoğun" }}
              />
            </li>
          ))}
        </ul>
      </Well>
      <Well labelledBy="rapor-sss">
        <WellTitle id="rapor-sss" hint={`${num.format(s.ticketCount)} Talep · ${s.window.caption}`}>
          Rapor Notları
        </WellTitle>
        <Accordion variant="well" className="bg-transparent p-0">
          {REPORT_FAQ.map((f, i) => (
            <AccordionItem key={f.q} title={f.q} defaultOpen={i === 0} exclusive="rapor-sss">
              {f.a}
            </AccordionItem>
          ))}
        </Accordion>
        <div className="mt-auto grid grid-cols-1 gap-4 pt-6">
          <Progress label="İlk Yanıt 30 Dakika İçinde" value={pct(s.tickets.filter((t) => (t.firstResponseMin ?? 999) <= 30).length, s.ticketCount, 0)} hint="Hedef %80" size="sm" />
          <Progress label="Çözülen Talepler" value={pct(s.quality.resolved, s.ticketCount, 0)} hint="Kapanan ya da onaylanan" size="sm" />
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg bg-overlay px-3 py-2.5 shadow-raised">
            <span className="min-w-0">
              <span className="block text-base font-medium text-strong">Kapanış Anketi</span>
              <span className="block text-small text-muted">Çözülen taleplerde müşteri puanı</span>
            </span>
            <Rating value={poll.average} count={poll.count} showValue size="sm" />
          </div>
        </div>
      </Well>
    </div>
  );

  const aktar = (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Well labelledBy="rapor-disa">
        <WellTitle id="rapor-disa" hint={`${PERIOD_NAMES[period]} · ${num.format(s.orderCount)} Sipariş`}>
          Dışa Aktar
        </WellTitle>
        <div className="grid grid-cols-1 flex-1 place-items-center gap-4 rounded-lg bg-overlay p-6 text-center shadow-raised">
          {exporting === "running" ? (
            <LoadingMark size="lg" label="Dosya hazırlanıyor" showLabel />
          ) : (
            <span aria-hidden className="grid grid-cols-1 size-12 place-items-center rounded-lg bg-surface text-strong [&_svg]:size-5">
              <FileSpreadsheet strokeWidth={1.75} />
            </span>
          )}
          <Progress
            className="w-full"
            label={`siparisler.${format}`}
            value={exporting === "done" ? 100 : exporting === "running" ? null : 0}
            hint={exporting === "done" ? "Dosya indirilmeye hazır." : "Sipariş no, tarih, müşteri, kanal, tutar, durum"}
          />
          <SplitButton
            disabled={exporting === "pending" || exporting === "running"}
            icon={exporting === "pending" ? <Spinner size="sm" tone="current" label={null} /> : null}
            onClick={() => {
              setFormat("csv");
              setExporting("pending");
            }}
            items={[
              { label: "Excel (.xlsx)", icon: <FileSpreadsheet />, onSelect: () => (setFormat("xlsx"), setExporting("pending")) },
              { label: "PDF Özeti", icon: <FileText />, onSelect: () => (setFormat("pdf"), setExporting("pending")) },
            ]}
          >
            {exporting === "pending" ? "Sıraya Alınıyor" : exporting === "done" ? "Yeniden Oluştur" : "CSV Oluştur"}
          </SplitButton>
        </div>
      </Well>
      <Well labelledBy="rapor-ice">
        <WellTitle id="rapor-ice" hint="Eski sistemden sipariş geçmişi; yalnızca CSV ve XLSX.">
          İçe Aktar
        </WellTitle>
        <div className="grid grid-cols-1 flex-1 content-start gap-4">
          <div className="rounded-lg bg-overlay p-2 shadow-raised">
          <FileDropzone
            label="Sipariş Dosyası Yükle"
            accept={[".csv", ".xlsx", "text/csv"]}
            maxBytes={5 * 1024 * 1024}
            onFiles={(ok) => {
              if (ok[0]) setUpload({ name: ok[0].name, value: 0 });
            }}
          />
          </div>
          {upload ? (
            upload.value >= 100 ? (
              <BannerAlert tone="success" title={`${upload.name} İçe Aktarıldı`} description="Satırlar eşleştirildi; çakışan sipariş numarası yok." announce onDismiss={() => setUpload(null)} />
            ) : (
              <Progress label={`${upload.name} yükleniyor`} value={upload.value} />
            )
          ) : (
            <SkeletonText lines={2} className="opacity-60" />
          )}
        </div>
      </Well>
    </div>
  );

  return (
    <div className="flex min-h-full flex-col">
      <PageBar
        title="Raporlar"
        description={`${PERIOD_NAMES[period]} · ${s.window.caption}`}
        actions={
          <Select
            label="Dönem"
            hideLabel
            value={period}
            onValueChange={(v) => v && setPeriod(v as Period)}
            items={PERIODS.map((p) => ({ value: p.value, label: PERIOD_NAMES[p.value] }))}
            className="w-40"
          />
        }
      />
      <div className="grid grid-cols-1 gap-6 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-3 rounded-xl bg-surface p-4 sm:p-5">
          <h2 className="text-base font-semibold text-strong">Hazır Raporlar</h2>
          <Carousel label="Hazır Raporlar" slides={slides} />
        </div>

        <div id="rapor-sekmeler" className="scroll-mt-4">
          <Tabs
            aria-label="Rapor Türü"
            value={tab}
            onValueChange={setTab}
            items={[
              { value: "sales", label: "Satış", panel: <div className="pt-4">{satis}</div> },
              { value: "support", label: "Destek", panel: <div className="pt-4">{destek}</div> },
              { value: "export", label: "Dışa ve İçe Aktar", panel: <div className="pt-4">{aktar}</div> },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
