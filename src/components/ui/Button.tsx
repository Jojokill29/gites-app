import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const base =
  'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-[13px] font-medium rounded-[10px] cursor-pointer transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed'

const variants: Record<ButtonVariant, string> = {
  secondary:
    'border border-border-hover bg-surface text-text hover:bg-surface-alt',
  danger:
    'border border-status-red bg-surface text-status-red-text hover:bg-status-red-bg',
  primary:
    'bg-status-blue text-white hover:opacity-90',
  ghost:
    'bg-transparent text-text-secondary hover:text-text hover:bg-surface-alt',
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
