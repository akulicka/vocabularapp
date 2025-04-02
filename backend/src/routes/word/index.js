import {Router} from "express";
import { v4 as uuidv4 } from "uuid";
import map from 'lodash/map.js'

import { PARTS_OF_SPEECH } from "../../enum/word.js";
import { verifycookie } from "../../util/cookie.js";
import db from '../../../db/models/index.cjs';
// import multer from 'multer';

// const upload = multer()
const word_router = Router()

word_router.get("/", [verifycookie], async(req, res) => {
    try{
        const words = await db.words.findAll()
        const results = await Promise.all(map(words, async(word_record) => {
            const word = word_record.dataValues
            const wordtag_records = await db.tagwords.findAll({where: {wordId : word.wordId }})
            if (wordtag_records){
                const wordtags = map(wordtag_records, (wordtag_record) => wordtag_record.tagId)
                const tags = await db.tags.findAll({where: {tagId : wordtags}})
                word.tags = tags
            }else{
                word.tags = []
            }
            switch(word.partOfSpeech){
                case PARTS_OF_SPEECH.NOUN:
                    word.noun = await db.nouns.findOne({where : {wordId: word.wordId} })
                    break
                case PARTS_OF_SPEECH.VERB:
                    word.verb = await db.verbs.findOne({where : {wordId: word.wordId} })
                    break
            }
            return Promise.resolve(word)
        }))
        res.send(results)
    }catch(err){
        console.log('err', err.message)
        res.status(500).send(err.message)
    }
})

word_router.post("/", [verifycookie], async(req, res) => {
    const transaction = await db.sequelize.transaction()
    try{
        const {userId} = req.query.user
        const {wordEnglish, wordArabic, wordSpeechPart, wordTags} = req.body
        const wordId = uuidv4()
        const word = db.words.build({wordId, english: wordEnglish, arabic: wordArabic, partOfSpeech: wordSpeechPart, createdBy: userId })
        await word.save({transaction})
        switch(wordSpeechPart){
            case PARTS_OF_SPEECH.NOUN:
                const {nounProps} = req.body
                const {nounType, nounGender, nounBrokenPlural} = nounProps
                const noun = db.nouns.build({wordId, nounType, gender: nounGender, brokenPlural: nounBrokenPlural })
                await noun.save({transaction})

                break
            case PARTS_OF_SPEECH.VERB:
                const {verbProps} = req.body
                const {verbForm, verbIrregularity, verbTense} = verbProps
                const verb = db.verbs.build({wordId, verbForm, irregularityClass: verbIrregularity, tense: verbTense })
                await verb.save({transaction})
                break
        }
        //test with one garbage tagId to error out correctly
        const tags = await db.tags.findAll({attributes: ['tagId', 'tagName'], where: {tagId : wordTags }}) 
        const tagwords = map(tags, (tag) => db.tagwords.build({tagId: tag.tagId, wordId: word.wordId}))
        await Promise.all(map(tagwords, async(tagword) => await tagword.save({transaction})))
        await transaction.commit()
        switch(wordSpeechPart){
            case PARTS_OF_SPEECH.NOUN:
                const noun = await db.nouns.findOne({where: {wordId}})
                res.send({...word.dataValues, tags, noun})
                break
            case PARTS_OF_SPEECH.VERB:
                const verb = await db.verbs.findOne({where: {wordId}})
                res.send({...word.dataValues, tags, verb})
                break
            default:
                res.send({...word.dataValues, tags})
        }
    }catch(err){
        await transaction.rollback()
        console.log('err', err.message)
        res.status(500).send(err.message)
    }
});

