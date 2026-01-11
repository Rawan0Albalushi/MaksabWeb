'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

import { CategorySkeleton } from '@/components/ui';
import { CategoryCard } from '@/components/cards';
import { shopService } from '@/services';
import { Category } from '@/types';
import { demoCategories } from '@/utils/demoData';

const CategoriesPage = () => {
  const t = useTranslations('common');

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await shopService.getCategories({ perPage: 50 });
      if (response.data && response.data.length > 0) {
        setCategories(response.data);
      } else {
        // Use demo data if API returns empty
        setCategories(demoCategories);
      }
    } catch (error) {
      // Use demo data as fallback when API fails
      if (process.env.NODE_ENV === 'development') {
        console.warn('Using demo data for categories - API failed:', error);
      }
      setCategories(demoCategories);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.translation?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <div className="min-h-screen bg-[var(--main-bg)] py-8">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[var(--black)]">
              {t('categories')}
            </h1>
            <p className="text-[var(--text-grey)]">
              تصفح جميع التصنيفات المتاحة
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-xs w-full">
            <Search
              size={20}
              className="absolute start-4 top-1/2 -translate-y-1/2 text-[var(--text-grey)]"
            />
            <input
              type="text"
              placeholder="ابحث في التصنيفات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ps-12 pe-4 py-3 bg-white border border-[var(--border)] rounded-[var(--radius-lg)] focus:outline-none focus:border-[var(--primary)] transition-colors"
            />
          </div>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 md:gap-6">
            {Array.from({ length: 16 }).map((_, i) => (
              <CategorySkeleton key={i} />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[var(--text-grey)]">لا توجد تصنيفات مطابقة</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 md:gap-6"
          >
            {filteredCategories.map((category) => (
              <motion.div key={category.id} variants={itemVariants}>
                <CategoryCard category={category} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Featured Categories - Large Cards */}
        {!loading && filteredCategories.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-bold text-[var(--black)] mb-6">
              التصنيفات المميزة
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredCategories.slice(0, 4).map((category) => (
                <CategoryCard key={category.id} category={category} variant="large" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;

