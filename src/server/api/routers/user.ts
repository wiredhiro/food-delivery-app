import { z } from 'zod';
import { router, publicProcedure, writeProcedure } from '../trpc';
import { db } from '@/server/db';
import { users, addresses } from '@/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const userRouter = router({
  // ユーザー情報を取得
  getProfile: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const user = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          phoneNumber: users.phoneNumber,
          isAdmin: users.isAdmin,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (user.length === 0) {
        throw new Error('ユーザーが見つかりません');
      }

      return user[0];
    }),

  // ユーザー情報を更新
  updateProfile: writeProcedure
    .input(z.object({
      userId: z.number(),
      name: z.string().min(1, '名前を入力してください'),
      phoneNumber: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await db
        .update(users)
        .set({
          name: input.name,
          phoneNumber: input.phoneNumber,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),

  // パスワードを変更
  changePassword: writeProcedure
    .input(z.object({
      userId: z.number(),
      currentPassword: z.string().min(1, '現在のパスワードを入力してください'),
      newPassword: z.string().min(6, 'パスワードは6文字以上で入力してください'),
    }))
    .mutation(async ({ input }) => {
      // 現在のパスワードを確認
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (user.length === 0) {
        throw new Error('ユーザーが見つかりません');
      }

      const isValid = await bcrypt.compare(input.currentPassword, user[0].passwordHash);
      if (!isValid) {
        throw new Error('現在のパスワードが正しくありません');
      }

      // 新しいパスワードをハッシュ化
      const hashedPassword = await bcrypt.hash(input.newPassword, 10);

      // パスワードを更新
      await db
        .update(users)
        .set({
          passwordHash: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),

  // 配送先住所一覧を取得
  getAddresses: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const userAddresses = await db
        .select()
        .from(addresses)
        .where(eq(addresses.userId, input.userId))
        .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));

      return userAddresses;
    }),

  // 配送先住所を追加
  addAddress: writeProcedure
    .input(z.object({
      userId: z.number(),
      name: z.string().min(1, '宛名を入力してください'),
      postalCode: z.string().min(1, '郵便番号を入力してください'),
      prefecture: z.string().min(1, '都道府県を入力してください'),
      city: z.string().min(1, '市区町村を入力してください'),
      addressLine1: z.string().min(1, '番地を入力してください'),
      addressLine2: z.string().optional(),
      phoneNumber: z.string().min(1, '電話番号を入力してください'),
      isDefault: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      // デフォルト住所に設定する場合、他の住所のデフォルトを解除
      if (input.isDefault) {
        await db
          .update(addresses)
          .set({ isDefault: false })
          .where(eq(addresses.userId, input.userId));
      }

      const [result] = await db.insert(addresses).values({
        userId: input.userId,
        name: input.name,
        postalCode: input.postalCode,
        prefecture: input.prefecture,
        city: input.city,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2 || null,
        phoneNumber: input.phoneNumber,
        isDefault: input.isDefault || false,
      });

      return { success: true, id: Number(result.insertId) };
    }),

  // 配送先住所を更新
  updateAddress: writeProcedure
    .input(z.object({
      id: z.number(),
      userId: z.number(),
      name: z.string().min(1, '宛名を入力してください'),
      postalCode: z.string().min(1, '郵便番号を入力してください'),
      prefecture: z.string().min(1, '都道府県を入力してください'),
      city: z.string().min(1, '市区町村を入力してください'),
      addressLine1: z.string().min(1, '番地を入力してください'),
      addressLine2: z.string().optional(),
      phoneNumber: z.string().min(1, '電話番号を入力してください'),
      isDefault: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      // デフォルト住所に設定する場合、他の住所のデフォルトを解除
      if (input.isDefault) {
        await db
          .update(addresses)
          .set({ isDefault: false })
          .where(and(
            eq(addresses.userId, input.userId),
            eq(addresses.id, input.id)
          ));
      }

      await db
        .update(addresses)
        .set({
          name: input.name,
          postalCode: input.postalCode,
          prefecture: input.prefecture,
          city: input.city,
          addressLine1: input.addressLine1,
          addressLine2: input.addressLine2 || null,
          phoneNumber: input.phoneNumber,
          isDefault: input.isDefault || false,
          updatedAt: new Date(),
        })
        .where(and(
          eq(addresses.id, input.id),
          eq(addresses.userId, input.userId)
        ));

      return { success: true };
    }),

  // 配送先住所を削除
  deleteAddress: writeProcedure
    .input(z.object({
      id: z.number(),
      userId: z.number(),
    }))
    .mutation(async ({ input }) => {
      await db
        .delete(addresses)
        .where(and(
          eq(addresses.id, input.id),
          eq(addresses.userId, input.userId)
        ));

      return { success: true };
    }),

  // デフォルト住所を設定
  setDefaultAddress: writeProcedure
    .input(z.object({
      id: z.number(),
      userId: z.number(),
    }))
    .mutation(async ({ input }) => {
      // 他の住所のデフォルトを解除
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, input.userId));

      // 指定した住所をデフォルトに設定
      await db
        .update(addresses)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(and(
          eq(addresses.id, input.id),
          eq(addresses.userId, input.userId)
        ));

      return { success: true };
    }),
});
