const express = require('express');
const router = express.Router();
const SaleController = require('../controllers/saleController');

router.post('/', SaleController.recordSale);
router.get('/', SaleController.getAllSales);
router.put('/:id/pay', SaleController.updateSalePayment);
router.get('/balances', SaleController.getVendorBalances);

module.exports = router;
