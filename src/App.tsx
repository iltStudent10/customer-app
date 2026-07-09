import type { ReactElement } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { Layout } from './components/Layout.tsx'
import { useAuth } from './hooks/useAuth'
import { AccountPage } from './pages/AccountPage.tsx'
import { AddCustomerPage } from './pages/AddCustomerPage.tsx'
import { CustomerListPage } from './pages/CustomerListPage.tsx'
import { EditCustomerPage } from './pages/EditCustomerPage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'

function RequireAuth({ children }: { children: ReactElement }) {
  const location = useLocation()
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

function RequireAdmin({ children }: { children: ReactElement }) {
  const { isAuthenticated, isAdmin } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  return (
    <Layout>
      <ErrorBoundary>
        <Routes>
          <Route
            path="/"
            element={
              <RequireAuth>
                <CustomerListPage />
              </RequireAuth>
            }
          />
          <Route
            path="/add"
            element={
              <RequireAdmin>
                <AddCustomerPage />
              </RequireAdmin>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/account"
            element={
              <RequireAuth>
                <AccountPage />
              </RequireAuth>
            }
          />
          <Route
            path="/edit/:id"
            element={
              <RequireAuth>
                <EditCustomerPage />
              </RequireAuth>
            }
          />
        </Routes>
      </ErrorBoundary>
    </Layout>
  )
}

export default App
