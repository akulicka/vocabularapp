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

import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";
import MenuItem from "@mui/material/MenuItem";
import map from 'lodash/map'


const INITIAL_NOUN_PROPS = {
    nounType : TYPES_OF_NOUN.DEFINITE_NOUN,
    nounGender : GENDERS.MALE,
    nounBrokenPlural: ""
}
const INITIAL_VERB_PROPS = {
    verbIrregularity : IRREGULARITIES_OF_VERB.REGULAR,
    verbForm : FORMS_OF_VERB.I,
    verbTense: TENSES_OF_VERB.PAST
}
// todo: root, img
const INITIAL_WORD_PROPS = {
    wordEnglish : "",
    wordArabic: "",
    wordSpeechPart : PARTS_OF_SPEECH.NOUN,
}

function NounForm({nounProps, setNounProps}) {
    
    return (
        <Stack fullwidth spacing={1}>
            <Stack fullwidth spacing={1} direction='row'>
            <Select id='nounType' fullWidth value={nounProps.nounType} onChange={(e) => setNounProps({...nounProps, nounType: e.target.value})}>
                {map(TYPES_OF_NOUN, (type) => <MenuItem value={type} > {type.toLowerCase().replace('_', ' ')} </MenuItem> )}
            </Select>
            <Box width='25%'>
                <RadioGroup id='nounGender' value={nounProps.nounGender} onChange={(e) => setNounProps({...nounProps, nounGender: e.target.value})}>
                    <Stack direction={'row'} >
                        <Radio value={GENDERS.MALE}/>
                        <Typography alignContent={'center'} alignItems={'center'}> Male </Typography>
                    </Stack>
                    <Stack direction={'row'} >
                        <Radio value={GENDERS.FEMALE}/>
                        <Typography alignContent={'center'} alignItems={'center'}> Female </Typography>
                    </Stack>
                </RadioGroup>
            </Box>
            </Stack>
            <TextField id='nounBrokenPlural' fullWidth placeholder="Broken Plural" value={nounProps.nounBrokenPlural} onChange={(e) => setNounProps({...nounProps, nounBrokenPlural: e.target.value})} />
        </Stack>
    )
}

function VerbForm({verbProps, setVerbProps}) {
    return (
        <Stack fullwidth spacing={1} direction='row'>
            <Select id='verbIrregularity' fullWidth value={verbProps.verbIrregularity} onChange={(e) => setVerbProps({...verbProps, verbIrregularity: e.target.value})}>
                {map(IRREGULARITIES_OF_VERB, (irregularity) => <MenuItem value={irregularity} > {irregularity.toLowerCase()} </MenuItem> )}
            </Select>
            <Select id='verbForm' fullWidth value={verbProps.verbForm} onChange={(e) => setVerbProps({...verbProps, verbForm: e.target.value})}>
                {map(FORMS_OF_VERB, (form) => <MenuItem value={form} > {form} </MenuItem> )}
            </Select>
            <Box width='25%'>
                <RadioGroup id='verbTense' value={verbProps.verbTense} onChange={(e) => setVerbProps({...verbProps, verbTense: e.target.value})}>
                    <Stack direction={'row'} >
                        <Radio value={TENSES_OF_VERB.PAST}/>
                        <Typography alignContent={'center'} alignItems={'center'}> Past </Typography>
                    </Stack>
                    <Stack  direction={'row'}  >
                        <Radio value={TENSES_OF_VERB.PRESENT}/>
                        <Typography alignContent={'center'}> Present </Typography>
                    </Stack>
                </RadioGroup>
            </Box>
        </Stack>
    )
}

function Dictionary() {
    const [nounProps, setNounProps] = useState(INITIAL_NOUN_PROPS)
    const [verbProps, setVerbProps] = useState(INITIAL_VERB_PROPS)
    const [wordProps, setWordProps] = useState(INITIAL_WORD_PROPS)
    const navigate = useNavigate();

    const submit = useCallback(async() => {
        try{
            let props;
            switch (wordProps.wordSpeechPart){
                case PARTS_OF_SPEECH.NOUN:
                    props = {...wordProps, nounProps}
                    break;
                case PARTS_OF_SPEECH.VERB:
                    props = {...wordProps, verbProps}
                    break;
                default:
                    props = {...wordProps}
            }
            console.log('submit props', props)
            const result = await request.post('/words', props)
            console.log(result)
            success('successfully added word: ', wordProps.wordEnglish)

        }
        catch(err){
            error('error posting word: ', err.message)
        }
    }, [nounProps, verbProps, wordProps])

    const changeSpeechPart = (wordSpeechPart) => {
        switch (wordSpeechPart){
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
        setWordProps({...wordProps, wordSpeechPart})
    }

    useEffect(() => console.log('wordProps', wordProps), [wordProps])
    useEffect(() => console.log('nounProps', nounProps), [nounProps])
    useEffect(() => console.log('verbProps', verbProps), [verbProps])

    return (
        <Stack width='100%' spacing={1} flexGrow={1}>
            <Typography textAlign={'center'} variant={"h1"}>Dictionary</Typography>
            <Typography textAlign={'left'} variant={"h6"}>New Word:</Typography>
            <Stack spacing={1} width='100%' flexGrow={'inherit'}  direction={'row'}>
                <TextField fullWidth placeholder="English" id='wordEnglish' value={wordProps.wordEnglish} onChange={(e) => setWordProps({...wordProps, wordEnglish: e.target.value})} /> 
                <TextField fullWidth placeholder="Arabic" id='wordArabic'  value={wordProps.wordArabic} onChange={(e) => setWordProps({...wordProps, wordArabic: e.target.value})} /> 
            </Stack>
            <Select value={wordProps.wordSpeechPart} id='wordSpeechPart' onChange={(e) => changeSpeechPart(e.target.value)}>
                {map(PARTS_OF_SPEECH, (part) => <MenuItem value={part} > {part.toLowerCase()} </MenuItem> )}
            </Select>
            {wordProps.wordSpeechPart === PARTS_OF_SPEECH.NOUN && <NounForm nounProps={nounProps} setNounProps={setNounProps}/>}
            {wordProps.wordSpeechPart === PARTS_OF_SPEECH.VERB && <VerbForm verbProps={verbProps} setVerbProps={setVerbProps}/>}
            <Stack spacing={1} width='100%' direction={'row'}>
                <Button fullWidth variant={'contained'} onClick={submit}> 
                    <Typography  variant={"h6"}>
                        Submit 
                    </Typography>
                </Button>
                <Button fullWidth variant={'contained'} onClick={() => navigate('/')}>
                    <Typography variant={"h6"}>
                        back
                    </Typography>
                </Button>
            </Stack>
        </Stack>
    )
}
export default Dictionary