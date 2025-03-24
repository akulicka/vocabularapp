import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import Request from '../../Api/request';
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from "@mui/material/Typography";
import {TextField, Button} from "@mui/material"
import {success, error} from '../../Util/notify.jsx'
function Login() {
    const [form, setForm] = useState({ email: '', password: ''})
    const navigate = useNavigate()
    const update = (email, password) => {
        var data = {email, password}
        setForm(data)
    }

    const submit = useCallback(async() => {
        try{
            const body = JSON.stringify(form)
            const verify_response = await Request.post('verify',body)
            if (!verify_response?.data || !verify_response.data.userId){
                throw new Error('user could not be verified')
            }
            if (!verify_response.data.verified){
                navigate(`/${verify_response.data.userId}/verify`)
                return
            }
            await Request.post('login',body)
        }
        catch(err){
            error(err.message, {position: 'bottom-right'})
        }
    }, [form]) 

    return (
        <Stack width='100%' spacing={1} flexGrow={1}>
            <Typography textAlign={'center'} variant={"h1"}>Login</Typography> 
            <TextField 
                fullWidth 
                id='myfield' 
                label='email' 
                variant='filled' 
                margin='dense'
                onChange={(e) => update(e?.target?.value, form.password)}
            />
            <TextField 
                fullWidth 
                id='myfield' 
                label='password' 
                variant='filled' 
                margin='dense'
                type='password'
                onChange={(e) => update(form.email, e?.target?.value)}
            />
            <Stack spacing={1} width='100%' direction={'row'}>
                {/* <Box flexGrow={1} > */}
                    <Button fullWidth variant={'contained'} onClick={submit}> 
                    <Typography  variant={"h6"}>Submit </Typography></Button>
                {/* </Box> */}
                <Button fullWidth variant={'contained'} onClick={() => navigate('/register')}>
                    <Typography variant={"h6"}>
                        register
                    </Typography>
                </Button>
            </Stack>
        </Stack>
    )
}
export default Login