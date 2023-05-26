
function initializeCallback(bot) {
    bot.on('callback_query', (msg) => {
        const cid = msg.from.id
        const query = msg.data
        const q_method = query.split('_')[0]
        const q_value = query.split('_')[1] 
        bot.sendMessage(cid, `You just ordered ${q_value} of ${msg.message.caption.split('\n')[0]}`, { parse_mode: 'HTML' })
            
    })
}

module.exports = { initializeCallback }