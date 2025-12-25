'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import Header from '@/components/Header';
import Link from 'next/link';

export default function PaymentPage() {
 const router = useRouter();
 const params = useParams();
 const orderId = Number(params.orderId);
 const { isAuthenticated, isLoading: authLoading, user } = useAuth();

 const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | null>(null);
 const [showAddCard, setShowAddCard] = useState(false);
 const [error, setError] = useState('');
 const [isProcessing, setIsProcessing] = useState(false);

 // 新しいカード情報の状態
 const [cardholderName, setCardholderName] = useState('');
 const [cardNumber, setCardNumber] = useState('');
 const [expiryMonth, setExpiryMonth] = useState('');
 const [expiryYear, setExpiryYear] = useState('');
 const [cvv, setCvv] = useState('');
 const [saveCard, setSaveCard] = useState(true);

 // 注文情報を取得
 const { data: order, isLoading: orderLoading } = trpc.orders.getById.useQuery(
 { orderId },
 { enabled: !!orderId && isAuthenticated }
 );

 // 決済方法一覧を取得
 const { data: paymentMethods, refetch: refetchPaymentMethods } = trpc.payment.getPaymentMethods.useQuery(
 { userId: user?.id || 0 },
 { enabled: isAuthenticated && !!user }
 );

 // デフォルト決済方法を取得
 const { data: defaultMethod } = trpc.payment.getDefaultPaymentMethod.useQuery(
 { userId: user?.id || 0 },
 { enabled: isAuthenticated && !!user }
 );

 // デフォルト決済方法を選択
 useEffect(() => {
 if (defaultMethod) {
 setSelectedPaymentMethodId(defaultMethod.id);
 } else if (paymentMethods && paymentMethods.length > 0) {
 setSelectedPaymentMethodId(paymentMethods[0].id);
 }
 }, [defaultMethod, paymentMethods]);

 // カード追加mutation
 const addPaymentMethodMutation = trpc.payment.addPaymentMethod.useMutation({
 onSuccess: async (data) => {
 await refetchPaymentMethods();
 setSelectedPaymentMethodId(data.id);
 setShowAddCard(false);
 // フォームをリセット
 setCardholderName('');
 setCardNumber('');
 setExpiryMonth('');
 setExpiryYear('');
 setCvv('');
 },
 onError: (error) => {
 setError(error.message);
 },
 });

 // 決済処理mutation
 const processPaymentMutation = trpc.payment.processPayment.useMutation({
 onSuccess: () => {
 router.push(`/order-complete?orderId=${orderId}`);
 },
 onError: (error) => {
 setError(error.message);
 setIsProcessing(false);
 },
 });

 // 認証チェック
 useEffect(() => {
 if (!authLoading && !isAuthenticated) {
 router.push('/login');
 }
 }, [isAuthenticated, authLoading, router]);

 if (authLoading || orderLoading || !order) {
 return (
 <div className="min-h-screen flex items-center justify-center">
 <p className="text-xl">読み込み中...</p>
 </div>
 );
 }

 // 既に支払い済みの場合
 if (order.order.paymentStatus === 'paid') {
 return (
 <div className="min-h-screen bg-white">
 <Header />
 <div className="max-w-2xl mx-auto px-4 py-12">
 <div className="text-center">
 <h1 className="text-2xl font-light text-gray-900 mb-4">
 この注文は既に支払い済みです
 </h1>
 <Link
 href="/orders"
 className="text-sm text-gray-600 hover:text-gray-900 underline"
 >
 注文履歴に戻る
 </Link>
 </div>
 </div>
 </div>
 );
 }

 const handleAddCard = async (e: React.FormEvent) => {
 e.preventDefault();
 setError('');

 if (!cardholderName || !cardNumber || !expiryMonth || !expiryYear || !cvv) {
 setError('すべての項目を入力してください');
 return;
 }

 if (cardNumber.length !== 16 || !/^\d+$/.test(cardNumber)) {
 setError('カード番号は16桁の数字で入力してください');
 return;
 }

 const month = parseInt(expiryMonth);
 const year = parseInt(expiryYear);

 if (month < 1 || month > 12) {
 setError('有効な月を入力してください（1-12）');
 return;
 }

 const currentYear = new Date().getFullYear();
 if (year < currentYear) {
 setError('有効な年を入力してください');
 return;
 }

 // カードブランドを簡易判定
 let cardBrand = 'Unknown';
 const firstDigit = cardNumber.charAt(0);
 if (firstDigit === '4') cardBrand = 'Visa';
 else if (firstDigit === '5') cardBrand = 'Mastercard';
 else if (firstDigit === '3') cardBrand = 'American Express';

 if (!user) {
 setError('ユーザー情報が見つかりません');
 return;
 }

 addPaymentMethodMutation.mutate({
 userId: user.id,
 type: 'credit_card',
 cardholderName,
 cardNumber,
 cardBrand,
 expiryMonth: month,
 expiryYear: year,
 isDefault: saveCard && (!paymentMethods || paymentMethods.length === 0),
 });
 };

 const handlePayment = () => {
 if (!selectedPaymentMethodId) {
 setError('決済方法を選択してください');
 return;
 }

 if (!user) {
 setError('ユーザー情報が見つかりません');
 return;
 }

 setIsProcessing(true);
 setError('');

 processPaymentMutation.mutate({
 userId: user.id,
 orderId,
 paymentMethodId: selectedPaymentMethodId,
 });
 };

 return (
 <div className="min-h-screen bg-white">
 <Header />

 <main className="max-w-4xl mx-auto px-4 py-12">
 <h1 className="text-2xl font-light text-gray-900 mb-8 tracking-wide">
 お支払い
 </h1>

 {/* 注文情報 */}
 <div className="bg-gray-50 border border-gray-100 rounded p-6 mb-8">
 <h2 className="text-sm font-light text-gray-600 mb-4 uppercase tracking-wider">
 注文情報
 </h2>
 <div className="flex justify-between items-center">
 <span className="text-sm text-gray-900 font-light">
 注文番号: #{orderId}
 </span>
 <span className="text-2xl font-light text-gray-900">
 ¥{Number(order.order.totalAmount).toLocaleString()}
 </span>
 </div>
 </div>

 {/* エラーメッセージ */}
 {error && (
 <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
 <p className="text-sm text-red-600">{error}</p>
 </div>
 )}

 {/* 決済方法選択 */}
 <div className="bg-white border border-gray-100 rounded p-6 mb-6">
 <h2 className="text-sm font-light text-gray-600 mb-4 uppercase tracking-wider">
 決済方法を選択
 </h2>

 {paymentMethods && paymentMethods.length > 0 ? (
 <div className="space-y-3 mb-4">
 {paymentMethods.map((method) => (
 <label
 key={method.id}
 className={`flex items-center p-4 border rounded cursor-pointer transition-colors ${
 selectedPaymentMethodId === method.id
 ? 'border-gray-900 bg-gray-50'
 : 'border-gray-200 hover:border-gray-300'
 }`}
 >
 <input
 type="radio"
 name="paymentMethod"
 value={method.id}
 checked={selectedPaymentMethodId === method.id}
 onChange={() => setSelectedPaymentMethodId(method.id)}
 className="mr-3"
 />
 <div className="flex-1">
 <div className="text-sm font-light text-gray-900">
 {method.cardBrand} •••• {method.cardNumberLast4}
 </div>
 <div className="text-xs text-gray-500">
 {method.cardholderName} • 有効期限: {method.expiryMonth}/{method.expiryYear}
 </div>
 </div>
 {method.isDefault && (
 <span className="text-xs bg-gray-900 text-white px-2 py-1 rounded">
 デフォルト
 </span>
 )}
 </label>
 ))}
 </div>
 ) : (
 <p className="text-sm text-gray-600 mb-4 font-light">
 登録された決済方法がありません
 </p>
 )}

 {/* カード追加ボタン */}
 {!showAddCard && (
 <button
 onClick={() => setShowAddCard(true)}
 className="text-sm text-gray-600 hover:text-gray-900 font-light underline"
 >
 + 新しいカードを追加
 </button>
 )}
 </div>

 {/* カード追加フォーム */}
 {showAddCard && (
 <div className="bg-white border border-gray-100 rounded p-6 mb-6">
 <h2 className="text-sm font-light text-gray-600 mb-4 uppercase tracking-wider">
 新しいカードを追加
 </h2>
 <form onSubmit={handleAddCard} className="space-y-4">
 <div>
 <label className="block text-xs font-light text-gray-600 mb-2">
 カード名義人
 </label>
 <input
 type="text"
 value={cardholderName}
 onChange={(e) => setCardholderName(e.target.value)}
 className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-gray-400 text-sm font-light"
 placeholder="TARO YAMADA"
 />
 </div>
 <div>
 <label className="block text-xs font-light text-gray-600 mb-2">
 カード番号
 </label>
 <input
 type="text"
 value={cardNumber}
 onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
 className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-gray-400 text-sm font-light"
 placeholder="1234567890123456"
 maxLength={16}
 />
 </div>
 <div className="grid grid-cols-3 gap-4">
 <div>
 <label className="block text-xs font-light text-gray-600 mb-2">
 有効期限（月）
 </label>
 <input
 type="text"
 value={expiryMonth}
 onChange={(e) => setExpiryMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
 className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-gray-400 text-sm font-light"
 placeholder="MM"
 maxLength={2}
 />
 </div>
 <div>
 <label className="block text-xs font-light text-gray-600 mb-2">
 有効期限（年）
 </label>
 <input
 type="text"
 value={expiryYear}
 onChange={(e) => setExpiryYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
 className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-gray-400 text-sm font-light"
 placeholder="YYYY"
 maxLength={4}
 />
 </div>
 <div>
 <label className="block text-xs font-light text-gray-600 mb-2">
 CVV
 </label>
 <input
 type="text"
 value={cvv}
 onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
 className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-gray-400 text-sm font-light"
 placeholder="123"
 maxLength={4}
 />
 </div>
 </div>
 <div className="flex items-center">
 <input
 type="checkbox"
 id="saveCard"
 checked={saveCard}
 onChange={(e) => setSaveCard(e.target.checked)}
 className="mr-2"
 />
 <label htmlFor="saveCard" className="text-sm text-gray-600 font-light">
 このカードを保存する
 </label>
 </div>
 <div className="flex gap-3">
 <button
 type="submit"
 disabled={addPaymentMethodMutation.isPending}
 className="bg-gray-900 text-white font-light py-2 px-6 rounded text-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
 >
 {addPaymentMethodMutation.isPending ? '追加中...' : 'カードを追加'}
 </button>
 <button
 type="button"
 onClick={() => setShowAddCard(false)}
 className="bg-transparent border border-gray-300 text-gray-900 font-light py-2 px-6 rounded text-sm hover:bg-gray-50 transition-colors"
 >
 キャンセル
 </button>
 </div>
 </form>
 </div>
 )}

 {/* 決済ボタン */}
 <div className="flex gap-4">
 <button
 onClick={handlePayment}
 disabled={!selectedPaymentMethodId || isProcessing}
 className="flex-1 bg-red-600 text-white font-light py-4 px-8 rounded text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
 >
 {isProcessing ? '処理中...' : `¥${Number(order.order.totalAmount).toLocaleString()}を支払う`}
 </button>
 <Link
 href="/orders"
 className="bg-transparent border border-gray-300 text-gray-900 font-light py-4 px-8 rounded text-sm hover:bg-gray-50 transition-colors text-center"
 >
 キャンセル
 </Link>
 </div>

 {/* セキュリティ情報 */}
 <div className="mt-8 text-center text-xs text-gray-500 font-light">
 <p>🔒 お支払い情報は暗号化されて安全に送信されます</p>
 </div>
 </main>
 </div>
 );
}
