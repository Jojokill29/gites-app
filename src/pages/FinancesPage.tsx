import { LABELS } from '../constants/labels'

export default function FinancesPage() {
  return (
    <div className="max-w-[960px] mx-auto px-4 py-5 max-sm:px-3 max-sm:pb-20">
      <p className="text-text-secondary text-sm">{LABELS.financesTitle}</p>
    </div>
  )
}
