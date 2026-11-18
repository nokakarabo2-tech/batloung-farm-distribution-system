const { pool } = require('../config/db');

const VendorModel = {
  async create({ vendor_name, phone_number, location, registration_date }) {
    const regDate = registration_date || new Date().toISOString().split('T')[0];
    const [result] = await pool.query(
      'INSERT INTO Vendors (vendor_name, phone_number, location, registration_date) VALUES (?, ?, ?, ?)',
      [vendor_name, phone_number, location, regDate]
    );
    return { vendor_id: result.insertId, vendor_name, phone_number, location, registration_date: regDate };
  },

  async findAll() {
    const [rows] = await pool.query('SELECT * FROM Vendors ORDER BY vendor_id ASC');
    return rows;
  },

  async search(query) {
    const searchTerm = `%${query}%`;
    const [rows] = await pool.query(
      'SELECT * FROM Vendors WHERE vendor_name LIKE ? OR phone_number LIKE ?',
      [searchTerm, searchTerm]
    );
    return rows;
  },

  async update(id, { vendor_name, phone_number, location }) {
    const [result] = await pool.query(
      'UPDATE Vendors SET vendor_name = ?, phone_number = ?, location = ? WHERE vendor_id = ?',
      [vendor_name, phone_number, location, id]
    );
    return result.affectedRows;
  }
};

module.exports = VendorModel;
