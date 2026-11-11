"use client";

import { Check, Minus } from "lucide-react";
import { useId, useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Kurallı şifre alanı: yeni şifre belirlerken (kayıt, şifre sıfırlama,
 * ayarlar) kullanıcı hangi kuralı karşıladığını yazdıkça görür; karşılanan
 * her kural güç çubuğuna bir dilim ekler. scrolltide.co'nun "Turtle
 * Password" bileşeninden öğrenildi (kod alınmadı): orada her kural bir
 * kaplumbağanın kabuğunu büyütüyor; buradaki karşılığı sakin bir liste ve
 * dilimli çubuk. Ders aynı: kural sonradan hata olarak değil, baştan ilerleme
 * olarak gösterilir.
 *
 * NE ZAMAN: `autoComplete="new-password"` olan her alan.
 * NE ZAMAN DEĞİL: giriş ekranı (`current-password`): orada kural göstermek
 * saldırgana ipucu, kullanıcıya gürültü; düz `Input type="password"` yeter.
 *
 * KURALLAR: varsayılan dört kural (12 karakter, büyük + küçük harf, rakam,
 * sembol); `rules` ile değişir. Uzunluk en güçlü kuraldır: NIST 800-63B
 * karmaşıklık yerine uzunluğu öne alır; sunucu da aynı kuralı denetlemeli
 * (istemci yalnız yol gösterir). Büyük/küçük harf `tr-TR` duyarlı: "İ", "ı"
 * sayılır.
 *
 * GÜÇ: karşılanan kural sayısı / toplam. Renk tek başına bilgi değil: dilim
 * sayısı ve yanındaki sözcük ("Zayıf", "Orta", "Güçlü") de söyler. Ton durum
 * token'larından (`danger`, `warning-fill`, `success`).
 *
 * ERİŞİLEBİLİRLİK: liste alanın `aria-describedby`ında; her maddede gizli
 * "karşılandı / karşılanmadı". Yazarken her tuşta okunmaz: sayaç
 * (`aria-live="polite"`) yalnız karşılanan kural sayısı DEĞİŞİNCE güncellenir.
 * Yapıştırma serbest (şifre yöneticisi).
 *
 *   <PasswordField label="Yeni Şifre" name="password" onValidChange={setOk} />
 */

export type PasswordRule = { id: string; label: string; test: (value: string) => boolean };

export const DEFAULT_PASSWORD_RULES: readonly PasswordRule[] = [
  { id: "length", label: "En az 12 karakter", test: (v) => [...v].length >= 12 },
  {
    id: "case",
    label: "Büyük ve küçük harf",
    test: (v) => v.toLocaleLowerCase("tr-TR") !== v && v.toLocaleUpperCase("tr-TR") !== v,
  },
  { id: "digit", label: "En az bir rakam", test: (v) => /\d/.test(v) },
  { id: "symbol", label: "En az bir sembol (!, ?, #…)", test: (v) => /[^\p{L}\p{N}\s]/u.test(v) },
];

const LEVELS = [
  { word: "Zayıf", tone: "bg-danger", text: "text-danger" },
  { word: "Orta", tone: "bg-warning-fill", text: "text-warning" },
  { word: "Güçlü", tone: "bg-success", text: "text-success" },
] as const;

type PasswordFieldProps = Omit<ComponentProps<typeof Input>, "type" | "hint"> & {
  rules?: readonly PasswordRule[];
  /** Bütün kurallar karşılanınca `true`, biri bozulunca `false`. */
  onValidChange?: (valid: boolean) => void;
};

export function PasswordField({
  rules = DEFAULT_PASSWORD_RULES,
  onValidChange,
  value,
  defaultValue,
  onChange,
  autoComplete = "new-password",
  className,
  ...props
}: PasswordFieldProps) {
  const id = useId();
  const [inner, setInner] = useState(String(defaultValue ?? ""));
  const current = value === undefined ? inner : String(value);
  const passed = rules.map((rule) => rule.test(current));
  const count = passed.filter(Boolean).length;
  const ratio = rules.length ? count / rules.length : 0;
  const level = LEVELS[ratio >= 1 ? 2 : ratio >= 0.5 ? 1 : 0];
  const [lastValid, setLastValid] = useState(count === rules.length);

  // Geçerlilik değişince çağıranı bir kez haber et (render içinde, efekt yok).
  const valid = count === rules.length;
  if (valid !== lastValid) {
    setLastValid(valid);
    onValidChange?.(valid);
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Input
        {...props}
        type="password"
        autoComplete={autoComplete}
        value={value}
        defaultValue={value === undefined ? defaultValue : undefined}
        aria-describedby={`${id}-rules ${id}-strength`}
        onChange={(event) => {
          setInner(event.target.value);
          onChange?.(event);
        }}
      />

      <div className="flex items-center gap-3">
        <div aria-hidden className="grid flex-1 gap-1" style={{ gridTemplateColumns: `repeat(${rules.length}, 1fr)` }}>
          {rules.map((rule, index) => (
            <span
              key={rule.id}
              className={cn(
                "h-1.5 rounded-full transition-colors duration-300",
                index < count ? level.tone : "bg-chart-track",
              )}
            />
          ))}
        </div>
        <p
          id={`${id}-strength`}
          aria-live="polite"
          className={cn("min-w-14 text-right text-small font-semibold", current ? level.text : "text-muted")}
        >
          {current ? level.word : "Boş"}
          <span className="sr-only">
            , {rules.length} kuraldan {count} tanesi karşılandı
          </span>
        </p>
      </div>

      <ul id={`${id}-rules`} className="grid gap-1 sm:grid-cols-2">
        {rules.map((rule, index) => {
          const ok = passed[index];
          const Icon = ok ? Check : Minus;
          return (
            <li
              key={rule.id}
              className={cn("flex items-center gap-2 text-small transition-colors", ok ? "text-strong" : "text-muted")}
            >
              <span
                aria-hidden
                className={cn(
                  "grid size-4 shrink-0 place-items-center rounded-full transition-colors",
                  ok ? "bg-success text-on-brand" : "bg-surface ring-1 ring-line",
                )}
              >
                <Icon className="size-3" strokeWidth={3} />
              </span>
              {rule.label}
              <span className="sr-only">{ok ? ": karşılandı" : ": karşılanmadı"}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
