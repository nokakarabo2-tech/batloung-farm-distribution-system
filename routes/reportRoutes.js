const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/reportController');

router.get('/top-fruits', ReportController.topFruits);
router.get('/revenue', ReportController.revenueByDateRange);
router.get('/top-vendor', ReportController.topVendor);
router.get('/stock', ReportController.currentStock);

module.exports = router;
