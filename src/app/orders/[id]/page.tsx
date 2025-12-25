'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { trpc } from '@/lib/trpc';
import Header from '@/components/Header';
import Link from 'next/link';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { addMultipleItems } = useCart();
  const utils = trpc.useUtils();
  const orderId = Number(params.id);
  const [isReordering, setIsReordering] = useState(false);
  const [reorderMessage, setReorderMessage] = useState('');

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // 注文詳細を取得
  const { data, isLoading: orderLoading, error } = trpc.orders.getById.useQuery(
    { orderId },
    { enabled: !!orderId && isAuthenticated }
  );

  // 配送トラッキング情報を取得
  const { data: trackingData } = trpc.delivery.getByOrderId.useQuery(
    { orderId, userId: user?.id || 0 },
    { enabled: !!orderId && !!user }
  );

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">読み込み中...</p>
      </div>
    );
  }

  if (orderLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-12">
          <p className="text-xl text-gray-600">
            読み込み中...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-xl text-red-600 mb-6">
              注文が見つかりません
            </p>
            <Link
              href="/orders"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              注文履歴に戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { order, items } = data;

  // 再注文ハンドラー
  const handleReorder = async () => {
    setIsReordering(true);
    setReorderMessage('');

    try {
      // 注文商品と商品詳細を取得
      const result = await utils.orders.getOrderItemsWithProducts.fetch({ orderId });

      if (!result.items || result.items.length === 0) {
        setReorderMessage('注文商品が見つかりません');
        setIsReordering(false);
        return;
      }

      // カートに追加する商品リストを作成
      const cartItems = result.items
        .filter((item) => item.productId && item.productName && item.productPrice && item.productStock !== null)
        .map((item) => ({
          id: item.productId!,
          name: item.productName!,
          price: item.productPrice!,
          stock: item.productStock!,
          imageUrl: item.productImageUrl,
          quantity: item.quantity,
        }));

      if (cartItems.length === 0) {
        setReorderMessage('カートに追加できる商品がありません');
        setIsReordering(false);
        return;
      }

      // 在庫切れ商品をチェック
      const outOfStockItems = cartItems.filter((item) => item.stock === 0);
      const availableItems = cartItems.filter((item) => item.stock > 0);

      // カートに追加
      if (availableItems.length > 0) {
        addMultipleItems(availableItems);
      }

      // メッセージ表示
      if (outOfStockItems.length > 0) {
        setReorderMessage(
          `${availableItems.length}個の商品をカートに追加しました。${outOfStockItems.length}個の商品は在庫切れのため追加できませんでした。`
        );
      } else {
        setReorderMessage(`${availableItems.length}個の商品をカートに追加しました。`);
      }

      // 1.5秒後にカートページへ遷移
      setTimeout(() => {
        router.push('/cart');
      }, 1500);
    } catch (error) {
      console.error('再注文エラー:', error);
      setReorderMessage('再注文に失敗しました。もう一度お試しください。');
      setIsReordering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <Link
            href="/orders"
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
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
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            注文履歴に戻る
          </Link>

          {/* 再注文ボタン */}
          <button
            onClick={handleReorder}
            disabled={isReordering}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-colors duration-200 ${
              isReordering
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
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
            {isReordering ? '処理中...' : '再注文'}
          </button>
        </div>

        {/* 再注文メッセージ */}
        {reorderMessage && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              reorderMessage.includes('失敗')
                ? 'bg-red-100 text-red-800'
                : 'bg-green-100 text-green-800'
            }`}
          >
            {reorderMessage}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* 注文ヘッダー */}
          <div className="bg-blue-600 text-white p-6">
            <h1 className="text-2xl font-bold mb-2">注文詳細</h1>
            <p className="text-blue-100">注文番号: #{order.id}</p>
          </div>

          {/* 注文情報 */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h2 className="text-sm font-medium text-gray-500 mb-1">
                  注文日時
                </h2>
                <p className="text-gray-900">
                  {new Date(order.createdAt).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500 mb-1">
                  ステータス
                </h2>
                <span
                  className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                    order.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : order.status === 'confirmed'
                      ? 'bg-blue-100 text-blue-800'
                      : order.status === 'preparing'
                      ? 'bg-purple-100 text-purple-800'
                      : order.status === 'shipped'
                      ? 'bg-indigo-100 text-indigo-800'
                      : order.status === 'delivered'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {order.status === 'pending'
                    ? '処理中'
                    : order.status === 'confirmed'
                    ? '確認済み'
                    : order.status === 'preparing'
                    ? '準備中'
                    : order.status === 'shipped'
                    ? '配送中'
                    : order.status === 'delivered'
                    ? '配達完了'
                    : 'キャンセル'}
                </span>
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500 mb-1">
                  支払いステータス
                </h2>
                <span
                  className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                    order.paymentStatus === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : order.paymentStatus === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {order.paymentStatus === 'pending'
                    ? '支払い待ち'
                    : order.paymentStatus === 'paid'
                    ? '支払い済み'
                    : '支払い失敗'}
                </span>
              </div>
              {order.deliveryDate && (
                <div>
                  <h2 className="text-sm font-medium text-gray-500 mb-1">
                    配達予定日
                  </h2>
                  <p className="text-gray-900">
                    {new Date(order.deliveryDate).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 配送トラッキング */}
          {trackingData && trackingData.length > 0 && (
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                配送状況
              </h2>
              <div className="space-y-4">
                {trackingData.map((tracking, index) => (
                  <div
                    key={tracking.id}
                    className={`flex gap-4 ${
                      index === 0 ? 'pb-4' : 'pb-4 border-b border-gray-100'
                    }`}
                  >
                    {/* タイムラインドット */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          index === 0
                            ? 'bg-blue-600'
                            : 'bg-gray-300'
                        }`}
                      />
                      {index !== trackingData.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-1" />
                      )}
                    </div>

                    {/* トラッキング情報 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                            tracking.status === 'delivered'
                              ? 'bg-green-100 text-green-800'
                              : tracking.status === 'out_for_delivery'
                              ? 'bg-blue-100 text-blue-800'
                              : tracking.status === 'in_transit'
                              ? 'bg-indigo-100 text-indigo-800'
                              : tracking.status === 'shipped'
                              ? 'bg-purple-100 text-purple-800'
                              : tracking.status === 'preparing'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {tracking.status === 'delivered'
                            ? '配達完了'
                            : tracking.status === 'out_for_delivery'
                            ? '配達中'
                            : tracking.status === 'in_transit'
                            ? '輸送中'
                            : tracking.status === 'shipped'
                            ? '発送済み'
                            : tracking.status === 'ready_for_shipping'
                            ? '発送準備完了'
                            : tracking.status === 'preparing'
                            ? '準備中'
                            : tracking.status === 'cancelled'
                            ? 'キャンセル'
                            : '保留中'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(tracking.createdAt).toLocaleString(
                            'ja-JP'
                          )}
                        </span>
                      </div>
                      {tracking.statusDescription && (
                        <p className="text-sm text-gray-700 mb-1">
                          {tracking.statusDescription}
                        </p>
                      )}
                      {tracking.location && (
                        <p className="text-xs text-gray-500">
                          場所: {tracking.location}
                        </p>
                      )}
                      {tracking.carrier && (
                        <p className="text-xs text-gray-500">
                          配送業者: {tracking.carrier}
                        </p>
                      )}
                      {tracking.trackingNumber && (
                        <p className="text-xs text-gray-500">
                          追跡番号: {tracking.trackingNumber}
                        </p>
                      )}
                      {tracking.estimatedDelivery && (
                        <p className="text-xs text-gray-500">
                          配達予定:{' '}
                          {new Date(
                            tracking.estimatedDelivery
                          ).toLocaleDateString('ja-JP')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 注文商品リスト */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              注文商品
            </h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">
                      商品ID: {item.productId}
                    </p>
                    <p className="text-sm text-gray-600">
                      数量: {item.quantity}
                    </p>
                    <p className="text-sm text-gray-600">
                      単価: ¥{Number(item.unitPrice).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      ¥{Number(item.subtotal).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 合計金額 */}
          <div className="p-6 bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="text-xl font-semibold text-gray-900">
                合計金額
              </span>
              <span className="text-2xl font-bold text-blue-600">
                ¥{Number(order.totalAmount).toLocaleString()}
              </span>
            </div>
          </div>

          {/* 備考 */}
          {order.notes && (
            <div className="p-6">
              <h2 className="text-sm font-medium text-gray-500 mb-2">
                備考
              </h2>
              <p className="text-gray-900">{order.notes}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
