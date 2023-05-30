const { makeOrder } = require('../services/orderService')
function initializeCallback(bot) {
    bot.on('callback_query', (msg) => {
        const cid = msg.from.id
        const query = msg.data
        const q_method = query.split('_')[0]
        if (q_method === 'portion') {
            const q_value = query.split('_')[1]
            const response = makeOrder(cid, q_value)
        } else {
            bot.sendMessage(cid, `<i>Unknown command\nGo back to /start</i>`, { parse_mode: 'HTML' })
        }
        // bot.sendMessage(cid, `You just ordered ${q_value} of ${msg.message.caption.split('\n')[0]}`, { parse_mode: 'HTML' })
    })
}

module.exports = { initializeCallback }