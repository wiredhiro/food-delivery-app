const mysql = require('mysql2/promise');

async function createPaymentTables() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'food_delivery',
    socketPath: '/Applications/MAMP/tmp/mysql/mysql.sock'
  });

  try {
    console.log('🔄 決済関連テーブルを作成中...\n');

    // 決済方法テーブル
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        type VARCHAR(50) NOT NULL COMMENT 'credit_card, debit_card',
        cardholder_name VARCHAR(100) NOT NULL,
        card_number_last4 VARCHAR(4) NOT NULL COMMENT '下4桁のみ保存',
        card_brand VARCHAR(50) COMMENT 'Visa, Mastercard, etc.',
        expiry_month INT NOT NULL,
        expiry_year INT NOT NULL,
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ payment_methods テーブルを作成しました');

    // 決済トランザクションテーブル
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        order_id BIGINT UNSIGNED NOT NULL,
        payment_method_id BIGINT UNSIGNED,
        amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending' COMMENT 'pending, processing, completed, failed, refunded',
        transaction_id VARCHAR(255) COMMENT '外部決済サービスのトランザクションID',
        error_message TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ payment_transactions テーブルを作成しました');

    // テーブルの確認
    const [tables] = await connection.execute(`
      SHOW TABLES LIKE 'payment%'
    `);
    console.log('\n📊 作成されたテーブル:');
    console.table(tables);

    console.log('\n✨ すべての決済関連テーブルの作成が完了しました！');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    await connection.end();
  }
}

createPaymentTables();
