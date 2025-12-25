const mysql = require('mysql2/promise');

async function createCouponsTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'food_delivery',
    socketPath: '/Applications/MAMP/tmp/mysql/mysql.sock'
  });

  try {
    console.log('クーポンテーブルを作成しています...');

    // クーポンテーブルを作成
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS coupons (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        discount_type ENUM('percentage', 'fixed_amount') NOT NULL,
        discount_value DECIMAL(10, 2) NOT NULL,
        min_purchase_amount DECIMAL(10, 2),
        max_discount_amount DECIMAL(10, 2),
        usage_limit INT,
        used_count INT NOT NULL DEFAULT 0,
        valid_from DATETIME NOT NULL,
        valid_until DATETIME NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_code (code),
        INDEX idx_valid_from (valid_from),
        INDEX idx_valid_until (valid_until)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('クーポンテーブルの作成が完了しました！');

    // サンプルクーポンを挿入
    console.log('サンプルクーポンを挿入しています...');

    await connection.execute(`
      INSERT INTO coupons (code, description, discount_type, discount_value, min_purchase_amount, max_discount_amount, usage_limit, valid_from, valid_until)
      VALUES
        ('WELCOME10', '初回購入10%オフ', 'percentage', 10.00, 1000.00, 500.00, 100, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY)),
        ('SAVE500', '500円引きクーポン', 'fixed_amount', 500.00, 2000.00, NULL, 50, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY)),
        ('SUMMER20', '夏の大セール20%オフ', 'percentage', 20.00, 3000.00, 1000.00, NULL, NOW(), DATE_ADD(NOW(), INTERVAL 60 DAY))
      ON DUPLICATE KEY UPDATE code=code;
    `);

    console.log('サンプルクーポンの挿入が完了しました！');

    // 挿入されたクーポンを確認
    const [coupons] = await connection.execute('SELECT * FROM coupons');
    console.log('\n作成されたクーポン:');
    console.table(coupons);

  } catch (error) {
    console.error('エラーが発生しました:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

createCouponsTable()
  .then(() => {
    console.log('\n完了しました！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('失敗しました:', error);
    process.exit(1);
  });
