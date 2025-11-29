const cron = require('node-cron');
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'WJ28@krhps',
  database: process.env.DB_NAME || 'campuseats',
};

async function recordAndResetTokens() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    // Create shop_token_history table if not exists
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS shop_token_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        shop_id VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        max_token_number INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_shop_date (shop_id, date)
      )
    `);
    // Get all shops
    const [shops] = await connection.execute('SELECT id FROM shops');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yyyymmdd = yesterday.toISOString().slice(0, 10);
    for (const shop of shops) {
      // Get max token_number for yesterday
      const [rows] = await connection.execute(
        'SELECT MAX(token_number) as max_token FROM orders WHERE shop_id = ? AND DATE(created_at) = ?',
        [shop.id, yyyymmdd]
      );
      const maxToken = rows[0].max_token || 0;
      // Insert or update the record
      await connection.execute(
        'INSERT INTO shop_token_history (shop_id, date, max_token_number) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE max_token_number = VALUES(max_token_number)',
        [shop.id, yyyymmdd, maxToken]
      );
      console.log(`[${new Date().toISOString()}] Recorded max token for shop ${shop.id} on ${yyyymmdd}: ${maxToken}`);
    }
    // Optionally, reset active_tokens field if still used
    await connection.execute('UPDATE shops SET active_tokens = 0');
    console.log(`[${new Date().toISOString()}] Successfully reset active_tokens for all shops.`);
  } catch (err) {
    console.error('Error recording/resetting tokens:', err);
  } finally {
    if (connection) await connection.end();
  }
}

// Schedule the job to run every day at 12:00 AM
cron.schedule('0 0 * * *', recordAndResetTokens);

// For immediate feedback when running manually
if (require.main === module) {
  recordAndResetTokens();
} 