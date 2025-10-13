import { WordDTO } from '../../types/word.js'

export function mapToWordDTO(word: any): WordDTO {
    return {
        wordId: word.wordId,
        english: word.english,
        arabic: word.arabic,
        root: word.root,
        partOfSpeech: word.partOfSpeech,
        img: word.img,
        noun: word.noun || undefined,
        verb: word.verb || undefined,
        tags: word.tags || [],
    }
}
