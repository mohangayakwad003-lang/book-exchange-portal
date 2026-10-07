require('dotenv').config();
const sql = require('mssql');

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER, // e.g. book-server.database.windows.net
  database: process.env.DB_NAME,
  options: {
    encrypt: true, // Crucial: Azure SQL requires TLS/SSL encryption
    enableArithAbort: true,
    trustServerCertificate: false
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Establish a shared connection pool
const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then(pool => {
    console.log('✅ Successfully connected to Azure SQL Database');
    return pool;
  })
  .catch(err => {
    console.error('❌ Database connection failed: ', err.message);
    process.exit(1);
  });

module.exports = { sql, poolPromise };