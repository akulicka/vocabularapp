import { useState, useEffect, useCallback } from 'react'
import Add from '@mui/icons-material/Add'
import Card from '@mui/material/Card'
import Divider from '@mui/material/Divider'
import Edit from '@mui/icons-material/Edit'
import filter from 'lodash/filter'
import Grid2 from '@mui/material/Grid2'
import map from 'lodash/map'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { success, error } from '../../Util/notify.jsx'
import { WordChip } from '../../Components/Chip'
import Dialog from '../../Components/Dialog/index.jsx'
import IconButton from '@mui/material/IconButton'
import request from '../../Api/request'
import WordFormDialog from '../../Components/WordForm/index.jsx'

function Dictionary() {
    const [isEditMode, setIsEditmode] = useState(false)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [wordBeingEdited, setWordBeingEdited] = useState()
    const [words, setWords] = useState([])

    //refresh words - TODO - paginate
    const getWords = async () => {
        try {
            const results = await request.get('/words')
            setWords(results?.data || [])
        } catch (err) {
            error('error getting words: ', err.message)
        }
    }

    useEffect(() => {
        const initialGet = async () => await getWords()
        initialGet()
    }, [])

    //called from wordformdialog on successful add/edit with payload of added/edited word from API
    const updateWords = useCallback(
        (newWord) => {
            if (wordBeingEdited) {
                if (wordBeingEdited.wordId !== newWord.wordId) {
                    console.log('error updating wordlist:  wordbeingedited id does not match returned id')
                } else {
                    const filteredWords = filter(words, (word) => word.wordId !== newWord.wordId)
                    if (filteredWords.length === words.length) {
                        console.log('error updating wordlist:  returned id not found in word list')
                    } else {
                        setWords([...filteredWords, newWord])
                    }
                }
            } else {
                setWords([...words, newWord])
            }
        },
        [words, wordBeingEdited],
    )

    const deleteWord = useCallback(async () => {
        try {
            const results = await request.delete(`/words?wordId=${wordBeingEdited.wordId}`)
            const filteredWords = filter(words, (word) => word.wordId !== wordBeingEdited.wordId)
            if (filteredWords.length === words.length) console.log('error updating wordlist:  returned id not found in word list')
            else setWords(filteredWords)
            success(`Successfully deleted ${wordBeingEdited.english}`)
            setIsDeleteOpen(false)
        } catch (err) {
            error(`Error Deleting ${wordBeingEdited.english}: ${err.message}`)
        }
    }, [words, wordBeingEdited])

    return (
        <>
            <Typography textAlign={'center'} variant={'h1'}>
                Dictionary
            </Typography>
            <Card sx={{ minHeight: '200px', padding: '3px' }}>
                <Stack>
                    <Typography textAlign={'center'} variant={'h6'}>
                        Words
                    </Typography>
                    <Divider />
                    <Stack direction="row">
                        <Grid2 spacing={1} container flexGrow={1}>
                            {map(words, (word) => (
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
                            ))}
                        </Grid2>
                        <Stack>
                            <IconButton
                                onClick={() => {
                                    setWordBeingEdited()
                                    setIsFormOpen(true)
                                }}
                            >
                                <Add />
                            </IconButton>
                            <IconButton onClick={() => setIsEditmode(!isEditMode)}>
                                <Edit />
                            </IconButton>
                        </Stack>
                    </Stack>
                </Stack>
            </Card>
            {isFormOpen && <WordFormDialog word={wordBeingEdited} open={isFormOpen} onClose={() => setIsFormOpen(false)} updateWords={updateWords} />}
            <Dialog title={`Delete Word ${wordBeingEdited?.english} ?`} open={isDeleteOpen} onSubmit={deleteWord} onClose={() => setIsDeleteOpen(false)} />
        </>
    )
}
export default Dictionary
