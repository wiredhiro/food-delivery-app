import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

// データベース接続の作成 (Homebrew MySQL - TCP接続)
const connection = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'food_delivery',
  charset: 'utf8mb4',
});

// Drizzle ORMインスタンスの作成
export const db = drizzle(connection, { schema, mode: 'default' });
