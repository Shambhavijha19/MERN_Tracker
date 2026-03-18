const mysql = require('mysql2/promise');

let pool;

const initializeMySQL = async () => {
    if (pool) {
        return pool;
    }

    const host = process.env.MYSQL_HOST;
    const port = Number(process.env.MYSQL_PORT || 3306);
    const user = process.env.MYSQL_USER;
    const password = process.env.MYSQL_PASSWORD;
    const database = process.env.MYSQL_DATABASE;

    if (!host || !user || !database) {
        throw new Error('MYSQL_HOST, MYSQL_USER and MYSQL_DATABASE must be configured in .env');
    }

    pool = mysql.createPool({
        host,
        port,
        user,
        password,
        database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(190) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      avatar VARCHAR(255) DEFAULT '',
      role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
      is_email_verified BOOLEAN NOT NULL DEFAULT TRUE,
      currency CHAR(3) NOT NULL DEFAULT 'INR',
      last_login DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_users_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

    const [rows] = await pool.query('SELECT 1 AS ok');
    if (!rows || rows.length === 0) {
        throw new Error('MySQL ping failed');
    }

    return pool;
};

const getMySQLPool = () => {
    if (!pool) {
        throw new Error('MySQL pool not initialized. Call initializeMySQL() first.');
    }
    return pool;
};

module.exports = {
    initializeMySQL,
    getMySQLPool
};
