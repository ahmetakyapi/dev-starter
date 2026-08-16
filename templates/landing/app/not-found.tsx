import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="glass w-full max-w-md rounded-2xl p-8">
        <p className="font-mono text-sm text-slate-500 dark:text-slate-500">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Sayfa Bulunamadı
        </h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Aradığınız sayfa taşınmış veya hiç var olmamış olabilir.
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-indigo px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Ana Sayfaya Dön
        </Link>
      </div>
    </main>
  )
}
