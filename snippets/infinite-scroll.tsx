/**
 * Infinite Scroll Hook
 *
 * IntersectionObserver tabanlı, sonsuz liste yükleme.
 *
 * Kullanım:
 *   const { ref, inView } = useInfiniteScroll()
 *
 *   useEffect(() => {
 *     if (inView && hasNextPage) fetchNextPage()
 *   }, [inView])
 *
 *   <ul>{items.map(...)}</ul>
 *   <div ref={ref}>{isFetchingNextPage && <Spinner />}</div>
 */

'use client'

import { useEffect, useRef, useState } from 'react'

interface UseInfiniteScrollOptions {
  threshold?: number  // 0-1 arası, ne kadar görününce tetiklensin
  rootMargin?: string
}

export function useInfiniteScroll({
  threshold = 0.1,
  rootMargin = '0px 0px 200px 0px',  // 200px önceden tetikle
}: UseInfiniteScrollOptions = {}) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold, rootMargin },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return { ref, inView }
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
