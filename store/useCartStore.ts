import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Cart, CartDetail, Shop } from '@/types';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  _hasHydrated: boolean;
  setCart: (cart: Cart | null) => void;
  clearCart: () => void;
  setLoading: (loading: boolean) => void;
  getItemCount: () => number;
  getTotalPrice: () => number;
  setHasHydrated: (state: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: null,
      isLoading: false,
      _hasHydrated: false,

      setCart: (cart) => set({ cart }),

      clearCart: () => set({ cart: null }),

      setLoading: (isLoading) => set({ isLoading }),

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      getItemCount: () => {
        const { cart } = get();
        if (!cart?.user_carts) return 0;
        return cart.user_carts.reduce((total, userCart) => {
          const details = userCart.cart_details || userCart.cartDetails;
          if (!details) return total;
          return total + details.reduce((sum, detail) => sum + detail.quantity, 0);
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
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

