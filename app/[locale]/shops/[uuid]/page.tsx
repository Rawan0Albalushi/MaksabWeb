'use client';

import { useState, useEffect, use, useRef } from 'react';
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
  Award,
  Utensils,
  Grid3X3,
  LayoutGrid,
  Info,
  Share2,
  Timer,
  TrendingUp,
} from 'lucide-react';
import { clsx } from 'clsx';

import { EmptyState, Button } from '@/components/ui';
import { shopService, cartService } from '@/services';
import { Shop, Category, Product } from '@/types';
import { useFavoritesStore, useSettingsStore, useCartStore, useAuthStore } from '@/store';

interface ShopPageProps {
  params: Promise<{ uuid: string }>;
}

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

// ============================================
// PRODUCT MODAL - For Desktop
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

            <div className="px-5 pb-8 pt-2">
              <div className="flex gap-4">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-[var(--main-bg)] shrink-0 shadow-sm">
                  {product.img ? (
                    <Image
                      src={product.img}
                      alt={product.translation?.title || ''}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ChefHat size={40} className="text-[var(--border)]" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 py-1">
                  <h3 className="font-bold text-[var(--black)] text-xl leading-tight">
                    {product.translation?.title}
                  </h3>
                  {product.translation?.description && (
                    <p className="text-[var(--text-grey)] text-sm mt-2 line-clamp-2">
                      {product.translation.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[var(--primary)]">
                      {price.toFixed(2)}
                    </span>
                    <span className="text-[var(--text-grey)] text-sm">{tCommon('sar')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-8 py-5 border-t border-[var(--border-light)]">
                <span className="font-semibold text-[var(--black)] text-lg">الكمية</span>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => qty > 1 && setQty(qty - 1)}
                    disabled={qty <= 1}
                    className={clsx(
                      'w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-95',
                      qty <= 1
                        ? 'bg-[var(--main-bg)] text-[var(--border)]'
                        : 'bg-[var(--main-bg)] text-[var(--black)] hover:bg-[var(--border)]'
                    )}
                  >
                    <Minus size={18} strokeWidth={2.5} />
                  </button>
                  <span className="w-10 text-center font-bold text-xl text-[var(--black)]">{qty}</span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="w-11 h-11 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center hover:bg-[var(--primary)]/20 transition-all active:scale-95"
                  >
                    <Plus size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              <Button
                onClick={handleAdd}
                disabled={loading || success}
                className={clsx(
                  'w-full h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all',
                  success
                    ? 'bg-[var(--success)] text-white'
                    : 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] shadow-[0_4px_20px_rgba(255,61,0,0.35)]'
                )}
              >
                {success ? (
                  <>
                    <Check size={22} strokeWidth={3} />
                    <span>تمت الإضافة!</span>
                  </>
                ) : loading ? (
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShoppingBag size={20} />
                    <span>أضف للسلة</span>
                    <span className="mx-2 opacity-60">•</span>
                    <span>{(price * qty).toFixed(2)} {tCommon('sar')}</span>
                  </>
                )}
              </Button>
            </div>
          </motion.div>

          {/* Desktop: Center Modal - Modern Design */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 hidden lg:flex items-center justify-center p-6"
            onClick={onClose}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 400 }}
              className="relative bg-white rounded-[28px] shadow-[0_25px_80px_-15px_rgba(0,0,0,0.3)] overflow-hidden max-w-[720px] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative gradient background */}
              <div className="absolute top-0 end-0 w-[350px] h-[350px] bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-transparent rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              
              <div className="relative flex">
                {/* Product Image - Right side in RTL */}
                <div className="relative w-[300px] shrink-0 group">
                  <div className="aspect-[4/5] bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
                    {product.img ? (
                      <Image
                        src={product.img}
                        alt={product.translation?.title || ''}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ChefHat size={64} className="text-gray-300" />
                      </div>
                    )}
                    {/* Image overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  {/* Discount Badge - Modern */}
                  {hasDiscount && (
                    <motion.div 
                      initial={{ scale: 0, rotate: -12 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute top-4 start-4 z-10"
                    >
                      <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-bold rounded-full shadow-lg shadow-red-500/30">
                        خصم {discountPercent}%
                      </span>
                    </motion.div>
                  )}
                  
                  {/* Close button - Floating */}
                  <button
                    onClick={onClose}
                    className="absolute top-4 end-4 z-10 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-xl hover:scale-110"
                  >
                    <X size={18} className="text-gray-600" />
                  </button>
                </div>

                {/* Product Info - Modern Layout */}
                <div className="flex-1 p-6 flex flex-col relative">
                  {/* Title */}
                  <motion.h3 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="font-bold text-gray-900 text-xl leading-tight line-clamp-2"
                  >
                    {product.translation?.title}
                  </motion.h3>
                  
                  {/* Description */}
                  {product.translation?.description && (
                    <motion.p 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 }}
                      className="text-gray-500 text-sm mt-2 line-clamp-2 leading-relaxed"
                    >
                      {product.translation.description}
                    </motion.p>
                  )}

                  {/* Price Section */}
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-4 flex items-end gap-3"
                  >
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-[var(--primary)]">
                        {price.toFixed(2)}
                      </span>
                      <span className="text-base font-medium text-gray-400">{tCommon('sar')}</span>
                    </div>
                    {hasDiscount && (
                      <span className="text-base text-gray-400 line-through decoration-2 pb-1">
                        {oldPrice.toFixed(2)}
                      </span>
                    )}
                  </motion.div>

                  {/* Spacer */}
                  <div className="flex-1 min-h-4" />

                  {/* Quantity Section - Modern */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="flex items-center justify-between py-4 border-t border-gray-100"
                  >
                    <span className="font-semibold text-gray-700">الكمية</span>
                    <div className="flex items-center gap-1 bg-gray-50 rounded-2xl p-1">
                      <button
                        onClick={() => qty > 1 && setQty(qty - 1)}
                        disabled={qty <= 1}
                        className={clsx(
                          'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                          qty <= 1
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-600 hover:bg-white hover:shadow-sm active:scale-95'
                        )}
                      >
                        <Minus size={18} strokeWidth={2} />
                      </button>
                      <span className="w-12 text-center font-bold text-xl text-gray-900">{qty}</span>
                      <button
                        onClick={() => setQty(qty + 1)}
                        className="w-10 h-10 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center hover:bg-[var(--primary-hover)] transition-all active:scale-95 shadow-sm shadow-[var(--primary)]/30"
                      >
                        <Plus size={18} strokeWidth={2} />
                      </button>
                    </div>
                  </motion.div>

                  {/* ADD TO CART BUTTON - Prominent Orange */}
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAdd}
                    disabled={loading || success}
                    style={{
                      background: success 
                        ? '#10B981' 
                        : 'linear-gradient(135deg, #FF3D00 0%, #FF6B3D 50%, #FF5722 100%)',
                      color: 'white',
                      boxShadow: success 
                        ? '0 10px 30px -5px rgba(16, 185, 129, 0.5)' 
                        : '0 10px 30px -5px rgba(255, 61, 0, 0.5)',
                    }}
                    className="w-full h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-3 mt-3 transition-all relative overflow-hidden"
                  >
                    {success ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-2"
                      >
                        <Check size={22} strokeWidth={3} />
                        <span>تمت الإضافة بنجاح!</span>
                      </motion.div>
                    ) : loading ? (
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShoppingBag size={20} />
                        <span>أضف للسلة</span>
                        <span className="w-px h-5 bg-white/40" />
                        <span className="font-black">{(price * qty).toFixed(2)} {tCommon('sar')}</span>
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
// PRODUCT CARD - Consistent Size
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
          'transition-all duration-300 transform hover:-translate-y-1',
          outOfStock && 'opacity-60'
        )}
      >
        {/* Image - Fixed Aspect Ratio */}
        <div className="relative aspect-[4/3] overflow-hidden bg-[var(--main-bg)]">
          {product.img ? (
            <Image
              src={product.img}
              alt={product.translation?.title || ''}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ChefHat size={40} className="text-[var(--border)]" />
            </div>
          )}

          {/* Discount Badge */}
          {hasDiscount && (
            <div className="absolute top-2 start-2">
              <span className="inline-flex items-center px-2 py-1 bg-[var(--error)] text-white text-xs font-bold rounded-lg shadow-md">
                -{discountPercent}%
              </span>
            </div>
          )}

          {/* Out of Stock */}
          {outOfStock && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
              <span className="bg-[var(--black)] text-white text-xs font-semibold px-4 py-2 rounded-full">
                نفد المخزون
              </span>
            </div>
          )}

          {/* Add Button */}
          {!outOfStock && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
              className={clsx(
                'absolute bottom-2 end-2',
                'w-9 h-9 lg:w-10 lg:h-10',
                'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)]',
                'text-white rounded-xl shadow-lg',
                'flex items-center justify-center',
                'transform transition-all duration-200',
                'hover:scale-110 active:scale-95'
              )}
            >
              <Plus size={20} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Content - Fixed Height */}
        <div className="p-3 flex flex-col flex-1">
          <h3 className="font-bold text-[var(--black)] text-sm line-clamp-1 group-hover:text-[var(--primary)] transition-colors">
            {product.translation?.title}
          </h3>
          <p className="text-[var(--text-grey)] text-xs line-clamp-2 mt-1 flex-1 min-h-[32px]">
            {product.translation?.description || ''}
          </p>
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
// FLOATING CART BAR
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
      <Link href="/cart" className="block container max-w-3xl mx-auto">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={clsx(
            'relative overflow-hidden',
            'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)]',
            'text-white rounded-2xl',
            'p-4',
            'flex items-center justify-between',
            'shadow-[0_8px_32px_rgba(255,61,0,0.4)]'
          )}
        >
          <div className="flex items-center gap-3 relative">
            <div className="relative">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                <ShoppingBag size={20} />
              </div>
              <span className="absolute -top-1.5 -end-1.5 w-5 h-5 bg-white text-[var(--primary)] text-xs font-bold rounded-full flex items-center justify-center">
                {count}
              </span>
            </div>
            <div>
              <p className="font-bold text-base">عرض السلة</p>
              <p className="text-white/80 text-xs">{count} منتج</p>
            </div>
          </div>

          <div className="flex items-center gap-3 relative">
            <div className="text-end">
              <p className="text-white/80 text-xs">المجموع</p>
              <p className="font-bold text-lg">{total.toFixed(2)} {tCommon('sar')}</p>
            </div>
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
              {isRTL ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
};

// ============================================
// SKELETON LOADER
// ============================================
const ProductSkeleton = () => (
  <div className="bg-white rounded-2xl overflow-hidden border border-[var(--border)] h-full">
    <div className="aspect-[4/3] bg-[var(--main-bg)] skeleton" />
    <div className="p-3 space-y-2">
      <div className="h-4 bg-[var(--main-bg)] skeleton rounded w-3/4" />
      <div className="h-3 bg-[var(--main-bg)] skeleton rounded w-full" />
      <div className="h-3 bg-[var(--main-bg)] skeleton rounded w-1/2" />
      <div className="h-5 bg-[var(--main-bg)] skeleton rounded w-1/3 mt-2" />
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
  const filtered = search
    ? products.filter((p) =>
        p.translation?.title?.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  const allCategories = [
    { id: null, title: 'الكل' },
    ...categories.map((c) => ({ id: c.id, title: c.translation?.title || '' })),
  ];

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--main-bg)]">
        <div className="bg-gradient-to-br from-[#0a1628] via-[#1a3a4a] to-[#0d2233]">
          <div className="container py-10 lg:py-16">
            <div className="flex items-start gap-5">
              <div className="w-10 h-10 bg-white/10 rounded-full skeleton" />
              <div className="w-24 h-24 lg:w-32 lg:h-32 bg-white/10 rounded-2xl skeleton" />
              <div className="flex-1 space-y-3">
                <div className="h-8 bg-white/10 rounded skeleton w-2/3" />
                <div className="h-5 bg-white/10 rounded skeleton w-1/2" />
                <div className="flex gap-3 mt-4">
                  <div className="h-10 w-28 bg-white/10 rounded-xl skeleton" />
                  <div className="h-10 w-28 bg-white/10 rounded-xl skeleton" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="container py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
      {/* ===== HERO HEADER - More Space ===== */}
      <header className="relative bg-gradient-to-br from-[#0a1628] via-[#1a3a4a] to-[#0d2233] overflow-hidden pb-24 lg:pb-28">
        {/* Background Decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-0 start-0 w-72 lg:w-96 h-72 lg:h-96 bg-[var(--primary)]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 end-0 w-96 lg:w-[500px] h-96 lg:h-[500px] bg-[var(--primary-dark)]/15 rounded-full blur-3xl" />
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }}
          />
          {shop.background_img && (
            <div className="absolute inset-0">
              <Image
                src={shop.background_img}
                alt=""
                fill
                className="object-cover opacity-15"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628]/80 via-[#1a3a4a]/70 to-[#0d2233]/90" />
            </div>
          )}
        </div>

        <div className="container relative z-10 py-8 lg:py-12">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-10">
            {/* Back Button & Logo */}
            <div className="flex items-start gap-4 lg:gap-6">
              <Link
                href="/shops"
                className="w-10 h-10 lg:w-11 lg:h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all shrink-0 mt-2"
              >
                {isRTL ? (
                  <ChevronRight size={22} className="text-white" />
                ) : (
                  <ChevronLeft size={22} className="text-white" />
                )}
              </Link>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 h-24 lg:w-32 lg:h-32 rounded-2xl lg:rounded-3xl overflow-hidden bg-white/10 backdrop-blur-sm shrink-0 shadow-2xl border-2 border-white/20"
              >
                {shop.logo_img ? (
                  <Image
                    src={shop.logo_img}
                    alt={shop.translation?.title || ''}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] flex items-center justify-center text-white font-bold text-4xl lg:text-5xl">
                    {shop.translation?.title?.charAt(0)}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Shop Info */}
            <div className="flex-1 min-w-0 text-white">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Title & Status */}
                <div className="flex items-center gap-3 flex-wrap mb-3">
                  <h1 className="font-bold text-2xl lg:text-4xl">
                    {shop.translation?.title}
                  </h1>
                  <span
                    className={clsx(
                      'px-3 py-1 text-xs font-bold rounded-full',
                      shop.open
                        ? 'bg-[var(--success)] text-white'
                        : 'bg-[var(--error)] text-white'
                    )}
                  >
                    {shop.open ? 'مفتوح' : 'مغلق'}
                  </span>
                </div>

                {/* Description */}
                {shop.translation?.description && (
                  <p className="text-white/70 text-sm lg:text-base max-w-xl mb-5 line-clamp-2">
                    {shop.translation.description}
                  </p>
                )}

                {/* Info Pills */}
                <div className="flex items-center gap-3 flex-wrap mb-6">
                  {shop.rating_avg !== undefined && shop.rating_avg > 0 && (
                    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-xl">
                      <Star size={16} className="text-[var(--star)] fill-[var(--star)]" />
                      <span className="font-semibold text-sm">{shop.rating_avg.toFixed(1)}</span>
                      {shop.reviews_count && (
                        <span className="text-white/60 text-xs">({shop.reviews_count})</span>
                      )}
                    </div>
                  )}
                  {deliveryTime && (
                    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-xl">
                      <Bike size={16} />
                      <span className="text-sm">{deliveryTime} دقيقة</span>
                    </div>
                  )}
                  {shop.min_amount !== undefined && shop.min_amount > 0 && (
                    <div className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-xl">
                      <span className="text-sm">الحد الأدنى {shop.min_amount} {tCommon('sar')}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleFavoriteShop(shop.id)}
                    className={clsx(
                      'w-11 h-11 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center transition-all',
                      isFav
                        ? 'bg-[var(--error)]/20 text-[var(--error)]'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    )}
                  >
                    <Heart size={20} className={isFav ? 'fill-current' : ''} />
                  </motion.button>
                  {shop.phone && (
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={`tel:${shop.phone}`}
                      className="w-11 h-11 lg:w-12 lg:h-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition-colors"
                    >
                      <Phone size={20} />
                    </motion.a>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-11 h-11 lg:w-12 lg:h-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition-colors"
                  >
                    <Share2 size={20} />
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      {/* ===== STATS CARDS - Modern Horizontal Design ===== */}
      <div className="container -mt-16 lg:-mt-20 relative z-20 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl border border-[var(--border)] p-4 lg:p-6"
        >
          <div className="grid grid-cols-4 divide-x divide-[var(--border)] rtl:divide-x-reverse">
            {/* Rating */}
            <div className="flex flex-col items-center justify-center px-2 lg:px-4">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-[var(--star)]/10 flex items-center justify-center mb-2">
                <Star size={20} className="text-[var(--star)] fill-[var(--star)] lg:w-6 lg:h-6" />
              </div>
              <span className="font-bold text-[var(--black)] text-lg lg:text-2xl">
                {shop.rating_avg?.toFixed(1) || '0.0'}
              </span>
              <span className="text-[var(--text-grey)] text-xs lg:text-sm">التقييم</span>
            </div>

            {/* Delivery Time */}
            <div className="flex flex-col items-center justify-center px-2 lg:px-4">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-[var(--primary-dark)]/10 flex items-center justify-center mb-2">
                <Bike size={20} className="text-[var(--primary-dark)] lg:w-6 lg:h-6" />
              </div>
              <span className="font-bold text-[var(--black)] text-lg lg:text-2xl">
                {deliveryTime || '-'}
              </span>
              <span className="text-[var(--text-grey)] text-xs lg:text-sm">وقت التوصيل</span>
            </div>

            {/* Products */}
            <div className="flex flex-col items-center justify-center px-2 lg:px-4">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mb-2">
                <Utensils size={20} className="text-[var(--primary)] lg:w-6 lg:h-6" />
              </div>
              <span className="font-bold text-[var(--black)] text-lg lg:text-2xl">
                {products.length || '-'}
              </span>
              <span className="text-[var(--text-grey)] text-xs lg:text-sm">المنتجات</span>
            </div>

            {/* Customers */}
            <div className="flex flex-col items-center justify-center px-2 lg:px-4">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-[var(--success)]/10 flex items-center justify-center mb-2">
                <Users size={20} className="text-[var(--success)] lg:w-6 lg:h-6" />
              </div>
              <span className="font-bold text-[var(--black)] text-lg lg:text-2xl">
                {shop.reviews_count || '+500'}
              </span>
              <span className="text-[var(--text-grey)] text-xs lg:text-sm">العملاء</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ===== SEARCH BAR - Modern Design ===== */}
      <div className="container mb-4">
        <div className="relative">
          <div
            className={clsx(
              'relative flex items-center rounded-2xl transition-all duration-300',
              'bg-white border-2',
              searchFocused
                ? 'border-[var(--primary)] shadow-lg shadow-[var(--primary)]/10'
                : 'border-[var(--border)] hover:border-[var(--border)]'
            )}
          >
            <Search
              size={20}
              className={clsx(
                'absolute start-4 transition-colors',
                searchFocused ? 'text-[var(--primary)]' : 'text-[var(--text-grey)]'
              )}
            />
            <input
              type="text"
              placeholder="ابحث في القائمة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-full h-12 lg:h-14 ps-12 pe-4 bg-transparent rounded-2xl text-[var(--black)] text-sm lg:text-base placeholder:text-[var(--text-grey)] focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute end-4 w-6 h-6 rounded-full bg-[var(--main-bg)] flex items-center justify-center hover:bg-[var(--border)] transition-colors"
              >
                <X size={14} className="text-[var(--text-grey)]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===== CATEGORIES BAR - Modern Pills ===== */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[var(--border)] shadow-sm">
        <div className="container">
          <div className="flex items-center gap-2 py-3 lg:py-4">
            {/* Scroll Left */}
            <button
              onClick={() => scrollCategories('left')}
              className="hidden lg:flex w-9 h-9 rounded-full bg-[var(--main-bg)] hover:bg-[var(--border)] items-center justify-center text-[var(--text-grey)] hover:text-[var(--black)] transition-colors shrink-0"
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
                      'px-4 py-2 lg:px-5 lg:py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200',
                      selectedCat === cat.id
                        ? 'bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/30'
                        : 'bg-[var(--main-bg)] text-[var(--text-grey)] hover:bg-[var(--border)] hover:text-[var(--black)]'
                    )}
                  >
                    {cat.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Scroll Right */}
            <button
              onClick={() => scrollCategories('right')}
              className="hidden lg:flex w-9 h-9 rounded-full bg-[var(--main-bg)] hover:bg-[var(--border)] items-center justify-center text-[var(--text-grey)] hover:text-[var(--black)] transition-colors shrink-0"
            >
              {isRTL ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>

            {/* Products Count */}
            <div className="hidden sm:flex items-center gap-1 text-sm text-[var(--text-grey)] bg-[var(--main-bg)] px-3 py-1.5 rounded-full shrink-0">
              <span className="font-bold text-[var(--black)]">{filtered.length}</span>
              <span>منتج</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== PRODUCTS GRID - Consistent Cards ===== */}
      <main className="container py-6 pb-28">
        {productsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-24 h-24 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mb-4">
              <ChefHat size={40} className="text-[var(--primary)]/40" />
            </div>
            <p className="text-[var(--black)] font-bold text-lg">لا توجد منتجات</p>
            <p className="text-[var(--text-grey)] text-sm mt-1 text-center">
              {search ? 'جرب البحث بكلمات مختلفة' : 'لا توجد منتجات في هذا القسم'}
            </p>
            {search && (
              <Button
                onClick={() => setSearch('')}
                variant="outline"
                className="mt-4 px-6 py-2 rounded-xl"
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
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
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
