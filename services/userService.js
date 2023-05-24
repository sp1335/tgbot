const pool = require('../dbPool');

class UserService {
    async getUid(tid) {
        const query = `SELECT id FROM users WHERE telegram_id = $1`
        try {
            const uid = (await pool.query(query, [tid])).rows[0]
            return uid
        } catch (error) {
            return { status: 500, message: 'Unknown user error' }
        }
    }
}

module.exports = new UserService()