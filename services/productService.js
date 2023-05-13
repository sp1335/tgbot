const pool = require('../dbPool');

async function fetchProducts() {
    const query = `SELECT * FROM products`
    const productList = await pool.query(query)
    return productList.rows
}
async function editProduct(id){
    console.log('Product ID to edit: ', id)
}

module.exports = { fetchProducts, editProduct }