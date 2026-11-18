const { pool } = require('../config/db');

const SupplierModel = {
  async create({ business_name, contact_person, phone, province, address }) {
    const [result] = await pool.query(
      'INSERT INTO Suppliers (business_name, contact_person, phone, province, address) VALUES (?, ?, ?, ?, ?)',
      [business_name, contact_person, phone, province, address]
    );
    return { supplier_id: result.insertId, business_name, contact_person, phone, province, address };
  },

  async findAll() {
    const [rows] = await pool.query('SELECT * FROM Suppliers ORDER BY supplier_id ASC');
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM Suppliers WHERE supplier_id = ?', [id]);
    return rows[0];
  },

  async update(id, { business_name, contact_person, phone, province, address }) {
    const [result] = await pool.query(
      'UPDATE Suppliers SET business_name = ?, contact_person = ?, phone = ?, province = ?, address = ? WHERE supplier_id = ?',
      [business_name, contact_person, phone, province, address, id]
    );
    return result.affectedRows;
  },

  async hasPurchases(id) {
    const [rows] = await pool.query('SELECT COUNT(*) AS count FROM Purchases WHERE supplier_id = ?', [id]);
    return rows[0].count > 0;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM Suppliers WHERE supplier_id = ?', [id]);
    return result.affectedRows;
  }
};

module.exports = SupplierModel;
