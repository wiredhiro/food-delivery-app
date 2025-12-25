'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import Header from '@/components/Header';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const utils = trpc.useUtils();

  // 配送先住所の状態
  const [selectedAddressId, setSelectedAddressId] = useState<number | 'custom'>('custom');
  const [name, setName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [prefecture, setPrefecture] = useState('');
  const [city, setCity] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [isOrderComplete, setIsOrderComplete] = useState(false);

  // クーポンの状態
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // ユーザーの配送先住所を取得
  const { data: addressesData } = trpc.user.getAddresses.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  // クーポン適用処理
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('クーポンコードを入力してください');
      return;
    }

    setCouponError('');
    setIsValidatingCoupon(true);

    try {
      const result = await utils.coupons.validate.fetch({
        code: couponCode.trim(),
        orderAmount: totalPrice,
      });

      if (result.isValid) {
        setAppliedCoupon(result.coupon);
        setCouponError('');
      } else {
        setCouponError('無効なクーポンコードです');
        setAppliedCoupon(null);
      }
    } catch (error: any) {
      setCouponError(error.message);
      setAppliedCoupon(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // クーポン削除処理
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  // 割引額の計算
  const discountAmount = appliedCoupon
    ? appliedCoupon.discountType === 'percentage'
      ? Math.floor(totalPrice * (parseFloat(appliedCoupon.discountValue) / 100))
      : Math.floor(parseFloat(appliedCoupon.discountValue))
    : 0;

  // 最終金額の計算
  const finalAmount = Math.max(0, Math.floor(totalPrice - discountAmount));

  // デフォルトの住所を自動入力
  useEffect(() => {
    if (addressesData && addressesData.length > 0) {
      const defaultAddress = addressesData.find(addr => addr.isDefault);
      const addressToUse = defaultAddress || addressesData[0];

      if (addressToUse) {
        setSelectedAddressId(addressToUse.id);
        setName(addressToUse.name || '');
        setPostalCode(addressToUse.postalCode || '');
        setPrefecture(addressToUse.prefecture || '');
        setCity(addressToUse.city || '');
        setAddressLine(addressToUse.addressLine1 || '');
        setPhoneNumber(addressToUse.phoneNumber || '');
      }
    }
  }, [addressesData]);

  // 住所選択が変更されたとき
  const handleAddressChange = (addressId: number | 'custom') => {
    setSelectedAddressId(addressId);

    if (addressId === 'custom') {
      setName('');
      setPostalCode('');
      setPrefecture('');
      setCity('');
      setAddressLine('');
      setPhoneNumber('');
    } else {
      const selectedAddress = addressesData?.find(addr => addr.id === addressId);
      if (selectedAddress) {
        setName(selectedAddress.name || '');
        setPostalCode(selectedAddress.postalCode || '');
        setPrefecture(selectedAddress.prefecture || '');
        setCity(selectedAddress.city || '');
        setAddressLine(selectedAddress.addressLine1 || '');
        setPhoneNumber(selectedAddress.phoneNumber || '');
      }
    }
  };

  // 注文作成mutation
  const createOrderMutation = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      // 注文完了フラグを立てる
      setIsOrderComplete(true);
      // カートをクリア
      clearCart();
      // 決済ページにリダイレクト
      router.push(`/payment/${data.orderId}`);
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // カートが空の場合はカートページにリダイレクト（注文完了時を除く）
  useEffect(() => {
    if (!authLoading && isAuthenticated && items.length === 0 && !isOrderComplete) {
      router.push('/cart');
    }
  }, [items, isAuthenticated, authLoading, router, isOrderComplete]);

  // ローディング中
  if (authLoading || !isAuthenticated || items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">読み込み中...</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // バリデーション
    if (!name || !postalCode || !prefecture || !city || !addressLine || !phoneNumber) {
      setError('すべての項目を入力してください');
      return;
    }

    if (!user) {
      setError('ユーザー情報が見つかりません');
      return;
    }

    // 注文を作成
    createOrderMutation.mutate({
      userId: user.id,
      items: items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
      })),
      shippingAddress: {
        name,
        postalCode,
        prefecture,
        city,
        addressLine,
        phoneNumber,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          注文確認
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 配送先情報入力フォーム */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                配送先情報
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 住所選択ドロップダウン */}
                {addressesData && addressesData.length > 0 && (
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <label
                      htmlFor="addressSelect"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      配送先住所を選択
                    </label>
                    <select
                      id="addressSelect"
                      value={selectedAddressId}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleAddressChange(value === 'custom' ? 'custom' : Number(value));
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      {addressesData.map((addr) => (
                        <option key={addr.id} value={addr.id}>
                          {addr.name} - {addr.prefecture}{addr.city}{addr.addressLine1}
                          {addr.isDefault && ' (デフォルト)'}
                        </option>
                      ))}
                      <option value="custom">新しい住所を入力</option>
                    </select>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    宛名
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    readOnly={selectedAddressId !== 'custom'}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                      selectedAddressId !== 'custom' ? 'bg-gray-50' : ''
                    }`}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="postalCode"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    郵便番号
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    readOnly={selectedAddressId !== 'custom'}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                      selectedAddressId !== 'custom' ? 'bg-gray-50' : ''
                    }`}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="prefecture"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    都道府県
                  </label>
                  <input
                    type="text"
                    id="prefecture"
                    value={prefecture}
                    onChange={(e) => setPrefecture(e.target.value)}
                    readOnly={selectedAddressId !== 'custom'}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                      selectedAddressId !== 'custom' ? 'bg-gray-50' : ''
                    }`}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    市区町村
                  </label>
                  <input
                    type="text"
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    readOnly={selectedAddressId !== 'custom'}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                      selectedAddressId !== 'custom' ? 'bg-gray-50' : ''
                    }`}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="addressLine"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    番地・建物名
                  </label>
                  <input
                    type="text"
                    id="addressLine"
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    readOnly={selectedAddressId !== 'custom'}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                      selectedAddressId !== 'custom' ? 'bg-gray-50' : ''
                    }`}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="phoneNumber"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    電話番号
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    readOnly={selectedAddressId !== 'custom'}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                      selectedAddressId !== 'custom' ? 'bg-gray-50' : ''
                    }`}
                    required
                  />
                </div>
              </form>
            </div>

            {/* 注文内容確認 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                注文内容
              </h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-3 border-b border-gray-200"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {item.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        数量: {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      ¥{Math.floor(parseFloat(item.price) * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 注文サマリー */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                お支払い金額
              </h2>

              {/* クーポン入力セクション */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <label
                  htmlFor="couponCode"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  クーポンコード
                </label>

                {appliedCoupon ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-800">
                        {appliedCoupon.code}
                      </span>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                      >
                        削除
                      </button>
                    </div>
                    <p className="text-xs text-green-700">
                      {appliedCoupon.description || 'クーポンが適用されました'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        id="couponCode"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApplyCoupon();
                          }
                        }}
                        placeholder="クーポンコードを入力"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-sm uppercase"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={isValidatingCoupon}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {isValidatingCoupon ? '確認中...' : '適用'}
                      </button>
                    </div>
                    {couponError && (
                      <p className="mt-2 text-xs text-red-600">
                        {couponError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>商品合計:</span>
                  <span>¥{Math.floor(totalPrice).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>配送料:</span>
                  <span>¥0</span>
                </div>

                {/* 割引額表示 */}
                {appliedCoupon && discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>割引額:</span>
                    <span>-¥{discountAmount.toLocaleString()}</span>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>合計:</span>
                    <span>¥{finalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={createOrderMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-colors duration-200 mb-3 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {createOrderMutation.isPending ? '注文処理中...' : '注文を確定する'}
              </button>

              <Link
                href="/cart"
                className="block w-full text-center text-blue-600 hover:text-blue-800 font-semibold py-3"
              >
                カートに戻る
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
