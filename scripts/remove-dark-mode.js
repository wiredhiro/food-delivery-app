const fs = require('fs');
const path = require('path');

// dark: クラスを削除する関数
function removeDarkModeClasses(content) {
  // dark:で始まるクラスを削除
  // 例: "bg-white dark:bg-gray-900" -> "bg-white"
  // 例: "dark:bg-gray-900 text-white" -> "text-white"

  let result = content;

  // パターン1: dark:classname の形式を削除
  result = result.replace(/\s+dark:[a-zA-Z0-9\-:\/\[\]\.]+/g, '');

  // パターン2: 行頭の dark:classname を削除
  result = result.replace(/^(\s*)dark:[a-zA-Z0-9\-:\/\[\]\.]+\s*/gm, '$1');

  // 連続する空白を1つにまとめる
  result = result.replace(/  +/g, ' ');

  // className内の余分な空白を削除
  result = result.replace(/className="([^"]*?)"/g, (match, classes) => {
    const cleanedClasses = classes.trim().replace(/\s+/g, ' ');
    return `className="${cleanedClasses}"`;
  });

  return result;
}

// 対象ファイルのリスト
const files = [
  'src/app/order-complete/page.tsx',
  'src/app/products/[id]/page.tsx',
  'src/app/products/page.tsx',
  'src/app/payment/[orderId]/page.tsx',
  'src/app/signup/page.tsx',
  'src/app/favorites/page.tsx',
  'src/app/admin/products/page.tsx',
  'src/app/admin/orders/page.tsx',
  'src/app/admin/page.tsx',
  'src/app/checkout/page.tsx',
  'src/app/profile/edit/page.tsx',
  'src/app/profile/addresses/page.tsx',
  'src/app/profile/orders/page.tsx',
  'src/app/profile/page.tsx',
  'src/app/cart/page.tsx',
  'src/app/orders/[id]/page.tsx',
  'src/app/orders/page.tsx',
  'src/app/login/page.tsx',
  'src/components/Header.tsx',
];

console.log('ダークモードクラスを削除中...\n');

let processedCount = 0;
let errorCount = 0;

files.forEach((filePath) => {
  const fullPath = path.join(process.cwd(), filePath);

  try {
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  スキップ: ${filePath} (ファイルが見つかりません)`);
      return;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const updated = removeDarkModeClasses(content);

    if (content !== updated) {
      fs.writeFileSync(fullPath, updated, 'utf8');
      console.log(`✅ 更新: ${filePath}`);
      processedCount++;
    } else {
      console.log(`➖ 変更なし: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ エラー: ${filePath}`, error.message);
    errorCount++;
  }
});

console.log(`\n完了: ${processedCount}個のファイルを更新しました`);
if (errorCount > 0) {
  console.log(`エラー: ${errorCount}個のファイルで処理に失敗しました`);
}
