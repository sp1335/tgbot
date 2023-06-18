const pool = require('../dbPool');
const { getUid } = require('./userService')
const { identifyUser } = require('../middlewares/authMiddleware')
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
        const orderId = response.rows[0].id
        console.log(orderId, unitPriceResponse)
        const orderUpdateQuery = `
        UPDATE orders SET total_price = total_price + $1
        `
        try {
            await pool.query('BEGIN TRANSACTION')
            await pool.query(orderUpdateQuery, [unitPriceResponse])
            const checkQuery = `
            SELECT * FROM order_items
            WHERE order_id = $1
            AND product_id = $2
            AND price_per_unit = $3
            FOR UPDATE`
            const checkParams = [orderId, pid, unitPriceResponse]
            const checkResult = await pool.query(checkQuery, checkParams)
            if (checkResult.rowCount > 0) {
                const updateQuery = `
                UPDATE order_items
                SET quantity = quantity + 1
                WHERE order_id = $1
                AND product_id = $2
                AND price_per_unit = $3;
                `
                const updateParams = [orderId, pid, unitPriceResponse]
                await pool.query(updateQuery, updateParams)
            } else {
                const insertQuery = `
                INSERT INTO order_items (order_id, product_id, quantity, price_per_unit)
                VALUES ($1, $2, 1, $3);
                `
                const insertParams = [orderId, pid, unitPriceResponse]
                await pool.query(insertQuery, insertParams)
            }
            await pool.query('COMMIT')
            return {
                status: 200,
                message: `
                    Item #${pid} succesfully added to your order #${orderId}.
                    \nTo proceed with the ordering process,
                    \nnavigate back to /start and visit your Active Order tab
            ` }
        } catch (error) {
            console.log(error)
            await pool.query('ROLLBACK')
            return { status: 500, message: "ERROR" }
        }
    } else {
        try {
            await pool.query('BEGIN TRANSACTION')
            const orderInsertQuery = `
                INSERT INTO orders(user_id, date, total_price, delivery_type, delivery_address, delivery_price, deadline, is_completed)
                VALUES($1, null, $2, null, null, null, null, false)
                RETURNING id`
            const orderInsertQueryResponse = await pool.query(orderInsertQuery, [uid, unitPriceResponse])
            const orderId = orderInsertQueryResponse.rows[0].id
            const orderItemsInsertQuery = `
                INSERT INTO order_items(order_id, product_id, quantity, price_per_unit)
                VALUES($1, $2, 1, $3)`
            await pool.query(orderItemsInsertQuery, [orderId, pid, unitPriceResponse])
            await pool.query('COMMIT')
            return {
                status: 200,
                message: `
                    Item #${pid} succesfully added to your order #${orderId}.
                \nTo proceed with the ordering process,
                \nnavigate back to /start and visit your Active Order tab
            ` }
        } catch (error) {
            await pool.query('ROLLBACK')
            return { status: 500, message: 'Unknown error' }
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
    JOIN users ON users.id = orders.user_id; `
    try {
        const orders = await pool.query(query)
        return { status: 200, orders: orders.rows }
    } catch (error) {
        return { status: 500, error: error }
    }

}
async function checkActiveOrder(uid) {
    const query = `SELECT * FROM orders WHERE user_id = $1 AND is_completed = false`
    const response = await pool.query(query, [uid])
    console.log(response.rowCount)
    if (response.rowCount > 0) {
        return { status: 200, order: response.rows[0] }
    } return false
}
async function fetchItems(oid) {
    const query = `SELECT * FROM order_items WHERE order_id = $1`
    const response = await pool.query(query, [oid])
    const items_list = response.rows
    return items_list
}
module.exports = {
    ordersStaff,
    ordersCustomer,
    makeOrder,
    checkActiveOrder,
    fetchItems
}