import { z } from 'zod';
import { router, publicProcedure, writeProcedure } from '../trpc';
import { db } from '@/server/db';
import { orders, orderItems, products, addresses, users } from '@/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { sendEmail, generateOrderConfirmationEmail } from '@/lib/email';

export const ordersRouter = router({
  // 注文を作成
  create: writeProcedure
    .input(
      z.object({
        userId: z.number(),
        items: z.array(
          z.object({
            productId: z.number(),
            quantity: z.number(),
            price: z.string(),
          })
        ),
        shippingAddress: z.object({
          name: z.string(),
          postalCode: z.string(),
          prefecture: z.string(),
          city: z.string(),
          addressLine: z.string(),
          phoneNumber: z.string(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      // まず配送先住所を作成
      const [address] = await db.insert(addresses).values({
        userId: input.userId,
        name: input.shippingAddress.name,
        postalCode: input.shippingAddress.postalCode,
        prefecture: input.shippingAddress.prefecture,
        city: input.shippingAddress.city,
        addressLine1: input.shippingAddress.addressLine,
        phoneNumber: input.shippingAddress.phoneNumber,
        isDefault: false,
      });

      const addressId = Number(address.insertId);

      // 合計金額を計算
      const totalAmount = input.items.reduce(
        (sum, item) => sum + parseFloat(item.price) * item.quantity,
        0
      );

      // 注文を作成
      const [order] = await db.insert(orders).values({
        userId: input.userId,
        addressId: addressId,
        totalAmount: totalAmount.toString(),
        status: 'pending',
      });

      const orderId = Number(order.insertId);

      // 注文アイテムを作成
      const itemsForEmail: Array<{ name: string; quantity: number; price: number }> = [];

      for (const item of input.items) {
        const unitPrice = parseFloat(item.price);
        const subtotal = unitPrice * item.quantity;

        await db.insert(orderItems).values({
          orderId: orderId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: unitPrice.toString(),
          subtotal: subtotal.toString(),
        });

        // 在庫を減らす
        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        if (product) {
          const newStock = product.stock - item.quantity;
          await db
            .update(products)
            .set({ stock: newStock })
            .where(eq(products.id, item.productId));

          // メール用に商品情報を保存
          itemsForEmail.push({
            name: product.name,
            quantity: item.quantity,
            price: unitPrice,
          });
        }
      }

      // ユーザー情報を取得してメール送信
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (user && user.email) {
        const deliveryAddress = `${input.shippingAddress.name}
〒${input.shippingAddress.postalCode}
${input.shippingAddress.prefecture}${input.shippingAddress.city}
${input.shippingAddress.addressLine}
電話: ${input.shippingAddress.phoneNumber}`;

        const emailHtml = generateOrderConfirmationEmail({
          orderNumber: orderId,
          userName: user.name,
          totalAmount: totalAmount,
          items: itemsForEmail,
          deliveryAddress: deliveryAddress,
        });

        // メール送信（非同期で実行、失敗しても注文は成功扱い）
        sendEmail({
          to: user.email,
          subject: `【注文確認】ご注文ありがとうございます（注文番号: #${orderId}）`,
          html: emailHtml,
        }).catch((error) => {
          console.error('Failed to send order confirmation email:', error);
        });
      }

      return {
        success: true,
        orderId: orderId,
        message: '注文が完了しました',
      };
    }),

  // ユーザーの注文履歴を取得
  getByUserId: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const userOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.userId, input.userId))
        .orderBy(orders.createdAt);

      return { orders: userOrders };
    }),

  // ユーザーの注文履歴を取得（limitオプション付き）
  getUserOrders: publicProcedure
    .input(z.object({
      userId: z.number().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      let query = db.select().from(orders);

      // userIdが指定されている場合はそのユーザーの注文のみ
      if (input?.userId) {
        query = query.where(eq(orders.userId, input.userId)) as any;
      }

      const userOrders = await query
        .orderBy(desc(orders.createdAt))
        .limit(input?.limit || 100)
        .offset(input?.offset || 0);

      return { orders: userOrders };
    }),

  // 注文詳細を取得
  getById: publicProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId))
        .limit(1);

      if (!order) {
        throw new Error('注文が見つかりません');
      }

      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, input.orderId));

      return {
        order,
        items,
      };
    }),

  // 再注文用：注文の商品情報を取得
  getOrderItemsWithProducts: publicProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId))
        .limit(1);

      if (!order) {
        throw new Error('注文が見つかりません');
      }

      // 注文アイテムと商品情報を結合して取得
      const items = await db
        .select({
          orderItemId: orderItems.id,
          productId: orderItems.productId,
          quantity: orderItems.quantity,
          productName: products.name,
          productPrice: products.price,
          productStock: products.stock,
          productImageUrl: products.imageUrl,
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, input.orderId));

      return {
        order,
        items,
      };
    }),
});
