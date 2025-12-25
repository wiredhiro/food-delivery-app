'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// カートアイテムの型定義
export interface CartItem {
  id: number;
  name: string;
  price: string;
  quantity: number;
  stock: number;
  imageUrl?: string | null;
}

// カートコンテキストの型定義
interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  addMultipleItems: (items: Array<Omit<CartItem, 'quantity'> & { quantity: number }>) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// ローカルストレージのキーを取得する関数
const getCartStorageKey = (userId: number | null) => {
  return userId ? `food_delivery_cart_${userId}` : 'food_delivery_cart_guest';
};

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);

  // ユーザーの認証状態が変わったときにカートをロード
  useEffect(() => {
    const storageKey = getCartStorageKey(user?.id || null);
    const savedCart = localStorage.getItem(storageKey);

    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('カートデータの読み込みに失敗しました:', error);
        setItems([]);
      }
    } else {
      setItems([]);
    }
  }, [user?.id]);

  // カートが変更されるたびにローカルストレージに保存
  useEffect(() => {
    const storageKey = getCartStorageKey(user?.id || null);

    if (items.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [items, user?.id]);

  // 商品をカートに追加
  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id);

      if (existingItem) {
        // 既に存在する場合は数量を増やす（在庫数を超えない）
        return prevItems.map((i) =>
          i.id === item.id
            ? { ...i, quantity: Math.min(i.quantity + 1, item.stock) }
            : i
        );
      } else {
        // 新規追加
        return [...prevItems, { ...item, quantity: 1 }];
      }
    });
  };

  // 複数の商品をまとめてカートに追加（再注文用）
  const addMultipleItems = (newItems: Array<Omit<CartItem, 'quantity'> & { quantity: number }>) => {
    setItems((prevItems) => {
      let updatedItems = [...prevItems];

      newItems.forEach((newItem) => {
        const existingItemIndex = updatedItems.findIndex((i) => i.id === newItem.id);

        if (existingItemIndex !== -1) {
          // 既に存在する場合は数量を追加（在庫数を超えない）
          const existingItem = updatedItems[existingItemIndex]!;
          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: Math.min(existingItem.quantity + newItem.quantity, newItem.stock),
          };
        } else {
          // 新規追加
          updatedItems.push({
            id: newItem.id,
            name: newItem.name,
            price: newItem.price,
            stock: newItem.stock,
            imageUrl: newItem.imageUrl,
            quantity: Math.min(newItem.quantity, newItem.stock),
          });
        }
      });

      return updatedItems;
    });
  };

  // 商品をカートから削除
  const removeItem = (id: number) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  // 商品の数量を更新
  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.min(quantity, item.stock) }
          : item
      )
    );
  };

  // カートをクリア
  const clearCart = () => {
    setItems([]);
  };

  // カート内の総商品数
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // カートの合計金額
  const totalPrice = items.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        addMultipleItems,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// カートコンテキストを使用するカスタムフック
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
