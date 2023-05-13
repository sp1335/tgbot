const authMiddleware = require('../middlewares/authMiddleware');
const productService = require('../services/productService');

async function start(msg) {
    const { id } = msg.from
    const status = await authMiddleware.identifyUser(id)
    if (status.status === 201) {
        return { message: `Welcome, ${status.data.first_name}, for the first time!` }
    } else if (status.status === 200) {
        if (status.data.role === 'customer') {
            return {
                keyboard: [
                    ['Catalogue'],
                    ['My orders'],
                    ['Send feedback']
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

async function product(id, uid) {
    const status = await authMiddleware.identifyUser(uid)
    let keyboard = []
    if (status.data.role === 'staff') {
        keyboard = [['Edit item', 'Delete item'], ['Go back to catalogue']]
    } else {
        keyboard = [['Order this item'], ['Go back to catalogue']]
    }
    return {
        message: 'Product loaded successfully...',
        keyboard,
        status
    }
}
async function editDetail(id, uid, config, value) {
    const status = await authMiddleware.identifyUser(uid)
    if (status.data.role === 'staff') {
        const editResponse = await productService.editProduct(id, config, value)
        if (editResponse.status === 200) {
            return { status: 200, message: 'Item updated successfully' }
        }
    } else {
        return { status: 500, message: 'Unautorized action...' }
    }
}
async function edit(id, uid) {
    const status = await authMiddleware.identifyUser(uid)
    console.log(status)
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
module.exports = { catalogue, start, product, edit, editDetail }