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

    it('keeps only numeric characters in the phone field', async () => {
        render(
            <MemoryRouter>
                <CustomerForm onSubmit={vi.fn()} onCancel={vi.fn()} />
            </MemoryRouter>,
        )

        const phoneInput = screen.getByLabelText(/phone/i)
        await userEvent.type(phoneInput, 'abc-555x010!')

        expect(phoneInput).toHaveValue('555010')
    })

    it('shows a clear error when non-numeric phone characters are entered', async () => {
        render(
            <MemoryRouter>
                <CustomerForm onSubmit={vi.fn()} onCancel={vi.fn()} />
            </MemoryRouter>,
        )

        const phoneInput = screen.getByLabelText(/phone/i)
        await userEvent.type(phoneInput, 'abc')

        expect(phoneInput).toHaveValue('')
        expect(screen.getByText('Phone can only contain numbers.')).toBeInTheDocument()
    })

    it('clears phone non-numeric error after entering valid digits', async () => {
        render(
            <MemoryRouter>
                <CustomerForm onSubmit={vi.fn()} onCancel={vi.fn()} />
            </MemoryRouter>,
        )

        const phoneInput = screen.getByLabelText(/phone/i)
        await userEvent.type(phoneInput, 'abc')
        expect(screen.getByText('Phone can only contain numbers.')).toBeInTheDocument()

        await userEvent.type(phoneInput, '5550101')

        expect(phoneInput).toHaveValue('5550101')
        expect(screen.queryByText('Phone can only contain numbers.')).not.toBeInTheDocument()
    })

    it('keeps only numeric characters in the ZIP field and limits to 5 digits', async () => {
        render(
            <MemoryRouter>
                <CustomerForm onSubmit={vi.fn()} onCancel={vi.fn()} />
            </MemoryRouter>,
        )

        const zipInput = screen.getByLabelText(/zip/i)
        await userEvent.type(zipInput, 'ab12c3456!')

        expect(zipInput).toHaveValue('12345')
    })

    it('shows a clear error when non-numeric ZIP characters are entered', async () => {
        render(
            <MemoryRouter>
                <CustomerForm onSubmit={vi.fn()} onCancel={vi.fn()} />
            </MemoryRouter>,
        )

        const zipInput = screen.getByLabelText(/zip/i)
        await userEvent.type(zipInput, 'abc')

        expect(zipInput).toHaveValue('')
        expect(screen.getByText('ZIP can only contain numbers.')).toBeInTheDocument()
    })

    it('shows an error when ZIP is not exactly 5 digits on submit', async () => {
        const handleSubmit = vi.fn()

        render(
            <MemoryRouter>
                <CustomerForm onSubmit={handleSubmit} onCancel={vi.fn()} />
            </MemoryRouter>,
        )

        await userEvent.type(screen.getByLabelText(/name/i), 'John Doe')
        await userEvent.type(screen.getByLabelText(/email/i), 'john.doe@example.com')
        await userEvent.type(screen.getByLabelText(/phone/i), '5550101234')
        await userEvent.type(screen.getByLabelText(/zip/i), '1234')

        const submitButton = screen.getByRole('button', { name: /add customer/i })
        await userEvent.click(submitButton)

        expect(handleSubmit).not.toHaveBeenCalled()
        expect(screen.getByText('ZIP must be exactly 5 digits.')).toBeInTheDocument()
    })

    it('allows submit when ZIP is exactly 5 digits', async () => {
        const handleSubmit = vi.fn()

        render(
            <MemoryRouter>
                <CustomerForm onSubmit={handleSubmit} onCancel={vi.fn()} />
            </MemoryRouter>,
        )

        await userEvent.type(screen.getByLabelText(/name/i), 'John Doe')
        await userEvent.type(screen.getByLabelText(/email/i), 'john.doe@example.com')
        await userEvent.type(screen.getByLabelText(/phone/i), '5550101234')
        await userEvent.type(screen.getByLabelText(/zip/i), '12345')

        const submitButton = screen.getByRole('button', { name: /add customer/i })
        await userEvent.click(submitButton)

        expect(handleSubmit).toHaveBeenCalledWith({
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '5550101234',
            address: '',
            city: '',
            state: '',
            zip: '12345',
        })
    })

    it('keeps only letters in the state field and limits to 2 characters', async () => {
        render(
            <MemoryRouter>
                <CustomerForm onSubmit={vi.fn()} onCancel={vi.fn()} />
            </MemoryRouter>,
        )

        const stateInput = screen.getByLabelText(/state/i)
        await userEvent.type(stateInput, 'c1a$lif')

        expect(stateInput).toHaveValue('ca')
    })

    it('shows a clear error when non-letter state characters are entered', async () => {
        render(
            <MemoryRouter>
                <CustomerForm onSubmit={vi.fn()} onCancel={vi.fn()} />
            </MemoryRouter>,
        )

        const stateInput = screen.getByLabelText(/state/i)
        await userEvent.type(stateInput, '1!')

        expect(stateInput).toHaveValue('')
        expect(screen.getByText('State can only contain letters.')).toBeInTheDocument()
    })

    it('shows a clear error when more than 2 state letters are entered', async () => {
        render(
            <MemoryRouter>
                <CustomerForm onSubmit={vi.fn()} onCancel={vi.fn()} />
            </MemoryRouter>,
        )

        const stateInput = screen.getByLabelText(/state/i)
        await userEvent.type(stateInput, 'CAL')

        expect(stateInput).toHaveValue('CA')
        expect(screen.getByText('State can only be 2 letters.')).toBeInTheDocument()
    })

    it('shows an error when state is not exactly 2 letters on submit', async () => {
        const handleSubmit = vi.fn()

        render(
            <MemoryRouter>
                <CustomerForm onSubmit={handleSubmit} onCancel={vi.fn()} />
            </MemoryRouter>,
        )

        await userEvent.type(screen.getByLabelText(/name/i), 'John Doe')
        await userEvent.type(screen.getByLabelText(/email/i), 'john.doe@example.com')
        await userEvent.type(screen.getByLabelText(/phone/i), '5550101234')
        await userEvent.type(screen.getByLabelText(/state/i), 'C')

        const submitButton = screen.getByRole('button', { name: /add customer/i })
        await userEvent.click(submitButton)

        expect(handleSubmit).not.toHaveBeenCalled()
        expect(screen.getByText('State must be exactly 2 letters.')).toBeInTheDocument()
    })

    it('allows submit when state is exactly 2 letters', async () => {
        const handleSubmit = vi.fn()

        render(
            <MemoryRouter>
                <CustomerForm onSubmit={handleSubmit} onCancel={vi.fn()} />
            </MemoryRouter>,
        )

        await userEvent.type(screen.getByLabelText(/name/i), 'John Doe')
        await userEvent.type(screen.getByLabelText(/email/i), 'john.doe@example.com')
        await userEvent.type(screen.getByLabelText(/phone/i), '5550101234')
        await userEvent.type(screen.getByLabelText(/state/i), 'CA')

        const submitButton = screen.getByRole('button', { name: /add customer/i })
        await userEvent.click(submitButton)

        expect(handleSubmit).toHaveBeenCalledWith({
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '5550101234',
            address: '',
            city: '',
            state: 'CA',
            zip: '',
        })
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