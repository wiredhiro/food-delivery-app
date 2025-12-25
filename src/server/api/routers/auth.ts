import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const authRouter = router({
  // サインアップ
  signup: publicProcedure
    .input(
      z.object({
        email: z.string().email('有効なメールアドレスを入力してください'),
        password: z.string().min(8, 'パスワードは8文字以上である必要があります'),
        name: z.string().min(1, '名前を入力してください'),
      })
    )
    .mutation(async ({ input }) => {
      // メールアドレスの重複チェック
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new Error('このメールアドレスは既に登録されています');
      }

      // パスワードをハッシュ化
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // ユーザーを作成
      const [newUser] = await db.insert(users).values({
        email: input.email,
        passwordHash: hashedPassword,
        name: input.name,
      });

      return {
        success: true,
        message: 'アカウントを作成しました',
      };
    }),

  // ログイン
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email('有効なメールアドレスを入力してください'),
        password: z.string().min(1, 'パスワードを入力してください'),
      })
    )
    .mutation(async ({ input }) => {
      // ユーザーを検索
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (!user) {
        throw new Error('メールアドレスまたはパスワードが正しくありません');
      }

      // パスワードを検証
      const isValidPassword = await bcrypt.compare(
        input.password,
        user.passwordHash
      );

      if (!isValidPassword) {
        throw new Error('メールアドレスまたはパスワードが正しくありません');
      }

      // パスワードハッシュを除外してユーザー情報を返す
      const { passwordHash, ...userWithoutPassword } = user;

      return {
        success: true,
        user: userWithoutPassword,
      };
    }),

  // 現在のユーザー情報を取得（メールアドレスで検索）
  getCurrentUser: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (!user) {
        return null;
      }

      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }),
});
