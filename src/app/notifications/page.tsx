'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import Header from '@/components/Header';
import Link from 'next/link';

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // 通知一覧を取得
  const { data, isLoading, refetch } = trpc.notifications.getByUserId.useQuery(
    {
      userId: user?.id || 0,
      limit: 50,
      onlyUnread: showOnlyUnread,
    },
    { enabled: !!user?.id }
  );

  // 既読にするミューテーション
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // 全て既読にするミューテーション
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // 削除ミューテーション
  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleMarkAsRead = (notificationId: number) => {
    if (!user?.id) return;
    markAsReadMutation.mutate({ notificationId, userId: user.id });
  };

  const handleMarkAllAsRead = () => {
    if (!user?.id) return;
    markAllAsReadMutation.mutate({ userId: user.id });
  };

  const handleDelete = (notificationId: number) => {
    if (!user?.id) return;
    if (confirm('この通知を削除しますか？')) {
      deleteMutation.mutate({ notificationId, userId: user.id });
    }
  };

  // 通知タイプに応じたアイコン色
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'order_update':
        return 'bg-blue-100 text-blue-800';
      case 'promotion':
        return 'bg-green-100 text-green-800';
      case 'stock_alert':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'order_update':
        return '注文情報';
      case 'promotion':
        return 'キャンペーン';
      case 'stock_alert':
        return '在庫通知';
      default:
        return 'お知らせ';
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">読み込み中...</p>
      </div>
    );
  }

  const notifications = data?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">通知</h1>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
              >
                全て既読にする
              </button>
            )}
          </div>

          {/* フィルター */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setShowOnlyUnread(false)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                !showOnlyUnread
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              全ての通知
            </button>
            <button
              onClick={() => setShowOnlyUnread(true)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showOnlyUnread
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              未読のみ ({unreadCount})
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-xl text-gray-600">読み込み中...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-xl text-gray-600 mb-6">
              {showOnlyUnread ? '未読の通知はありません' : '通知はありません'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-5 ${
                  !notification.isRead ? 'border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-2.5 py-0.5 text-xs font-medium rounded ${getTypeColor(
                          notification.type
                        )}`}
                      >
                        {getTypeLabel(notification.type)}
                      </span>
                      {!notification.isRead && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-red-100 text-red-800">
                          未読
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleString('ja-JP', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {notification.title}
                    </h3>
                    <p className="text-gray-700 mb-3">{notification.message}</p>

                    {notification.relatedOrderId && (
                      <Link
                        href={`/orders/${notification.relatedOrderId}`}
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        注文詳細を見る
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-4 h-4 ml-1"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                          />
                        </svg>
                      </Link>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(Number(notification.id))}
                        disabled={markAsReadMutation.isPending}
                        className="text-xs text-gray-600 hover:text-gray-900 disabled:opacity-50"
                      >
                        既読にする
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(Number(notification.id))}
                      disabled={deleteMutation.isPending}
                      className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
