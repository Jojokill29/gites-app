import { STATUSES } from '../../constants/statuses'

export default function CalendarLegend() {
  return (
    <div className="flex gap-3.5 flex-wrap">
      {Object.values(STATUSES).map((status) => (
        <div
          key={status.label}
          className="flex items-center gap-1.5 text-[12px] text-text-secondary"
        >
          <div
            className="w-2.5 h-2.5 rounded-[3px] shrink-0"
            style={{ backgroundColor: status.color }}
          />
          {status.label}
        </div>
      ))}
    </div>
  )
}
