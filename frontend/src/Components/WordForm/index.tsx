import { useState, useCallback, useEffect, useMemo } from 'react'
import Box from '@mui/material/Box'
import map from 'lodash/map'
import MenuItem from '@mui/material/MenuItem'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { PARTS_OF_SPEECH, TYPES_OF_NOUN, GENDERS, TENSES_OF_VERB, IRREGULARITIES_OF_VERB, FORMS_OF_VERB, WordDTO } from '@shared/types'
import { CreateWordRequestSchema, UpdateWordRequestSchema } from '@shared/schemas'
import { success, error } from '@util/notify'
import Dialog from '@components/Dialog'
import request from '@api/request'
import TagList from '@components/TagList'
import { validate } from '@api/validation'

// Type definitions for form props
interface NounProps {
    nounType: string
    nounGender: string
    nounBrokenPlural: string
}

interface VerbProps {
    verbIrregularity: string
    verbForm: string
    verbTense: string
}

interface WordProps {
    wordEnglish: string
    wordArabic: string
    wordSpeechPart: string
}

interface NounFormProps {
    nounProps: NounProps
    setNounProps: (props: NounProps) => void
}

interface VerbFormProps {
    verbProps: VerbProps
    setVerbProps: (props: VerbProps) => void
}

interface WordFormProps {
    wordProps: WordProps
    setWordProps: (props: WordProps) => void
    changeSpeechPart: (speechPart: string) => void
}

interface WordFormDialogProps {
    word?: WordDTO
    updateWords: (word: WordDTO) => void
    open: boolean
    onClose: () => void
}

function NounForm({ nounProps, setNounProps }: NounFormProps) {
    return (
        <Stack spacing={1}>
            <Stack spacing={1} direction="row">
                <Select id="nounType" fullWidth value={nounProps.nounType} onChange={(e) => setNounProps({ ...nounProps, nounType: e.target.value })}>
                    {map(TYPES_OF_NOUN, (type) => (
                        <MenuItem key={type} value={type}>
                            {' '}
                            {type.toLowerCase().replace('_', ' ')}{' '}
                        </MenuItem>
                    ))}
                </Select>
                <Box width="25%">
                    <RadioGroup id="nounGender" value={nounProps.nounGender} onChange={(e) => setNounProps({ ...nounProps, nounGender: e.target.value })}>
                        <Stack direction={'row'}>
                            <Radio value={GENDERS.MALE} />
                            <Typography alignContent={'center'} alignItems={'center'}>
                                {' '}
                                Male{' '}
                            </Typography>
                        </Stack>
                        <Stack direction={'row'}>
                            <Radio value={GENDERS.FEMALE} />
                            <Typography alignContent={'center'} alignItems={'center'}>
                                {' '}
                                Female{' '}
                            </Typography>
                        </Stack>
                    </RadioGroup>
                </Box>
            </Stack>
            <TextField id="nounBrokenPlural" fullWidth placeholder="Broken Plural" value={nounProps.nounBrokenPlural} onChange={(e) => setNounProps({ ...nounProps, nounBrokenPlural: e.target.value })} />
        </Stack>
    )
}

function VerbForm({ verbProps, setVerbProps }: VerbFormProps) {
    return (
        <Stack spacing={1} direction="row">
            <Select id="verbIrregularity" fullWidth value={verbProps.verbIrregularity} onChange={(e) => setVerbProps({ ...verbProps, verbIrregularity: e.target.value })}>
                {map(IRREGULARITIES_OF_VERB, (irregularity) => (
                    <MenuItem key={irregularity} value={irregularity}>
                        {' '}
                        {irregularity.toLowerCase()}{' '}
                    </MenuItem>
                ))}
            </Select>
            <Select id="verbForm" fullWidth value={verbProps.verbForm} onChange={(e) => setVerbProps({ ...verbProps, verbForm: e.target.value })}>
                {map(FORMS_OF_VERB, (form) => (
                    <MenuItem key={form} value={form}>
                        {' '}
                        {form}{' '}
                    </MenuItem>
                ))}
            </Select>
            <Box width="25%">
                <RadioGroup id="verbTense" value={verbProps.verbTense} onChange={(e) => setVerbProps({ ...verbProps, verbTense: e.target.value })}>
                    <Stack direction={'row'}>
                        <Radio value={TENSES_OF_VERB.PAST} />
                        <Typography alignContent={'center'} alignItems={'center'}>
                            {' '}
                            Past{' '}
                        </Typography>
                    </Stack>
                    <Stack direction={'row'}>
                        <Radio value={TENSES_OF_VERB.PRESENT} />
                        <Typography alignContent={'center'}> Present </Typography>
                    </Stack>
                </RadioGroup>
            </Box>
        </Stack>
    )
}

function WordForm({ wordProps, setWordProps, changeSpeechPart }: WordFormProps) {
    return (
        <Stack width="100%" spacing={1} flexGrow={1}>
            <Stack spacing={1} width="100%" flexGrow={'inherit'} direction={'row'}>
                <TextField fullWidth placeholder="English" id="wordEnglish" value={wordProps.wordEnglish} onChange={(e) => setWordProps({ ...wordProps, wordEnglish: e.target.value })} />
                <TextField fullWidth placeholder="Arabic" id="wordArabic" value={wordProps.wordArabic} onChange={(e) => setWordProps({ ...wordProps, wordArabic: e.target.value })} />
            </Stack>
            <Select value={wordProps.wordSpeechPart} id="wordSpeechPart" onChange={(e) => changeSpeechPart(e.target.value)}>
                {map(PARTS_OF_SPEECH, (part) => (
                    <MenuItem key={part} value={part}>
                        {' '}
                        {part.toLowerCase()}{' '}
                    </MenuItem>
                ))}
            </Select>
        </Stack>
    )
}

