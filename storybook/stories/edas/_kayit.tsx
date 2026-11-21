"use client";

import { useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, CircleCheck, Download, FileText, Gauge, MessageSquare, Save, UserPlus, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup } from "@/components/ui/radio-group";
import { Select } from "@/components/ui/select";
import { Stepper } from "@/components/ui/stepper";
import { Switch } from "@/components/ui/switch";
import { TickMeter } from "@/components/ui/tick-meter";
import { SUBSTATIONS, SUPPLIERS, TODAY, TODAY_KEY, region, supplier, tl, KIND_LABEL, type Customer, type Meter } from "./_data";
import {
  CITY_DISTRICTS,
  DEMO_IDS,
  KIND_BY_TARIFF,
  KNOWN_IDS,
  METER_MODELS,
  METER_POOL,
  TARIFFS,
  addCustomer,
  allCustomers,
  findCustomer,
  validEmail,
  validIban,
  validPhone,
  validTckn,
  validVkn,
} from "./_data-musteri";
import { PageBody, PageHead, Panel, SampleNote, href, useApp, type PageProps } from "./_ui";

/* --- Form modeli ------------------------------------------------------------ */

type Form = {
  kind: "bireysel" | "kurumsal";
  name: string;
  idNo: string;
  addOnTenancy: boolean;
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
  multiplier: string;
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
  poolId: METER_POOL[0].id,
  serial: "",
  model: METER_MODELS[0],
  multiplier: "1",
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
  { label: "Müşteri", description: "Tür ve kimlik" },
  { label: "İletişim", description: "Telefon, e-posta" },
  { label: "Tesisat", description: "Adres ve tarife" },
  { label: "Sayaç", description: "Atama, endeks" },
  { label: "Ödeme", description: "Talimat, teminat" },
  { label: "Onay", description: "Özet" },
];

type Errors = Partial<Record<string, string>>;

/** Teminat (örnek hesap): sözleşme gücü × tarifeye göre kW başı bedel. */
const guarantee = (f: Form) => Math.round((Number(f.power) || 0) * (TARIFFS.find((t) => t.value === f.tariff)?.perKw ?? 0) * 100);
const freeEligible = (f: Form) => f.voltage === "OG" || Number(f.power) >= 100;
const idLabel = (f: Form) => (f.kind === "bireysel" ? "T.C. kimlik no" : "Vergi kimlik no");

