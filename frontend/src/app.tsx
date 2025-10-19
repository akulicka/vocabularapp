import { useState, useEffect } from 'react'
import { ToastContainer } from 'react-toastify'
import { useNavigate } from 'react-router'
import { useCookies } from 'react-cookie'
import { CssBaseline } from '@mui/material'
import Stack from '@mui/material/Stack'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AxiosError } from 'axios'

import { error } from './Util/notify'
import AppBar from './Components/Nav'
import request from './Api/request'
import Routes from './Routes'
import { AuthenticatedUser } from '@shared/types/auth'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
        },
    },
})

function App() {
    // const [auth, setAuth] = useState(false)
    const [user, setUser] = useState<AuthenticatedUser | null>(null)
    const navigate = useNavigate()
    const [cookies] = useCookies()
    useEffect(() => {
        request.interceptors.response.use(
            function (response) {
                return response
            },
            function (err: AxiosError) {
                if (err.response?.status === 403) {
                    error('Session Expired')
                    logout()
                } else {
                    const reason = err.response?.data || err.message
                    return Promise.reject(new Error(reason as string))
                }
            },
        )

        // if(!auth) logout()
    }, [])

    useEffect(() => {
        const check_user = async () => {
            if (cookies.smartposting_session) {
                const response = await request.get('user')
                if (response?.data?.user) {
                    authorize(response?.data?.user)
                } else await logout()
            }
        }
        check_user()
    }, [cookies])

    const logout = async () => {
        await request.post('logout')
        setUser(null)
        // setAuth(false)
        navigate('/')
    }
    const authorize = (user: AuthenticatedUser) => {
        setUser(user)
        // setAuth(true)
        navigate(`/quiz`)
    }

    return (
        <QueryClientProvider client={queryClient}>
            <Stack spacing={2} flexGrow={1}>
                <CssBaseline />
                <AppBar logout={logout} user={user} />
                <Routes user={user} />
                <ToastContainer />
            </Stack>
        </QueryClientProvider>
    )
}

export default App
