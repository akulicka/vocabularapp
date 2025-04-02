import { useState, useMemo, useEffect, useCallback } from "react";
import request from '../../Api/request';
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField"
import {success, error} from '../../Util/notify.jsx'
import { useNavigate } from "react-router";
import { PARTS_OF_SPEECH, TYPES_OF_NOUN, GENDERS, TENSES_OF_VERB, IRREGULARITIES_OF_VERB, FORMS_OF_VERB } from "../../Enum/word.jsx";
import Select from "@mui/material/Select";

import IconButton from "@mui/material/IconButton";
import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "../../Components/Dialog/index.jsx";
import {WordChip} from "../../Components/Chip";
import WordFormDialog from "../../Components/WordForm/index.jsx";
import map from 'lodash/map'
import filter from 'lodash/filter'
import Card  from "@mui/material/Card";
import TagList from "../../Components/TagList/index.jsx";
import WordList from "../../Components/WordList/index.jsx";
import Add from '@mui/icons-material/Add'
import Edit from '@mui/icons-material/Edit'

import Grid2 from "@mui/material/Grid2";
import Divider from "@mui/material/Divider";


function Dictionary() {
    const [isEditMode, setIsEditmode] = useState(false)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [wordBeingEdited, setWordBeingEdited] = useState()
    const [words, setWords] = useState([])        
    
    //refresh words - TODO - paginate
    const getWords = async() => {
        try{
            console.log('getwords')
            const results = await request.get('/words')
            setWords(results?.data || [])
        }catch(err){
            console.log('error getting words: ', err.message)
            error('error getting words: ', err.message)
        }
    }

    useEffect(() => { 
        const initialGet = async() => await getWords()
        initialGet()
    } , [])

    //called from wordformdialog on successful add/edit with payload of added/edited word from API
    const updateWords = useCallback((newWord) => {
        if (wordBeingEdited) {
            if(wordBeingEdited.wordId !== newWord.wordId){
                console.log('error updating wordlist:  wordbeingedited id does not match returned id')
            }else{
                const filteredWords = filter(words, (word) => word.wordId !== newWord.wordId)
                if(filteredWords.length === words.length){
                    console.log('error updating wordlist:  returned id not found in word list')
                }else{
                    setWords([...filteredWords, newWord])
                }
            }
        }
        else {
            setWords([...words, newWord])
        }

    }, [words, wordBeingEdited])

    const deleteWord = useCallback(async() => {
        try{
            const results = await request.delete(`/words?wordId=${wordBeingEdited.wordId}`)
            const filteredWords = filter(words, (word) => word.wordId !== wordBeingEdited.wordId)
            if(filteredWords.length === words.length) console.log('error updating wordlist:  returned id not found in word list')
            else setWords(filteredWords)
            success(`Successfully deleted ${wordBeingEdited.english}`)
            setIsDeleteOpen(false)
        }catch(err){
            error(`Error Deleting ${wordBeingEdited.english}: ${err.message}`)
        }
    }, [words, wordBeingEdited])

    return (
        <>
            <Typography textAlign={'center'} variant={"h1"}>Dictionary</Typography>
            <Card sx={{minHeight:'200px', padding:'3px'}}>
                <Stack>
                    <Typography textAlign={'center'} variant={"h6"}>Words</Typography>
                    <Divider/>
                    <Stack direction="row" >
                        <Grid2 spacing={1} container flexGrow={1}>
                            {map(words, (word) =>
                                <Grid2 key={word.wordId}>
                                    <WordChip 
                                        editMode={isEditMode} 
                                        onEdit={() => {
                                            setWordBeingEdited(word)
                                            setIsFormOpen(true)
                                        }}
                                        onDelete={() => {
                                            setWordBeingEdited(word)
                                            setIsDeleteOpen(true)
                                        }}
                                        key={word.wordId}
                                        word={word}
                                    />
                                </Grid2>
                            )}
                        </Grid2>                
                        <Stack>
                            <IconButton onClick={() => { 
                                    setWordBeingEdited()
                                    setIsFormOpen(true)
                            }}>
                                <Add />
                            </IconButton>
                            <IconButton onClick={() => setIsEditmode(!isEditMode)}>
                                <Edit />
                            </IconButton>
                        </Stack>
                    </Stack>
                </Stack>
            </Card>
            {isFormOpen && <WordFormDialog 
                word={wordBeingEdited} 
                open={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                updateWords={updateWords}
            />}
            <Dialog 
                title={`Delete Word ${wordBeingEdited?.english} ?`} 
                open={isDeleteOpen}
                onSubmit={deleteWord}
                onClose={() => setIsDeleteOpen(false)}
            />
        </>
    )
}
export default Dictionary