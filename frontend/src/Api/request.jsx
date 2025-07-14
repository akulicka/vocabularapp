import Axios from 'axios'
// const http = import.meta.env.DEV ? 'http' : 'https'
const request = Axios.create({
    baseURL: `https://${import.meta.env.VITE_URL}:3000/`,
    timeout: 1000,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
})

export default request

// const submit = useCallback(async() => await Axios.post('http://localhost:3000/login', form), [form])
