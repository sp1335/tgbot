const { makeOrder } = require('../services/orderService')
function initializeCallback(bot) {
    bot.on('callback_query', async (msg) => {
        const uid = msg.from.id
        const query = JSON.parse(msg.data)
        const method = query.method
        if (method === 'order') {
            const pid = query.pid
            const portion = query.portion
            const response = await makeOrder(pid, uid, portion)
            console.log('makeOrder response: ', response)
            if (response.status === 200) {
                bot.sendMessage(uid, response.message, { parse_mode: 'HTML' })
            } else {
                bot.sendMessage(uid, response.message, { parse_mode: 'HTML' })
            }
        } else {
            bot.sendMessage(uid, `<i>Unknown command\nGo back to /start</i>`, { parse_mode: 'HTML' })
        }
        // bot.sendMessage(uid, `You just ordered ${q_value} of ${msg.message.caption.split('\n')[0]}`, { parse_mode: 'HTML' })
    })
}

module.exports = { initializeCallback }