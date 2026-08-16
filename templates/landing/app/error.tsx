'use client'

import { useEffect } from 'react'
import { RotateCcw } from 'lucide-react'

/**
 * Route seviyesi hata sınırı. Next.js bu dosyayı otomatik bulur —
 * olmadığında beklenmeyen her hata kullanıcıya ham Next hata ekranı gösterir.
 * Bkz. rules/immutable-architecture.md #9
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Üretimde buraya hata izleme servisi bağlanır (Sentry vb.)
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="glass w-full max-w-md rounded-2xl p-8">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Bir Şeyler Ters Gitti
        </h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Beklenmeyen bir hata oluştu. Tekrar denemek sorunu çözebilir.
        </p>

        {error.digest && (
          <p className="mt-4 font-mono text-xs text-slate-500 dark:text-slate-500">
            hata kimliği: {error.digest}
          </p>
        )}

        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-indigo px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Tekrar Dene
        </button>
      </div>
    </main>
  )
}
