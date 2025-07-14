import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'

import { PARTS_OF_SPEECH } from '../../enum/word.js'
import { verifycookie } from '../../util/cookie.js'
import db from '../../../db/models/index.cjs'
// import multer from 'multer';

// const upload = multer()
const word_router = Router()

word_router.get('/', [verifycookie], async (req, res) => {
    try {
        const nouns = await db.words.findAll({
            where: { partOfSpeech: PARTS_OF_SPEECH.NOUN },
            include: [{ model: db.nouns }, { model: db.tags, through: { attributes: [] } }],
            benchmark: true,
        })
        const verbs = await db.words.findAll({
            where: { partOfSpeech: PARTS_OF_SPEECH.VERB },
            include: [{ model: db.verbs }, { model: db.tags, through: { attributes: [] } }],
            benchmark: true,
        })
        const particles = await db.words.findAll({
            where: { partOfSpeech: PARTS_OF_SPEECH.PARTICLE },
            include: [{ model: db.tags, through: { attributes: [] } }],
            benchmark: true,
        })
        res.send([...nouns, ...verbs, ...particles])
    } catch (err) {
        console.log('err', err.message)
        res.status(500).send(err.message)
    }
})

word_router.post('/', [verifycookie], async (req, res) => {
    const transaction = await db.sequelize.transaction()
    try {
        const { userId } = req.query.user
        const { wordEnglish, wordArabic, wordSpeechPart, wordTags } = req.body
        const wordId = uuidv4()
        const word = db.words.build({ wordId, english: wordEnglish, arabic: wordArabic, partOfSpeech: wordSpeechPart, createdBy: userId })
        await word.save({ transaction })
        let verb
        let noun
        switch (wordSpeechPart) {
            case PARTS_OF_SPEECH.NOUN:
                const { nounProps } = req.body
                const { nounType, nounGender, nounBrokenPlural } = nounProps
                noun = await word.createNoun({ wordId, nounType, gender: nounGender, brokenPlural: nounBrokenPlural }, { transaction })
                break
            case PARTS_OF_SPEECH.VERB:
                const { verbProps } = req.body
                const { verbForm, verbIrregularity, verbTense } = verbProps
                verb = await word.createVerb({ wordId, verbForm, irregularityClass: verbIrregularity, tense: verbTense }, { transaction })
                break
        }
        await word.setTags(wordTags, { transaction })
        await transaction.commit()

        const tags = await word.getTags({ joinTableAttributes: [] })
        const result = { ...word.dataValues, tags }
        if (noun) result.noun = noun
        if (verb) result.verb = verb
        res.send(result)
    } catch (err) {
        await transaction.rollback()
        console.log('err', err.message)
        res.status(500).send(err.message)
    }
})

word_router.put('/', [verifycookie], async (req, res) => {
    const transaction = await db.sequelize.transaction()
    try {
        const { wordId, wordEnglish, wordArabic, wordSpeechPart, wordTags } = req.body
        const word = await db.words.findOne({ where: { wordId } })
        if (!word) throw new Error('word not found')
        let verb = await word.getVerb()
        let noun = await word.getNoun()

        switch (wordSpeechPart) {
            case PARTS_OF_SPEECH.NOUN:
                if (verb) {
                    await verb.destroy({ transaction })
                    verb = null
                }
                const { nounProps } = req.body
                if (!nounProps) throw new Error('nounprops not provided')
                const { nounType, nounGender, nounBrokenPlural } = nounProps
                if (!noun) {
                    noun = await word.createNoun({ wordId, nounType, gender: nounGender, brokenPlural: nounBrokenPlural }, { transaction })
                } else {
                    noun.gender = nounGender
                    noun.nounType = nounType
                    noun.brokenPlural = nounBrokenPlural
                    await noun.save({ transaction })
                }
                break
            case PARTS_OF_SPEECH.VERB:
                if (noun) {
                    noun = await noun.destroy({ transaction })
                    noun = null
                }
                const { verbProps } = req.body
                if (!verbProps) throw new Error('verbprops not provided')
                const { verbForm, verbIrregularity, verbTense } = verbProps
                if (!verb) {
                    verb = await word.createVerb({ wordId, verbForm, irregularityClass: verbIrregularity, tense: verbTense }, { transaction })
                } else {
                    verb.irregularityClass = verbIrregularity
                    verb.verbForm = verbForm
                    verb.tense = verbTense
                    await verb.save({ transaction })
                }
                break
            default:
                if (verb) await verb.destroy({ transaction })
                if (noun) await noun.destroy({ transaction })
        }
        await word.setTags(wordTags, { transaction })
        word.english = wordEnglish
        word.arabic = wordArabic
        word.partOfSpeech = wordSpeechPart
        await word.save({ transaction })
        await transaction.commit()
        const tags = await word.getTags({ joinTableAttributes: [] })
        const result = { ...word.dataValues, tags }
        if (noun) result.noun = noun
        if (verb) result.verb = verb
        res.send(result)
    } catch (err) {
        await transaction.rollback()
        console.log('err', err.message)
        res.status(500).send(err.message)
    }
})

