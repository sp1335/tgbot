const pool = require('../dbPool');

async function fetchProducts() {
    const query = `SELECT * FROM products`
    const productList = await pool.query(query)
    return productList.rows
}

module.exports = { fetchProducts }