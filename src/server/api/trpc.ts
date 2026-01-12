import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { db } from '@/server/db';

// デモモードの判定
export const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

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

// デモモード用ミドルウェア - 書き込み操作をブロック
const demoModeMiddleware = t.middleware(async ({ next }) => {
  if (isDemoMode) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'デモモードのため、この操作は実行できません',
    });
  }
  return next();
});

// デモモードでブロックされるプロシージャ（書き込み操作用）
export const writeProcedure = t.procedure.use(demoModeMiddleware);

// 認証 + デモモードブロック
export const protectedWriteProcedure = protectedProcedure.use(demoModeMiddleware);
