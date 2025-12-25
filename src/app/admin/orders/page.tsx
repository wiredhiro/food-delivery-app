'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import Header from '@/components/Header';
import Link from 'next/link';

export default function AdminOrdersPage() {
 const router = useRouter();
 const { isAuthenticated, isLoading: authLoading, user } = useAuth();
 const [selectedStatus, setSelectedStatus] = useState<string>('');
 const [showTrackingModal, setShowTrackingModal] = useState(false);
 const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
 const [trackingForm, setTrackingForm] = useState({
 status: 'pending' as any,
 statusDescription: '',
 location: '',
 carrier: '',
 trackingNumber: '',
 estimatedDelivery: '',
 notes: '',
 });

 const { data: ordersData, isLoading: ordersLoading, refetch } = trpc.admin.getAllOrders.useQuery({ limit: 100 });

 const updateStatusMutation = trpc.admin.updateOrderStatus.useMutation({
 onSuccess: () => {
 refetch();
 },
 });

 const updateTrackingMutation = trpc.delivery.updateStatus.useMutation({
 onSuccess: () => {
 refetch();
 setShowTrackingModal(false);
 setSelectedOrderId(null);
 setTrackingForm({
 status: 'pending',
 statusDescription: '',
 location: '',
 carrier: '',
 trackingNumber: '',
 estimatedDelivery: '',
 notes: '',
 });
 },
 });

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

 const handleStatusChange = async (orderId: number, newStatus: string) => {
 await updateStatusMutation.mutateAsync({
 orderId,
 status: newStatus as any,
 });
 };

 const handleOpenTrackingModal = (orderId: number) => {
 setSelectedOrderId(orderId);
 setShowTrackingModal(true);
 };

 const handleSubmitTracking = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!selectedOrderId) return;

 await updateTrackingMutation.mutateAsync({
 orderId: selectedOrderId,
 status: trackingForm.status,
 statusDescription: trackingForm.statusDescription || undefined,
 location: trackingForm.location || undefined,
 carrier: trackingForm.carrier || undefined,
 trackingNumber: trackingForm.trackingNumber || undefined,
 estimatedDelivery: trackingForm.estimatedDelivery || undefined,
 notes: trackingForm.notes || undefined,
 });
 };

 const filteredOrders = selectedStatus
 ? ordersData?.orders.filter(order => order.status === selectedStatus)
 : ordersData?.orders;

 return (
 <div className="min-h-screen bg-gray-50">
 <Header />

 <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
 <div className="mb-8 flex items-center justify-between">
 <div>
 <Link
 href="/admin"
 className="text-blue-600 hover:text-blue-700 mb-2 inline-block"
 >
 ← ダッシュボードに戻る
 </Link>
 <h1 className="text-3xl font-bold text-gray-900">
 注文管理
 </h1>
 </div>

 {/* フィルター */}
 <div>
 <label className="text-sm font-medium text-gray-700 mr-2">
 ステータスフィルター:
 </label>
 <select
 value={selectedStatus}
 onChange={(e) => setSelectedStatus(e.target.value)}
 className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
 >
 <option value="">すべて</option>
 <option value="pending">処理中</option>
 <option value="confirmed">確認済み</option>
 <option value="preparing">準備中</option>
 <option value="shipped">配送中</option>
 <option value="delivered">配達完了</option>
 <option value="cancelled">キャンセル</option>
 </select>
 </div>
 </div>

 {ordersLoading ? (
 <div className="text-center py-12">
 <p className="text-xl text-gray-600">読み込み中...</p>
 </div>
 ) : filteredOrders?.length === 0 ? (
 <div className="bg-white rounded-lg shadow-md p-8 text-center">
 <p className="text-xl text-gray-600">
 {selectedStatus ? '該当する注文がありません' : '注文がありません'}
 </p>
 </div>
 ) : (
 <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
 支払い
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
 注文日時
 </th>
 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
 操作
 </th>
 </tr>
 </thead>
 <tbody className="bg-white divide-y divide-gray-200">
 {filteredOrders?.map((order) => (
 <tr key={order.id} className="hover:bg-gray-50">
 <td className="px-6 py-4 whitespace-nowrap">
 <Link
 href={`/orders/${order.id}`}
 className="text-sm font-medium text-blue-600 hover:text-blue-700"
 >
 #{order.id}
 </Link>
 </td>
 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
 {order.userId}
 </td>
 <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
 ¥{Number(order.totalAmount).toLocaleString()}
 </td>
 <td className="px-6 py-4 whitespace-nowrap">
 <select
 value={order.status}
 onChange={(e) => handleStatusChange(order.id, e.target.value)}
 className={`px-2 py-1 text-xs font-semibold rounded-full border-0 ${
 order.status === 'delivered'
 ? 'bg-green-100 text-green-800'
 : order.status === 'shipped'
 ? 'bg-blue-100 text-blue-800'
 : order.status === 'preparing'
 ? 'bg-purple-100 text-purple-800'
 : order.status === 'confirmed'
 ? 'bg-indigo-100 text-indigo-800'
 : order.status === 'cancelled'
 ? 'bg-red-100 text-red-800'
 : 'bg-yellow-100 text-yellow-800'
 }`}
 >
 <option value="pending">処理中</option>
 <option value="confirmed">確認済み</option>
 <option value="preparing">準備中</option>
 <option value="shipped">配送中</option>
 <option value="delivered">配達完了</option>
 <option value="cancelled">キャンセル</option>
 </select>
 </td>
 <td className="px-6 py-4 whitespace-nowrap">
 <span
 className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
 order.paymentStatus === 'paid'
 ? 'bg-green-100 text-green-800'
 : order.paymentStatus === 'failed'
 ? 'bg-red-100 text-red-800'
 : 'bg-yellow-100 text-yellow-800'
 }`}
 >
 {order.paymentStatus === 'paid'
 ? '支払済'
 : order.paymentStatus === 'failed'
 ? '失敗'
 : '待機中'}
 </span>
 </td>
 <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
 {new Date(order.createdAt).toLocaleDateString('ja-JP', {
 year: 'numeric',
 month: '2-digit',
 day: '2-digit',
 hour: '2-digit',
 minute: '2-digit',
 })}
 </td>
 <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
 <Link
 href={`/orders/${order.id}`}
 className="text-blue-600 hover:text-blue-700 font-semibold"
 >
 詳細
 </Link>
 <button
 onClick={() => handleOpenTrackingModal(order.id)}
 className="text-green-600 hover:text-green-700 font-semibold"
 >
 配送更新
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* 配送トラッキング更新モーダル */}
 {showTrackingModal && (
 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
 <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
 <h2 className="text-xl font-bold text-gray-900 mb-4">
 配送状況を更新
 </h2>
 <form onSubmit={handleSubmitTracking} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 配送ステータス *
 </label>
 <select
 value={trackingForm.status}
 onChange={(e) =>
 setTrackingForm({
 ...trackingForm,
 status: e.target.value as any,
 })
 }
 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
 required
 >
 <option value="pending">保留中</option>
 <option value="preparing">準備中</option>
 <option value="ready_for_shipping">発送準備完了</option>
 <option value="shipped">発送済み</option>
 <option value="in_transit">輸送中</option>
 <option value="out_for_delivery">配達中</option>
 <option value="delivered">配達完了</option>
 <option value="cancelled">キャンセル</option>
 </select>
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 ステータス説明
 </label>
 <input
 type="text"
 value={trackingForm.statusDescription}
 onChange={(e) =>
 setTrackingForm({
 ...trackingForm,
 statusDescription: e.target.value,
 })
 }
 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
 placeholder="例: 商品を準備中です"
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 現在地
 </label>
 <input
 type="text"
 value={trackingForm.location}
 onChange={(e) =>
 setTrackingForm({
 ...trackingForm,
 location: e.target.value,
 })
 }
 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
 placeholder="例: 東京配送センター"
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 配送業者
 </label>
 <input
 type="text"
 value={trackingForm.carrier}
 onChange={(e) =>
 setTrackingForm({
 ...trackingForm,
 carrier: e.target.value,
 })
 }
 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
 placeholder="例: ヤマト運輸"
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 追跡番号
 </label>
 <input
 type="text"
 value={trackingForm.trackingNumber}
 onChange={(e) =>
 setTrackingForm({
 ...trackingForm,
 trackingNumber: e.target.value,
 })
 }
 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
 placeholder="例: 1234-5678-9012"
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 配達予定日
 </label>
 <input
 type="datetime-local"
 value={trackingForm.estimatedDelivery}
 onChange={(e) =>
 setTrackingForm({
 ...trackingForm,
 estimatedDelivery: e.target.value,
 })
 }
 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 備考
 </label>
 <textarea
 value={trackingForm.notes}
 onChange={(e) =>
 setTrackingForm({
 ...trackingForm,
 notes: e.target.value,
 })
 }
 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
 rows={3}
 placeholder="追加の情報があれば入力してください"
 />
 </div>

 <div className="flex gap-3 pt-4">
 <button
 type="submit"
 disabled={updateTrackingMutation.isPending}
 className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
 >
 {updateTrackingMutation.isPending
 ? '更新中...'
 : '更新'}
 </button>
 <button
 type="button"
 onClick={() => setShowTrackingModal(false)}
 className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
 >
 キャンセル
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </main>
 </div>
 );
}
