import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { error } from '@util/notify'
import { api } from '@api/types'
import { LoginRequestSchema, type LoginRequest } from '@shared/schemas/auth'
import { type AuthResponse } from '@shared/types/auth'
import { validate } from '@api/validation'

function Login() {
    const [form, setForm] = useState<LoginRequest>({ email: '', password: '' })
    const navigate = useNavigate()

    const update = (email: string, password: string) => {
        const data: LoginRequest = { email, password }
        setForm(data)
    }

    const submit = useCallback(async () => {
        try {
            // Validate form data before sending request
            const validation = validate(LoginRequestSchema, form)
            if (!validation.isValid) {
                error(validation.errors?.[0] || 'Invalid form data')
                return
            }

            const verify_response = await api.post<AuthResponse>('verify', validation.data, { timeout: 10000 })
            if (!verify_response || !verify_response.userId) {
                throw new Error('user could not be verified')
            }

            if (!verify_response.verified) {
                navigate(`/${verify_response.userId}/verify`)
                return
            }

            await api.post('login', validation.data)
        } catch (err) {
            error(err instanceof Error ? err.message : 'Login failed')
        }
    }, [form, navigate])

    return (
        <Stack width="100%" spacing={1} flexGrow={1}>
            <Typography textAlign={'center'} variant={'h1'}>
                Login
            </Typography>
            <TextField fullWidth id="email" label="email" variant="filled" margin="dense" value={form.email} onChange={(e) => update(e?.target?.value || '', form.password)} />
            <TextField fullWidth id="password" label="password" variant="filled" margin="dense" type="password" value={form.password} onChange={(e) => update(form.email, e?.target?.value || '')} />
            <Stack spacing={1} width="100%" direction={'row'}>
                <Button fullWidth variant={'contained'} onClick={submit}>
                    <Typography variant={'h6'}>Submit </Typography>
                </Button>
                <Button fullWidth variant={'contained'} onClick={() => navigate('/register')}>
                    <Typography variant={'h6'}>register</Typography>
                </Button>
            </Stack>
        </Stack>
    )
}

export default Login
