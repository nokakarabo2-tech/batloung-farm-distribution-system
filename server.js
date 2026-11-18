const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Import All Routes
const supplierRoutes = require('./routes/supplierRoutes');
const fruitStockRoutes = require('./routes/fruitStockRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const saleRoutes = require('./routes/saleRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mount All REST API Routes
app.use('/api/suppliers', supplierRoutes);
app.use('/api/fruits', fruitStockRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/reports', reportRoutes);

// Global Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await testConnection();
});

// Prevent unexpected termination on unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
});
