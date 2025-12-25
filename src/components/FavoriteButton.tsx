'use client';

import { useState } from 'react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';

interface FavoriteButtonProps {
  productId: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function FavoriteButton({
  productId,
  size = 'md',
  showLabel = false
}: FavoriteButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const { isFavorite, addToFavorites, removeFromFavorites } = useFavorites();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const favorite = isFavorite(productId);

  const addFavoriteMutation = trpc.favorites.add.useMutation({
    onSuccess: () => {
      addToFavorites(productId);
      setIsProcessing(false);
    },
    onError: (error) => {
      alert(`エラー: ${error.message}`);
      setIsProcessing(false);
    },
  });

  const removeFavoriteMutation = trpc.favorites.remove.useMutation({
    onSuccess: () => {
      removeFromFavorites(productId);
      setIsProcessing(false);
    },
    onError: (error) => {
      alert(`エラー: ${error.message}`);
      setIsProcessing(false);
    },
  });

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    if (isProcessing) return;

    setIsProcessing(true);

    if (favorite) {
      removeFavoriteMutation.mutate({
        userId: user.id,
        productId,
      });
    } else {
      addFavoriteMutation.mutate({
        userId: user.id,
        productId,
      });
    }
  };

  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <button
      onClick={handleClick}
      disabled={isProcessing}
      className={`${sizeClasses[size]} transition-all duration-200 hover:scale-110 disabled:opacity-50 flex items-center gap-2`}
      title={favorite ? 'お気に入りから削除' : 'お気に入りに追加'}
    >
      <span className={favorite ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}>
        {favorite ? '❤️' : '🤍'}
      </span>
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {favorite ? 'お気に入り済み' : 'お気に入り'}
        </span>
      )}
    </button>
  );
}
