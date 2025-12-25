'use client';

import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { getProductEmoji } from '@/lib/productEmoji';

export default function HomePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data, isLoading: productsLoading, error } = trpc.products.getAll.useQuery({});

  // 最初の3つの商品を取得
  const featuredProducts = data?.products.slice(0, 3) || [];

  // 認証状態の読み込み中は何も表示しない（Hydrationエラー回避）
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* ヒーローセクション */}
      <section className="bg-gradient-to-br from-rose-50 via-red-50 to-orange-50 border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-light text-gray-900 mb-6 tracking-wide leading-tight">
              パーソナライズされた食事を
              <br />
              あなたのもとへ
            </h1>
            <p className="text-base text-gray-700 mb-10 font-light leading-relaxed">
              AIと数理最適化で、あなたに最適な栄養バランスの食事を提供します
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/products"
                className="bg-red-600 text-white font-light py-3 px-8 rounded text-sm hover:bg-red-700 transition-colors shadow-sm"
              >
                商品を見る
              </Link>
              {!isAuthenticated && (
                <Link
                  href="/signup"
                  className="bg-white border border-red-200 text-gray-900 font-light py-3 px-8 rounded text-sm hover:bg-red-50 transition-colors shadow-sm"
                >
                  無料で始める
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-light text-center text-gray-900 mb-16 tracking-wide">
            サービスの特徴
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* 特徴1 */}
            <div className="text-center">
              <div className="text-4xl mb-4 text-gray-300">🤖</div>
              <h3 className="text-base font-normal text-gray-900 mb-3 tracking-wide">
                AI による最適化
              </h3>
              <p className="text-sm text-gray-600 font-light leading-relaxed">
                あなたの健康目標と好みに合わせて、最適な食事プランをAIが自動生成します
              </p>
            </div>

            {/* 特徴2 */}
            <div className="text-center">
              <div className="text-4xl mb-4 text-gray-300">🥗</div>
              <h3 className="text-base font-normal text-gray-900 mb-3 tracking-wide">
                栄養バランス
              </h3>
              <p className="text-sm text-gray-600 font-light leading-relaxed">
                管理栄養士監修のメニューで、必要な栄養素をバランスよく摂取できます
              </p>
            </div>

            {/* 特徴3 */}
            <div className="text-center">
              <div className="text-4xl mb-4 text-gray-300">🚚</div>
              <h3 className="text-base font-normal text-gray-900 mb-3 tracking-wide">
                便利な宅配
              </h3>
              <p className="text-sm text-gray-600 font-light leading-relaxed">
                忙しいあなたに代わって、美味しくて健康的な食事をご自宅までお届けします
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 人気商品セクション */}
      <section className="py-20 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-2xl font-light text-gray-900 tracking-wide">
              人気の商品
            </h2>
            <Link
              href="/products"
              className="text-sm text-gray-600 hover:text-gray-900 font-light"
            >
              すべて見る →
            </Link>
          </div>

          {productsLoading && (
            <div className="text-center py-20">
              <p className="text-sm text-gray-500 font-light">
                商品を読み込み中...
              </p>
            </div>
          )}

          {error && (
            <div className="text-center py-20">
              <p className="text-sm text-gray-600 font-light">
                商品の読み込みに失敗しました
              </p>
            </div>
          )}

          {!productsLoading && !error && featuredProducts.length === 0 && (
            <div className="text-center py-20">
              <p className="text-sm text-gray-600 font-light">
                商品がまだ登録されていません
              </p>
            </div>
          )}

          {!productsLoading && featuredProducts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group bg-white border border-gray-100 rounded overflow-hidden hover:border-gray-300 transition-all block cursor-pointer"
                >
                  {/* 商品画像 */}
                  <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-6xl text-gray-300">{getProductEmoji(product.name)}</span>
                    )}
                  </div>

                  {/* 商品情報 */}
                  <div className="p-5">
                    <h3 className="text-base font-normal text-gray-900 mb-2 tracking-wide">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2 font-light leading-relaxed">
                      {product.description}
                    </p>
                    <div className="flex justify-between items-baseline">
                      <span className="text-lg font-light text-gray-900">
                        ¥{Math.floor(Number(product.price)).toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-400 font-light">
                        在庫: {product.stock}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTAセクション */}
      <section className="py-20 bg-gradient-to-br from-rose-50 via-red-50 to-orange-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-light text-gray-900 mb-6 tracking-wide">
            健康的な食生活を今日から始めませんか？
          </h2>
          <p className="text-sm text-gray-700 mb-10 font-light leading-relaxed">
            無料アカウント登録で、パーソナライズされた食事プランを体験できます
          </p>
          {isAuthenticated ? (
            <Link
              href="/products"
              className="inline-block bg-red-600 text-white font-light py-3 px-8 rounded text-sm hover:bg-red-700 transition-colors shadow-sm"
            >
              商品を見る
            </Link>
          ) : (
            <Link
              href="/signup"
              className="inline-block bg-red-600 text-white font-light py-3 px-8 rounded text-sm hover:bg-red-700 transition-colors shadow-sm"
            >
              無料で始める
            </Link>
          )}
        </div>
      </section>

      {/* フッター */}
      <footer className="border-t border-gray-100 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs text-gray-500 font-light">
              © 2025 パーソナライズ食事宅配サービス. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