function validate(step: number, f: Form): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (f.name.trim().length < 3) e.name = f.kind === "bireysel" ? "Ad soyad en az 3 karakter olmalı." : "Unvan en az 3 karakter olmalı.";
    if (f.kind === "bireysel" ? !validTckn(f.idNo) : !validVkn(f.idNo)) e.idNo = f.kind === "bireysel" ? "T.C. kimlik numarası geçersiz (11 hane, sağlama hanesi tutmuyor)." : "Vergi kimlik numarası geçersiz (10 hane, sağlama hanesi tutmuyor).";
    else if (KNOWN_IDS[f.idNo] && !f.addOnTenancy) e.idNo = "Bu kimlikle kayıtlı bir abone var. Ek tesisat olarak açacaksanız aşağıdaki kutuyu işaretleyin.";
  }
  if (step === 1) {
    if (!validPhone(f.phone)) e.phone = "Telefon 05XX XXX XX XX biçiminde 11 hane olmalı.";
    if (!validEmail(f.email)) e.email = "E-posta adresi geçerli değil.";
    if (!f.kvkk) e.kvkk = "Devam için KVKK aydınlatma metninin okunduğu onaylanmalı.";
  }
  if (step === 2) {
    if (f.street.trim().length < 6) e.street = "Cadde, sokak ve kapı numarasını yazın.";
    const kw = Number(f.power);
    if (!Number.isFinite(kw) || kw <= 0) e.power = "Sözleşme gücü sıfırdan büyük olmalı.";
    else if (f.voltage === "AG" && kw > 55) e.power = "Alçak gerilimde 55 kW üstü güç için orta gerilim tesisat gerekir.";
    else if (f.voltage === "OG" && kw < 100) e.power = "Orta gerilimde sözleşme gücü en az 100 kW olmalı.";
  }
  if (step === 3) {
    if (f.meterMode === "new") {
      if (!/^[A-Z]{3}-\d{2}-\d{6}$/.test(f.serial.trim().toUpperCase())) e.serial = "Seri no KZA-26-123456 biçiminde olmalı.";
      if (!(Number(f.multiplier) >= 1)) e.multiplier = "Çarpan 1 ya da daha büyük olmalı.";
      if (f.voltage === "OG" && !f.ct.trim()) e.ct = "Orta gerilimde akım trafosu oranı gerekli (örn. 200/5).";
      if (f.voltage === "OG" && !f.vt.trim()) e.vt = "Orta gerilimde gerilim trafosu oranı gerekli.";
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

function buildRecords(f: Form): { customer: Customer; meter: Meter } {
  const [regionId, district] = f.area.split("|");
  const idNum = allCustomers().length + 90001;
  const pool = METER_POOL.find((m) => m.id === f.poolId);
  const kind = KIND_BY_TARIFF(f.tariff);
  const supplierId = f.free && freeEligible(f) ? f.supplierId : SUPPLIERS[0].id;
  const customer: Customer = {
    id: `C-${idNum}`,
    name: f.name.trim(),
    kind,
    voltage: f.voltage,
    free: f.free && freeEligible(f),
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
  };
  const sub = SUBSTATIONS.find((s) => s.regionId === regionId) ?? SUBSTATIONS[0];
  const multi = f.zone === "cok-zamanli";
  const meter: Meter = {
    id: `M-N${String(idNum).slice(-4)}`,
    serial: f.meterMode === "pool" ? (pool?.serial ?? "KZA-26-000000") : f.serial.trim().toUpperCase(),
    model: f.meterMode === "pool" ? (pool?.model ?? METER_MODELS[0]) : f.model,
    customerId: customer.id,
    substationId: sub.id,
    comm: pool && f.meterMode === "pool" ? pool.comm : f.voltage === "OG" ? "gsm" : "ami",
    status: "okunuyor",
    multiplier: f.meterMode === "new" ? n(f.multiplier) || 1 : f.voltage === "OG" ? 40 : 1,
    ct: f.voltage === "OG" ? f.ct || "—" : "—",
    vt: f.voltage === "OG" ? f.vt || "—" : "—",
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

export function KayitPage({ go }: PageProps) {
  const { notify } = useApp();
  const [form, setForm] = useState<Form>(DRAFT?.form ?? INITIAL);
  const [step, setStep] = useState(DRAFT?.step ?? 0);
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState<{ customer: Customer; meter: Meter } | null>(null);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      DRAFT = { form: next, step };
      return next;
    });
    setErrors((prev) => (prev[key as string] ? { ...prev, [key as string]: undefined } : prev));
  };

  const dup = KNOWN_IDS[form.idNo] ? findCustomer(KNOWN_IDS[form.idNo]) : undefined;

  function next() {
    const found = validate(step, form);
    setErrors(found);
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      queueMicrotask(() => document.querySelector<HTMLElement>(`[name="${first}"], #kayit-${first}`)?.focus());
      return;
    }
    if (step === STEPS.length - 1) {
      const rec = buildRecords(form);
      addCustomer(rec.customer, rec.meter);
      DRAFT = null;
      setDone(rec);
      notify({ title: "Abonelik açıldı", body: `${rec.customer.id} · ${rec.customer.name}`, tone: "success" });
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

  if (done) return <Basari record={done} onNew={reset} go={go} />;

  const kind = KIND_BY_TARIFF(form.tariff);
  const [regionId, district] = form.area.split("|");

  return (
    <>
      <PageHead
        title="Müşteri Kaydı"
        description="Yeni abone, tesisat, sayaç ve ödeme talimatı tek akışta. Her adım doğrulanır."
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              DRAFT = { form, step };
              notify({ title: "Taslak kaydedildi", body: "Bu sayfaya dönünce kaldığınız yerden devam edersiniz.", tone: "success" });
            }}
          >
            <Save /> Taslağı Kaydet
          </Button>
        }
      />
      <PageBody>
        <Stepper steps={STEPS} current={step} aria-label="Kayıt adımları" />
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
                      legend="Müşteri türü"
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
                    <Input label={form.kind === "bireysel" ? "Ad soyad" : "Unvan"} name="name" value={form.name} onChange={(e) => set("name", e.target.value)} error={errors.name} autoComplete="off" />
                    <Input
                      label={idLabel(form)}
                      name="idNo"
                      inputMode="numeric"
                      maxLength={form.kind === "bireysel" ? 11 : 10}
                      value={form.idNo}
                      onChange={(e) => set("idNo", e.target.value.replace(/\D/g, ""))}
                      error={errors.idNo}
                      hint={`Denemek için geçerli: ${form.kind === "bireysel" ? DEMO_IDS.tckn : DEMO_IDS.vkn} (zaten kayıtlı). Başka bir geçerli numara yeni kayıt açar.`}
                      autoComplete="off"
                    />
                    {dup ? (
                      <div role="note" className="rounded-xl bg-warning-wash p-4 text-base ring-1 ring-warning/20">
                        <p className="font-semibold text-strong">Bu kimlikle kayıtlı abone var: {dup.name}</p>
                        <p className="mt-1 text-body">
                          {dup.id} · Tesisat {dup.installation}.{" "}
                          <a className="font-medium text-primary-ink underline" href={href("customers", { id: dup.id })}>
                            Kaydı aç
                          </a>
                        </p>
                        <div className="mt-2">
                          <Checkbox label="Aynı müşteriye ek tesisat olarak aç" checked={form.addOnTenancy} onChange={(e) => set("addOnTenancy", e.target.checked)} />
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : null}

                {step === 1 ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input label="Cep telefonu" name="phone" inputMode="tel" placeholder="05XX XXX XX XX" value={form.phone} onChange={(e) => set("phone", e.target.value)} error={errors.phone} />
                      <Input label="E-posta" name="email" type="email" placeholder="ad@ornek.com" value={form.email} onChange={(e) => set("email", e.target.value)} error={errors.email} />
                    </div>
                    <div className="grid gap-1 rounded-xl bg-surface p-3">
                      <Switch label="SMS ile bilgilendirme" hint="Fatura, kesinti ve okuma günü mesajları." checked={form.sms} onChange={(e) => set("sms", e.target.checked)} />
                      <Switch label="E-fatura" hint="Fatura e-posta ile iletilir, kâğıt fatura gönderilmez." checked={form.eInvoice} onChange={(e) => set("eInvoice", e.target.checked)} />
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
                      <Select label="İlçe / mahalle" value={form.area} onValueChange={(v) => v && set("area", v)} items={CITY_DISTRICTS.map((c) => ({ value: c.value, label: c.label }))} />
                      <Input label="Cadde, sokak ve kapı no" name="street" value={form.street} onChange={(e) => set("street", e.target.value)} error={errors.street} placeholder="Atatürk Cd. No: 12" />
                    </div>
                    <RadioGroup
                      name="voltage"
                      legend="Bağlantı gerilimi"
                      orientation="horizontal"
                      value={form.voltage}
                      onChange={(v) => {
                        set("voltage", v as Form["voltage"]);
                        set("power", v === "OG" ? "250" : "8");
                        if (v === "OG") set("tariff", "sanayi");
                      }}
                      options={[
                        { value: "AG", label: "Alçak gerilim (AG)", hint: "55 kW'a kadar" },
                        { value: "OG", label: "Orta gerilim (OG)", hint: "100 kW ve üstü" },
                      ]}
                    />
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Input label="Sözleşme gücü" name="power" inputMode="decimal" suffix="kW" value={form.power} onChange={(e) => set("power", e.target.value)} error={errors.power} />
                      <Select label="Tarife grubu" value={form.tariff} onValueChange={(v) => v && set("tariff", v)} items={TARIFFS.map((t) => ({ value: t.value, label: t.label }))} />
                      <Select
                        label="Zaman dilimi"
                        value={form.zone}
                        onValueChange={(v) => v && set("zone", v as Form["zone"])}
                        items={[{ value: "tek-zamanli", label: "Tek zamanlı" }, { value: "cok-zamanli", label: "Çok zamanlı (T1/T2/T3)" }]}
                      />
                    </div>
                    <div className="rounded-xl bg-surface p-3">
                      <Switch
                        label="Serbest tüketici"
                        hint={freeEligible(form) ? "Uygun: tedarikçi seçilebilir (orta gerilim ya da yüksek güç, örnek eşik)." : "Uygun değil: görevli tedarik şirketi atanır (örnek eşik: OG ya da 100 kW üstü)."}
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
                        { value: "pool", label: "Depodaki sayaçtan ata", hint: "Test ve mühürlü hazır sayaç" },
                        { value: "new", label: "Yeni sayaç tanımla", hint: "Seri no ve trafo oranlarıyla" },
                      ]}
                    />
                    {form.meterMode === "pool" ? (
                      <Select
                        label="Depodaki sayaç"
                        value={form.poolId}
                        onValueChange={(v) => v && set("poolId", v)}
                        items={METER_POOL.map((m) => ({ value: m.id, label: `${m.serial} · ${m.model}` }))}
                      />
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Input label="Seri no" name="serial" value={form.serial} onChange={(e) => set("serial", e.target.value)} error={errors.serial} placeholder="KZA-26-123456" />
                        <Select label="Model" value={form.model} onValueChange={(v) => v && set("model", v)} items={METER_MODELS.map((m) => ({ value: m, label: m }))} />
                        <Input label="Çarpan" name="multiplier" inputMode="numeric" value={form.multiplier} onChange={(e) => set("multiplier", e.target.value)} error={errors.multiplier} hint="Akım ve gerilim trafosu oranlarının çarpımı." />
                        {form.voltage === "OG" ? (
                          <>
                            <Input label="Akım trafosu" name="ct" placeholder="200/5" value={form.ct} onChange={(e) => set("ct", e.target.value)} error={errors.ct} />
                            <Input label="Gerilim trafosu" name="vt" placeholder="15.8 kV/100 V" value={form.vt} onChange={(e) => set("vt", e.target.value)} error={errors.vt} />
                          </>
                        ) : null}
                      </div>
                    )}
                    <fieldset className="grid gap-3">
                      <legend className="mb-1 text-small font-medium text-muted">İlk endeks (kWh)</legend>
                      <div className={`grid gap-4 ${form.zone === "cok-zamanli" ? "sm:grid-cols-3" : "sm:grid-cols-1"}`}>
                        <Input label={form.zone === "cok-zamanli" ? "T1 gündüz" : "Toplam"} name="idx1" inputMode="numeric" value={form.idx1} onChange={(e) => set("idx1", e.target.value)} error={errors.idx1} />
                        {form.zone === "cok-zamanli" ? (
                          <>
                            <Input label="T2 puant" name="idx2" inputMode="numeric" value={form.idx2} onChange={(e) => set("idx2", e.target.value)} error={errors.idx2} />
                            <Input label="T3 gece" name="idx3" inputMode="numeric" value={form.idx3} onChange={(e) => set("idx3", e.target.value)} error={errors.idx3} />
                          </>
                        ) : null}
                      </div>
                    </fieldset>
                    <Input label="Mühür numarası" name="seal" value={form.seal} onChange={(e) => set("seal", e.target.value)} error={errors.seal} placeholder="MH-482915" />
                  </>
                ) : null}

                {step === 4 ? (
                  <>
                    <div className="rounded-xl bg-surface p-3">
                      <Switch label="Otomatik ödeme talimatı" hint="Fatura vadesinde hesaptan tahsil edilir." checked={form.autoPay} onChange={(e) => set("autoPay", e.target.checked)} />
                      {form.autoPay ? (
                        <div className="mt-2 pb-1">
                          <Input label="IBAN" name="iban" value={form.iban} onChange={(e) => set("iban", e.target.value)} error={errors.iban} hint={`Denemek için geçerli IBAN: ${DEMO_IDS.iban}`} placeholder="TR00 0000 0000 0000 0000 0000 00" />
                        </div>
                      ) : null}
                    </div>
                    <RadioGroup
                      name="notifyVia"
                      legend="Fatura tebliği"
                      orientation="horizontal"
                      value={form.notifyVia}
                      onChange={(v) => set("notifyVia", v as Form["notifyVia"])}
                      options={[
                        { value: "sms", label: "SMS", hint: "Bağlantı ile" },
                        { value: "email", label: "E-posta", hint: "PDF ek" },
                        { value: "basili", label: "Basılı", hint: "Posta ile" },
                      ]}
                    />
                    <div className="rounded-xl bg-primary-wash p-4 ring-1 ring-primary/15">
                      <p className="text-small font-medium text-primary-ink">Teminat bedeli (örnek hesap)</p>
                      <p className="mt-1 text-heading font-semibold tabular-nums text-strong">{tl(guarantee(form))}</p>
                      <p className="mt-1 text-small text-body">
                        {form.power || 0} kW × {TARIFFS.find((t) => t.value === form.tariff)?.perKw} TL/kW. Tutarlar örnektir; gerçek bedel düzenleyici kararla belirlenir.
                      </p>
                    </div>
                  </>
                ) : null}

                {step === 5 ? (
                  <div className="grid gap-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Summary title="Müşteri" onEdit={() => setStep(0)} rows={[[form.kind === "bireysel" ? "Ad soyad" : "Unvan", form.name], [idLabel(form), `${"•".repeat(Math.max(0, form.idNo.length - 3))}${form.idNo.slice(-3)}`], ["Ek tesisat", form.addOnTenancy ? "Evet, mevcut müşteriye" : "Hayır"]]} />
                      <Summary title="İletişim" onEdit={() => setStep(1)} rows={[["Telefon", fmtPhone(form.phone)], ["E-posta", form.email], ["Bilgilendirme", [form.sms && "SMS", form.eInvoice && "E-fatura"].filter(Boolean).join(", ") || "Yok"]]} />
                      <Summary title="Tesisat" onEdit={() => setStep(2)} rows={[["Adres", `${form.street}, ${district}`], ["Bölge", region(regionId).name], ["Gerilim ve güç", `${form.voltage} · ${form.power} kW`], ["Tarife", `${TARIFFS.find((t) => t.value === form.tariff)?.label} · ${form.zone === "tek-zamanli" ? "tek zamanlı" : "çok zamanlı"}`], ["Tedarikçi", form.free && freeEligible(form) ? supplier(form.supplierId).name : `${SUPPLIERS[0].name} (görevli)`]]} />
                      <Summary title="Sayaç" onEdit={() => setStep(3)} rows={[["Sayaç", form.meterMode === "pool" ? (METER_POOL.find((m) => m.id === form.poolId)?.serial ?? "—") : form.serial.toUpperCase()], ["İlk endeks", form.zone === "cok-zamanli" ? `${form.idx1} / ${form.idx2} / ${form.idx3} kWh` : `${form.idx1} kWh`], ["Mühür", form.seal]]} />
                      <Summary title="Ödeme" onEdit={() => setStep(4)} rows={[["Otomatik ödeme", form.autoPay ? `Açık · ${form.iban.replace(/\s/g, "").slice(0, 4)} •••• ${form.iban.replace(/\s/g, "").slice(-4)}` : "Kapalı"], ["Tebliğ", { sms: "SMS", email: "E-posta", basili: "Basılı" }[form.notifyVia]], ["Teminat", tl(guarantee(form))]]} />
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

          <aside aria-label="Canlı özet" className="grid content-start gap-5 xl:sticky xl:top-4 xl:self-start">
            <Panel title="Canlı Özet" note="Girdikçe dolar" id="kayit-ozet">
              <dl className="grid gap-3 p-4 text-base sm:p-5">
                <Live label="Müşteri" value={form.name || "—"} done={form.name.length >= 3} />
                <Live label={idLabel(form)} value={form.idNo ? `${"•".repeat(Math.max(0, form.idNo.length - 3))}${form.idNo.slice(-3)}` : "—"} done={form.kind === "bireysel" ? validTckn(form.idNo) : validVkn(form.idNo)} />
                <Live label="Telefon" value={form.phone ? fmtPhone(form.phone) : "—"} done={validPhone(form.phone)} />
                <Live label="Adres" value={form.street ? `${form.street}, ${district}` : "—"} done={form.street.length >= 6} />
                <Live label="Tesisat" value={`${form.voltage} · ${form.power || 0} kW · ${KIND_LABEL[kind]}`} done />
                <Live label="Sayaç" value={form.meterMode === "pool" ? (METER_POOL.find((m) => m.id === form.poolId)?.serial ?? "—") : form.serial || "—"} done={form.meterMode === "pool" || /^[A-Z]{3}-\d{2}-\d{6}$/.test(form.serial.toUpperCase())} />
              </dl>
              <div className="border-t border-line-soft px-4 py-3 sm:px-5">
                <TickMeter label="Tamamlanan adım" value={step} max={STEPS.length} text={`${step} / ${STEPS.length}`} />
              </div>
            </Panel>
            <p className="text-small text-muted">
              Teminat tutarı örnek hesaptır. Kayıt tamamlanınca abone listesinde ve sayaç envanterinde görünür.
            </p>
          </aside>
        </div>
        <SampleNote />
      </PageBody>
    </>
  );
}

