import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

// 36px high, 4px radius, 14px/500 — see docs/charte-graphique.md
const base =
  'inline-flex items-center justify-center gap-2 h-9 px-3.5 text-[14px] font-medium rounded-md cursor-pointer transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed'

const variants: Record<ButtonVariant, string> = {
  // Primary is light on dark: there is no accent colour in this theme
  primary:
    'bg-action text-action-text hover:bg-action-hover',
  secondary:
    'border border-border-hover bg-surface text-text hover:bg-surface-hover',
  // Destructive reads as plain text, not as a filled button
  danger:
    'bg-transparent text-danger hover:bg-surface-alt',
  ghost:
    'bg-transparent text-text-tertiary hover:text-text hover:bg-surface-alt',
}

export default function Button({
  variant = 'secondary',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
