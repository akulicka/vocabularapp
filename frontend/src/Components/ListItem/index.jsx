import { ListItemText, IconButton, Stack, ListItem as MUIListItem, Tooltip } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

function IconButtons({setIsOpen}) {
    return (
        <Stack direction="row" spacing={0}>
            <Tooltip title='Edit'>
                <IconButton>
                    <EditIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title='Delete'>
                <IconButton onClick={() => setIsOpen(true)}>
                    <DeleteIcon />
                </IconButton>
            </Tooltip>
        </Stack>
    )
}

function ListItem({text, setIsOpen}) {
    return (
        <MUIListItem>
            <ListItemText> {text} </ListItemText>
            {/* <IconButtons setIsOpen={setIsOpen} /> */}
        </MUIListItem>
    )
}
export default ListItem