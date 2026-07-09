import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface NavigationState {
  from?: {
    pathname?: string
  }
}

export function LoginPage() {
  const { isAuthenticated, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const redirectPath =
    (location.state as NavigationState | null)?.from?.pathname ?? '/'

  if (isAuthenticated) {
    return <Navigate to={redirectPath} replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      if (isCreateMode) {
        if (password.trim() !== confirmPassword.trim()) {
          setError('Passwords do not match.')
          return
        }

        const registrationResult = await register(username, password)
        if (!registrationResult.success) {
          setError(registrationResult.error ?? 'Unable to create account.')
          return
        }

        navigate(redirectPath, { replace: true })
        return
      }

      const loginResult = await login(username, password)
      if (!loginResult.success) {
        setError(loginResult.error ?? 'Invalid username or password.')
        return
      }

      navigate(redirectPath, { replace: true })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section>
      <h2 className="page-title">{isCreateMode ? 'Create Account' : 'Login'}</h2>
      <p className="page-subtitle">
        {isCreateMode
          ? 'Create an account to unlock customer editing.'
          : 'Sign in to edit customer records.'}
      </p>
      {error && <div className="placeholder-card auth-error-card">{error}</div>}
      <form className="customer-form" onSubmit={handleSubmit}>
        <fieldset disabled={isSubmitting}>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isCreateMode ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {isCreateMode && (
            <div className="form-field">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>
          )}
        </div>
        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setError(null)
              setPassword('')
              setConfirmPassword('')
              setIsCreateMode((currentMode) => !currentMode)
            }}
          >
            {isCreateMode ? 'Back to Login' : 'Create Account'}
          </button>
          <button type="submit" className="primary-button">
            {isSubmitting
              ? isCreateMode
                ? 'Creating Account...'
                : 'Signing In...'
              : isCreateMode
                ? 'Create Account'
                : 'Login'}
          </button>
        </div>
        </fieldset>
      </form>
    </section>
  )
}