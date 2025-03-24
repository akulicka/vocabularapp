import Routes from './Routes'
import AppBar from "./Components/Nav";
import Stack from "@mui/material/Stack";
import Request from './Api/request';
import {useNavigate} from "react-router";
import { useState, useEffect } from 'react';
import { CssBaseline } from '@mui/material';
import {ToastContainer} from 'react-toastify'
import Box  from '@mui/material/Box';
import isEmpty from 'lodash/isEmpty'
import request from './Api/request';
import {useCookies} from 'react-cookie'
import {error} from './Util/notify' 


function App(){
    // const [auth, setAuth] = useState(false)
    const [user, setUser] = useState()
    const navigate = useNavigate() 
    const [cookies] = useCookies()
    useEffect(() => {
        Request.interceptors.response.use(
            function (response) {return response},
            function(err){
                if(err.status === 403) {
                    error(`Error: ${err.message}`)
                    logout()
                }
            }
        )

        // if(!auth) logout()
    }, [])

    useEffect(() => {
        const check_user = async () => {
            if(cookies.smartposting_session){
                const response = await request.get('user')
                if(response?.data?.user){
                    authorize(response?.data?.user)
                }
                else await logout()
            }
        }
        check_user()
    }, [cookies])

    const logout = async() => {
        await request.post('logout')
        setUser()
        // setAuth(false)
        navigate('/')
    }
    const authorize = (user) => {
        setUser(user)
        // setAuth(true)
        navigate(`/`)
    } 

return(/*pass setauth*/
        <Stack spacing={2} flexGrow={1}>
            <CssBaseline/>
            <AppBar logout={logout} user={user} />
            <Routes  flexGrow={1} user={user}/>
            <ToastContainer/>
        </Stack>
)

}

export default App