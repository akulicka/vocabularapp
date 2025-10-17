import { useState, useCallback } from 'react'
import Add from '@mui/icons-material/Add'
import Box from '@mui/material/Box'
import Cancel from '@mui/icons-material/Cancel'
import Card from '@mui/material/Card'
import Divider from '@mui/material/Divider'
import Edit from '@mui/icons-material/Edit'
import filter from 'lodash/filter'
import Grid2 from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'
import indexOf from 'lodash/indexOf'
import map from 'lodash/map'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import without from 'lodash/without'

import { success, error } from '@util/notify'
import { TagChip } from '../Chip'
import Dialog from '../Dialog'
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '@api/words'

// TODO - limit to 5 tags
function TagList({ selectedTags, setSelectedTags, tags, isLoading }) {
    const [tagName, setTagName] = useState()
    const [tagBeingEdited, setTagBeingEdited] = useState()
    const [isOpen, setIsOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [isEditMode, setIsEditmode] = useState(false)

    // TanStack Query hooks
    const { data: tagsData, isLoading: tagsLoading } = useTags()
    const createTagMutation = useCreateTag()
    const updateTagMutation = useUpdateTag()
    const deleteTagMutation = useDeleteTag()

    // Use passed tags or fallback to query data
    const displayTags = tags || tagsData || []
    const loading = isLoading || tagsLoading

    const submitTag = async () => {
        try {
            await createTagMutation.mutateAsync({ tagName })
            success(`successfully created tag: ${tagName}`)
            setIsOpen(false)
            setTagName('')
        } catch (err) {
            error(`error creating tag: ${err.message}`)
        }
    }

    const submitEditTag = async () => {
        try {
            await updateTagMutation.mutateAsync({
                tagId: tagBeingEdited.tagId,
                tagName,
            })
            success(`successfully edited tag: ${tagName}`)
            setIsEditOpen(false)
            setTagName('')
        } catch (err) {
            error(`error editing tag: ${err.message}`)
        }
    }

    const submitDeleteTag = async () => {
        try {
            await deleteTagMutation.mutateAsync(tagBeingEdited.tagId)
            setSelectedTags([...filter(selectedTags, (selectedTag) => selectedTag.tagId != tagBeingEdited.tagId)])
            success(`successfully deleted tag: ${tagBeingEdited.tagName}`)
            setIsDeleteOpen(false)
        } catch (err) {
            error(`error deleting tag: ${err.message}`)
        }
    }

    const toggleSelectedTag = useCallback(
        (tagId) => {
            const filtered = without(selectedTags, tagId)
            const add = filtered.length === selectedTags.length
            setSelectedTags(filtered.length === selectedTags.length ? [...selectedTags, tagId] : filtered)
            return add
        },
        [selectedTags],
    )

    return (
        <>
            <Stack width="100%" spacing={1} flexGrow={1}>
                <Card sx={{ minHeight: '200px', padding: '3px' }}>
                    <Stack>
                        <Stack direction="row">
                            <IconButton>
                                <Add onClick={() => setIsOpen(true)} />
                            </IconButton>
                            <Typography textAlign={'center'} flexGrow={1} variant={'h6'}>
                                Tags
                            </Typography>
                            <IconButton onClick={() => setIsEditmode(!isEditMode)}>{isEditMode ? <Cancel /> : <Edit />}</IconButton>
                        </Stack>
                        <Divider />
                        <Stack direction="row">
                            <Box minHeight={'180px'} maxHeight={'180px'} sx={{ overflowY: 'scroll' }}>
                                <Grid2 container spacing={1} flexGrow={1}>
                                    {loading ? (
                                        <Typography>Loading tags...</Typography>
                                    ) : (
                                        map(displayTags, (tag) => (
                                            <Grid2 key={tag.tagId} wrap={'wrap'}>
                                                <TagChip
                                                    editMode={isEditMode}
                                                    toggleSelectedTag={toggleSelectedTag}
                                                    isSelected={indexOf(selectedTags, tag.tagId) !== -1}
                                                    tag={tag}
                                                    onEdit={() => {
                                                        setTagBeingEdited(tag)
                                                        setIsEditOpen(true)
                                                    }}
                                                    onDelete={() => {
                                                        setTagBeingEdited(tag)
                                                        setIsDeleteOpen(true)
                                                    }}
                                                />
                                            </Grid2>
                                        ))
                                    )}
                                </Grid2>
                            </Box>
                        </Stack>
                    </Stack>
                </Card>
            </Stack>
            <Dialog title="New Tag" open={isOpen} onSubmit={submitTag} onClose={() => setIsOpen(false)}>
                <TextField sx={{ flexGrow: '1' }} placeholder="Tag name" onChange={(e) => setTagName(e.target.value)} />
            </Dialog>
            <Dialog title={`Edit Tag ${tagBeingEdited?.tagName}`} open={isEditOpen} onSubmit={submitEditTag} onClose={() => setIsEditOpen(false)}>
                <TextField sx={{ flexGrow: '1' }} placeholder="Tag name" defaultValue={tagBeingEdited?.tagName} onChange={(e) => setTagName(e.target.value)} />
            </Dialog>
            <Dialog title={`Delete Tag ${tagBeingEdited?.tagName} ?`} open={isDeleteOpen} onSubmit={submitDeleteTag} onClose={() => setIsDeleteOpen(false)} />
        </>
    )
}

export default TagList
