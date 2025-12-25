'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { trpc } from '@/lib/trpc';
import StarRating from '@/components/StarRating';
import FavoriteButton from '@/components/FavoriteButton';
import { getProductEmoji } from '@/lib/productEmoji';

export default function FavoritesPage() {
 const router = useRouter();
 const { user, isAuthenticated, isLoading: authLoading } = useAuth();
 const { favoritesCount } = useFavorites();

 const { data: favoritesData, isLoading, refetch } = trpc.favorites.getByUserId.useQuery(
 { userId: user?.id || 0 },
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
 <div className="min-h-screen bg-white">
 <Header />

 <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
 <h1 className="text-2xl font-light text-gray-900 mb-8 tracking-wide">
 お気に入り
 </h1>

 {isLoading ? (
 <div className="flex items-center justify-center py-20">
 <p className="text-sm text-gray-500 font-light">読み込み中...</p>
 </div>
 ) : favoritesData?.favorites && favoritesData.favorites.length > 0 ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
 {favoritesData.favorites.map((favorite) => (
 <div
 key={favorite.id}
 className="group bg-white border border-gray-100 rounded overflow-hidden hover:border-gray-300 transition-all"
 >
 <Link href={`/products/${favorite.productId}`}>
 <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden">
 {favorite.productImageUrl ? (
 <img
 src={favorite.productImageUrl}
 alt={favorite.productName || ''}
 className="w-full h-full object-cover"
 />
 ) : (
 <div className="w-full h-full flex items-center justify-center text-gray-300 text-7xl">
 {getProductEmoji(favorite.productName || '')}
 </div>
 )}
 {/* お気に入りボタン */}
 <div className="absolute top-3 right-3">
 <FavoriteButton productId={favorite.productId} size="md" />
 </div>
 </div>

 <div className="p-5">
 <h2 className="text-base font-normal text-gray-900 mb-2 tracking-wide">
 {favorite.productName}
 </h2>
 <p className="text-sm text-gray-500 mb-4 line-clamp-2 font-light leading-relaxed">
 {favorite.productDescription}
 </p>

 <div className="flex items-baseline justify-between mb-4">
 <span className="text-lg font-light text-gray-900">
 ¥{favorite.productPrice ? Number(favorite.productPrice).toLocaleString() : '0'}
 </span>
 <span className="text-xs text-gray-400 font-light">
 在庫: {favorite.productStock || 0}
 </span>
 </div>

 <div className="pt-3 border-t border-gray-100">
 <span className="text-xs text-gray-600 font-light group-hover:text-gray-900 transition-colors">
 詳細を見る →
 </span>
 </div>
 </div>
 </Link>
 </div>
 ))}
 </div>
 ) : (
 <div className="bg-gray-50 border border-gray-100 rounded p-16 text-center">
 <div className="mb-6">
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mx-auto text-gray-300">
 <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
 </svg>
 </div>
 <p className="text-sm text-gray-600 mb-8 font-light">
 お気に入りに追加された商品はまだありません
 </p>
 <Link
 href="/products"
 className="inline-block bg-gray-900 hover:bg-gray-800 text-white font-light py-3 px-8 rounded text-sm transition-colors"
 >
 商品を探す
 </Link>
 </div>
 )}
 </main>
 </div>
 );
}
