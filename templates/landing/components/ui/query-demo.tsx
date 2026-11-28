"use client";

import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { Play } from "lucide-react";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { DUR, EASE, STAGGER } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Sorgu deneme şeridi: kahramanın hemen altında "kendin dene" alanı. Üstte
 * beyaz karo (etiketli giriş, hazır ifade çipleri, koyu "Sorguyu Çalıştır"
 * butonu); karonun arkasından çıkan ikinci katmanda canlı istek satırı
 * (`GET /v1/oteller?sehir=izmir&sira=puan`), girişe ve seçili çipe göre
 * ANINDA yazılır. Butona basınca altta örnek sonuç paneli açılır. API,
 * arama motoru, veri servisi ya da geliştirici aracının tanıtım sayfası:
 * ziyaretçi belge okumadan ürünün ne döndürdüğünü görür.
 *
 * NE ZAMAN DEĞİL: gerçek sorgu konsolu ya da uygulamanın kendisi (orada
 * `code-block`, form ve gerçek yanıt); ürün API değilse (tüketici
 * uygulamasında istek satırı gürültüdür, `prompt-bar` daha doğru). Sonuçlar
 * ÖRNEKTİR: çağıran verir, bileşen ağdan bir şey çekmez; "Örnek" künyesi bu
 * yüzden kaldırılamaz (veri dürüstlüğü, guides/08).
 *
 * NASIL: istek her yazışta yeniden kurulur: istemcide `buildRequest(giriş,
 * seçiliÇip)`, sunucu bileşeninden düz veri `request` şablonu ("{input}",
 * "{preset}" yer tutucuları; fonksiyon prop'u sunucudan geçemez). Bütün
 * props düz veri olabilir, `onRun` isteğe bağlı. Değeri değişen parametre kısa bir vurgu alır: parça değerine göre
 * yeniden takılır, arkasındaki yıkanmış zemin yalnız OPAKLIKLA söner (renk
 * geçişi yok). `onRun` verilirse buton onu çağırır (gerçek deneme alanına
 * bağlamak için); verilmezse `results` satırları sırayla belirir.
 * Telefonda karo alt alta dizilir, çipler yatay kayar.
 *
 * ERİŞİLEBİLİRLİK: giriş görünür etiketli; çipler yerel radyo grubu
 * (`fieldset` + `legend`, ok tuşlarıyla gezilir). İstek satırı
 * `aria-live="polite"`: değişince okunur. Sonuç paneli `role="status"`
 * içinde kısa özet ("3 örnek sonuç gösterildi."). Hareketi azaltan
 * kullanıcıda vurgu ve sıralı giriş yok, içerik hemen görünür.
 *
 * Manzara turundan (tanıtım sitesi deneme şeridi; yalnız davranış ve yapı).
 *
 *   <QueryDemo
 *     fields={{ label: "Şehir", placeholder: "Bir şehir yaz", defaultValue: "İzmir" }}
 *     presets={[{ value: "puan", label: "En Yüksek Puan" }, { value: "fiyat", label: "En Uygun" }]}
 *     request={{ method: "GET", path: "/v1/oteller", params: [{ key: "sehir", value: "{input}" }, { key: "sira", value: "{preset}" }] }}
 *     results={[{ title: "Kıyı Evleri", detail: "Urla, İzmir", value: "4,8" }]}
 *   />
 */

const CSS = `
@keyframes ui-qd-flash { from { opacity: 1; } to { opacity: 0; } }
.ui-qd-flash { position: relative; }
.ui-qd-flash::before {
  content: ""; position: absolute; inset: -1px -3px; border-radius: 0.25rem;
  background: var(--color-primary-wash); opacity: 0; pointer-events: none;
  animation: ui-qd-flash 0.9s var(--ease-brand) both;
}
.ui-qd-chips { scrollbar-width: none; }
.ui-qd-chips::-webkit-scrollbar { display: none; }
@media (prefers-reduced-motion: reduce) { .ui-qd-flash::before { animation: none; } }`;

export type QueryRequest = {
  method: string;
  path: string;
  params: readonly (readonly [key: string, value: string])[];
};

export type QueryPreset = { value: string; label: string };

/**
 * Serileştirilebilir istek şablonu: sunucu bileşeninden verilebilir
 * (fonksiyon prop'u sunucudan istemciye geçemez). Değerde "{input}" girişin,
 * "{preset}" seçili çipin `value`su ile değişir.
 */
export type QueryRequestTemplate = {
  method: string;
  path: string;
  params: readonly { key: string; value: string }[];
};

function fromTemplate(template: QueryRequestTemplate, input: string, preset: string): QueryRequest {
  return {
    method: template.method,
    path: template.path,
    params: template.params.map(({ key, value }) => [
      key,
      value === "{input}" ? input : value === "{preset}" ? preset : value,
    ]),
  };
}

export type QueryResult = {
  title: ReactNode;
  /** Soluk alt metin. */
  detail?: ReactNode;
  /** Sağda mono değer (puan, fiyat, mesafe). */
  value?: ReactNode;
};

type QueryDemoProps = {
  /** Serbest giriş: görünür etiket, yer tutucu, başlangıç değeri. */
  fields: { label: string; placeholder?: string; defaultValue?: string };
  /** Hazır ifade çipleri; ilk öğe başlangıçta seçili (en az bir tane). */
  presets: readonly QueryPreset[];
  /** Çip grubunun görünür etiketi. */
  presetsLabel?: string;
  defaultPreset?: string;
  /** Giriş ve seçili çipten isteği kurar. Saf olmalı: her yazışta çağrılır. Yalnız istemci bileşeninden verilebilir; `request`ten önce gelir. */
  buildRequest?: (input: string, preset: string) => QueryRequest;
  /** Sunucu bileşeninden verilebilen şablon ("{input}", "{preset}"). */
  request?: QueryRequestTemplate;
  /** Butona basınca sırayla beliren ÖRNEK satırlar. */
  results?: readonly QueryResult[];
  /** Verilirse buton sonuç paneli yerine bunu çağırır. */
  onRun?: (request: QueryRequest) => void;
  runLabel?: string;
  /** Sonuç panelinin künyesi. */
  sample?: string;
  /** İstek satırının ekran okuyucu adı. */
  requestLabel?: string;
  className?: string;
};

/**
 * Gösterim için okunur kodlama: yalnız sözdizimini bozan karakterler (boşluk,
 * &, =, #, ?, %) kodlanır; "ş", "İ" gibi harfler olduğu gibi kalır. Tarayıcı
 * adres çubuğu da böyle gösterir; `encodeURIComponent` "gecikmi%C5%9F" yazardı.
 */
function encode(value: string) {
  return value.trim().replace(/[%&=#?+]/g, (c) => encodeURIComponent(c)).replace(/\s+/g, "+");
}

export function QueryDemo({
  fields,
  presets,
  presetsLabel = "Hazır İfade",
  defaultPreset,
  buildRequest,
  request: template,
  results = [],
  onRun,
  runLabel = "Sorguyu Çalıştır",
  sample = "Örnek",
  requestLabel = "Gönderilecek istek",
  className,
}: QueryDemoProps) {
  const id = useId();
  const reduce = useReducedMotion();
  const [input, setInput] = useState(fields.defaultValue ?? "");
  const [preset, setPreset] = useState(defaultPreset ?? presets[0]?.value ?? "");
  // Her çalıştırma yeni bir tur: satırlar baştan sırayla gelsin.
  const [run, setRun] = useState(0);
  // İlk çizimde vurgu yok: yalnız kullanıcının değiştirdiği parça parlar.
  const [touched, setTouched] = useState(false);

  const request: QueryRequest = buildRequest
    ? buildRequest(input, preset)
    : template
      ? fromTemplate(template, input, preset)
      : { method: "GET", path: "/", params: [] };
  const shown = !onRun && run > 0;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (onRun) onRun(request);
    else setRun((n) => n + 1);
  }

  return (
    <div className={cn("relative", className)}>
      <style href="ui-query-demo" precedence="default">
        {CSS}
      </style>

      <form
        onSubmit={submit}
        className="relative z-10 grid gap-4 rounded-xl bg-overlay p-4 shadow-raised ring-1 ring-line-soft md:grid-cols-[minmax(0,1fr)_minmax(0,auto)_auto] md:items-end md:p-5"
      >
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor={`${id}-input`} className="text-small font-medium text-muted">
            {fields.label}
          </label>
          <input
            id={`${id}-input`}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setTouched(true);
            }}
            placeholder={fields.placeholder}
            autoComplete="off"
            spellCheck={false}
            className="min-h-11 w-full min-w-0 rounded-md bg-surface px-3.5 text-read text-strong shadow-well outline-none ring-1 ring-line-soft transition-shadow placeholder:text-muted focus-visible:ring-2 focus-visible:ring-line-focus"
          />
        </div>

        <fieldset className="flex min-w-0 flex-col gap-1.5">
          <legend className="mb-1.5 text-small font-medium text-muted">{presetsLabel}</legend>
          <div className="ui-qd-chips -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
            {presets.map((item) => {
              const checked = item.value === preset;
              return (
                <label
                  key={item.value}
                  className={cn(
                    "inline-flex min-h-11 shrink-0 cursor-pointer items-center rounded-full px-4 text-base font-medium whitespace-nowrap transition-colors pointer-fine:min-h-9",
                    "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-line-focus has-[:focus-visible]:outline-solid",
                    checked ? "bg-strong text-page" : "bg-surface text-body ring-1 ring-line-soft hover:text-strong",
                  )}
                >
                  <input
                    type="radio"
                    name={`${id}-preset`}
                    value={item.value}
                    checked={checked}
                    onChange={() => {
                      setPreset(item.value);
                      setTouched(true);
                    }}
                    className="sr-only"
                  />
                  {item.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-strong px-5 text-base font-medium text-page transition-[opacity,translate] hover:opacity-90 active:translate-y-px [&_svg]:size-4"
        >
          {runLabel}
          <Play aria-hidden className="fill-current" strokeWidth={0} />
        </button>
      </form>

      {/* İkinci katman: karonun arkasından çıkar, üst kenarı karonun altında kalır. */}
      {/* Zemin: `bg-surface` koyu temada yarı saydam; altına sayfa rengi serilir ki
          kahramanın dokulu zemini (yarım ton, manzara) istek satırının arkasından görünmesin. */}
      <div className="relative mx-2 -mt-4 rounded-b-xl bg-page bg-[linear-gradient(var(--color-surface),var(--color-surface))] px-4 pt-7 pb-3 ring-1 ring-line-soft sm:mx-4">
        <p aria-live="polite" className="overflow-x-auto font-mono text-small whitespace-nowrap">
          <span className="sr-only">{requestLabel}: </span>
          <span className="font-semibold text-strong">{request.method}</span>{" "}
          <span className="text-muted">{request.path}</span>
          {request.params.map(([key, value], i) => (
            <span key={key}>
              <span className="text-muted">{i === 0 ? "?" : "&"}</span>
              <span className="text-body">{key}</span>
              <span className="text-muted">=</span>
              <span key={value} className={cn("text-strong", touched && value.trim() && "ui-qd-flash")}>
                {encode(value) || <span className="text-muted">…</span>}
              </span>
            </span>
          ))}
        </p>

        <div role="status" className="sr-only">
          {shown ? `${results.length} ${sample.toLocaleLowerCase("tr-TR")} sonuç gösterildi.` : ""}
        </div>

        <AnimatePresence initial={false}>
          {shown && results.length > 0 ? (
            <m.div
              key="results"
              initial={reduce ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: DUR.base, ease: EASE }}
              className="mt-3 border-t border-line-soft pt-3"
            >
              <p className="mb-2 flex items-center gap-2 text-micro font-medium text-muted">
                <span className="rounded-full bg-overlay px-2 py-0.5 tracking-wide ring-1 ring-line-soft">{sample}</span>
                <span aria-hidden className="h-px flex-1 bg-line-soft" />
              </p>
              <ul key={run} className="flex flex-col">
                {results.map((row, i) => (
                  <m.li
                    key={i}
                    initial={reduce ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: DUR.base, ease: EASE, delay: reduce ? 0 : i * STAGGER * 1.5 }}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-base font-medium text-strong">{row.title}</span>
                      {row.detail ? <span className="block truncate text-small text-muted">{row.detail}</span> : null}
                    </span>
                    {row.value !== undefined ? (
                      <span className="font-mono text-small text-strong tabular-nums">{row.value}</span>
                    ) : null}
                  </m.li>
                ))}
              </ul>
            </m.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