word_router.delete('/', [verifycookie], async (req, res) => {
    const transaction = await db.sequelize.transaction()
    try {
        const { wordId } = req.query
        const word = await db.words.findOne({ where: { wordId } })
        if (!word) throw new Error('word does not exist')
        const noun = await word.getNoun()
        if (noun) await noun.destroy({ transaction })
        const verb = await word.getVerb()
        if (verb) await verb.destroy({ transaction })
        await word.setTags([], { transaction })
        await word.destroy({ transaction })
        await transaction.commit()
        res.sendStatus(200)
    } catch (err) {
        await transaction.rollback()
        console.log('err', err.message)
        res.status(500).send(err.message)
    }
})

word_router.post('/tag', [verifycookie], async (req, res) => {
    try {
        const { userId } = req.query.user
        const { tagName } = req.body
        let tagId = uuidv4()
        let idExists = true
        const nameExists = await db.tags.findOne({ where: { tagName } })
        if (nameExists) throw new Error('duplicate tag name')
        while (idExists) {
            const foundId = await db.tags.findOne({ where: { tagId } })
            foundId ? (tagId = uuidv4()) : (idExists = false)
        }
        const tag = db.tags.build({ tagId, tagName, createdBy: userId })
        await tag.save()
        res.send(tag)
    } catch (err) {
        console.log('err', err.message)
        res.status(500).send(err.message)
    }
})

word_router.delete('/tag', [verifycookie], async (req, res) => {
    // TODO - on frontend, need to refresh word tags - delete will not be reflected for other words in dictionary until refresh
    const transaction = await db.sequelize.transaction()
    try {
        const { tagId } = req.query
        const tag = await db.tags.findOne({ where: { tagId } })
        if (!tag) throw new Error('tag does not exist')
        await tag.setWords([], { transaction })
        await tag.destroy({ transaction })
        await transaction.commit()
        res.sendStatus(200)
    } catch (err) {
        await transaction.rollback()
        console.log('err', err.message)
        res.status(500).send(err.message)
    }
})

word_router.put('/tag', [verifycookie], async (req, res) => {
    try {
        const { tagId, tagName } = req.body
        const tag = await db.tags.findOne({ where: { tagId } })
        if (!tag) throw new Error('tag does not exist')
        tag.tagName = tagName
        await tag.save()
        res.send(tag)
    } catch (err) {
        console.log('err', err.message)
        res.status(500).send(err.message)
    }
})

word_router.get('/tag', [verifycookie], async (req, res) => {
    try {
        const { tagId } = req.query
        if (!tag) throw new Error('tag does not exist')
        const tag = await db.tags.findOne({ where: { tagId } })
        console.log(tag)
        res.send(tag)
    } catch (err) {
        console.log('err', err.message)
        res.status(500).send(err.message)
    }
})

word_router.get('/tags', [verifycookie], async (req, res) => {
    try {
        const tags = await db.tags.findAll()
        res.send(tags)
    } catch (err) {
        console.log('err', err.message)
        res.status(500).send(err.message)
    }
})

export default word_router
