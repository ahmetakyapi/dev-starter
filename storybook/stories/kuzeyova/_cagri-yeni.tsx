"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Search, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { InsightCallout } from "@/components/ui/insight-callout";
import { SearchField, matchesTr } from "@/components/ui/search-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useDerived } from "./_core";
import { dateTime, transformer, type Customer } from "./_data";
import { allCustomers, metersFor } from "./_data-musteri";
import { CALL_CHANNEL_LABEL, CALL_KIND_LABEL, type Call, type CallChannel, type CallKind } from "./_data-yeni";
import { affectedCustomers, customerOf, isSensitive } from "./_data-ops-sayfa";
import { fmtNum, fmtTl } from "./_kit";
import { customerBalance, liveInvoices, openOutages } from "./_selectors";
import { createCall, createOutageFromCalls, linkCallToOutage, useCalls } from "./_store";
import { InvoiceBadge, PageBody, PageHead, Panel, href, useApp, type PageProps } from "./_ui";

/*
 * YENİ ÇAĞRI: çağrı merkezi temsilcisinin telefondayken doldurduğu kayıt ekranı.
 * Sıra, konuşmanın sırasıdır: kim arıyor → ne için arıyor → not ve ayrıntı. Sağdaki
 * "Bu Çağrıyla İlgili" sütunu aboneyi seçince dolar: bölgede bilinen arıza, aynı
 * trafodaki açık çağrılar, olası ortak arıza, aboneye ait önceki çağrılar. Alt eylem
 * çubuğu kayan sütunda sabit durur (uzun formda kaydet butonu kaybolmaz).
 */

type NewKind = Exclude<CallKind, "kesme">;
const PRIORITY: Record<Call["priority"], string> = { dusuk: "Düşük", normal: "Normal", yuksek: "Yüksek" };

const KINDS: { value: NewKind; label: string; hint: string; templates: string[] }[] = [
  { value: "ariza", label: "Arıza", hint: "Enerji kesintisi ya da tesisat sorunu. Yüksek öncelikle açılır; hedef süre 2 saat.", templates: ["Mahallede enerji yok", "Yalnızca abonenin tesisatında enerji yok", "Enerji sürekli gidip geliyor", "Sigorta atıyor ve sayaç ekranı kapalı"] },
  { value: "fatura", label: "Fatura", hint: "Tutar, vade ya da dönem sorusu. Hedef süre 1 gün.", templates: ["Fatura tutarını yüksek buldu", "Son ödeme tarihini sordu", "Aynı döneme iki fatura geldiğini bildirdi"] },
  { value: "sayac", label: "Sayaç", hint: "Sayaç hatası, değişim ya da mühür. Hedef süre 1 gün.", templates: ["Sayaç ekranında hata kodu görünüyor", "Sayaç değişimi talep etti", "Sayaç mührünün koptuğunu bildirdi"] },
  { value: "bilgi", label: "Bilgi", hint: "Bilgi talebi. Çoğunlukla ilk görüşmede kapanır.", templates: ["Planlı kesinti saatini sordu", "Abonelik işlemleri hakkında bilgi istedi", "Ödeme noktalarını sordu"] },
  { value: "sikayet", label: "Şikayet", hint: "Hizmetten memnuniyetsizlik. Yönetici görür; hedef süre 1 gün.", templates: ["Onarım süresinin uzadığını belirtti", "Aynı sorunu tekrar bildirdi", "Saha ekibinin davranışından şikayetçi"] },
];

