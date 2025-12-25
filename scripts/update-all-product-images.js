const mysql = require('mysql2/promise');

async function updateAllProductImages() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'food_delivery',
    socketPath: '/Applications/MAMP/tmp/mysql/mysql.sock'
  });

  try {
    // 各商品に適した食べ物の画像URLを設定
    const productImages = [
      { id: 1, name: '鮭の塩焼き弁当', url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80' },
      { id: 2, name: '親子丼', url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80' },
      { id: 3, name: 'ハンバーグステーキ', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80' },
      { id: 4, name: 'カルボナーラ', url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&q=80' },
      { id: 5, name: '麻婆豆腐', url: 'https://images.unsplash.com/photo-1583196835751-5a8a6f0bb0dc?w=800&q=80' },
      { id: 6, name: '酢豚', url: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&q=80' },
      { id: 7, name: 'グリルチキンサラダ', url: 'https://images.unsplash.com/photo-1546069901-eacef0df6022?w=800&q=80' },
      { id: 8, name: 'キヌアボウル', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80' }
    ];

    console.log('🔄 商品画像を更新中...\n');

    for (const product of productImages) {
      const [result] = await connection.execute(
        'UPDATE products SET image_url = ? WHERE id = ?',
        [product.url, product.id]
      );

      if (result.affectedRows > 0) {
        console.log(`✅ ${product.name} の画像を更新しました`);
      }
    }

    console.log('\n📊 更新後の商品情報:');
    const [products] = await connection.execute(
      'SELECT id, name, image_url FROM products ORDER BY id'
    );
    console.table(products);

    console.log('\n✨ すべての商品画像の更新が完了しました！');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    await connection.end();
  }
}

updateAllProductImages();
