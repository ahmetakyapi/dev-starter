"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Camera, CheckCircle2, CloudOff, CloudUpload, Flag, MapPin, PlayCircle, Route as RouteIcon, TriangleAlert, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { NumberField } from "@/components/ui/number-field";
import { RadioGroup } from "@/components/ui/radio-group";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { TickMeter } from "@/components/ui/tick-meter";
import { audit } from "./_audit";
import { nextId, useDerived } from "./_core";
import { CURRENT_PERIOD, TODAY_KEY, customer, dayLabel, type Meter, type ReadingFlag } from "./_data";
import { READER_NAMES, buildRoutesLive, readingUi } from "./_data-sayac";
import { SKIP_REASONS, checkReading, fieldState, type FieldQueueItem, type ReadingInput } from "./_data-saha";
import { effectiveReadings, enterReading, useMeterOps } from "./_ops";
import { useCan } from "./_permissions";
import { Metric, fmtKwh, fmtNum, fmtPct } from "./_kit";
import { MetricStrip, PageBody, PageHead, Panel, href, useApp, type PageProps } from "./_ui";

/**
 * Saha Okuma: okuyucunun CEP ekranı (390 piksel önce). Masaüstünde de dar bir
 * cihaz sütunu olarak çizilir; yanında tur özeti durur.
 *
 * Akış: tur → durak kartı → endeks formu (anlık doğrulama Okumalar ile aynı kural)
 * → zorunlu fotoğraf → kaydet. Erişilemeyen durak için neden seçilir. ÇEVRİMDIŞI
 * modda yazılanlar kuyruğa düşer ve yalnız "Senkronla" ile depoya (`enterReading`)
 * gider; sayfa değişince bekleyen kayıtlar kaybolmaz. Tur, bekleyen kayıt varken kapanmaz;
 * kapanışta plan–gerçek fark özeti çıkar.
 */

const Mono = ({ children }: { children: ReactNode }) => <span className="kz-mono">{children}</span>;

const expectedOf = (meterId: string, before?: string) => {
  const prior = effectiveReadings().filter((r) => r.meterId === meterId && r.status !== "bekliyor" && !r.flags.length && (!before || r.period < before)).slice(-3);
  return prior.length ? Math.round(prior.reduce((s, r) => s + r.usage.total, 0) / prior.length) : 0;
};

