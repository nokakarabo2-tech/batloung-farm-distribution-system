const express = require('express');
const router = express.Router();
const FruitStockController = require('../controllers/fruitStockController');

router.post('/', FruitStockController.createFruit);
router.get('/', FruitStockController.getAllFruits);
router.put('/:id', FruitStockController.updateFruit);
router.get('/stock', FruitStockController.getStockLevels);
router.get('/stock/low', FruitStockController.getLowStock);

module.exports = router;
