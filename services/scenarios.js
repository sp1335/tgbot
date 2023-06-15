const authMiddleware = require('../middlewares/authMiddleware');
const productService = require('../services/productService');
const orderService = require('../services/orderService');
const UserService = require('../services/userService');
const { toUnicode } = require('punycode');

async function requestStatus(uid) {
    return await authMiddleware.identifyUser(uid)
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
    console.log(status)
    if (status.status === 201) {
        return { message: `Welcome, ${status.data.first_name}, for the first time!` }
    } else if (status.status === 200) {
        if (status.data.role === 'customer') {
            return {
                keyboard: [
                    ['Catalogue'],
                    ['My orders'],
                    ['Send feedback']
                    //TODO if user has unpayed order show button about it
                ],
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
    ordersForCustomer
}