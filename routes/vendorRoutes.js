const express = require('express');
const router = express.Router();
const VendorController = require('../controllers/vendorController');

router.post('/', VendorController.createVendor);
router.get('/', VendorController.getAllVendors);
router.get('/search', VendorController.searchVendors);
router.put('/:id', VendorController.updateVendor);

module.exports = router;
