interface FinanceMetricCardProps {
  label: string
  value: string
}

export default function FinanceMetricCard({ label, value }: FinanceMetricCardProps) {
  return (
    <div className="rounded-[10px] border border-border bg-surface p-4">
      <p className="text-[12px] text-text-secondary mb-1">{label}</p>
      <p className="text-[20px] font-heading font-semibold text-text">{value}</p>
    </div>
  )
}
