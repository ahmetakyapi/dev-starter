/**
 * Infinite Scroll Hook
 *
 * IntersectionObserver tabanlı, sonsuz liste yükleme.
 *
 * `ref` bir geri çağırma ref'i: nöbetçi öğe ilk çizimde yoksa (yüklenirken
 * erken dönen iskelet, boş durum) da sonradan geldiği an gözlenir. Nesne
 * ref'iyle etki ilk çizimde `null` görüp bir daha çalışmıyor, liste 1.
 * sayfada sessizce duruyordu.
 *
 * Kullanım:
 *   const { ref, inView } = useInfiniteScroll()
 *
 *   // Tüm bağımlılıklar şart: sayfa yüklendikten sonra nöbetçi hâlâ
 *   // görünürse `inView` değişmez, değişen tek şey `isFetchingNextPage`
 *   useEffect(() => {
 *     if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage()
 *   }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])
 *
 *   <ul>{items.map(...)}</ul>
 *   <div ref={ref}>{isFetchingNextPage && <Spinner />}</div>
 */

'use client'

import { useEffect, useState } from 'react'

interface UseInfiniteScrollOptions {
  threshold?: number  // 0-1 arası, ne kadar görününce tetiklensin
  rootMargin?: string
}

export function useInfiniteScroll({
  threshold = 0.1,
  rootMargin = '0px 0px 200px 0px',  // 200px önceden tetikle
}: UseInfiniteScrollOptions = {}) {
  // Öğe durumda tutulur: değişince (sonradan gelince, yeniden kurulunca) etki
  // yeniden çalışır ve gözlemci yeni öğeye bağlanır
  const [el, ref] = useState<HTMLElement | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold, rootMargin },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [el, threshold, rootMargin])

  // Nöbetçi kalktıysa son ölçüm bayattır
  return { ref, inView: el ? inView : false }
}


/**
 * Kullanım örneği — TanStack Query ile:
 *
 * import { useInfiniteQuery } from '@tanstack/react-query'
 * import { useInfiniteScroll } from '@/snippets/infinite-scroll'
 *
 * function PostList() {
 *   const { ref, inView } = useInfiniteScroll()
 *
 *   const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
 *     useInfiniteQuery({
 *       queryKey: ['posts'],
 *       queryFn: ({ pageParam = 0 }) => fetchPosts(pageParam),
 *       getNextPageParam: (last) => last.nextCursor,
 *     })
 *
 *   useEffect(() => {
 *     if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage()
 *   }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])
 *
 *   const posts = data?.pages.flatMap(p => p.items) ?? []
 *
 *   return (
 *     <>
 *       {posts.map(post => <PostCard key={post.id} post={post} />)}
 *       <div ref={ref} className="h-px">
 *         {isFetchingNextPage && <Spinner />}
 *       </div>
 *     </>
 *   )
 * }
 */
