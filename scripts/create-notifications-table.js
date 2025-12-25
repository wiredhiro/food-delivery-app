const mysql = require('mysql2/promise');

async function createNotificationsTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'food_delivery',
    socketPath: '/Applications/MAMP/tmp/mysql/mysql.sock'
  });

  console.log('通知テーブルを作成中...');

  // 通知テーブルを作成
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type ENUM('order_update', 'promotion', 'system', 'stock_alert') NOT NULL DEFAULT 'system',
      related_order_id BIGINT UNSIGNED,
      is_read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      read_at TIMESTAMP NULL,
      INDEX idx_user_id (user_id),
      INDEX idx_is_read (is_read),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log('✓ 通知テーブル作成完了');

  // サンプル通知を作成
  console.log('\nサンプル通知を作成中...');

  // ユーザーID 1 のサンプル通知
  await connection.execute(`
    INSERT INTO notifications (user_id, title, message, type, related_order_id, is_read) VALUES
    (1, 'ご注文ありがとうございます', 'ご注文（注文番号: #4）を受け付けました。', 'order_update', 4, false),
    (1, '配送準備が完了しました', 'ご注文（注文番号: #4）の配送準備が完了しました。まもなく発送されます。', 'order_update', 4, false),
    (1, '期間限定セール開催中', '全商品20%オフ！このチャンスをお見逃しなく。', 'promotion', NULL, false),
    (1, '配達完了', 'ご注文（注文番号: #3）が配達完了しました。ご利用ありがとうございました。', 'order_update', 3, true)
  `);

  console.log('✓ サンプル通知作成完了');

  // 作成した通知を確認
  const [rows] = await connection.execute(`
    SELECT * FROM notifications WHERE user_id = 1 ORDER BY created_at DESC
  `);

  console.log('\n作成された通知:');
  rows.forEach((row, index) => {
    console.log(`\n${index + 1}. ${row.title}`);
    console.log(`   メッセージ: ${row.message}`);
    console.log(`   タイプ: ${row.type}`);
    console.log(`   既読: ${row.is_read ? 'はい' : 'いいえ'}`);
    console.log(`   作成日時: ${row.created_at}`);
  });

  await connection.end();
  console.log('\n完了しました！');
}

createNotificationsTable().catch(console.error);
