const authMiddleware = require('../middlewares/authMiddleware');
const productService = require('../services/productService');

async function start(msg, status) {
    const { id } = msg.from
    status = await authMiddleware.identifyUser(id)
    productList = await productService.fetchProducts()
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

module.exports = { catalogue, start }