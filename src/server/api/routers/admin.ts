import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { db } from '@/server/db';
import { orders, orderItems, products, users, notifications } from '@/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const adminRouter = router({
  // 全注文を取得（管理者用）
  getAllOrders: publicProcedure
    .input(z.object({
      limit: z.number().optional(),
      offset: z.number().optional()
    }))
    .query(async ({ input }) => {
      const allOrders = await db
        .select()
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(input.limit || 50)
        .offset(input.offset || 0);

      return { orders: allOrders };
    }),

  // 注文ステータスを更新
  updateOrderStatus: publicProcedure
    .input(z.object({
      orderId: z.number(),
      status: z.enum(['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled']),
    }))
    .mutation(async ({ input }) => {
      // 注文情報を取得
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId))
        .limit(1);

      if (!order) {
        throw new Error('注文が見つかりません');
      }

      // ステータスを更新
      await db
        .update(orders)
        .set({ status: input.status })
        .where(eq(orders.id, input.orderId));

      // ステータスに応じた通知を作成
      const statusMessages: Record<string, { title: string; message: string }> = {
        confirmed: {
          title: 'ご注文を確認しました',
          message: `ご注文（注文番号: #${input.orderId}）を確認しました。準備が整い次第、配送いたします。`,
        },
        preparing: {
          title: '商品を準備中です',
          message: `ご注文（注文番号: #${input.orderId}）の商品を準備しています。`,
        },
        shipped: {
          title: '商品を発送しました',
          message: `ご注文（注文番号: #${input.orderId}）を発送しました。配達までしばらくお待ちください。`,
        },
        delivered: {
          title: '配達完了',
          message: `ご注文（注文番号: #${input.orderId}）が配達完了しました。ご利用ありがとうございました。`,
        },
        cancelled: {
          title: '注文がキャンセルされました',
          message: `ご注文（注文番号: #${input.orderId}）がキャンセルされました。`,
        },
      };

      const notificationContent = statusMessages[input.status];
      if (notificationContent) {
        await db.insert(notifications).values({
          userId: order.userId,
          title: notificationContent.title,
          message: notificationContent.message,
          type: 'order_update',
          relatedOrderId: input.orderId,
          isRead: false,
        });
      }

      return { success: true, message: 'ステータスを更新しました' };
    }),

  // 商品を作成
  createProduct: publicProcedure
    .input(z.object({
      categoryId: z.number().optional(),
      name: z.string(),
      description: z.string(),
      price: z.string(),
      stock: z.number(),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const [product] = await db.insert(products).values({
        categoryId: input.categoryId || null,
        name: input.name,
        description: input.description,
        price: input.price,
        stock: input.stock,
        imageUrl: input.imageUrl || null,
      });

      return { success: true, productId: Number(product.insertId) };
    }),

  // 商品を更新
  updateProduct: publicProcedure
    .input(z.object({
      id: z.number(),
      categoryId: z.number().optional(),
      name: z.string(),
      description: z.string(),
      price: z.string(),
      stock: z.number(),
      imageUrl: z.string().optional(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      await db
        .update(products)
        .set({
          categoryId: input.categoryId || null,
          name: input.name,
          description: input.description,
          price: input.price,
          stock: input.stock,
          imageUrl: input.imageUrl || null,
          isActive: input.isActive,
        })
        .where(eq(products.id, input.id));

      return { success: true, message: '商品を更新しました' };
    }),

  // 商品を削除（論理削除）
  deleteProduct: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db
        .update(products)
        .set({ isActive: false })
        .where(eq(products.id, input.id));

      return { success: true, message: '商品を削除しました' };
    }),

  // ダッシュボード統計
  getStats: publicProcedure.query(async () => {
    const allOrders = await db.select().from(orders);
    const allProducts = await db.select().from(products);
    const allUsers = await db.select().from(users);

    return {
      totalOrders: allOrders.length || 0,
      totalProducts: allProducts.length || 0,
      totalUsers: allUsers.length || 0,
    };
  }),
});
