import { useParams, useNavigate } from 'react-router'
import {useEffect, useState} from 'react'
import request from '../../Api/request'
import { Button, Typography } from '@mui/material'
import {success, error} from '../../Util/notify.jsx'

export function VerifyPrompt() {
    const {userId} = useParams()
    const sendToken = async() => {
        try{
            const result = await request.post('token/create-verify-token', {userId})

        }
        catch(err){
            error(err.message)
        }
    }
    useEffect(() => {
        sendToken()
    }, [])
    return (
        <>
            <Typography textAlign={'center'} variant={"h1"}>Verify Email</Typography> 
            <Typography> Token sent, <Button onClick={async() => await sendToken()} >Click Here</Button> to resend </Typography>
        </>
    )
}

export function Verify() {
    const {userId, tokenId} = useParams()
    const [valid, setValid] = useState(false)
    const navigate = useNavigate()
    useEffect(() => {
        const getToken = async() => {
            try{
                const result = await request.post('token/validate-verify-token', {userId, tokenId})
                if (result){
                    setValid(result?.data?.response === 'verified')
                }
            }
            catch(err){
                error(err.message)
            }
        }
        getToken()
    }, [])
    return (
        <>
            <Typography textAlign={'center'} variant={"h1"}>Verify Email</Typography> 
            {valid ? <> Verified! <Button onClick={() => navigate(`/`)} >Click Here</Button> to log in </> : <> Token expired or invalid, Another has been sent to your email.  <Button onClick={() => navigate(`/${userId}/verify`)} >Click Here</Button> to resend again. </> }
        </>
    )
}