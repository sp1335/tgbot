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
    async orderAbility(uid) {
        const query = `SELECT * FROM users WHERE id = $1`
        const res = await pool.query(query, [uid])
        if (res.rowCount > 0) {
            const user = res.rows[0]
            const phone_number = user.phone_number
            const ignoreState = user.ignor_period
            console.log(phone_number)
            if (phone_number !== undefined || phone_number !== null || phone_number !== "") {
                const phone_regex = /^(?:(?:\+|00)48|0)?[1-9][0-9]{8}$/
                const match = phone_number.match(phone_regex)
                if (!match) {
                    return { status: 1002, message: 'Invalid phone number' }
                } else {
                    if (ignoreState !== null) {
                        return { stastus: 403, message: 'Forbidden' }
                    } else {
                        return { status: 200, message: 'OK' }
                    }
                }
            } else {
                return { status: 1001, message: 'No phone number provided' }
            }
        }
        return { status: 1003, message: 'User verification error. Go to /start...' }
    }
}

module.exports = new UserService()