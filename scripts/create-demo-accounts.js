/**
 * デモ用アカウントを作成するスクリプト
 *
 * 使用方法:
 *   node scripts/create-demo-accounts.js
 *
 * 作成されるアカウント:
 *   - demo@example.com / demo1234 (一般ユーザー)
 *   - admin@example.com / admin1234 (管理者)
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// .env.local ファイルから環境変数を読み込む
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const env = {};

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          let value = valueParts.join('=');
          // クォートを除去
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          env[key] = value;
        }
      }
    });
  }

  return env;
}

const env = loadEnvFile();

async function createDemoAccounts() {
  const connection = await mysql.createConnection({
    host: env.DB_HOST || '127.0.0.1',
    port: parseInt(env.DB_PORT || '3306'),
    user: env.DB_USER || 'root',
    password: env.DB_PASSWORD || 'root',
    database: env.DB_NAME || 'food_delivery',
  });

  console.log('データベースに接続しました');

  const demoAccounts = [
    {
      email: 'demo@example.com',
      password: 'demo1234',
      name: 'デモユーザー',
      isAdmin: false,
    },
    {
      email: 'admin@example.com',
      password: 'admin1234',
      name: '管理者',
      isAdmin: true,
    },
  ];

  for (const account of demoAccounts) {
    try {
      // 既存のアカウントを確認
      const [existing] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [account.email]
      );

      if (existing.length > 0) {
        console.log(`アカウント ${account.email} は既に存在します。スキップします。`);
        continue;
      }

      // パスワードをハッシュ化
      const passwordHash = await bcrypt.hash(account.password, 10);

      // アカウントを作成
      await connection.execute(
        'INSERT INTO users (email, password_hash, name, is_admin, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [account.email, passwordHash, account.name, account.isAdmin]
      );

      console.log(`アカウント ${account.email} を作成しました`);
    } catch (error) {
      console.error(`アカウント ${account.email} の作成に失敗:`, error.message);
    }
  }

  await connection.end();
  console.log('完了しました');
}

createDemoAccounts().catch(console.error);
