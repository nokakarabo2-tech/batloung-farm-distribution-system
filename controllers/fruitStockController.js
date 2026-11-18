const FruitStockModel = require('../models/fruitStockModel');

const FruitStockController = {
  async createFruit(req, res, next) {
    try {
      const { fruit_name, description, status } = req.body;
      if (!fruit_name) {
        return res.status(400).json({ success: false, message: 'Fruit name is required.' });
      }
      if (status && !['ACTIVE', 'INACTIVE'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Status must be ACTIVE or INACTIVE.' });
      }
      const fruit = await FruitStockModel.createFruit({ fruit_name, description, status });
      res.status(201).json({ success: true, data: fruit });
    } catch (error) {
      next(error);
    }
  },

  async getAllFruits(req, res, next) {
    try {
      const fruits = await FruitStockModel.findAllFruits();
      res.status(200).json({ success: true, count: fruits.length, data: fruits });
    } catch (error) {
      next(error);
    }
  },

  async updateFruit(req, res, next) {
    try {
      const { fruit_name, description, status } = req.body;
      if (!fruit_name || !status) {
        return res.status(400).json({ success: false, message: 'Fruit name and status are required.' });
      }
      const affected = await FruitStockModel.updateFruit(req.params.id, { fruit_name, description, status });
      if (!affected) {
        return res.status(404).json({ success: false, message: 'Fruit not found.' });
      }
      res.status(200).json({ success: true, message: 'Fruit updated successfully.' });
    } catch (error) {
      next(error);
    }
  },

  async getStockLevels(req, res, next) {
    try {
      const stock = await FruitStockModel.getAllStock();
      res.status(200).json({ success: true, count: stock.length, data: stock });
    } catch (error) {
      next(error);
    }
  },

  async getLowStock(req, res, next) {
    try {
      const threshold = parseInt(req.query.threshold, 10) || 10;
      const lowStock = await FruitStockModel.getLowStock(threshold);
      res.status(200).json({ success: true, threshold, count: lowStock.length, data: lowStock });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = FruitStockController;
