/**
 * Search Bar — Debounced arama kutusu
 *
 * URL search param'ını günceller, debounce ile gereksiz sorguları önler.
 * Adrese YALNIZCA kutudaki terim adresten farklıysa yazar: açılışta ve
 * ilgisiz bir parametre (sayfa, filtre) değişince gezinme yok. Adres
 * dışarıdan değişirse (bağlantı, Geri) kutu ona uyar; eski terimi geri
 * yazmaz. Terim değişince sayfa parametresi silinir: yeni aramanın 4.
 * sayfası çoğu zaman boştur.
 *
 * `useSearchParams` okur: statik rotada `<Suspense>` ŞART, yoksa build
 * `missing-suspense-with-csr-bailout` ile düşer (`mistakes.md` #4).
 *
 * Kullanım:
 *   <Suspense fallback={null}>
 *     <SearchBar placeholder="Ara…" debounce={400} />
 *   </Suspense>
 *
 * URL: ?q=arama-terimi
 * Değeri okuma: const q = searchParams.get('q') ?? ''
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type SearchBarProps = {
  placeholder?: string
  debounce?: number
  className?: string
  paramKey?: string
  /** Terim değişince silinen sayfalama parametresi (`ui/pagination` → `?sayfa=`) */
  pageKey?: string
}

export function SearchBar({
  placeholder = 'Ara…',
  debounce = 400,
  className,
  paramKey = 'q',
  pageKey = 'sayfa',
}: SearchBarProps) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const inputRef     = useRef<HTMLInputElement>(null)
  const urlValue = searchParams.get(paramKey) ?? ''
  const [value, setValue] = useState(urlValue)
  // Adrese en son BİZİM yazdığımız terim; adres başka bir değere geçerse
  // değişiklik dışarıdan gelmiştir ve kutu ona uyar
  const [pushed, setPushed] = useState(urlValue)
  const [seenUrl, setSeenUrl] = useState(urlValue)
  if (urlValue !== seenUrl) {
    setSeenUrl(urlValue)
    if (urlValue !== pushed) {
      setValue(urlValue)
      setPushed(urlValue)
    }
  }

  useEffect(() => {
    if (value === pushed) return
    const id = setTimeout(() => {
      setPushed(value)
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(paramKey, value)
      else params.delete(paramKey)
      params.delete(pageKey)
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    }, debounce)
    return () => clearTimeout(id)
  }, [value, pushed, debounce, router, pathname, searchParams, paramKey, pageKey])

  return (
    <div className={cn('relative', className)}>
      <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-11 w-full rounded-md border border-line bg-surface-sunken py-2 pl-9 pr-11 text-base text-strong placeholder:text-muted transition-colors focus:border-line-focus focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue('')
            // Düğme kendini kaldırıyor: odak body'ye düşmesin, kutuya dönsün
            inputRef.current?.focus()
          }}
          className="absolute right-0 top-0 grid size-11 place-items-center text-muted transition-colors hover:text-strong"
          aria-label="Aramayı Temizle"
        >
          <X aria-hidden className="size-3.5" />
        </button>
      )}
    </div>
  )
}
