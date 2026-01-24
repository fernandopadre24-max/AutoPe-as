import { useState, useCallback } from 'react';
import type { Product } from '@/lib/types';

export type CartItem = {
  product: Product;
  quantity: number;
  unit: string;
  discount: number;
};

export interface UseCartReturn {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number, unit?: string, discount?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateDiscount: (productId: string, discount: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalQuantity: () => number;
  getSubtotal: () => number;
  getTotalDiscount: () => number;
  getTotal: () => number;
}

export function useCart(): UseCartReturn {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = useCallback((product: Product, quantity = 1, unit = 'UN', discount = 0) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, unit, discount }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  }, [removeFromCart]);

  const updateDiscount = useCallback((productId: string, discount: number) => {
    setCartItems(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, discount: Math.max(0, discount) }
          : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getTotalItems = useCallback(() => cartItems.length, [cartItems.length]);

  const getTotalQuantity = useCallback(() =>
    cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const getSubtotal = useCallback(() =>
    cartItems.reduce((sum, item) => sum + (item.product.salePrice * item.quantity), 0),
    [cartItems]
  );

  const getTotalDiscount = useCallback(() =>
    cartItems.reduce((sum, item) => sum + item.discount, 0),
    [cartItems]
  );

  const getTotal = useCallback(() =>
    getSubtotal() - getTotalDiscount(),
    [getSubtotal, getTotalDiscount]
  );

  return {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateDiscount,
    clearCart,
    getTotalItems,
    getTotalQuantity,
    getSubtotal,
    getTotalDiscount,
    getTotal,
  };
}