import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
  'w-full px-3 py-2 text-[14px] border border-border rounded-[10px] bg-surface focus:outline-none focus:ring-2 focus:ring-status-blue focus:border-transparent'
const labelClass = 'block text-[12px] font-medium text-text-secondary mb-1'

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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
      await onLogin(data.email, data.password)
    } catch {
      setError(LABELS.errorLogin)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-heading font-semibold text-[24px] text-text text-center mb-8">
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
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              className={inputClass}
            />
            {errors.password && (
              <p className="mt-1 text-[12px] text-status-red-text">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-[10px] bg-status-red-bg text-status-red-text text-[13px] text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 px-3.5 text-[13px] font-medium rounded-[10px] bg-status-blue text-white hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? LABELS.loginLoading : LABELS.login}
          </button>
        </form>
      </div>
    </div>
  )
}
