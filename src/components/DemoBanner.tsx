'use client';

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export function DemoBanner() {
  if (!isDemoMode) {
    return null;
  }

  return (
    <div className="bg-yellow-500 text-yellow-900 text-center py-2 px-4 text-sm font-medium">
      デモモード: このサイトはデモ用です。データの書き込み・変更はできません。
    </div>
  );
}
