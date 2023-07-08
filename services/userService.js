const pool = require('../dbPool');
const { phoneNumberValidator } = require('../middlewares/validators')

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
    async insertPhoneNumber(uid, phoneNumber) {
        const match = phoneNumberValidator(phoneNumber)
        if (!match) {
            return { status: 500, message: 'Invalid phone number' }
        } else {
            const query = 'UPDATE users SET phone_number = $1 WHERE id = $2'
            try {
                const insertRes = await pool.query(query, [phoneNumber, uid])
            } catch (error) {
                return { status: 500, message: 'Contact info updating failed' }
            }
            return { status: 200, message: 'Contact info updated successfully' }
        }
    }
    async orderAbility(uid) {
        const query = `SELECT * FROM users WHERE id = $1`
        const res = await pool.query(query, [uid])
        if (res.rowCount > 0) {
            const user = res.rows[0]
            const phone_number = user.phone_number
            const ignoreState = user.ignor_period
            if (phone_number !== undefined || phone_number !== null || phone_number !== "") {
                const match = phoneNumberValidator(phone_number)
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