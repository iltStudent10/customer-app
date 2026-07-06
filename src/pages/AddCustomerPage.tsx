import { useNavigate } from 'react-router-dom'
import { CustomerForm } from '../components/CustomerForm'

export function AddCustomerPage() {
  const navigate = useNavigate()

  return (
    <section>
      <h2 className="page-title">Add Customer</h2>
      <CustomerForm onSubmit={() => navigate('/')} onCancel={() => navigate('/')} />
    </section>
  )
}