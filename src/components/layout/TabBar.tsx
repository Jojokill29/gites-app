import { NavLink } from 'react-router-dom'
import { LABELS } from '../../constants/labels'
import type { Gite } from '../../types/domain'

interface TabBarProps {
  gites: Gite[]
  loading: boolean
  error: string | null
}

function giteTabLabel(gite: Gite): string {
  return `${gite.name} (${gite.capacity}p)`
}

export default function TabBar({ gites, loading, error }: TabBarProps) {
  if (error) {
    return (
      <div className="bg-surface border-b border-border px-4 py-3 text-center text-sm text-status-red-text max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:border-b-0 max-sm:border-t max-sm:z-50">
        {LABELS.errorLoadGites}
      </div>
    )
  }

  const fixedTabs = [
    { to: '/finances', label: LABELS.finances },
    { to: '/invoices', label: LABELS.factures },
    { to: '/export', label: LABELS.export },
  ]

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `shrink-0 px-[18px] py-3.5 text-[13px] font-normal border-b-2 cursor-pointer whitespace-nowrap transition-colors ${
      isActive
        ? 'text-text font-medium border-text'
        : 'text-text-secondary border-transparent hover:text-text'
    } max-sm:py-3 max-sm:px-3.5 max-sm:text-[12px]`

  return (
    <nav
      className="bg-surface border-b border-border flex overflow-x-auto scrollbar-none max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:border-b-0 max-sm:border-t max-sm:z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {loading ? (
        // Skeleton placeholders while gites load
        <>
          <div className="shrink-0 px-[18px] py-3.5 max-sm:py-3 max-sm:px-3.5">
            <div className="h-4 w-24 bg-surface-alt rounded animate-pulse" />
          </div>
          <div className="shrink-0 px-[18px] py-3.5 max-sm:py-3 max-sm:px-3.5">
            <div className="h-4 w-24 bg-surface-alt rounded animate-pulse" />
          </div>
        </>
      ) : (
        gites.map((gite) => (
          <NavLink
            key={gite.id}
            to={`/calendar/${gite.id}`}
            className={tabClass}
          >
            {giteTabLabel(gite)}
          </NavLink>
        ))
      )}
      {fixedTabs.map((tab) => (
        <NavLink key={tab.to} to={tab.to} className={tabClass}>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
