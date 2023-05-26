const { start, catalogue, edit, editDetail, ordersForStaff, ordersKeyboard, ordersForCustomer } = require('../services/scenarios');

let productList = []
let orderList = []
let selectedItem
let askState = false

async function goToProduct(from, bot) {
    const catalogueConfig = await catalogue()
    productList = catalogueConfig.catalogue
    selectedItem = productList.find(product => product.id === selectedItem.id)
    const portions = Object.entries(selectedItem)
        .filter(([key, value]) => key.startsWith('porcja'))
        .filter(([key, value]) => value !== null)
        .map(([key, value]) => value)
    const buttons = portions.map((portion) => ({
        text: portion,
        callback_data: `portion_${portion}`
    }))
    if (from !== undefined && bot !== undefined) {
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
            from.id,
            './img/16469064804190.png',
            {
                caption: caption,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [buttons],
                    resize_keyboard: true
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
        const clickedOrder = orderList.find(order => order.id === clickedButton)
        //user action log
        console.log(userid, msg.from.first_name, 'typed: ', clickedButton)
        if (clickedButton === 'Catalogue' || clickedButton === 'Go back to catalogue') {
            selectedItem = null
            const catalogueConfig = await catalogue()
            const keyboard = catalogueConfig.catalogue.map(product => [{ text: product.name }])
            productList = catalogueConfig.catalogue
            const replyMarkup = {
                keyboard,
                resize_keyboard: true
            }
            bot.sendMessage(msg.chat.id, catalogueConfig.message, {
                reply_markup: replyMarkup
            })
        } else if (clickedButton === 'Go back to start' || clickedButton === '\/start') {
            selectedItem = null
            const startConfig = await start(msg.from)
            console.log('Controller', startConfig)
            bot.sendMessage(userid, startConfig.message, {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: startConfig.keyboard,
                    resize_keyboard: true,
                },
            });
        } else if (clickedProduct || clickedButton === 'Go back to product') {
            if (clickedProduct !== undefined) {
                selectedItem = clickedProduct
            } else if (selectedItem === undefined) {
                bot.sendMessage(msg.from.id, `You've not selected any product yet...`, {
                    parse_mode: 'HTML'
                });
            }
            if (selectedItem !== null && selectedItem !== '' && selectedItem !== undefined) {
                goToProduct(msg.from, bot)
            } else {
                bot.sendMessage(msg.from.id, `You've not selected any product yet...`, {
                    parse_mode: 'HTML'
                });
            }
        }else if (clickedButton === 'My orders') {
            const orders = await ordersForCustomer(msg.from);
            const keyboard = ordersKeyboard(orders.orders.orders, 'customer')
            console.log(keyboard)
        } else if (clickedButton === 'Orders' || clickedButton === 'Go back to orders') {
            const orders = await ordersForStaff(msg.from)
            if (orders.status === 400) {
                bot.sendMessage(msg.from.id, orders.message)
            } else if (orders.status === 200) {
                const { served, unserved } = orders
                orderList.push(served, unserved)
                bot.sendMessage(msg.from.id, `${served.length} served and ${unserved.length} unserved orders were found`, {
                    parse_mode: 'HTML',
                    reply_markup: {
                        keyboard: orders.keyboard,
                        resize_keyboard: true,
                    },
                })
            } else {
                bot.sendMessage(msg.from.id, 'Unknown error')
            }
        } else if (clickedButton === 'Unserved orders' || clickedButton === 'Served orders') {
            const unserved = orderList[1]
            const served = orderList[0]
            if (orderList !== undefined) {
                let keyboard
                let listName
                if (clickedButton === 'Unserved orders') {
                    listName = 'Unserved'
                    keyboard = ordersKeyboard(unserved, 'staff')
                } else if (clickedButton === 'Served orders') {
                    listName = 'Served'
                    keyboard = ordersKeyboard(served, 'staff')
                }
                console.log(keyboard)
                let keyboardFormatted = []
                keyboard.keyboard.map(key => {
                    const date = new Date(key[4])
                    const deadline = `${date.getHours()}:${date.getMinutes()} ${date.getDate()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
                    keyboardFormatted.push([`Order #${key[0]}, from @${key[1]}. Deadline: ${deadline}`])
                })
                keyboardFormatted.push(['Go back to orders'])
                bot.sendMessage(msg.from.id, `${keyboard.length} ${listName} orders found. Here they are...`, {
                    parse_mode: 'HTML',
                    reply_markup: {
                        keyboard: keyboardFormatted,
                        resize_keyboard: true,
                    },
                })
            }
        } else if (clickedOrder) {
            console.log(clickedOrder)
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