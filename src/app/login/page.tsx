'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

// デモ用アカウント情報
const DEMO_ACCOUNTS = [
  { email: 'demo@example.com', password: 'demo1234', label: '一般ユーザー' },
  { email: 'admin@example.com', password: 'admin1234', label: '管理者' },
];

export default function LoginPage() {
 const router = useRouter();
 const { login } = useAuth();
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [error, setError] = useState('');

 const loginMutation = trpc.auth.login.useMutation({
 onSuccess: (data) => {
 const userData = {
 ...data.user,
 createdAt: new Date(data.user.createdAt),
 };
 login(userData);
 router.push('/products');
 },
 onError: (error) => {
 setError(error.message);
 },
 });

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setError('');

 if (!email || !password) {
 setError('すべてのフィールドを入力してください');
 return;
 }

 loginMutation.mutate({ email, password });
 };

 return (
 <div className="min-h-screen bg-gray-50">
 <Header />
 <main className="max-w-md mx-auto px-4 py-16">
 <div className="bg-white rounded-lg shadow-md p-8">
 <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
 ログイン
 </h1>

 {error && (
 <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
 {error}
 </div>
 )}

 {isDemoMode && (
 <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
 <p className="text-sm font-medium text-blue-800 mb-2">
 デモ用アカウント:
 </p>
 <div className="space-y-2">
 {DEMO_ACCOUNTS.map((account) => (
 <button
 key={account.email}
 type="button"
 onClick={() => {
 setEmail(account.email);
 setPassword(account.password);
 }}
 className="w-full text-left p-2 bg-white rounded border border-blue-200 hover:bg-blue-100 transition-colors"
 >
 <span className="text-xs text-gray-500">{account.label}</span>
 <br />
 <span className="text-sm text-gray-700">{account.email}</span>
 </button>
 ))}
 </div>
 </div>
 )}

 <form onSubmit={handleSubmit} className="space-y-4">
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
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
 placeholder="your@email.com"
 required
 />
 </div>

 <div>
 <label
 htmlFor="password"
 className="block text-sm font-medium text-gray-700 mb-1"
 >
 パスワード
 </label>
 <input
 type="password"
 id="password"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
 placeholder="••••••••"
 required
 />
 </div>

 <button
 type="submit"
 disabled={loginMutation.isPending}
 className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
 >
 {loginMutation.isPending ? 'ログイン中...' : 'ログイン'}
 </button>
 </form>

 <div className="mt-6 text-center">
 <p className="text-gray-600">
 アカウントをお持ちでないですか？{' '}
 <Link
 href="/signup"
 className="text-blue-600 hover:text-blue-800 font-semibold"
 >
 サインアップ
 </Link>
 </p>
 </div>
 </div>
 </main>
 </div>
 );
}