function WordFormDialog({ word, updateWords, open, onClose }: WordFormDialogProps) {
    const INITIAL_NOUN_PROPS = useMemo(() => {
        return {
            nounType: word?.noun?.nounType || TYPES_OF_NOUN.DEFINITE_NOUN,
            nounGender: word?.noun?.gender || GENDERS.MALE,
            nounBrokenPlural: word?.noun?.brokenPlural || '',
        }
    }, [word])

    const INITIAL_VERB_PROPS = useMemo(() => {
        return {
            verbIrregularity: word?.verb?.irregularityClass || IRREGULARITIES_OF_VERB.REGULAR,
            verbForm: word?.verb?.verbForm || FORMS_OF_VERB.I,
            verbTense: word?.verb?.tense || TENSES_OF_VERB.PAST,
        }
    }, [word])

    // todo: root, img
    const INITIAL_WORD_PROPS = useMemo(() => {
        return {
            wordEnglish: word?.english || '',
            wordArabic: word?.arabic || '',
            wordSpeechPart: word?.partOfSpeech || PARTS_OF_SPEECH.NOUN,
        }
    }, [word])

    const INITAL_TAGS = useMemo(() => (word ? map(word.tags, (tag) => tag.tagId) : []), [word])

    const [nounProps, setNounProps] = useState<NounProps>(INITIAL_NOUN_PROPS)
    const [verbProps, setVerbProps] = useState<VerbProps>(INITIAL_VERB_PROPS)
    const [wordProps, setWordProps] = useState<WordProps>(INITIAL_WORD_PROPS)
    const [tags, setTags] = useState<string[]>(INITAL_TAGS)

    useEffect(() => setNounProps(INITIAL_NOUN_PROPS), [INITIAL_NOUN_PROPS])
    useEffect(() => setVerbProps(INITIAL_VERB_PROPS), [INITIAL_VERB_PROPS])
    useEffect(() => setWordProps(INITIAL_WORD_PROPS), [INITIAL_WORD_PROPS])
    useEffect(() => setTags(INITAL_TAGS), [INITAL_TAGS])

    // useEffect(() => console.log('wordProps', wordProps), [wordProps])
    // useEffect(() => console.log('nounProps', nounProps), [nounProps])
    // useEffect(() => console.log('verbProps', verbProps), [verbProps])
    // useEffect(() => console.log('tags', tags), [tags])

    const changeSpeechPart = (wordSpeechPart: string) => {
        switch (wordSpeechPart) {
            case PARTS_OF_SPEECH.NOUN:
                setVerbProps(INITIAL_VERB_PROPS)
                break
            case PARTS_OF_SPEECH.VERB:
                setNounProps(INITIAL_NOUN_PROPS)
                break
            default:
                setNounProps(INITIAL_NOUN_PROPS)
                setVerbProps(INITIAL_VERB_PROPS)
        }
        setWordProps({ ...wordProps, wordSpeechPart })
    }

    const submitProps = useMemo(() => {
        const props: any = { ...wordProps, wordTags: tags }
        switch (wordProps.wordSpeechPart) {
            case PARTS_OF_SPEECH.NOUN:
                props.nounProps = nounProps
                break
            case PARTS_OF_SPEECH.VERB:
                props.verbProps = verbProps
                break
        }
        return props
    }, [nounProps, verbProps, wordProps, tags])

    const submit = useCallback(async () => {
        try {
            // Validate the form data before submission
            const validation = word ? validate(UpdateWordRequestSchema, { ...submitProps, wordId: word.wordId }) : validate(CreateWordRequestSchema, submitProps)

            if (!validation.isValid) {
                error(`Validation failed: ${validation.errors?.[0] || 'Unknown validation error'}`)
                return
            }

            const result = word ? await request.put('/words', { ...submitProps, wordId: word.wordId }) : await request.post('/words', submitProps)

            success(`successfully ${word ? 'edited' : 'added'} word: ${submitProps.wordEnglish}`)
            updateWords(result.data)
            onClose()
        } catch (err) {
            error(`error ${word ? 'editing' : 'adding'} word ${submitProps.wordEnglish}: ${err instanceof Error ? err.message : 'Unknown error'}`)
        }
    }, [submitProps, word, updateWords, onClose])

    return (
        <Dialog title={`${word ? 'Edit' : 'New'}  Word`} submitLabel="Submit" open={open} onClose={onClose} onSubmit={submit}>
            <Stack spacing={1}>
                <WordForm wordProps={wordProps} setWordProps={setWordProps} changeSpeechPart={changeSpeechPart} />
                {wordProps.wordSpeechPart === PARTS_OF_SPEECH.NOUN && <NounForm nounProps={nounProps} setNounProps={setNounProps} />}
                {wordProps.wordSpeechPart === PARTS_OF_SPEECH.VERB && <VerbForm verbProps={verbProps} setVerbProps={setVerbProps} />}
                <TagList selectedTags={tags} setSelectedTags={setTags} />
            </Stack>
        </Dialog>
    )
}

export default WordFormDialog
