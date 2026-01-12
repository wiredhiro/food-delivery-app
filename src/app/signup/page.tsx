'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import Header from '@/components/Header';

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export default function SignupPage() {
 const router = useRouter();
 const [name, setName] = useState('');
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const [error, setError] = useState('');
 const [success, setSuccess] = useState(false);

 const signupMutation = trpc.auth.signup.useMutation({
 onSuccess: () => {
 setSuccess(true);
 setTimeout(() => {
 router.push('/login');
 }, 2000);
 },
 onError: (error) => {
 setError(error.message);
 },
 });

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setError('');

 if (!name || !email || !password || !confirmPassword) {
 setError('すべてのフィールドを入力してください');
 return;
 }

 if (password !== confirmPassword) {
 setError('パスワードが一致しません');
 return;
 }

 if (password.length < 8) {
 setError('パスワードは8文字以上である必要があります');
 return;
 }

 signupMutation.mutate({ name, email, password });
 };

 if (success) {
 return (
 <div className="min-h-screen bg-gray-50">
 <Header />
 <main className="max-w-md mx-auto px-4 py-16">
 <div className="bg-white rounded-lg shadow-md p-8 text-center">
 <div className="mb-4">
 <svg
 className="w-16 h-16 mx-auto text-green-500"
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
 <h1 className="text-2xl font-bold text-gray-900 mb-2">
 登録完了
 </h1>
 <p className="text-gray-600">
 アカウントの作成が完了しました。ログインページに移動します...
 </p>
 </div>
 </main>
 </div>
 );
 }

 // デモモードの場合はサインアップを無効化
 if (isDemoMode) {
 return (
 <div className="min-h-screen bg-gray-50">
 <Header />
 <main className="max-w-md mx-auto px-4 py-16">
 <div className="bg-white rounded-lg shadow-md p-8 text-center">
 <div className="mb-4">
 <svg
 className="w-16 h-16 mx-auto text-yellow-500"
 fill="none"
 stroke="currentColor"
 viewBox="0 0 24 24"
 >
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 strokeWidth={2}
 d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
 />
 </svg>
 </div>
 <h1 className="text-2xl font-bold text-gray-900 mb-2">
 デモモード
 </h1>
 <p className="text-gray-600 mb-6">
 デモモードのため、新規アカウントの作成はできません。
 <br />
 ログインページからデモ用アカウントをご利用ください。
 </p>
 <Link
 href="/login"
 className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
 >
 ログインページへ
 </Link>
 </div>
 </main>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-gray-50">
 <Header />
 <main className="max-w-md mx-auto px-4 py-16">
 <div className="bg-white rounded-lg shadow-md p-8">
 <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
 サインアップ
 </h1>

 {error && (
 <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
 {error}
 </div>
 )}

 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label
 htmlFor="name"
 className="block text-sm font-medium text-gray-700 mb-1"
 >
 名前
 </label>
 <input
 type="text"
 id="name"
 value={name}
 onChange={(e) => setName(e.target.value)}
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
 placeholder="山田太郎"
 required
 />
 </div>

 <div>
 <label
 htmlFor="email"
 className="block text-sm font-medium text-gray-700 mb-1"
 >
 メールアドレス
 </label>
 <input
 type="email"
 id="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
 placeholder="your@email.com"
 required
 />
 </div>

 <div>
 <label
 htmlFor="password"
 className="block text-sm font-medium text-gray-700 mb-1"
 >
 パスワード（8文字以上）
 </label>
 <input
 type="password"
 id="password"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
 placeholder="••••••••"
 required
 />
 </div>

 <div>
 <label
 htmlFor="confirmPassword"
 className="block text-sm font-medium text-gray-700 mb-1"
 >
 パスワード（確認）
 </label>
 <input
 type="password"
 id="confirmPassword"
 value={confirmPassword}
 onChange={(e) => setConfirmPassword(e.target.value)}
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
 placeholder="••••••••"
 required
 />
 </div>

 <button
 type="submit"
 disabled={signupMutation.isPending}
 className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
 >
 {signupMutation.isPending ? '登録中...' : 'アカウントを作成'}
 </button>
 </form>

 <div className="mt-6 text-center">
 <p className="text-gray-600">
 既にアカウントをお持ちですか？{' '}
 <Link
 href="/login"
 className="text-blue-600 hover:text-blue-800 font-semibold"
 >
 ログイン
 </Link>
 </p>
 </div>
 </div>
 </main>
 </div>
 );
}
