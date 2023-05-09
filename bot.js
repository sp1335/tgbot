require('dotenv').config()

const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TG_TOKEN;
const bot = new TelegramBot(token, { polling: true });

//command controller
const commandController = require('./controllers/commandController')
commandController.initializeCommands(bot)

//error handler 
// const errorMiddleware = require('./middlewares/errorMiddleware')
// errorMiddleware.initializeError(bot)