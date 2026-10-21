/**
 * Form — Server Action uyumlu form bileşenleri
 *
 * React 19 `useActionState` ile çalışır: bekleme durumu, alan hataları ve
 * genel mesaj dahil. Hata mesajı alanın altında `aria-describedby` ile
 * bağlı; ekran okuyucu alana gelince hatayı da okur. Alan kimliği `useId`
 * ile üretilir, `name`den değil: aynı sayfadaki iki formun `email` alanı
 * (alt bilgideki bülten + iletişim) aynı kimliği paylaşınca etiket öteki
 * formun alanına odaklanıyordu.
 *
 * Kullanım ('use client' bir bileşenin içinde: sunucu bileşeni istemci
 * bileşenine fonksiyon çocuk geçemez):
 *   <Form action={createUser}>
 *     {(state) => (
 *       <>
 *         <FormField
 *           name="email" label="E-posta" type="email" required
 *           defaultValue={state.values?.email}
 *           error={state.errors?.email?.[0]}
 *         />
 *         <FormSubmit>Kaydet</FormSubmit>
 *       </>
 *     )}
 *   </Form>
 *
 * React 19 eylem bitince formu SIFIRLAR, eylem hata dönse bile. Bu yüzden
 * eylem hata dönerken girilenleri de döndürür (`values`; şablondaki
 * `formToObject` gibi yalnızca metin alanları, parola hariç) ve alan onları
 * `defaultValue` ile geri alır. Yoksa her doğrulama hatası formu boşaltır.
 *
 * Gönder düğmesi ve alanlar bekleme sırasında `disabled` OLMAZ: odaktaki
 * düğme devre dışı kalınca odak `<body>`ye düşer ve klavye ya da ekran
 * okuyucu kullanıcısı sayfanın başına döner. İkinci gönderimi `onSubmit`
 * keser (React 19 `preventDefault` görünce eylemi çağırmaz), düğme
 * `aria-disabled` ile bekliyor görünür; hata dönünce odak ilk geçersiz
 * alana gider. Aynı desen: nextjs-fullstack şablonundaki
 * `components/ExampleForm.tsx`.
 */

'use client'

import { useActionState, useEffect, useId, useRef } from 'react'
import { useFormStatus } from 'react-dom'

export type FormState = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
  /** Hata dönüşünde girilen değerler: yalnızca metin alanları, parola asla */
  values?: Record<string, string>
}

const initialState: FormState = { success: false, message: '' }

const fieldBase =
  'w-full rounded-md border border-line bg-surface-sunken px-3 text-base text-strong placeholder:text-muted transition-colors focus:border-line-focus focus:outline-none aria-[invalid=true]:border-danger'

type FormProps = {
  action: (prev: FormState, data: FormData) => Promise<FormState>
  children: React.ReactNode | ((state: FormState) => React.ReactNode)
  className?: string
}

export function Form({ action, children, className }: FormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  // Her dönüş yeni nesne: aynı hata ikinci kez gelse de odak yine alana gider.
  useEffect(() => {
    if (state.success || !state.errors) return
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [state])

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={(event) => {
        if (isPending) event.preventDefault()
      }}
      className={className}
      aria-busy={isPending}
    >
      {state.message && (
        <p
          role={state.success ? 'status' : 'alert'}
          className={`mb-4 rounded-md border px-4 py-3 text-base ${
            state.success
              ? 'border-success/30 bg-success-wash text-success'
              : 'border-danger/30 bg-danger-wash text-danger'
          }`}
        >
          {state.message}
        </p>
      )}
      <div className="space-y-4">
        {typeof children === 'function' ? children(state) : children}
      </div>
    </form>
  )
}

type FieldShellProps = {
  label: string
  id: string
  error?: string
  children: React.ReactNode
}

function FieldShell({ label, id, error, children }: FieldShellProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-base font-medium text-body">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-small text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

type FormFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  name: string
  error?: string
}

export function FormField({
  label,
  name,
  error,
  id: idProp,
  className,
  ...props
}: FormFieldProps) {
  const autoId = useId()
  const id = idProp ?? autoId
  return (
    <FieldShell label={label} id={id} error={error}>
      <input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${fieldBase} h-11 ${className ?? ''}`}
        {...props}
      />
    </FieldShell>
  )
}

type FormTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  name: string
  error?: string
}

export function FormTextarea({
  label,
  name,
  error,
  id: idProp,
  className,
  ...props
}: FormTextareaProps) {
  const autoId = useId()
  const id = idProp ?? autoId
  return (
    <FieldShell label={label} id={id} error={error}>
      <textarea
        id={id}
        name={name}
        rows={4}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${fieldBase} py-2.5 ${className ?? ''}`}
        {...props}
      />
    </FieldShell>
  )
}

type FormSubmitProps = {
  children: React.ReactNode
  className?: string
}

export function FormSubmit({ children, className }: FormSubmitProps) {
  // En yakın <form>un bekleme durumu; FormSubmit formun İÇİNDE durmalı.
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      aria-disabled={pending || undefined}
      className={`h-11 w-full rounded-md bg-primary px-6 text-base font-semibold text-on-primary shadow-raised transition-colors hover:bg-primary-hover aria-disabled:cursor-not-allowed aria-disabled:opacity-50 ${className ?? ''}`}
    >
      {children}
    </button>
  )
}
