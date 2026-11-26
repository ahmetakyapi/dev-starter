"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, CircleCheck, FileText, Gauge, MessageSquare, Printer, Save, Sparkles, TriangleAlert, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup } from "@/components/ui/radio-group";
import { Select } from "@/components/ui/select";
import { Stepper } from "@/components/ui/stepper";
import { InsightCallout } from "@/components/ui/insight-callout";
import { Switch } from "@/components/ui/switch";
import { TickMeter } from "@/components/ui/tick-meter";
import { SUBSTATIONS, SUPPLIERS, TODAY, TODAY_KEY, TRANSFORMERS, dayLabel, region, supplier, KIND_LABEL, type Customer, type Meter } from "./_data";
import { TRANSFORMER_LOADS, type StockMeter } from "./_data-yeni";
import { fmtNum, fmtTl } from "./_kit";
import { useCan } from "./_permissions";
import { getSettings } from "./_settings";
import { advanceApplication, allocateStock, useApplications, useStock } from "./_store";
import { audit } from "./_audit";
import {
  CITY_DISTRICTS,
  DEMO_IDS,
  KIND_BY_TARIFF,
  KNOWN_IDS,
  METER_MODELS,
  TARIFFS,
  addCustomer,
  allCustomers,
  findCustomer,
  metersFor,
  patchCustomer,
  validEmail,
  validIban,
  validPhone,
  validTckn,
  validVkn,
} from "./_data-musteri";
import { PageBody, PageHead, Panel, href, useApp, type PageProps } from "./_ui";

/* --- Form modeli ------------------------------------------------------------ */

type Form = {
  kind: "bireysel" | "kurumsal";
  name: string;
  idNo: string;
  addOnTenancy: boolean;
  addressAck: boolean;
  phone: string;
  email: string;
  sms: boolean;
  eInvoice: boolean;
  kvkk: boolean;
  area: string;
  street: string;
  voltage: "AG" | "OG";
  power: string;
  tariff: string;
  zone: "tek-zamanli" | "cok-zamanli";
  free: boolean;
  supplierId: string;
  meterMode: "pool" | "new";
  poolId: string;
  serial: string;
  model: string;
  ct: string;
  vt: string;
  idx1: string;
  idx2: string;
  idx3: string;
  seal: string;
  autoPay: boolean;
  iban: string;
  notifyVia: "sms" | "email" | "basili";
  confirm: boolean;
};

const INITIAL: Form = {
  kind: "bireysel",
  name: "",
  idNo: "",
  addOnTenancy: false,
  addressAck: false,
  phone: "",
  email: "",
  sms: true,
  eInvoice: false,
  kvkk: false,
  area: CITY_DISTRICTS[0].value,
  street: "",
  voltage: "AG",
  power: "8",
  tariff: "mesken",
  zone: "tek-zamanli",
  free: false,
  supplierId: SUPPLIERS[0].id,
  meterMode: "pool",
  poolId: "",
  serial: "",
  model: METER_MODELS[0],
  ct: "",
  vt: "",
  idx1: "0",
  idx2: "0",
  idx3: "0",
  seal: "",
  autoPay: false,
  iban: "",
  notifyVia: "sms",
  confirm: false,
};

/** Sayfadan çıkıp dönünce taslak kaybolmasın (yalnız oturum). */
let DRAFT: { form: Form; step: number } | null = null;

const STEPS = [
  { label: "Abone", description: "Tür ve kimlik" },
  { label: "İletişim", description: "Telefon, e-posta" },
  { label: "Tesisat", description: "Adres ve tarife" },
  { label: "Sayaç", description: "Atama, endeks" },
  { label: "Ödeme", description: "Talimat, teminat" },
  { label: "Onay", description: "Özet" },
];

type Errors = Partial<Record<string, string>>;

/** Teminat (örnek hesap): sözleşme gücü × tarifeye göre kW başı bedel. */
const guarantee = (f: Form) => Math.round((Number(f.power) || 0) * (TARIFFS.find((t) => t.value === f.tariff)?.perKw ?? 0) * 100);
/** Tahmini yıllık tüketim (kWh): sözleşme gücünden; aboneliğin serbest tüketici sayılması bununla yıllık sınırın (Ayarlar, ÖRNEK parametre) karşılaştırılmasıdır. */
const estAnnual = (f: Form) => Math.round((Number(f.power) || 0) * 38 * 12);
const freeEligible = (f: Form) => estAnnual(f) >= getSettings().freeLimitKwh;

/** Trafo oranından çarpan: "200/5" → 40; "15.8 kV/100 V" → 158. Geçersizse null. */
const ctRatio = (v: string) => {
  const m = /^(\d+)\s*\/\s*(\d+)$/.exec(v.trim());
  return m && Number(m[2]) > 0 ? Number(m[1]) / Number(m[2]) : null;
};
const vtRatio = (v: string) => {
  const m = /^([\d.,]+)\s*kV\s*\/\s*(\d+)\s*V$/i.exec(v.trim());
  return m && Number(m[2]) > 0 ? (Number(m[1].replace(",", ".")) * 1000) / Number(m[2]) : null;
};
const multiplierOf = (f: Form) => (f.voltage === "OG" && f.meterMode === "new" ? Math.round((ctRatio(f.ct) ?? 0) * (vtRatio(f.vt) ?? 0)) : 1);

const fold = (s: string) => s.toLocaleLowerCase("tr-TR").replace(/ı/g, "i").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
/** Aynı kimlik (tam ya da ad + son üç hane) ve aynı adres için yinelenen kayıt. */
const duplicateByIdentity = (f: Form): Customer | undefined => {
  const known = KNOWN_IDS[f.idNo] ? findCustomer(KNOWN_IDS[f.idNo]) : undefined;
  if (known) return known;
  if (f.idNo.length < 10 || f.name.trim().length < 3) return undefined;
  return allCustomers().find((c) => c.status !== "kapali" && c.taxMasked.endsWith(f.idNo.slice(-3)) && fold(c.name) === fold(f.name));
};
const duplicateByAddress = (f: Form): Customer | undefined => {
  const street = fold(f.street);
  if (street.length < 6) return undefined;
  const district = f.area.split("|")[1];
  return allCustomers().find((c) => c.status !== "kapali" && c.district === district && fold(c.address).startsWith(street));
};
const idLabel = (f: Form) => (f.kind === "bireysel" ? "T.C. Kimlik No" : "Vergi Kimlik No");

