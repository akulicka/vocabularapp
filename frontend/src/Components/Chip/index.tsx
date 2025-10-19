import { useState } from 'react'
import { makeStyles } from '@mui/styles'
import Edit from '@mui/icons-material/Edit'
import IconButton from '@mui/material/IconButton'
import MUIChip from '@mui/material/Chip'
import { TagDTO, WordDTO } from '@shared/types'

const useStyles = makeStyles({
    chipRoot: {
        '& .MuiIconButton-root': {
            order: 1, // the label has a default order of 0, so this icon goes after the label
            marginRight: '3px', // add some space between icon and delete icon
            cursor: 'pointer',
            color: 'rgba(0, 0, 0, 0.3)',
        },
        '& .MuiIconButton-root:hover': {
            color: 'rgba(0, 0, 0, 0.4)',
        },
        '& .MuiChip-deleteIcon': {
            order: 2, // since this is greater than an order of 1, it goes after the icon
        },
    },
})

interface EditIconProps {
    onEdit: () => void
}

function EditIcon({ onEdit }: EditIconProps) {
    return (
        <IconButton size="small" disableRipple onClick={onEdit}>
            <Edit />
        </IconButton>
    )
}

interface ChipProps {
    editMode?: boolean
    onDelete?: () => void
    onEdit?: () => void
    [key: string]: any // For spreading additional props to MUIChip
}

function Chip({ editMode, onDelete, onEdit, ...chipProps }: ChipProps) {
    const classes = useStyles()
    return <MUIChip {...chipProps} classes={{ root: classes.chipRoot }} onDelete={editMode ? onDelete : undefined} icon={editMode ? <EditIcon onEdit={onEdit} /> : undefined} />
}

interface TagChipProps {
    tag: TagDTO
    editMode?: boolean
    toggleSelectedTag: (tagId: string) => boolean
    isSelected?: boolean
    [key: string]: any // For spreading additional props to Chip
}

export function TagChip({ tag, editMode, toggleSelectedTag, isSelected, ...chipProps }: TagChipProps) {
    const [selected, setSelected] = useState(isSelected)
    return (
        <Chip
            {...chipProps}
            editMode={editMode}
            onClick={
                editMode
                    ? undefined
                    : () => {
                          const added = toggleSelectedTag(tag.tagId)
                          setSelected(added)
                      }
            }
            label={tag.tagName}
            color={selected ? 'success' : 'default'}
        />
    )
}

interface WordChipProps {
    word: WordDTO
    editMode?: boolean
    [key: string]: any // For spreading additional props to Chip
}

export function WordChip({ word, editMode, ...chipProps }: WordChipProps) {
    const [alt, setAlt] = useState(false)
    return <Chip {...chipProps} editMode={editMode} label={alt ? word.arabic : word.english} onClick={editMode ? undefined : () => setAlt(!alt)} />
}

export default Chip
