import { z } from 'zod';
import { router, publicProcedure, writeProcedure } from '../trpc';
import { db } from '@/server/db';
import { reviews, products, users, orderItems } from '@/server/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export const reviewsRouter = router({
  // 商品のレビュー一覧を取得
  getByProductId: publicProcedure
    .input(z.object({
      productId: z.number(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const productReviews = await db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          title: reviews.title,
          comment: reviews.comment,
          isVerifiedPurchase: reviews.isVerifiedPurchase,
          createdAt: reviews.createdAt,
          userName: users.name,
          userId: reviews.userId,
        })
        .from(reviews)
        .leftJoin(users, eq(reviews.userId, users.id))
        .where(eq(reviews.productId, input.productId))
        .orderBy(desc(reviews.createdAt))
        .limit(input.limit || 50)
        .offset(input.offset || 0);

      return { reviews: productReviews };
    }),

  // 商品の平均評価を取得
  getProductRating: publicProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      const result = await db
        .select({
          averageRating: sql<number>`AVG(${reviews.rating})`,
          totalReviews: sql<number>`COUNT(*)`,
        })
        .from(reviews)
        .where(eq(reviews.productId, input.productId));

      return {
        averageRating: result[0]?.averageRating ? Number(result[0].averageRating) : 0,
        totalReviews: result[0]?.totalReviews ? Number(result[0].totalReviews) : 0,
      };
    }),

  // ユーザーのレビュー一覧を取得
  getByUserId: publicProcedure
    .input(z.object({
      userId: z.number(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const userReviews = await db
        .select({
          id: reviews.id,
          productId: reviews.productId,
          rating: reviews.rating,
          title: reviews.title,
          comment: reviews.comment,
          isVerifiedPurchase: reviews.isVerifiedPurchase,
          createdAt: reviews.createdAt,
          productName: products.name,
        })
        .from(reviews)
        .leftJoin(products, eq(reviews.productId, products.id))
        .where(eq(reviews.userId, input.userId))
        .orderBy(desc(reviews.createdAt))
        .limit(input.limit || 50)
        .offset(input.offset || 0);

      return { reviews: userReviews };
    }),

  // レビューを作成
  create: writeProcedure
    .input(z.object({
      productId: z.number(),
      userId: z.number(),
      rating: z.number().min(1).max(5),
      title: z.string().optional(),
      comment: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // 既にレビュー済みかチェック
      const existingReview = await db
        .select()
        .from(reviews)
        .where(
          and(
            eq(reviews.productId, input.productId),
            eq(reviews.userId, input.userId)
          )
        )
        .limit(1);

      if (existingReview.length > 0) {
        throw new Error('既にこの商品のレビューを投稿しています');
      }

      // ユーザーがこの商品を購入したかチェック
      const purchaseCheck = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.productId, input.productId))
        .limit(1);

      const isVerifiedPurchase = purchaseCheck.length > 0;

      // レビューを作成
      await db.insert(reviews).values({
        productId: input.productId,
        userId: input.userId,
        rating: input.rating,
        title: input.title || null,
        comment: input.comment || null,
        isVerifiedPurchase,
      });

      return { success: true, message: 'レビューを投稿しました' };
    }),

  // レビューを更新
  update: writeProcedure
    .input(z.object({
      reviewId: z.number(),
      userId: z.number(),
      rating: z.number().min(1).max(5),
      title: z.string().optional(),
      comment: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // レビューの所有者確認
      const [review] = await db
        .select()
        .from(reviews)
        .where(eq(reviews.id, input.reviewId))
        .limit(1);

      if (!review) {
        throw new Error('レビューが見つかりません');
      }

      if (review.userId !== input.userId) {
        throw new Error('このレビューを編集する権限がありません');
      }

      // レビューを更新
      await db
        .update(reviews)
        .set({
          rating: input.rating,
          title: input.title || null,
          comment: input.comment || null,
        })
        .where(eq(reviews.id, input.reviewId));

      return { success: true, message: 'レビューを更新しました' };
    }),

  // レビューを削除
  delete: writeProcedure
    .input(z.object({
      reviewId: z.number(),
      userId: z.number(),
    }))
    .mutation(async ({ input }) => {
      // レビューの所有者確認
      const [review] = await db
        .select()
        .from(reviews)
        .where(eq(reviews.id, input.reviewId))
        .limit(1);

      if (!review) {
        throw new Error('レビューが見つかりません');
      }

      if (review.userId !== input.userId) {
        throw new Error('このレビューを削除する権限がありません');
      }

      // レビューを削除
      await db
        .delete(reviews)
        .where(eq(reviews.id, input.reviewId));

      return { success: true, message: 'レビューを削除しました' };
    }),
});