function Section({ title, hint, children, first }: { title: string; hint?: ReactNode; children: ReactNode; first?: boolean }) {
  return (
    <section aria-label={title} className={cn("grid gap-3 p-4 sm:p-5", !first && "border-t border-line-soft")}>
      <div>
        <h3 className="text-base font-semibold text-strong">{title}</h3>
        {hint ? <p className="mt-0.5 text-small text-muted">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-strong">{children}</dd>
    </div>
  );
}

/** Seçili abonenin özeti: arayanı doğrulamak için gereken her şey tek bakışta. */
function CustomerSummary({ cust, onClear }: { cust: Customer; onClear: () => void }) {
  const meter = metersFor(cust.id)[0];
  const invoice = liveInvoices()
    .filter((i) => i.customerId === cust.id)
    .sort((a, b) => b.due.localeCompare(a.due))[0];
  const balance = customerBalance(cust.id);
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-read font-semibold text-strong">
            {cust.name}
            {isSensitive(cust) ? <Badge tone="danger">Hassas Abone</Badge> : null}
          </p>
          <p className="text-small text-muted">
            {cust.district} · {cust.voltage === "OG" ? "Orta Gerilim" : "Alçak Gerilim"}
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={onClear}>
          Aboneyi Değiştir
        </Button>
      </div>
      <dl className="grid gap-x-6 gap-y-2.5 text-small sm:grid-cols-2">
        <Fact label="Tesisat No">
          <span className="kz-mono">{cust.installation}</span>
        </Fact>
        <Fact label="Telefon">
          <span className="kz-mono">{cust.phone}</span>
        </Fact>
        <Fact label="Adres">{cust.address}</Fact>
        <Fact label="Sayaç">{meter ? <span className="kz-mono">{meter.serial}</span> : "Kayıtlı sayaç yok"}</Fact>
        <Fact label="Açık Bakiye">{balance > 0 ? <span className="tabular-nums">{fmtTl(balance)}</span> : "Yok"}</Fact>
        <Fact label="Son Fatura">{invoice ? <InvoiceBadge status={invoice.status} /> : "Fatura yok"}</Fact>
      </dl>
    </div>
  );
}

