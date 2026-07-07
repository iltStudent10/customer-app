import { Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { Layout } from './components/Layout.tsx'
import { AddCustomerPage } from './pages/AddCustomerPage.tsx'
import { CustomerListPage } from './pages/CustomerListPage.tsx'
import { EditCustomerPage } from './pages/EditCustomerPage.tsx'

function App() {
  return (
    <Layout>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<CustomerListPage />} />
          <Route path="/add" element={<AddCustomerPage />} />
          <Route path="/edit/:id" element={<EditCustomerPage />} />
        </Routes>
      </ErrorBoundary>
    </Layout>
  )
}

export default App
