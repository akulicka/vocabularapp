import { v4 as uuidv4 } from 'uuid'
import { PARTS_OF_SPEECH } from '../enum/word.js'
import db from '../../db/models/index.js'
import { CreateWordRequest, UpdateWordRequest, WordDTO } from '../types/word.js'
import { withTransaction } from './helpers/transaction.js'
import { mapToWordDTO } from './helpers/mapper.js'

export async function getAllWords(): Promise<WordDTO[]> {
    const words = await db.words.findAll({
        include: [{ model: db.nouns }, { model: db.verbs }, { model: db.tags, through: { attributes: [] } }],
        benchmark: true,
    })
    return words.map(mapToWordDTO)
}

export async function createWord(data: CreateWordRequest, userId: string): Promise<WordDTO> {
    return withTransaction(async (transaction) => {
        const wordId = uuidv4()
        const word = await createBaseWord(wordId, data, userId, transaction)
        await createPartOfSpeechExtension(word, data, transaction)
        await word.setTags(data.wordTags, { transaction })

        return await fetchCompleteWord(wordId)
    })
}

export async function updateWord(wordId: string, data: UpdateWordRequest): Promise<WordDTO> {
    return withTransaction(async (transaction) => {
        const word = await db.words.findOne({ where: { wordId } })
        if (!word) throw new Error('word not found')

        let verb = await word.getVerb()
        let noun = await word.getNoun()

        switch (data.wordSpeechPart) {
            case PARTS_OF_SPEECH.NOUN:
                if (verb) {
                    await verb.destroy({ transaction })
                    verb = null as any
                }
                const { nounProps } = data
                if (!nounProps) throw new Error('nounprops not provided')
                const { nounType, nounGender, nounBrokenPlural } = nounProps
                if (!noun) {
                    noun = await word.createNoun({ wordId, nounType, gender: nounGender, brokenPlural: nounBrokenPlural }, { transaction })
                } else {
                    noun.set('gender', nounGender)
                    noun.set('nounType', nounType)
                    noun.set('brokenPlural', nounBrokenPlural)
                    await noun.save({ transaction })
                }
                break
            case PARTS_OF_SPEECH.VERB:
                if (noun) {
                    await noun.destroy({ transaction })
                    noun = null as any
                }
                const { verbProps } = data
                if (!verbProps) throw new Error('verbprops not provided')
                const { verbForm, verbIrregularity, verbTense } = verbProps
                if (!verb) {
                    verb = await word.createVerb({ wordId, verbForm, irregularityClass: verbIrregularity, tense: verbTense }, { transaction })
                } else {
                    verb.set('irregularityClass', verbIrregularity)
                    verb.set('verbForm', verbForm)
                    verb.set('tense', verbTense)
                    await verb.save({ transaction })
                }
                break
            default:
                if (verb) await verb.destroy({ transaction })
                if (noun) await noun.destroy({ transaction })
        }

        await word.setTags(data.wordTags, { transaction })
        word.english = data.wordEnglish
        word.arabic = data.wordArabic
        word.partOfSpeech = data.wordSpeechPart
        await word.save({ transaction })

        return await fetchCompleteWord(wordId)
    })
}

export async function deleteWord(wordId: string): Promise<void> {
    return withTransaction(async (transaction) => {
        const word = await db.words.findOne({ where: { wordId } })
        if (!word) throw new Error('word does not exist')

        const noun = await word.getNoun()
        if (noun) await noun.destroy({ transaction })

        const verb = await word.getVerb()
        if (verb) await verb.destroy({ transaction })

        await word.setTags([], { transaction })
        await word.destroy({ transaction })
    })
}

// Private helpers
async function createBaseWord(wordId: string, data: CreateWordRequest, userId: string, transaction: any) {
    const word = db.words.build({
        wordId,
        english: data.wordEnglish,
        arabic: data.wordArabic,
        partOfSpeech: data.wordSpeechPart,
        createdBy: userId,
    })
    await word.save({ transaction })
    return word
}

async function createPartOfSpeechExtension(word: any, data: CreateWordRequest, transaction: any) {
    switch (data.wordSpeechPart) {
        case PARTS_OF_SPEECH.NOUN:
            const { nounProps } = data
            if (!nounProps) throw new Error('nounProps not provided')
            const { nounType, nounGender, nounBrokenPlural } = nounProps
            return await word.createNoun(
                {
                    wordId: word.wordId,
                    nounType,
                    gender: nounGender,
                    brokenPlural: nounBrokenPlural,
                },
                { transaction },
            )

        case PARTS_OF_SPEECH.VERB:
            const { verbProps } = data
            if (!verbProps) throw new Error('verbProps not provided')
            const { verbForm, verbIrregularity, verbTense } = verbProps
            return await word.createVerb(
                {
                    wordId: word.wordId,
                    verbForm,
                    irregularityClass: verbIrregularity,
                    tense: verbTense,
                },
                { transaction },
            )
    }
}

async function fetchCompleteWord(wordId: string): Promise<WordDTO> {
    const word = await db.words.findOne({
        where: { wordId },
        include: [
            { model: db.nouns, required: false },
            { model: db.verbs, required: false },
            { model: db.tags, through: { attributes: [] } },
        ],
    })

    if (!word) throw new Error('word not found')
    return mapToWordDTO(word)
}
