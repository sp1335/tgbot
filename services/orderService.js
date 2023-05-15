const pool = require('../dbPool');

async function ordersStaff() {
    const query = `SELECT orders.*, users.first_name, users.username, users.phone_number
    FROM orders
    JOIN users ON users.id = orders.user_id;`
    try {
        const orders = await pool.query(query)
        return { status: 200, orders: orders.rows }
    } catch (error) {
        return { status: 500, error: error }
    }

}

module.exports = { ordersStaff }