function validate(step: number, f: Form): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (f.name.trim().length < 3) e.name = f.kind === "bireysel" ? "Ad soyad en az 3 karakter olmalı." : "Unvan en az 3 karakter olmalı.";
    if (f.kind === "bireysel" ? !validTckn(f.idNo) : !validVkn(f.idNo)) e.idNo = f.kind === "bireysel" ? "T.C. kimlik numarası geçersiz (11 hane, sağlama hanesi tutmuyor)." : "Vergi kimlik numarası geçersiz (10 hane, sağlama hanesi tutmuyor).";
    else if (duplicateByIdentity(f) && !f.addOnTenancy) e.idNo = "Bu kimlikle kayıtlı bir abone var. Ek tesisat olarak açacaksanız aşağıdaki kutuyu işaretleyin.";
  }
  if (step === 1) {
    if (!validPhone(f.phone)) e.phone = "Telefon 05XX XXX XX XX biçiminde 11 hane olmalı.";
    if (!validEmail(f.email)) e.email = "E-posta adresi geçerli değil.";
    if (!f.kvkk) e.kvkk = "Devam için KVKK aydınlatma metninin okunduğu onaylanmalı.";
  }
  if (step === 2) {
    if (f.street.trim().length < 6) e.street = "Cadde, sokak ve kapı numarasını yazın.";
    else if (duplicateByAddress(f) && !f.addressAck) e.street = "Bu adreste kayıtlı bir tesisat var. Farklı bir bağımsız bölümse aşağıdaki kutuyu işaretleyin.";
    const kw = Number(f.power);
    if (!Number.isFinite(kw) || kw <= 0) e.power = "Sözleşme gücü sıfırdan büyük olmalı.";
    else if (f.voltage === "AG" && kw > 55) e.power = "Alçak gerilimde 55 kW üstü güç için orta gerilim tesisat gerekir.";
    else if (f.voltage === "OG" && kw < 100) e.power = "Orta gerilimde sözleşme gücü en az 100 kW olmalı.";
  }
  if (step === 3) {
    if (f.meterMode === "pool" && !f.poolId) e.poolId = "Depodan bir sayaç seçin ya da yeni sayaç tanımlayın.";
    if (f.meterMode === "new") {
      if (!/^[A-Z]{3}-\d{2}-\d{6}$/.test(f.serial.trim().toUpperCase())) e.serial = "Seri no KZA-26-123456 biçiminde olmalı.";
      if (f.voltage === "OG" && !ctRatio(f.ct)) e.ct = "Akım trafosu oranı 200/5 biçiminde olmalı.";
      if (f.voltage === "OG" && !vtRatio(f.vt)) e.vt = "Gerilim trafosu oranı 15.8 kV/100 V biçiminde olmalı.";
    }
    for (const k of ["idx1", "idx2", "idx3"] as const) {
      if (!(Number(f[k]) >= 0) || f[k].trim() === "") e[k] = "Endeks sıfır ya da daha büyük bir sayı olmalı.";
    }
    if (f.seal.trim().length < 4) e.seal = "Mühür numarası en az 4 karakter olmalı.";
  }
  if (step === 4) {
    if (f.autoPay && !validIban(f.iban)) e.iban = "IBAN geçersiz (TR ile başlayan 26 hane, sağlama tutmuyor).";
  }
  if (step === 5 && !f.confirm) e.confirm = "Kaydı tamamlamak için bilgilerin doğruluğu onaylanmalı.";
  return e;
}

/** 05321234567 → 0532 123 45 67 (özet gösterimi). */
const fmtPhone = (v: string) => {
  const d = v.replace(/\s/g, "");
  return d.length === 11 ? `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9)}` : v;
};

/** Alan düzeyinde tek geçerli sayı. */
const n = (v: string) => Number(v) || 0;

function buildRecords(f: Form, stockList: readonly StockMeter[]): { customer: Customer; meter: Meter } {
  const [regionId, district] = f.area.split("|");
  const idNum = allCustomers().length + 90001;
  const pool = f.meterMode === "pool" ? stockList.find((m) => m.id === f.poolId) : undefined;
  const kind = KIND_BY_TARIFF(f.tariff);
  const eligible = freeEligible(f);
  const supplierId = eligible && f.free ? f.supplierId : SUPPLIERS[0].id;
  const customer: Customer = {
    id: `C-${idNum}`,
    name: f.name.trim(),
    kind,
    voltage: f.voltage,
    free: eligible,
    supplierId,
    regionId,
    district,
    address: `${f.street.trim()}, ${district}`,
    installation: `1${String(7_000_000 + idNum)}`,
    taxMasked: `${"•".repeat(f.idNo.length - 3)}${f.idNo.slice(-3)}`,
    phone: `${f.phone.replace(/\s/g, "").slice(0, 4)} ••• ${f.phone.replace(/\s/g, "").slice(-4, -2)} ${f.phone.replace(/\s/g, "").slice(-2)}`,
    email: `${f.email.split("@")[0].slice(0, 3)}•••@${f.email.split("@")[1]}`,
    status: "aktif",
    since: TODAY_KEY,
    baseKwh: Math.round(n(f.power) * 38),
    tariff: f.zone,
    autoPay: f.autoPay,
    annualKwh: estAnnual(f),
    contractKw: n(f.power),
  };
  const sub = SUBSTATIONS.find((s) => s.regionId === regionId) ?? SUBSTATIONS[0];
  const tr = TRANSFORMERS.find((x) => x.regionId === regionId) ?? TRANSFORMERS[0];
  const multi = f.zone === "cok-zamanli";
  const ct = f.voltage === "OG" ? (f.meterMode === "new" ? ctRatio(f.ct) ?? 1 : 40) : 1;
  const vt = f.voltage === "OG" ? (f.meterMode === "new" ? vtRatio(f.vt) ?? 1 : 1) : 1;
  const meter: Meter = {
    id: `M-N${String(idNum).slice(-4)}`,
    serial: pool ? pool.serial : f.serial.trim().toUpperCase(),
    model: pool ? pool.model : f.model,
    customerId: customer.id,
    substationId: sub.id,
    comm: pool ? pool.comm : f.voltage === "OG" ? "gsm" : "ami",
    status: "okunuyor",
    multiplier: Math.round(ct * vt) || 1,
    ct: f.voltage === "OG" ? (f.meterMode === "new" ? f.ct : "200/5") : "—",
    vt: f.voltage === "OG" ? (f.meterMode === "new" ? f.vt : "—") : "—",
    ctRatio: ct,
    vtRatio: vt,
    transformerId: tr.id,
    multiZone: multi,
    installed: TODAY_KEY,
    lastSeen: TODAY,
    readDay: 15,
    firmware: "v3.0.2",
    base: { t1: n(f.idx1), t2: multi ? n(f.idx2) : 0, t3: multi ? n(f.idx3) : 0 },
  };
  return { customer, meter };
}

