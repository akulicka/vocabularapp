import { Sequelize } from 'sequelize'
import config from '../config/config.js'

const env = process.env.NODE_ENV || 'development'
const dbConfig = config[env as keyof typeof config]

let sequelize: Sequelize
sequelize = new Sequelize(dbConfig.database || 'vocabular', dbConfig.username || 'root', dbConfig.password || '', {
    ...dbConfig,
    dialect: 'mysql' as const,
})

// Import model factories and types
import userFactory, { UserModel, UserInstance } from './user.js'
import tagFactory, { TagModel, TagInstance } from './tag.js'
import wordFactory, { WordModel, WordInstance } from './word.js'
import nounFactory, { NounModel, NounInstance } from './noun.js'
import verbFactory, { VerbModel, VerbInstance } from './verb.js'
import tokenFactory, { TokenModel, TokenInstance } from './token.js'
import quizFactory, { QuizModel, QuizInstance } from './quiz.js'
import answerFactory, { AnswerModel, AnswerInstance } from './answer.js'

// Initialize models with explicit type annotations
const User: UserModel = userFactory(sequelize)
const Tag: TagModel = tagFactory(sequelize)
const Word: WordModel = wordFactory(sequelize)
const Noun: NounModel = nounFactory(sequelize)
const Verb: VerbModel = verbFactory(sequelize)
const Token: TokenModel = tokenFactory(sequelize)
const Quiz: QuizModel = quizFactory(sequelize)
const Answer: AnswerModel = answerFactory(sequelize)

// Create a database interface that provides type inference for build() method
interface Database {
    sequelize: Sequelize
    Sequelize: typeof Sequelize
    users: typeof User
    tags: typeof Tag
    words: typeof Word
    nouns: typeof Noun
    verbs: typeof Verb
    tokens: typeof Token
    quizzes: typeof Quiz
    answers: typeof Answer
}

const db: Database = {
    sequelize,
    Sequelize,
    users: User,
    tags: Tag,
    words: Word,
    nouns: Noun,
    verbs: Verb,
    tokens: Token,
    quizzes: Quiz,
    answers: Answer,
}

// Set up associations
User.associate(db)
Tag.associate(db)
Word.associate(db)
Noun.associate(db)
Verb.associate(db)
Token.associate(db)
Quiz.associate(db)
Answer.associate(db)
// Object.keys(db).forEach((modelName) => {
//     const model = (db as any)[modelName]
//     if (model && typeof model === 'object' && 'associate' in model && typeof model.associate === 'function') {
//         model.associate(db)
//     }
// })
// Export instance types for proper typing in services
export type { UserInstance, TagInstance, WordInstance, NounInstance, VerbInstance, TokenInstance, QuizInstance, AnswerInstance }

export default db
