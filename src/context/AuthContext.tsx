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
const HASH_VERSION = 2
const ADMIN_EMAIL = 'admin@customerapp.local'
const ADMIN_PASSWORD = 'Admin#123'

type AuthRole = 'admin' | 'user'

interface AuthUser {
  username: string
  role: AuthRole
}

interface AuthAccount {
  username: string
  email?: string
  phone?: string
  role?: AuthRole
  passwordHash: string
  passwordSalt: string
  passwordVersion: number
}

interface LegacyAuthAccount {
  username: string
  email?: string
  phone?: string
  role?: AuthRole
  password: string
}

type StoredAuthAccount = AuthAccount | LegacyAuthAccount

interface AuthResult {
  success: boolean
  error?: string
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (identifier: string, password: string) => Promise<AuthResult>
  register: (username: string, password: string) => Promise<AuthResult>
  updateUsername: (newUsername: string) => Promise<AuthResult>
  updatePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>
  logout: () => void
}

function resolveRole(role: string | undefined): AuthRole {
  return role === 'admin' ? 'admin' : 'user'
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase()
}

function normalizePhone(phone: string) {
  const trimmedPhone = phone.trim()
  if (!trimmedPhone) {
    return ''
  }

  const hasLeadingPlus = trimmedPhone.startsWith('+')
  const digitsOnlyPhone = trimmedPhone.replace(/\D/g, '')
  if (!digitsOnlyPhone || digitsOnlyPhone.length < 7) {
    return ''
  }

  return hasLeadingPlus ? `+${digitsOnlyPhone}` : digitsOnlyPhone
}

function toAccountIdentifierFields(identifier: string): {
  username: string
  email?: string
  phone?: string
} {
  const normalizedTextIdentifier = normalizeUsername(identifier)
  const normalizedPhoneIdentifier = normalizePhone(identifier)

  if (normalizedTextIdentifier.includes('@')) {
    return {
      username: normalizedTextIdentifier,
      email: normalizedTextIdentifier,
    }
  }

  if (normalizedPhoneIdentifier) {
    return {
      username: normalizedPhoneIdentifier,
      phone: normalizedPhoneIdentifier,
    }
  }

  return {
    username: normalizedTextIdentifier,
  }
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
      return {
        username: parsedUser.username.trim(),
        role: resolveRole(parsedUser.role),
      }
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
    const parsedAccounts = JSON.parse(storedAccounts) as StoredAuthAccount[]
    if (!Array.isArray(parsedAccounts)) {
      return []
    }

    const validAccounts = parsedAccounts.filter(
      (account) =>
        typeof account.username === 'string' &&
        account.username.trim() &&
        ((
          'passwordHash' in account &&
          'passwordSalt' in account &&
          'passwordVersion' in account &&
          typeof account.passwordHash === 'string' &&
          account.passwordHash.trim() &&
          typeof account.passwordSalt === 'string' &&
          account.passwordSalt.trim() &&
          typeof account.passwordVersion === 'number'
        ) ||
          ('password' in account &&
            typeof account.password === 'string' &&
            account.password.trim())),
    ) as StoredAuthAccount[]

    return validAccounts as AuthAccount[]
  } catch {
    return []
  }
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
}

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value)
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data)
  return bytesToHex(new Uint8Array(hashBuffer))
}

function generateSalt(length = 16): string {
  const bytes = new Uint8Array(length)
  window.crypto.getRandomValues(bytes)
  return bytesToHex(bytes)
}

async function createHashedAccount(
  account: {
    username: string
    email?: string
    phone?: string
    role?: AuthRole
  },
  password: string,
): Promise<AuthAccount> {
  const passwordSalt = generateSalt()
  const passwordHash = await sha256(`${passwordSalt}:${password}`)

  return {
    username: account.username,
    email: account.email,
    phone: account.phone,
    role: account.role,
    passwordHash,
    passwordSalt,
    passwordVersion: HASH_VERSION,
  }
}

function isHashedAccount(account: StoredAuthAccount): account is AuthAccount {
  return (
    'passwordHash' in account &&
    'passwordSalt' in account &&
    'passwordVersion' in account &&
    typeof account.passwordHash === 'string' &&
    typeof account.passwordSalt === 'string' &&
    typeof account.passwordVersion === 'number'
  )
}

async function verifyPassword(
  account: StoredAuthAccount,
  candidatePassword: string,
): Promise<boolean> {
  if (isHashedAccount(account)) {
    const candidateHash = await sha256(`${account.passwordSalt}:${candidatePassword}`)
    return account.passwordHash === candidateHash
  }

  return account.password === candidatePassword
}

