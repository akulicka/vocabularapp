import { toast } from 'react-toastify'

export const success = (msg) => toast.success(msg, { position: 'bottom-right' })
export const error = (msg) => toast.error(msg, { position: 'bottom-right' })