export function SahaPage({ go }: PageProps) {
  const { notify } = useApp();
  const canRead = useCan("okuma");
  const field = fieldState.use();
  const ui = readingUi.use();
  const ops = useMeterOps();
  const readings = useDerived(effectiveReadings);
  const routes = useDerived(() => buildRoutesLive(effectiveReadings(), new Set(Object.entries(ops).filter(([, o]) => o.inRoute).map(([id]) => id))), [ops]);
  const route = routes.find((r) => r.regionId === (field.regionId ?? routes[0].regionId)) ?? routes[0];
  const reader = ui.readers[route.regionId] ?? route.reader;
  const [active, setActive] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const closed = field.closed.includes(route.regionId);

  const queuedMeters = new Map(field.queue.map((q) => [q.meterId, q]));
  type Stop = Route0["meters"][number] & { n: number; state: "bekliyor" | "okundu" | "kuyrukta" | "erisilemedi" };
  const stops: Stop[] = route.meters.map((m, i) => {
    const q = queuedMeters.get(m.meter.id);
    const state: Stop["state"] = q ? "kuyrukta" : field.skipped[m.meter.id] ? "erisilemedi" : m.done ? "okundu" : "bekliyor";
    return { ...m, n: i + 1, state };
  });
  const total = stops.length;
  const done = stops.filter((s) => s.state === "okundu").length;
  const queued = stops.filter((s) => s.state === "kuyrukta").length;
  const skipped = stops.filter((s) => s.state === "erisilemedi").length;
  const waiting = stops.filter((s) => s.state === "bekliyor");
  const anomalies = readings.filter((r) => r.period === CURRENT_PERIOD && r.status === "supheli" && stops.some((s) => s.meter.id === r.meterId)).length;
  const activeStop = stops.find((s) => s.meter.id === active);

  const sync = () => {
    if (field.offline) return notify({ title: "Çevrimdışı", body: "Bağlantıyı açıp tekrar deneyin.", tone: "info" });
    let n = 0;
    for (const q of field.queue) {
      if (q.kind === "okuma" && q.input) {
        enterReading(q.readingId, q.input);
        n += 1;
      } else if (q.kind === "erisilemedi") {
        fieldState.set((s) => ({ ...s, skipped: { ...s.skipped, [q.meterId]: q.reason ?? "" } }));
        audit("Erişilemedi kaydını gönderdi", q.meterId, undefined, q.reason);
      }
    }
    const count = field.queue.length;
    fieldState.set((s) => ({ ...s, queue: [], synced: s.synced + count }));
    if (count) notify({ title: "Gönderim Tamam", body: `${count} kayıt gönderildi${n ? `, ${n} okuma depoya yazıldı` : ""}.`, tone: "success" });
    else notify({ title: "Bekleyen Kayıt Yok", body: "Gönderilecek kayıt yok.", tone: "info" });
  };

  const setOffline = (offline: boolean) => {
    fieldState.set((s) => ({ ...s, offline }));
    notify({ title: offline ? "Çevrimdışı Mod" : "Bağlantı Geri Geldi", body: offline ? "Girdiğiniz okumalar cihazda saklanır." : field.queue.length ? `${field.queue.length} kayıt gönderilmeyi bekliyor.` : "Gönderilecek kayıt yok.", tone: "info" });
  };

  return (
    <>
      <PageHead
        title="Saha Okuma"
        description="Okuyucunun cep ekranı: durak sırası, endeks girişi, zorunlu fotoğraf ve çevrimdışı çalışma. Simülasyon: gerçek GPS ya da kamera kullanılmaz."
        actions={
          <Button variant="secondary" size="sm" onClick={() => go("readings", { tab: "tur" })}>
            <RouteIcon aria-hidden /> Tur Planına Dön
          </Button>
        }
      />
      <PageBody className="lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start">
        <section aria-label="Okuyucu Cihazı" className="mx-auto grid w-full max-w-md min-w-0 gap-4 lg:mx-0">
          <div className="grid gap-3 rounded-2xl bg-overlay p-4 shadow-raised ring-1 ring-line">
            <div className="grid gap-3 sm:grid-cols-2">
              <Select label="Tur" value={route.regionId} onValueChange={(v) => fieldState.set((s) => ({ ...s, regionId: v ?? route.regionId }))} items={routes.map((r) => ({ value: r.regionId, label: `${r.regionName} turu` }))} />
              <Select label="Okuyucu" value={reader} onValueChange={(v) => v && readingUi.set((u) => ({ ...u, readers: { ...u.readers, [route.regionId]: v } }))} items={READER_NAMES.map((n) => ({ value: n, label: n }))} />
            </div>
            <TickMeter label={`${route.regionName} turu`} value={done + skipped} max={Math.max(total, 1)} ticks={Math.min(Math.max(total, 1), 36)} text={`${done + skipped} / ${total}`} />
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface p-3">
              <div className="flex items-center gap-2 text-base text-body">
                {field.offline ? <CloudOff aria-hidden className="size-4 text-warning" /> : <Wifi aria-hidden className="size-4 text-success" />}
                <Switch label="Çevrimdışı Mod" placement="end" checked={field.offline} onChange={(e) => setOffline(e.target.checked)} />
              </div>
              <Button variant={field.queue.length ? "primary" : "secondary"} size="sm" onClick={sync} disabled={field.offline || field.queue.length === 0}>
                <CloudUpload aria-hidden /> Gönder ({field.queue.length})
              </Button>
            </div>
          </div>

          {closed ? (
            <div className="grid justify-items-center gap-2 rounded-2xl bg-success-wash p-6 text-center ring-1 ring-success/20">
              <CheckCircle2 aria-hidden className="size-7 text-success" />
              <p className="text-read font-semibold text-strong">{route.regionName} turu kapandı</p>
              <p className="text-base text-muted">{done} okundu, {skipped} erişilemedi. Fark özeti denetim günlüğünde.</p>
            </div>
          ) : (
            <ol aria-label="Duraklar" className="grid gap-3">
              {stops.slice(0, 14).map((s) => {
                const c = customer(s.meter.customerId);
                const exp = expectedOf(s.meter.id);
                return (
                  <li key={s.meter.id} className="grid gap-2 rounded-2xl bg-overlay p-4 shadow-raised ring-1 ring-line">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-small text-muted">Durak {s.n}</p>
                        <p className="font-semibold text-strong"><Mono>{s.meter.serial}</Mono></p>
                      </div>
                      {s.state === "okundu" ? <Badge tone="success" dot>Okundu</Badge> : s.state === "kuyrukta" ? <Badge tone="warning" dot>Gönderilecek</Badge> : s.state === "erisilemedi" ? <Badge tone="neutral" dot>Erişilemedi</Badge> : <Badge tone={s.meter.status === "iletisim-yok" ? "warning" : "neutral"} dot>{s.meter.status === "iletisim-yok" ? "İletişim yok" : "Bekliyor"}</Badge>}
                    </div>
                    <p className="flex items-start gap-1.5 text-base text-body"><MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />{c.address}, {c.district}</p>
                    <p className="text-small text-muted">{c.name} · beklenen {exp ? `${fmtKwh(Math.round(exp * 0.7))} – ${fmtKwh(Math.round(exp * 1.3))}` : "bilinmiyor"}</p>
                    {s.state === "bekliyor" ? (
                      <Button variant="primary" size="sm" className="mt-1 w-full justify-center" onClick={() => setActive(s.meter.id)} disabled={!canRead}>
                        <PlayCircle aria-hidden /> Oku
                      </Button>
                    ) : s.state === "erisilemedi" ? (
                      <p className="text-small text-muted">Neden: {SKIP_REASONS.find((r) => r.value === field.skipped[s.meter.id])?.label ?? field.skipped[s.meter.id]}</p>
                    ) : null}
                  </li>
                );
              })}
              {stops.length > 14 ? <li className="px-1 text-small text-muted">İlk 14 durak gösteriliyor; kalan {stops.length - 14} durak cihaz rotasında.</li> : null}
              {stops.length === 0 ? <li className="rounded-2xl bg-overlay p-6 text-center text-base text-muted ring-1 ring-line">Bu turda durak yok.</li> : null}
            </ol>
          )}
        </section>

        <aside aria-label="Tur Özeti" className="grid min-w-0 content-start gap-5">
          <MetricStrip>
            <Metric label="Toplam Durak" value={fmtNum(total)} foot={`${route.regionName} turu`} />
            <Metric label="Okundu" value={fmtNum(done)} foot={fmtPct(total ? (done / total) * 100 : 0)} />
            <Metric label="Gönderilecek" value={fmtNum(queued)} foot={queued ? "Gönderim bekler" : "Bekleyen yok"} />
            <Metric label="Erişilemedi" value={fmtNum(skipped)} foot="Neden kayıtlı" />
          </MetricStrip>
          <Panel title="Tur Kapanışı" note="Gönderilmemiş kayıt varken tur kapanmaz" id="kapanis">
            <div className="grid gap-3 p-4 sm:p-5">
              <p className="text-base text-body">
                Kalan {waiting.length} durak, {anomalies} anomali uyarısı, {queued} gönderilmeyi bekleyen kayıt.
                {waiting.length ? " Okunmayan duraklar bir sonraki tura aktarılır." : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" size="sm" onClick={() => setClosing(true)} disabled={closed || queued > 0 || total === 0} title={queued ? "Önce Gönderin" : undefined}>
                  <Flag aria-hidden /> Turu Kapat
                </Button>
                <Button variant="ghost" size="sm" onClick={() => go("readings", { tab: "supheli" })}>Şüpheli Okumalar</Button>
              </div>
              {queued > 0 ? <p role="status" className="text-small text-warning">Önce {queued} kaydı gönderin.</p> : null}
            </div>
          </Panel>
          <Panel title="Kurallar" id="kurallar">
            <ul className="grid list-disc gap-2 py-4 pr-4 pl-9 text-base text-body sm:py-5 sm:pr-5 sm:pl-10">
              <li>Saha okumasında <strong className="text-strong">fotoğraf zorunlu</strong>; endeks ekranı net görünmeli.</li>
              <li>Geri sayım ya da ani sıçrama varsa yerinde tekrar okuma ve onay kutusu gerekir; kayıt “şüpheli”ye düşer.</li>
              <li>Erişilemeyen durakta neden seçilir; durak bir sonraki tura aktarılır.</li>
              <li>Çevrimdışıyken girilenler cihazda kalır ve bağlantı gelince gönderilip depoya yazılır.</li>
            </ul>
          </Panel>
        </aside>
      </PageBody>

      <StopSheet stop={activeStop?.meter ?? null} onClose={() => setActive(null)} offline={field.offline} />
      <Dialog
        open={closing}
        onOpenChange={setClosing}
        title={`${route.regionName} turunu kapat`}
        description="Kapanışta plan ile gerçek arasındaki fark denetim günlüğüne yazılır."
        footer={
          <>
            <Button variant="ghost" onClick={() => setClosing(false)}>Vazgeç</Button>
            <Button
              variant="primary"
              onClick={() => {
                fieldState.set((s) => ({ ...s, closed: [...s.closed, route.regionId] }));
                audit("Saha turunu kapattı", `${route.regionName} turu`, `${total} durak planlı`, `${done} okundu · ${skipped} erişilemedi · ${waiting.length} aktarıldı`);
                setClosing(false);
                notify({ title: "Tur Kapandı", body: `${done} okundu, ${skipped} erişilemedi, ${waiting.length} durak sonraki tura aktarıldı.`, tone: "success" });
              }}
            >
              Turu Kapat
            </Button>
          </>
        }
      >
        <dl className="grid grid-cols-2 gap-3 text-base">
          <div className="rounded-xl bg-surface p-3"><dt className="text-small text-muted">Planlanan</dt><dd className="text-heading font-semibold text-strong tabular-nums">{total}</dd></div>
          <div className="rounded-xl bg-success-wash p-3"><dt className="text-small text-muted">Okundu</dt><dd className="text-heading font-semibold text-strong tabular-nums">{done}</dd></div>
          <div className="rounded-xl bg-surface p-3"><dt className="text-small text-muted">Erişilemedi</dt><dd className="text-heading font-semibold text-strong tabular-nums">{skipped}</dd></div>
          <div className="rounded-xl bg-warning-wash p-3"><dt className="text-small text-muted">Sonraki tura aktarılan</dt><dd className="text-heading font-semibold text-strong tabular-nums">{waiting.length}</dd></div>
        </dl>
        <p className="mt-3 text-small text-muted">Fark: planlanan {total} − okunan {done} = {total - done} durak. Anomali uyarısı: {anomalies}.</p>
      </Dialog>
      <p className="sr-only">Bugün {dayLabel(TODAY_KEY)}; reader {reader}; <a href={href("readings", { tab: "tur" })}>tur planı</a></p>
    </>
  );
}

type Route0 = ReturnType<typeof buildRoutesLive>[number];

/* --- Durak formu ------------------------------------------------------------- */

function StopSheet({ stop, onClose, offline }: { stop: Meter | null; onClose: () => void; offline: boolean }) {
  const { notify } = useApp();
  const [idx, setIdx] = useState<{ t1: number | null; t2: number | null; t3: number | null }>({ t1: null, t2: null, t3: null });
  const [react, setReact] = useState<number | null>(null);
  const [cap, setCap] = useState<number | null>(null);
  const [demand, setDemand] = useState<number | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [confirmAnomaly, setConfirmAnomaly] = useState(false);
  const [skip, setSkip] = useState(false);
  const [reason, setReason] = useState("kapi");

  const prev = useMemo(() => {
    if (!stop) return null;
    const last = effectiveReadings().filter((r) => r.meterId === stop.id && r.status !== "bekliyor").at(-1);
    return last ? { index: last.index, reactive: last.reactive, demand: last.demandKw } : { index: stop.base, reactive: { inductive: 0, capacitive: 0 }, demand: 0 };
  }, [stop]);
  const expected = stop ? expectedOf(stop.id) : 0;
  const result = stop && prev ? checkReading({ meter: stop, prev: prev.index, idx, expected, source: "saha", hasPhoto: !!photo }) : null;
  const needsConfirm = !!result?.anomaly;
  const canSave = !!result && !!photo && (!needsConfirm || confirmAnomaly);

  const reset = () => {
    setIdx({ t1: null, t2: null, t3: null });
    setReact(null);
    setCap(null);
    setDemand(null);
    setPhoto(null);
    setConfirmAnomaly(false);
    setSkip(false);
    setReason("kapi");
  };
  const close = () => {
    reset();
    onClose();
  };

  const target = stop ? effectiveReadings().find((r) => r.meterId === stop.id && r.period === CURRENT_PERIOD) : undefined;

  const save = () => {
    if (!stop || !result || !target || !prev) return;
    const flags: ReadingFlag[] = result.flag ? [result.flag] : [];
    const input: ReadingInput = {
      source: "saha",
      index: { t1: idx.t1 ?? 0, t2: stop.multiZone ? (idx.t2 ?? 0) : 0, t3: stop.multiZone ? (idx.t3 ?? 0) : 0 },
      usage: { t1: result.u1, t2: result.u2, t3: result.u3, total: result.total },
      reactive: { inductive: react ?? prev.reactive.inductive, capacitive: cap ?? prev.reactive.capacitive },
      demandKw: demand ?? prev.demand,
      flags,
    };
    if (offline) {
      const item: FieldQueueItem = { id: nextId("Q-"), kind: "okuma", meterId: stop.id, readingId: target.id, at: TODAY_KEY, input, photo: photo ?? undefined };
      fieldState.set((s) => ({ ...s, queue: [...s.queue, item] }));
      notify({ title: "Cihaza Kaydedildi", body: `${stop.serial}: bağlantı gelince gönderin.`, tone: "info" });
    } else {
      enterReading(target.id, input);
      readingUi.set((u) => ({ ...u, entries: [...u.entries, { meterId: stop.id, readingId: target.id, at: TODAY_KEY, source: "saha", total: result.total, flags }] }));
      notify({ title: flags.length ? "Okuma kaydedildi, şüpheli listesine düştü" : "Okuma kaydedildi", body: `${stop.serial}: ${fmtKwh(result.total)}`, tone: "success" });
    }
    close();
  };

  const saveSkip = () => {
    if (!stop || !target) return;
    if (offline) {
      const item: FieldQueueItem = { id: nextId("Q-"), kind: "erisilemedi", meterId: stop.id, readingId: target.id, at: TODAY_KEY, reason };
      fieldState.set((s) => ({ ...s, queue: [...s.queue, item] }));
      notify({ title: "Cihaza Kaydedildi", body: `${stop.serial}: erişilemedi kaydı gönderilmeyi bekliyor.`, tone: "info" });
    } else {
      fieldState.set((s) => ({ ...s, skipped: { ...s.skipped, [stop.id]: reason } }));
      audit("Durağa erişilemedi", stop.serial, undefined, SKIP_REASONS.find((r) => r.value === reason)?.label);
      notify({ title: "Erişilemedi Kaydedildi", body: `${stop.serial}: sonraki tura aktarılır.`, tone: "success" });
    }
    close();
  };

  const c = stop ? customer(stop.customerId) : null;

  return (
    <Sheet
      open={!!stop}
      onOpenChange={(o) => !o && close()}
      side="right"
      size="lg"
      title={stop ? `Durak · ${stop.serial}` : "Durak"}
      description={stop && c ? `${c.name} · ${c.address}, ${c.district}` : undefined}
      icon={<Camera />}
      footerStart={
        <Button variant="ghost" onClick={() => setSkip((v) => !v)} aria-expanded={skip}>
          Erişilemedi
        </Button>
      }
      footer={
        skip ? (
          <Button variant="primary" onClick={saveSkip}>Erişilemedi Olarak Kaydet</Button>
        ) : (
          <Button variant="primary" onClick={save} disabled={!canSave}>{offline ? "Cihaza Kaydet" : "Kaydet"}</Button>
        )
      }
    >
      {stop && prev ? (
        <div className="grid gap-4">
          {offline ? <p role="status" className="rounded-lg bg-warning-wash p-3 text-small text-strong ring-1 ring-warning/20">Çevrimdışısınız: kayıt cihazda saklanır, bağlantı gelince gönderilir.</p> : null}
          {skip ? (
            <div className="grid gap-3 rounded-xl bg-surface p-4">
              <RadioGroup name="skip-reason" legend="Neden Okunamadı?" value={reason} onChange={setReason} options={SKIP_REASONS.map((r) => ({ value: r.value, label: r.label }))} />
              <p className="text-small text-muted">Durak sonraki tura aktarılır; neden denetim günlüğüne yazılır.</p>
            </div>
          ) : (
            <>
              <p className="text-small text-muted">Önceki endeks: T1 {fmtNum(prev.index.t1)}{stop.multiZone ? ` · T2 ${fmtNum(prev.index.t2)} · T3 ${fmtNum(prev.index.t3)}` : ""} · çarpan ×{stop.multiplier}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <NumberField label="T1 Endeks" value={idx.t1} onValueChange={(v) => setIdx((p) => ({ ...p, t1: v }))} min={0} />
                {stop.multiZone ? <NumberField label="T2 Endeks" value={idx.t2} onValueChange={(v) => setIdx((p) => ({ ...p, t2: v }))} min={0} /> : null}
                {stop.multiZone ? <NumberField label="T3 Endeks" value={idx.t3} onValueChange={(v) => setIdx((p) => ({ ...p, t3: v }))} min={0} /> : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <NumberField label="Endüktif (kVArh)" value={react} onValueChange={setReact} min={0} />
                <NumberField label="Kapasitif (kVArh)" value={cap} onValueChange={setCap} min={0} />
                <NumberField label="Talep (kW)" value={demand} onValueChange={setDemand} min={0} step={0.1} format={{ maximumFractionDigits: 1 }} />
              </div>
              <div className="flex flex-wrap items-center gap-3 rounded-xl bg-surface p-3">
                <Button variant={photo ? "secondary" : "soft"} size="sm" onClick={() => setPhoto(`IMG_${stop.serial.slice(-4)}.jpg`)}>
                  <Camera aria-hidden /> {photo ? "Fotoğrafı değiştir" : "Fotoğraf çek"}
                </Button>
                <span className="text-small text-muted">{photo ? `Eklendi: ${photo}` : "Zorunlu: endeks ekranı net görünmeli (simülasyon)."}</span>
              </div>
              {result ? (
                <ul aria-label="Doğrulama" className="grid gap-2">
                  <li className="text-base text-strong">Dönem tüketimi: <strong className="tabular-nums">{fmtKwh(result.total)}</strong>{expected ? <span className="text-muted"> · beklenen {fmtKwh(expected)}</span> : null}</li>
                  {result.checks.map((c, i) => (
                    <li key={i} className={`flex items-start gap-2 rounded-lg p-3 text-base ${c.tone === "success" ? "bg-success-wash" : c.tone === "danger" ? "bg-danger-wash" : "bg-warning-wash"}`}>
                      {c.tone === "success" ? <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-success" /> : <TriangleAlert aria-hidden className={`mt-0.5 size-4 shrink-0 ${c.tone === "danger" ? "text-danger" : "text-warning"}`} />}
                      <span><span className="sr-only">{c.tone === "success" ? "Uygun: " : c.tone === "danger" ? "Hata: " : "Uyarı: "}</span>{c.text}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-small text-muted">T1 endeksini yazınca doğrulama burada görünür.</p>
              )}
              {needsConfirm ? (
                <label className="flex cursor-pointer items-start gap-3 text-base text-body">
                  <Checkbox aria-label="Yerinde Tekrar Okudum" checked={confirmAnomaly} onChange={() => setConfirmAnomaly((v) => !v)} />
                  <span>Sayacı yerinde tekrar okudum; değer doğru. Kayıt “şüpheli”ye düşer ve incelenir.</span>
                </label>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </Sheet>
  );
}
