import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { db } from '@/server/db';
import { categories } from '@/server/db/schema';

export const categoriesRouter = router({
  getAll: publicProcedure
    .query(async () => {
      const allCategories = await db.select().from(categories);
      return allCategories;
    }),
});
