interface FinanceMetricCardProps {
  label: string
  value: string
  negative?: boolean
}

export default function FinanceMetricCard({ label, value, negative }: FinanceMetricCardProps) {
  return (
    // A block on a rule, not a rounded card (see the charter's "À éviter")
    <div className="border-t border-border pt-2.5">
      <p className="text-[12px] text-text-tertiary mb-1">{label}</p>
      <p className={`text-[20px] font-semibold tabular-nums ${negative ? 'text-status-red-text' : 'text-text'}`}>
        {value}
      </p>
    </div>
  )
}
