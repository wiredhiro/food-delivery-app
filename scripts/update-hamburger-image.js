const mysql = require('mysql2/promise');

async function updateHamburgerImage() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'food_delivery',
    socketPath: '/Applications/MAMP/tmp/mysql/mysql.sock'
  });

  try {
    // ハンバーグステーキの画像URLを更新（ステーキ画像）
    const hamburgerImageUrl = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';

    const [result] = await connection.execute(
      `UPDATE products SET image_url = ? WHERE name LIKE '%ハンバーグ%'`,
      [hamburgerImageUrl]
    );

    console.log('✅ ハンバーグステーキの画像を更新しました');
    console.log(`更新された行数: ${result.affectedRows}`);

    // 確認のため更新後のデータを表示
    const [products] = await connection.execute(
      `SELECT id, name, image_url FROM products WHERE name LIKE '%ハンバーグ%'`
    );

    console.log('\n更新後の商品情報:');
    console.table(products);

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    await connection.end();
  }
}

updateHamburgerImage();
