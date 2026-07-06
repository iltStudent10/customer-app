import { useParams } from 'react-router-dom'

export function EditCustomerPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <section>
      <h2 className="page-title">Edit Customer</h2>
      <div className="placeholder-card">
        Edit mode placeholder for customer ID: {id}
      </div>
    </section>
  )
}