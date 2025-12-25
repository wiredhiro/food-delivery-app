'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import Header from '@/components/Header';
import Link from 'next/link';

export default function AddressesPage() {
 const router = useRouter();
 const { isAuthenticated, isLoading: authLoading, user } = useAuth();

 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingAddress, setEditingAddress] = useState<any>(null);
 const [formData, setFormData] = useState({
 name: '',
 postalCode: '',
 prefecture: '',
 city: '',
 addressLine1: '',
 addressLine2: '',
 phoneNumber: '',
 isDefault: false,
 });

 const { data: addresses, isLoading, refetch } = trpc.user.getAddresses.useQuery(
 { userId: user?.id || 0 },
 { enabled: !!user?.id }
 );

 const addAddressMutation = trpc.user.addAddress.useMutation({
 onSuccess: () => {
 refetch();
 closeModal();
 },
 });

 const updateAddressMutation = trpc.user.updateAddress.useMutation({
 onSuccess: () => {
 refetch();
 closeModal();
 },
 });

 const deleteAddressMutation = trpc.user.deleteAddress.useMutation({
 onSuccess: () => {
 refetch();
 },
 });

 const setDefaultMutation = trpc.user.setDefaultAddress.useMutation({
 onSuccess: () => {
 refetch();
 },
 });

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

 const openCreateModal = () => {
 setEditingAddress(null);
 setFormData({
 name: '',
 postalCode: '',
 prefecture: '',
 city: '',
 addressLine1: '',
 addressLine2: '',
 phoneNumber: '',
 isDefault: false,
 });
 setIsModalOpen(true);
 };

 const openEditModal = (address: any) => {
 setEditingAddress(address);
 setFormData({
 name: address.name,
 postalCode: address.postalCode,
 prefecture: address.prefecture,
 city: address.city,
 addressLine1: address.addressLine1,
 addressLine2: address.addressLine2 || '',
 phoneNumber: address.phoneNumber,
 isDefault: address.isDefault,
 });
 setIsModalOpen(true);
 };

 const closeModal = () => {
 setIsModalOpen(false);
 setEditingAddress(null);
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!user) return;

 if (editingAddress) {
 await updateAddressMutation.mutateAsync({
 id: editingAddress.id,
 userId: user.id,
 ...formData,
 });
 } else {
 await addAddressMutation.mutateAsync({
 userId: user.id,
 ...formData,
 });
 }
 };

 const handleDelete = async (addressId: number) => {
 if (!user) return;
 if (confirm('この配送先住所を削除しますか？')) {
 await deleteAddressMutation.mutateAsync({
 id: addressId,
 userId: user.id,
 });
 }
 };

 const handleSetDefault = async (addressId: number) => {
 if (!user) return;
 await setDefaultMutation.mutateAsync({
 id: addressId,
 userId: user.id,
 });
 };

 return (
 <div className="min-h-screen bg-gray-50">
 <Header />

 <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
 <div className="mb-8 flex items-center justify-between">
 <div>
 <Link
 href="/profile"
 className="text-blue-600 hover:text-blue-700 mb-2 inline-block"
 >
 ← マイページに戻る
 </Link>
 <h1 className="text-3xl font-bold text-gray-900">
 配送先住所管理
 </h1>
 </div>

 <button
 onClick={openCreateModal}
 className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
 >
 + 新規追加
 </button>
 </div>

 {isLoading ? (
 <div className="text-center py-12">
 <p className="text-xl text-gray-600">読み込み中...</p>
 </div>
 ) : addresses && addresses.length === 0 ? (
 <div className="bg-white rounded-lg shadow-md p-8 text-center">
 <p className="text-xl text-gray-600 mb-4">
 配送先住所が登録されていません
 </p>
 <button
 onClick={openCreateModal}
 className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
 >
 最初の住所を追加
 </button>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {addresses?.map((address) => (
 <div
 key={address.id}
 className="bg-white rounded-lg shadow-md p-6"
 >
 {address.isDefault && (
 <span className="inline-block px-3 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full mb-3">
 デフォルト
 </span>
 )}

 <div className="mb-4">
 <p className="text-lg font-semibold text-gray-900 mb-2">
 {address.name}
 </p>
 <p className="text-sm text-gray-600">
 〒{address.postalCode}
 </p>
 <p className="text-sm text-gray-600">
 {address.prefecture}{address.city}{address.addressLine1}
 </p>
 {address.addressLine2 && (
 <p className="text-sm text-gray-600">
 {address.addressLine2}
 </p>
 )}
 <p className="text-sm text-gray-600 mt-1">
 TEL: {address.phoneNumber}
 </p>
 </div>

 <div className="flex gap-2">
 {!address.isDefault && (
 <button
 onClick={() => handleSetDefault(address.id)}
 className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
 >
 デフォルトに設定
 </button>
 )}
 <button
 onClick={() => openEditModal(address)}
 className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
 >
 編集
 </button>
 <button
 onClick={() => handleDelete(address.id)}
 className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
 >
 削除
 </button>
 </div>
 </div>
 ))}
 </div>
 )}

 {/* モーダル */}
 {isModalOpen && (
 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
 <div className="p-6">
 <h2 className="text-2xl font-bold text-gray-900 mb-6">
 {editingAddress ? '配送先住所を編集' : '配送先住所を追加'}
 </h2>

 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 宛名 *
 </label>
 <input
 type="text"
 value={formData.name}
 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
 required
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 郵便番号 *
 </label>
 <input
 type="text"
 value={formData.postalCode}
 onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
 placeholder="123-4567"
 required
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 都道府県 *
 </label>
 <input
 type="text"
 value={formData.prefecture}
 onChange={(e) => setFormData({ ...formData, prefecture: e.target.value })}
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
 placeholder="東京都"
 required
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 市区町村 *
 </label>
 <input
 type="text"
 value={formData.city}
 onChange={(e) => setFormData({ ...formData, city: e.target.value })}
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
 placeholder="渋谷区"
 required
 />
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 番地 *
 </label>
 <input
 type="text"
 value={formData.addressLine1}
 onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
 placeholder="1-2-3"
 required
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 建物名・部屋番号
 </label>
 <input
 type="text"
 value={formData.addressLine2}
 onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
 placeholder="〇〇マンション 101号室"
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 電話番号 *
 </label>
 <input
 type="tel"
 value={formData.phoneNumber}
 onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
 placeholder="090-1234-5678"
 required
 />
 </div>

 <div className="flex items-center">
 <input
 type="checkbox"
 id="isDefault"
 checked={formData.isDefault}
 onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
 className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
 />
 <label htmlFor="isDefault" className="ml-2 text-sm font-medium text-gray-700">
 この住所をデフォルトに設定
 </label>
 </div>

 <div className="flex gap-3 pt-4">
 <button
 type="submit"
 disabled={addAddressMutation.isPending || updateAddressMutation.isPending}
 className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:bg-gray-400"
 >
 {addAddressMutation.isPending || updateAddressMutation.isPending
 ? '処理中...'
 : editingAddress
 ? '更新'
 : '追加'}
 </button>
 <button
 type="button"
 onClick={closeModal}
 className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
 >
 キャンセル
 </button>
 </div>
 </form>
 </div>
 </div>
 </div>
 )}
 </main>
 </div>
 );
}
