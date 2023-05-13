const pool = require('../dbPool');

async function fetchProducts() {
    const query = `SELECT * FROM products`
    const productList = await pool.query(query)
    return productList.rows
}
async function editProduct(id, config, value) {
    const query = `UPDATE products SET ${config} = $1 WHERE id = $2`
    let productUpdate
    try {
        productUpdate = await pool.query(query, [value, id])
    } catch (error) {
        return { status: 500, message: error }
    }
    return { status: 200, message: 'Product updated successfully', productUpdate }
}

module.exports = { fetchProducts, editProduct }