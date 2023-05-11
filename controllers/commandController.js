const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const authMiddleware = require('../middlewares/authMiddleware');
const productService = require('../services/productService');

function initializeCommands(bot) {
    let status = {}
    bot.onText(/\/start/, async (msg) => {
        const { from } = msg
        status = await authMiddleware.identifyUser(from)
        if (status.status === 201) {
            bot.sendMessage(from.id, `Welcome, ${status.data.first_name}, for the first time!`)
        } else if (status.status === 200) {
            if (status.data.role === 'customer') {
                bot.sendMessage(from.id, `Welcome again, ${status.data.first_name}!`, {
                    reply_markup: {
                        keyboard: [
                            ['Catalogue'],
                            ['My orders'],
                            ['Send feedback']
                        ],
                        resize_keyboard: true,
                    },
                });
            } else if (status.data.role === 'staff') {
                bot.sendMessage(from.id, `Welcome again, ${status.data.first_name}! \nWarning: Staff Mode Engaged! `, {
                    reply_markup: {
                        keyboard: [
                            ['Catalogue'],
                            ['Orders'],
                            ['Statistics'],
                            ['Feedback'],
                            ['Financial Information']
                        ],
                        resize_keyboard: true,
                    },
                });
            }
        }
    })
    let productList = []
    bot.onText(/.*/, async (msg, match) => {
        const clickedButton = match[0]
        if (clickedButton === 'Catalogue' || clickedButton === 'Go back to catalogue') {
            productList = await productService.fetchProducts()
            const keyboard = productList.map(product => [{ text: product.name }])
            keyboard.push(['⬅️', '🔎', '➡️'])
            const replyMarkup = {
                keyboard,
                resize_keyboard: true
            }
            bot.sendMessage(msg.chat.id, `Here is what you can do about catalogue`, { reply_markup: replyMarkup });
        }
        const clickedProduct = productList.find(product => product.name === clickedButton);
        if (clickedProduct) {
            let productKeyboard = []
            if (status.data.role === 'staff') {
                productKeyboard = [['Edit item', 'Delete item'], ['Go back to catalogue']]
            } else {
                productKeyboard = [['Order this item'], ['Go back to catalogue']]
            }
            console.log(clickedProduct.porcja1)
            let caption = ``
            console.log(clickedProduct)
            if (clickedProduct.cena1 !== null && clickedProduct.cena2 !== null && clickedProduct.cena3 !== null) {
                caption = `<b>${clickedProduct.name}</b>\n\n${clickedProduct.description}\n\n<i>${clickedProduct.cena1}PLN - ${clickedProduct.porcja1}\n${clickedProduct.cena2}PLN - ${clickedProduct.porcja2}\n${clickedProduct.cena3}PLN - ${clickedProduct.porcja3}</i>`
            } else if (clickedProduct.cena1 !== null && clickedProduct.cena2 !== null && clickedProduct.cena3 === null) {
                caption = `<b>${clickedProduct.name}</b>\n\n${clickedProduct.description}\n\n<i>${clickedProduct.cena1}PLN - ${clickedProduct.porcja1}\n${clickedProduct.cena2}PLN - ${clickedProduct.porcja2}</i>`
            } else if (clickedProduct.cena1 !== null && clickedProduct.cena2 === null && clickedProduct.cena3 === null) {
                caption = `<b>${clickedProduct.name}</b>\n\n${clickedProduct.description}\n\n<i>${clickedProduct.cena1}PLN - ${clickedProduct.porcja1}</i>`
            }
            bot.sendPhoto(
                msg.chat.id,
                './img/16469064804190.png',
                {
                    caption: caption,
                    parse_mode: 'HTML',
                    reply_markup: {
                        keyboard: productKeyboard,
                        resize_keyboard: true,
                    }
                }
            )
        }
    })
}

module.exports = { initializeCommands }