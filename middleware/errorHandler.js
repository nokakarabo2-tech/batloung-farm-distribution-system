const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  // Handle common MySQL constraint errors gracefully
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry detected. This record already exists.'
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(404).json({
      success: false,
      message: 'Referenced record (Supplier, Fruit, or Vendor) does not exist.'
    });
  }

  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete this record because it is linked to existing purchases or sales.'
    });
  }

  if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
    return res.status(500).json({
      success: false,
      message: 'Database connection error. Please ensure the MySQL server is running.'
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
};

module.exports = errorHandler;