function getNormalizedAccountIdentifiers(account: StoredAuthAccount): string[] {
  const normalizedIdentifiers = [normalizeUsername(account.username)]

  if ('email' in account && typeof account.email === 'string' && account.email.trim()) {
    normalizedIdentifiers.push(normalizeUsername(account.email))
  }

  if ('phone' in account && typeof account.phone === 'string' && account.phone.trim()) {
    const normalizedPhone = normalizePhone(account.phone)
    if (normalizedPhone) {
      normalizedIdentifiers.push(normalizedPhone)
    }
  }

  return normalizedIdentifiers
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(getInitialUser)
  const [accounts, setAccounts] = useState<StoredAuthAccount[]>(getInitialAccounts)

  const persistAccounts = useCallback((nextAccounts: StoredAuthAccount[]) => {
    setAccounts(nextAccounts)
    window.localStorage.setItem(
      AUTH_ACCOUNTS_STORAGE_KEY,
      JSON.stringify(nextAccounts),
    )
  }, [])

  const login = useCallback(async (identifier: string, password: string): Promise<AuthResult> => {
    const normalizedIdentifier = identifier.trim()
    const normalizedTextIdentifier = normalizeUsername(identifier)
    const normalizedPhoneIdentifier = normalizePhone(identifier)
    const normalizedPassword = password.trim()

    if (!normalizedIdentifier || !normalizedPassword) {
      return {
        success: false,
        error: 'Enter both email or phone and password.',
      }
    }

    const matchingAccountIndex = accounts.findIndex(
      (account) => {
        const accountIdentifiers = getNormalizedAccountIdentifiers(account)

        return (
          accountIdentifiers.includes(normalizedTextIdentifier) ||
          (normalizedPhoneIdentifier
            ? accountIdentifiers.includes(normalizedPhoneIdentifier)
            : false)
        )
      },
    )

    if (matchingAccountIndex === -1) {
      if (
        normalizedTextIdentifier === ADMIN_EMAIL &&
        normalizedPassword === ADMIN_PASSWORD
      ) {
        const nextUser = { username: ADMIN_EMAIL, role: 'admin' as const }
        setUser(nextUser)
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser))
        return { success: true }
      }

      return {
        success: false,
        error: 'Invalid email/phone or password.',
      }
    }

    const matchingAccount = accounts[matchingAccountIndex]
    const passwordMatches = await verifyPassword(matchingAccount, normalizedPassword)

    if (!passwordMatches) {
      return {
        success: false,
        error: 'Invalid email/phone or password.',
      }
    }

    if (!isHashedAccount(matchingAccount)) {
      const upgradedAccount = await createHashedAccount(
        {
          username: matchingAccount.username,
          email: matchingAccount.email,
          phone: matchingAccount.phone,
          role: matchingAccount.role,
        },
        normalizedPassword,
      )
      const nextAccounts = [...accounts]
      nextAccounts[matchingAccountIndex] = upgradedAccount
      persistAccounts(nextAccounts)
    }

    const nextUser = {
      username: matchingAccount.username,
      role: resolveRole(matchingAccount.role),
    }
    setUser(nextUser)
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser))
    return { success: true }
  }, [accounts, persistAccounts])

  const register = useCallback(
    async (username: string, password: string): Promise<AuthResult> => {
      const normalizedUsername = username.trim()
      const normalizedPassword = password.trim()

      if (!normalizedUsername || !normalizedPassword) {
        return {
          success: false,
          error: 'Enter both email or phone and password to create an account.',
        }
      }

      const passwordValidationError = validatePassword(normalizedPassword)
      if (passwordValidationError) {
        return {
          success: false,
          error: passwordValidationError,
        }
      }

      const normalizedTextIdentifier = normalizeUsername(normalizedUsername)
      const normalizedPhoneIdentifier = normalizePhone(normalizedUsername)
      const usernameAlreadyExists = accounts.some((account) => {
        const accountIdentifiers = getNormalizedAccountIdentifiers(account)
        return (
          accountIdentifiers.includes(normalizedTextIdentifier) ||
          (normalizedPhoneIdentifier
            ? accountIdentifiers.includes(normalizedPhoneIdentifier)
            : false)
        )
      })

      if (usernameAlreadyExists) {
        return {
          success: false,
          error: 'That email or phone is already in use. Choose a different one.',
        }
      }

      const nextAccount = await createHashedAccount(
        {
          ...toAccountIdentifierFields(normalizedUsername),
          role: 'user',
        },
        normalizedPassword,
      )
      const nextAccounts = [...accounts, nextAccount]
      persistAccounts(nextAccounts)

      const nextUser = { username: nextAccount.username, role: 'user' as const }
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
    async (newUsername: string): Promise<AuthResult> => {
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

      const nextIdentifierFields = toAccountIdentifierFields(normalizedNewUsername)

      const nextAccounts = [...accounts]
      nextAccounts[currentAccountIndex] = {
        ...nextAccounts[currentAccountIndex],
        ...nextIdentifierFields,
      }
      persistAccounts(nextAccounts)

      const nextUser = {
        username: nextIdentifierFields.username,
        role: resolveRole(nextAccounts[currentAccountIndex].role),
      }
      setUser(nextUser)
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser))

      return {
        success: true,
      }
    },
    [accounts, persistAccounts, user],
  )

  const updatePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<AuthResult> => {
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
      const currentPasswordMatches = await verifyPassword(
        currentAccount,
        normalizedCurrentPassword,
      )

      if (!currentPasswordMatches) {
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
      nextAccounts[currentAccountIndex] = await createHashedAccount(
        {
          username: currentAccount.username,
          email: currentAccount.email,
          phone: currentAccount.phone,
          role: currentAccount.role,
        },
        normalizedNewPassword,
      )
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
      isAdmin: user?.role === 'admin',
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