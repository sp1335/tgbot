const TelegramBot = require('node-telegram-bot-api');
const authMiddleware = require('../middlewares/authMiddleware');

function initializeCommands(bot) {
    bot.onText(/\/start/, (msg) => {
        const { from, chat } = msg
        start(from, chat)
    })

}

function start(chat, from) {
    console.log(chat, '\n', from)
    const userStatus = authMiddleware.identifyUser(from)
    console.log('User status: ', userStatus)
}

module.exports = { initializeCommands }