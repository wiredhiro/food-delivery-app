'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import Header from '@/components/Header';
import Link from 'next/link';

export default function ProfilePage() {
 const router = useRouter();
 const { isAuthenticated, isLoading: authLoading, user } = useAuth();

 const { data: profile, isLoading: profileLoading } = trpc.user.getProfile.useQuery(
 { userId: user?.id || 0 },
 { enabled: !!user?.id }
 );

 const { data: addresses, isLoading: addressesLoading } = trpc.user.getAddresses.useQuery(
 { userId: user?.id || 0 },
 { enabled: !!user?.id }
 );

 const { data: ordersData, isLoading: ordersLoading } = trpc.orders.getUserOrders.useQuery(
 { userId: user?.id, limit: 5 },
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

 return (
 <div className="min-h-screen bg-gray-50">
 <Header />

 <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
 <div className="mb-8">
 <h1 className="text-3xl font-bold text-gray-900 mb-2">
 マイページ
 </h1>
 <p className="text-gray-600">
 プロフィール、配送先、注文履歴を管理
 </p>
 </div>

 {/* プロフィール情報 */}
 <div className="bg-white rounded-lg shadow-md p-6 mb-6">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-xl font-semibold text-gray-900">
 プロフィール情報
 </h2>
 <Link
 href="/profile/edit"
 className="text-blue-600 hover:text-blue-700 font-semibold"
 >
 編集 →
 </Link>
 </div>

 {profileLoading ? (
 <p className="text-gray-600">読み込み中...</p>
 ) : (
 <div className="space-y-3">
 <div>
 <p className="text-sm text-gray-500">名前</p>
 <p className="text-gray-900 font-medium">{profile?.name}</p>
 </div>
 <div>
 <p className="text-sm text-gray-500">メールアドレス</p>
 <p className="text-gray-900 font-medium">{profile?.email}</p>
 </div>
 <div>
 <p className="text-sm text-gray-500">電話番号</p>
 <p className="text-gray-900 font-medium">
 {profile?.phoneNumber || '未設定'}
 </p>
 </div>
 </div>
 )}
 </div>

 {/* クイックアクション */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
 <Link
 href="/profile/edit"
 className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md p-6 transition-colors duration-200"
 >
 <div className="text-4xl mb-2">👤</div>
 <h3 className="text-lg font-semibold mb-1">プロフィール編集</h3>
 <p className="text-sm text-blue-100">
 名前、電話番号、パスワードの変更
 </p>
 </Link>

 <Link
 href="/profile/addresses"
 className="bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md p-6 transition-colors duration-200"
 >
 <div className="text-4xl mb-2">📍</div>
 <h3 className="text-lg font-semibold mb-1">配送先住所管理</h3>
 <p className="text-sm text-green-100">
 配送先住所の追加・編集・削除
 </p>
 </Link>

 <Link
 href="/profile/orders"
 className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-md p-6 transition-colors duration-200"
 >
 <div className="text-4xl mb-2">📦</div>
 <h3 className="text-lg font-semibold mb-1">注文履歴</h3>
 <p className="text-sm text-purple-100">
 過去の注文を確認
 </p>
 </Link>
 </div>

 {/* 配送先住所 */}
 <div className="bg-white rounded-lg shadow-md p-6 mb-6">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-xl font-semibold text-gray-900">
 配送先住所
 </h2>
 <Link
 href="/profile/addresses"
 className="text-blue-600 hover:text-blue-700 font-semibold"
 >
 管理 →
 </Link>
 </div>

 {addressesLoading ? (
 <p className="text-gray-600">読み込み中...</p>
 ) : addresses && addresses.length > 0 ? (
 <div className="space-y-3">
 {addresses.slice(0, 2).map((address) => (
 <div
 key={address.id}
 className="p-4 border border-gray-200 rounded-lg"
 >
 <div className="flex items-start justify-between">
 <div>
 {address.isDefault && (
 <span className="inline-block px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded mb-2">
 デフォルト
 </span>
 )}
 <p className="font-medium text-gray-900">{address.name}</p>
 <p className="text-sm text-gray-600">
 〒{address.postalCode}
 </p>
 <p className="text-sm text-gray-600">
 {address.prefecture}{address.city}{address.addressLine1}
 {address.addressLine2 && ` ${address.addressLine2}`}
 </p>
 <p className="text-sm text-gray-600">
 {address.phoneNumber}
 </p>
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <p className="text-gray-600">
 配送先住所が登録されていません
 </p>
 )}
 </div>

 {/* 最近の注文 */}
 <div className="bg-white rounded-lg shadow-md p-6">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-xl font-semibold text-gray-900">
 最近の注文
 </h2>
 <Link
 href="/profile/orders"
 className="text-blue-600 hover:text-blue-700 font-semibold"
 >
 すべて見る →
 </Link>
 </div>

 {ordersLoading ? (
 <p className="text-gray-600">読み込み中...</p>
 ) : ordersData && ordersData.orders.length > 0 ? (
 <div className="space-y-3">
 {ordersData.orders.map((order) => (
 <div
 key={order.id}
 className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
 >
 <Link href={`/orders/${order.id}`} className="block">
 <div className="flex items-center justify-between mb-2">
 <span className="font-semibold text-gray-900">
 注文 #{order.id}
 </span>
 <span
 className={`px-2 py-1 text-xs font-semibold rounded-full ${
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
 </div>
 <div className="flex items-center justify-between text-sm">
 <span className="text-gray-600">
 {new Date(order.createdAt).toLocaleDateString('ja-JP')}
 </span>
 <span className="font-semibold text-gray-900">
 ¥{Number(order.totalAmount).toLocaleString()}
 </span>
 </div>
 </Link>
 </div>
 ))}
 </div>
 ) : (
 <p className="text-gray-600">
 注文履歴がありません
 </p>
 )}
 </div>
 </main>
 </div>
 );
}
