import { useState } from "react";
import MUIList from "@mui/material/List";
import ListItem from '../ListItem'
import Dialog from '../Dialog'
import Stack from '@mui/material/Stack'
import map from 'lodash/map'
import Card from "@mui/material/Card";
import { IconButton, Typography } from "@mui/material";
import Divider from "@mui/material/Divider";
import EditIcon from '@mui/icons-material/Edit';
import TextField from "@mui/material/TextField"

function WordForm(){
    const [isOpen, setIsOpen] = useState(false)
    const [listName, setListName] = useState("")
    let key = 0
    return (
        <Card >
            <Typongraphy variant='h6'>WordForm</Typongraphy>
            <Dialog open={isOpen} onSubmit={() => console.log(listName) } onClose={() => setIsOpen(false)} > <TextField onChange={(e) => setListName(e?.target?.value)} placeholder="Name" /> </Dialog>
        </Card>
    )
}

export default WordForm