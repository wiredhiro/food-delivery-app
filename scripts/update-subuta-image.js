const mysql = require('mysql2/promise');

async function updateSubutaImage() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'food_delivery',
    socketPath: '/Applications/MAMP/tmp/mysql/mysql.sock'
  });

  try {
    // 酢豚の画像URLを更新（中華料理の画像）
    const subutaImageUrl = 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&q=80';

    const [result] = await connection.execute(
      `UPDATE products SET image_url = ? WHERE name LIKE '%酢豚%'`,
      [subutaImageUrl]
    );

    console.log('✅ 酢豚の画像を更新しました');
    console.log(`更新された行数: ${result.affectedRows}`);

    // 確認のため更新後のデータを表示
    const [products] = await connection.execute(
      `SELECT id, name, image_url FROM products WHERE name LIKE '%酢豚%'`
    );

    console.log('\n更新後の商品情報:');
    console.table(products);

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    await connection.end();
  }
}

updateSubutaImage();
