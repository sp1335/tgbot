const { checkActiveOrder } = require('../services/orderService');
const { start, catalogue, ordersForStaff, ordersKeyboard, ordersForCustomer, goToProduct, finishOrder } = require('../services/scenarios');

let productList = []
let orderList = []
let selectedItem
let askState = false

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
            selectedItem = productList.find(product => product.id === selectedItem.id)
            if (selectedItem !== null && selectedItem !== '' && selectedItem !== undefined) {
                const goToProductRes = await goToProduct(msg.from, selectedItem);
                console.log(goToProductRes)
                if (goToProductRes !== undefined && goToProductRes.buttons !== undefined && goToProductRes.caption !== undefined) {
                    console.log(goToProductRes.buttons)
                    bot.sendPhoto(
                        msg.from.id,
                        './img/16469064804190.png',
                        {
                            caption: goToProductRes.caption,
                            parse_mode: 'HTML',
                            reply_markup: {
                                inline_keyboard: [goToProductRes.buttons],
                                resize_keyboard: true
                            }
                        }
                    )
                } else {
                    bot.sendMessage(msg.from.id, `Unknown product error. Go back to /start...`)
                }

            } else {
                bot.sendMessage(msg.from.id, `You've not selected any product yet...`, {
                    parse_mode: 'HTML'
                });
            }
        } else if (clickedButton === 'My orders') {
            const orders = await ordersForCustomer(msg.from);
            if (orders.status === 204) {
                bot.sendMessage(msg.from.id, orders.message)
            } else {
                const keyboard = ordersKeyboard(orders.orders.orders, 'customer')
            }
        } else if (clickedButton === 'Finish your order') {
            const res = await finishOrder(userid)
            if (res.status === 200) {
                let message = ''
                res.order.forEach((item) => {
                    message += `\n${item[4]} of  ${item[1]} for ${item[3]}zł`
                })
                bot.sendMessage(msg.from.id,
                    `You have unfinished order #${res.oid}.\nConfirm that you want to order items bellow:\n${message}\n\nTotal price is: ${res.total_price}zł`,
                    {
                        parse_mode: 'HTML',
                        reply_markup: {
                            inline_keyboard: [
                                [{
                                    text: 'Confirm order',
                                    callback_data: JSON.stringify({
                                        method: 'confirm_order',
                                        order_id: res.order.id
                                    })
                                },
                                {
                                    text: 'Delete order',
                                    callback_data: JSON.stringify({
                                        method: 'delete_order',
                                        order_id: res.order.id
                                    })
                                }]
                            ],
                            resize_keyboard: true
                        }
                    }
                )
            } else {
                bot.sendMessage(msg.from.id, res.message)
            }
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