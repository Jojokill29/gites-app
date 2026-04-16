import { useParams } from 'react-router-dom'
import type { Gite } from '../types/domain'

interface CalendarPageProps {
  gites: Gite[]
}

export default function CalendarPage({ gites }: CalendarPageProps) {
  const { giteId } = useParams<{ giteId: string }>()
  const gite = gites.find((g) => g.id === giteId)

  return (
    <div className="max-w-[960px] mx-auto px-4 py-5 max-sm:px-3 max-sm:pb-20">
      <p className="text-text-secondary text-sm">
        {gite ? `${gite.name} (${gite.capacity}p)` : 'Chargement...'}
      </p>
    </div>
  )
}
