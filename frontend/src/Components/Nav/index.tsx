import { useCallback, useEffect, useState } from 'react'
import { Buffer } from 'buffer'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router'
import AccountCircle from '@mui/icons-material/AccountCircle'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Menu from '@mui/icons-material/Menu'
import MUIAppBar from '@mui/material/AppBar'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import MUIMenu from '@mui/material/Menu'
// import MUIMenuList from '@mui/material/MenuList'
import MUIMenuItem from '@mui/material/MenuItem'

import { error, success } from '@util/notify'
import request from '@api/request'

interface ImgPreviewProps {
    pic: Blob
}

function ImgPreview({ pic }: ImgPreviewProps) {
    const url = URL.createObjectURL(pic)
    return <Avatar alt="profile" src={url} onLoad={() => URL.revokeObjectURL(url)} />
}

interface AppBarProps {
    logout: () => void
    user: any // TODO: Type this properly with user type
    children?: React.ReactNode
}

function AppBar({ logout, user, ...props }: AppBarProps) {
    const [file, setFile] = useState<File | undefined>()
    const [pic, setPic] = useState<Blob | undefined>()
    const [open, setOpen] = useState(false)
    const [anchor, setAnchor] = useState<HTMLElement | undefined>()

    const navigate = useNavigate()
    const onDrop = useCallback((acceptedFile: File[]) => {
        setFile(acceptedFile[0])
    }, [])
    const { getRootProps, getInputProps } = useDropzone({ onDrop })

    useEffect(() => {
        const submitFile = async () => await onSubmit()
        if (file) submitFile()
    }, [file])

    useEffect(() => {
        const callGetPic = async () => await getPic()
        if (user) callGetPic()
        else setPic(undefined)
    }, [user])

    const getPic = async () => {
        try {
            const response = await request.get('user/img', { timeout: 5000 })
            if (response?.data?.img_buffer) {
                const buffer = Buffer.from(response?.data?.img_buffer)
                const blob = new Blob([buffer])
                setPic(blob)
            }
        } catch (err) {
            error(`Error retrieving profile pic: ${err instanceof Error ? err.message : 'Unknown error'}`)
        }
    }

    const onSubmit = async () => {
        try {
            await request.postForm(
                'user/img',
                {
                    avatar: file,
                },
                { timeout: 5000, formSerializer: { indexes: null } },
            )
            await getPic()
            success('avatar changed')
        } catch (err) {
            error(err instanceof Error ? err.message : 'Unknown error')
        }
    }
    return (
        <MUIAppBar position="sticky" color={'success'}>
            <Toolbar>
                <Stack flexGrow={1} spacing={3} direction={'row'}>
                    {props.children}
                    <Box width="50px">
                        {user && (
                            <IconButton
                                onClick={(e) => {
                                    setAnchor(e.currentTarget)
                                    setOpen(true)
                                }}
                            >
                                <Menu />
                            </IconButton>
                        )}
                    </Box>
                    <Typography textAlign={'left'} flexGrow={1} variant="h4">
                        Welcome
                    </Typography>
                    <Box>
                        {user && (
                            <>
                                <IconButton {...getRootProps()}>
                                    <input {...getInputProps()} />
                                    {pic ? <ImgPreview pic={pic} /> : <AccountCircle />}
                                </IconButton>
                                <Button color={'secondary'} variant="text" onClick={logout}>
                                    {' '}
                                    Logout{' '}
                                </Button>
                            </>
                        )}
                    </Box>
                </Stack>
                <MUIMenu
                    open={open}
                    anchorEl={anchor}
                    onClose={() => {
                        setOpen(false)
                        setAnchor(undefined)
                    }}
                >
                    <MUIMenuItem onClick={() => navigate('/')}>Dictionary</MUIMenuItem>
                    <MUIMenuItem onClick={() => navigate('/quiz')}> Quiz </MUIMenuItem>
                </MUIMenu>
            </Toolbar>
        </MUIAppBar>
    )
}

export default AppBar
