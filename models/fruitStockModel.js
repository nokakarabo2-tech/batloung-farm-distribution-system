const { pool } = require('../config/db');

const FruitStockModel = {
  async createFruit({ fruit_name, description, status = 'ACTIVE' }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.query(
        'INSERT INTO Fruits (fruit_name, description, status) VALUES (?, ?, ?)',
        [fruit_name, description || null, status]
      );
      const fruitId = result.insertId;

      // Initialize separate stock balances for small, medium, and large packaging sizes
      const sizes = ['small', 'medium', 'large'];
      for (const size of sizes) {
        await connection.query(
          'INSERT INTO Stock (fruit_id, packaging_size, available_quantity) VALUES (?, ?, 0)',
          [fruitId, size]
        );
      }

      await connection.commit();
      return { fruit_id: fruitId, fruit_name, description, status };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async findAllFruits() {
    const [rows] = await pool.query('SELECT * FROM Fruits ORDER BY fruit_id ASC');
    return rows;
  },

  async updateFruit(id, { fruit_name, description, status }) {
    const [result] = await pool.query(
      'UPDATE Fruits SET fruit_name = ?, description = ?, status = ? WHERE fruit_id = ?',
      [fruit_name, description, status, id]
    );
    return result.affectedRows;
  },

  async getAllStock() {
    const [rows] = await pool.query(`
      SELECT s.stock_id, f.fruit_id, f.fruit_name, f.status, s.packaging_size, s.available_quantity
      FROM Stock s
      JOIN Fruits f ON s.fruit_id = f.fruit_id
      ORDER BY f.fruit_name ASC, FIELD(s.packaging_size, 'small', 'medium', 'large')
    `);
    return rows;
  },

  async getLowStock(threshold = 10) {
    const [rows] = await pool.query(`
      SELECT s.stock_id, f.fruit_id, f.fruit_name, s.packaging_size, s.available_quantity
      FROM Stock s
      JOIN Fruits f ON s.fruit_id = f.fruit_id
      WHERE s.available_quantity <= ? AND f.status = 'ACTIVE'
      ORDER BY s.available_quantity ASC
    `, [threshold]);
    return rows;
  }
};

module.exports = FruitStockModel;