function Live({ label, value, done }: { label: string; value: string; done: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <span aria-hidden className={`mt-1 grid size-4 shrink-0 place-items-center rounded-full text-on-primary ${done ? "bg-success" : "bg-surface-raised"}`}>
        {done ? <Check className="size-3" strokeWidth={3} /> : null}
      </span>
      <div className="min-w-0">
        <dt className="text-small text-muted">
          {label}
          <span className="sr-only">{done ? ", tamam" : ", eksik"}</span>
        </dt>
        <dd className="break-words font-medium text-strong">{value}</dd>
      </div>
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
  const { customer: c, meter: m } = record;
  function downloadContract() {
    const text = [
      "ELEKTRİK DAĞITIM ŞEBEKE KULLANIM SÖZLEŞMESİ (ÖRNEK)",
      `Abone no: ${c.id}`,
      `Müşteri: ${c.name}`,
      `Tesisat no: ${c.installation}`,
      `Adres: ${c.address}`,
      `Sayaç: ${m.serial}`,
      `Başlangıç: ${TODAY_KEY}`,
      "",
      "Bu belge demo amaçlıdır; hukuki hüküm içermez.",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${c.id}-sozlesme.txt`;
    a.click();
    URL.revokeObjectURL(url);
    notify({ title: "Sözleşme indirildi", body: `${c.id}-sozlesme.txt`, tone: "success" });
  }
  return (
    <>
      <PageHead title="Müşteri Kaydı" description="Kayıt tamamlandı." />
      <PageBody>
        <section aria-labelledby="kayit-basari" className="mx-auto grid w-full max-w-2xl gap-5 rounded-xl bg-overlay p-6 text-center shadow-raised ring-1 ring-line sm:p-8">
          <span aria-hidden className="mx-auto grid size-12 place-items-center rounded-full bg-success-wash text-success">
            <CircleCheck className="size-6" />
          </span>
          <div>
            <h2 id="kayit-basari" className="text-heading font-semibold text-strong">
              Abonelik açıldı
            </h2>
            <p className="mt-1 text-base text-muted">
              {c.name} için kayıt oluşturuldu. Sayaç ilk okuma turuna eklendi.
            </p>
          </div>
          <dl className="mx-auto grid w-full max-w-md gap-2 rounded-xl bg-surface p-4 text-left text-base">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Abone no</dt>
              <dd className="edas-mono font-semibold text-strong">{c.id}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Tesisat no</dt>
              <dd className="edas-mono text-strong">{c.installation}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Sayaç</dt>
              <dd className="edas-mono text-strong">{m.serial}</dd>
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
            <Button variant="secondary" onClick={downloadContract}>
              <Download /> Sözleşmeyi İndir
            </Button>
            <Button variant="secondary" onClick={() => notify({ title: "SMS gönderildi", body: "Abone numarası ve karşılama mesajı kayıtlı telefona iletildi.", tone: "success" })}>
              <MessageSquare /> Müşteriye SMS Gönder
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 border-t border-line-soft pt-5">
            <Button variant="primary" onClick={() => go("customers", { id: c.id })}>
              <UserPlus /> Müşteri Kartını Aç
            </Button>
            <a className={buttonClass({ variant: "ghost" })} href={href("meters", { id: m.id })}>
              <Gauge /> Sayacı Gör
            </a>
            <Button variant="ghost" onClick={onNew}>
              <FileText /> Yeni Kayıt Başlat
            </Button>
          </div>
          <p className="flex items-center justify-center gap-1.5 text-small text-muted">
            <Wallet aria-hidden className="size-3.5" /> Bu kayıt yalnız demo oturumunda tutulur.
          </p>
        </section>
      </PageBody>
    </>
  );
}
