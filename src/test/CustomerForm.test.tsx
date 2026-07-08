import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { CustomerForm } from '../components/CustomerForm'

describe('CustomerForm', () => {
    it('shows validation errors when submitting an empty form', async () => {
        const handleSubmit = vi.fn()

        render(
            <MemoryRouter>
                <CustomerForm onSubmit={handleSubmit} onCancel={vi.fn()} />
            </MemoryRouter>,
        )

        const submitButton = screen.getByRole('button', { name: /add customer/i })
        await userEvent.click(submitButton)

        expect(handleSubmit).not.toHaveBeenCalled()
        expect(screen.getByText('Name is required.')).toBeInTheDocument()
        expect(screen.getByText('Email is required.')).toBeInTheDocument()
        expect(screen.getByText('Phone is required.')).toBeInTheDocument()
    })

    it('calls onSubmit with form data when the form is valid', async () => {
        const handleSubmit = vi.fn()

        render(
            <MemoryRouter>
                <CustomerForm onSubmit={handleSubmit} onCancel={vi.fn()} />
            </MemoryRouter>,
        )

        await userEvent.type(screen.getByLabelText(/name/i), 'John Doe')
        await userEvent.type(screen.getByLabelText(/email/i), 'john.doe@example.com')
        await userEvent.type(screen.getByLabelText(/phone/i), '5550101234')

        const submitButton = screen.getByRole('button', { name: /add customer/i })
        await userEvent.click(submitButton)

        expect(handleSubmit).toHaveBeenCalledWith({
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '5550101234',
            address: '',
            city: '',
            state: '',
            zip: '',
        })
    })
    it('shows an error when phone has fewer than 7 digits', async () => {
        const handleSubmit = vi.fn()

        render(
            <MemoryRouter>
                <CustomerForm onSubmit={handleSubmit} onCancel={vi.fn()} />
            </MemoryRouter>,
        )

        await userEvent.type(screen.getByLabelText(/name/i), 'John Doe')
        await userEvent.type(screen.getByLabelText(/email/i), 'john.doe@example.com')
        await userEvent.type(screen.getByLabelText(/phone/i), '555-01')

        const submitButton = screen.getByRole('button', { name: /add customer/i })
        await userEvent.click(submitButton)

        expect(handleSubmit).not.toHaveBeenCalled()
        expect(screen.getByText('Phone must be at least 7 digits.')).toBeInTheDocument()
    })

    it('shows errors when name or email are fewer than 2 characters', async () => {
        const handleSubmit = vi.fn()

        render(
            <MemoryRouter>
                <CustomerForm onSubmit={handleSubmit} onCancel={vi.fn()} />
            </MemoryRouter>,
        )

        await userEvent.type(screen.getByLabelText(/name/i), 'J')
        await userEvent.type(screen.getByLabelText(/email/i), 'a')
        await userEvent.type(screen.getByLabelText(/phone/i), '5550101')

        const submitButton = screen.getByRole('button', { name: /add customer/i })
        await userEvent.click(submitButton)

        expect(handleSubmit).not.toHaveBeenCalled()
        expect(screen.getByText('Name must be at least 2 characters.')).toBeInTheDocument()
        expect(screen.getByText('Email must be at least 2 characters.')).toBeInTheDocument()
    })

    it('shows an error when email does not include @', async () => {
        const handleSubmit = vi.fn()

        render(
            <MemoryRouter>
                <CustomerForm onSubmit={handleSubmit} onCancel={vi.fn()} />
            </MemoryRouter>,
        )

        await userEvent.type(screen.getByLabelText(/name/i), 'John Doe')
        await userEvent.type(screen.getByLabelText(/email/i), 'john.example.com')
        await userEvent.type(screen.getByLabelText(/phone/i), '5550101234')

        const submitButton = screen.getByRole('button', { name: /add customer/i })
        await userEvent.click(submitButton)

        expect(handleSubmit).not.toHaveBeenCalled()
        expect(screen.getByText('Email must include @.')).toBeInTheDocument()
    })

    it('calls onCancel when the cancel button is clicked', async () => {
        const handleCancel = vi.fn()

        render(
            <MemoryRouter>
                <CustomerForm onSubmit={vi.fn()} onCancel={handleCancel} />
            </MemoryRouter>,
        )

        const cancelButton = screen.getByRole('button', { name: /cancel/i })
        await userEvent.click(cancelButton)

        expect(handleCancel).toHaveBeenCalled()
    })
    it('renders initial data when provided', () => {
        const initialData = {
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            phone: '555-0102',
            address: '123 Main St',
            city: 'Anytown',
            state: 'CA',
            zip: '12345',
        }

        render(
            <MemoryRouter>
                <CustomerForm initialData={initialData} onSubmit={vi.fn()} onCancel={vi.fn()} />
            </MemoryRouter>,
        )

        expect(screen.getByLabelText(/name/i)).toHaveValue('Jane Smith')
        expect(screen.getByLabelText(/email/i)).toHaveValue('jane.smith@example.com')
        expect(screen.getByLabelText(/phone/i)).toHaveValue('555-0102')
        expect(screen.getByLabelText(/address/i)).toHaveValue('123 Main St')
        expect(screen.getByLabelText(/city/i)).toHaveValue('Anytown')
        expect(screen.getByLabelText(/state/i)).toHaveValue('CA')
        expect(screen.getByLabelText(/zip/i)).toHaveValue('12345')
    })
})