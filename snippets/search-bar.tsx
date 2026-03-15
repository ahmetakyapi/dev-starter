/**
 * Search Bar — Debounced arama kutusu
 *
 * URL search param'ını günceller, debounce ile gereksiz sorguları önler.
 *
 * Kullanım:
 *   <SearchBar placeholder="Ara..." debounce={400} />
 *
 * URL: ?q=arama-terimi
 * Değeri okuma: const q = searchParams.get('q') ?? ''
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  placeholder?: string
  debounce?: number
  className?: string
  paramKey?: string
}

export function SearchBar({
  placeholder = 'Ara...',
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
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="surface h-10 w-full rounded-xl py-2 pl-9 pr-9 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
      />
      {value && (
        <button
          onClick={() => setValue('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          aria-label="Temizle"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
