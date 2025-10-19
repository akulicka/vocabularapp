import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import map from 'lodash/map'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import request from '@api/request'

// TODO:
/* 
    Profile picture upload w/ crop
    generate UUID to assoc with user record

*/

interface ImgPreviewProps {
    file: File
}

function ImgPreview({ file }: ImgPreviewProps) {
    const url = URL.createObjectURL(file)
    return <Box component="img" sx={{ maxHeight: 100, maxWidth: 100, minHeight: 100, minWidth: 100 }} src={url} onLoad={() => URL.revokeObjectURL(url)} />
}

interface PreviewListProps {
    files: File[]
}

function PreviewList({ files }: PreviewListProps) {
    return (
        <Stack direction="row">
            {' '}
            {map(files, (file, index) => (
                <ImgPreview key={index} file={file} />
            ))}
        </Stack>
    )
}

function DropZone() {
    const [files, setFiles] = useState<File[]>([])
    const onSubmit = async () => {
        try {
            await request.postForm(
                'user/files',
                {
                    'files[]': files,
                },
                { timeout: 5000 },
            )
        } catch (err) {
            console.log(err instanceof Error ? err.message : 'Unknown error')
        }
    }

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const newFiles = [...files, ...acceptedFiles]
            setFiles(newFiles)
        },
        [files],
    )

    // DEBUG useEffect(() => console.log(files), [files])
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

    return (
        <>
            <Card style={{ minHeight: '400px' }} {...getRootProps()}>
                <input {...getInputProps()} />
                {isDragActive ? <Typography> drop here </Typography> : <Typography> Drag n drop some files here, or click to select files</Typography>}
                <PreviewList files={files} />
            </Card>
            <br />
            <Button style={{ minHeight: '50px' }} onClick={onSubmit}>
                {' '}
                submit{' '}
            </Button>
        </>
    )
}

export default DropZone
