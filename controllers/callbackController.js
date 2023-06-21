const { makeOrder, deleteOrder } = require('../services/orderService')
function initializeCallback(bot) {
    bot.on('callback_query', async (msg) => {
        const uid = msg.from.id
        const query = JSON.parse(msg.data)
        const method = query.method
        if (method === 'order') {
            const pid = query.pid
            const portion = query.portion
            const response = await makeOrder(pid, uid, portion)
            try {
                if (response.status === 200 && response.message !== undefined) {
                    bot.sendMessage(uid, response.message, { parse_mode: 'HTML' })
                } else {
                    bot.sendMessage(uid, 'Unknown order error. Go back to /start...', { parse_mode: 'HTML' })
                }
            } catch (error) {
                console.log(error)
            }
        } else if (method === 'confirm_order') {

        } else if (method === 'delete_order') {
            const oid = query.order_id
            bot.sendMessage(uid, `Are you sure you want to delete this order?`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    one_time_keyboard: true,
                    resizeble_keyboard: true,
                    keyboard: [
                        ['Yes, delete this order', 'No, keep this order']
                    ]
                }
            }).then(() => {
                bot.onText(/^(Yes, delete this order|No, keep this order)$/, async (msg, match) => {
                    const res = match[1]
                    if (res === 'Yes, delete this order') {
                        const deleteRes = await deleteOrder(oid, uid)
                        if (deleteRes.status === 200) {
                            bot.sendMessage(uid, deleteRes.message,)
                        } else {
                            bot.sendMessage(uid, 'Unknown error deleting order. Try again or go back to /start...')
                        }
                    } else if (res === 'No, keep this order') {
                        bot.sendMessage(uid, 'Order kept as it is!')
                    } else {
                        bot.sendMessage(uid, 'Unknows error')
                    }
                })
            })
        } else {
            bot.sendMessage(uid, `<i>Unknown command\nGo back to /start</i>`, { parse_mode: 'HTML' })
        }
    })
}

module.exports = { initializeCallback }