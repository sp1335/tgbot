const { makeOrder, deleteOrder, deliveryState, setDeliveryState } = require('../services/orderService')
const { getUid, orderAbility, insertPhoneNumber } = require('../services/userService')

function initializeCallback(bot, askState) {
    bot.on('callback_query', async (msg) => {
        const uid = msg.from.id
        const query = JSON.parse(msg.data)
        const method = query.method
        if (method === 'order') {
            const pid = query.pid
            const portion = query.portion
            const response = await makeOrder(pid, uid, portion)
            try {
                if (response.status === 200 && response.message !== undefined) {
                    bot.sendMessage(uid, response.message, { parse_mode: 'HTML' })
                } else {
                    bot.sendMessage(uid, 'Unknown order error. Go back to /start...', { parse_mode: 'HTML' })
                }
            } catch (error) {
                console.log(error)
            }
        } else if (method === 'confirm_order') {
            const oid = query.order_id
            const uuid = await getUid(uid)
            const orderAbilityRes = await orderAbility(uuid)
            const delivery = await deliveryState(oid)
            if (orderAbilityRes.status === 1002 || orderAbilityRes.status === 1001) {
                const options = {
                    reply_markup: {
                        keyboard: [
                            [
                                {
                                    text: 'Share Phone Number',
                                    request_contact: true,
                                },
                            ],
                        ],
                        resize_keyboard: true,
                        one_time_keyboard: true,
                    },
                };
                bot.sendMessage(uid, 'Please share your phone number:', options)
                    .then(() => {
                        bot.on('contact', async (msg) => {
                            const contact = msg.contact.phone_number
                            const insertContact = await insertPhoneNumber(uuid, contact);
                            if (insertContact.status === 200) {
                                bot.sendMessage(uid, insertContact.message)
                            } else {
                                bot.sendMessage(uid, insertContact.message)
                            }
                        })
                    })
                    .catch((err) => {
                        console.log(err)
                    })
                    ;
            } else if (orderAbilityRes.status === 403) {
                bot.sendMessage(uid, 'Forbidden to place the order', { parse_mode: 'HTML' })
            } else if (orderAbilityRes.status === 200) {
                if (delivery.status === 500) {
                    const options = {
                        reply_markup: {
                            keyboard: [
                                [
                                    {
                                        text: 'Takeaway'
                                    },
                                    {
                                        text: 'Delivery'
                                    },
                                ],
                            ],
                            resize_keyboard: true,
                            one_time_keyboard: true,
                        },
                    };
                    bot.sendMessage(uid, delivery.message + '\nSelect delivery method', options)
                        .then(() => {
                            bot.onText(/^(Takeaway|Delivery)$/, async (msg, match) => {
                                const res = match[1]
                                if (res === 'Takeaway' || res === 'Delivery') {
                                    const setDeliveryStateFunc = await setDeliveryState(oid, res, bot, uid, askState)      
                                    if (setDeliveryStateFunc.status === 200) {       
                                        bot.sendMessage(uid, setDeliveryStateFunc.message,
                                            { parse_mode: 'HTML' })
                                    } else {
                                        bot.sendMessage(uid, setDeliveryStateFunc.message)
                                    }
                                } else {
                                    bot.sendMessage(uid, 'Unknown option')
                                }
                            })
                        })
                } else {
                    bot.sendMessage(uid, `Order #${oid} registered as confirmed.\n
                    Our manager will be notified and will reach you out soon.\n
                    Fill free to go back to <i>/start</i> ...`,
                        { parse_mode: 'HTML' })
                }
            } else {
                bot.sendMessage(uid, 'Unknown order error. Go back to /start...', { parse_mode: 'HTML' })
            }

        } else if (method === 'delete_order') {
            const oid = query.order_id
            bot.sendMessage(uid, `Are you sure you want to delete this order?`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    one_time_keyboard: true,
                    resizeble_keyboard: true,
                    keyboard: [
                        ['Yes, delete this order', 'No, keep this order']
                    ]
                }
            }).then(() => {
                bot.onText(/^(Yes, delete this order|No, keep this order)$/, async (msg, match) => {
                    const res = match[1]
                    if (res === 'Yes, delete this order') {
                        const deleteRes = await deleteOrder(oid, uid)
                        if (deleteRes.status === 200) {
                            bot.sendMessage(uid, deleteRes.message,)
                        } else {
                            bot.sendMessage(uid, 'Unknown error deleting order. Try again or go back to /start...')
                        }
                    } else if (res === 'No, keep this order') {
                        bot.sendMessage(uid, 'Order kept as it is!')
                    } else {
                        bot.sendMessage(uid, 'Unknows error')
                    }
                })
            })
        } else {
            bot.sendMessage(uid, `<i>Unknown command\nGo back to /start</i>`, { parse_mode: 'HTML' })
        }
    })
}

module.exports = { initializeCallback }