interface FinanceMetricCardProps {
  label: string
  value: string
  negative?: boolean
}

export default function FinanceMetricCard({ label, value, negative }: FinanceMetricCardProps) {
  return (
    <div className="rounded-[8px] border border-border bg-surface p-4">
      <p className="text-[12px] text-text-secondary mb-1">{label}</p>
      <p className={`text-[20px] font-heading font-semibold ${negative ? 'text-status-red-text' : 'text-text'}`}>
        {value}
      </p>
    </div>
  )
}
