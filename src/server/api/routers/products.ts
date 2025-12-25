import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { db } from '@/server/db';
import { products, reviews } from '@/server/db/schema';
import { eq, and, gte, lte, like, or, asc, desc, sql, inArray } from 'drizzle-orm';

export const productsRouter = router({
  getAll: publicProcedure
    .input(z.object({
      categoryId: z.number().optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      search: z.string().optional(),
      sortBy: z.enum(['price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest']).optional(),
      inStock: z.boolean().optional(), // 在庫ありのみ
      minRating: z.number().min(1).max(5).optional(), // 最低評価
    }).optional())
    .query(async ({ input }) => {
      const conditions = [];

      // カテゴリーフィルター
      if (input?.categoryId) {
        conditions.push(eq(products.categoryId, input.categoryId));
      }

      // 価格フィルター
      if (input?.minPrice !== undefined) {
        conditions.push(gte(products.price, input.minPrice.toString()));
      }
      if (input?.maxPrice !== undefined) {
        conditions.push(lte(products.price, input.maxPrice.toString()));
      }

      // キーワード検索（名前または説明）
      if (input?.search) {
        conditions.push(
          or(
            like(products.name, `%${input.search}%`),
            like(products.description, `%${input.search}%`)
          )
        );
      }

      // 在庫フィルター
      if (input?.inStock === true) {
        conditions.push(gte(products.stock, 1));
      }

      // アクティブな商品のみ
      conditions.push(eq(products.isActive, true));

      // クエリ実行
      let query = db.select().from(products);

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      // ソート
      if (input?.sortBy === 'price_asc') {
        query = query.orderBy(asc(products.price)) as any;
      } else if (input?.sortBy === 'price_desc') {
        query = query.orderBy(desc(products.price)) as any;
      } else if (input?.sortBy === 'name_asc') {
        query = query.orderBy(asc(products.name)) as any;
      } else if (input?.sortBy === 'name_desc') {
        query = query.orderBy(desc(products.name)) as any;
      } else if (input?.sortBy === 'newest') {
        query = query.orderBy(desc(products.createdAt)) as any;
      }

      const allProducts = await query;

      // 各商品の平均評価を取得
      const productsWithRatings = await Promise.all(
        allProducts.map(async (product) => {
          const ratingResult = await db
            .select({
              averageRating: sql<number>`AVG(${reviews.rating})`,
              totalReviews: sql<number>`COUNT(*)`,
            })
            .from(reviews)
            .where(eq(reviews.productId, product.id));

          return {
            ...product,
            averageRating: ratingResult[0]?.averageRating ? Number(ratingResult[0].averageRating) : 0,
            totalReviews: ratingResult[0]?.totalReviews ? Number(ratingResult[0].totalReviews) : 0,
          };
        })
      );

      // 評価フィルター
      let filteredProducts = productsWithRatings;
      if (input?.minRating !== undefined) {
        filteredProducts = productsWithRatings.filter(
          (product) => product.averageRating >= input.minRating!
        );
      }

      return {
        products: filteredProducts,
        count: filteredProducts.length,
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, input.id))
        .limit(1);

      if (product.length === 0) {
        throw new Error('商品が見つかりません');
      }

      return product[0];
    }),

  getByIds: publicProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .query(async ({ input }) => {
      if (input.ids.length === 0) {
        return [];
      }

      const productsList = await db
        .select()
        .from(products)
        .where(inArray(products.id, input.ids));

      return productsList;
    }),
});
