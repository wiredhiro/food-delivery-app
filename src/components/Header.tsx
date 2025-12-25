'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { trpc } from '@/lib/trpc';

export default function Header() {
  const router = useRouter();
  const { totalItems } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const { favoritesCount } = useFavorites();

  // 未読通知数を取得
  const { data: unreadData } = trpc.notifications.getUnreadCount.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id, refetchInterval: 30000 } // 30秒ごとに再取得
  );
  const unreadCount = unreadData?.count || 0;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* ロゴ・サービス名 */}
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-xl font-light text-gray-800 tracking-wide">
              食事宅配サービス
            </h1>
          </Link>

          {/* ナビゲーション */}
          <nav className="flex items-center gap-8">
            <Link
              href="/products"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light"
            >
              商品一覧
            </Link>

            {/* マイページ（ログイン時のみ表示） */}
            {isAuthenticated && (
              <Link
                href="/profile"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light hidden sm:inline"
              >
                マイページ
              </Link>
            )}

            {/* 注文履歴（ログイン時のみ表示） */}
            {isAuthenticated && (
              <Link
                href="/orders"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light hidden sm:inline"
              >
                注文履歴
              </Link>
            )}

            {/* 管理画面（管理者のみ表示） */}
            {isAuthenticated && user?.isAdmin && (
              <Link
                href="/admin"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors font-light hidden sm:inline"
              >
                管理画面
              </Link>
            )}

            {/* お気に入りアイコン（ログイン時のみ表示） */}
            {isAuthenticated && (
              <Link
                href="/favorites"
                className="relative text-gray-600 hover:text-gray-900 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                  <span className="text-sm font-light hidden sm:inline">お気に入り</span>
                  {/* お気に入り件数バッジ */}
                  {favoritesCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-gray-800 text-white text-xs font-normal rounded-full w-4 h-4 flex items-center justify-center">
                      {favoritesCount}
                    </span>
                  )}
                </div>
              </Link>
            )}

            {/* 通知アイコン（ログイン時のみ表示） */}
            {isAuthenticated && (
              <Link
                href="/notifications"
                className="relative text-gray-600 hover:text-gray-900 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                    />
                  </svg>
                  <span className="text-sm font-light hidden lg:inline">通知</span>
                  {/* 未読通知数バッジ */}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-normal rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
              </Link>
            )}

            {/* カートアイコン */}
            <Link
              href="/cart"
              className="relative text-gray-600 hover:text-gray-900 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                  />
                </svg>
                <span className="text-sm font-light hidden sm:inline">カート</span>
                {/* カート内商品数バッジ */}
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-gray-800 text-white text-xs font-normal rounded-full w-4 h-4 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </div>
            </Link>

            {/* ユーザーメニュー */}
            {isAuthenticated ? (
              <div className="flex items-center gap-6">
                <span className="text-sm text-gray-600 font-light hidden sm:inline">
                  {user?.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light"
                >
                  ログアウト
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <Link
                  href="/login"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors font-light"
                >
                  ログイン
                </Link>
                <Link
                  href="/signup"
                  className="text-sm bg-gray-900 hover:bg-gray-800 text-white font-light py-2 px-6 rounded transition-colors"
                >
                  サインアップ
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
