'use client';

import { useState, useEffect, use, useRef, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Phone,
  Heart,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Plus,
  Minus,
  X,
  Check,
  ChefHat,
  Search,
  Clock,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Bike,
  Users,
  Utensils,
  Store,
  CheckCircle2,
  BadgePercent,
  Sparkles,
} from 'lucide-react';
import { clsx } from 'clsx';

import { EmptyState, Button } from '@/components/ui';
import { shopService, cartService } from '@/services';
import { Shop, Category, Product } from '@/types';
import { useFavoritesStore, useSettingsStore, useCartStore, useAuthStore } from '@/store';

interface ShopPageProps {
  params: Promise<{ uuid: string }>;
}

// Animation variants - consistent with home page
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
};

// ============================================
// PRODUCT MODAL COMPONENT
// ============================================
const ProductModal = ({
  product,
  isOpen,
  onClose,
  onAdd,
}: {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAdd: (p: Product, qty: number, stockId: number) => Promise<void>;
}) => {
  const tCommon = useTranslations('common');
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const stock = product?.stocks?.[0];
  const price = stock?.total_price ?? stock?.price ?? 0;
  const oldPrice = stock?.price ?? 0;
  const hasDiscount = stock?.discount && stock.discount > 0;
  const discountPercent = hasDiscount ? Math.round((stock!.discount! / oldPrice) * 100) : 0;

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setSuccess(false);
        setQty(1);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!product || !stock) return null;

  const handleAdd = async () => {
    setLoading(true);
    try {
      await onAdd(product, qty, stock.id);
      setSuccess(true);
      setTimeout(onClose, 600);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Mobile: Bottom Sheet */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-[28px] max-h-[85vh] overflow-hidden safe-area-bottom lg:hidden"
          >
            <div className="flex justify-center" style={{ padding: '12px 0 8px 0' }}>
              <div className="w-12 h-1.5 bg-[var(--border)] rounded-full" />
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 end-4 w-10 h-10 bg-[var(--main-bg)] hover:bg-[var(--border)] rounded-full flex items-center justify-center transition-colors"
              style={{ padding: '10px' }}
            >
              <X size={20} className="text-[var(--text-grey)]" />
            </button>

            <div className="overflow-y-auto max-h-[calc(85vh-60px)]" style={{ padding: '8px 20px 32px 20px' }}>
              <div className="flex gap-4">
                <div className="w-28 h-28 rounded-2xl overflow-hidden bg-[var(--main-bg)] shrink-0 shadow-lg">
                  {product.img ? (
                    <Image
                      src={product.img}
                      alt={product.translation?.title || ''}
                      width={112}
                      height={112}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ChefHat size={36} className="text-[var(--border)]" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 py-1">
                  <h3 className="font-bold text-[var(--black)] text-lg leading-tight line-clamp-2">
                    {product.translation?.title}
                  </h3>
                  {product.translation?.description && (
                    <p className="text-[var(--text-grey)] text-sm mt-1.5 line-clamp-2">
                      {product.translation.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[var(--primary)]">
                      {price.toFixed(3)}
                    </span>
                    <span className="text-[var(--text-grey)] text-sm">{tCommon('sar')}</span>
                    {hasDiscount && (
                      <span className="text-sm text-[var(--text-grey)] line-through ms-1">
                        {oldPrice.toFixed(3)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quantity Section - Enhanced */}
              <div className="flex items-center justify-between border-t-2 border-gray-100" style={{ marginTop: '32px', padding: '20px 0' }}>
                <span className="font-bold text-gray-900 text-lg" style={{ padding: '0 4px' }}>الكمية</span>
                <div className="flex items-center gap-3 bg-gray-100 rounded-2xl" style={{ padding: '8px' }}>
                  {/* Minus Button */}
                  <button
                    onClick={() => qty > 1 && setQty(qty - 1)}
                    disabled={qty <= 1}
                    style={{
                      backgroundColor: qty <= 1 ? '#E6E6E6' : '#ffffff',
                      borderColor: qty <= 1 ? '#DCDCDC' : '#FF3D00',
                      color: qty <= 1 ? '#898989' : '#FF3D00',
                      padding: '12px',
                    }}
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-all border-2 font-bold text-2xl shadow-sm hover:shadow-md"
                  >
                    <Minus size={22} strokeWidth={3} />
                  </button>
                  
                  {/* Quantity Display */}
                  <span className="w-12 text-center font-bold text-2xl text-[var(--black)]" style={{ padding: '0 8px' }}>{qty}</span>
                  
                  {/* Plus Button */}
                  <button
                    onClick={() => setQty(qty + 1)}
                    style={{
                      backgroundColor: '#FF3D00',
                      borderColor: '#FF3D00',
                      color: '#ffffff',
                      boxShadow: '0 4px 14px rgba(255, 61, 0, 0.4)',
                      padding: '12px',
                    }}
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-all border-2 font-bold text-2xl hover:opacity-90 active:scale-95"
                  >
                    <Plus size={22} strokeWidth={3} />
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAdd}
                disabled={loading || success}
                style={{
                  backgroundColor: success ? '#4CAF50' : '#FF3D00',
                  color: '#ffffff',
                  boxShadow: success 
                    ? '0 8px 24px rgba(76, 175, 80, 0.4)' 
                    : '0 8px 24px rgba(255, 61, 0, 0.4)',
                  padding: '18px 24px',
                }}
                className="w-full h-16 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all hover:opacity-95 active:scale-[0.98]"
              >
                {success ? (
                  <>
                    <Check size={26} strokeWidth={3} />
                    <span>تمت الإضافة!</span>
                  </>
                ) : loading ? (
                  <div className="w-7 h-7 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShoppingBag size={24} />
                    <span>أضف للسلة</span>
                    <span className="w-[2px] h-7 bg-white/50 rounded-full mx-1" />
                    <span className="font-bold text-xl">{(price * qty).toFixed(3)} {tCommon('sar')}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Desktop: Center Modal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 hidden lg:flex items-center justify-center p-8"
            onClick={onClose}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
              className="relative bg-white rounded-3xl shadow-2xl overflow-hidden max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex">
                {/* Product Image */}
                <div className="relative w-[280px] shrink-0 group">
                  <div className="aspect-[4/5] bg-[var(--main-bg)] overflow-hidden">
                    {product.img ? (
                      <Image
                        src={product.img}
                        alt={product.translation?.title || ''}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ChefHat size={64} className="text-[var(--border)]" />
                      </div>
                    )}
                  </div>
                  
                  {hasDiscount && (
                    <div className="absolute top-4 start-4">
                      <span className="inline-flex items-center gap-1 bg-[var(--error)] text-white text-sm font-bold rounded-full shadow-lg" style={{ padding: '8px 14px' }}>
                        <BadgePercent size={14} />
                        خصم {discountPercent}%
                      </span>
                    </div>
                  )}
                  
                  <button
                    onClick={onClose}
                    className="absolute top-4 end-4 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-105"
                    style={{ padding: '10px' }}
                  >
                    <X size={18} className="text-[var(--text-grey)]" />
                  </button>
                </div>

                {/* Product Info */}
                <div className="flex-1 flex flex-col" style={{ padding: '24px' }}>
                  <h3 className="font-bold text-[var(--black)] text-xl leading-tight">
                    {product.translation?.title}
                  </h3>
                  
                  {product.translation?.description && (
                    <p className="text-[var(--text-grey)] text-sm mt-2 line-clamp-3 leading-relaxed">
                      {product.translation.description}
                    </p>
                  )}

                  <div className="mt-5 flex items-end gap-3">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-bold text-[var(--primary)]">
                        {price.toFixed(3)}
                      </span>
                      <span className="text-base font-medium text-[var(--text-grey)]">{tCommon('sar')}</span>
                    </div>
                    {hasDiscount && (
                      <span className="text-base text-[var(--text-grey)] line-through pb-1">
                        {oldPrice.toFixed(3)}
                      </span>
                    )}
                  </div>

                  <div className="flex-1" />

                  {/* Quantity Section - Desktop */}
                  <div className="flex items-center justify-between border-t-2 border-gray-100" style={{ padding: '20px 0', marginTop: '16px' }}>
                    <span className="font-bold text-gray-900 text-lg" style={{ padding: '0 4px' }}>الكمية</span>
                    <div className="flex items-center gap-3 bg-gray-100 rounded-2xl" style={{ padding: '8px' }}>
                      {/* Minus Button */}
                      <button
                        onClick={() => qty > 1 && setQty(qty - 1)}
                        disabled={qty <= 1}
                        style={{
                          backgroundColor: qty <= 1 ? '#E6E6E6' : '#ffffff',
                          borderColor: qty <= 1 ? '#DCDCDC' : '#FF3D00',
                          color: qty <= 1 ? '#898989' : '#FF3D00',
                          padding: '10px',
                        }}
                        className="w-11 h-11 rounded-xl flex items-center justify-center transition-all border-2 font-bold shadow-sm hover:shadow-md"
                      >
                        <Minus size={20} strokeWidth={3} />
                      </button>
                      
                      {/* Quantity Display */}
                      <span className="w-12 text-center font-bold text-2xl text-[var(--black)]" style={{ padding: '0 8px' }}>{qty}</span>
                      
                      {/* Plus Button */}
                      <button
                        onClick={() => setQty(qty + 1)}
                        style={{
                          backgroundColor: '#FF3D00',
                          borderColor: '#FF3D00',
                          color: '#ffffff',
                          boxShadow: '0 4px 14px rgba(255, 61, 0, 0.4)',
                          padding: '10px',
                        }}
                        className="w-11 h-11 rounded-xl flex items-center justify-center transition-all border-2 font-bold hover:opacity-90 active:scale-95"
                      >
                        <Plus size={20} strokeWidth={3} />
                      </button>
                    </div>
                  </div>

                  {/* Add to Cart Button - Desktop */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAdd}
                    disabled={loading || success}
                    style={{
                      backgroundColor: success ? '#4CAF50' : '#FF3D00',
                      color: '#ffffff',
                      boxShadow: success 
                        ? '0 8px 24px rgba(76, 175, 80, 0.4)' 
                        : '0 8px 24px rgba(255, 61, 0, 0.4)',
                      padding: '16px 24px',
                      marginTop: '8px',
                    }}
                    className="w-full h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all"
                  >
                    {success ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-2"
                      >
                        <Check size={24} strokeWidth={3} />
                        <span>تمت الإضافة بنجاح!</span>
                      </motion.div>
                    ) : loading ? (
                      <div className="w-7 h-7 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShoppingBag size={22} />
                        <span>أضف للسلة</span>
                        <span className="w-[2px] h-6 bg-white/50 rounded-full mx-1" />
                        <span className="font-bold text-xl">{(price * qty).toFixed(3)} {tCommon('sar')}</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ============================================
// PRODUCT CARD COMPONENT
// ============================================
const ProductCard = ({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: () => void;
}) => {
  const tCommon = useTranslations('common');
  const stock = product.stocks?.[0];
  const price = stock?.total_price ?? stock?.price ?? 0;
  const oldPrice = stock?.price ?? 0;
  const hasDiscount = stock?.discount && stock.discount > 0;
  const outOfStock = stock?.quantity === 0;
  const discountPercent = hasDiscount ? Math.round((stock!.discount! / oldPrice) * 100) : 0;

  return (
    <motion.div variants={scaleIn} className="h-full">
      <div
        className={clsx(
          'group relative bg-white rounded-2xl overflow-hidden h-full flex flex-col',
          'border border-[var(--border)] hover:border-[var(--primary)]/30',
          'shadow-sm hover:shadow-xl',
          'transition-all duration-300 card-shadow-hover',
          outOfStock && 'opacity-60'
        )}
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-[var(--main-bg)]">
          {product.img ? (
            <Image
              src={product.img}
              alt={product.translation?.title || ''}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ChefHat size={36} className="text-[var(--border)]" />
            </div>
          )}

          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Discount Badge */}
          {hasDiscount && (
            <div className="absolute top-2 start-2">
              <span className="inline-flex items-center gap-0.5 bg-[var(--error)] text-white text-[11px] font-bold rounded-lg shadow-lg" style={{ padding: '6px 10px' }}>
                -{discountPercent}%
              </span>
            </div>
          )}

          {/* Quick Add Button - Always Visible & Prominent */}
          {!outOfStock && (
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
              style={{
                backgroundColor: '#FF3D00',
                color: '#ffffff',
                boxShadow: '0 4px 15px rgba(255, 61, 0, 0.5)',
                padding: '10px',
              }}
              className="absolute bottom-3 end-3 w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border-2 border-white transition-all"
            >
              <Plus size={24} strokeWidth={3} />
            </motion.button>
          )}

          {/* Out of Stock */}
          {outOfStock && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
              <span className="bg-[var(--black)] text-white text-xs font-semibold rounded-full" style={{ padding: '10px 18px' }}>
                نفد المخزون
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1" style={{ padding: '14px' }}>
          <h3 className="font-bold text-[var(--black)] text-sm line-clamp-1 group-hover:text-[var(--primary)] transition-colors">
            {product.translation?.title}
          </h3>
          
          {product.translation?.description && (
            <p className="text-[var(--text-grey)] text-xs line-clamp-2 mt-1 flex-1 min-h-[32px]">
              {product.translation.description}
            </p>
          )}
          
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border-light)]">
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-[var(--primary)] text-base">
                {price.toFixed(3)}
              </span>
              <span className="text-[10px] text-[var(--text-grey)]">{tCommon('sar')}</span>
            </div>
            {hasDiscount && (
              <span className="text-[10px] text-[var(--text-grey)] line-through">
                {oldPrice.toFixed(3)}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// FLOATING CART BAR COMPONENT
// ============================================
const FloatingCartBar = ({ count, total }: { count: number; total: number }) => {
  const tCommon = useTranslations('common');
  const { locale } = useSettingsStore();
  const isRTL = locale === 'ar';

  if (count === 0) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed bottom-0 inset-x-0 z-40 p-4 safe-area-bottom"
    >
      <Link href="/cart" className="block container max-w-2xl mx-auto">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative overflow-hidden bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] text-white rounded-2xl flex items-center justify-between shadow-[0_8px_32px_rgba(255,61,0,0.4)]"
          style={{ padding: '14px 18px' }}
        >
          <div className="flex items-center gap-3 relative">
            <div className="relative">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center" style={{ padding: '12px' }}>
                <ShoppingBag size={22} />
              </div>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -end-1.5 w-5 h-5 bg-white text-[var(--primary)] text-xs font-bold rounded-full flex items-center justify-center shadow"
              >
                {count}
              </motion.span>
            </div>
            <div>
              <p className="font-bold text-sm" style={{ padding: '0 4px' }}>عرض السلة</p>
              <p className="text-white/70 text-xs" style={{ padding: '0 4px' }}>{count} منتج</p>
            </div>
          </div>

          <div className="flex items-center gap-3 relative">
            <div className="text-end">
              <p className="text-white/70 text-[10px]" style={{ padding: '0 4px' }}>المجموع</p>
              <p className="font-bold text-lg" style={{ padding: '0 4px' }}>{total.toFixed(3)} <span className="text-sm">{tCommon('sar')}</span></p>
            </div>
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center" style={{ padding: '10px' }}>
              {isRTL ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
};

// ============================================
// SKELETON LOADERS
// ============================================
const ProductSkeleton = () => (
  <div className="bg-white rounded-2xl overflow-hidden border border-[var(--border)] h-full">
    <div className="aspect-square bg-[var(--main-bg)] skeleton" />
    <div className="p-3 space-y-2">
      <div className="h-4 bg-[var(--main-bg)] skeleton rounded-lg w-3/4" />
      <div className="h-3 bg-[var(--main-bg)] skeleton rounded-lg w-full" />
      <div className="h-5 bg-[var(--main-bg)] skeleton rounded-lg w-1/3 mt-2" />
    </div>
  </div>
);

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function ShopPage({ params }: ShopPageProps) {
  const { uuid } = use(params);
  const t = useTranslations('shop');
  const tCommon = useTranslations('common');
  const { locale } = useSettingsStore();
  const isRTL = locale === 'ar';
  const { toggleFavoriteShop, isFavoriteShop } = useFavoritesStore();
  const { cart, setCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const categoriesRef = useRef<HTMLDivElement>(null);

  const [shop, setShop] = useState<Shop | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const cartCount =
    cart?.user_carts?.reduce(
      (t, uc) => t + ((uc.cart_details || uc.cartDetails)?.reduce((s, d) => s + d.quantity, 0) || 0),
      0
    ) || 0;
  const cartTotal = cart?.total_price || 0;

  useEffect(() => {
    fetchShop();
  }, [uuid]);

  useEffect(() => {
    if (shop) fetchProducts();
  }, [selectedCat, shop]);

  const fetchShop = async () => {
    setLoading(true);
    try {
      const res = await shopService.getShopDetails(uuid);
      setShop(res.data);
      if (res.data?.id) {
        const catRes = await shopService.getShopCategories(res.data.id);
        setCategories(catRes.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    if (!shop) return;
    setProductsLoading(true);
    try {
      const res = await shopService.getShopProducts(shop.id, {
        perPage: 100,
        category_id: selectedCat || undefined,
      });
      setProducts(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleAdd = async (p: Product, qty: number, stockId: number) => {
    if (!shop) return;
    
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/shops/${uuid}`);
      return;
    }
    
    const res = await cartService.addToCart({
      shop_id: shop.id,
      stock_id: stockId,
      quantity: qty,
    });
    if (res.data) setCart(res.data);
  };

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoriesRef.current) {
      const scrollAmount = 200;
      categoriesRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const isFav = shop ? isFavoriteShop(shop.id) : false;
  const deliveryTime = shop?.delivery_time
    ? `${shop.delivery_time.from}-${shop.delivery_time.to}`
    : null;

  const filtered = useMemo(() => {
    if (!search) return products;
    return products.filter((p) =>
      p.translation?.title?.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  const allCategories = useMemo(() => [
    { id: null, title: 'الكل', count: products.length },
    ...categories.map((c) => ({
      id: c.id,
      title: c.translation?.title || '',
      count: c.products_count || 0,
    })),
  ], [categories, products.length]);

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--main-bg)]">
        {/* Hero Skeleton - Same style as shops page */}
        <div className="relative bg-gradient-to-br from-[var(--primary)] via-[var(--primary-hover)] to-orange-600 overflow-hidden">
          <div className="container py-8 lg:py-12">
            <div className="flex items-start gap-5">
              <div className="w-10 h-10 bg-white/20 rounded-xl skeleton" />
              <div className="w-24 h-24 lg:w-32 lg:h-32 bg-white/20 rounded-2xl skeleton" />
              <div className="flex-1 space-y-3">
                <div className="h-8 bg-white/20 rounded-lg skeleton w-2/3" />
                <div className="h-5 bg-white/20 rounded-lg skeleton w-1/2" />
                <div className="flex gap-3 mt-4">
                  <div className="h-10 w-28 bg-white/20 rounded-xl skeleton" />
                  <div className="h-10 w-28 bg-white/20 rounded-xl skeleton" />
                </div>
              </div>
            </div>
          </div>
          {/* Wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 80" fill="none" className="w-full h-auto" preserveAspectRatio="none">
              <path d="M0 80L60 73.3C120 66.7 240 53.3 360 46.7C480 40 600 40 720 43.3C840 46.7 960 53.3 1080 56.7C1200 60 1320 60 1380 60L1440 60V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="var(--main-bg)"/>
            </svg>
          </div>
        </div>
        <div className="container py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {[...Array(10)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // EMPTY STATE
  // ============================================
  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--main-bg)] p-4">
        <EmptyState
          type="search"
          title="المتجر غير موجود"
          description="عذراً، هذا المتجر غير متاح حالياً"
        />
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-[var(--main-bg)]">
      {/* ===== HERO HEADER - Same style as shops page ===== */}
      <div className="relative bg-gradient-to-br from-[var(--primary)] via-[var(--primary-hover)] to-orange-600 overflow-hidden">
        {/* Background Pattern - Same as shops page */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-10 start-10 w-20 h-20 bg-white/10 rounded-full blur-2xl animate-float hidden lg:block" />
        <div className="absolute bottom-10 end-20 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-float hidden lg:block" style={{ animationDelay: '1s' }} />
        
        {/* Background Image if exists */}
        {shop.background_img && (
          <div className="absolute inset-0">
            <Image src={shop.background_img} alt="" fill className="object-cover opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)]/60 to-[var(--primary-hover)]/80" />
          </div>
        )}

        <div className="container relative z-10 px-4 sm:px-6 lg:px-8" style={{ paddingTop: '24px', paddingBottom: '16px' }}>
          {/* Shop Info */}
          <div className="flex items-start gap-4 sm:gap-6 lg:gap-8">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative shrink-0"
            >
              <div className="w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-2xl sm:rounded-3xl overflow-hidden bg-white/20 backdrop-blur-sm shadow-2xl border-2 border-white/30">
                {shop.logo_img ? (
                  <Image
                    src={shop.logo_img}
                    alt={shop.translation?.title || ''}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center text-white font-bold text-3xl sm:text-4xl lg:text-5xl">
                    {shop.translation?.title?.charAt(0)}
                  </div>
                )}
              </div>
              
              {/* Status Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
                className={clsx(
                  'absolute -bottom-1 -end-1 sm:-bottom-2 sm:-end-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-lg flex items-center gap-1',
                  shop.open
                    ? 'bg-[var(--success)] text-white'
                    : 'bg-[var(--error)] text-white'
                )}
              >
                <span className={clsx('w-1.5 h-1.5 rounded-full', shop.open ? 'bg-white animate-pulse' : 'bg-white/60')} />
                {shop.open ? 'مفتوح' : 'مغلق'}
              </motion.div>
            </motion.div>

            {/* Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex-1 min-w-0 text-white"
            >
              {/* Verified Badge */}
              {shop.verify && (
                <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-[10px] sm:text-xs font-medium mb-2" style={{ padding: '6px 12px' }}>
                  <CheckCircle2 size={12} />
                  <span style={{ padding: '0 4px' }}>متجر موثق</span>
                </div>
              )}
              
              {/* Title */}
              <h1 className="font-bold text-xl sm:text-2xl lg:text-3xl leading-tight line-clamp-1">
                {shop.translation?.title}
              </h1>
              
              {/* Description */}
              {shop.translation?.description && (
                <p className="text-white/80 text-xs sm:text-sm lg:text-base mt-1.5 line-clamp-2 max-w-xl">
                  {shop.translation.description}
                </p>
              )}
              
              {/* Quick Stats */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4">
                {shop.rating_avg !== undefined && shop.rating_avg > 0 && (
                  <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-xl" style={{ padding: '10px 14px' }}>
                    <Star size={14} className="text-[var(--star)] fill-[var(--star)]" />
                    <span className="font-semibold text-xs sm:text-sm">{shop.rating_avg.toFixed(1)}</span>
                    {shop.reviews_count && (
                      <span className="text-white/60 text-[10px] sm:text-xs">({shop.reviews_count})</span>
                    )}
                  </div>
                )}
                
                {deliveryTime && (
                  <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-xl" style={{ padding: '10px 14px' }}>
                    <Bike size={14} className="text-white/80" />
                    <span className="text-xs sm:text-sm">{deliveryTime} د</span>
                  </div>
                )}
                
                {shop.min_amount !== undefined && shop.min_amount > 0 && (
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl" style={{ padding: '10px 14px' }}>
                    <span className="text-xs sm:text-sm">الحد الأدنى {shop.min_amount} {tCommon('sar')}</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Phone Button - End */}
            {shop.phone && (
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href={`tel:${shop.phone}`}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-[var(--primary)] transition-all shadow-lg hover:shadow-xl border border-[var(--border)] shrink-0 self-center"
                style={{ backgroundColor: 'white', padding: '10px' }}
              >
                <Phone size={20} />
              </motion.a>
            )}
          </div>

        </div>
        
        {/* Spacer to increase orange area height */}
        <div className="h-8 sm:h-10 lg:h-12" />
        
        {/* Wave Bottom - Same as shops page */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto" preserveAspectRatio="none">
            <path d="M0 80L60 73.3C120 66.7 240 53.3 360 46.7C480 40 600 40 720 43.3C840 46.7 960 53.3 1080 56.7C1200 60 1320 60 1380 60L1440 60V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="var(--main-bg)"/>
          </svg>
        </div>
      </div>

      {/* ===== SEARCH & CATEGORIES SECTION ===== */}
      <div style={{ background: 'linear-gradient(135deg, rgba(255, 61, 0, 0.05) 0%, rgba(0, 188, 212, 0.05) 100%)' }}>
        {/* ===== SEARCH BAR ===== */}
        <div className="container px-4 sm:px-6 lg:px-8" style={{ paddingTop: '24px', paddingBottom: '20px' }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative group"
          >
            <div className={clsx(
              "absolute inset-0 rounded-xl sm:rounded-2xl transition-opacity duration-300",
              searchFocused ? "opacity-100 shadow-lg shadow-[var(--primary)]/10" : "opacity-0"
            )} />
            <div className={clsx(
              'relative flex items-center bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden border-2 transition-all duration-300',
              searchFocused
                ? 'border-[var(--primary)]'
                : 'border-transparent hover:shadow-md'
            )}>
              <div className="flex items-center justify-center w-10 sm:w-12 lg:w-14 h-11 sm:h-12 lg:h-14">
                <Search size={18} className={clsx("transition-colors", searchFocused ? "text-[var(--primary)]" : "text-[var(--text-grey)]")} />
              </div>
              <input
                type="text"
                placeholder="ابحث في المنتجات..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="flex-1 h-11 sm:h-12 lg:h-14 pe-4 bg-transparent text-[var(--black)] text-sm placeholder:text-[var(--text-grey)] focus:outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="w-8 h-8 me-2 rounded-lg bg-white/80 hover:bg-white flex items-center justify-center transition-colors"
                  style={{ padding: '8px' }}
                >
                  <X size={14} className="text-[var(--text-grey)]" />
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* ===== CATEGORIES BAR ===== */}
        <div className="sticky top-14 sm:top-16 lg:top-20 z-20 border-y border-[var(--border)]/30 shadow-sm" style={{ background: 'linear-gradient(135deg, rgba(255, 61, 0, 0.03) 0%, rgba(0, 188, 212, 0.03) 100%)' }}>
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 sm:gap-4" style={{ padding: '16px 0' }}>
            {/* Scroll Left */}
            <button
              onClick={() => scrollCategories('left')}
              className="hidden lg:flex w-9 h-9 rounded-full bg-gradient-to-r from-[var(--primary)]/10 to-cyan-500/10 border border-[var(--primary)]/20 items-center justify-center text-[var(--primary)] hover:from-[var(--primary)]/20 hover:to-cyan-500/20 transition-all duration-300 shrink-0"
            >
              {isRTL ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

            {/* Categories */}
            <div
              ref={categoriesRef}
              className="flex-1 overflow-x-auto hide-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0"
            >
              <div className="flex gap-2">
                {allCategories.map((cat) => (
                  <button
                    key={cat.id ?? 'all'}
                    onClick={() => setSelectedCat(cat.id)}
                    className={clsx(
                      'flex items-center gap-2 text-sm font-semibold whitespace-nowrap transition-all duration-300 rounded-full',
                      selectedCat === cat.id
                        ? 'bg-gradient-to-r from-[var(--primary)]/15 to-cyan-500/15 border border-[var(--primary)]/30 text-[var(--primary)]'
                        : 'bg-gradient-to-r from-[var(--primary)]/5 to-cyan-500/5 border border-[var(--border)]/30 text-[var(--text-grey)] hover:from-[var(--primary)]/10 hover:to-cyan-500/10 hover:text-[var(--black)]'
                    )}
                    style={{ padding: '10px 18px' }}
                  >
                    <span>{cat.title}</span>
                    {cat.count > 0 && (
                      <span className={clsx(
                        'text-[11px] font-bold rounded-full min-w-[22px] h-[22px] flex items-center justify-center',
                        selectedCat === cat.id 
                          ? 'bg-[var(--primary)]/20 text-[var(--primary)]' 
                          : 'bg-white/80 text-[var(--text-grey)]'
                      )}>
                        {cat.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Scroll Right */}
            <button
              onClick={() => scrollCategories('right')}
              className="hidden lg:flex w-9 h-9 rounded-full bg-gradient-to-r from-[var(--primary)]/10 to-cyan-500/10 border border-[var(--primary)]/20 items-center justify-center text-[var(--primary)] hover:from-[var(--primary)]/20 hover:to-cyan-500/20 transition-all duration-300 shrink-0"
            >
              {isRTL ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>

            {/* Products Count */}
            <div className="hidden sm:flex items-center gap-2 text-sm bg-gradient-to-r from-[var(--primary)]/10 to-cyan-500/10 rounded-full shrink-0 border border-[var(--primary)]/20" style={{ padding: '10px 18px' }}>
              <Utensils size={16} className="text-[var(--primary)]" />
              <span className="font-bold text-[var(--primary)]">{filtered.length}</span>
              <span className="text-[var(--text-grey)]">منتج</span>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* ===== PRODUCTS GRID ===== */}
      <main className="container px-4 sm:px-6 lg:px-8 pb-28" style={{ paddingTop: '32px' }}>
        {productsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {[...Array(10)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 sm:py-24"
          >
            <div className="w-24 h-24 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mb-5 empty-bounce">
              <ChefHat size={40} className="text-[var(--primary)]/40" />
            </div>
            <p className="text-[var(--black)] font-bold text-lg">لا توجد منتجات</p>
            <p className="text-[var(--text-grey)] text-sm mt-1.5 text-center px-4 max-w-sm">
              {search ? 'جرب البحث بكلمات مختلفة' : 'لا توجد منتجات في هذا القسم حالياً'}
            </p>
            {search && (
              <Button
                onClick={() => setSearch('')}
                variant="outline"
                className="mt-5 rounded-xl border-2"
                style={{ padding: '12px 24px' }}
              >
                مسح البحث
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"
          >
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={() => {
                  setSelectedProduct(product);
                  setSheetOpen(true);
                }}
              />
            ))}
          </motion.div>
        )}
      </main>

      {/* ===== PRODUCT MODAL ===== */}
      <ProductModal
        product={selectedProduct}
        isOpen={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setSelectedProduct(null);
        }}
        onAdd={handleAdd}
      />

      {/* ===== FLOATING CART BAR ===== */}
      <AnimatePresence>
        <FloatingCartBar count={cartCount} total={cartTotal} />
      </AnimatePresence>
    </div>
  );
}
