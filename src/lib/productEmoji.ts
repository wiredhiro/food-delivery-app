/**
 * 商品名から適切な絵文字を返す
 */
export function getProductEmoji(productName: string): string {
  const name = productName.toLowerCase();

  // ハンバーグ
  if (name.includes('ハンバーグ') || name.includes('hamburg')) {
    return '🍖';
  }

  // 寿司・刺身
  if (name.includes('寿司') || name.includes('刺身') || name.includes('sushi') || name.includes('鮨')) {
    return '🍣';
  }

  // ラーメン・麺類
  if (name.includes('ラーメン') || name.includes('うどん') || name.includes('そば') || name.includes('パスタ') || name.includes('ramen')) {
    return '🍜';
  }

  // カレー
  if (name.includes('カレー') || name.includes('curry')) {
    return '🍛';
  }

  // ピザ
  if (name.includes('ピザ') || name.includes('pizza')) {
    return '🍕';
  }

  // サラダ
  if (name.includes('サラダ') || name.includes('salad') || name.includes('野菜')) {
    return '🥗';
  }

  // ステーキ・肉料理
  if (name.includes('ステーキ') || name.includes('steak') || name.includes('焼肉') || name.includes('肉')) {
    return '🥩';
  }

  // 魚料理
  if (name.includes('魚') || name.includes('サーモン') || name.includes('鯖') || name.includes('鰹')) {
    return '🐟';
  }

  // 丼もの
  if (name.includes('丼') || name.includes('どん')) {
    return '🍚';
  }

  // 和食
  if (name.includes('和食') || name.includes('定食') || name.includes('japanese')) {
    return '🍱';
  }

  // 中華
  if (name.includes('中華') || name.includes('餃子') || name.includes('チャーハン') || name.includes('chinese')) {
    return '🥟';
  }

  // デザート・スイーツ
  if (name.includes('デザート') || name.includes('ケーキ') || name.includes('スイーツ') || name.includes('dessert')) {
    return '🍰';
  }

  // スープ
  if (name.includes('スープ') || name.includes('soup')) {
    return '🍲';
  }

  // サンドイッチ
  if (name.includes('サンドイッチ') || name.includes('sandwich') || name.includes('バーガー')) {
    return '🥪';
  }

  // 鶏料理
  if (name.includes('チキン') || name.includes('鶏') || name.includes('chicken')) {
    return '🍗';
  }

  // デフォルト（お弁当）
  return '🍱';
}
