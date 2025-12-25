import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/api/root';
import { db } from '@/server/db';
import { cookies } from 'next/headers';

const handler = async (req: Request) => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  // セッションからユーザー情報を取得（簡易実装）
  let session = undefined;
  if (sessionCookie?.value) {
    try {
      session = JSON.parse(sessionCookie.value);
    } catch (e) {
      // セッションのパースに失敗した場合は無視
    }
  }

  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => ({
      db,
      session,
    }),
  });
};

export { handler as GET, handler as POST };