word_router.put("/", [verifycookie], async(req, res) => {
    const transaction = await db.sequelize.transaction()
    try{

        const {wordId, wordEnglish, wordArabic, wordSpeechPart, wordTags} = req.body
        const word = await db.words.findOne({where: {wordId}})
        if(!word) throw new Error('word not found')
        switch(wordSpeechPart){
            case PARTS_OF_SPEECH.NOUN:
                const {nounProps} = req.body
                const {nounType, nounGender, nounBrokenPlural} = nounProps
                if(!nounProps) throw new Error('nounprops not provided')
                let noun
                console.log('switch word.partOfSpeech', word)
                console.log('switch word.partOfSpeech', word.partOfSpeech)
                switch(word.partOfSpeech){
                    case PARTS_OF_SPEECH.NOUN:
                        noun = await db.nouns.findOne({where: {wordId}})
                        if(!noun){
                            console.log('no noun record')
                            noun = db.nouns.build({wordId, nounType, gender: nounGender, brokenPlural: nounBrokenPlural })
                            break
                        }else{
                            console.log('found noun record')
                            noun.gender = nounGender
                            noun.nounType = nounType
                            noun.brokenPlural = nounBrokenPlural
                            break
                        }
                    case PARTS_OF_SPEECH.VERB:
                        const old_verbdef = await db.verbs.findOne({where: {wordId}})
                        await old_verbdef.destroy({transaction})
                        //no break
                    default:
                        noun = db.nouns.build({wordId, nounType, gender: nounGender, brokenPlural: nounBrokenPlural })
                        break
                }
                await noun.save({transaction})
                break
            case PARTS_OF_SPEECH.VERB:
                const {verbProps} = req.body
                if(!verbProps) throw new Error('verbprops not provided')
                const {verbForm, verbIrregularity, verbTense} = verbProps
                let verb
                switch(word.partOfSpeech){
                    case PARTS_OF_SPEECH.VERB:
                        verb = await db.verbs.findOne({where: {wordId}})
                        if(!verb){
                            verb = db.verbs.build({wordId, verbForm, irregularityClass: verbIrregularity, tense: verbTense })
                            break
                        }
                        verb.irregularityClass = verbIrregularity
                        verb.verbForm = verbForm
                        verb.tense = verbTense
                        break
                    case PARTS_OF_SPEECH.NOUN:
                        const old_noundef = await db.nouns.findOne({where: {wordId}})
                        await old_noundef.destroy({transaction})
                        //no break
                    default:
                        verb = db.verbs.build({wordId, verbForm, irregularityClass: verbIrregularity, tense: verbTense })
                        break
                }
                await verb.save({transaction})
                break
            default: 
                switch(word.partOfSpeech){
                    case PARTS_OF_SPEECH.NOUN:
                        const old_noundef = await db.nouns.findOne({where: {wordId}})
                        await old_noundef.destroy({transaction})
                        break
                    case PARTS_OF_SPEECH.VERB:
                        const old_verbdef = await db.verbs.findOne({where: {wordId}})
                        await old_verbdef.destroy({transaction})
                        break
                }
        }
        const old_wordtag_records = await db.tagwords.findAll({where: {wordId : word.wordId }})
        await Promise.all(map(old_wordtag_records, async(old_wordtag_record) => await old_wordtag_record.destroy({transaction})))
        const tags = await db.tags.findAll({attributes: ['tagId', 'tagName'], where: {tagId : wordTags }})
        const tagwords = map(tags, (tag) => db.tagwords.build({tagId: tag.tagId, wordId: word.wordId}))
        await Promise.all(map(tagwords, async(tagword) => await tagword.save({transaction})))
        word.english = wordEnglish
        word.arabic = wordArabic
        word.partOfSpeech = wordSpeechPart
        await word.save({transaction})
        await transaction.commit()
        switch(wordSpeechPart){
            case PARTS_OF_SPEECH.NOUN:
                const noun = await db.nouns.findOne({where: {wordId}})
                res.send({...word.dataValues, tags, noun})
                break
            case PARTS_OF_SPEECH.VERB:
                const verb = await db.verbs.findOne({where: {wordId}})
                res.send({...word.dataValues, tags, verb})
                break
            default:
                res.send({...word.dataValues, tags})
        }
    }catch(err){
        await transaction.rollback()
        console.log('err', err.message)
        res.status(500).send(err.message)
    }
});


word_router.delete("/", [verifycookie], async(req, res) => {
    const transaction = await db.sequelize.transaction()
    try{
        const {wordId} = req.query
        const word = await db.words.findOne({where : {wordId}})
        if(!word) throw new Error('word does not exist')
        switch(word.partOfSpeech){
            case PARTS_OF_SPEECH.NOUN:
                const old_noundef = await db.nouns.findOne({where: {wordId}})
                await old_noundef.destroy({transaction})
                break
            case PARTS_OF_SPEECH.VERB:
                const old_verbdef = await db.verbs.findOne({where: {wordId}})
                await old_verbdef.destroy({transaction})
                break
        }
        const tagwords = await db.tagwords.findAll({where: {wordId : word.wordId }})
        await Promise.all(map(tagwords, async(tagword) => await tagword.destroy({transaction})))
        await word.destroy({transaction})
        await transaction.commit()
        res.sendStatus(200)
    }catch(err){
        await transaction.rollback()
        console.log('err', err.message)
        res.status(500).send(err.message)
    }
});

word_router.post("/tag", [verifycookie], async(req, res) => {
    try{
        const {userId} = req.query.user
        const {tagName} = req.body
        let tagId = uuidv4()
        let idExists = true
        const nameExists = await db.tags.findOne({where : {tagName}})
        if(nameExists) throw new Error('duplicate tag name')
        while(idExists) {
            const foundId = await db.tags.findOne({where : {tagId}})
            foundId ? tagId = uuidv4() : idExists = false
        }
        const tag = db.tags.build({tagId, tagName, createdBy: userId})
        await tag.save()
        res.send(tag)
    }catch(err){
        console.log('err', err.message)
        res.status(500).send(err.message)
    }
});

word_router.delete("/tag", [verifycookie], async(req, res) => {
    const transaction = await db.sequelize.transaction()
    try{
        const {tagId} = req.query
        const tag = await db.tags.findOne({where : {tagId}})
        if(!tag) throw new Error('tag does not exist') 
        const tagwords = await db.tagwords.findAll({where : {tagId}})
        await Promise.all(map(tagwords, async(tagword) => await tagword.destroy({transaction})))
        await tag.destroy({transaction})
        await transaction.commit()
        res.sendStatus(200)
    }catch(err){
        await transaction.rollback()
        console.log('err', err.message)
        res.status(500).send(err.message)
    }
});

word_router.put("/tag", [verifycookie], async(req, res) => {
    try{
        const {tagId, tagName} = req.body
        const tag = await db.tags.findOne({where : {tagId}})
        if(!tag) throw new Error('tag does not exist')
        tag.tagName = tagName
        await tag.save()
        res.send(tag)
    }catch(err){
        console.log('err', err.message)
        res.status(500).send(err.message)
    }
});

word_router.get("/tag", [verifycookie], async(req, res) => {
    try{
        const {tagId} = req.query
        if(!tag) throw new Error('tag does not exist') 
        const tag = await db.tags.findOne({where : {tagId}})
        console.log(tag)
        res.send(tag)
    }catch(err){
        console.log('err', err.message)
        res.status(500).send(err.message)
    }
});

word_router.get("/tags", [verifycookie], async(req, res) => {
    try{
        const tags = await db.tags.findAll()
        res.send(tags)
    }catch(err){
        console.log('err', err.message)
        res.status(500).send(err.message)
    }
});

export default word_router