/* --- Sayfa ------------------------------------------------------------------- */

/** T.C. kimlik: ilk dokuz haneden iki sağlama hanesini üretir. */
function makeTckn(base9: string): string {
  const d = [...base9].map(Number);
  const d10 = ((((d[0] + d[2] + d[4] + d[6] + d[8]) * 7 - (d[1] + d[3] + d[5] + d[7])) % 10) + 10) % 10;
  const d11 = (d.reduce((a, b) => a + b, 0) + d10) % 10;
  return `${base9}${d10}${d11}`;
}
/** Vergi kimlik: dokuz haneye tek geçerli sağlama hanesini bulur. */
function makeVkn(base9: string): string {
  for (let k = 0; k < 10; k++) if (validVkn(`${base9}${k}`)) return `${base9}${k}`;
  return `${base9}0`;
}
/** Geçerli ve kayıtlı olmayan örnek kimlik (formu denemek için "Örnek doldur"). */
function sampleId(kind: Form["kind"]): string {
  for (let i = 0; i < 500; i++) {
    const id = kind === "bireysel" ? makeTckn(String(214365870 + i * 7)) : makeVkn(String(481516230 + i * 13));
    if (!KNOWN_IDS[id] && (kind === "bireysel" ? validTckn(id) : validVkn(id))) return id;
  }
  return kind === "bireysel" ? DEMO_IDS.tckn : DEMO_IDS.vkn;
}

const SAMPLE_FORM = (kind: Form["kind"]): Partial<Form> => ({
  kind,
  name: kind === "bireysel" ? "Deniz Aksoy" : "Aksoy Mühendislik Ltd. Şti.",
  idNo: sampleId(kind),
  phone: "05321234567",
  email: "deniz@ornek.com",
  kvkk: true,
  street: "Çınar Sk. No: 41",
});

