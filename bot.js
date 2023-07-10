require('dotenv').config()

const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TG_TOKEN;
const bot = new TelegramBot(token, { polling: true });

let askState = false

async function checkBotStatus() {
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
commandController.initializeCommands(bot, askState)
const callbackController = require('./controllers/callbackController')
callbackController.initializeCallback(bot, askState)

//error handler
// const errorMiddleware = require('./middlewares/errorMiddleware')
// errorMiddleware.initializeError(bot)