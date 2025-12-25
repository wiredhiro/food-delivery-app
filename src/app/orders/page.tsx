'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import Header from '@/components/Header';
import Link from 'next/link';

export default function OrdersPage() {
 const router = useRouter();
 const { isAuthenticated, isLoading: authLoading, user } = useAuth();

 // 認証チェック
 useEffect(() => {
 if (!authLoading && !isAuthenticated) {
 router.push('/login');
 }
 }, [isAuthenticated, authLoading, router]);

 // 注文履歴を取得
 const { data, isLoading: ordersLoading } = trpc.orders.getByUserId.useQuery(
 { userId: user?.id || 0 },
 { enabled: !!user?.id }
 );

 if (authLoading || !isAuthenticated) {
 return (
 <div className="min-h-screen flex items-center justify-center">
 <p className="text-xl">読み込み中...</p>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-gray-50">
 <Header />

 <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
 <h1 className="text-3xl font-bold text-gray-900 mb-8">
 注文履歴
 </h1>

 {ordersLoading ? (
 <div className="flex items-center justify-center py-12">
 <p className="text-xl text-gray-600">
 読み込み中...
 </p>
 </div>
 ) : data?.orders.length === 0 ? (
 <div className="bg-white rounded-lg shadow-md p-8 text-center">
 <p className="text-xl text-gray-600 mb-6">
 注文履歴はありません
 </p>
 <Link
 href="/products"
 className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
 >
 商品を見る
 </Link>
 </div>
 ) : (
 <div className="space-y-4">
 {data?.orders.map((order) => (
 <Link
 key={order.id}
 href={`/orders/${order.id}`}
 className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6"
 >
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div className="flex-1">
 <div className="flex items-center gap-3 mb-2">
 <h2 className="text-lg font-semibold text-gray-900">
 注文番号: #{order.id}
 </h2>
 <span
 className={`px-3 py-1 text-sm font-medium rounded-full ${
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
 <p className="text-sm text-gray-600">
 注文日時:{' '}
 {new Date(order.createdAt).toLocaleDateString('ja-JP', {
 year: 'numeric',
 month: 'long',
 day: 'numeric',
 hour: '2-digit',
 minute: '2-digit',
 })}
 </p>
 </div>
 <div className="text-right">
 <p className="text-2xl font-bold text-gray-900">
 ¥{Number(order.totalAmount).toLocaleString()}
 </p>
 <p className="text-sm text-gray-600 mt-1">
 {order.paymentStatus === 'pending'
 ? '支払い待ち'
 : order.paymentStatus === 'paid'
 ? '支払い済み'
 : '支払い失敗'}
 </p>
 </div>
 </div>
 </Link>
 ))}
 </div>
 )}
 </main>
 </div>
 );
}
