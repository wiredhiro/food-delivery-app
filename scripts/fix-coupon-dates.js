const mysql = require('mysql2/promise');

async function fixCouponDates() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'food_delivery',
    socketPath: '/Applications/MAMP/tmp/mysql/mysql.sock'
  });

  console.log('全クーポンの有効期限を修正中...');

  // 全クーポンの valid_from を現在時刻より前に設定
  const result = await connection.execute(
    `UPDATE coupons
     SET valid_from = DATE_SUB(NOW(), INTERVAL 1 DAY),
         valid_until = DATE_ADD(NOW(), INTERVAL 30 DAY)`
  );

  console.log('更新完了:', result[0]);

  // 全クーポンを確認
  const [rows] = await connection.execute(
    'SELECT code, description, valid_from, valid_until, NOW() as now_time FROM coupons ORDER BY code'
  );

  console.log('\n更新後のクーポン一覧:');
  rows.forEach(row => {
    console.log('\n---');
    console.log('コード:', row.code);
    console.log('説明:', row.description);
    console.log('有効開始:', row.valid_from);
    console.log('有効終了:', row.valid_until);
    console.log('現在時刻:', row.now_time);
  });

  await connection.end();
}

fixCouponDates().catch(console.error);
