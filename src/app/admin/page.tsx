'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import Header from '@/components/Header';
import Link from 'next/link';

export default function AdminDashboard() {
 const router = useRouter();
 const { isAuthenticated, isLoading: authLoading, user } = useAuth();

 const { data: stats, isLoading: statsLoading } = trpc.admin.getStats.useQuery();
 const { data: ordersData, isLoading: ordersLoading } = trpc.admin.getAllOrders.useQuery({ limit: 10 });

 // 認証チェック
 useEffect(() => {
 if (!authLoading && (!isAuthenticated || !user?.isAdmin)) {
 router.push('/');
 }
 }, [isAuthenticated, authLoading, user, router]);

 if (authLoading || !isAuthenticated || !user?.isAdmin) {
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
 <div className="mb-8">
 <h1 className="text-3xl font-bold text-gray-900 mb-2">
 管理ダッシュボード
 </h1>
 <p className="text-gray-600">
 システム全体の管理と監視
 </p>
 </div>

 {/* 統計カード */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
 <div className="bg-white rounded-lg shadow-md p-6">
 <h3 className="text-sm font-medium text-gray-500 mb-2">
 総注文数
 </h3>
 <p className="text-3xl font-bold text-gray-900">
 {statsLoading ? '...' : stats?.totalOrders || 0}
 </p>
 </div>

 <div className="bg-white rounded-lg shadow-md p-6">
 <h3 className="text-sm font-medium text-gray-500 mb-2">
 総商品数
 </h3>
 <p className="text-3xl font-bold text-gray-900">
 {statsLoading ? '...' : stats?.totalProducts || 0}
 </p>
 </div>

 <div className="bg-white rounded-lg shadow-md p-6">
 <h3 className="text-sm font-medium text-gray-500 mb-2">
 総ユーザー数
 </h3>
 <p className="text-3xl font-bold text-gray-900">
 {statsLoading ? '...' : stats?.totalUsers || 0}
 </p>
 </div>
 </div>

 {/* クイックアクション */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
 <Link
 href="/admin/orders"
 className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md p-6 transition-colors duration-200"
 >
 <h3 className="text-xl font-semibold mb-2">注文管理</h3>
 <p className="text-blue-100">
 注文の確認、ステータス更新、詳細確認
 </p>
 </Link>

 <Link
 href="/admin/products"
 className="bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md p-6 transition-colors duration-200"
 >
 <h3 className="text-xl font-semibold mb-2">商品管理</h3>
 <p className="text-green-100">
 商品の追加、編集、削除、在庫管理
 </p>
 </Link>

 <Link
 href="/admin/coupons"
 className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-md p-6 transition-colors duration-200"
 >
 <h3 className="text-xl font-semibold mb-2">クーポン管理</h3>
 <p className="text-purple-100">
 クーポンの作成、削除、使用状況確認
 </p>
 </Link>
 </div>

 {/* 最近の注文 */}
 <div className="bg-white rounded-lg shadow-md overflow-hidden">
 <div className="px-6 py-4 border-b border-gray-200">
 <h2 className="text-xl font-semibold text-gray-900">
 最近の注文
 </h2>
 </div>

 {ordersLoading ? (
 <div className="p-6 text-center text-gray-600">
 読み込み中...
 </div>
 ) : ordersData?.orders.length === 0 ? (
 <div className="p-6 text-center text-gray-600">
 注文がありません
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="min-w-full divide-y divide-gray-200">
 <thead className="bg-gray-50">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
 注文ID
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
 ユーザーID
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
 金額
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
 ステータス
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
 注文日時
 </th>
 </tr>
 </thead>
 <tbody className="bg-white divide-y divide-gray-200">
 {ordersData?.orders.map((order) => (
 <tr key={order.id} className="hover:bg-gray-50">
 <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
 #{order.id}
 </td>
 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
 {order.userId}
 </td>
 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
 ¥{Number(order.totalAmount).toLocaleString()}
 </td>
 <td className="px-6 py-4 whitespace-nowrap">
 <span
 className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
 order.status === 'delivered'
 ? 'bg-green-100 text-green-800'
 : order.status === 'shipped'
 ? 'bg-blue-100 text-blue-800'
 : order.status === 'cancelled'
 ? 'bg-red-100 text-red-800'
 : 'bg-yellow-100 text-yellow-800'
 }`}
 >
 {order.status}
 </span>
 </td>
 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
 {new Date(order.createdAt).toLocaleString('ja-JP')}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}

 <div className="px-6 py-4 border-t border-gray-200">
 <Link
 href="/admin/orders"
 className="text-blue-600 hover:text-blue-700 font-semibold"
 >
 すべての注文を見る →
 </Link>
 </div>
 </div>
 </main>
 </div>
 );
}
