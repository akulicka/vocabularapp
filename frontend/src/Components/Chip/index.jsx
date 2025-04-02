import { useState } from "react";
import Edit from '@mui/icons-material/Edit'
import IconButton from '@mui/material/IconButton' 
import MUIChip from "@mui/material/Chip"
import { makeStyles } from "@mui/styles";

const useStyles = makeStyles({
  chipRoot: {
    "& .MuiIconButton-root": {
        order: 1, // the label has a default order of 0, so this icon goes after the label
        marginRight: "3px", // add some space between icon and delete icon
        cursor: "pointer",
        color: 'rgba(0, 0, 0, 0.3)'
    },
    "& .MuiIconButton-root:hover": {
        color: 'rgba(0, 0, 0, 0.4)'
      },
    "& .MuiChip-deleteIcon": {
        order: 2 // since this is greater than an order of 1, it goes after the icon
    }
  }
});


function EditIcon({onEdit}) {
    return (
        <IconButton size='small' disableRipple onClick={onEdit}>
            <Edit/>
        </IconButton>
    )
}

function Chip({editMode, onDelete, onEdit, ...chipProps}){
    const classes = useStyles();
    return <MUIChip 
        {...chipProps}       
        classes={{root: classes.chipRoot}}
        onDelete={editMode ? onDelete : undefined} 
        icon={editMode ? <EditIcon onEdit={onEdit}/> : undefined}
    />
}

export function TagChip({tag, editMode, toggleSelectedTag, isSelected, ...chipProps}){
    const [selected, setSelected] = useState(isSelected)
    return <Chip 
        {...chipProps} 
        editMode={editMode}
        clickable={!editMode}
        onClick={() => {
            if(editMode) return
            const added = toggleSelectedTag(tag.tagId)
            setSelected(added)
        }}
        label={tag.tagName}
        color={selected ? 'success' : 'default'}
    />
}

export function WordChip({word, editMode, ...chipProps}){
    const [alt, setAlt] = useState(false)
    return <Chip 
        {...chipProps} 
        editMode={editMode}
        label={alt ? word.arabic : word.english} 
        onClick={editMode ? undefined : () => setAlt(!alt)} 
    />
}

export default Chip