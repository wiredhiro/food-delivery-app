const mysql = require('mysql2/promise');

async function updateMapoTofuImage() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'food_delivery',
    socketPath: '/Applications/MAMP/tmp/mysql/mysql.sock'
  });

  try {
    // 麻婆豆腐の画像URLを更新（別の中華料理の画像）
    const mapoTofuImageUrl = 'https://images.unsplash.com/photo-1550004960-3a9df0d39f39?w=800&q=80';

    const [result] = await connection.execute(
      `UPDATE products SET image_url = ? WHERE name LIKE '%麻婆豆腐%'`,
      [mapoTofuImageUrl]
    );

    console.log('✅ 麻婆豆腐の画像を更新しました');
    console.log(`更新された行数: ${result.affectedRows}`);

    // 確認のため更新後のデータを表示
    const [products] = await connection.execute(
      `SELECT id, name, image_url FROM products WHERE name LIKE '%麻婆豆腐%'`
    );

    console.log('\n更新後の商品情報:');
    console.table(products);

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    await connection.end();
  }
}

updateMapoTofuImage();
