import { STATUSES } from '../../constants/statuses'

export default function CalendarLegend() {
  return (
    <div className="flex gap-4.5 flex-wrap">
      {Object.values(STATUSES).map((status) => (
        <div
          key={status.label}
          className="flex items-center gap-2 text-[12px] text-text-secondary"
        >
          {/* Same fill and border as the booking bars */}
          <div
            className="w-2.5 h-2.5 rounded-[2px] border shrink-0"
            style={{ backgroundColor: status.bg, borderColor: status.border }}
          />
          {status.label}
        </div>
      ))}
    </div>
  )
}
