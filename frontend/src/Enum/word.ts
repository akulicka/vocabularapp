// Re-export enums from shared types for backward compatibility during migration
// This allows existing imports to continue working while we migrate to shared types

import { PARTS_OF_SPEECH, GENDERS, TYPES_OF_NOUN, TENSES_OF_VERB, FORMS_OF_VERB, IRREGULARITIES_OF_VERB, type PartOfSpeech, type Gender, type TypeOfNoun, type TenseOfVerb, type FormOfVerb, type IrregularityOfVerb } from '@vocabularapp/shared-types/dist/types'

// Re-export all enums
export { PARTS_OF_SPEECH, GENDERS, TYPES_OF_NOUN, TENSES_OF_VERB, FORMS_OF_VERB, IRREGULARITIES_OF_VERB }

// Re-export type definitions for better TypeScript support
export type { PartOfSpeech, Gender, TypeOfNoun, TenseOfVerb, FormOfVerb, IrregularityOfVerb }
