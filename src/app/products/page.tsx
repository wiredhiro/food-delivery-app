'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import Link from 'next/link';
import Header from '@/components/Header';
import StarRating from '@/components/StarRating';
import FavoriteButton from '@/components/FavoriteButton';
import { getProductEmoji } from '@/lib/productEmoji';

export default function ProductsPage() {
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'newest' | undefined>(undefined);
  const [inStock, setInStock] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);

  // カテゴリー一覧を取得
  const { data: categoriesData } = trpc.categories.getAll.useQuery();

  const { data, isLoading, error } = trpc.products.getAll.useQuery({
    categoryId,
    minPrice,
    maxPrice,
    search: search || undefined,
    sortBy,
    inStock: inStock || undefined,
    minRating,
  });

  const handleResetFilters = () => {
    setCategoryId(undefined);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setSearch('');
    setSortBy(undefined);
    setInStock(false);
    setMinRating(undefined);
  };

  // アクティブなフィルター数をカウント
  const activeFiltersCount = [
    categoryId !== undefined,
    minPrice !== undefined,
    maxPrice !== undefined,
    search !== '',
    sortBy !== undefined,
    inStock === true,
    minRating !== undefined,
  ].filter(Boolean).length;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-red-600">エラーが発生しました</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-light text-gray-900 mb-8 tracking-wide">
          商品一覧
        </h1>

        {/* 検索・フィルターセクション */}
        <div className="bg-gray-50 border border-gray-100 rounded p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* キーワード検索 */}
            <div>
              <label className="block text-xs font-light text-gray-600 mb-2 uppercase tracking-wider">
                キーワード検索
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="商品名や説明で検索"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-gray-400 font-light focus:outline-none text-gray-900"
              />
            </div>

            {/* カテゴリーフィルター */}
            <div>
              <label className="block text-xs font-light text-gray-600 mb-2 uppercase tracking-wider">
                カテゴリー
              </label>
              <select
                value={categoryId || ''}
                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-gray-400 font-light focus:outline-none text-gray-900"
              >
                <option value="">すべて</option>
                {categoriesData?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 価格範囲 */}
            <div>
              <label className="block text-xs font-light text-gray-600 mb-2 uppercase tracking-wider">
                最低価格
              </label>
              <input
                type="number"
                value={minPrice || ''}
                onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="0"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-gray-400 font-light focus:outline-none text-gray-900"
              />
            </div>

            <div>
              <label className="block text-xs font-light text-gray-600 mb-2 uppercase tracking-wider">
                最高価格
              </label>
              <input
                type="number"
                value={maxPrice || ''}
                onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="10000"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-gray-400 font-light focus:outline-none text-gray-900"
              />
            </div>

            {/* 在庫フィルター */}
            <div>
              <label className="block text-xs font-light text-gray-600 mb-2 uppercase tracking-wider">
                在庫状況
              </label>
              <label className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded bg-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => setInStock(e.target.checked)}
                  className="rounded border-gray-300 text-gray-900 focus:ring-gray-400"
                />
                <span className="font-light text-gray-900">在庫ありのみ</span>
              </label>
            </div>

            {/* 評価フィルター */}
            <div>
              <label className="block text-xs font-light text-gray-600 mb-2 uppercase tracking-wider">
                最低評価
              </label>
              <select
                value={minRating || ''}
                onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-gray-400 font-light focus:outline-none text-gray-900"
              >
                <option value="">すべて</option>
                <option value="4">⭐ 4つ星以上</option>
                <option value="3">⭐ 3つ星以上</option>
                <option value="2">⭐ 2つ星以上</option>
                <option value="1">⭐ 1つ星以上</option>
              </select>
            </div>
          </div>

          {/* ソートと結果数 */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <label className="text-xs font-light text-gray-600 uppercase tracking-wider">
                並び替え:
              </label>
              <select
                value={sortBy || ''}
                onChange={(e) => setSortBy(e.target.value as any || undefined)}
                className="px-3 py-2 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-gray-400 font-light focus:outline-none text-gray-900"
              >
                <option value="">デフォルト</option>
                <option value="price_asc">価格: 安い順</option>
                <option value="price_desc">価格: 高い順</option>
                <option value="name_asc">名前: A-Z</option>
                <option value="name_desc">名前: Z-A</option>
                <option value="newest">新着順</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <p className="text-xs text-gray-500 font-light">
                {isLoading ? '...' : `${data?.count ?? 0}件の商品`}
              </p>
              {activeFiltersCount > 0 && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-light">
                  {activeFiltersCount}個のフィルター
                </span>
              )}
              <button
                onClick={handleResetFilters}
                className="text-xs text-gray-600 hover:text-gray-900 font-light underline underline-offset-2"
              >
                フィルターをリセット
              </button>
            </div>
          </div>
        </div>

        {/* 商品グリッド */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-gray-500 font-light">読み込み中...</p>
          </div>
        ) : data?.products.length === 0 ? (
          <div className="bg-gray-50 border border-gray-100 rounded p-16 text-center">
            <p className="text-sm text-gray-600 mb-6 font-light">
              条件に一致する商品が見つかりません
            </p>
            <button
              onClick={handleResetFilters}
              className="bg-gray-900 hover:bg-gray-800 text-white font-light py-2 px-8 rounded text-sm transition-colors"
            >
              フィルターをリセット
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {data?.products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group bg-white border border-gray-100 rounded overflow-hidden hover:border-gray-300 transition-all"
              >
                <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-7xl">
                      {getProductEmoji(product.name)}
                    </div>
                  )}
                  {/* お気に入りボタン */}
                  <div className="absolute top-3 right-3">
                    <FavoriteButton productId={product.id} size="md" />
                  </div>
                </div>

                <div className="p-5">
                  <h2 className="text-base font-normal text-gray-900 mb-2 tracking-wide">
                    {product.name}
                  </h2>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2 font-light leading-relaxed">
                    {product.description}
                  </p>

                  {/* レビュー評価 */}
                  {'averageRating' in product && product.averageRating > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <StarRating rating={product.averageRating} size="sm" showNumber />
                      <span className="text-xs text-gray-400 font-light">
                        ({'totalReviews' in product ? product.totalReviews : 0}件)
                      </span>
                    </div>
                  )}

                  <div className="flex items-baseline justify-between mb-4">
                    <span className="text-lg font-light text-gray-900">
                      ¥{Math.floor(Number(product.price)).toLocaleString()}
                    </span>
                    <span className={`text-xs font-light ${product.stock > 0 ? 'text-gray-400' : 'text-red-500'}`}>
                      在庫: {product.stock}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-600 font-light group-hover:text-gray-900 transition-colors">
                      詳細を見る →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
