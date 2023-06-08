const { makeOrder } = require('../services/orderService')
function initializeCallback(bot) {
    bot.on('callback_query', (msg) => {
        const uid = msg.from.id
        const query = msg.data
        const q_method = query.split('_')[0]
        console.log(query)
        if (q_method === 'portion') {
            const q_value = (query.split(',')[0]).split('_')[1]
            const pid = (query.split(',')[1]).split('_')[1]
            const response = makeOrder(uid, q_value, pid)
        } else {
            bot.sendMessage(uid, `<i>Unknown command\nGo back to /start</i>`, { parse_mode: 'HTML' })
        }
        // bot.sendMessage(uid, `You just ordered ${q_value} of ${msg.message.caption.split('\n')[0]}`, { parse_mode: 'HTML' })
    })
}

module.exports = { initializeCallback }