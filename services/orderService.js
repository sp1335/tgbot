const pool = require('../dbPool');
const { getUid } = require('./userService')

async function makeOrder(pid, tgid, portion) {
    const unitPriceQuery = `
        SELECT 
            CASE
                WHEN porcja1 = $2 THEN cena1
                WHEN porcja2 = $2 THEN cena2
                WHEN porcja3 = $2 THEN cena3
            END AS price
        FROM
            products
        WHERE
            id = $1 AND $2 IN (porcja1, porcja2, porcja3)
    `
    const uid = await getUid(tgid)
    const unitPriceResponse = (await pool.query(unitPriceQuery, [pid, portion])).rows[0].price
    const customerActiveOrder = `SELECT * FROM orders WHERE user_id = $1 AND is_completed = false`
    const response = await pool.query(customerActiveOrder, [uid])
    if (response.rowCount != 0) {
        //user has unfinished order
    } else {
        // user has no unfinished order
        try {
            await pool.query('BEGIN TRANSACTION')
            const orderInsertQuery = `
                INSERT INTO orders (user_id, date, total_price, delivery_type, delivery_address, delivery_price, deadline, is_completed)
                VALUES($1, CURRENT_TIMESTAMP, $2, null, null, null, null, false)
                RETURNING id`
            const orderInsertQueryResponse = await pool.query(orderInsertQuery, [uid, unitPriceResponse])
            const orderId = orderInsertQueryResponse.rows[0].id
            console.log(orderId)
            const orderItemsInsertQuery = `
                INSERT INTO order_items (order_id, product_id, quantity, price_per_unit)
                VALUES ($1, $2, 1, $3)`
            const orderItemsInsertResponse = await pool.query(orderItemsInsertQuery, [orderId, pid, unitPriceResponse])
            await pool.query('COMMIT')
        } catch (error) {
            console.log(error)
            await pool.query('ROLLBACK')
        }
    }
    //     //user has opened unpayed order
    //     const actualOrder = response.rows[0]
    //     const orderId = actualOrder.id
    //     console.log(`We are about to add ${config} of PID${pid} to OID ${orderId}`)
    //     try {
    //         const addDoOrderResponse = await pool.query(query, [orderId, pid, 1, 228.00])
    //         return { status: 200, message: `Item has been added to the order #${orderId}. \n To procceed order process, please go back to /start \n and choose "Unfinished order..."` }
    //     } catch (error) {
    //         return { status: 500, message: "Error placing order, contact the staff... /start" }
 

   
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