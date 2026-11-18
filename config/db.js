const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Function to verify database connection without crashing the app
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(' Connected to MySQL database: ' + process.env.DB_NAME);
    connection.release();
  } catch (error) {
    console.error(' Database connection failed:', error.message);
    console.error('Server will continue running, but database operations will fail until MySQL is reachable.');
  }
};

module.exports = { pool, testConnection };
