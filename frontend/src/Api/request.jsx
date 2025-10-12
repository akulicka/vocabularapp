import Axios from 'axios'

const isDev = import.meta.env.DEV
const protocol = isDev ? 'http' : 'https'
const baseURL = `${protocol}://${import.meta.env.VITE_URL}:3000/`

const request = Axios.create({
    baseURL,
    timeout: 1000,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
})

export default request

// const submit = useCallback(async() => await Axios.post('http://localhost:3000/login', form), [form])
