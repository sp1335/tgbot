const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const { start, catalogue } = require('../services/scenarios');
let status = {}
let productList = []

function initializeCommands(bot) {
    bot.onText(/.*/, async (msg, match) => {
        console.log(productList)
        const clickedButton = match[0]
        const clickedProduct = productList.find(product => product.name === clickedButton);
        console.log(msg)
        console.log(msg.from.id, msg.from.first_name, 'typed: ', clickedButton) //log
        if (clickedButton === 'Catalogue' || clickedButton === 'Go back to catalogue') {
            const catalogueConfig = await catalogue()
            const keyboard = catalogueConfig.catalogue.map(product => [{ text: product.name }])
            productList.push(catalogueConfig.catalogue)
            keyboard.push(['⬅️', '🔎', '➡️'])
            const replyMarkup = {
                keyboard,
                resize_keyboard: true
            }
            bot.sendMessage(msg.chat.id, catalogueConfig.message, {
                reply_markup: replyMarkup
            })
        }
        else if (clickedButton === 'Go back to start' || clickedButton === '\/start') {
            const startConfig = await start(msg, status)
            bot.sendMessage(msg.from.id, startConfig.message, {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: startConfig.keyboard,
                    resize_keyboard: true,
                },
            });
        } else if (clickedProduct) {
            console.log('TUT')
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
        } else {
            bot.sendMessage(msg.from.id, '<i>Unknown command\nGo back to /start</i>', {
                parse_mode: 'HTML'
            });
        }




        // if (clickedProduct) {
        //     console.log('TUT')
        //     let productKeyboard = []
        //     if (status.data.role === 'staff') {
        //         productKeyboard = [['Edit item', 'Delete item'], ['Go back to catalogue']]
        //     } else {
        //         productKeyboard = [['Order this item'], ['Go back to catalogue']]
        //     }
        //     console.log(clickedProduct.porcja1)
        //     let caption = ``
        //     console.log(clickedProduct)
        //     if (clickedProduct.cena1 !== null && clickedProduct.cena2 !== null && clickedProduct.cena3 !== null) {
        //         caption = `<b>${clickedProduct.name}</b>\n\n${clickedProduct.description}\n\n<i>${clickedProduct.cena1}PLN - ${clickedProduct.porcja1}\n${clickedProduct.cena2}PLN - ${clickedProduct.porcja2}\n${clickedProduct.cena3}PLN - ${clickedProduct.porcja3}</i>`
        //     } else if (clickedProduct.cena1 !== null && clickedProduct.cena2 !== null && clickedProduct.cena3 === null) {
        //         caption = `<b>${clickedProduct.name}</b>\n\n${clickedProduct.description}\n\n<i>${clickedProduct.cena1}PLN - ${clickedProduct.porcja1}\n${clickedProduct.cena2}PLN - ${clickedProduct.porcja2}</i>`
        //     } else if (clickedProduct.cena1 !== null && clickedProduct.cena2 === null && clickedProduct.cena3 === null) {
        //         caption = `<b>${clickedProduct.name}</b>\n\n${clickedProduct.description}\n\n<i>${clickedProduct.cena1}PLN - ${clickedProduct.porcja1}</i>`
        //     }
        //     bot.sendPhoto(
        //         msg.chat.id,
        //         './img/16469064804190.png',
        //         {
        //             caption: caption,
        //             parse_mode: 'HTML',
        //             reply_markup: {
        //                 keyboard: productKeyboard,
        //                 resize_keyboard: true,
        //             }
        //         }
        //     )
        // }
    })
}

module.exports = { initializeCommands }