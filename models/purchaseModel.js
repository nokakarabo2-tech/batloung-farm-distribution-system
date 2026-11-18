const { pool } = require('../config/db');

const PurchaseModel = {
  async createPurchase({ supplier_id, items }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Verify supplier exists
      const [suppliers] = await connection.query('SELECT supplier_id FROM Suppliers WHERE supplier_id = ?', [supplier_id]);
      if (suppliers.length === 0) {
        const err = new Error('Supplier not found.');
        err.statusCode = 404;
        throw err;
      }

      // Calculate total purchase amount automatically
      let totalAmount = 0;
      for (const item of items) {
        totalAmount += Number(item.quantity) * Number(item.unit_cost);
      }

      // Insert main purchase record
      const [purchaseResult] = await connection.query(
        'INSERT INTO Purchases (supplier_id, total_amount) VALUES (?, ?)',
        [supplier_id, totalAmount]
      );
      const purchaseId = purchaseResult.insertId;

      // Insert purchase details and increase stock per fruit & packaging size
      for (const item of items) {
        const { fruit_id, quantity, unit_cost, packaging_size } = item;

        // Verify fruit exists
        const [fruits] = await connection.query('SELECT fruit_id FROM Fruits WHERE fruit_id = ?', [fruit_id]);
        if (fruits.length === 0) {
          const err = new Error(`Fruit ID ${fruit_id} does not exist.`);
          err.statusCode = 404;
          throw err;
        }

        await connection.query(
          'INSERT INTO Purchase_Details (purchase_id, fruit_id, quantity, unit_cost, packaging_size) VALUES (?, ?, ?, ?, ?)',
          [purchaseId, fruit_id, quantity, unit_cost, packaging_size]
        );

        // Increase stock (insert if not exists, or add to existing available_quantity)
        await connection.query(
          `INSERT INTO Stock (fruit_id, packaging_size, available_quantity)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE available_quantity = available_quantity + ?`,
          [fruit_id, packaging_size, quantity, quantity]
        );
      }

      await connection.commit();
      return { purchase_id: purchaseId, supplier_id, total_amount: totalAmount, items };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async findAll() {
    const [rows] = await pool.query(`
      SELECT p.purchase_id, p.purchase_date, p.total_amount, s.business_name AS supplier_name
      FROM Purchases p
      JOIN Suppliers s ON p.supplier_id = s.supplier_id
      ORDER BY p.purchase_date DESC
    `);
    return rows;
  }
};

module.exports = PurchaseModel;
