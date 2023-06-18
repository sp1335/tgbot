const authMiddleware = require('../middlewares/authMiddleware');
const productService = require('../services/productService');
const orderService = require('../services/orderService');
const UserService = require('../services/userService');

async function requestStatus(uid) {
    return await authMiddleware.identifyUser(uid)
}
async function checkActiveOrder(uid) {
    const activeOrderRes = await orderService.checkActiveOrder(uid);
    if (activeOrderRes) {
        return { status: 200, order: activeOrderRes.order }
    } else {
        return { status: 204 }
    }

}
async function finishOrder(tid) {
    const userData = await authMiddleware.identifyUser(tid);
    const uid = userData.data.id
    const checkOrder = await orderService.checkActiveOrder(uid)
    if (checkOrder === false || checkOrder === undefined || checkOrder === null) {
        return { status: 404, message: `Unknown order error.\nProbably you got this button by mistake, and you shouldn't be allowed to see it.\nGo back to /start...` }
    } else {
        const oid = checkOrder.order.id
        const items_list = await orderService.fetchItems(oid)
        const total_price = checkOrder.order.total_price
        let id_of_items = items_list.map((item) => [item.product_id, item.price_per_unit])
        let was = []
        for (let i = 0; i < id_of_items.length; i++) {
            if (!was.find(item => item[0] === id_of_items[i][0] && item[1] === id_of_items[i][1])) {
                was.push(id_of_items[i])
                const item = await productService.fetchProduct(id_of_items[i][0])
                const quantity = (items_list.find(item => item.id === item.id && item.price_per_unit === id_of_items[i][1])).quantity
                id_of_items[i] = [item.id, item.name, item.category, id_of_items[i][1], quantity]
            } else {
                id_of_items.splice(i, 1)
                i--;
            }
        }
        return { status: 200, order: id_of_items }
    }
}
async function goToProduct(from, selectedItem) {
    const catalogueConfig = await catalogue()
    productList = catalogueConfig.catalogue
    const portions = Object.entries(selectedItem)
        .filter(([key, value]) => key.startsWith('porcja'))
        .filter(([key, value]) => value !== null)
        .map(([key, value]) => value)
    const buttons = portions.map((portion) => ({
        text: portion,
        callback_data: JSON.stringify({
            method: 'order',
            portion: portion,
            pid: selectedItem.id,
        })
    }))
    if (from !== undefined) {
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
        return { buttons: buttons, caption: caption }
    }
}
async function start(from) {
    const status = await requestStatus(from.id)
    if (status.status === 201) {
        return { message: `Welcome, ${status.data.first_name}, for the first time!` }
    } else if (status.status === 200) {
        if (status.data.role === 'customer') {
            const activeOrderRes = await checkActiveOrder(status.data.id)
            let keyboard = [
                ['Catalogue'],
                ['My orders'],
                ['Send feedback']
            ]
            if (activeOrderRes.status === 200) {
                keyboard.unshift([`Finish your order `])
            }
            console.log(keyboard)
            return {
                keyboard: keyboard,
                message: `Welcome again, ${status.data.first_name}!`
            }
        } else if (status.data.role === 'staff') {
            return {
                keyboard: [
                    ['Catalogue'],
                    ['Orders'],
                    ['Statistics'],
                    ['Feedback'],
                    ['Financial Information']
                ],
                message: `<b>Welcome again, ${status.data.first_name}!</b> \n<i>Warning: Staff Mode Engaged!</i> `
            }
        }
    }
}
async function catalogue() {
    const productList = await productService.fetchProducts()
    return {
        message: `Catalogue loaded successfully...`,
        catalogue: productList
    }
}
async function editDetail(id, from, config, value) {
    const status = await requestStatus(from)
    if (status.data.role === 'staff') {
        const editResponse = await productService.editProduct(id, config, value)
        if (editResponse.status === 200) {
            return { status: 200, message: 'Item updated successfully' }
        }
    } else {
        return { status: 500, message: 'Unautorized action...' }
    }
}
async function edit(id, from) {
    const status = await requestStatus(from)
    if (status.data.role === 'staff') {
        try {
            productService.editProduct(id)
        } catch (error) {
            return {
                status: 500,
                message: 'Product edit failed: ' + error,
                newCatalogue: productList
            }
        }
        const keyboard = [['Edit name', 'Edit description'], ['Edit options', 'Edit photo(temporary not available)'], ['Go back to product']]
        return {
            status: 200,
            message: 'What do you want to change?',
            keyboard
        }
    } else {
        return { status: 500, message: 'Product edit forbidden ' }
    }
}
async function ordersForCustomer(from) {
    const uid = await UserService.getUid(from.id)
    const orders = await orderService.ordersCustomer(uid.id)
    console.log(from)
    if (orders.status === 200) {
        if (orders.orders.length === 0) {
            return {
                status: 204,
                message: 'You have no orders yet...'
            }
        } else {
            return {
                status: 200,
                orders: orders
            }
        }
    }
}
async function ordersForStaff(from) {
    const status = await requestStatus(from.id)
    if (status.data.role === 'staff') {
        const orders = await orderService.ordersStaff()
        if (orders.orders.length < 1) {
            return { status: 400, message: 'No orders found both served and unserved...' }
        } else {
            const servedCount = orders.orders.filter(order => order.is_complited === true)
            const unservedCount = orders.orders.filter(order => order.is_complited === false)
            return { status: 200, served: servedCount, unserved: unservedCount, keyboard: [['Unserved orders', 'Served orders'], ['Go back to start']] }
        }
    } else {
        return { status: 500, message: 'Unautorized action...' }
    }
}

function ordersKeyboard(array, type) {
    const keyboard = []
    console.log(array, type)
    if (array !== undefined) {
        if (type === 'staff') {
            array.forEach(order => {
                keyboard.push([order.id, order.username, order.first_name, order.phone_number, order.deadline])
            })
        } else if (type === 'customer') {
            array.forEach(order => {
                keyboard.push([order.id, order.total_price, order.deadline])
            })
        } else {
            return { status: 500, message: 'Unauthorized action' }
        }
        return { status: 200, keyboard }
    } else {
        return { status: 500, message: 'Invalid array' }
    }

}
module.exports = {
    catalogue,
    start,
    goToProduct,
    edit,
    editDetail,
    ordersForStaff,
    ordersKeyboard,
    ordersForCustomer,
    finishOrder
}