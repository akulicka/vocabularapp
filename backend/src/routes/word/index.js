import {Router} from "express";
import { v4 as uuidv4 } from "uuid";
import { verifycookie } from "../../util/cookie.js";
import { PARTS_OF_SPEECH } from "../../enum/word.js";
import db from '../../../db/models/index.cjs';
// import multer from 'multer';

// const upload = multer()
const word_router = Router()

word_router.post("/", [verifycookie], async(req, res) => {
    try{
        console.log(req.body)
        const {userId} = req.query.user
        const {wordEnglish, wordArabic, wordSpeechPart} = req.body
        const wordId = uuidv4()
        const word = db.words.build({wordId, english: wordEnglish, arabic: wordArabic, partOfSpeech: wordSpeechPart, createdBy: userId })
        switch(wordSpeechPart){
            case PARTS_OF_SPEECH.NOUN:
                const {nounProps} = req.body
                const {nounType, nounGender, nounBrokenPlural} = nounProps
                const noun = db.nouns.build({wordId, nounType, gender: nounGender, brokenPlural: nounBrokenPlural })
                await word.save()
                await noun.save()
                word.noun = noun
                break
            case PARTS_OF_SPEECH.VERB:
                const {verbProps} = req.body
                const {verbForm, verbIrregularity, verbTense} = verbProps
                const verb = db.verbs.build({wordId, verbForm, irregularityClass: verbIrregularity, tense: verbTense })
                await word.save()
                await verb.save()
                word.verb = verb
                break
            default:
                await word.save()
        }
        res.send({word})
    }catch(err){
        console.log('err', err.message)
        res.sendStatus(500)
    }
});


export default word_router