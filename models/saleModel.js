const { pool } = require('../config/db');

// Helper function to calculate total sales amount automatically
const calculateTotalSalesAmount = (items) => {
  return items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price), 0);
};

// Helper to determine payment status
const determinePaymentStatus = (totalAmount, amountPaid) => {
  if (amountPaid >= totalAmount) return 'PAID';
  if (amountPaid > 0 && amountPaid < totalAmount) return 'PARTIALLY_PAID';
  return 'UNPAID';
};

const SaleModel = {
  async createSale({ vendor_id, payment_method = 'Cash', amount_paid = 0, items }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Verify vendor exists
      const [vendors] = await connection.query('SELECT vendor_id FROM Vendors WHERE vendor_id = ?', [vendor_id]);
      if (vendors.length === 0) {
        const err = new Error('Registered vendor not found.');
        err.statusCode = 404;
        throw err;
      }

      // 2. Automatically calculate total amount & payment status
      const totalAmount = calculateTotalSalesAmount(items);
      const paid = Number(amount_paid);
      if (paid > totalAmount) {
        const err = new Error(`Amount paid (${paid}) cannot exceed total sale amount (${totalAmount}).`);
        err.statusCode = 400;
        throw err;
      }
      const paymentStatus = determinePaymentStatus(totalAmount, paid);

      // 3. Insert main sale record
      const [saleResult] = await connection.query(
        'INSERT INTO Sales (vendor_id, payment_method, payment_status, total_amount, amount_paid) VALUES (?, ?, ?, ?, ?)',
        [vendor_id, payment_method, paymentStatus, totalAmount, paid]
      );
      const saleId = saleResult.insertId;

      // 4. Process each item: lock stock row, check availability, deduct stock, insert detail
      for (const item of items) {
        const { fruit_id, packaging_size, quantity, unit_price } = item;

        // Lock stock row with FOR UPDATE to prevent race conditions and negative stock
        const [stockRows] = await connection.query(
          `SELECT s.available_quantity, f.fruit_name
           FROM Stock s
           JOIN Fruits f ON s.fruit_id = f.fruit_id
           WHERE s.fruit_id = ? AND s.packaging_size = ?
           FOR UPDATE`,
          [fruit_id, packaging_size]
        );

        if (stockRows.length === 0) {
          const err = new Error(`No stock record found for fruit ID ${fruit_id} (${packaging_size}).`);
          err.statusCode = 404;
          throw err;
        }

        const available = stockRows[0].available_quantity;
        const fruitName = stockRows[0].fruit_name;

        // Reject entire transaction if requested quantity exceeds available stock
        if (available < quantity) {
          const err = new Error(
            `Insufficient stock for ${fruitName} (${packaging_size}). Requested: ${quantity}, Available: ${available}. Transaction rolled back.`
          );
          err.statusCode = 400;
          throw err;
        }

        // Insert sale detail
        await connection.query(
          'INSERT INTO Sales_Details (sale_id, fruit_id, packaging_size, quantity, unit_price) VALUES (?, ?, ?, ?, ?)',
          [saleId, fruit_id, packaging_size, quantity, unit_price]
        );

        // Deduct available stock
        await connection.query(
          'UPDATE Stock SET available_quantity = available_quantity - ? WHERE fruit_id = ? AND packaging_size = ?',
          [quantity, fruit_id, packaging_size]
        );
      }

      await connection.commit();
      return {
        sale_id: saleId,
        vendor_id,
        payment_method,
        payment_status: paymentStatus,
        total_amount: totalAmount,
        amount_paid: paid,
        outstanding_balance: totalAmount - paid,
        items
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async findAll() {
    const [rows] = await pool.query(`
      SELECT sa.sale_id, sa.sale_date, v.vendor_name, sa.payment_method, sa.payment_status,
             sa.total_amount, sa.amount_paid, (sa.total_amount - sa.amount_paid) AS outstanding_balance
      FROM Sales sa
      JOIN Vendors v ON sa.vendor_id = v.vendor_id
      ORDER BY sa.sale_date DESC
    `);
    return rows;
  },

  async recordPayment(saleId, { additional_payment, payment_method }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [sales] = await connection.query('SELECT * FROM Sales WHERE sale_id = ? FOR UPDATE', [saleId]);
      if (sales.length === 0) {
        const err = new Error('Sale record not found.');
        err.statusCode = 404;
        throw err;
      }

      const sale = sales[0];
      const newAmountPaid = Number(sale.amount_paid) + Number(additional_payment);
      const totalAmount = Number(sale.total_amount);

      if (newAmountPaid > totalAmount) {
        const err = new Error(`Payment exceeds remaining balance. Remaining balance is ${(totalAmount - Number(sale.amount_paid)).toFixed(2)}.`);
        err.statusCode = 400;
        throw err;
      }

      const newStatus = determinePaymentStatus(totalAmount, newAmountPaid);
      const method = payment_method || sale.payment_method;

      await connection.query(
        'UPDATE Sales SET amount_paid = ?, payment_status = ?, payment_method = ? WHERE sale_id = ?',
        [newAmountPaid, newStatus, method, saleId]
      );

      await connection.commit();
      return {
        sale_id: Number(saleId),
        total_amount: totalAmount,
        amount_paid: newAmountPaid,
        outstanding_balance: totalAmount - newAmountPaid,
        payment_status: newStatus,
        payment_method: method
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async getVendorBalances() {
    const [rows] = await pool.query(`
      SELECT v.vendor_id, v.vendor_name, v.phone_number,
             COALESCE(SUM(sa.total_amount), 0) AS total_billed,
             COALESCE(SUM(sa.amount_paid), 0) AS total_paid,
             COALESCE(SUM(sa.total_amount - sa.amount_paid), 0) AS outstanding_balance
      FROM Vendors v
      LEFT JOIN Sales sa ON v.vendor_id = sa.vendor_id
      GROUP BY v.vendor_id, v.vendor_name, v.phone_number
      ORDER BY outstanding_balance DESC
    `);
    return rows;
  }
};

module.exports = SaleModel;
