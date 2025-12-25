import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { db } from '@/server/db';
import { favorites, products } from '@/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export const favoritesRouter = router({
  // ユーザーのお気に入り一覧を取得
  getByUserId: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const userFavorites = await db
        .select({
          id: favorites.id,
          productId: favorites.productId,
          productName: products.name,
          productPrice: products.price,
          productImageUrl: products.imageUrl,
          productStock: products.stock,
          productDescription: products.description,
          createdAt: favorites.createdAt,
        })
        .from(favorites)
        .leftJoin(products, eq(favorites.productId, products.id))
        .where(eq(favorites.userId, input.userId))
        .orderBy(desc(favorites.createdAt));

      return { favorites: userFavorites };
    }),

  // 商品がお気に入りかどうかをチェック
  isFavorite: publicProcedure
    .input(z.object({
      userId: z.number(),
      productId: z.number(),
    }))
    .query(async ({ input }) => {
      const favorite = await db
        .select()
        .from(favorites)
        .where(
          and(
            eq(favorites.userId, input.userId),
            eq(favorites.productId, input.productId)
          )
        )
        .limit(1);

      return { isFavorite: favorite.length > 0 };
    }),

  // お気に入りに追加
  add: publicProcedure
    .input(z.object({
      userId: z.number(),
      productId: z.number(),
    }))
    .mutation(async ({ input }) => {
      // 既に登録されているかチェック
      const existing = await db
        .select()
        .from(favorites)
        .where(
          and(
            eq(favorites.userId, input.userId),
            eq(favorites.productId, input.productId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new Error('既にお気に入りに追加されています');
      }

      await db.insert(favorites).values({
        userId: input.userId,
        productId: input.productId,
      });

      return { success: true, message: 'お気に入りに追加しました' };
    }),

  // お気に入りから削除
  remove: publicProcedure
    .input(z.object({
      userId: z.number(),
      productId: z.number(),
    }))
    .mutation(async ({ input }) => {
      await db
        .delete(favorites)
        .where(
          and(
            eq(favorites.userId, input.userId),
            eq(favorites.productId, input.productId)
          )
        );

      return { success: true, message: 'お気に入りから削除しました' };
    }),

  // お気に入りの件数を取得
  getCount: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const result = await db
        .select()
        .from(favorites)
        .where(eq(favorites.userId, input.userId));

      return { count: result.length };
    }),
});
