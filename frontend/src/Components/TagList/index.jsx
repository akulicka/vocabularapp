import { useState, useEffect, useCallback } from "react";
import MUIList from "@mui/material/List";
import ListItem from '../ListItem'
import Dialog from '../Dialog'
import Stack from '@mui/material/Stack'
import map from 'lodash/map'
import Card from "@mui/material/Card";
import { IconButton, Typography } from "@mui/material";
import Divider from "@mui/material/Divider";
import EditIcon from '@mui/icons-material/Edit';
import {TagChip} from "../Chip"
import Box from '@mui/material/Box'
import Button from "@mui/material/Button";
import Add from '@mui/icons-material/Add'
import Edit from '@mui/icons-material/Edit'
import Cancel from '@mui/icons-material/Cancel'
import TextField from '@mui/material/TextField'
import Grid2 from "@mui/material/Grid2";
import request from "../../Api/request";
import without from 'lodash/without'
import filter from 'lodash/filter'
import indexOf from 'lodash/indexOf'
import { success, error } from "../../Util/notify";

function TagList({selectedTags, setSelectedTags}){
    const [tagName, setTagName] = useState()
    const [tagBeingEdited, setTagBeingEdited] = useState()
    const [tags, setTags] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [isEditMode, setIsEditmode]  = useState(false)
    

    const submitTag = async() => {
        try{
            const result = await request.post('words/tag', {tagName})
            setTags([...tags, result.data])
            success(`successfully created tag: ${result.data.tagName}`)
            setIsOpen(false)
        }catch(err){
            error(`error creating tag: ${err.message}`)
        }}

    const submitEditTag = async() => {
        try{
            const result = await request.put('words/tag', {tagId : tagBeingEdited.tagId, tagName})
            setTags([...filter(tags, (tag) => tag.tagId != result.data.tagId), result.data])
            success(`successfully edited tag: ${result.data.tagName}`)
            setIsEditOpen(false)
        }catch(err){
            error(`error editing tag: ${err.message}`)
        }}

    const submitDeleteTag = async() => {
        try{
            const result = await request.delete(`words/tag?tagId=${tagBeingEdited.tagId}`)
            console.log(result)
            
            setTags([...filter(tags, (tag) => tag.tagId != tagBeingEdited.tagId)])
            setSelectedTags([...filter(selectedTags, (selectedTags) => selectedTags.tagId != tagBeingEdited.tagId)])
            success(`successfully deleted tag: ${tagBeingEdited.tagName}`)
            setIsDeleteOpen(false)
        }catch(err){
            console.log('err', err, err.message)
            error(`error deleting tag: ${err.message}`)
        }}


    const getTags = async() => {
        try{
            console.log('gettags')
            const results = await request.get('words/tags')
            setTags(results?.data || [])
        }catch(err){
            error(`error getting tags:  ${err.message}`)
        }
    }

    const toggleSelectedTag = useCallback((tagId) => {
        console.log(tagId)
        const filtered = without(selectedTags, tagId)
        const add = filtered.length === selectedTags.length
        setSelectedTags(filtered.length === selectedTags.length ?  [...selectedTags, tagId] : filtered)
        return add
    }, [selectedTags])

    useEffect(() => console.log('selectedTags',selectedTags), [selectedTags])

    useEffect(() => { 
        const initialGet = async() => await getTags()
        initialGet()
    } , [])

    useEffect(() => console.log(tags), [tags])

// todo - multiselect tags
    return (
        <>
            <Stack width='100%' spacing={1} flexGrow={1}>
                <Card sx={{minHeight:'200px', padding:'3px'}}>
                    <Stack>
                        <Stack direction='row'>
                            <IconButton>
                                <Add onClick={() => setIsOpen(true)} />
                            </IconButton>
                            <Typography textAlign={'center'} flexGrow={1} variant={"h6"}>Tags</Typography>
                            <IconButton onClick={() => setIsEditmode(!isEditMode)} >
                                {isEditMode ? <Cancel/> : <Edit />}
                            </IconButton>

                        </Stack>
                        <Divider />
                        <Stack direction="row" >
                            <Box fixed minHeight={'180px'} maxHeight={'180px'} sx={{overflowY:'scroll'}}>
                                <Grid2 container spacing={1} flexGrow={1}>
                                    {map(tags, (tag) =>
                                        <Grid2 key={tag.tagId} wrap={'wrap'}>
                                            <TagChip 
                                                editMode={isEditMode}
                                                toggleSelectedTag={toggleSelectedTag}
                                                isSelected={indexOf(selectedTags, tag.tagId) !== -1}
                                                tag={tag}
                                                onEdit={() => {
                                                    setTagBeingEdited(tag)
                                                    setIsEditOpen(true)}
                                                }
                                                onDelete={() => {                                              
                                                    setTagBeingEdited(tag)
                                                    setIsDeleteOpen(true)
                                                }}
                                                
                                            />
                                            
                                        </Grid2>
                                    )}
                                </Grid2>
                            </Box>            
                        </Stack>
                    </Stack>
                </Card>
            </Stack>
            <Dialog title='New Tag' open={isOpen} onSubmit={submitTag} onClose={() => setIsOpen(false)}>
                <TextField sx={{ flexGrow:'1'}} placeholder='Tag name' onChange={(e) => setTagName(e.target.value)} />
            </Dialog>
            <Dialog title={`Edit Tag ${tagBeingEdited?.tagName}` } open={isEditOpen} onSubmit={submitEditTag} onClose={() => setIsEditOpen(false)}>
                <TextField sx={{ flexGrow:'1'}} placeholder='Tag name' defaultValue={tagBeingEdited?.tagName} onChange={(e) => setTagName(e.target.value)}/>
            </Dialog>
            <Dialog title={`Delete Tag ${tagBeingEdited?.tagName} ?`} open={isDeleteOpen} onSubmit={submitDeleteTag} onClose={() => setIsDeleteOpen(false)}/>
        </>

    )
}

export default TagList