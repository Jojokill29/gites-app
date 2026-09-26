import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Button from '../components/ui/Button'
import { LABELS } from '../constants/labels'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, LABELS.emailRequired)
    .email(LABELS.emailInvalid),
  password: z
    .string()
    .min(6, LABELS.passwordMinLength),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>
}

const inputClass =
  'w-full px-2.5 py-2 text-[14px] text-text bg-bg border border-border-input rounded-md placeholder:text-text-muted focus:outline-none focus:border-focus'
const labelClass = 'block text-[13px] text-text-secondary mb-1.5'

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9.9 5.7A10.6 10.6 0 0 1 12 5.5c6.4 0 10 6.5 10 6.5a18 18 0 0 1-3 3.8M6.5 8.2A17.6 17.6 0 0 0 2 12s3.6 6.5 10 6.5c1 0 1.9-.1 2.7-.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setError(null)
    setSubmitting(true)
    try {
      // Phone keyboards happily add a capital or a trailing space to an email
      await onLogin(data.email.trim().toLowerCase(), data.password)
    } catch {
      setError(LABELS.errorLogin)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-heading font-semibold text-[20px] text-text text-center mb-8">
          {LABELS.appTitle}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className={labelClass}>
              {LABELS.email}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              {...register('email')}
              className={inputClass}
            />
            {errors.email && (
              <p className="mt-1 text-[12px] text-status-red-text">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className={labelClass}>
              {LABELS.password}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                {...register('password')}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? LABELS.hidePassword : LABELS.showPassword}
                className="absolute right-0 top-0 h-full px-2.5 flex items-center text-text-tertiary hover:text-text cursor-pointer"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-[12px] text-status-red-text">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="px-2.5 py-2 rounded-md bg-alert-bg text-alert text-[13px] text-center">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" disabled={submitting} className="w-full">
            {submitting ? LABELS.loginLoading : LABELS.login}
          </Button>
        </form>
      </div>
    </div>
  )
}
