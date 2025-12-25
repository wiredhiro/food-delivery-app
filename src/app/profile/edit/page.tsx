'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import Header from '@/components/Header';
import Link from 'next/link';

export default function EditProfilePage() {
 const router = useRouter();
 const { isAuthenticated, isLoading: authLoading, user } = useAuth();

 const [name, setName] = useState('');
 const [phoneNumber, setPhoneNumber] = useState('');
 const [currentPassword, setCurrentPassword] = useState('');
 const [newPassword, setNewPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const [showPasswordForm, setShowPasswordForm] = useState(false);

 const { data: profile, isLoading: profileLoading } = trpc.user.getProfile.useQuery(
 { userId: user?.id || 0 },
 { enabled: !!user?.id }
 );

 const updateProfileMutation = trpc.user.updateProfile.useMutation({
 onSuccess: () => {
 alert('プロフィールを更新しました');
 },
 onError: (error) => {
 alert(`エラー: ${error.message}`);
 },
 });

 const changePasswordMutation = trpc.user.changePassword.useMutation({
 onSuccess: () => {
 alert('パスワードを変更しました');
 setCurrentPassword('');
 setNewPassword('');
 setConfirmPassword('');
 setShowPasswordForm(false);
 },
 onError: (error) => {
 alert(`エラー: ${error.message}`);
 },
 });

 useEffect(() => {
 if (!authLoading && !isAuthenticated) {
 router.push('/login');
 }
 }, [isAuthenticated, authLoading, router]);

 useEffect(() => {
 if (profile) {
 setName(profile.name);
 setPhoneNumber(profile.phoneNumber || '');
 }
 }, [profile]);

 if (authLoading || !isAuthenticated || profileLoading) {
 return (
 <div className="min-h-screen flex items-center justify-center">
 <p className="text-xl">読み込み中...</p>
 </div>
 );
 }

 const handleUpdateProfile = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!user) return;

 await updateProfileMutation.mutateAsync({
 userId: user.id,
 name,
 phoneNumber: phoneNumber || undefined,
 });
 };

 const handleChangePassword = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!user) return;

 if (newPassword !== confirmPassword) {
 alert('新しいパスワードと確認用パスワードが一致しません');
 return;
 }

 if (newPassword.length < 6) {
 alert('パスワードは6文字以上で入力してください');
 return;
 }

 await changePasswordMutation.mutateAsync({
 userId: user.id,
 currentPassword,
 newPassword,
 });
 };

 return (
 <div className="min-h-screen bg-gray-50">
 <Header />

 <main className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
 <div className="mb-8">
 <Link
 href="/profile"
 className="text-blue-600 hover:text-blue-700 mb-2 inline-block"
 >
 ← マイページに戻る
 </Link>
 <h1 className="text-3xl font-bold text-gray-900 mb-2">
 プロフィール編集
 </h1>
 </div>

 {/* プロフィール情報フォーム */}
 <div className="bg-white rounded-lg shadow-md p-6 mb-6">
 <h2 className="text-xl font-semibold text-gray-900 mb-4">
 基本情報
 </h2>

 <form onSubmit={handleUpdateProfile} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 メールアドレス
 </label>
 <input
 type="email"
 value={profile?.email || ''}
 disabled
 className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
 />
 <p className="text-xs text-gray-500 mt-1">
 メールアドレスは変更できません
 </p>
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 名前 *
 </label>
 <input
 type="text"
 value={name}
 onChange={(e) => setName(e.target.value)}
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
 required
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 電話番号
 </label>
 <input
 type="tel"
 value={phoneNumber}
 onChange={(e) => setPhoneNumber(e.target.value)}
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
 placeholder="090-1234-5678"
 />
 </div>

 <button
 type="submit"
 disabled={updateProfileMutation.isPending}
 className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:bg-gray-400"
 >
 {updateProfileMutation.isPending ? '更新中...' : '更新'}
 </button>
 </form>
 </div>

 {/* パスワード変更 */}
 <div className="bg-white rounded-lg shadow-md p-6">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-xl font-semibold text-gray-900">
 パスワード変更
 </h2>
 {!showPasswordForm && (
 <button
 onClick={() => setShowPasswordForm(true)}
 className="text-blue-600 hover:text-blue-700 font-semibold"
 >
 変更する
 </button>
 )}
 </div>

 {showPasswordForm ? (
 <form onSubmit={handleChangePassword} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 現在のパスワード *
 </label>
 <input
 type="password"
 value={currentPassword}
 onChange={(e) => setCurrentPassword(e.target.value)}
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
 required
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 新しいパスワード *
 </label>
 <input
 type="password"
 value={newPassword}
 onChange={(e) => setNewPassword(e.target.value)}
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
 required
 minLength={6}
 />
 <p className="text-xs text-gray-500 mt-1">
 6文字以上で入力してください
 </p>
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-1">
 新しいパスワード（確認） *
 </label>
 <input
 type="password"
 value={confirmPassword}
 onChange={(e) => setConfirmPassword(e.target.value)}
 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
 required
 minLength={6}
 />
 </div>

 <div className="flex gap-3">
 <button
 type="submit"
 disabled={changePasswordMutation.isPending}
 className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:bg-gray-400"
 >
 {changePasswordMutation.isPending ? '変更中...' : 'パスワードを変更'}
 </button>
 <button
 type="button"
 onClick={() => {
 setShowPasswordForm(false);
 setCurrentPassword('');
 setNewPassword('');
 setConfirmPassword('');
 }}
 className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
 >
 キャンセル
 </button>
 </div>
 </form>
 ) : (
 <p className="text-gray-600">
 セキュリティ保護のため、定期的にパスワードを変更することをお勧めします。
 </p>
 )}
 </div>
 </main>
 </div>
 );
}
