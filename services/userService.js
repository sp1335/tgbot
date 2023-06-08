const pool = require('../dbPool');

class UserService {
    async getUid(tid) {
        const query = `SELECT id FROM users WHERE telegram_id = $1`
        const response = (await pool.query(query, [tid])).rows[0]
        try {
            return response.id
        } catch (error) {
            return { status: 500, message: 'Unknown user error' }
        }
    }
}

module.exports = new UserService()