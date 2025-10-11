import { useState, useEffect } from 'react'
import { ToastContainer } from 'react-toastify'
import { useNavigate } from 'react-router'
import { useCookies } from 'react-cookie'
import { CssBaseline } from '@mui/material'
import Stack from '@mui/material/Stack'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { error } from './Util/notify'
import AppBar from './Components/Nav'
import request from './Api/request'
import Routes from './Routes'

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
    const [user, setUser] = useState(null)
    const navigate = useNavigate()
    const [cookies] = useCookies()
    useEffect(() => {
        request.interceptors.response.use(
            function (response) {
                return response
            },
            function (err) {
                if (err.status === 403) {
                    error('Session Expired')
                    logout()
                } else {
                    const reason = err.response?.data || err.message
                    return Promise.reject(new Error(reason))
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
        setUser()
        // setAuth(false)
        navigate('/')
    }
    const authorize = (user) => {
        setUser(user)
        // setAuth(true)
        navigate(`/quiz`)
    }

    return (
        <QueryClientProvider client={queryClient}>
            <Stack spacing={2} flexGrow={1}>
                <CssBaseline />
                <AppBar logout={logout} user={user} />
                <Routes flexGrow={1} user={user} />
                <ToastContainer />
            </Stack>
        </QueryClientProvider>
    )
}

export default App
