'use client';

import { trpc } from '@/lib/trpc';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Header from '@/components/Header';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import FavoriteButton from '@/components/FavoriteButton';
import { getProductEmoji } from '@/lib/productEmoji';

export default function ProductDetailPage() {
 const params = useParams();
 const router = useRouter();
 const productId = Number(params.id);
 const { addItem } = useCart();
 const { user, isAuthenticated } = useAuth();
 const [isAdded, setIsAdded] = useState(false);
 const [showReviewForm, setShowReviewForm] = useState(false);
 const [rating, setRating] = useState(5);
 const [reviewTitle, setReviewTitle] = useState('');
 const [reviewComment, setReviewComment] = useState('');

 const { data: product, isLoading, error } = trpc.products.getById.useQuery(
 { id: productId },
 { enabled: !isNaN(productId) }
 );

 const { data: reviewsData, refetch: refetchReviews } = trpc.reviews.getByProductId.useQuery(
 { productId },
 { enabled: !isNaN(productId) }
 );

 const { data: ratingData } = trpc.reviews.getProductRating.useQuery(
 { productId },
 { enabled: !isNaN(productId) }
 );

 const createReviewMutation = trpc.reviews.create.useMutation({
 onSuccess: () => {
 alert('レビューを投稿しました');
 setShowReviewForm(false);
 setRating(5);
 setReviewTitle('');
 setReviewComment('');
 refetchReviews();
 },
 onError: (error) => {
 alert(`エラー: ${error.message}`);
 },
 });

 const handleAddToCart = () => {
 if (!product) return;

 // ログインしていない場合はログインページにリダイレクト
 if (!isAuthenticated) {
 router.push('/login');
 return;
 }

 addItem({
 id: product.id,
 name: product.name,
 price: product.price,
 stock: product.stock,
 imageUrl: product.imageUrl,
 });

 setIsAdded(true);
 setTimeout(() => setIsAdded(false), 2000);
 };

 const handleSubmitReview = (e: React.FormEvent) => {
 e.preventDefault();
 if (!user) {
 router.push('/login');
 return;
 }

 createReviewMutation.mutate({
 productId,
 userId: user.id,
 rating,
 title: reviewTitle,
 comment: reviewComment,
 });
 };

 const renderStars = (rating: number) => {
 return (
 <div className="flex gap-1">
 {[1, 2, 3, 4, 5].map((star) => (
 <span
 key={star}
 className={`text-2xl ${
 star <= rating ? 'text-yellow-400' : 'text-gray-300'
 }`}
 >
 ★
 </span>
 ))}
 </div>
 );
 };

 if (isLoading) {
 return (
 <div className="min-h-screen flex items-center justify-center">
 <p className="text-xl">読み込み中...</p>
 </div>
 );
 }

 if (error || !product) {
 return (
 <div className="min-h-screen flex items-center justify-center">
 <div className="text-center">
 <p className="text-xl text-red-600 mb-4">商品が見つかりません</p>
 <Link
 href="/products"
 className="text-blue-600 hover:text-blue-800 underline"
 >
 商品一覧に戻る
 </Link>
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-white">
 <Header />

 {/* メインコンテンツ */}
 <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
 <Link
 href="/products"
 className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2 mb-8 font-light"
 >
 ← 商品一覧に戻る
 </Link>
 <div className="bg-white border border-gray-100 rounded overflow-hidden">
 <div className="md:flex">
 {/* 商品画像 */}
 <div className="md:w-1/2">
 <div className="h-96 bg-gray-50 flex items-center justify-center overflow-hidden">
 {product.imageUrl ? (
 <img
 src={product.imageUrl}
 alt={product.name}
 className="w-full h-full object-cover"
 />
 ) : (
 <span className="text-gray-300 text-9xl">{getProductEmoji(product.name)}</span>
 )}
 </div>
 </div>

 {/* 商品情報 */}
 <div className="md:w-1/2 p-10">
 <div className="flex items-start justify-between mb-6">
 <h1 className="text-2xl font-light text-gray-900 tracking-wide">
 {product.name}
 </h1>
 <FavoriteButton productId={productId} size="lg" />
 </div>

 <p className="text-sm text-gray-600 leading-relaxed mb-8 font-light">
 {product.description}
 </p>

 {/* 価格 */}
 <div className="mb-8">
 <span className="text-3xl font-light text-gray-900">
 ¥{Math.floor(Number(product.price)).toLocaleString()}
 </span>
 </div>

 {/* 在庫状態 */}
 <div className="mb-8">
 {product.stock > 0 ? (
 <span className="inline-flex items-center px-3 py-1 text-xs font-light bg-gray-100 text-gray-700">
 在庫あり ({product.stock}個)
 </span>
 ) : (
 <span className="inline-flex items-center px-3 py-1 text-xs font-light bg-gray-100 text-gray-700">
 在庫切れ
 </span>
 )}
 </div>

 {/* アレルゲン情報 */}
 {product.allergens && Array.isArray(product.allergens) && product.allergens.length > 0 && (
 <div className="mb-8 pb-8 border-b border-gray-100">
 <h3 className="text-xs font-light text-gray-600 mb-3 uppercase tracking-wider">
 アレルゲン情報
 </h3>
 <div className="flex flex-wrap gap-2">
 {product.allergens.map((allergen, index) => (
 <span
 key={index}
 className="px-3 py-1 text-xs bg-gray-100 text-gray-700 font-light"
 >
 {allergen}
 </span>
 ))}
 </div>
 </div>
 )}

 {/* 原材料 */}
 {product.ingredients && Array.isArray(product.ingredients) && product.ingredients.length > 0 && (
 <div className="mb-8 pb-8 border-b border-gray-100">
 <h3 className="text-xs font-light text-gray-600 mb-3 uppercase tracking-wider">
 原材料
 </h3>
 <p className="text-sm text-gray-600 font-light leading-relaxed">
 {product.ingredients.join('、')}
 </p>
 </div>
 )}

 {/* 栄養情報 */}
 {product.nutritionInfo && typeof product.nutritionInfo === 'object' && (
 <div className="mb-8 pb-8 border-b border-gray-100">
 <h3 className="text-xs font-light text-gray-600 mb-4 uppercase tracking-wider">
 栄養情報
 </h3>
 <div className="space-y-2">
 {Object.entries(product.nutritionInfo).map(([key, value]) => (
 <div key={key} className="flex justify-between text-sm">
 <span className="text-gray-600 font-light">{key}:</span>
 <span className="text-gray-900 font-light">{String(value)}</span>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* カートに追加ボタン */}
 <button
 onClick={handleAddToCart}
 className="w-full bg-gray-900 hover:bg-gray-800 text-white font-light py-4 px-6 rounded text-sm transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
 disabled={product.stock === 0}
 >
 {isAdded ? 'カートに追加しました!' : product.stock > 0 ? 'カートに追加' : '売り切れ'}
 </button>
 </div>
 </div>
 </div>

 {/* レビューセクション */}
 <div className="mt-12 bg-white border border-gray-100 rounded p-10">
 <div className="flex justify-between items-center mb-8">
 <div>
 <h2 className="text-xl font-light text-gray-900 mb-3 tracking-wide">
 カスタマーレビュー
 </h2>
 {ratingData && ratingData.totalReviews > 0 && (
 <div className="flex items-center gap-4">
 <div className="flex items-center gap-2">
 {renderStars(Math.round(ratingData.averageRating))}
 <span className="text-base font-light text-gray-900">
 {ratingData.averageRating.toFixed(1)}
 </span>
 </div>
 <span className="text-sm text-gray-500 font-light">
 {ratingData.totalReviews}件のレビュー
 </span>
 </div>
 )}
 </div>

 {isAuthenticated && !showReviewForm && (
 <button
 onClick={() => setShowReviewForm(true)}
 className="bg-gray-900 hover:bg-gray-800 text-white font-light py-2 px-6 rounded text-sm transition-colors"
 >
 レビューを書く
 </button>
 )}
 </div>

 {/* レビュー投稿フォーム */}
 {showReviewForm && (
 <div className="mb-10 p-6 bg-gray-50 border border-gray-100 rounded">
 <h3 className="text-base font-light text-gray-900 mb-6 tracking-wide">
 レビューを投稿
 </h3>
 <form onSubmit={handleSubmitReview}>
 <div className="mb-6">
 <label className="block text-xs font-light text-gray-600 mb-3 uppercase tracking-wider">
 評価
 </label>
 <div className="flex gap-2">
 {[1, 2, 3, 4, 5].map((star) => (
 <button
 key={star}
 type="button"
 onClick={() => setRating(star)}
 className={`text-3xl ${
 star <= rating ? 'text-yellow-400' : 'text-gray-300'
 } hover:text-yellow-400 transition-colors`}
 >
 ★
 </button>
 ))}
 </div>
 </div>

 <div className="mb-6">
 <label className="block text-xs font-light text-gray-600 mb-3 uppercase tracking-wider">
 タイトル（任意）
 </label>
 <input
 type="text"
 value={reviewTitle}
 onChange={(e) => setReviewTitle(e.target.value)}
 className="w-full px-3 py-2 text-sm border border-gray-200 rounded font-light focus:outline-none focus:ring-1 focus:ring-gray-400"
 placeholder="レビューのタイトル"
 />
 </div>

 <div className="mb-6">
 <label className="block text-xs font-light text-gray-600 mb-3 uppercase tracking-wider">
 コメント（任意）
 </label>
 <textarea
 value={reviewComment}
 onChange={(e) => setReviewComment(e.target.value)}
 rows={4}
 className="w-full px-3 py-2 text-sm border border-gray-200 rounded font-light focus:outline-none focus:ring-1 focus:ring-gray-400"
 placeholder="商品の感想をお聞かせください"
 />
 </div>

 <div className="flex gap-4">
 <button
 type="submit"
 disabled={createReviewMutation.isPending}
 className="bg-gray-900 hover:bg-gray-800 text-white font-light py-2 px-8 rounded text-sm transition-colors disabled:bg-gray-300"
 >
 {createReviewMutation.isPending ? '投稿中...' : '投稿する'}
 </button>
 <button
 type="button"
 onClick={() => setShowReviewForm(false)}
 className="border border-gray-200 hover:bg-gray-50 text-gray-700 font-light py-2 px-8 rounded text-sm transition-colors"
 >
 キャンセル
 </button>
 </div>
 </form>
 </div>
 )}

 {/* レビュー一覧 */}
 <div className="space-y-8">
 {reviewsData?.reviews && reviewsData.reviews.length > 0 ? (
 reviewsData.reviews.map((review) => (
 <div
 key={review.id}
 className="border-b border-gray-100 pb-8 last:border-b-0"
 >
 <div className="flex items-start justify-between mb-3">
 <div>
 <div className="flex items-center gap-3 mb-2">
 <span className="font-light text-gray-900">
 {review.userName}
 </span>
 {review.isVerifiedPurchase && (
 <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 font-light">
 購入済み
 </span>
 )}
 </div>
 {renderStars(review.rating)}
 </div>
 <span className="text-xs text-gray-400 font-light">
 {new Date(review.createdAt).toLocaleDateString('ja-JP')}
 </span>
 </div>

 {review.title && (
 <h4 className="font-light text-gray-900 mb-2 text-sm">
 {review.title}
 </h4>
 )}

 {review.comment && (
 <p className="text-sm text-gray-600 font-light leading-relaxed">
 {review.comment}
 </p>
 )}
 </div>
 ))
 ) : (
 <p className="text-sm text-gray-500 text-center py-12 font-light">
 まだレビューがありません。最初のレビューを投稿しましょう！
 </p>
 )}
 </div>
 </div>
 </main>
 </div>
 );
}
