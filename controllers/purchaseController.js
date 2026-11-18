const PurchaseModel = require('../models/purchaseModel');

const VALID_SIZES = ['small', 'medium', 'large'];

const PurchaseController = {
  async recordPurchase(req, res, next) {
    try {
      const { supplier_id, items } = req.body;

      if (!supplier_id || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'supplier_id and a non-empty array of items are required.'
        });
      }

      for (const item of items) {
        if (!item.fruit_id || !item.quantity || item.quantity <= 0 || item.unit_cost === undefined || item.unit_cost < 0) {
          return res.status(400).json({
            success: false,
            message: 'Each item must have valid fruit_id, quantity (> 0), and unit_cost (>= 0).'
          });
        }
        if (!VALID_SIZES.includes(item.packaging_size)) {
          return res.status(400).json({
            success: false,
            message: 'packaging_size must be small, medium, or large.'
          });
        }
      }

      const purchase = await PurchaseModel.createPurchase({ supplier_id, items });
      res.status(201).json({
        success: true,
        message: 'Purchase recorded and stock updated successfully.',
        data: purchase
      });
    } catch (error) {
      next(error);
    }
  },

  async getAllPurchases(req, res, next) {
    try {
      const purchases = await PurchaseModel.findAll();
      res.status(200).json({ success: true, count: purchases.length, data: purchases });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = PurchaseController;
