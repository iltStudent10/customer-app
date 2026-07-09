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
  updateUsername: (newUsername: string) => AuthResult
  updatePassword: (currentPassword: string, newPassword: string) => AuthResult
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

  const updateUsername = useCallback(
    (newUsername: string): AuthResult => {
      if (!user) {
        return {
          success: false,
          error: 'You must be logged in to update your username.',
        }
      }

      const normalizedNewUsername = newUsername.trim()
      if (!normalizedNewUsername) {
        return {
          success: false,
          error: 'Enter a new username.',
        }
      }

      if (
        normalizeUsername(normalizedNewUsername) === normalizeUsername(user.username)
      ) {
        return {
          success: false,
          error: 'Your new username must be different from your current username.',
        }
      }

      const usernameAlreadyExists = accounts.some(
        (account) =>
          normalizeUsername(account.username) ===
            normalizeUsername(normalizedNewUsername) &&
          normalizeUsername(account.username) !== normalizeUsername(user.username),
      )

      if (usernameAlreadyExists) {
        return {
          success: false,
          error: 'That username is already in use. Choose a different one.',
        }
      }

      const currentAccountIndex = accounts.findIndex(
        (account) => normalizeUsername(account.username) === normalizeUsername(user.username),
      )

      if (currentAccountIndex === -1) {
        return {
          success: false,
          error: 'Unable to update username for this session.',
        }
      }

      const nextAccounts = [...accounts]
      nextAccounts[currentAccountIndex] = {
        ...nextAccounts[currentAccountIndex],
        username: normalizedNewUsername,
      }
      persistAccounts(nextAccounts)

      const nextUser = { username: normalizedNewUsername }
      setUser(nextUser)
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser))

      return {
        success: true,
      }
    },
    [accounts, persistAccounts, user],
  )

  const updatePassword = useCallback(
    (currentPassword: string, newPassword: string): AuthResult => {
      if (!user) {
        return {
          success: false,
          error: 'You must be logged in to update your password.',
        }
      }

      const normalizedCurrentPassword = currentPassword.trim()
      const normalizedNewPassword = newPassword.trim()

      if (!normalizedCurrentPassword || !normalizedNewPassword) {
        return {
          success: false,
          error: 'Enter both current and new password.',
        }
      }

      const currentAccountIndex = accounts.findIndex(
        (account) => normalizeUsername(account.username) === normalizeUsername(user.username),
      )

      if (currentAccountIndex === -1) {
        return {
          success: false,
          error: 'Unable to update password for this session.',
        }
      }

      const currentAccount = accounts[currentAccountIndex]
      if (currentAccount.password !== normalizedCurrentPassword) {
        return {
          success: false,
          error: 'Current password is incorrect.',
        }
      }

      if (normalizedCurrentPassword === normalizedNewPassword) {
        return {
          success: false,
          error: 'New password must be different from your current password.',
        }
      }

      const passwordValidationError = validatePassword(normalizedNewPassword)
      if (passwordValidationError) {
        return {
          success: false,
          error: passwordValidationError,
        }
      }

      const nextAccounts = [...accounts]
      nextAccounts[currentAccountIndex] = {
        ...currentAccount,
        password: normalizedNewPassword,
      }
      persistAccounts(nextAccounts)

      return {
        success: true,
      }
    },
    [accounts, persistAccounts, user],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      register,
      updateUsername,
      updatePassword,
      logout,
    }),
    [user, login, register, updateUsername, updatePassword, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext }