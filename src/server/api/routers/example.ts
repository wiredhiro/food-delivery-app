import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

export const exampleRouter = router({
  hello: publicProcedure
    .input(z.object({ name: z.string().optional() }))
    .query(({ input }) => {
      return {
        greeting: `こんにちは${input.name ? `, ${input.name}さん` : ''}!`,
      };
    }),

  getAll: publicProcedure.query(() => {
    return {
      items: ['商品1', '商品2', '商品3'],
    };
  }),
});
