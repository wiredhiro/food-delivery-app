import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { paymentMethods, paymentTransactions, orders } from '@/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const paymentRouter = router({
  // 決済方法一覧を取得
  getPaymentMethods: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
    const methods = await ctx.db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.userId, input.userId))
      .orderBy(desc(paymentMethods.isDefault), desc(paymentMethods.createdAt));

    return methods;
  }),

  // デフォルト決済方法を取得
  getDefaultPaymentMethod: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
    const methods = await ctx.db
      .select()
      .from(paymentMethods)
      .where(
        and(
          eq(paymentMethods.userId, input.userId),
          eq(paymentMethods.isDefault, true)
        )
      )
      .limit(1);

    return methods[0] || null;
  }),

  // 決済方法を追加
  addPaymentMethod: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        type: z.enum(['credit_card', 'debit_card']),
        cardholderName: z.string().min(1),
        cardNumber: z.string().regex(/^\d{16}$/), // 16桁の数字
        cardBrand: z.string().optional(),
        expiryMonth: z.number().min(1).max(12),
        expiryYear: z.number().min(new Date().getFullYear()),
        isDefault: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { cardNumber, userId, ...rest } = input;

      // カード番号の下4桁のみ保存（セキュリティのため）
      const cardNumberLast4 = cardNumber.slice(-4);

      // デフォルト設定の場合、他のカードのデフォルトを解除
      if (input.isDefault) {
        await ctx.db
          .update(paymentMethods)
          .set({ isDefault: false })
          .where(eq(paymentMethods.userId, userId));
      }

      const [newMethod] = await ctx.db
        .insert(paymentMethods)
        .values({
          userId,
          ...rest,
          cardNumberLast4,
        })
        .$returningId();

      return newMethod;
    }),

  // 決済方法を削除
  deletePaymentMethod: publicProcedure
    .input(z.object({ id: z.number(), userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const method = await ctx.db
        .select()
        .from(paymentMethods)
        .where(eq(paymentMethods.id, input.id))
        .limit(1);

      if (!method[0] || method[0].userId !== input.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '削除権限がありません',
        });
      }

      await ctx.db
        .delete(paymentMethods)
        .where(eq(paymentMethods.id, input.id));

      return { success: true };
    }),

  // 注文の決済を処理
  processPayment: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        orderId: z.number(),
        paymentMethodId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 注文を取得
      const [order] = await ctx.db
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId))
        .limit(1);

      if (!order || order.userId !== input.userId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '注文が見つかりません',
        });
      }

      if (order.paymentStatus === 'paid') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'この注文は既に支払い済みです',
        });
      }

      // 決済方法を確認
      const [paymentMethod] = await ctx.db
        .select()
        .from(paymentMethods)
        .where(eq(paymentMethods.id, input.paymentMethodId))
        .limit(1);

      if (!paymentMethod || paymentMethod.userId !== input.userId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '決済方法が見つかりません',
        });
      }

      // 決済トランザクションを作成
      const [transaction] = await ctx.db
        .insert(paymentTransactions)
        .values({
          orderId: input.orderId,
          paymentMethodId: input.paymentMethodId,
          amount: order.totalAmount,
          status: 'processing',
        })
        .$returningId();

      try {
        // ここで実際の決済処理を行う（モックとして成功とする）
        // 実際にはStripe、PayPalなどの決済サービスAPIを呼び出す

        // シミュレーション: 90%の確率で成功
        const isSuccess = Math.random() > 0.1;

        if (isSuccess) {
          // 決済成功
          await ctx.db
            .update(paymentTransactions)
            .set({
              status: 'completed',
              transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            })
            .where(eq(paymentTransactions.id, transaction.id));

          // 注文のステータスを更新
          await ctx.db
            .update(orders)
            .set({
              paymentStatus: 'paid',
              status: 'confirmed',
            })
            .where(eq(orders.id, input.orderId));

          return {
            success: true,
            transactionId: transaction.id,
            message: '決済が完了しました',
          };
        } else {
          // 決済失敗
          throw new Error('決済処理に失敗しました');
        }
      } catch (error) {
        // 決済失敗時の処理
        await ctx.db
          .update(paymentTransactions)
          .set({
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : '不明なエラー',
          })
          .where(eq(paymentTransactions.id, transaction.id));

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '決済処理に失敗しました。もう一度お試しください。',
        });
      }
    }),

  // 注文の決済トランザクション履歴を取得
  getTransactionsByOrder: publicProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ ctx, input }) => {
      const transactions = await ctx.db
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.orderId, input.orderId))
        .orderBy(desc(paymentTransactions.createdAt));

      return transactions;
    }),
});