export function NewCallPage({ go, params }: PageProps) {
  const { notify } = useApp();
  const calls = useCalls();
  const all = useMemo(() => allCustomers(), []);
  const preset = params.new && params.new !== "1" ? all.find((c) => c.id === params.new) ?? null : null;
  const [cust, setCust] = useState<Customer | null>(preset);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<NewKind>("ariza");
  const [priority, setPriority] = useState<Call["priority"] | null>(null);
  const [channel, setChannel] = useState<CallChannel>("telefon");
  const [note, setNote] = useState("");
  const [phone, setPhone] = useState(preset?.phone ?? "");
  const [callback, setCallback] = useState(false);
  const [link, setLink] = useState(true);
  const [saved, setSaved] = useState<Call | null>(null);

  const kindInfo = KINDS.find((k) => k.value === kind)!;
  const effectivePriority = priority ?? (kind === "ariza" ? "yuksek" : "normal");

  const results = useMemo(() => {
    const needle = q.trim();
    if (needle.length < 2) return [];
    return all.filter((c) => matchesTr(`${c.name} ${c.installation} ${c.id} ${c.phone}`, needle, { fold: true })).slice(0, 6);
  }, [all, q]);

  const meter = cust ? metersFor(cust.id)[0] : undefined;
  const trId = meter?.transformerId;
  const knownOutage = useDerived(() => (cust ? openOutages().find((o) => affectedCustomers(o).some((c) => c.id === cust.id)) ?? null : null), [cust?.id]);
  const sameTransformer = calls.filter((c) => trId && c.transformerId === trId && c.kind === "ariza" && c.status !== "kapandi");
  const history = cust ? calls.filter((c) => c.customerId === cust.id).sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 3) : [];

  const pick = (c: Customer) => {
    setCust(c);
    setPhone(c.phone);
    setQ("");
  };
  const clear = () => {
    setCust(null);
    setPhone("");
  };

  const canSave = !!cust || note.trim().length > 0;
  const submit = () => {
    const text = [note.trim() || kindInfo.label, callback && phone.trim() ? `Geri arama istiyor (${phone.trim()})` : ""].filter(Boolean).join(" · ");
    const c = createCall({ kind, customerId: cust?.id ?? null, channel, note: text, priority: effectivePriority });
    if (kind === "ariza" && knownOutage && link) linkCallToOutage(c.id, knownOutage.id);
    notify({ title: "Çağrı Kaydedildi", body: `${c.id} · ${CALL_KIND_LABEL[c.kind]}`, tone: "success" });
    setSaved(c);
  };
  const reset = () => {
    setSaved(null);
    setCust(null);
    setNote("");
    setPhone("");
    setCallback(false);
    setPriority(null);
    setKind("ariza");
    go("calls", { new: "1" });
  };
  const back = () => go("calls");

  if (saved) {
    const c = calls.find((x) => x.id === saved.id) ?? saved;
    const who = c.customerId ? customerOf(c.customerId) : null;
    const canEscalate = c.kind === "ariza" && !!c.transformerId && !c.outageId;
    return (
      <>
        <PageHead title="Çağrı Kaydedildi" crumb="Yeni Çağrı" description="Çağrı listeye düştü. Şimdi bir sonraki adımı seç." actions={<Button variant="secondary" size="sm" onClick={back}><ArrowLeft aria-hidden /> Çağrı Merkezine Dön</Button>} />
        <PageBody>
          <Panel id="yc-ozet" title={c.id} note={`${dateTime(c.at)} · ${CALL_CHANNEL_LABEL[c.channel]}`} actions={<Badge tone="success" dot>Kaydedildi</Badge>} className="max-w-3xl">
            <div className="grid gap-4 p-4 sm:p-5">
              <p className="flex items-center gap-2 text-base text-strong">
                <CheckCircle2 aria-hidden className="size-5 shrink-0 text-success" />
                {CALL_KIND_LABEL[c.kind]} çağrısı {PRIORITY[c.priority].toLocaleLowerCase("tr-TR")} öncelikle açıldı.
              </p>
              <dl className="grid gap-x-6 gap-y-2.5 text-small sm:grid-cols-2">
                <Fact label="Arayan">{who ? who.name : "Kimliksiz arayan"}</Fact>
                <Fact label="Atanan">{c.assignee}</Fact>
                <Fact label="Not">{c.note}</Fact>
                <Fact label="Bağlı Arıza">{c.outageId ? <a href={href("outages", { id: c.outageId })} className="hover:underline">{c.outageId}</a> : "Yok"}</Fact>
              </dl>
              <div className="flex flex-wrap gap-2 border-t border-line-soft pt-4">
                {canEscalate ? (
                  <Button
                    variant="primary"
                    onClick={() => {
                      const o = createOutageFromCalls(c.transformerId!);
                      if (o) {
                        notify({ title: "Arıza Kaydı Açıldı", body: `${o.id} · ${c.transformerId}`, tone: "success" });
                        go("outages", { id: o.id });
                      }
                    }}
                  >
                    <Zap aria-hidden /> Arıza Kaydına Çevir
                  </Button>
                ) : null}
                <Button variant={canEscalate ? "secondary" : "primary"} onClick={() => go("calls", { id: c.id })}>
                  Çağrıyı Aç
                </Button>
                <Button variant="ghost" onClick={reset}>
                  Yeni Çağrı Kaydet
                </Button>
              </div>
            </div>
          </Panel>
        </PageBody>
      </>
    );
  }

  const showAside = !!cust;
  return (
    <>
      <PageHead
        title="Yeni Çağrı"
        crumb="Yeni Çağrı"
        description="Arayanı bul, konuyu seç ve çağrıyı kaydet"
        actions={
          <Button variant="secondary" size="sm" onClick={back}>
            <ArrowLeft aria-hidden /> Çağrı Merkezine Dön
          </Button>
        }
      />
      <PageBody>
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_23rem]">
          <Panel id="yc-form" title="Çağrı Bilgileri" note="Kayıt hemen çağrı listesine düşer">
            <Section title="Arayan" hint="Tesisat no, abone no, ad ya da telefonla ara" first>
              {cust ? (
                <CustomerSummary cust={cust} onClear={clear} />
              ) : (
                <>
                  <SearchField label="Abone Ara" placeholder="Ad, tesisat no, abone no ya da telefon" value={q} onValueChange={setQ} debounce={0} />
                  {q.trim().length >= 2 ? (
                    results.length ? (
                      <ul role="list" aria-label="Eşleşen Aboneler" className="-mx-4 divide-y divide-line-soft border-y border-line-soft sm:-mx-5">
                        {results.map((c) => {
                          const m = metersFor(c.id)[0];
                          const inv = liveInvoices()
                            .filter((i) => i.customerId === c.id)
                            .sort((a, b) => b.due.localeCompare(a.due))[0];
                          return (
                            <li key={c.id}>
                              <button type="button" onClick={() => pick(c)} className="flex min-h-14 w-full cursor-pointer items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-surface focus-visible:bg-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-line-focus sm:px-5">
                                <span className="grid min-w-0 flex-1">
                                  <span className="truncate text-base font-medium text-strong">{c.name}</span>
                                  <span className="truncate text-small text-muted">
                                    <span className="kz-mono">{c.installation}</span> · {c.address}
                                    {m ? <> · <span className="kz-mono">{m.serial}</span></> : null}
                                  </span>
                                </span>
                                {inv ? <span className="shrink-0 max-sm:hidden"><InvoiceBadge status={inv.status} /></span> : null}
                                <ArrowRight aria-hidden className="size-3.5 shrink-0 text-muted" />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="flex items-center gap-2 text-small text-muted">
                        <Search aria-hidden className="size-4 shrink-0" />
                        Eşleşen abone yok. Kimliği öğrenemediysen aşağıdan devam et: çağrı kimliksiz kaydedilir.
                      </p>
                    )
                  ) : (
                    <p className="text-small text-muted">En az iki harf ya da rakam yaz. Kimliği öğrenemediysen aşağıdan devam et: çağrı kimliksiz kaydedilir.</p>
                  )}
                </>
              )}
            </Section>

            <Section title="Çağrı Türü" hint={kindInfo.hint}>
              <SegmentedControl<NewKind> aria-label="Çağrı Türü" value={kind} onValueChange={(v) => { setKind(v); setPriority(null); }} options={KINDS.map((k) => ({ value: k.value, label: k.label }))} />
            </Section>

            <Section title="Konu ve Not" hint="Hazır bir konu seç ya da kendi cümlenle yaz">
              <div role="group" aria-label="Hazır Konular" className="flex flex-wrap gap-2">
                {kindInfo.templates.map((t) => {
                  const on = note === t;
                  return (
                    <button key={t} type="button" aria-pressed={on} onClick={() => setNote(on ? "" : t)} className={cn("inline-flex min-h-9 cursor-pointer items-center rounded-full border px-3 text-small font-medium transition-colors", on ? "border-primary bg-primary-wash text-primary-ink" : "border-line bg-overlay text-body hover:border-line-strong hover:text-strong")}>
                      {t}
                    </button>
                  );
                })}
              </div>
              <Textarea label="Not" value={note} onChange={(e) => setNote(e.target.value)} minRows={3} />
            </Section>

            <Section title="Ayrıntılar">
              <div className="grid gap-3 sm:grid-cols-3">
                <Select label="Öncelik" items={Object.entries(PRIORITY).map(([value, label]) => ({ value, label }))} value={effectivePriority} onValueChange={(v) => setPriority(v as Call["priority"])} />
                <Select label="Kanal" items={Object.entries(CALL_CHANNEL_LABEL).map(([value, label]) => ({ value, label }))} value={channel} onValueChange={(v) => setChannel(v as CallChannel)} />
                <Input label="Arayan Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="off" />
              </div>
              <Checkbox label="Geri arama istiyor" hint="Not satırına telefon numarasıyla eklenir" checked={callback} onChange={(e) => setCallback(e.target.checked)} />
            </Section>
          </Panel>

          <aside aria-label="Bu Çağrıyla İlgili" className="grid gap-4">
            <h2 className="text-read font-semibold text-strong">Bu Çağrıyla İlgili</h2>
            {!showAside ? (
              <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-small text-muted">Abone seçilince bölgedeki açık arıza, aynı trafodaki çağrılar ve abonenin önceki çağrıları burada görünür.</p>
            ) : null}

            {knownOutage ? (
              <InsightCallout
                kind="warning"
                label="Bilinen Arıza"
                title="Bölgede Açık Arıza Var"
                headingLevel={3}
                actions={
                  <a href={href("outages", { id: knownOutage.id })} className="text-small font-medium text-strong underline-offset-2 hover:underline">
                    Arızayı Aç
                  </a>
                }
              >
                <p>
                  {knownOutage.id} · {knownOutage.cause} · {fmtNum(knownOutage.affected)} abone etkileniyor. Abone bu kayıttan etkilenmiş olabilir.
                </p>
                {kind === "ariza" ? <Checkbox className="mt-2" label="Kaydedince çağrıyı bu arızaya bağla" checked={link} onChange={(e) => setLink(e.target.checked)} /> : null}
              </InsightCallout>
            ) : null}

            {sameTransformer.length >= 2 ? (
              <InsightCallout kind="insight" label="Olası Ortak Arıza" title={`${transformer(trId!).name} Trafosunda ${sameTransformer.length} Açık Çağrı`} headingLevel={3}>
                Bu çağrıyla {sameTransformer.length + 1} olur. Üç çağrıda arıza kaydı açılması önerilir.
              </InsightCallout>
            ) : null}

            {cust && trId ? (
              <Panel id="yc-trafo" title="Aynı Trafodaki Çağrılar" note={`${transformer(trId).name} · ${sameTransformer.length} açık arıza çağrısı`}>
                {sameTransformer.length ? (
                  <ul role="list" className="divide-y divide-line-soft">
                    {sameTransformer.slice(0, 4).map((c) => (
                      <li key={c.id} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
                        <a href={href("calls", { id: c.id })} className="kz-mono shrink-0 text-base font-medium text-strong hover:underline">{c.id}</a>
                        <span className="min-w-0 flex-1 truncate text-small text-muted">{c.note}</span>
                        <span className="shrink-0 text-small text-muted tabular-nums">{dateTime(c.at).split(", ")[1]}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-3 text-small text-muted sm:px-5">Bu trafoda açık arıza çağrısı yok.</p>
                )}
              </Panel>
            ) : null}

            {cust ? (
              <Panel id="yc-gecmis" title="Önceki Çağrılar" note={history.length ? `Abonenin son ${history.length} çağrısı` : "Abonenin kayıtlı çağrısı yok"}>
                {history.length ? (
                  <ul role="list" className="divide-y divide-line-soft">
                    {history.map((c) => (
                      <li key={c.id} className="grid gap-0.5 px-4 py-2.5 sm:px-5">
                        <span className="flex items-center justify-between gap-2">
                          <a href={href("calls", { id: c.id })} className="kz-mono text-base font-medium text-strong hover:underline">{c.id}</a>
                          <span className="text-small text-muted tabular-nums">{dateTime(c.at)}</span>
                        </span>
                        <span className="truncate text-small text-muted">{CALL_KIND_LABEL[c.kind]} · {c.note}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-3 text-small text-muted sm:px-5">İlk başvuru.</p>
                )}
              </Panel>
            ) : null}
          </aside>
        </div>

        <div className="sticky bottom-0 z-10 -mx-4 -mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line bg-overlay px-4 py-3 sm:-mx-6 sm:-mb-6 sm:px-6">
          <p className="min-w-0 truncate text-small text-muted">
            <span className="font-medium text-strong">{kindInfo.label}</span> · {PRIORITY[effectivePriority]} öncelik · {cust ? cust.name : "Kimliksiz arayan"}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={back}>
              Vazgeç
            </Button>
            <Button variant="primary" onClick={submit} disabled={!canSave}>
              Çağrıyı Kaydet
            </Button>
          </div>
        </div>
      </PageBody>
    </>
  );
}
