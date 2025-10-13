import { Request } from 'express'
import { AuthenticatedUser } from './auth.js'

export interface AuthenticatedRequest extends Request {
    query: Request['query'] & {
        user: AuthenticatedUser
    }
}

export interface FileUploadRequest extends AuthenticatedRequest {
    file?: Express.Multer.File
}

export interface FilesUploadRequest extends AuthenticatedRequest {
    files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] }
}
