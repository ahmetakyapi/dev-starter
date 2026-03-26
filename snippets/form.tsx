/**
 * Form — Server Action uyumlu form bilesenleri
 *
 * React 19 useActionState ile calisir.
 * Zod validasyon, pending durumu, hata gosterimi dahil.
 *
 * Kullanim:
 *   <Form action={createUser}>
 *     <FormField name="email" label="E-posta" type="email" required />
 *     <FormField name="name" label="Ad Soyad" />
 *     <FormSubmit>Kaydet</FormSubmit>
 *   </Form>
 */

'use client'

import { useActionState } from 'react'

// --- Form State Tipi ---
type FormState = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
}

const initialState: FormState = { success: false, message: '' }

// --- Form Wrapper ---
interface FormProps {
  action: (prev: FormState, data: FormData) => Promise<FormState>
  children: React.ReactNode
  className?: string
}

export function Form({ action, children, className }: FormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState)

  return (
    <form action={formAction} className={className}>
      {state.message && !state.success && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.message}
        </div>
      )}
      {state.message && state.success && (
        <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {state.message}
        </div>
      )}
      <fieldset disabled={isPending} className="space-y-4">
        {children}
      </fieldset>
    </form>
  )
}

// --- Form Field ---
interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
  error?: string
}

export function FormField({ label, name, error, className, ...props }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <input
        id={name}
        name={name}
        className={`surface h-10 w-full rounded-xl px-3 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-ahmet-indigo/50 ${className ?? ''}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}

// --- Textarea ---
interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  name: string
  error?: string
}

export function FormTextarea({ label, name, error, className, ...props }: FormTextareaProps) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        className={`surface w-full rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-ahmet-indigo/50 ${className ?? ''}`}
        rows={4}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}

// --- Submit Button ---
interface FormSubmitProps {
  children: React.ReactNode
  className?: string
}

export function FormSubmit({ children, className }: FormSubmitProps) {
  return (
    <button
      type="submit"
      className={`w-full rounded-xl bg-ahmet-indigo px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-ahmet-indigo/20 transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed ${className ?? ''}`}
    >
      {children}
    </button>
  )
}
