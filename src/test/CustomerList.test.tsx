import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { CustomerList } from '../components/CustomerList'
import type { Customer } from '../types/customer'

describe('CustomerList', () => {
	it('renders customer names', () => {
		const customers: Customer[] = [
			{
				id: 1,
				name: 'Maria Garcia',
				email: 'maria.garcia@example.com',
				phone: '555-0101',
				address: '742 Evergreen Terrace',
				city: 'Springfield',
				state: 'IL',
				zip: '62704',
			},
			{
				id: 2,
				name: 'James Chen',
				email: 'james.chen@example.com',
				phone: '555-0102',
				address: '1600 Pennsylvania Ave',
				city: 'Washington',
				state: 'DC',
				zip: '20500',
			},
			{
				id: 3,
				name: 'Aisha Patel',
				email: 'aisha.patel@example.com',
				phone: '555-0103',
				address: '350 Fifth Avenue',
				city: 'New York',
				state: 'NY',
				zip: '10118',
			},
		]

		render(
			<MemoryRouter>
				<CustomerList customers={customers} onDelete={vi.fn()} />
			</MemoryRouter>,
		)

		expect(screen.getByText('Maria Garcia')).toBeInTheDocument()
		expect(screen.getByText('James Chen')).toBeInTheDocument()
		expect(screen.getByText('Aisha Patel')).toBeInTheDocument()
	})

    it('renders "No customers found." when the list is empty', () => {
        render(
            <MemoryRouter>
                <CustomerList customers={[]} onDelete={vi.fn()} />
            </MemoryRouter>,
        )

        expect(screen.getByText('No customers found.')).toBeInTheDocument()
    })

    it('calls onDelete with the correct id when the delete button is clicked', async () => {
        const customers: Customer[] = [
            {
                id: 1,
                name: 'Maria Garcia',
                email: 'maria.garcia@example.com',
                phone: '555-0101',
                address: '742 Evergreen Terrace',
                city: 'Springfield',
                state: 'IL',
                zip: '62704',
            },
        ]

        const onDelete = vi.fn()

        render(
            <MemoryRouter>
                <CustomerList customers={customers} onDelete={onDelete} />
            </MemoryRouter>,
        )

        const deleteButton = screen.getByText('Delete')
        await userEvent.click(deleteButton)

        expect(onDelete).toHaveBeenCalledWith(1)
    })

    it('renders Edit link with the correct URL', () => {
        const customers: Customer[] = [
            {
                id: 1,
                name: 'Maria Garcia',
                email: 'maria.garcia@example.com',
                phone: '555-0101',
                address: '742 Evergreen Terrace',
                city: 'Springfield',
                state: 'IL',
                zip: '62704',
            },
        ]

        render(
            <MemoryRouter>
                <CustomerList customers={customers} onDelete={vi.fn()} />
            </MemoryRouter>,
        )

        const editLink = screen.getByText('Edit')
        expect(editLink).toHaveAttribute('href', '/edit/1')
    })
})
