const pool = require('../dbPool');
async function identifyUser(uid) {
    const identifyQuery = `
    SELECT * 
    FROM users 
    WHERE telegram_id = $1`
    try {
        const dbResponse = await pool.query(identifyQuery, [uid])
        if (dbResponse.rowCount > 0) {
            const userData = dbResponse.rows[0]
            return { status: 200, data: userData }
        } else {
            const rememberUser = `
            INSERT INTO users (telegram_id, first_name, username, role, phone_number, customer_since) 
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) 
            RETURNING *;`
            console.log(user)
            try {
                const insertRes = await pool.query(rememberUser, [user.id, user.first_name, user.username, 'customer', ''])
                return { status: 201, data: insertRes.rows[0] }
            } catch (error) {
                return { status: 500, message: error }
            }
        }
    } catch (error) {
        return { status: '500', message: error }
    }

}

module.exports = { identifyUser }