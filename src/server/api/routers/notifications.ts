import { z } from 'zod';
import { router, publicProcedure, writeProcedure } from '../trpc';
import { db } from '@/server/db';
import { notifications } from '@/server/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

export const notificationsRouter = router({
  // ユーザーの通知一覧を取得
  getByUserId: publicProcedure
    .input(z.object({
      userId: z.number(),
      limit: z.number().optional().default(50),
      onlyUnread: z.boolean().optional().default(false),
    }))
    .query(async ({ input }) => {
      const conditions = [eq(notifications.userId, input.userId)];

      if (input.onlyUnread) {
        conditions.push(eq(notifications.isRead, false));
      }

      const userNotifications = await db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt))
        .limit(input.limit);

      return { notifications: userNotifications };
    }),

  // 未読通知数を取得
  getUnreadCount: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, input.userId),
            eq(notifications.isRead, false)
          )
        );

      return { count: Number(result[0]?.count || 0) };
    }),

  // 通知を既読にする
  markAsRead: writeProcedure
    .input(z.object({
      notificationId: z.number(),
      userId: z.number(),
    }))
    .mutation(async ({ input }) => {
      await db
        .update(notifications)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where(
          and(
            eq(notifications.id, input.notificationId),
            eq(notifications.userId, input.userId)
          )
        );

      return { success: true };
    }),

  // 全ての通知を既読にする
  markAllAsRead: writeProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      await db
        .update(notifications)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where(
          and(
            eq(notifications.userId, input.userId),
            eq(notifications.isRead, false)
          )
        );

      return { success: true };
    }),

  // 通知を削除
  delete: writeProcedure
    .input(z.object({
      notificationId: z.number(),
      userId: z.number(),
    }))
    .mutation(async ({ input }) => {
      await db
        .delete(notifications)
        .where(
          and(
            eq(notifications.id, input.notificationId),
            eq(notifications.userId, input.userId)
          )
        );

      return { success: true };
    }),

  // 通知を作成（管理者用/システム用）
  create: writeProcedure
    .input(z.object({
      userId: z.number(),
      title: z.string(),
      message: z.string(),
      type: z.enum(['order_update', 'promotion', 'system', 'stock_alert']).default('system'),
      relatedOrderId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const [result] = await db.insert(notifications).values({
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: input.type,
        relatedOrderId: input.relatedOrderId,
        isRead: false,
      });

      return {
        success: true,
        notificationId: Number(result.insertId),
      };
    }),
});
