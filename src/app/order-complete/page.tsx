'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';

function OrderCompleteContent() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const { isAuthenticated, isLoading } = useAuth();
 const orderId = searchParams.get('orderId');

 // 認証チェック
 useEffect(() => {
 if (!isLoading && !isAuthenticated) {
 router.push('/login');
 }
 }, [isAuthenticated, isLoading, router]);

 if (isLoading || !isAuthenticated) {
 return (
 <div className="min-h-screen flex items-center justify-center">
 <p className="text-xl">読み込み中...</p>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-gray-50">
 <Header />

 <main className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
 <div className="bg-white rounded-lg shadow-md p-8 text-center">
 {/* 成功アイコン */}
 <div className="mb-6">
 <svg
 className="w-20 h-20 mx-auto text-green-500"
 fill="none"
 stroke="currentColor"
 viewBox="0 0 24 24"
 >
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 strokeWidth={2}
 d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
 />
 </svg>
 </div>

 <h1 className="text-3xl font-bold text-gray-900 mb-4">
 ご注文ありがとうございます！
 </h1>

 <p className="text-lg text-gray-600 mb-2">
 注文が正常に完了しました
 </p>

 {orderId && (
 <p className="text-sm text-gray-500 mb-8">
 注文番号: #{orderId}
 </p>
 )}

 <div className="bg-blue-50 rounded-lg p-6 mb-8">
 <p className="text-gray-700">
 ご注文の確認メールを送信しました。
 <br />
 商品は準備が整い次第、順次発送いたします。
 </p>
 </div>

 <div className="flex flex-col sm:flex-row gap-4 justify-center">
 <Link
 href="/products"
 className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200"
 >
 買い物を続ける
 </Link>
 <Link
 href="/"
 className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-3 px-8 rounded-lg transition-colors duration-200"
 >
 ホームに戻る
 </Link>
 </div>
 </div>
 </main>
 </div>
 );
}

export default function OrderCompletePage() {
 return (
 <Suspense fallback={
 <div className="min-h-screen flex items-center justify-center">
 <p className="text-xl">読み込み中...</p>
 </div>
 }>
 <OrderCompleteContent />
 </Suspense>
 );
}
