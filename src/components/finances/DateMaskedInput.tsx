import { useCallback } from 'react'

interface DateMaskedInputProps {
  value: string
  onChange: (value: string) => void
  id?: string
  name?: string
  placeholder?: string
  className?: string
}

/**
 * Auto-formats user input as jj/mm/aaaa by inserting '/' after day and month digits.
 * Stores the formatted string (with slashes) — no strict date validation.
 */
export default function DateMaskedInput({ value, onChange, placeholder = 'jj/mm/aaaa', className, ...rest }: DateMaskedInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value

      // Strip everything except digits and slashes already present
      const digitsOnly = raw.replace(/[^\d]/g, '')

      // Build formatted string: insert '/' after position 2 and 4
      let formatted = ''
      for (let i = 0; i < digitsOnly.length && i < 8; i++) {
        if (i === 2 || i === 4) formatted += '/'
        formatted += digitsOnly[i]
      }

      onChange(formatted)
    },
    [onChange],
  )

  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      maxLength={10}
      {...rest}
    />
  )
}
