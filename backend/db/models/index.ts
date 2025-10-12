import { Sequelize } from 'sequelize'
import config from '../config/config'

const env = process.env.NODE_ENV || 'development'
const dbConfig = config[env as keyof typeof config]

let sequelize: Sequelize
sequelize = new Sequelize(dbConfig.database || 'vocabular', dbConfig.username || 'root', dbConfig.password || '', {
    ...dbConfig,
    dialect: 'mysql' as const,
})

// Import model factories
import userFactory from './user'
import tagFactory from './tag'
import wordFactory from './word'
import nounFactory from './noun'
import verbFactory from './verb'
import tagWordFactory from './tagword'
import tokenFactory from './token'
import quizResultFactory from './quiz_results'

// Initialize models
const UserModel = (userFactory as any)(sequelize)
const TagModel = tagFactory(sequelize)
const WordModel = wordFactory(sequelize)
const NounModel = nounFactory(sequelize)
const VerbModel = verbFactory(sequelize)
const TagWordModel = tagWordFactory(sequelize)
const TokenModel = tokenFactory(sequelize)
const QuizResultModel = quizResultFactory(sequelize)

const db: any = {
    sequelize,
    Sequelize,
    users: UserModel,
    tags: TagModel,
    words: WordModel,
    nouns: NounModel,
    verbs: VerbModel,
    tagwords: TagWordModel,
    tokens: TokenModel,
    quizResults: QuizResultModel,
}

// Set up associations
Object.keys(db).forEach((modelName) => {
    const model = db[modelName]
    if (model && typeof model === 'object' && 'associate' in model && typeof model.associate === 'function') {
        model.associate(db)
    }
})

export default db
