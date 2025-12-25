import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { db } from '@/server/db';

// コンテキストの型定義
interface Context {
  db: typeof db;
  session?: {
    user: {
      id: number;
      email: string;
      name: string;
      isAdmin: boolean;
    };
  };
}

// tRPCの初期化
const t = initTRPC.context<Context>().create();

// ルーター作成用のヘルパー
export const router = t.router;

// プロシージャ作成用のヘルパー (認証なし)
export const publicProcedure = t.procedure;

// 認証が必要なプロシージャ
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'ログインが必要です',
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});
