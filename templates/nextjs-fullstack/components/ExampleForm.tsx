"use client";

import { useActionState } from "react";
import { submitExample, type ExampleState } from "@/app/actions/example";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { cn } from "@/lib/utils";

const INITIAL: ExampleState = { status: "idle" };

/**
 * `useActionState` + `Field` örneği. JavaScript yüklenmeden de çalışır:
 * form düz bir POST olarak gider, sunucu eylemi aynı durumu döndürür.
 */
export function ExampleForm() {
  const [state, action, pending] = useActionState(submitExample, INITIAL);
  const errors = state.status === "error" ? state.fieldErrors : {};
  const values = state.status === "error" ? state.values : {};

  return (
    <form action={action} noValidate className="grid gap-4 sm:grid-cols-2" aria-busy={pending}>
      <Field label="Ad" name="name" autoComplete="name" defaultValue={values.name} error={errors.name} />
      <Field
        label="E-posta"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        defaultValue={values.email}
        error={errors.email}
        hint="Yalnızca biçim kontrol edilir, hiçbir yere gönderilmez."
      />
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Gönderiliyor" : "Gönder"}
        </Button>
        <p
          role="status"
          aria-live="polite"
          className={cn("text-base", state.status === "error" ? "text-danger" : "text-success")}
        >
          {state.status === "idle" ? "" : state.message}
        </p>
      </div>
    </form>
  );
}
