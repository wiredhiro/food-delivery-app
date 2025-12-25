import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { db } from '@/server/db';
import { deliveryTracking, orders, users } from '@/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { sendEmail, generateShippingNotificationEmail } from '@/lib/email';

export const deliveryRouter = router({
  // 注文の配送状況を取得
  getByOrderId: publicProcedure
    .input(z.object({
      orderId: z.number(),
      userId: z.number()
    }))
    .query(async ({ input }) => {
      // 注文の所有者確認
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId))
        .limit(1);

      if (!order || order.userId !== input.userId) {
        throw new Error('注文が見つかりません');
      }

      // 配送トラッキング情報を取得（最新順）
      const tracking = await db
        .select()
        .from(deliveryTracking)
        .where(eq(deliveryTracking.orderId, input.orderId))
        .orderBy(desc(deliveryTracking.createdAt));

      return tracking;
    }),

  // 配送状況を更新（管理者用）
  updateStatus: publicProcedure
    .input(z.object({
      orderId: z.number(),
      status: z.enum([
        'pending',
        'preparing',
        'ready_for_shipping',
        'shipped',
        'in_transit',
        'out_for_delivery',
        'delivered',
        'cancelled'
      ]),
      statusDescription: z.string().optional(),
      location: z.string().optional(),
      estimatedDelivery: z.string().optional(), // ISO date string
      actualDelivery: z.string().optional(), // ISO date string
      carrier: z.string().optional(),
      trackingNumber: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { orderId, ...trackingData } = input;

      // 新しいトラッキングレコードを作成
      const values: any = {
        orderId: orderId,
        status: trackingData.status,
      };

      if (trackingData.statusDescription) values.statusDescription = trackingData.statusDescription;
      if (trackingData.location) values.location = trackingData.location;
      if (trackingData.estimatedDelivery && trackingData.estimatedDelivery.trim() !== '') {
        values.estimatedDelivery = new Date(trackingData.estimatedDelivery);
      }
      if (trackingData.actualDelivery && trackingData.actualDelivery.trim() !== '') {
        values.actualDelivery = new Date(trackingData.actualDelivery);
      }
      if (trackingData.carrier) values.carrier = trackingData.carrier;
      if (trackingData.trackingNumber) values.trackingNumber = trackingData.trackingNumber;
      if (trackingData.notes) values.notes = trackingData.notes;

      await db.insert(deliveryTracking).values(values);

      // 配達完了の場合、注文ステータスも更新
      if (trackingData.status === 'delivered') {
        await db
          .update(orders)
          .set({ status: 'delivered' })
          .where(eq(orders.id, orderId));
      }

      // ユーザー情報を取得してメール送信
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (order) {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, order.userId))
          .limit(1);

        if (user && user.email) {
          const emailHtml = generateShippingNotificationEmail({
            orderNumber: orderId,
            userName: user.name,
            status: trackingData.status,
            statusDescription: trackingData.statusDescription,
            trackingNumber: trackingData.trackingNumber,
            carrier: trackingData.carrier,
            estimatedDelivery: trackingData.estimatedDelivery,
          });

          // メール送信（非同期で実行、失敗しても更新は成功扱い）
          sendEmail({
            to: user.email,
            subject: `【配送状況更新】ご注文 #${orderId} の配送状況が更新されました`,
            html: emailHtml,
          }).catch((error) => {
            console.error('Failed to send shipping notification email:', error);
          });
        }
      }

      return { success: true };
    }),

  // 最新の配送状況を取得
  getLatestStatus: publicProcedure
    .input(z.object({
      orderId: z.number(),
      userId: z.number()
    }))
    .query(async ({ input }) => {
      // 注文の所有者確認
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId))
        .limit(1);

      if (!order || order.userId !== input.userId) {
        throw new Error('注文が見つかりません');
      }

      // 最新の配送トラッキング情報を取得
      const [latestTracking] = await db
        .select()
        .from(deliveryTracking)
        .where(eq(deliveryTracking.orderId, input.orderId))
        .orderBy(desc(deliveryTracking.createdAt))
        .limit(1);

      return latestTracking || null;
    }),
});
