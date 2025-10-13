import { Sequelize } from 'sequelize'
import config from '../config/config'

const env = process.env.NODE_ENV || 'development'
const dbConfig = config[env as keyof typeof config]

let sequelize: Sequelize
sequelize = new Sequelize(dbConfig.database || 'vocabular', dbConfig.username || 'root', dbConfig.password || '', {
    ...dbConfig,
    dialect: 'mysql' as const,
})

// Import model factories and types
import userFactory, { UserModel } from './user'
import tagFactory, { TagModel } from './tag'
import wordFactory, { WordModel } from './word'
import nounFactory, { NounModel } from './noun'
import verbFactory, { VerbModel } from './verb'
import tokenFactory, { TokenModel } from './token'
import quizResultFactory, { QuizResultModel } from './quiz_results'

// Initialize models with explicit type annotations
const User: UserModel = userFactory(sequelize)
const Tag: TagModel = tagFactory(sequelize)
const Word: WordModel = wordFactory(sequelize)
const Noun: NounModel = nounFactory(sequelize)
const Verb: VerbModel = verbFactory(sequelize)
const Token: TokenModel = tokenFactory(sequelize)
const QuizResult: QuizResultModel = quizResultFactory(sequelize)

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
    quizResults: typeof QuizResult
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
    quizResults: QuizResult,
}

// Set up associations
User.associate(db)
Tag.associate(db)
Word.associate(db)
Noun.associate(db)
Verb.associate(db)
Token.associate(db)
QuizResult.associate(db)
// Object.keys(db).forEach((modelName) => {
//     const model = (db as any)[modelName]
//     if (model && typeof model === 'object' && 'associate' in model && typeof model.associate === 'function') {
//         model.associate(db)
//     }
// })

export default db