export function KayitPage({ params, go }: PageProps) {
  const { notify } = useApp();
  const canEdit = useCan("musteri");
  const stock = useStock();
  const applications = useApplications();
  const application = params.application ? applications.find((a) => a.id === params.application) : undefined;
  const freeStock = useMemo(() => stock.filter((s) => s.status === "stokta"), [stock]);
  const [form, setForm] = useState<Form>(() => {
    if (DRAFT) return DRAFT.form;
    if (application) {
      const area = CITY_DISTRICTS.find((c) => c.regionId === application.regionId && c.district === application.district)?.value ?? INITIAL.area;
      return { ...INITIAL, name: application.applicant, area, street: application.address.split(",")[0] ?? "", voltage: application.voltage, power: String(application.powerKw), tariff: application.voltage === "OG" ? "sanayi" : INITIAL.tariff };
    }
    return INITIAL;
  });
  const [step, setStep] = useState(DRAFT?.step ?? 0);
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState<{ customer: Customer; meter: Meter } | null>(null);

  // Havuz sayacı seçili değilse (ya da seçilen tahsis edildiyse) ilk boş sayaç seçilir.
  useEffect(() => {
    if (form.meterMode !== "pool") return;
    if (freeStock.some((s) => s.id === form.poolId)) return;
    setForm((prev) => ({ ...prev, poolId: freeStock[0]?.id ?? "" }));
  }, [freeStock, form.meterMode, form.poolId]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      DRAFT = { form: next, step };
      return next;
    });
    setErrors((prev) => (prev[key as string] ? { ...prev, [key as string]: undefined } : prev));
  };

  const dup = duplicateByIdentity(form);
  const addrDup = form.street.trim().length >= 6 ? duplicateByAddress(form) : undefined;
  const appReady = !application || application.stage === "enerji";

  function finish() {
    if (application) {
      const gate = advanceApplication(application.id);
      if (!gate.ok) {
        notify({ title: "Başvuru İlerletilemedi", body: gate.reason, tone: "info" });
        return;
      }
      const created = allCustomers().find((c) => c.name === application.applicant && c.since === TODAY_KEY && c.status === "aktif");
      if (!created) return;
      const phone = form.phone.replace(/\s/g, "");
      patchCustomer(
        created.id,
        { phone: `${phone.slice(0, 4)} ••• ${phone.slice(-4, -2)} ${phone.slice(-2)}`, email: `${form.email.split("@")[0].slice(0, 3)}•••@${form.email.split("@")[1]}`, autoPay: form.autoPay, tariff: form.zone },
        { title: "Kayıt Bilgileri Tamamlandı", description: `Başvuru ${application.id}`, tone: "primary" },
      );
      DRAFT = null;
      const rec = { customer: findCustomer(created.id) ?? created, meter: metersFor(created.id)[0] };
      setDone(rec);
      notify({ title: "Abonelik Açıldı", body: `${created.id} · ${application.id} başvurusu tamamlandı`, tone: "success" });
      return;
    }
    const rec = buildRecords(form, stock);
    addCustomer(rec.customer, rec.meter);
    if (form.meterMode === "pool" && form.poolId) allocateStock(form.poolId, { customerId: rec.customer.id });
    audit("Abone kaydı tamamladı", rec.customer.id, undefined, `${rec.customer.name} · ${rec.meter.serial}`);
    DRAFT = null;
    setDone(rec);
    notify({ title: "Abonelik Açıldı", body: `${rec.customer.id} · ${rec.customer.name}`, tone: "success" });
  }

  function next() {
    const found = validate(step, form);
    setErrors(found);
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      queueMicrotask(() => document.querySelector<HTMLElement>(`[name="${first}"], #kayit-${first}`)?.focus());
      return;
    }
    if (step === STEPS.length - 1) {
      finish();
      return;
    }
    setStep(step + 1);
    DRAFT = { form, step: step + 1 };
  }
  function back() {
    setErrors({});
    setStep(Math.max(0, step - 1));
    DRAFT = { form, step: Math.max(0, step - 1) };
  }
  function reset() {
    DRAFT = null;
    setForm(INITIAL);
    setStep(0);
    setErrors({});
    setDone(null);
  }
  function fillSample() {
    const sample = SAMPLE_FORM(form.kind);
    setForm((prev) => {
      const nextForm = { ...prev, ...sample };
      DRAFT = { form: nextForm, step };
      return nextForm;
    });
    setErrors({});
    notify({ title: "Örnek Bilgiler Dolduruldu", body: "Alanları değiştirebilirsiniz; doğrulamalar çalışmaya devam eder.", tone: "info" });
  }

  if (done) return <Basari record={done} onNew={reset} go={go} />;
  if (!canEdit) return <><PageHead title="Abone Kaydı" /><PageBody><p className="text-base text-muted">Abone kaydı için düzenleme yetkisi gerekir.</p></PageBody></>;

  const kind = KIND_BY_TARIFF(form.tariff);
  const [regionId, district] = form.area.split("|");

  return (
    <>
      <PageHead
        title="Abone Kaydı"
        description="Yeni abone, tesisat, sayaç ve ödeme talimatı tek akışta. Her adım doğrulanır."
        actions={
          <>
            <Button variant="ghost" onClick={fillSample}>
              <Sparkles /> Örnek Doldur
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                DRAFT = { form, step };
                notify({ title: "Taslak Kaydedildi", body: "Bu sayfaya dönünce kaldığınız yerden devam edersiniz.", tone: "success" });
              }}
            >
              <Save /> Taslağı Kaydet
            </Button>
          </>
        }
      />
      <PageBody>
        {application ? (
          <div role="note" className={`flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 text-base ring-1 ${appReady ? "bg-primary-wash ring-primary/20" : "bg-warning-wash ring-warning/20"}`}>
            <TriangleAlert aria-hidden className={`size-5 shrink-0 ${appReady ? "text-primary-ink" : "text-warning"}`} />
            <p className="min-w-0 flex-1 text-body">
              <strong className="font-semibold text-strong">{application.id} başvurusundan geliyorsunuz.</strong>{" "}
              {appReady ? "Kaydı tamamlayınca başvuru enerjilendirilir, abonelik ve sayaç açılır." : "Başvuru henüz enerjilendirme aşamasında değil; bilgileri doldurabilirsiniz ama kaydı tamamlamak için başvuruyu önce ilerletin."}
            </p>
            <a className={buttonClass({ variant: "secondary", size: "sm" })} href={href("applications", { id: application.id })}>
              Başvuruyu Aç
            </a>
          </div>
        ) : null}
        <div className="max-sm:hidden">
          <Stepper steps={STEPS} current={step} aria-label="Kayıt Adımları" />
        </div>
        <div className="sm:hidden">
          <p className="text-small font-medium text-muted" aria-live="polite">Adım {step + 1} / {STEPS.length} · {STEPS[step].label}</p>
          <TickMeter label="Kayıt İlerlemesi" value={step + 1} max={STEPS.length} text={`${step + 1} / ${STEPS.length}`} className="mt-1.5" />
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-3">
          <form
            noValidate
            aria-label={`${STEPS[step].label} adımı`}
            onSubmit={(e) => {
              e.preventDefault();
              next();
            }}
            className="xl:col-span-2"
          >
            <Panel title={`${step + 1}. ${STEPS[step].label}`} note={STEPS[step].description} id="kayit-adim">
              <div className="grid gap-5 p-4 sm:p-5">
                {step === 0 ? (
                  <>
                    <RadioGroup
                      name="kind"
                      legend="Abone Türü"
                      orientation="horizontal"
                      value={form.kind}
                      onChange={(v) => {
                        set("kind", v as Form["kind"]);
                        set("idNo", "");
                      }}
                      options={[
                        { value: "bireysel", label: "Bireysel", hint: "T.C. kimlik numarası" },
                        { value: "kurumsal", label: "Kurumsal", hint: "Vergi kimlik numarası" },
                      ]}
                    />
                    <Input label={form.kind === "bireysel" ? "Ad Soyad" : "Unvan"} name="name" value={form.name} onChange={(e) => set("name", e.target.value)} error={errors.name} autoComplete="off" />
                    <Input
                      label={idLabel(form)}
                      name="idNo"
                      inputMode="numeric"
                      maxLength={form.kind === "bireysel" ? 11 : 10}
                      value={form.idNo}
                      onChange={(e) => set("idNo", e.target.value.replace(/\D/g, ""))}
                      error={errors.idNo}
                      hint={form.kind === "bireysel" ? "11 hane; sağlama haneleri denetlenir." : "10 hane; sağlama hanesi denetlenir."}
                      autoComplete="off"
                    />
                    {dup ? (
                      <div role="note" className="rounded-xl bg-warning-wash p-4 text-base ring-1 ring-warning/20">
                        <p className="font-semibold text-strong">Bu kimlikle kayıtlı abone olabilir: {dup.name}</p>
                        <p className="mt-1 text-body">
                          {dup.id} · Tesisat {dup.installation}.{" "}
                          <a className="font-medium text-primary-ink underline" href={href("customers", { id: dup.id })}>
                            Kaydı Aç
                          </a>
                        </p>
                        <div className="mt-2">
                          <Checkbox label="Aynı Aboneye Ek Tesisat Olarak Aç" checked={form.addOnTenancy} onChange={(e) => set("addOnTenancy", e.target.checked)} />
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : null}

                {step === 1 ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input label="Cep Telefonu" name="phone" inputMode="tel" placeholder="05XX XXX XX XX" value={form.phone} onChange={(e) => set("phone", e.target.value)} error={errors.phone} />
                      <Input label="E-Posta" name="email" type="email" placeholder="ad@ornek.com" value={form.email} onChange={(e) => set("email", e.target.value)} error={errors.email} />
                    </div>
                    <div className="grid gap-1 rounded-xl bg-surface p-3">
                      <Switch label="SMS ile Bilgilendirme" hint="Fatura, kesinti ve okuma günü mesajları." checked={form.sms} onChange={(e) => set("sms", e.target.checked)} />
                      <Switch label="E-Fatura" hint="Fatura e-posta ile iletilir, kağıt fatura gönderilmez." checked={form.eInvoice} onChange={(e) => set("eInvoice", e.target.checked)} />
                    </div>
                    <div>
                      <Checkbox label="KVKK aydınlatma metnini okudum, kişisel verilerimin işlenmesini anladım." name="kvkk" checked={form.kvkk} onChange={(e) => set("kvkk", e.target.checked)} />
                      {errors.kvkk ? (
                        <p role="alert" className="mt-1 text-small text-danger">
                          {errors.kvkk}
                        </p>
                      ) : null}
                    </div>
                  </>
                ) : null}

                {step === 2 ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Select label="İlçe / Mahalle" value={form.area} onValueChange={(v) => v && set("area", v)} items={CITY_DISTRICTS.map((c) => ({ value: c.value, label: c.label }))} />
                      <Input label="Cadde, Sokak ve Kapı No" name="street" value={form.street} onChange={(e) => set("street", e.target.value)} error={errors.street} placeholder="Atatürk Cd. No: 12" />
                    </div>
                    {addrDup ? (
                      <div role="note" className="rounded-xl bg-warning-wash p-4 text-base ring-1 ring-warning/20">
                        <p className="font-semibold text-strong">Bu adreste kayıtlı tesisat var: {addrDup.name}</p>
                        <p className="mt-1 text-body">
                          {addrDup.id} · Tesisat {addrDup.installation}.{" "}
                          <a className="font-medium text-primary-ink underline" href={href("customers", { id: addrDup.id })}>
                            Kaydı Aç
                          </a>
                        </p>
                        <div className="mt-2">
                          <Checkbox label="Farklı Bağımsız Bölüm: Yeni Tesisat Açılacak" checked={form.addressAck} onChange={(e) => set("addressAck", e.target.checked)} />
                        </div>
                      </div>
                    ) : null}
                    <RadioGroup
                      name="voltage"
                      legend="Bağlantı Gerilimi"
                      orientation="horizontal"
                      value={form.voltage}
                      onChange={(v) => {
                        set("voltage", v as Form["voltage"]);
                        set("power", v === "OG" ? "250" : "8");
                        if (v === "OG") set("tariff", "sanayi");
                      }}
                      options={[
                        { value: "AG", label: "Alçak Gerilim (AG)", hint: "55 kW'a kadar" },
                        { value: "OG", label: "Orta Gerilim (OG)", hint: "100 kW ve üstü" },
                      ]}
                    />
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Input label="Sözleşme Gücü" name="power" inputMode="decimal" suffix="kW" value={form.power} onChange={(e) => set("power", e.target.value)} error={errors.power} />
                      <Select label="Tarife Grubu" value={form.tariff} onValueChange={(v) => v && set("tariff", v)} items={TARIFFS.map((t) => ({ value: t.value, label: t.label }))} />
                      <Select
                        label="Zaman Dilimi"
                        value={form.zone}
                        onValueChange={(v) => v && set("zone", v as Form["zone"])}
                        items={[{ value: "tek-zamanli", label: "Tek Zamanlı" }, { value: "cok-zamanli", label: "Çok Zamanlı (T1/T2/T3)" }]}
                      />
                    </div>
                    <CapacityInsight form={form} />
                    <div className="rounded-xl bg-surface p-3">
                      <Switch
                        label="Tedarikçimi Kendim Seçeceğim"
                        hint={freeEligible(form) ? `Serbest tüketici: tahmini yıllık tüketim ${fmtNum(estAnnual(form))} kWh, yıllık sınır ${fmtNum(getSettings().freeLimitKwh)} kWh (Ayarlar, örnek parametre).` : `Serbest tüketici sayılmaz (tahmini ${fmtNum(estAnnual(form))} kWh < ${fmtNum(getSettings().freeLimitKwh)} kWh): görevli tedarik şirketi atanır.`}
                        checked={form.free && freeEligible(form)}
                        disabled={!freeEligible(form)}
                        onChange={(e) => set("free", e.target.checked)}
                      />
                      {form.free && freeEligible(form) ? (
                        <div className="mt-2 pb-1">
                          <Select
                            label="Tedarikçi"
                            value={form.supplierId}
                            onValueChange={(v) => v && set("supplierId", v)}
                            items={SUPPLIERS.filter((s) => s.kind === "perakende").map((s) => ({ value: s.id, label: `${s.name} · ${s.unitPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL/kWh` }))}
                          />
                        </div>
                      ) : null}
                    </div>
                  </>
                ) : null}

                {step === 3 ? (
                  <>
                    <RadioGroup
                      name="meterMode"
                      legend="Sayaç"
                      orientation="horizontal"
                      value={form.meterMode}
                      onChange={(v) => set("meterMode", v as Form["meterMode"])}
                      options={[
                        { value: "pool", label: "Depodaki Sayaçtan Ata", hint: "Test ve mühürlü hazır sayaç" },
                        { value: "new", label: "Yeni Sayaç Tanımla", hint: "Seri no ve trafo oranlarıyla" },
                      ]}
                    />
                    {form.meterMode === "pool" ? (
                      freeStock.length ? (
                        <>
                          <Select
                            label="Depodaki Sayaç"
                            value={form.poolId}
                            onValueChange={(v) => v && set("poolId", v)}
                            items={freeStock.slice(0, 40).map((m) => ({ value: m.id, label: `${m.serial} · ${m.model}` }))}
                          />
                          {errors.poolId ? <p role="alert" className="text-small text-danger">{errors.poolId}</p> : null}
                          <p className="text-small text-muted">{fmtNum(freeStock.length)} sayaç stokta. Kayıt tamamlanınca seçilen sayaç stoktan düşer ve aboneye tahsis edilir.</p>
                        </>
                      ) : (
                        <p role="note" className="rounded-xl bg-warning-wash p-4 text-base text-body ring-1 ring-warning/20">Stokta sayaç kalmadı. Yeni sayaç tanımlayın ya da Envanter sayfasından sayaç alın.</p>
                      )
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Input label="Seri No" name="serial" value={form.serial} onChange={(e) => set("serial", e.target.value)} error={errors.serial} placeholder="KZA-26-123456" />
                        <Select label="Model" value={form.model} onValueChange={(v) => v && set("model", v)} items={METER_MODELS.map((m) => ({ value: m, label: m }))} />
                        {form.voltage === "OG" ? (
                          <>
                            <Input label="Akım Trafosu" name="ct" placeholder="200/5" value={form.ct} onChange={(e) => set("ct", e.target.value)} error={errors.ct} />
                            <Input label="Gerilim Trafosu" name="vt" placeholder="15.8 kV/100 V" value={form.vt} onChange={(e) => set("vt", e.target.value)} error={errors.vt} />
                          </>
                        ) : null}
                        <Input label="Çarpan" readOnly value={fmtNum(multiplierOf(form))} hint={form.voltage === "OG" ? "Akım trafosu oranı × gerilim trafosu oranı; kendiliğinden hesaplanır." : "Alçak gerilimde doğrudan bağlantı: çarpan 1."} />
                      </div>
                    )}
                    <fieldset className="grid gap-3">
                      <legend className="mb-1 text-small font-medium text-muted">İlk Endeks (kWh)</legend>
                      <div className={`grid gap-4 ${form.zone === "cok-zamanli" ? "sm:grid-cols-3" : "sm:grid-cols-1"}`}>
                        <Input label={form.zone === "cok-zamanli" ? "T1 Gündüz" : "Toplam"} name="idx1" inputMode="numeric" value={form.idx1} onChange={(e) => set("idx1", e.target.value)} error={errors.idx1} />
                        {form.zone === "cok-zamanli" ? (
                          <>
                            <Input label="T2 Puant" name="idx2" inputMode="numeric" value={form.idx2} onChange={(e) => set("idx2", e.target.value)} error={errors.idx2} />
                            <Input label="T3 Gece" name="idx3" inputMode="numeric" value={form.idx3} onChange={(e) => set("idx3", e.target.value)} error={errors.idx3} />
                          </>
                        ) : null}
                      </div>
                    </fieldset>
                    <Input label="Mühür Numarası" name="seal" value={form.seal} onChange={(e) => set("seal", e.target.value)} error={errors.seal} placeholder="MH-482915" />
                  </>
                ) : null}

                {step === 4 ? (
                  <>
                    <div className="rounded-xl bg-surface p-3">
                      <Switch label="Otomatik Ödeme Talimatı" hint="Fatura vadesinde hesaptan tahsil edilir." checked={form.autoPay} onChange={(e) => set("autoPay", e.target.checked)} />
                      {form.autoPay ? (
                        <div className="mt-2 pb-1">
                          <Input label="IBAN" name="iban" value={form.iban} onChange={(e) => set("iban", e.target.value)} error={errors.iban} hint="TR ile başlayan 26 hane; sağlama denetlenir." placeholder="TR00 0000 0000 0000 0000 0000 00" />
                        </div>
                      ) : null}
                    </div>
                    <RadioGroup
                      name="notifyVia"
                      legend="Fatura Tebliği"
                      orientation="horizontal"
                      value={form.notifyVia}
                      onChange={(v) => set("notifyVia", v as Form["notifyVia"])}
                      options={[
                        { value: "sms", label: "SMS", hint: "Bağlantı ile" },
                        { value: "email", label: "E-Posta", hint: "PDF ek" },
                        { value: "basili", label: "Basılı", hint: "Posta ile" },
                      ]}
                    />
                    <div className="rounded-xl bg-primary-wash p-4 ring-1 ring-primary/15">
                      <p className="text-small font-medium text-primary-ink">Teminat bedeli (örnek hesap)</p>
                      <p className="mt-1 text-heading font-semibold tabular-nums text-strong">{fmtTl(guarantee(form))}</p>
                      <p className="mt-1 text-small text-body">
                        {form.power || 0} kW × {TARIFFS.find((t) => t.value === form.tariff)?.perKw} TL/kW. Tutarlar örnektir; gerçek bedel düzenleyici kararla belirlenir.
                      </p>
                    </div>
                  </>
                ) : null}

                {step === 5 ? (
                  <div className="grid gap-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Summary title="Abone" onEdit={() => setStep(0)} rows={[[form.kind === "bireysel" ? "Ad Soyad" : "Unvan", form.name], [idLabel(form), `${"•".repeat(Math.max(0, form.idNo.length - 3))}${form.idNo.slice(-3)}`], ["Ek Tesisat", form.addOnTenancy ? "Evet, mevcut aboneye" : "Hayır"]]} />
                      <Summary title="İletişim" onEdit={() => setStep(1)} rows={[["Telefon", fmtPhone(form.phone)], ["E-Posta", form.email], ["Bilgilendirme", [form.sms && "SMS", form.eInvoice && "E-fatura"].filter(Boolean).join(", ") || "Yok"]]} />
                      <Summary title="Tesisat" onEdit={() => setStep(2)} rows={[["Adres", `${form.street}, ${district}`], ["Bölge", region(regionId).name], ["Gerilim ve Güç", `${form.voltage} · ${form.power} kW`], ["Tarife", `${TARIFFS.find((t) => t.value === form.tariff)?.label} · ${form.zone === "tek-zamanli" ? "tek zamanlı" : "çok zamanlı"}`], ["Tedarikçi", form.free && freeEligible(form) ? supplier(form.supplierId).name : `${SUPPLIERS[0].name} (görevli)`]]} />
                      <Summary title="Sayaç" onEdit={() => setStep(3)} rows={[["Sayaç", form.meterMode === "pool" ? (stock.find((m) => m.id === form.poolId)?.serial ?? "—") : form.serial.toUpperCase()], ["Çarpan", fmtNum(multiplierOf(form))], ["İlk Endeks", form.zone === "cok-zamanli" ? `${form.idx1} / ${form.idx2} / ${form.idx3} kWh` : `${form.idx1} kWh`], ["Mühür", form.seal]]} />
                      <Summary title="Ödeme" onEdit={() => setStep(4)} rows={[["Otomatik Ödeme", form.autoPay ? `Açık · ${form.iban.replace(/\s/g, "").slice(0, 4)} •••• ${form.iban.replace(/\s/g, "").slice(-4)}` : "Kapalı"], ["Tebliğ", { sms: "SMS", email: "E-posta", basili: "Basılı" }[form.notifyVia]], ["Teminat", fmtTl(guarantee(form))]]} />
                    </div>
                    <div>
                      <Checkbox label="Girdiğim bilgilerin doğru olduğunu ve kaydın oluşturulmasını onaylıyorum." name="confirm" checked={form.confirm} onChange={(e) => set("confirm", e.target.checked)} />
                      {errors.confirm ? (
                        <p role="alert" className="mt-1 text-small text-danger">
                          {errors.confirm}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft px-4 py-3 sm:px-5">
                <Button type="button" variant="ghost" onClick={back} disabled={step === 0}>
                  <ArrowLeft /> Geri
                </Button>
                <p className="text-small text-muted" aria-live="polite">
                  Adım {step + 1} / {STEPS.length}
                </p>
                <Button type="submit" variant="primary">
                  {step === STEPS.length - 1 ? (
                    <>
                      <Check /> Kaydı Tamamla
                    </>
                  ) : (
                    <>
                      İleri <ArrowRight />
                    </>
                  )}
                </Button>
              </div>
            </Panel>
          </form>

          <aside aria-label="Canlı Özet" className="grid content-start gap-5 xl:sticky xl:top-4 xl:self-start">
            <Panel title="Canlı Özet" note="Girdikçe dolar" id="kayit-ozet">
              <dl className="grid gap-3 p-4 text-base sm:p-5">
                <Live label="Abone" value={form.name || "—"} done={form.name.length >= 3} />
                <Live label={idLabel(form)} value={form.idNo ? `${"•".repeat(Math.max(0, form.idNo.length - 3))}${form.idNo.slice(-3)}` : "—"} done={form.kind === "bireysel" ? validTckn(form.idNo) : validVkn(form.idNo)} />
                <Live label="Telefon" value={form.phone ? fmtPhone(form.phone) : "—"} done={validPhone(form.phone)} />
                <Live label="Adres" value={form.street ? `${form.street}, ${district}` : "—"} done={form.street.length >= 6} />
                <Live label="Tesisat" value={step > 2 ? `${form.voltage} · ${form.power || 0} kW · ${KIND_LABEL[kind]}` : "—"} done={step > 2} />
                <Live label="Sayaç" value={step > 3 ? (form.meterMode === "pool" ? (stock.find((m) => m.id === form.poolId)?.serial ?? "—") : form.serial.toUpperCase() || "—") : "—"} done={step > 3} />
              </dl>
              <div className="border-t border-line-soft px-4 py-3 sm:px-5">
                <TickMeter label="Tamamlanan Adım" value={step} max={STEPS.length} text={`${step} / ${STEPS.length}`} />
              </div>
            </Panel>
            <p className="text-small text-muted">
              Teminat tutarı örnek hesaptır. Kayıt tamamlanınca abone listesinde, sayaç envanterinde ve stok kayıtlarında görünür.
            </p>
          </aside>
        </div>
      </PageBody>
    </>
  );
}

/** Tesisat adımı önerisi: yöredeki dağıtım trafosunun boş kapasitesi ve serbest tüketici uygunluğu (örnek hesap). */
function CapacityInsight({ form }: { form: Form }) {
  const [regionId] = form.area.split("|");
  const tr = TRANSFORMERS.find((x) => x.regionId === regionId) ?? TRANSFORMERS[0];
  const load = TRANSFORMER_LOADS.find((x) => x.id === tr.id);
  const kw = Number(form.power) || 0;
  if (!load || kw <= 0) return null;
  const usable = Math.round(tr.kva * 0.9);
  const free = Math.max(0, Math.round(usable - load.loadKw));
  const tight = kw > free;
  const free2 = freeEligible(form);
  return (
    <InsightCallout
      title={tight ? "Trafo Kapasitesi Yetersiz Olabilir" : "Bağlantı İçin Kapasite Uygun"}
      kind={tight ? "warning" : "insight"}
      label={tight ? "Dikkat" : "Öneri"}
      headingLevel={3}
    >
      {tight
        ? `Yöredeki ${tr.name} trafosunda yaklaşık ${fmtNum(free)} kW boş kapasite var; talep ${fmtNum(kw)} kW. Sözleşme gücünü düşürmek ya da trafo güçlendirme için keşif planlamak gerekebilir.`
        : `Yöredeki ${tr.name} trafosunda yaklaşık ${fmtNum(free)} kW boş kapasite var; talep ${fmtNum(kw)} kW ile bağlantı karşılanır.`}{" "}
      {free2 ? "Tahmini yıllık tüketim serbest tüketici sınırını aşıyor: tedarikçi seçilebilir." : "Tahmini yıllık tüketim serbest tüketici sınırının altında: görevli tedarik şirketi atanır."}
    </InsightCallout>
  );
}

function Live({ label, value, done }: { label: string; value: string; done: boolean }) {
  return (
    <div className="grid grid-cols-[1rem_minmax(0,1fr)] gap-x-2.5">
      <span aria-hidden className={`col-start-1 row-span-2 mt-1 grid size-4 place-items-center rounded-full text-on-primary ${done ? "bg-success" : "bg-surface-raised"}`}>
        {done ? <Check className="size-3" strokeWidth={3} /> : null}
      </span>
      <dt className="col-start-2 min-w-0 text-small text-muted">
        {label}
        <span className="sr-only">{done ? ", tamam" : ", eksik"}</span>
      </dt>
      <dd className="col-start-2 min-w-0 break-words font-medium text-strong">{value}</dd>
    </div>
  );
}

function Summary({ title, rows, onEdit }: { title: string; rows: readonly (readonly [string, ReactNode])[]; onEdit: () => void }) {
  return (
    <section aria-label={title} className="rounded-xl bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-strong">{title}</h3>
        <button type="button" onClick={onEdit} className="min-h-9 rounded-md px-2 text-small font-medium text-primary-ink hover:underline">
          Düzenle<span className="sr-only">: {title}</span>
        </button>
      </div>
      <dl className="mt-2 grid gap-1.5 text-base">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-3">
            <dt className="shrink-0 text-small text-muted">{k}</dt>
            <dd className="min-w-0 break-words text-right text-body">{v || "—"}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* --- Başarı --------------------------------------------------------------------- */

function Basari({ record, onNew, go }: { record: { customer: Customer; meter: Meter }; onNew: () => void; go: PageProps["go"] }) {
  const { notify } = useApp();
  const [contract, setContract] = useState(false);
  const { customer: c, meter: m } = record;
  return (
    <>
      <PageHead title="Abone Kaydı" description="Kayıt tamamlandı." />
      <PageBody>
        <section aria-labelledby="kayit-basari" className="mx-auto grid w-full max-w-2xl gap-5 rounded-xl bg-overlay p-6 text-center shadow-raised ring-1 ring-line sm:p-8">
          <span aria-hidden className="mx-auto grid size-12 place-items-center rounded-full bg-success-wash text-success">
            <CircleCheck className="size-6" />
          </span>
          <div>
            <h2 id="kayit-basari" className="text-heading font-semibold text-strong">
              Abonelik Açıldı
            </h2>
            <p className="mt-1 text-base text-muted">
              {c.name} için kayıt oluşturuldu. Sayaç ilk okuma turuna eklendi.
            </p>
          </div>
          <dl className="mx-auto grid w-full max-w-md gap-2 rounded-xl bg-surface p-4 text-left text-base">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Abone no</dt>
              <dd className="kz-mono font-semibold text-strong">{c.id}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Tesisat no</dt>
              <dd className="kz-mono text-strong">{c.installation}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Sayaç</dt>
              <dd className="kz-mono text-strong">{m.serial}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Tedarikçi</dt>
              <dd className="text-strong">{supplier(c.supplierId).name}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Durum</dt>
              <dd>
                <Badge tone="success" dot>
                  Aktif
                </Badge>
              </dd>
            </div>
          </dl>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="secondary" onClick={() => setContract(true)}>
              <Printer /> Sözleşmeyi Yazdır / PDF
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                audit("Karşılama SMS'i gönderdi", c.id);
                notify({ title: "SMS Gönderildi", body: "Abone numarası ve karşılama mesajı kayıtlı telefona iletildi.", tone: "success" });
              }}
            >
              <MessageSquare /> Aboneye SMS Gönder
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 border-t border-line-soft pt-5">
            <Button variant="primary" onClick={() => go("customers", { id: c.id })}>
              <UserPlus /> Abone Kartını Aç
            </Button>
            <a className={buttonClass({ variant: "ghost" })} href={href("meters", { id: m.id })}>
              <Gauge /> Sayacı Gör
            </a>
            <Button variant="ghost" onClick={onNew}>
              <FileText /> Yeni Kayıt Başlat
            </Button>
          </div>
        </section>
      </PageBody>
      <ContractDialog open={contract} onClose={() => setContract(false)} customer={c} meter={m} />
    </>
  );
}

/** Yazdırılabilir sözleşme: yalnız belge yazdırılır (`@media print`), PDF olarak kaydetme tarayıcının yazdırma penceresindendir. */
function ContractDialog({ open, onClose, customer: c, meter: m }: { open: boolean; onClose: () => void; customer: Customer; meter: Meter }) {
  const sup = supplier(c.supplierId);
  const rows: readonly (readonly [string, string])[] = [
    ["Abone No", c.id],
    ["Abone", c.name],
    ["Tesisat No", c.installation],
    ["Adres", c.address],
    ["Gerilim ve Sözleşme Gücü", `${c.voltage === "OG" ? "Orta gerilim" : "Alçak gerilim"} · ${fmtNum(c.contractKw ?? 0)} kW`],
    ["Sayaç", `${m.serial} · ${m.model} · çarpan ${fmtNum(m.multiplier)}`],
    ["Tedarikçi", sup.name],
    ["Başlangıç", dayLabel(TODAY_KEY)],
  ];
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      size="lg"
      title="Şebeke Kullanım Sözleşmesi"
      description="Örnek belge: yazdırma penceresinden PDF olarak kaydedebilirsiniz."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Kapat
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              audit("Sözleşme yazdırdı", c.id);
              window.print();
            }}
          >
            <Printer /> Yazdır
          </Button>
        </>
      }
    >
      <style href="kz-contract-print" precedence="default">{`@media print { body * { visibility: hidden !important; } #kz-sozlesme, #kz-sozlesme * { visibility: visible !important; } #kz-sozlesme { position: absolute; inset: 0; padding: 24mm; background: white; color: black; } }`}</style>
      <article id="kz-sozlesme" className="grid gap-4 rounded-xl bg-surface p-5 text-base text-body">
        <header>
          <p className="text-small font-medium text-muted">Kuzeyova Elektrik Dağıtım A.Ş.</p>
          <h3 className="text-read font-semibold text-strong">Elektrik Şebeke Kullanım Sözleşmesi (Örnek)</h3>
        </header>
        <dl className="grid gap-2">
          {rows.map(([k, v]) => (
            <div key={k} className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 border-b border-line-soft pb-2 last:border-0">
              <dt className="text-small text-muted">{k}</dt>
              <dd className="text-right font-medium text-strong">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="text-small text-muted">Bu belge demo amaçlıdır; hukuki hüküm içermez. Bedel ve yükümlülükler yürürlükteki tarife ve mevzuata göre belirlenir.</p>
        <div className="grid grid-cols-2 gap-6 pt-6 text-center text-small text-muted">
          <p className="border-t border-line pt-2">Dağıtım Şirketi</p>
          <p className="border-t border-line pt-2">Abone</p>
        </div>
      </article>
    </Dialog>
  );
}
