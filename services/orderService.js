const pool = require('../dbPool');
const { getUid } = require('./userService')
async function makeOrder(tgid, config, pid) {
    const uid = await getUid(tgid)
    const customerActiveOrder = `SELECT * FROM orders WHERE user_id = $1 AND is_completed = false`
    const response = await pool.query(customerActiveOrder, [uid])
    if (response.rows.length > 0) {
        const actualOrder = response.rows[0]
        const orderId = actualOrder.id
        console.log(`We are about to add ${config} of PID${pid} to OID ${orderId}`)
    } else {
        console.log('USER HAS NO UNCOMPLITE ORDER')
    }
}
async function ordersCustomer(uid) {
    const query = `
    SELECT * 
    FROM orders 
    WHERE user_id = $1`
    try {
        const orders = await pool.query(query, [uid])
        return { status: 200, orders: orders.rows }
    } catch (error) {
        return { status: 500, errror: error }
    }
}
async function ordersStaff() {
    const query = `
    SELECT 
    orders.*, users.first_name, users.username, users.phone_number
    FROM orders
    JOIN users ON users.id = orders.user_id;`
    try {
        const orders = await pool.query(query)
        return { status: 200, orders: orders.rows }
    } catch (error) {
        return { status: 500, error: error }
    }

}

module.exports = { ordersStaff, ordersCustomer, makeOrder }