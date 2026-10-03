/**
 * Search Bar — Debounced arama kutusu
 *
 * URL search param'ını günceller, debounce ile gereksiz sorguları önler.
 *
 * Kullanım:
 *   <SearchBar placeholder="Ara…" debounce={400} />
 *
 * URL: ?q=arama-terimi
 * Değeri okuma: const q = searchParams.get('q') ?? ''
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type SearchBarProps = {
  placeholder?: string
  debounce?: number
  className?: string
  paramKey?: string
}

export function SearchBar({
  placeholder = 'Ara…',
  debounce = 400,
  className,
  paramKey = 'q',
}: SearchBarProps) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get(paramKey) ?? '')

  const updateUrl = useCallback(
    (term: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (term) {
        params.set(paramKey, term)
      } else {
        params.delete(paramKey)
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams, paramKey],
  )

  useEffect(() => {
    const id = setTimeout(() => updateUrl(value), debounce)
    return () => clearTimeout(id)
  }, [value, debounce, updateUrl])

  return (
    <div className={cn('relative', className)}>
      <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <input
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
          onClick={() => setValue('')}
          className="absolute right-0 top-0 grid size-11 place-items-center text-muted transition-colors hover:text-strong"
          aria-label="Aramayı Temizle"
        >
          <X aria-hidden className="size-3.5" />
        </button>
      )}
    </div>
  )
}
