import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Cart, CartDetail, Shop } from '@/types';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  setCart: (cart: Cart | null) => void;
  clearCart: () => void;
  setLoading: (loading: boolean) => void;
  getItemCount: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: null,
      isLoading: false,

      setCart: (cart) => set({ cart }),

      clearCart: () => set({ cart: null }),

      setLoading: (isLoading) => set({ isLoading }),

      getItemCount: () => {
        const { cart } = get();
        if (!cart?.user_carts) return 0;
        return cart.user_carts.reduce((total, userCart) => {
          if (!userCart.cart_details) return total;
          return total + userCart.cart_details.reduce((sum, detail) => sum + detail.quantity, 0);
        }, 0);
      },

      getTotalPrice: () => {
        const { cart } = get();
        return cart?.total_price || 0;
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);

