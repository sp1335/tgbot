const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const { start, catalogue, product, edit, editDetail } = require('../services/scenarios');

let productList = []
let selectedItem
let askState = false
async function goToProduct(userid, bot) {
    const catalogueConfig = await catalogue()
    productList = catalogueConfig.catalogue
    selectedItem = productList.find(product => product.id === selectedItem.id)
    if (userid !== undefined && bot !== undefined) {
        const productConfig = await product(selectedItem.id, userid)
        const keyboard = productConfig.keyboard
        let caption = `<b>${selectedItem.name}</b>\n\n${selectedItem.description}\n\n`
        if (selectedItem.cena1 !== null) {
            caption += `<i>${selectedItem.cena1}PLN - ${selectedItem.porcja1}</i>\n`;
        }
        if (selectedItem.cena2 !== null) {
            caption += `<i>${selectedItem.cena2}PLN - ${selectedItem.porcja2}</i>\n`;
        }
        if (selectedItem.cena3 !== null) {
            caption += `<i>${selectedItem.cena3}PLN - ${selectedItem.porcja3}</i>`;
        }
        bot.sendPhoto(
            userid,
            './img/16469064804190.png',
            {
                caption: caption,
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: keyboard,
                    resize_keyboard: true,
                }
            }
        )
    }
}
function initializeCommands(bot) {
    bot.onText(/.*/, async (msg, match) => {
        const userid = msg.from.id
        const clickedButton = match[0]
        const clickedProduct = productList.find(product => product.name === clickedButton);

        //user action log
        console.log(userid, msg.from.first_name, 'typed: ', clickedButton)

        if (clickedButton === 'Catalogue' || clickedButton === 'Go back to catalogue') {
            selectedItem = null
            const catalogueConfig = await catalogue()
            const keyboard = catalogueConfig.catalogue.map(product => [{ text: product.name }])
            productList = catalogueConfig.catalogue
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
            selectedItem = null
            const startConfig = await start(msg)
            bot.sendMessage(userid, startConfig.message, {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: startConfig.keyboard,
                    resize_keyboard: true,
                },
            });
        } else if (clickedButton === 'Edit name' || clickedButton === 'Edit description' || clickedButton === 'Edit options' || clickedButton === 'Edit photo') {
            let editConf
            console.log("Asked for value to edit, so ask state is: ", askState)
            switch (clickedButton) {
                case 'Edit name':
                    editConf = 'name'
                    askState = true
                    break;
                case 'Edit description':
                    editConf = 'description'
                    askState = true
                    break;
                case 'Edit options':
                    editConf = 'options'
                    askState = true
                    break;
                case 'Edit photo':
                    console.log('Edit photo')
                    break;
                default:
                    askState = false
                    break;
            }
            bot.sendMessage(msg.from.id, `Enter the new ${editConf} for this product: `)
            let newValue
            bot.on('message', async (msg) => {
                newValue = msg.text
                if (newValue !== '') {
                    console.log(`${msg.from.first_name} trying to edit productid: ${selectedItem.id}, option: ${editConf}, value: ${newValue}`)
                    if (selectedItem !== null && selectedItem !== undefined) {
                        const editService = await editDetail(selectedItem.id, userid, editConf, newValue)
                        if (editService.status === 200) {
                            askState = false
                            goToProduct(msg.from.id, bot)
                        }
                    }
                }
            })
        } else if (clickedButton === 'Edit item' && selectedItem !== null && selectedItem !== '' && selectedItem !== undefined) {
            const editConfig = await edit(selectedItem.id, msg.from.id)
            console.log(selectedItem)
            bot.sendMessage(userid, editConfig.message, {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: editConfig.keyboard,
                    resize_keyboard: true,
                },
            });
        } else if (clickedProduct || clickedButton === 'Go back to product') {
            if (clickedProduct !== undefined) {
                selectedItem = clickedProduct
            } else if (selectedItem === undefined) {
                bot.sendMessage(userid, `You've not selected any product yet...`, {
                    parse_mode: 'HTML'
                });
            }
            if (selectedItem !== null && selectedItem !== '' && selectedItem !== undefined) {
                goToProduct(msg.from.id, bot)
            } else {
                bot.sendMessage(userid, `You've not selected any product yet...`, {
                    parse_mode: 'HTML'
                });
            }
        } else {
            if (askState === false) {
                bot.sendMessage(msg.from.id, '<i>Unknown command\nGo back to /start</i>', {
                    parse_mode: 'HTML'
                });
            }
        }
    })
}

module.exports = { initializeCommands }