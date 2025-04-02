import { useCallback, useState } from 'react'
import {useDropzone} from 'react-dropzone'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import map from 'lodash/map'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import request from '../../Api/request'


// TODO:
/* 
    Profile picture upload w/ crop
    generate UUID to assoc with user record

*/


function ImgPreview({file}) {
    const url = URL.createObjectURL(file)
    return (
        <Box 
            component ='img'
            sx={{maxHeight: 100, maxWidth: 100, minHeight: 100, minWidth:100}}
            src={url}
            onLoad={() => URL.revokeObjectURL(url)}
        />
    )
}
function PreviewList({files}){
    return <Stack direction='row'> {map(files, (file) => <ImgPreview file={file}/>) }</Stack>
} 

function DropZone () {

    const [files, setFiles] = useState([])
    const onSubmit = async() => {
        try{
            const response = await request.postForm('user/files', {
                'files[]': files
            }, {timeout: 5000});
        }
        catch(err){
            console.log(err.message)
        }
    }

    const onDrop = useCallback(acceptedFiles => {
        
        const newFiles = [...files, ...acceptedFiles]
        setFiles(newFiles)
      }, [files])

    // DEBUG useEffect(() => console.log(files), [files])
    const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})

    return (
        <>
            <Card style={{minHeight:'400px'}} {...getRootProps()} >
                <input {...getInputProps()} />
                {isDragActive ? 
                    <Typography> drop here </Typography> : <Typography> Drag n drop some files here, or click to select files</Typography>
                }
                <PreviewList files={files} />
            </Card>
            <br/>
            <Button style={{minHeight:'50px'}} onClick={onSubmit}> submit </Button>
        </>
    )
}

export default DropZone