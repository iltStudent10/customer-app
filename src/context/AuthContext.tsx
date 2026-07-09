import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

const AUTH_STORAGE_KEY = 'customer-manager-auth-user'
const AUTH_ACCOUNTS_STORAGE_KEY = 'customer-manager-auth-accounts'
const MIN_PASSWORD_LENGTH = 8

interface AuthUser {
  username: string
}

interface AuthAccount {
  username: string
  password: string
}

interface AuthResult {
  success: boolean
  error?: string
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (username: string, password: string) => boolean
  register: (username: string, password: string) => AuthResult
  logout: () => void
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase()
}

function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
  }

  if (!/[a-z]/.test(password)) {
    return 'Password must include at least one lowercase letter.'
  }

  if (!/[A-Z]/.test(password)) {
    return 'Password must include at least one uppercase letter.'
  }

  if (!/[0-9]/.test(password)) {
    return 'Password must include at least one number.'
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    return 'Password must include at least one special character.'
  }

  return null
}

function getInitialUser(): AuthUser | null {
  if (typeof window === 'undefined') {
    return null
  }

  const storedUser = window.localStorage.getItem(AUTH_STORAGE_KEY)
  if (!storedUser) {
    return null
  }

  try {
    const parsedUser = JSON.parse(storedUser) as AuthUser
    if (typeof parsedUser.username === 'string' && parsedUser.username.trim()) {
      return { username: parsedUser.username.trim() }
    }
  } catch {
    return null
  }

  return null
}

function getInitialAccounts(): AuthAccount[] {
  if (typeof window === 'undefined') {
    return []
  }

  const storedAccounts = window.localStorage.getItem(AUTH_ACCOUNTS_STORAGE_KEY)
  if (!storedAccounts) {
    return []
  }

  try {
    const parsedAccounts = JSON.parse(storedAccounts) as AuthAccount[]
    if (!Array.isArray(parsedAccounts)) {
      return []
    }

    return parsedAccounts.filter(
      (account) =>
        typeof account.username === 'string' &&
        account.username.trim() &&
        typeof account.password === 'string' &&
        account.password.trim(),
    )
  } catch {
    return []
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(getInitialUser)
  const [accounts, setAccounts] = useState<AuthAccount[]>(getInitialAccounts)

  const persistAccounts = useCallback((nextAccounts: AuthAccount[]) => {
    setAccounts(nextAccounts)
    window.localStorage.setItem(
      AUTH_ACCOUNTS_STORAGE_KEY,
      JSON.stringify(nextAccounts),
    )
  }, [])

  const login = useCallback((username: string, password: string) => {
    const normalizedUsername = username.trim()
    const normalizedPassword = password.trim()

    if (!normalizedUsername || !normalizedPassword) {
      return false
    }

    const matchingAccount = accounts.find(
      (account) =>
        normalizeUsername(account.username) === normalizeUsername(normalizedUsername) &&
        account.password === normalizedPassword,
    )

    if (!matchingAccount) {
      return false
    }

    const nextUser = { username: matchingAccount.username }
    setUser(nextUser)
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser))
    return true
  }, [accounts])

  const register = useCallback(
    (username: string, password: string): AuthResult => {
      const normalizedUsername = username.trim()
      const normalizedPassword = password.trim()

      if (!normalizedUsername || !normalizedPassword) {
        return {
          success: false,
          error: 'Enter both username and password to create an account.',
        }
      }

      const passwordValidationError = validatePassword(normalizedPassword)
      if (passwordValidationError) {
        return {
          success: false,
          error: passwordValidationError,
        }
      }

      const usernameAlreadyExists = accounts.some(
        (account) =>
          normalizeUsername(account.username) ===
          normalizeUsername(normalizedUsername),
      )

      if (usernameAlreadyExists) {
        return {
          success: false,
          error: 'That username is already in use. Choose a different one.',
        }
      }

      const nextAccount = {
        username: normalizedUsername,
        password: normalizedPassword,
      }
      const nextAccounts = [...accounts, nextAccount]
      persistAccounts(nextAccounts)

      const nextUser = { username: nextAccount.username }
      setUser(nextUser)
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser))

      return { success: true }
    },
    [accounts, persistAccounts],
  )

  const logout = useCallback(() => {
    setUser(null)
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext }