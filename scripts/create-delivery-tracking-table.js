const mysql = require('mysql2/promise');

async function createDeliveryTrackingTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'food_delivery',
    socketPath: '/Applications/MAMP/tmp/mysql/mysql.sock',
  });

  try {
    console.log('配送トラッキングテーブルを作成中...');

    // 配送トラッキングテーブル作成
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS delivery_tracking (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        order_id BIGINT UNSIGNED NOT NULL,
        status ENUM('pending', 'preparing', 'ready_for_shipping', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
        status_description VARCHAR(255),
        location VARCHAR(255),
        estimated_delivery DATETIME,
        actual_delivery DATETIME,
        carrier VARCHAR(100),
        tracking_number VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        INDEX idx_order_id (order_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ delivery_tracking テーブルを作成しました');

    // 既存の注文に初期の配送トラッキングレコードを作成
    const [orders] = await connection.execute('SELECT id, created_at FROM orders');

    for (const order of orders) {
      // 既存のトラッキングレコードがあるかチェック
      const [existing] = await connection.execute(
        'SELECT id FROM delivery_tracking WHERE order_id = ?',
        [order.id]
      );

      if (existing.length === 0) {
        await connection.execute(`
          INSERT INTO delivery_tracking (order_id, status, status_description, estimated_delivery)
          VALUES (?, 'preparing', '注文を準備中です', DATE_ADD(?, INTERVAL 2 DAY))
        `, [order.id, order.created_at]);
      }
    }

    console.log(`✅ ${orders.length}件の既存注文に配送トラッキングレコードを作成しました`);

  } catch (error) {
    console.error('エラーが発生しました:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

createDeliveryTrackingTable()
  .then(() => {
    console.log('\n完了しました！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('失敗しました:', error);
    process.exit(1);
  });
