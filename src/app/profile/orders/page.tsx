'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import Header from '@/components/Header';
import Link from 'next/link';

export default function OrderHistoryPage() {
 const router = useRouter();
 const { isAuthenticated, isLoading: authLoading, user } = useAuth();

 const { data: ordersData, isLoading } = trpc.orders.getUserOrders.useQuery(
 { userId: user?.id },
 { enabled: !!user?.id }
 );

 // 認証チェック
 useEffect(() => {
 if (!authLoading && !isAuthenticated) {
 router.push('/login');
 }
 }, [isAuthenticated, authLoading, router]);

 if (authLoading || !isAuthenticated) {
 return (
 <div className="min-h-screen flex items-center justify-center">
 <p className="text-xl">読み込み中...</p>
 </div>
 );
 }

 const getStatusLabel = (status: string) => {
 const statusMap: Record<string, string> = {
 pending: '処理中',
 confirmed: '確認済み',
 preparing: '準備中',
 shipped: '配送中',
 delivered: '配達完了',
 cancelled: 'キャンセル',
 };
 return statusMap[status] || status;
 };

 const getStatusColor = (status: string) => {
 const colorMap: Record<string, string> = {
 pending: 'bg-yellow-100 text-yellow-800',
 confirmed: 'bg-indigo-100 text-indigo-800',
 preparing: 'bg-purple-100 text-purple-800',
 shipped: 'bg-blue-100 text-blue-800',
 delivered: 'bg-green-100 text-green-800',
 cancelled: 'bg-red-100 text-red-800',
 };
 return colorMap[status] || 'bg-gray-100 text-gray-800';
 };

 return (
 <div className="min-h-screen bg-gray-50">
 <Header />

 <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
 <div className="mb-8">
 <Link
 href="/profile"
 className="text-blue-600 hover:text-blue-700 mb-2 inline-block"
 >
 ← マイページに戻る
 </Link>
 <h1 className="text-3xl font-bold text-gray-900">
 注文履歴
 </h1>
 </div>

 {isLoading ? (
 <div className="text-center py-12">
 <p className="text-xl text-gray-600">読み込み中...</p>
 </div>
 ) : ordersData && ordersData.orders.length === 0 ? (
 <div className="bg-white rounded-lg shadow-md p-8 text-center">
 <p className="text-xl text-gray-600 mb-4">
 注文履歴がありません
 </p>
 <Link
 href="/products"
 className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
 >
 商品を見る
 </Link>
 </div>
 ) : (
 <div className="space-y-4">
 {ordersData?.orders.map((order) => (
 <div
 key={order.id}
 className="bg-white rounded-lg shadow-md overflow-hidden"
 >
 <div className="p-6">
 <div className="flex items-start justify-between mb-4">
 <div>
 <h3 className="text-lg font-semibold text-gray-900">
 注文 #{order.id}
 </h3>
 <p className="text-sm text-gray-500">
 注文日: {new Date(order.createdAt).toLocaleDateString('ja-JP', {
 year: 'numeric',
 month: '2-digit',
 day: '2-digit',
 hour: '2-digit',
 minute: '2-digit',
 })}
 </p>
 </div>
 <div className="text-right">
 <span
 className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
 order.status
 )}`}
 >
 {getStatusLabel(order.status)}
 </span>
 <p className="mt-2 text-sm text-gray-600">
 支払い:{' '}
 <span
 className={`font-semibold ${
 order.paymentStatus === 'paid'
 ? 'text-green-600'
 : order.paymentStatus === 'failed'
 ? 'text-red-600'
 : 'text-yellow-600'
 }`}
 >
 {order.paymentStatus === 'paid'
 ? '支払済'
 : order.paymentStatus === 'failed'
 ? '失敗'
 : '待機中'}
 </span>
 </p>
 </div>
 </div>

 <div className="border-t border-gray-200 pt-4">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-2xl font-bold text-gray-900">
 ¥{Number(order.totalAmount).toLocaleString()}
 </p>
 {order.deliveryDate && (
 <p className="text-sm text-gray-600 mt-1">
 配達予定:{' '}
 {new Date(order.deliveryDate).toLocaleDateString('ja-JP')}
 </p>
 )}
 </div>
 <Link
 href={`/orders/${order.id}`}
 className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
 >
 詳細を見る
 </Link>
 </div>
 </div>

 {order.notes && (
 <div className="mt-4 p-3 bg-gray-50 rounded-lg">
 <p className="text-sm text-gray-600">
 <span className="font-semibold">備考:</span> {order.notes}
 </p>
 </div>
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 </main>
 </div>
 );
}
