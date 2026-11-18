const SaleModel = require('../models/saleModel');

const VALID_SIZES = ['small', 'medium', 'large'];
const VALID_PAYMENT_METHODS = ['Cash', 'Mobile Money', 'Credit'];

const SaleController = {
  async recordSale(req, res, next) {
    try {
      const { vendor_id, payment_method, amount_paid, items } = req.body;

      if (!vendor_id || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'vendor_id and a non-empty array of items are required.'
        });
      }

      if (payment_method && !VALID_PAYMENT_METHODS.includes(payment_method)) {
        return res.status(400).json({
          success: false,
          message: 'payment_method must be Cash, Mobile Money, or Credit.'
        });
      }

      if (amount_paid !== undefined && Number(amount_paid) < 0) {
        return res.status(400).json({
          success: false,
          message: 'amount_paid cannot be negative.'
        });
      }

      for (const item of items) {
        if (!item.fruit_id || !item.quantity || item.quantity <= 0 || item.unit_price === undefined || item.unit_price < 0) {
          return res.status(400).json({
            success: false,
            message: 'Each item must have valid fruit_id, quantity (> 0), and unit_price (>= 0).'
          });
        }
        if (!VALID_SIZES.includes(item.packaging_size)) {
          return res.status(400).json({
            success: false,
            message: 'packaging_size must be small, medium, or large.'
          });
        }
      }

      const sale = await SaleModel.createSale({ vendor_id, payment_method, amount_paid, items });
      res.status(201).json({
        success: true,
        message: 'Sale recorded and stock deducted successfully.',
        data: sale
      });
    } catch (error) {
      next(error);
    }
  },

  async getAllSales(req, res, next) {
    try {
      const sales = await SaleModel.findAll();
      res.status(200).json({ success: true, count: sales.length, data: sales });
    } catch (error) {
      next(error);
    }
  },

  async updateSalePayment(req, res, next) {
    try {
      const { additional_payment, payment_method } = req.body;
      if (!additional_payment || Number(additional_payment) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'additional_payment must be greater than 0.'
        });
      }
      if (payment_method && !VALID_PAYMENT_METHODS.includes(payment_method)) {
        return res.status(400).json({
          success: false,
          message: 'payment_method must be Cash, Mobile Money, or Credit.'
        });
      }

      const updated = await SaleModel.recordPayment(req.params.id, { additional_payment, payment_method });
      res.status(200).json({
        success: true,
        message: 'Payment recorded successfully.',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  },

  async getVendorBalances(req, res, next) {
    try {
      const balances = await SaleModel.getVendorBalances();
      res.status(200).json({ success: true, count: balances.length, data: balances });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = SaleController;
