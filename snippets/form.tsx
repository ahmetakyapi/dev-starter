/**
 * Form — Server Action uyumlu form bileşenleri
 *
 * React 19 `useActionState` ile çalışır: bekleme durumu, alan hataları ve
 * genel mesaj dahil. Hata mesajı alanın altında `aria-describedby` ile
 * bağlı; ekran okuyucu alana gelince hatayı da okur.
 *
 * Kullanım:
 *   <Form action={createUser}>
 *     {(state) => (
 *       <>
 *         <FormField name="email" label="E-posta" type="email" required error={state.errors?.email?.[0]} />
 *         <FormSubmit>Kaydet</FormSubmit>
 *       </>
 *     )}
 *   </Form>
 */

'use client'

import { useActionState } from 'react'

export type FormState = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
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

  return (
    <form action={formAction} className={className} aria-busy={isPending}>
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
      <fieldset disabled={isPending} className="space-y-4">
        {typeof children === 'function' ? children(state) : children}
      </fieldset>
    </form>
  )
}

type FieldShellProps = {
  label: string
  name: string
  error?: string
  children: React.ReactNode
}

function FieldShell({ label, name, error, children }: FieldShellProps) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-base font-medium text-body">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${name}-error`} className="mt-1 text-small text-danger">
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

export function FormField({ label, name, error, className, ...props }: FormFieldProps) {
  return (
    <FieldShell label={label} name={name} error={error}>
      <input
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
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

export function FormTextarea({ label, name, error, className, ...props }: FormTextareaProps) {
  return (
    <FieldShell label={label} name={name} error={error}>
      <textarea
        id={name}
        name={name}
        rows={4}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
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
  return (
    <button
      type="submit"
      className={`h-11 w-full rounded-md bg-primary px-6 text-base font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 ${className ?? ''}`}
    >
      {children}
    </button>
  )
}
