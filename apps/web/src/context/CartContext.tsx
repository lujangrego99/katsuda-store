'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface CartProduct {
  id: string;
  sku: string;
  name: string;
  slug: string;
  price: number;
  transferPrice: number | null;
  stock: number;
  freeShipping: boolean;
  image: string | null;
  brand: { name: string } | null;
}

export interface CartItem {
  id: string;
  quantity: number;
  product: CartProduct;
}

interface Cart {
  id: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  transferSubtotal: number;
}

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  addToCart: (productId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  removeFromCart: (itemId: string) => Promise<boolean>;
  refreshCart: () => Promise<void>;
  clearCart: () => void;
  getSessionId: () => string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = localStorage.getItem('katsuda_session_id');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem('katsuda_session_id', sessionId);
  }
  return sessionId;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    const sessionId = getSessionId();
    if (!sessionId) return;

    try {
      const response = await fetch(`${API_URL}/api/cart`, {
        headers: {
          'x-session-id': sessionId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCart(data.data);
        setError(null);
      } else {
        setCart(null);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError('Error al cargar el carrito');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId: string, quantity = 1): Promise<boolean> => {
    const sessionId = getSessionId();
    if (!sessionId) return false;

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({ productId, quantity }),
      });

      if (response.ok) {
        const data = await response.json();
        setCart(data.data);
        setError(null);
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al agregar al carrito');
        return false;
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError('Error al agregar al carrito');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number): Promise<boolean> => {
    const sessionId = getSessionId();
    if (!sessionId) return false;

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/cart/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({ quantity }),
      });

      if (response.ok) {
        const data = await response.json();
        setCart(data.data);
        setError(null);
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al actualizar cantidad');
        return false;
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError('Error al actualizar cantidad');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId: string): Promise<boolean> => {
    const sessionId = getSessionId();
    if (!sessionId) return false;

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'x-session-id': sessionId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCart(data.data);
        setError(null);
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al eliminar producto');
        return false;
      }
    } catch (err) {
      console.error('Error removing from cart:', err);
      setError('Error al eliminar producto');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshCart = async () => {
    await fetchCart();
  };

  const clearCart = () => {
    setCart(null);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        addToCart,
        updateQuantity,
        removeFromCart,
        refreshCart,
        clearCart,
        getSessionId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
