import { z } from 'zod';
import { router, publicProcedure, writeProcedure } from '../trpc';
import { db } from '@/server/db';
import { coupons } from '@/server/db/schema';
import { eq, and, lte, gte, sql } from 'drizzle-orm';

export const couponsRouter = router({
  // クーポンコードを検証して割引額を計算
  validate: publicProcedure
    .input(z.object({
      code: z.string(),
      orderAmount: z.number(),
    }))
    .query(async ({ input }) => {
      console.log('=== クーポン検証開始 ===');
      console.log('入力コード:', input.code);
      console.log('注文金額:', input.orderAmount);
      console.log('大文字変換後:', input.code.toUpperCase());

      // クーポンを検索（まず is_active と code のみでチェック）
      const [coupon] = await db
        .select()
        .from(coupons)
        .where(
          and(
            eq(coupons.code, input.code.toUpperCase()),
            eq(coupons.isActive, true)
          )
        )
        .limit(1);

      console.log('クーポン検索結果:', coupon ? 'Found' : 'Not Found');
      if (coupon) {
        console.log('クーポン詳細:', {
          id: coupon.id,
          code: coupon.code,
          isActive: coupon.isActive,
          validFrom: coupon.validFrom,
          validUntil: coupon.validUntil,
        });
      }

      if (!coupon) {
        console.log('ERROR: クーポンが見つかりません');
        throw new Error('クーポンが見つかりません、または有効期限切れです');
      }

      // 有効期限を手動でチェック
      const now = new Date();
      const validFrom = new Date(coupon.validFrom);
      const validUntil = new Date(coupon.validUntil);

      console.log('日付チェック:');
      console.log('  現在時刻:', now.toISOString());
      console.log('  有効開始:', validFrom.toISOString());
      console.log('  有効終了:', validUntil.toISOString());
      console.log('  now < validFrom:', now < validFrom);
      console.log('  now > validUntil:', now > validUntil);

      if (now < validFrom || now > validUntil) {
        console.log('ERROR: 有効期限外です');
        throw new Error('クーポンが見つかりません、または有効期限切れです');
      }

      // 使用回数制限をチェック
      console.log('使用回数チェック:');
      console.log('  usageLimit:', coupon.usageLimit);
      console.log('  usedCount:', coupon.usedCount);
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        console.log('ERROR: 使用上限に達しました');
        throw new Error('このクーポンは使用上限に達しました');
      }

      // 最低購入金額をチェック
      console.log('最低購入金額チェック:');
      console.log('  minPurchaseAmount:', coupon.minPurchaseAmount);
      console.log('  orderAmount:', input.orderAmount);
      if (coupon.minPurchaseAmount && input.orderAmount < Number(coupon.minPurchaseAmount)) {
        console.log('ERROR: 最低購入金額未満です');
        throw new Error(
          `このクーポンは¥${Math.floor(Number(coupon.minPurchaseAmount)).toLocaleString()}以上のご購入で利用できます`
        );
      }

      // 割引額を計算
      let discountAmount = 0;

      if (coupon.discountType === 'percentage') {
        // パーセンテージ割引
        discountAmount = input.orderAmount * (Number(coupon.discountValue) / 100);

        // 最大割引額の制限
        if (coupon.maxDiscountAmount && discountAmount > Number(coupon.maxDiscountAmount)) {
          discountAmount = Number(coupon.maxDiscountAmount);
        }
      } else {
        // 固定額割引
        discountAmount = Number(coupon.discountValue);
      }

      // 割引額が注文金額を超えないようにする
      if (discountAmount > input.orderAmount) {
        discountAmount = input.orderAmount;
      }

      console.log('割引計算完了:');
      console.log('  割引額:', Math.floor(discountAmount));
      console.log('=== クーポン検証成功 ===');

      return {
        isValid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: Number(coupon.discountValue),
        },
        discountAmount: Math.floor(discountAmount),
      };
    }),

  // クーポン使用回数を増やす（注文確定時に呼ばれる）
  incrementUsage: writeProcedure
    .input(z.object({
      code: z.string(),
    }))
    .mutation(async ({ input }) => {
      await db
        .update(coupons)
        .set({
          usedCount: sql`${coupons.usedCount} + 1`,
        })
        .where(eq(coupons.code, input.code.toUpperCase()));

      return { success: true };
    }),

  // 管理者用：全クーポン取得
  getAll: publicProcedure
    .query(async () => {
      const allCoupons = await db.select().from(coupons);
      return allCoupons;
    }),

  // 管理者用：クーポン作成
  create: writeProcedure
    .input(z.object({
      code: z.string().min(3).max(50),
      description: z.string().optional(),
      discountType: z.enum(['percentage', 'fixed_amount']),
      discountValue: z.number().positive(),
      minPurchaseAmount: z.number().optional(),
      maxDiscountAmount: z.number().optional(),
      usageLimit: z.number().int().positive().optional(),
      validFrom: z.string(),
      validUntil: z.string(),
    }))
    .mutation(async ({ input }) => {
      await db.insert(coupons).values({
        code: input.code.toUpperCase(),
        description: input.description || null,
        discountType: input.discountType,
        discountValue: input.discountValue.toString(),
        minPurchaseAmount: input.minPurchaseAmount?.toString() || null,
        maxDiscountAmount: input.maxDiscountAmount?.toString() || null,
        usageLimit: input.usageLimit || null,
        validFrom: new Date(input.validFrom),
        validUntil: new Date(input.validUntil),
        isActive: true,
      });

      return { success: true };
    }),

  // 管理者用：クーポン削除
  delete: writeProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      await db.delete(coupons).where(eq(coupons.id, input.id));
      return { success: true };
    }),
});
