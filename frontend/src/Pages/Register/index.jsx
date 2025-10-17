import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'

import { error } from '@util/notify'
import Request from '@api/request'

function Register() {
    const [form, setForm] = useState({ username: '', email: '', password: '', repeatpassword: '' })
    const navigate = useNavigate()

    const update = (props = { username, email, password, repeatpassword }) => setForm(props)

    const checkForm = useCallback(() => form.password.length >= 8 && form.password == form.repeatpassword, [form])

    const submit = useCallback(async () => {
        try {
            if (!checkForm()) throw new Error('Invalid password, must be 8 characters and match repeat password')
            const postData = {
                username: form.username,
                email: form.email,
                password: form.password,
            }
            const register_response = await Request.post('register', JSON.stringify(postData))
            if (!register_response?.data || !register_response.data.userId) {
                throw new Error('invalid register response')
            }
            if (!register_response.data.verified) {
                return navigate(`/${register_response.data.userId}/verify`)
            }
            const loginData = {
                email: form.email,
                password: form.password,
            }
            await Request.post('login', JSON.stringify(loginData))
        } catch (err) {
            error(err.message)
        }
    }, [form])

    return (
        <>
            <h1>Register</h1>
            <TextField fullWidth id="myfield" label="username" variant="filled" margin="dense" onChange={(e) => update({ ...form, username: e?.target?.value })} />
            <br />
            <TextField fullWidth id="myfield" label="email" variant="filled" margin="dense" onChange={(e) => update({ ...form, email: e?.target?.value })} />
            <br />
            <TextField fullWidth id="myfield" label="password" type="password" variant="filled" margin="dense" onChange={(e) => update({ ...form, password: e?.target?.value })} />
            <br />
            <TextField fullWidth id="myfield" label="repeat password" type="password" variant="filled" margin="dense" onChange={(e) => update({ ...form, repeatpassword: e?.target?.value })} />
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
