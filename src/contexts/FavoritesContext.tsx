'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface FavoritesContextType {
  favoriteProductIds: Set<number>;
  addToFavorites: (productId: number) => void;
  removeFromFavorites: (productId: number) => void;
  isFavorite: (productId: number) => boolean;
  favoritesCount: number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const FAVORITES_STORAGE_KEY = 'food_delivery_favorites';

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favoriteProductIds, setFavoriteProductIds] = useState<Set<number>>(new Set());

  // ローカルストレージからお気に入りを読み込む
  useEffect(() => {
    if (user?.id) {
      const savedFavorites = localStorage.getItem(`${FAVORITES_STORAGE_KEY}_${user.id}`);
      if (savedFavorites) {
        try {
          const favoriteIds = JSON.parse(savedFavorites);
          setFavoriteProductIds(new Set(favoriteIds));
        } catch (error) {
          console.error('お気に入りの読み込みに失敗しました:', error);
        }
      }
    } else {
      // ログアウト時はクリア
      setFavoriteProductIds(new Set());
    }
  }, [user?.id]);

  // ローカルストレージに保存
  const saveFavorites = (favorites: Set<number>) => {
    if (user?.id) {
      localStorage.setItem(
        `${FAVORITES_STORAGE_KEY}_${user.id}`,
        JSON.stringify(Array.from(favorites))
      );
    }
  };

  const addToFavorites = (productId: number) => {
    setFavoriteProductIds(prev => {
      const newSet = new Set(prev);
      newSet.add(productId);
      saveFavorites(newSet);
      return newSet;
    });
  };

  const removeFromFavorites = (productId: number) => {
    setFavoriteProductIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      saveFavorites(newSet);
      return newSet;
    });
  };

  const isFavorite = (productId: number): boolean => {
    return favoriteProductIds.has(productId);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favoriteProductIds,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        favoritesCount: favoriteProductIds.size,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
