const express = require('express');
const router = express.Router();
const PurchaseController = require('../controllers/purchaseController');

router.post('/', PurchaseController.recordPurchase);
router.get('/', PurchaseController.getAllPurchases);

module.exports = router;
