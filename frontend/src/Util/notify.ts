import { toast } from 'react-toastify'

// Type definitions for notification functions
export const success = (msg: string): void => {
    toast.success(msg, { position: 'bottom-right' })
}

export const error = (msg: string): void => {
    toast.error(msg, { position: 'bottom-right' })
}
