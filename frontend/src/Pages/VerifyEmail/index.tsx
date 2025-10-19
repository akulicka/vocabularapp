import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

import { api } from '@api/types'
import { error } from '@util/notify'

interface VerifyTokenResponse {
    response: string
}

export function VerifyPrompt() {
    const { userId } = useParams<{ userId: string }>()

    const sendToken = async () => {
        if (!userId) {
            error('User ID is required')
            return
        }

        try {
            await api.post('token/create-verify-token', { userId })
        } catch (err) {
            error(err instanceof Error ? err.message : 'Failed to send verification token')
        }
    }

    useEffect(() => {
        sendToken()
    }, [userId])

    return (
        <>
            <Typography textAlign={'center'} variant={'h1'}>
                Verify Email
            </Typography>
            <Typography>
                {' '}
                Token sent, <Button onClick={async () => await sendToken()}>Click Here</Button> to resend{' '}
            </Typography>
        </>
    )
}

export function Verify() {
    const { userId, tokenId } = useParams<{ userId: string; tokenId: string }>()
    const [valid, setValid] = useState<boolean>(false)
    const navigate = useNavigate()

    useEffect(() => {
        const getToken = async () => {
            if (!userId || !tokenId) {
                error('User ID and Token ID are required')
                return
            }

            try {
                const result = await api.post<VerifyTokenResponse>('token/validate-verify-token', { userId, tokenId })
                if (result) {
                    setValid(result.response === 'verified')
                }
            } catch (err) {
                error(err instanceof Error ? err.message : 'Failed to validate token')
            }
        }
        getToken()
    }, [userId, tokenId])

    return (
        <>
            <Typography textAlign={'center'} variant={'h1'}>
                Verify Email
            </Typography>
            {valid ? (
                <>
                    {' '}
                    Verified! <Button onClick={() => navigate(`/`)}>Click Here</Button> to log in{' '}
                </>
            ) : (
                <>
                    {' '}
                    Token expired or invalid, Another has been sent to your email. <Button onClick={() => navigate(`/${userId}/verify`)}>Click Here</Button> to resend again.{' '}
                </>
            )}
        </>
    )
}
