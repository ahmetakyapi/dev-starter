import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type FieldProps = Omit<ComponentProps<"input">, "id"> & {
  label: ReactNode;
  /** Sunucu eyleminden dönen alan hatası (`useActionState` durumu). */
  error?: string;
  /** Cümle düzeninde yardım metni. */
  hint?: ReactNode;
};

/**
 * Etiket + giriş + hata. Hata ve yardım metni `aria-describedby` ile girişe
 * bağlıdır; ekran okuyucu alana gelince ikisini de okur.
 *
 * Doğrulama sunucuda (`lib/validation.ts`); tarayıcı doğrulaması yalnızca
 * ilk savunma. Kullanım örneği: `components/ExampleForm.tsx`.
 */
export function Field({ label, error, hint, className, name, ...props }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  // Hata varken yardım metni gizlenir; describedby yalnızca ekrandakini gösterir.
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      <label htmlFor={id} className="text-small font-semibold text-strong">
        {label}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "min-h-11 rounded-md border border-line-strong bg-surface-sunken px-3 text-base text-strong transition-colors placeholder:text-muted hover:border-primary-soft focus-visible:border-line-focus focus-visible:outline-offset-0",
          error && "border-danger",
        )}
        {...props}
      />
      {hint && !error ? (
        <p id={hintId} className="text-small text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-small text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
