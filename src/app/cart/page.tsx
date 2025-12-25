'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import Header from '@/components/Header';
import Link from 'next/link';
import { getProductEmoji } from '@/lib/productEmoji';

export default function CartPage() {
 const router = useRouter();
 const { isAuthenticated, isLoading } = useAuth();
 const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCart();

 // カート内の各商品の最新情報を取得
 const productIds = items.map(item => item.id);
 const { data: products } = trpc.products.getByIds.useQuery(
 { ids: productIds },
 { enabled: productIds.length > 0 }
 );

 // 商品データとカートアイテムをマージ
 const enrichedItems = items.map(item => {
 const productData = products?.find(p => p.id === item.id);
 return {
 ...item,
 imageUrl: item.imageUrl || productData?.imageUrl || null,
 };
 });

 // 認証チェック: ログインしていない場合はログインページにリダイレクト
 useEffect(() => {
 if (!isLoading && !isAuthenticated) {
 router.push('/login');
 }
 }, [isAuthenticated, isLoading, router]);

 // ローディング中または未認証の場合は何も表示しない
 if (isLoading || !isAuthenticated) {
 return (
 <div className="min-h-screen flex items-center justify-center">
 <p className="text-xl">読み込み中...</p>
 </div>
 );
 }

 if (items.length === 0) {
 return (
 <div className="min-h-screen bg-white">
 <Header />
 <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
 <h1 className="text-2xl font-light text-gray-900 mb-8 tracking-wide">
 ショッピングカート
 </h1>
 <div className="bg-gray-50 border border-gray-100 rounded p-16 text-center">
 <svg
 xmlns="http://www.w3.org/2000/svg"
 fill="none"
 viewBox="0 0 24 24"
 strokeWidth={1}
 stroke="currentColor"
 className="w-16 h-16 mx-auto mb-6 text-gray-300"
 >
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
 />
 </svg>
 <p className="text-sm text-gray-600 mb-8 font-light">
 カートは空です
 </p>
 <Link
 href="/products"
 className="inline-block bg-gray-900 hover:bg-gray-800 text-white font-light py-3 px-8 rounded text-sm transition-colors"
 >
 商品を見る
 </Link>
 </div>
 </main>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-white">
 <Header />
 <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
 <h1 className="text-2xl font-light text-gray-900 mb-8 tracking-wide">
 ショッピングカート
 </h1>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* カート商品リスト */}
 <div className="lg:col-span-2 space-y-4">
 {enrichedItems.map((item) => (
 <div
 key={item.id}
 className="bg-white border border-gray-100 rounded p-6"
 >
 <div className="flex gap-6">
 {/* 商品画像 */}
 <div className="w-24 h-24 bg-gray-50 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
 {item.imageUrl ? (
 <img
 src={item.imageUrl}
 alt={item.name}
 className="w-full h-full object-cover"
 />
 ) : (
 <span className="text-gray-300 text-3xl">
 {getProductEmoji(item.name)}
 </span>
 )}
 </div>

 {/* 商品情報 */}
 <div className="flex-1">
 <div className="flex justify-between items-start mb-3">
 <Link
 href={`/products/${item.id}`}
 className="text-base font-normal text-gray-900 hover:text-gray-600 tracking-wide"
 >
 {item.name}
 </Link>
 <button
 onClick={() => removeItem(item.id)}
 className="text-gray-400 hover:text-gray-600"
 aria-label="削除"
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
 d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
 />
 </svg>
 </button>
 </div>

 <p className="text-lg font-light text-gray-900 mb-4">
 ¥{Math.floor(Number(item.price)).toLocaleString()}
 </p>

 {/* 数量変更 */}
 <div className="flex items-center gap-3">
 <label className="text-xs text-gray-500 font-light uppercase tracking-wider">
 数量:
 </label>
 <button
 onClick={() => updateQuantity(item.id, item.quantity - 1)}
 className="w-7 h-7 rounded border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-sm font-light"
 disabled={item.quantity <= 1}
 >
 −
 </button>
 <span className="w-12 text-center font-light text-gray-900 text-sm">
 {item.quantity}
 </span>
 <button
 onClick={() => updateQuantity(item.id, item.quantity + 1)}
 className="w-7 h-7 rounded border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-sm font-light"
 disabled={item.quantity >= item.stock}
 >
 +
 </button>
 <span className="text-xs text-gray-400 font-light">
 (在庫: {item.stock})
 </span>
 </div>

 {/* 小計 */}
 <div className="mt-4 text-right">
 <span className="text-xs text-gray-500 font-light uppercase tracking-wider">
 小計:{' '}
 </span>
 <span className="text-base font-light text-gray-900">
 ¥{Math.floor(parseFloat(item.price) * item.quantity).toLocaleString()}
 </span>
 </div>
 </div>
 </div>
 </div>
 ))}

 {/* カートをクリアボタン */}
 <button
 onClick={clearCart}
 className="w-full py-3 text-xs text-gray-500 hover:text-gray-700 font-light transition-colors underline underline-offset-2"
 >
 カートを空にする
 </button>
 </div>

 {/* 注文サマリー */}
 <div className="lg:col-span-1">
 <div className="bg-white border border-gray-100 rounded p-6 sticky top-24">
 <h2 className="text-base font-light text-gray-900 mb-6 tracking-wide">
 注文サマリー
 </h2>

 <div className="space-y-3 mb-8">
 <div className="flex justify-between text-sm text-gray-600 font-light">
 <span>商品点数:</span>
 <span>{items.reduce((sum, item) => sum + item.quantity, 0)}点</span>
 </div>
 <div className="flex justify-between text-sm text-gray-600 font-light">
 <span>小計:</span>
 <span>¥{Math.floor(totalPrice).toLocaleString()}</span>
 </div>
 <div className="flex justify-between text-sm text-gray-600 font-light">
 <span>配送料:</span>
 <span>¥0</span>
 </div>
 <div className="border-t border-gray-100 pt-3 mt-4">
 <div className="flex justify-between text-base font-light text-gray-900">
 <span>合計:</span>
 <span>¥{Math.floor(totalPrice).toLocaleString()}</span>
 </div>
 </div>
 </div>

 <Link
 href="/checkout"
 className="block w-full bg-gray-900 hover:bg-gray-800 text-white font-light py-4 px-6 rounded text-sm transition-colors mb-3 text-center"
 >
 レジに進む
 </Link>

 <Link
 href="/products"
 className="block w-full text-center text-gray-600 hover:text-gray-900 font-light py-3 text-sm underline underline-offset-2"
 >
 買い物を続ける
 </Link>
 </div>
 </div>
 </div>
 </main>
 </div>
 );
}
