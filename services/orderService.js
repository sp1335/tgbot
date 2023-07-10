const { stat } = require('fs');
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
    const customerActiveOrder = `SELECT * FROM orders WHERE user_id = $1 AND confirmed = false`
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
                    \nTo proceed the ordering,
                    \nnavigate back to /start and visit "Finish your order" button, 
                    \nor continue adding items to your order.
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
                INSERT INTO orders(user_id, date, total_price, delivery_type, delivery_address, delivery_price, deadline, is_completed, confirmed)
                VALUES($1, null, $2, null, null, null, null, false, false)
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
            console.log(error)
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
    const query = `SELECT * FROM orders WHERE user_id = $1 AND confirmed = false`
    const response = await pool.query(query, [uid])
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
async function deleteOrder(oid, tid) {
    const uid = await getUid(tid)
    try {
        await pool.query(`BEGIN TRANSACTION`)
        const checkIfOrderExists = `SELECT * FROM orders WHERE id = $1`
        const checkIfOrderExistsRes = await pool.query(checkIfOrderExists, [oid])
        if (checkIfOrderExistsRes.rowCount > 0) {
            const expectedUid = checkIfOrderExistsRes.rows[0].user_id
            if (expectedUid != uid) {
                await pool.query('ROLLBACK')
                return { status: 500, message: `Error deleting order. Go back to /start...` }
            } else {
                const deleteItems = `DELETE FROM order_items WHERE order_id = $1`
                await pool.query(deleteItems, [oid])
                const deleteOrder = `DELETE FROM orders WHERE id = $1`
                await pool.query(deleteOrder, [oid])
                await pool.query('COMMIT')
                return {
                    status: 200,
                    message: `
                    Order #${oid} succesfully deleted.
                    \nOrdering process has been stopped.
                    \nGo back to /start to proceed using bot.
            ` }
            }
        }
    } catch (error) {
        console.log(error)
        await pool.query('ROLLBACK')
        return { status: 500, message: 'Unknown error' }
    }

}
async function deliveryState(oid) {
    const query = 'SELECT delivery_type, delivery_address, delivery_price FROM orders WHERE id = $1 AND confirmed = false'
    const res = await pool.query(query, [oid])
    const deliveryDetails = res.rows
    const isNull = deliveryDetails.some(obj => Object.values(obj).some(val => val === null))
    if (!isNull) {

    } else {
        return { status: 500, message: 'Delivery state is not full' }
    }
}
async function setDeliveryState(oid, state, bot, uid, askState) {
    try {
        await pool.query('BEGIN TRANSACTION')
        if (state === 'Takeaway') {
            const takeawayquery = 'UPDATE orders SET delivery_type = $1 WHERE id = $2'
            const res = await pool.query(takeawayquery, [state, oid])
            if (res.rowCount !== 0) {
                const orderConfirmedQuery = `UPDATE orders SET confirmed = true WHERE id = $1`
                const res = await pool.query(orderConfirmedQuery, [oid])
                if (res.rowCount !== 0) {
                    await pool.query('COMMIT')
                    return {
                        status: 200,
                        message: `Delivery method selected succesfully.\nOrder #${oid} registered as confirmed.\nOur manager will be notified and will reach you out soon.\nFill free to go back to /start...`
                    }
                }
                else {
                    await pool.query('ROLLBACK')
                    return { status: 500, message: "Unknown error" }
                }
            } else {
                await pool.query('ROLLBACK')
                return { status: 500, message: "Unknown error" }
            }
        } else if (state === 'Delivery') {
            try {
                const query = 'SELECT delivery_address FROM orders WHERE id = $1';
                const res = await pool.query(query, [oid]);
                if (res.rows[0].delivery_address === null || res.rows[0].delivery_address === '') {
                    return new Promise((resolve, reject) => {
                        bot.sendMessage(uid, 'Since you wish to use the delivery service, please provide a delivery address', { parse_mode: 'HTML' })
                            .then(() => {
                                askState = true;
                                bot.onText(/^(.*)$/, async (msg, match) => {
                                    const address = match[1];
                                    const options = {
                                        reply_markup: {
                                            keyboard: [
                                                ['Yes', 'No']
                                            ]
                                        },
                                        resize_keyboard: true,
                                        one_time_keyboard: true
                                    }
                                    bot.sendMessage(uid, 'Confirm that the delivery address is correct', options, { parse_mode: 'HTML' })
                                        .then(() => {
                                            bot.onText(/^(Yes|No)$/i, async (msg, match) => {
                                                const confirmation = match[1]
                                                if (confirmation === 'Yes') {
                                                    const updateQuery = 'UPDATE orders SET delivery_address = $1, delivery_type = $2, confirmed = true WHERE id = $3';
                                                    await pool.query(updateQuery, [address, state, oid]);
                                                    await pool.query('COMMIT');
                                                    resolve({
                                                        status: 200,
                                                        message: `Delivery method selected successfully.\nOrder #${oid} registered as confirmed.\nOur manager will be notified and will reach out to you soon.\nFeel free to go back to /start...`,
                                                    });
                                                    askState = false;
                                                } else if (confirmation === 'No') {
                                                    bot.sendMessage(uid, 'Please enter the correct delivery address.')
                                                } else {
                                                    bot.sendMessage(uid, 'Forbidden option. Use keyboard to communicate with bot...')
                                                }
                                            })
                                        })

                                });
                            })
                            .catch(async (err) => {
                                console.log(err);
                                await pool.query('ROLLBACK');
                                reject({ status: 500, message: 'Unknown error' });
                            });
                    });
                } else {
                    return {
                        status: 200,
                        message: `Delivery method selected successfully.\nOrder #${oid} registered as confirmed.\nOur manager will be notified and will reach out to you soon.\nFeel free to go back to /start...`,
                    };
                }
            } catch (error) {
                await pool.query('ROLLBACK');
                return { status: 500, message: 'Unknown error' };
            }
        } else {
            await pool.query('ROLLBACK')
            return { status: 500, message: "Unknown delivery option" }
        }
    } catch (error) {
        console.log(error)
        await pool.query('ROLLBACK')
        return { status: 500, message: "ERROR" }
    }
}
module.exports = {
    ordersStaff,
    ordersCustomer,
    makeOrder,
    checkActiveOrder,
    fetchItems,
    deleteOrder,
    deliveryState,
    setDeliveryState
}