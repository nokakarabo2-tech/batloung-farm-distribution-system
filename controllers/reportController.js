const ReportModel = require('../models/reportModel');

const ReportController = {
  async topFruits(req, res, next) {
    try {
      const data = await ReportModel.getTopSoldFruits();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async revenueByDateRange(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Please provide both startDate and endDate query parameters (YYYY-MM-DD).'
        });
      }
      const data = await ReportModel.getRevenueByDateRange(startDate, endDate);
      res.status(200).json({ success: true, range: { startDate, endDate }, data });
    } catch (error) {
      next(error);
    }
  },

  async topVendor(req, res, next) {
    try {
      const data = await ReportModel.getTopVendorByBoxes();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async currentStock(req, res, next) {
    try {
      const data = await ReportModel.getCurrentStockLevels();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = ReportController;
