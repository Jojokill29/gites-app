import { NavLink, useSearchParams } from 'react-router-dom'
import { LABELS } from '../../constants/labels'
import type { Gite } from '../../types/domain'

interface TabBarProps {
  gites: Gite[]
  loading: boolean
  error: string | null
}

const navClass =
  'bg-header border-b border-border flex items-stretch gap-1 px-6 overflow-x-auto scrollbar-none max-sm:px-2 max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:border-b-0 max-sm:border-t max-sm:z-50'

// Active tab is marked by a 2px light underline — no accent colour in this theme
const tabClass = ({ isActive }: { isActive: boolean }) =>
  `shrink-0 flex items-center gap-2 px-3 pt-3 pb-2.5 text-[14px] border-b-2 cursor-pointer whitespace-nowrap transition-colors ${
    isActive
      ? 'text-text font-medium border-action'
      : 'text-text-tertiary font-normal border-transparent hover:text-text'
  } max-sm:px-2.5 max-sm:text-[13px]`

export default function TabBar({ gites, loading, error }: TabBarProps) {
  const [searchParams] = useSearchParams()

  // Preserve ?month param when switching between gite tabs
  function giteUrl(giteId: string): string {
    const month = searchParams.get('month')
    return month
      ? `/calendar/${giteId}?month=${month}`
      : `/calendar/${giteId}`
  }

  if (error) {
    return (
      <div className={`${navClass} justify-center py-3 text-[13px] text-status-red-text`}>
        {LABELS.errorLoadGites}
      </div>
    )
  }

  const fixedTabs = [
    { to: '/finances', label: LABELS.finances },
    { to: '/invoices', label: LABELS.factures },
    { to: '/export', label: LABELS.export },
  ]

  return (
    <nav
      className={navClass}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {loading ? (
        // Skeleton placeholders while gites load
        <>
          <div className="shrink-0 px-3 pt-3 pb-2.5">
            <div className="h-4 w-24 bg-surface-alt rounded-sm animate-pulse" />
          </div>
          <div className="shrink-0 px-3 pt-3 pb-2.5">
            <div className="h-4 w-24 bg-surface-alt rounded-sm animate-pulse" />
          </div>
        </>
      ) : (
        gites.map((gite) => (
          <NavLink key={gite.id} to={giteUrl(gite.id)} className={tabClass}>
            {gite.name}
            <span className="font-mono text-[11px] text-text-muted">{gite.capacity}p</span>
          </NavLink>
        ))
      )}

      {/* Rule between the gite tabs and the tool tabs */}
      <div className="shrink-0 w-px bg-border my-2.5 mx-2 max-sm:mx-1" />

      {fixedTabs.map((tab) => (
        <NavLink key={tab.to} to={tab.to} className={tabClass}>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
