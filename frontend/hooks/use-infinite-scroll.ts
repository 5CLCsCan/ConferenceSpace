import { useEffect, useRef, useCallback } from "react"

/**
 * Hook for implementing infinite scroll
 * Triggers callback when user scrolls near the bottom of the container
 *
 * @param callback - Function to call when reaching the bottom
 * @param hasMore - Whether there are more items to load
 * @param isLoading - Whether currently loading
 * @param threshold - Distance from bottom to trigger (default: 100px)
 * @returns Ref to attach to scrollable container
 *
 * @example
 * const scrollRef = useInfiniteScroll(loadMore, hasMore, isLoading);
 * return <div ref={scrollRef}>...</div>
 */
export function useInfiniteScroll(
  callback: () => void,
  hasMore: boolean,
  isLoading: boolean,
  threshold: number = 100,
) {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && hasMore && !isLoading) {
        callback()
      }
    },
    [callback, hasMore, isLoading],
  )

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: `${threshold}px`,
      threshold: 0.1,
    }

    observerRef.current = new IntersectionObserver(handleObserver, options)

    const currentSentinel = sentinelRef.current
    if (currentSentinel) {
      observerRef.current.observe(currentSentinel)
    }

    return () => {
      if (observerRef.current && currentSentinel) {
        observerRef.current.unobserve(currentSentinel)
      }
    }
  }, [handleObserver, threshold])

  return sentinelRef
}
