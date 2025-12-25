'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';

export default function AdminCouponsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed_amount',
    discountValue: '',
    minPurchaseAmount: '',
    maxDiscountAmount: '',
    usageLimit: '',
    validFrom: '',
    validUntil: '',
  });

  // クーポン一覧を取得
  const { data: coupons, isLoading, refetch } = trpc.coupons.getAll.useQuery();

  // クーポン作成mutation
  const createMutation = trpc.coupons.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowCreateModal(false);
      setFormData({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: '',
        minPurchaseAmount: '',
        maxDiscountAmount: '',
        usageLimit: '',
        validFrom: '',
        validUntil: '',
      });
      alert('クーポンを作成しました');
    },
    onError: (error) => {
      alert('エラー: ' + error.message);
    },
  });

  // クーポン削除mutation
  const deleteMutation = trpc.coupons.delete.useMutation({
    onSuccess: () => {
      refetch();
      alert('クーポンを削除しました');
    },
    onError: (error) => {
      alert('エラー: ' + error.message);
    },
  });

  // 管理者チェック
  if (!authLoading && (!user || !user.isAdmin)) {
    router.push('/');
    return null;
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">読み込み中...</p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createMutation.mutate({
      code: formData.code,
      description: formData.description || undefined,
      discountType: formData.discountType,
      discountValue: parseFloat(formData.discountValue),
      minPurchaseAmount: formData.minPurchaseAmount ? parseFloat(formData.minPurchaseAmount) : undefined,
      maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : undefined,
      usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
      validFrom: formData.validFrom,
      validUntil: formData.validUntil,
    });
  };

  const handleDelete = (id: number, code: string) => {
    if (confirm(`クーポン「${code}」を削除してもよろしいですか？`)) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">クーポン管理</h1>
          <div className="flex gap-4">
            <Link
              href="/admin"
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              管理画面に戻る
            </Link>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              新規クーポン作成
            </button>
          </div>
        </div>

        {/* クーポン一覧 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  コード
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  説明
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  割引
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  条件
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  使用状況
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  有効期限
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coupons?.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono font-bold text-gray-900">
                      {coupon.code}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {coupon.description || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {coupon.discountType === 'percentage'
                        ? `${coupon.discountValue}%`
                        : `¥${Math.floor(Number(coupon.discountValue)).toLocaleString()}`}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {coupon.minPurchaseAmount && (
                        <div>最低: ¥{Math.floor(Number(coupon.minPurchaseAmount)).toLocaleString()}</div>
                      )}
                      {coupon.maxDiscountAmount && (
                        <div>上限: ¥{Math.floor(Number(coupon.maxDiscountAmount)).toLocaleString()}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {coupon.usedCount} / {coupon.usageLimit || '∞'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      <div>{new Date(coupon.validFrom).toLocaleDateString()}</div>
                      <div>〜 {new Date(coupon.validUntil).toLocaleDateString()}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleDelete(coupon.id, coupon.code)}
                      className="text-red-600 hover:text-red-800 font-semibold"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {coupons?.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              クーポンがありません
            </div>
          )}
        </div>
      </main>

      {/* クーポン作成モーダル */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">新規クーポン作成</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* クーポンコード */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  クーポンコード *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="例: SUMMER20"
                  required
                />
              </div>

              {/* 説明 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  説明
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  rows={2}
                  placeholder="クーポンの説明"
                />
              </div>

              {/* 割引タイプ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  割引タイプ *
                </label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                >
                  <option value="percentage">パーセンテージ（%）</option>
                  <option value="fixed_amount">固定額（円）</option>
                </select>
              </div>

              {/* 割引値 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  割引値 *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder={formData.discountType === 'percentage' ? '例: 10' : '例: 500'}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* 最低購入金額 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最低購入金額
                  </label>
                  <input
                    type="number"
                    value={formData.minPurchaseAmount}
                    onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="例: 1000"
                  />
                </div>

                {/* 最大割引額 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最大割引額
                  </label>
                  <input
                    type="number"
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="例: 500"
                  />
                </div>
              </div>

              {/* 使用回数制限 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  使用回数制限
                </label>
                <input
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="無制限の場合は空欄"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* 有効期間（開始） */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    有効期間（開始） *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  />
                </div>

                {/* 有効期間（終了） */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    有効期間（終了） *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  />
                </div>
              </div>

              {/* ボタン */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400"
                >
                  {createMutation.isPending ? '作成中...' : '作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
