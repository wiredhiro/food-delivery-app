# 食事宅配サービス

Next.js、TypeScript、tRPC、Drizzle ORM、MySQLを使用したフルスタック食事宅配ECサイト

## 主な機能

### ユーザー機能
- ✅ ユーザー登録・ログイン（メール・パスワード認証）
- ✅ プロフィール管理
- ✅ 配送先住所管理（複数住所対応、デフォルト設定）

### 商品機能
- ✅ 商品一覧・詳細表示
- ✅ カテゴリー分類
- ✅ 検索・フィルター機能（キーワード、カテゴリー、価格、在庫、評価）
- ✅ お気に入り機能
- ✅ レビュー・評価システム（購入確認機能付き）

### 注文機能
- ✅ ショッピングカート
- ✅ チェックアウト（住所選択、新規住所入力）
- ✅ クーポン・割引機能（パーセント割引・固定額割引）
- ✅ 決済処理（モック実装）
- ✅ 注文履歴
- ✅ 再注文機能（在庫確認付き）
- ✅ 注文確認メール送信

### 配送機能
- ✅ 配送状況トラッキング（8段階のステータス）
- ✅ 配送業者・追跡番号管理
- ✅ 配達予定日設定
- ✅ 配送通知メール送信

### 通知機能
- ✅ リアルタイム通知（注文ステータス変更時）
- ✅ 未読カウント表示
- ✅ 通知一覧・既読管理

### 管理機能
- ✅ 商品管理（作成・編集・削除・在庫管理）
- ✅ 注文管理（ステータス更新）
- ✅ クーポン管理
- ✅ 配送状況更新
- ✅ ダッシュボード（統計表示）

## 技術スタック

- **フロントエンド**: Next.js 16.1.0 (App Router), TypeScript, Tailwind CSS
- **バックエンド**: tRPC (型安全なAPI)
- **データベース**: MySQL 8.0
- **ORM**: Drizzle ORM
- **状態管理**: React Context API (認証、カート、お気に入り)
- **メール送信**: Nodemailer (SMTP)

## セットアップ

### 前提条件

- Node.js 18以上
- MySQL 8.0以上（MAMP、XAMPP、またはローカルMySQL）
- npm または yarn

### インストール手順

1. **リポジトリをクローン**
```bash
git clone <repository-url>
cd 0_test_full_stack
```

2. **依存パッケージをインストール**
```bash
npm install
```

3. **環境変数を設定**
```bash
cp .env.example .env.local
```

`.env.local` を編集して、データベース接続情報を設定してください：
```env
DATABASE_URL="mysql://root:root@localhost/food_delivery?socket=/Applications/MAMP/tmp/mysql/mysql.sock"
DB_HOST="127.0.0.1"
DB_PORT="8889"
DB_USER="root"
DB_PASSWORD="root"
DB_NAME="food_delivery"
```

4. **データベースを作成**
```bash
# MySQLにログイン
mysql -u root -p

# データベースを作成
CREATE DATABASE food_delivery CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;
```

5. **データベーステーブルを作成**
```bash
# スクリプトを順番に実行
node scripts/create-sample-data.js
node scripts/create-reviews-table.js
node scripts/create-coupons-table.js
node scripts/create-notifications-table.js
```

6. **開発サーバーを起動**
```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

## メール通知設定（オプション）

開発環境では、メールは実際には送信されず、コンソールにログ出力されます。

実際にメールを送信するには、`.env.local` に以下を設定してください：

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="食事宅配サービス <noreply@food-delivery.com>"
```

**Gmailを使用する場合:**
1. Googleアカウントで2段階認証を有効化
2. アプリパスワードを生成（セキュリティ > 2段階認証 > アプリパスワード）
3. `SMTP_USER` と `SMTP_PASS` に設定

## デモユーザー

サンプルデータスクリプトを実行すると、以下のユーザーが作成されます：

- **メール**: `test@example.com`
- **パスワード**: `password123`
- **管理者権限**: あり

## ビルド

本番用ビルドを作成：
```bash
npm run build
```

本番サーバーを起動：
```bash
npm start
```

## ディレクトリ構造

```
0_test_full_stack/
├── src/
│   ├── app/              # Next.js App Router ページ
│   ├── components/       # Reactコンポーネント
│   ├── contexts/         # React Context（認証、カート、お気に入り）
│   ├── lib/              # ユーティリティ関数
│   └── server/
│       ├── api/
│       │   └── routers/  # tRPC APIルーター
│       └── db/           # データベース設定・スキーマ
├── scripts/              # データベースマイグレーション
└── public/               # 静的ファイル
```

## ライセンス

MIT

## 注意事項

このプロジェクトは学習・デモ目的で作成されました。本番環境で使用する場合は、以下を検討してください：

- セキュリティの強化（CSRF対策、レート制限など）
- 決済処理の実装（Stripe、PayPal連携）
- 画像アップロード機能の実装
- エラー監視（Sentry など）
- パフォーマンス最適化
- テストの追加
