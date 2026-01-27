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
  Share2,
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
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-[var(--border)] rounded-full" />
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 end-4 w-10 h-10 bg-[var(--main-bg)] hover:bg-[var(--border)] rounded-full flex items-center justify-center transition-colors"
            >
              <X size={20} className="text-[var(--text-grey)]" />
            </button>

            <div className="px-5 pb-8 pt-2 overflow-y-auto max-h-[calc(85vh-60px)]">
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
                      {price.toFixed(2)}
                    </span>
                    <span className="text-[var(--text-grey)] text-sm">{tCommon('sar')}</span>
                    {hasDiscount && (
                      <span className="text-sm text-[var(--text-grey)] line-through ms-1">
                        {oldPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quantity Section - Enhanced */}
              <div className="flex items-center justify-between mt-8 py-5 border-t-2 border-gray-100">
                <span className="font-bold text-gray-900 text-lg">الكمية</span>
                <div className="flex items-center gap-3 bg-gray-100 rounded-2xl p-2">
                  {/* Minus Button */}
                  <button
                    onClick={() => qty > 1 && setQty(qty - 1)}
                    disabled={qty <= 1}
                    style={{
                      backgroundColor: qty <= 1 ? '#e5e7eb' : '#ffffff',
                      borderColor: qty <= 1 ? '#d1d5db' : '#FF3D00',
                      color: qty <= 1 ? '#9ca3af' : '#FF3D00',
                    }}
                    className="w-12 h-12 rounded-xl flex items-center justify-center transition-all border-2 font-bold text-2xl shadow-sm hover:shadow-md"
                  >
                    <Minus size={22} strokeWidth={3} />
                  </button>
                  
                  {/* Quantity Display */}
                  <span className="w-12 text-center font-bold text-2xl text-gray-900">{qty}</span>
                  
                  {/* Plus Button */}
                  <button
                    onClick={() => setQty(qty + 1)}
                    style={{
                      backgroundColor: '#FF3D00',
                      borderColor: '#FF3D00',
                      color: '#ffffff',
                      boxShadow: '0 4px 14px rgba(255, 61, 0, 0.4)',
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
                  backgroundColor: success ? '#22c55e' : '#FF3D00',
                  color: '#ffffff',
                  boxShadow: success 
                    ? '0 8px 24px rgba(34, 197, 94, 0.4)' 
                    : '0 8px 24px rgba(255, 61, 0, 0.4)',
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
                    <span className="font-bold text-xl">{(price * qty).toFixed(2)} {tCommon('sar')}</span>
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
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[var(--error)] text-white text-sm font-bold rounded-full shadow-lg">
                        <BadgePercent size={14} />
                        خصم {discountPercent}%
                      </span>
                    </div>
                  )}
                  
                  <button
                    onClick={onClose}
                    className="absolute top-4 end-4 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-105"
                  >
                    <X size={18} className="text-[var(--text-grey)]" />
                  </button>
                </div>

                {/* Product Info */}
                <div className="flex-1 p-6 flex flex-col">
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
                        {price.toFixed(2)}
                      </span>
                      <span className="text-base font-medium text-[var(--text-grey)]">{tCommon('sar')}</span>
                    </div>
                    {hasDiscount && (
                      <span className="text-base text-[var(--text-grey)] line-through pb-1">
                        {oldPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="flex-1" />

                  {/* Quantity Section - Desktop */}
                  <div className="flex items-center justify-between py-5 border-t-2 border-gray-100 mt-4">
                    <span className="font-bold text-gray-900 text-lg">الكمية</span>
                    <div className="flex items-center gap-3 bg-gray-100 rounded-2xl p-2">
                      {/* Minus Button */}
                      <button
                        onClick={() => qty > 1 && setQty(qty - 1)}
                        disabled={qty <= 1}
                        style={{
                          backgroundColor: qty <= 1 ? '#e5e7eb' : '#ffffff',
                          borderColor: qty <= 1 ? '#d1d5db' : '#FF3D00',
                          color: qty <= 1 ? '#9ca3af' : '#FF3D00',
                        }}
                        className="w-11 h-11 rounded-xl flex items-center justify-center transition-all border-2 font-bold shadow-sm hover:shadow-md"
                      >
                        <Minus size={20} strokeWidth={3} />
                      </button>
                      
                      {/* Quantity Display */}
                      <span className="w-12 text-center font-bold text-2xl text-gray-900">{qty}</span>
                      
                      {/* Plus Button */}
                      <button
                        onClick={() => setQty(qty + 1)}
                        style={{
                          backgroundColor: '#FF3D00',
                          borderColor: '#FF3D00',
                          color: '#ffffff',
                          boxShadow: '0 4px 14px rgba(255, 61, 0, 0.4)',
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
                      backgroundColor: success ? '#22c55e' : '#FF3D00',
                      color: '#ffffff',
                      boxShadow: success 
                        ? '0 8px 24px rgba(34, 197, 94, 0.4)' 
                        : '0 8px 24px rgba(255, 61, 0, 0.4)',
                    }}
                    className="w-full h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 mt-2 transition-all"
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
                        <span className="font-bold text-xl">{(price * qty).toFixed(2)} {tCommon('sar')}</span>
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
              <span className="inline-flex items-center gap-0.5 px-2 py-1 bg-[var(--error)] text-white text-[11px] font-bold rounded-lg shadow-lg">
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
              }}
              className="absolute bottom-3 end-3 w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border-2 border-white transition-all"
            >
              <Plus size={24} strokeWidth={3} />
            </motion.button>
          )}

          {/* Out of Stock */}
          {outOfStock && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
              <span className="bg-[var(--black)] text-white text-xs font-semibold px-4 py-2 rounded-full">
                نفد المخزون
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 flex flex-col flex-1">
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
                {price.toFixed(2)}
              </span>
              <span className="text-[10px] text-[var(--text-grey)]">{tCommon('sar')}</span>
            </div>
            {hasDiscount && (
              <span className="text-[10px] text-[var(--text-grey)] line-through">
                {oldPrice.toFixed(2)}
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
          className="relative overflow-hidden bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] text-white rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-[0_8px_32px_rgba(255,61,0,0.4)]"
        >
          <div className="flex items-center gap-3 relative">
            <div className="relative">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
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
              <p className="font-bold text-sm">عرض السلة</p>
              <p className="text-white/70 text-xs">{count} منتج</p>
            </div>
          </div>

          <div className="flex items-center gap-3 relative">
            <div className="text-end">
              <p className="text-white/70 text-[10px]">المجموع</p>
              <p className="font-bold text-lg">{total.toFixed(2)} <span className="text-sm">{tCommon('sar')}</span></p>
            </div>
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
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

        <div className="container relative z-10 px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-14">
          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-5 sm:mb-6 lg:mb-8">
            <Link
              href="/shops"
              className="w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-all shadow-lg group"
            >
              {isRTL ? (
                <ChevronRight size={20} className="text-white group-hover:scale-110 transition-transform" />
              ) : (
                <ChevronLeft size={20} className="text-white group-hover:scale-110 transition-transform" />
              )}
            </Link>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleFavoriteShop(shop.id)}
                className={clsx(
                  'w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all backdrop-blur-sm shadow-lg',
                  isFav
                    ? 'bg-[var(--error)]/90 text-white'
                    : 'bg-white/20 hover:bg-white/30 text-white'
                )}
              >
                <Heart size={18} className={clsx("sm:w-5 sm:h-5", isFav && 'fill-current')} />
              </motion.button>
              
              {shop.phone && (
                <motion.a
                  whileTap={{ scale: 0.95 }}
                  href={`tel:${shop.phone}`}
                  className="w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-xl sm:rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center text-white transition-all shadow-lg"
                >
                  <Phone size={18} className="sm:w-5 sm:h-5" />
                </motion.a>
              )}
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-xl sm:rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center text-white transition-all shadow-lg"
              >
                <Share2 size={18} className="sm:w-5 sm:h-5" />
              </motion.button>
            </div>
          </div>

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
                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-[10px] sm:text-xs font-medium mb-2">
                  <CheckCircle2 size={12} />
                  <span>متجر موثق</span>
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
                  <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 sm:px-3 py-1.5 rounded-xl">
                    <Star size={14} className="text-[var(--star)] fill-[var(--star)]" />
                    <span className="font-semibold text-xs sm:text-sm">{shop.rating_avg.toFixed(1)}</span>
                    {shop.reviews_count && (
                      <span className="text-white/60 text-[10px] sm:text-xs">({shop.reviews_count})</span>
                    )}
                  </div>
                )}
                
                {deliveryTime && (
                  <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 sm:px-3 py-1.5 rounded-xl">
                    <Bike size={14} className="text-white/80" />
                    <span className="text-xs sm:text-sm">{deliveryTime} د</span>
                  </div>
                )}
                
                {shop.min_amount !== undefined && shop.min_amount > 0 && (
                  <div className="bg-white/20 backdrop-blur-sm px-2.5 sm:px-3 py-1.5 rounded-xl">
                    <span className="text-xs sm:text-sm">الحد الأدنى {shop.min_amount} {tCommon('sar')}</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Stats Cards - Same style as shops page */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-3 sm:gap-6 lg:gap-10 mt-8 sm:mt-10"
          >
            <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 text-white/90">
              <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg sm:rounded-xl bg-white/20 flex items-center justify-center">
                <Star size={14} className="fill-[var(--star)] text-[var(--star)] sm:hidden" />
                <Star size={16} className="fill-[var(--star)] text-[var(--star)] hidden sm:block lg:hidden" />
                <Star size={18} className="fill-[var(--star)] text-[var(--star)] hidden lg:block" />
              </div>
              <div className="text-start">
                <div className="text-base sm:text-lg lg:text-xl font-bold">{shop.rating_avg?.toFixed(1) || '0.0'}</div>
                <div className="text-[9px] sm:text-[10px] lg:text-xs text-white/70">التقييم</div>
              </div>
            </div>
            <div className="w-px h-7 sm:h-8 lg:h-10 bg-white/20" />
            <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3 text-white/90">
              <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg sm:rounded-xl bg-white/20 flex items-center justify-center">
                <Clock size={14} className="sm:hidden" />
                <Clock size={16} className="hidden sm:block lg:hidden" />
                <Clock size={18} className="hidden lg:block" />
              </div>
              <div className="text-start">
                <div className="text-base sm:text-lg lg:text-xl font-bold">{deliveryTime || '-'}</div>
                <div className="text-[9px] sm:text-[10px] lg:text-xs text-white/70">دقيقة توصيل</div>
              </div>
            </div>
            <div className="w-px h-7 sm:h-8 lg:h-10 bg-white/20 hidden xs:block" />
            <div className="hidden xs:flex items-center gap-2 sm:gap-2.5 lg:gap-3 text-white/90">
              <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg sm:rounded-xl bg-white/20 flex items-center justify-center">
                <Utensils size={14} className="sm:hidden" />
                <Utensils size={16} className="hidden sm:block lg:hidden" />
                <Utensils size={18} className="hidden lg:block" />
              </div>
              <div className="text-start">
                <div className="text-base sm:text-lg lg:text-xl font-bold">{products.length || '-'}</div>
                <div className="text-[9px] sm:text-[10px] lg:text-xs text-white/70">منتج</div>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Wave Bottom - Same as shops page */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto" preserveAspectRatio="none">
            <path d="M0 80L60 73.3C120 66.7 240 53.3 360 46.7C480 40 600 40 720 43.3C840 46.7 960 53.3 1080 56.7C1200 60 1320 60 1380 60L1440 60V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="var(--main-bg)"/>
          </svg>
        </div>
      </div>

      {/* ===== SEARCH BAR ===== */}
      <div className="container px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
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
                className="w-8 h-8 me-2 rounded-lg bg-[var(--main-bg)] hover:bg-[var(--border)] flex items-center justify-center transition-colors"
              >
                <X size={14} className="text-[var(--text-grey)]" />
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* ===== CATEGORIES BAR ===== */}
      <div className="sticky top-14 sm:top-16 lg:top-20 z-20 bg-white border-y border-[var(--border)] shadow-sm">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-3 h-12 sm:h-14 lg:h-16">
            {/* Scroll Left */}
            <button
              onClick={() => scrollCategories('left')}
              className="hidden lg:flex w-9 h-9 rounded-xl bg-[var(--main-bg)] hover:bg-[var(--border)] items-center justify-center text-[var(--text-grey)] hover:text-[var(--black)] transition-colors shrink-0"
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
                      'px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-300',
                      selectedCat === cat.id
                        ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/30 scale-105'
                        : 'bg-[var(--main-bg)] text-[var(--text-grey)] hover:bg-[var(--border)] hover:text-[var(--black)]'
                    )}
                  >
                    {cat.title}
                    {cat.count > 0 && (
                      <span className={clsx(
                        'ms-1.5 text-[10px] px-1.5 py-0.5 rounded-md',
                        selectedCat === cat.id ? 'bg-white/20' : 'bg-white'
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
              className="hidden lg:flex w-9 h-9 rounded-xl bg-[var(--main-bg)] hover:bg-[var(--border)] items-center justify-center text-[var(--text-grey)] hover:text-[var(--black)] transition-colors shrink-0"
            >
              {isRTL ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>

            {/* Products Count */}
            <div className="hidden sm:flex items-center gap-1.5 text-sm text-[var(--text-grey)] bg-[var(--main-bg)] px-3 py-1.5 rounded-xl shrink-0">
              <Utensils size={14} />
              <span className="font-bold text-[var(--black)]">{filtered.length}</span>
              <span>منتج</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== PRODUCTS GRID ===== */}
      <main className="container px-4 sm:px-6 lg:px-8 py-5 sm:py-6 pb-28">
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
                className="mt-5 px-6 py-2.5 rounded-xl border-2"
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
