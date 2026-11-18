const { pool } = require('../config/db');

const ReportModel = {
  // 1. Five most frequently sold fruits
  async getTopSoldFruits() {
    const [rows] = await pool.query(`
      SELECT f.fruit_id, f.fruit_name,
             COUNT(sd.sales_detail_id) AS times_sold,
             COALESCE(SUM(sd.quantity), 0) AS total_boxes_sold
      FROM Fruits f
      JOIN Sales_Details sd ON f.fruit_id = sd.fruit_id
      GROUP BY f.fruit_id, f.fruit_name
      ORDER BY total_boxes_sold DESC, times_sold DESC
      LIMIT 5
    `);
    return rows;
  },

  // 2. Total sales revenue generated during a specified date range
  async getRevenueByDateRange(startDate, endDate) {
    const [rows] = await pool.query(`
      SELECT COUNT(sale_id) AS total_transactions,
             COALESCE(SUM(total_amount), 0) AS total_revenue,
             COALESCE(SUM(amount_paid), 0) AS total_collected,
             COALESCE(SUM(total_amount - amount_paid), 0) AS total_outstanding
      FROM Sales
      WHERE DATE(sale_date) BETWEEN ? AND ?
    `, [startDate, endDate]);
    return rows[0];
  },

  // 3. Vendor who has purchased the highest number of boxes
  async getTopVendorByBoxes() {
    const [rows] = await pool.query(`
      SELECT v.vendor_id, v.vendor_name, v.phone_number, v.location,
             COALESCE(SUM(sd.quantity), 0) AS total_boxes_purchased
      FROM Vendors v
      JOIN Sales sa ON v.vendor_id = sa.vendor_id
      JOIN Sales_Details sd ON sa.sale_id = sd.sale_id
      GROUP BY v.vendor_id, v.vendor_name, v.phone_number, v.location
      ORDER BY total_boxes_purchased DESC
      LIMIT 1
    `);
    return rows[0] || null;
  },

  // 4. Current stock levels for each fruit and packaging size
  async getCurrentStockLevels() {
    const [rows] = await pool.query(`
      SELECT f.fruit_id, f.fruit_name, s.packaging_size, s.available_quantity
      FROM Stock s
      JOIN Fruits f ON s.fruit_id = f.fruit_id
      ORDER BY f.fruit_name ASC, FIELD(s.packaging_size, 'small', 'medium', 'large')
    `);
    return rows;
  }
};

module.exports = ReportModel;
