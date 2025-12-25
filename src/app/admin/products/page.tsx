'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import Header from '@/components/Header';
import Link from 'next/link';

export default function AdminProductsPage() {
 const router = useRouter();
 const { isAuthenticated, isLoading: authLoading, user } = useAuth();

 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingProduct, setEditingProduct] = useState<any>(null);
 const [formData, setFormData] = useState({
 name: '',
 description: '',
 price: '',
 stock: 0,
 categoryId: 1,
 imageUrl: '',
 isActive: true,
 });

 const { data: productsData, isLoading: productsLoading, refetch } = trpc.products.getAll.useQuery();

 const createProductMutation = trpc.admin.createProduct.useMutation({
 onSuccess: () => {
 refetch();
 closeModal();
 },
 });

 const updateProductMutation = trpc.admin.updateProduct.useMutation({
 onSuccess: () => {
 refetch();
 closeModal();
 },
 });

 const deleteProductMutation = trpc.admin.deleteProduct.useMutation({
 onSuccess: () => {
 refetch();
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

 const openCreateModal = () => {
 setEditingProduct(null);
 setFormData({
 name: '',
 description: '',
 price: '',
 stock: 0,
 categoryId: 1,
 imageUrl: '',
 isActive: true,
 });
 setIsModalOpen(true);
 };

 const openEditModal = (product: any) => {
 setEditingProduct(product);
 setFormData({
 name: product.name,
 description: product.description || '',
 price: product.price,
 stock: product.stock,
 categoryId: product.categoryId || 1,
 imageUrl: product.imageUrl || '',
 isActive: product.isActive,
 });
 setIsModalOpen(true);
 };

 const closeModal = () => {
 setIsModalOpen(false);
 setEditingProduct(null);
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();

 if (editingProduct) {
 await updateProductMutation.mutateAsync({
 id: editingProduct.id,
 ...formData,
 });
 } else {
 await createProductMutation.mutateAsync(formData);
 }
 };

 const handleDelete = async (productId: number, productName: string) => {
 if (confirm(`「${productName}」を削除しますか？\n（商品は非アクティブになります）`)) {
 await deleteProductMutation.mutateAsync({ id: productId });
 }
 };

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
 商品管理
 </h1>
 </div>

 <button
 onClick={openCreateModal}
 className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
 >
 + 新規商品追加
 </button>
 </div>

 {productsLoading ? (
 <div className="text-center py-12">
 <p className="text-xl text-gray-600">読み込み中...</p>
 </div>
 ) : productsData?.products.length === 0 ? (
 <div className="bg-white rounded-lg shadow-md p-8 text-center">
 <p className="text-xl text-gray-600">商品がありません</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {productsData?.products.map((product) => (
 <div
 key={product.id}
 className={`bg-white rounded-lg shadow-md overflow-hidden ${
 !product.isActive ? 'opacity-60' : ''
 }`}
 >
 <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-500 relative">
 {product.imageUrl ? (
 <img
 src={product.imageUrl}
 alt={product.name}
 className="w-full h-full object-cover"
 />
 ) : (
 <div className="w-full h-full flex items-center justify-center text-white text-6xl">
 🍱
 </div>
 )}
 {!product.isActive && (
 <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
 <span className="text-white font-bold text-xl">非アクティブ</span>
 </div>
 )}
 </div>

 <div className="p-4">
 <h3 className="text-lg font-semibold text-gray-900 mb-2">
 {product.name}
 </h3>
 <p className="text-sm text-gray-600 mb-3 line-clamp-2">
 {product.description}
 </p>

 <div className="flex items-center justify-between mb-4">
 <span className="text-2xl font-bold text-blue-600">
 ¥{Number(product.price).toLocaleString()}
 </span>
 <span className="text-sm text-gray-600">
 在庫: {product.stock}
 </span>
 </div>

 <div className="flex gap-2">
 <button
 onClick={() => openEditModal(product)}
 className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
 >
 編集
 </button>
 <button
 onClick={() => handleDelete(product.id, product.name)}
 className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
 >
 削除
 </button>
 </div>
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
 {editingProduct ? '商品を編集' : '新規商品を追加'}
 </h2>

 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 商品名 *
 </label>
 <input
 type="text"
 value={formData.name}
 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
 required
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 説明 *
 </label>
 <textarea
 value={formData.description}
 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
 rows={3}
 required
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 価格 (円) *
 </label>
 <input
 type="number"
 step="0.01"
 value={formData.price}
 onChange={(e) => setFormData({ ...formData, price: e.target.value })}
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
 required
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 在庫数 *
 </label>
 <input
 type="number"
 value={formData.stock}
 onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
 required
 />
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 カテゴリー
 </label>
 <select
 value={formData.categoryId}
 onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value) })}
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
 >
 <option value={1}>和食</option>
 <option value={2}>洋食</option>
 <option value={3}>中華</option>
 <option value={4}>健康食</option>
 </select>
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 画像URL
 </label>
 <input
 type="url"
 value={formData.imageUrl}
 onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
 placeholder="https://example.com/image.jpg"
 />
 </div>

 {editingProduct && (
 <div className="flex items-center">
 <input
 type="checkbox"
 id="isActive"
 checked={formData.isActive}
 onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
 className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
 />
 <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
 アクティブ（販売中）
 </label>
 </div>
 )}

 <div className="flex gap-3 pt-4">
 <button
 type="submit"
 disabled={createProductMutation.isPending || updateProductMutation.isPending}
 className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:bg-gray-400"
 >
 {createProductMutation.isPending || updateProductMutation.isPending
 ? '処理中...'
 : editingProduct
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
