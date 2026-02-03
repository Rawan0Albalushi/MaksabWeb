'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Heart, Store, ShoppingBag } from 'lucide-react';
import { clsx } from 'clsx';

import { Button, ShopCardSkeleton, ProductCardSkeleton, EmptyState } from '@/components/ui';
import { ShopCard, ProductCard } from '@/components/cards';
import { shopService, productService } from '@/services';
import { Shop, Product } from '@/types';
import { useFavoritesStore } from '@/store';

type Tab = 'shops' | 'products';

const FavoritesPage = () => {
  const t = useTranslations('common');
  const tProfile = useTranslations('profile');

  const { favoriteShops, favoriteProducts } = useFavoritesStore();

  const [activeTab, setActiveTab] = useState<Tab>('shops');
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, [favoriteShops, favoriteProducts, activeTab]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      if (activeTab === 'shops' && favoriteShops.length > 0) {
        // Fetch favorite shops
        const response = await shopService.getShops({
          perPage: 50,
        });
        // Filter to only show favorite shops
        const favShops = response.data?.filter((shop) =>
          favoriteShops.includes(shop.id)
        ) || [];
        setShops(favShops);
      } else if (activeTab === 'products' && favoriteProducts.length > 0) {
        // Fetch favorite products
        const response = await productService.getProductsByIds(favoriteProducts);
        setProducts(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const hasNoFavorites =
    (activeTab === 'shops' && favoriteShops.length === 0) ||
    (activeTab === 'products' && favoriteProducts.length === 0);

  return (
    <div className="min-h-screen relative bg-gradient-to-b from-[#F4F5F8] via-[#e8f5f4] via-60% to-[#fff5f2]" style={{ paddingTop: '100px', paddingBottom: '32px' }}>
      {/* Subtle decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] start-0 w-[400px] h-[400px] bg-[#80d1cd]/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] end-0 w-[500px] h-[500px] bg-[#FF3D00]/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-[20%] start-[20%] w-[400px] h-[400px] bg-[#267881]/8 rounded-full blur-[100px]" />
      </div>
      <div className="container relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-[var(--error-light)] flex items-center justify-center">
            <Heart size={24} className="text-[var(--error)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--black)]">
              {tProfile('favorites')}
            </h1>
            <p className="text-[var(--text-grey)]">
              {activeTab === 'shops'
                ? `${favoriteShops.length} متجر محفوظ`
                : `${favoriteProducts.length} منتج محفوظ`}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-[var(--radius-lg)] p-1 mb-8 max-w-xs">
          <button
            onClick={() => setActiveTab('shops')}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-[var(--radius-md)] font-medium transition-all',
              activeTab === 'shops'
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--text-grey)] hover:text-[var(--black)]'
            )}
          >
            <Store size={18} />
            {t('shops')}
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-[var(--radius-md)] font-medium transition-all',
              activeTab === 'products'
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--text-grey)] hover:text-[var(--black)]'
            )}
          >
            <ShoppingBag size={18} />
            المنتجات
          </button>
        </div>

        {/* Content */}
        {hasNoFavorites ? (
          <EmptyState
            type="favorites"
            title={
              activeTab === 'shops'
                ? 'لا توجد متاجر مفضلة'
                : 'لا توجد منتجات مفضلة'
            }
            description={
              activeTab === 'shops'
                ? 'أضف متاجرك المفضلة للوصول إليها بسهولة'
                : 'أضف منتجاتك المفضلة للوصول إليها بسهولة'
            }
            action={{
              label: activeTab === 'shops' ? 'تصفح المتاجر' : 'تصفح المنتجات',
              onClick: () =>
                (window.location.href = activeTab === 'shops' ? '/shops' : '/'),
            }}
          />
        ) : loading ? (
          <div
            className={clsx(
              'grid gap-6',
              activeTab === 'shops'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
            )}
          >
            {Array.from({ length: 8 }).map((_, i) =>
              activeTab === 'shops' ? (
                <ShopCardSkeleton key={i} />
              ) : (
                <ProductCardSkeleton key={i} />
              )
            )}
          </div>
        ) : activeTab === 'shops' ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {shops.map((shop) => (
              <motion.div key={shop.id} variants={itemVariants}>
                <ShopCard shop={shop} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
          >
            {products.map((product) => (
              <motion.div key={product.id} variants={itemVariants}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;

