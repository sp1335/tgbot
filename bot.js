require('dotenv').config()

const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TG_TOKEN;
const bot = new TelegramBot(token, { polling: true });

function checkBotStatus() {
    bot.getMe()
        .then((me) => {
            console.log('Bot is active and running: ', me.username)
        })
        .catch((err) => {
            console.log('Error occued while checking bot status: ', err)
        })
}
checkBotStatus()

const commandController = require('./controllers/commandController')
commandController.initializeCommands(bot)
const callbackController = require('./controllers/callbackController')
callbackController.initializeCallback(bot)

//error handler
// const errorMiddleware = require('./middlewares/errorMiddleware')
// errorMiddleware.initializeError(bot)