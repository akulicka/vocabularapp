import { useCallback, useEffect, useState } from "react";
import MUIAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Button  from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import AccountCircle from '@mui/icons-material/AccountCircle'
import Menu from '@mui/icons-material/Menu'
import request from "../../Api/request";
import {useDropzone} from 'react-dropzone'
import { Buffer } from "buffer";

import {error, success} from '../../Util/notify'

function ImgPreview({pic}) {
    const url = URL.createObjectURL(pic)
    return (
        <Avatar 
            alt='profile'
            src={url}
            onLoad={() => URL.revokeObjectURL(url)}
        />
    )
}

function AppBar ({ logout, user, ...props}) {
    const [file, setFile] = useState()
    const [pic, setPic] = useState()
    const onDrop = useCallback(acceptedFile => {
        setFile(acceptedFile)
    }, [])

    useEffect(() => {
        const submitFile = async () => await onSubmit()
        if (file) submitFile()
    },[file])

    useEffect(() => {
        const callGetPic = async () => await getPic()
        if(user) callGetPic()
        else setPic()
    }, [user])

    const getPic = async() => {
        try{
            const response = await request.get('user/img', {timeout: 5000});
            if (response?.data?.img_buffer){
                const buffer = Buffer.from(response?.data?.img_buffer);
                const blob = new Blob([buffer]);
                setPic(blob)
            }
        }
        catch(err){
            console.log(err.message)
        }
    }

    const onSubmit = async() => {
        try{
            const response = await request.postForm('user/img', {
                'avatar': file
            }, {timeout: 5000, formSerializer: {indexes: null}});
            await getPic()
            success('avatar changed')
        }
        catch(err){
            error(err.message)
        }
    }
    const {getRootProps, getInputProps} = useDropzone({onDrop})
    return (
        <MUIAppBar position="sticky" color={'success'} >
            <Toolbar > 
                <Stack flexGrow={1} spacing={3} direction={'row'} >
                    {props.children}
                    <IconButton><Menu/></IconButton>
                    <Typography  textAlign={"left"} flexGrow={1} variant="h4" >Welcome</Typography>
                    <Box>
                    {user ? 
                        <>
                            <IconButton {...getRootProps()}>
                                <input {...getInputProps()} />
                                {pic ? <ImgPreview pic={pic}/> : <AccountCircle />}
                            </IconButton> 
                            <Button color={'secondary'} variant="h3" onClick={() => logout()}> Logout </Button>
                        </> : <></>
                    }
                    </Box>
                </Stack>
            </Toolbar>
        </MUIAppBar>
    )
}

export default AppBar
