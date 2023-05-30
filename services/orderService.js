const pool = require('../dbPool');
async function makeOrder(uid, config) {
    console.log(uid, config)
    const customerActiveOrder = `SELECT * FROM orders WHERE user_id = $1 AND is_completed = false`
    const isCustomerActiveOrder = await pool.query(customerActiveOrder, [uid])
    if (isCustomerActiveOrder.rows.length > 0) {

    }else{
        const query = `INSERT INTO orders(user_id, date, total_price, delivery_type, delivery_address)`
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