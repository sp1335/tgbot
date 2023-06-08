const pool = require('../dbPool');
const { getUid } = require('./userService')
async function makeOrder(tgid, config, pid) {
    const uid = await getUid(tgid)
    const customerActiveOrder = `SELECT * FROM orders WHERE user_id = $1 AND is_completed = false`
    const response = await pool.query(customerActiveOrder, [uid])
    console.log(response)
    const query = `
        INSERT INTO order_items (order_id, product_id, quantity, price_per_unit) 
        VALUES($1, $2, $3, $4)`
    if (response.rows.length > 0) {
        //user has opened unpayed order
        const actualOrder = response.rows[0]
        const orderId = actualOrder.id
        console.log(`We are about to add ${config} of PID${pid} to OID ${orderId}`)
        try {
            const addDoOrderResponse = await pool.query(query, [orderId, pid, 1, 228.00])
            return { status: 200, message: `Item has been added to the order #${orderId}. \n To procceed order process, please go back to /start \n and choose "Unfinished order..."` }
        } catch (error) {
            return { status: 500, message: "Error placing order, contact the staff... /start" }
        }

    } else {
        //user has no opened unpayed order
        const createOrder = `
        INSERT INTO orders (user_id, date, total_price, delivery_type, delivery_address, delivery_price, deadline, is_completed)
        VALUES($1, CURRENT_TIMESTAMP, 0.00, null, null, null, null, false)
        RETURNING id;
        `
        try {
            const createOrderRes = await pool.query(createOrder, [uid])
            const orderId = createOrderRes.rows[0].id
            const addToOrder = await pool.query(query, [orderId, pid, 1, 228])
            return { status: 200, message: `New order #${orderId} has been created. Item has been added to the order. \n To procceed, please go back to /start \n and choose "Unfinished order..."` }
        } catch (error) {
            return { status: 500, message: "Error placing new order, contact the staff... /start" }
        }
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