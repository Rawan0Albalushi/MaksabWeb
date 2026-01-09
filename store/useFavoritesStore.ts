import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesState {
  favoriteShops: number[];
  favoriteProducts: number[];
  toggleFavoriteShop: (shopId: number) => void;
  toggleFavoriteProduct: (productId: number) => void;
  isFavoriteShop: (shopId: number) => boolean;
  isFavoriteProduct: (productId: number) => boolean;
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteShops: [],
      favoriteProducts: [],

      toggleFavoriteShop: (shopId) => {
        const { favoriteShops } = get();
        const isFavorite = favoriteShops.includes(shopId);
        set({
          favoriteShops: isFavorite
            ? favoriteShops.filter((id) => id !== shopId)
            : [...favoriteShops, shopId],
        });
      },

      toggleFavoriteProduct: (productId) => {
        const { favoriteProducts } = get();
        const isFavorite = favoriteProducts.includes(productId);
        set({
          favoriteProducts: isFavorite
            ? favoriteProducts.filter((id) => id !== productId)
            : [...favoriteProducts, productId],
        });
      },

      isFavoriteShop: (shopId) => {
        return get().favoriteShops.includes(shopId);
      },

      isFavoriteProduct: (productId) => {
        return get().favoriteProducts.includes(productId);
      },

      clearFavorites: () => set({ favoriteShops: [], favoriteProducts: [] }),
    }),
    {
      name: 'favorites-storage',
    }
  )
);

