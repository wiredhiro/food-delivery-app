const mysql = require('mysql2/promise');

async function resetProductImages() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'food_delivery',
    socketPath: '/Applications/MAMP/tmp/mysql/mysql.sock'
  });

  try {
    console.log('🔄 商品画像を元に戻しています...\n');

    // すべての商品のimage_urlをNULLに設定
    const [result] = await connection.execute(
      'UPDATE products SET image_url = NULL'
    );

    console.log(`✅ ${result.affectedRows}件の商品画像をリセットしました\n`);

    // 確認のため更新後のデータを表示
    const [products] = await connection.execute(
      'SELECT id, name, image_url FROM products ORDER BY id'
    );

    console.log('📊 更新後の商品情報:');
    console.table(products);

    console.log('\n✨ すべての商品画像を絵文字アイコン表示に戻しました！');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    await connection.end();
  }
}

resetProductImages();
