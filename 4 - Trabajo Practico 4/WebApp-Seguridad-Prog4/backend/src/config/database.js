const mysql = require('mysql2');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'vulnerable_app'
};

// Usar pool para manejar múltiples conexiones y permitir query/execute paramétricos
const pool = mysql.createPool(Object.assign({}, dbConfig, {
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONN_LIMIT) || 10,
  queueLimit: 0
}));

// Test de conexión con retry (compatible con pool)
const connectWithRetry = () => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error conectando a MySQL (pool):', err);
      console.log('Reintentando en 5 segundos...');
      setTimeout(connectWithRetry, 5000);
    } else {
      connection.release();
      console.log('Conectado a MySQL (pool)');
    }
  });
};

// exportamos el pool como `db` para mantener compatibilidad con el código existente
module.exports = { db: pool, connectWithRetry };
