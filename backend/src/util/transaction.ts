import db from '@db/models/index.js'

export async function withTransaction<T>(callback: (transaction: any) => Promise<T>): Promise<T> {
    const transaction = await db.sequelize.transaction()
    try {
        const result = await callback(transaction)
        await transaction.commit()
        return result
    } catch (err) {
        await transaction.rollback()
        throw err
    }
}
