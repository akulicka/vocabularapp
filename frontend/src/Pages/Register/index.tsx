import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'

import { error } from '@util/notify'
import { api } from '@api/types'
import { RegisterRequestSchema, type RegisterRequest } from '@shared/schemas/auth'
import { type AuthResponse } from '@shared/types/auth'
import { validate } from '@api/validation'

interface RegisterForm extends RegisterRequest {
    repeatpassword: string
}

function Register() {
    const [form, setForm] = useState<RegisterForm>({
        username: '',
        email: '',
        password: '',
        repeatpassword: '',
    })
    const navigate = useNavigate()

    const update = (field: keyof RegisterForm, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    const checkForm = useCallback(() => {
        return form.password.length >= 8 && form.password === form.repeatpassword
    }, [form])

    const submit = useCallback(async () => {
        try {
            // Validate password match
            if (!checkForm()) {
                error('Password must be at least 8 characters and match repeat password')
                return
            }

            // Validate form data using shared schema
            const validation = validate(RegisterRequestSchema, {
                username: form.username,
                email: form.email,
                password: form.password,
            })

            if (!validation.isValid) {
                error(validation.errors?.[0] || 'Invalid form data')
                return
            }

            const register_response = await api.post<AuthResponse>('register', validation.data)

            if (!register_response || !register_response.userId) {
                throw new Error('invalid register response')
            }

            if (!register_response.verified) {
                return navigate(`/${register_response.userId}/verify`)
            }

            // Auto-login after successful registration
            const loginData = {
                email: form.email,
                password: form.password,
            }
            await api.post('login', loginData)
        } catch (err) {
            error(err instanceof Error ? err.message : 'Registration failed')
        }
    }, [form, navigate, checkForm])

    return (
        <>
            <h1>Register</h1>
            <TextField fullWidth id="username" label="username" variant="filled" margin="dense" value={form.username} onChange={(e) => update('username', e?.target?.value || '')} />
            <br />
            <TextField fullWidth id="email" label="email" variant="filled" margin="dense" value={form.email} onChange={(e) => update('email', e?.target?.value || '')} />
            <br />
            <TextField fullWidth id="password" label="password" type="password" variant="filled" margin="dense" value={form.password} onChange={(e) => update('password', e?.target?.value || '')} />
            <br />
            <TextField fullWidth id="repeatpassword" label="repeat password" type="password" variant="filled" margin="dense" value={form.repeatpassword} onChange={(e) => update('repeatpassword', e?.target?.value || '')} />
            <br />
            <Button onClick={submit}> Submit </Button>
            <br />
            <Button>
                <Link to={'/'}>login</Link>
            </Button>
        </>
    )
}

export default Register
