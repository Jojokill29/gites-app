import { useEffect, useState } from 'react'

/**
 * Mobile breakpoint: 640px wide or less (same value as Tailwind's `sm`).
 *
 * Mobile and desktop render structurally different trees (bottom navigation,
 * full-screen form, half-day calendar bars), which CSS alone cannot express,
 * so the layout branches on this hook rather than on utility classes.
 */
const MOBILE_QUERY = '(max-width: 640px)'

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia(MOBILE_QUERY).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY)
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isMobile
}
