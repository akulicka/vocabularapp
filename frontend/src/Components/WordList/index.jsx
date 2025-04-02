import { useState, useEffect, useCallback } from "react";
import Stack from '@mui/material/Stack'
import map from 'lodash/map'
import Card from "@mui/material/Card";
import { IconButton, Typography } from "@mui/material";
import Add from '@mui/icons-material/Add'
import Edit from '@mui/icons-material/Edit'
import Grid2 from "@mui/material/Grid2";
import request from "../../Api/request";
import Box from "@mui/material/Box";
import {WordChip} from "../Chip";
import { error } from "../../Util/notify";


function WordList({add, edit, words}){
    const [isEditMode, setIsEditmode] = useState(false)
    
    const onEdit = (word) => {
        
    }

    return (
        <Card sx={{minHeight:'200px', padding:'3px'}}>
            <Stack>
                <Typography textAlign={'center'} variant={"h6"}>Words</Typography>
                <Stack direction="row" >
                    <Grid2 container flexGrow={1}>
                        {map(words, (word) =>
                            <Grid2 key={word.wordId}>
                                <WordChip 
                                    editMode={isEditMode} 
                                    onEdit={() => console.log('onEdit')} 
                                    onDelete={() => console.log('onDelete')} 
                                    key={word.wordId} 
                                    word={word}
                                />
                            </Grid2>
                        )}
                    </Grid2>                
                    <Stack>
                        <IconButton onClick={add}>
                            <Add />
                        </IconButton>
                        <IconButton onClick={() => setIsEditmode(!isEditMode)}>
                            <Edit />
                        </IconButton>
                    </Stack>
                </Stack>
            </Stack>
        </Card>
    )
}

export default WordList