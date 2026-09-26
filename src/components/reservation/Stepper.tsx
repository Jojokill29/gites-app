import { LABELS } from '../../constants/labels'

interface StepperProps {
  label: string
  value: number
  onChange: (value: number) => void
}

/** − / + counter used by the mobile form. 44x38 buttons, never below zero. */
export default function Stepper({ label, value, onChange }: StepperProps) {
  const buttonClass =
    'w-11 h-[38px] flex items-center justify-center text-[18px] text-text select-none active:bg-surface-hover'

  return (
    <div className="h-[46px] flex justify-between items-center border-t border-border first:border-t-0">
      <span className="text-[14px] text-text">{label}</span>
      <div className="flex items-center border border-border-hover rounded-md overflow-hidden">
        <button
          type="button"
          aria-label={`${LABELS.mobile.decrease} — ${label}`}
          className={`${buttonClass} border-r border-border-hover`}
          onClick={() => onChange(Math.max(0, value - 1))}
        >
          −
        </button>
        <span className="w-10 text-center text-[14px] font-medium text-text tabular-nums">
          {value}
        </span>
        <button
          type="button"
          aria-label={`${LABELS.mobile.increase} — ${label}`}
          className={`${buttonClass} border-l border-border-hover`}
          onClick={() => onChange(value + 1)}
        >
          +
        </button>
      </div>
    </div>
  )
}
