import { mysqlTable, serial, varchar, text, int, bigint, decimal, timestamp, boolean, json, mysqlEnum, datetime } from 'drizzle-orm/mysql-core';

// ユーザーテーブル
export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }),
  isAdmin: boolean('is_admin').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

// ユーザープロフィール（パーソナライズ情報）
export const userProfiles = mysqlTable('user_profiles', {
  id: serial('id').primaryKey(),
  userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull().references(() => users.id),
  allergies: json('allergies').$type<string[]>(), // アレルギー情報
  dietaryRestrictions: json('dietary_restrictions').$type<string[]>(), // 食事制限
  preferences: json('preferences').$type<Record<string, any>>(), // 好み
  healthGoals: text('health_goals'), // 健康目標
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

// 住所テーブル
export const addresses = mysqlTable('addresses', {
  id: serial('id').primaryKey(),
  userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull().references(() => users.id),
  name: varchar('name', { length: 100 }).notNull(), // 宛名
  postalCode: varchar('postal_code', { length: 10 }).notNull(),
  prefecture: varchar('prefecture', { length: 50 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  addressLine1: varchar('address_line1', { length: 255 }).notNull(),
  addressLine2: varchar('address_line2', { length: 255 }),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull(), // 電話番号
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

// カテゴリーテーブル
export const categories = mysqlTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

// 商品テーブル
export const products = mysqlTable('products', {
  id: serial('id').primaryKey(),
  categoryId: bigint('category_id', { mode: 'number', unsigned: true }).references(() => categories.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  imageUrl: varchar('image_url', { length: 500 }),
  nutritionInfo: json('nutrition_info').$type<Record<string, any>>(), // 栄養情報
  ingredients: json('ingredients').$type<string[]>(), // 原材料
  allergens: json('allergens').$type<string[]>(), // アレルゲン
  stock: int('stock').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

// 注文テーブル
export const orders = mysqlTable('orders', {
  id: serial('id').primaryKey(),
  userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull().references(() => users.id),
  addressId: bigint('address_id', { mode: 'number', unsigned: true }).notNull().references(() => addresses.id),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, confirmed, preparing, shipped, delivered, cancelled
  paymentStatus: varchar('payment_status', { length: 50 }).notNull().default('pending'), // pending, paid, failed
  deliveryDate: timestamp('delivery_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

// 注文明細テーブル
export const orderItems = mysqlTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: bigint('order_id', { mode: 'number', unsigned: true }).notNull().references(() => orders.id),
  productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull().references(() => products.id),
  quantity: int('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// サブスクリプションテーブル
export const subscriptions = mysqlTable('subscriptions', {
  id: serial('id').primaryKey(),
  userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull().references(() => users.id),
  planType: varchar('plan_type', { length: 50 }).notNull(), // weekly, monthly
  status: varchar('status', { length: 50 }).notNull().default('active'), // active, paused, cancelled
  deliveryFrequency: int('delivery_frequency').notNull(), // 配送頻度（日数）
  nextDeliveryDate: timestamp('next_delivery_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

// レビューテーブル
export const reviews = mysqlTable('reviews', {
  id: serial('id').primaryKey(),
  productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull().references(() => products.id),
  userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull().references(() => users.id),
  orderId: bigint('order_id', { mode: 'number', unsigned: true }).references(() => orders.id), // 購入確認用（任意）
  rating: int('rating').notNull(), // 1-5の評価
  title: varchar('title', { length: 100 }),
  comment: text('comment'),
  isVerifiedPurchase: boolean('is_verified_purchase').notNull().default(false), // 購入済み確認
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

// お気に入りテーブル
export const favorites = mysqlTable('favorites', {
  id: serial('id').primaryKey(),
  userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull().references(() => users.id),
  productId: bigint('product_id', { mode: 'number', unsigned: true }).notNull().references(() => products.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 決済方法テーブル
export const paymentMethods = mysqlTable('payment_methods', {
  id: serial('id').primaryKey(),
  userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull().references(() => users.id),
  type: varchar('type', { length: 50 }).notNull(), // credit_card, debit_card
  cardholderName: varchar('cardholder_name', { length: 100 }).notNull(),
  cardNumberLast4: varchar('card_number_last4', { length: 4 }).notNull(), // 下4桁のみ保存
  cardBrand: varchar('card_brand', { length: 50 }), // Visa, Mastercard, etc.
  expiryMonth: int('expiry_month').notNull(),
  expiryYear: int('expiry_year').notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

// 決済トランザクションテーブル
export const paymentTransactions = mysqlTable('payment_transactions', {
  id: serial('id').primaryKey(),
  orderId: bigint('order_id', { mode: 'number', unsigned: true }).notNull().references(() => orders.id),
  paymentMethodId: bigint('payment_method_id', { mode: 'number', unsigned: true }).references(() => paymentMethods.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, processing, completed, failed, refunded
  transactionId: varchar('transaction_id', { length: 255 }), // 外部決済サービスのトランザクションID
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

// 配送トラッキングテーブル
export const deliveryTracking = mysqlTable('delivery_tracking', {
  id: serial('id').primaryKey(),
  orderId: bigint('order_id', { mode: 'number', unsigned: true }).notNull().references(() => orders.id),
  status: mysqlEnum('status', [
    'pending',
    'preparing',
    'ready_for_shipping',
    'shipped',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'cancelled'
  ]).notNull().default('pending'),
  statusDescription: varchar('status_description', { length: 255 }),
  location: varchar('location', { length: 255 }),
  estimatedDelivery: datetime('estimated_delivery'),
  actualDelivery: datetime('actual_delivery'),
  carrier: varchar('carrier', { length: 100 }), // 配送業者
  trackingNumber: varchar('tracking_number', { length: 100 }), // 追跡番号
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

// クーポンテーブル
export const coupons = mysqlTable('coupons', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  description: text('description'),
  discountType: mysqlEnum('discount_type', ['percentage', 'fixed_amount']).notNull(),
  discountValue: decimal('discount_value', { precision: 10, scale: 2 }).notNull(),
  minPurchaseAmount: decimal('min_purchase_amount', { precision: 10, scale: 2 }),
  maxDiscountAmount: decimal('max_discount_amount', { precision: 10, scale: 2 }),
  usageLimit: int('usage_limit'),
  usedCount: int('used_count').notNull().default(0),
  validFrom: datetime('valid_from').notNull(),
  validUntil: datetime('valid_until').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
});

// 通知テーブル
export const notifications = mysqlTable('notifications', {
  id: serial('id').primaryKey(),
  userId: bigint('user_id', { mode: 'number', unsigned: true }).notNull().references(() => users.id),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: mysqlEnum('type', ['order_update', 'promotion', 'system', 'stock_alert']).notNull().default('system'),
  relatedOrderId: bigint('related_order_id', { mode: 'number', unsigned: true }),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  readAt: timestamp('read_at'),
});
