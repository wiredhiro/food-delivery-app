-- サンプルデータの挿入

-- カテゴリー
INSERT INTO `categories` (`name`, `description`) VALUES
('和食', '日本の伝統的な料理'),
('洋食', '西洋料理'),
('中華', '中国料理'),
('健康食', 'ヘルシーで栄養バランスの良い食事');

-- 商品
INSERT INTO `products` (`category_id`, `name`, `description`, `price`, `stock`, `image_url`) VALUES
(1, '鮭の塩焼き弁当', '新鮮な鮭の塩焼きと季節の野菜を使った栄養バランスの良いお弁当', 980.00, 50, 'https://images.unsplash.com/photo-1628294895950-9805252327bc?w=500'),
(1, '親子丼', '国産鶏肉と卵を使った人気の丼もの', 850.00, 40, 'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=500'),
(2, 'ハンバーグステーキ', 'ジューシーなハンバーグにデミグラスソースをかけた洋食の定番', 1200.00, 30, 'https://images.unsplash.com/photo-1546833998-877b37c2e5c6?w=500'),
(2, 'カルボナーラ', '濃厚なクリームソースとベーコンのパスタ', 950.00, 35, 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=500'),
(3, '麻婆豆腐', 'ピリ辛で本格的な四川風麻婆豆腐', 880.00, 45, 'https://images.unsplash.com/photo-1642821373181-696a54913e93?w=500'),
(3, '酢豚', '甘酸っぱいタレが絡んだ豚肉と野菜の炒め物', 1050.00, 25, 'https://images.unsplash.com/photo-1635167432555-f43d32f28e47?w=500'),
(4, 'グリルチキンサラダ', 'タンパク質豊富なグリルチキンと新鮮野菜のサラダ', 780.00, 60, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'),
(4, 'キヌアボウル', 'スーパーフードキヌアと季節の野菜、アボカドのヘルシーボウル', 920.00, 40, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500');
