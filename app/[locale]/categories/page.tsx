'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';

import { CategorySkeleton } from '@/components/ui';
import { CategoryCard } from '@/components/cards';
import { shopService } from '@/services';
import { Category } from '@/types';

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
      console.log('Fetching categories...');
      const response = await shopService.getCategories(); // Gets parent categories only
      console.log('Categories response:', response);
      if (response.data && response.data.length > 0) {
        setCategories(response.data);
        console.log('Categories set:', response.data.length);
      } else {
        console.warn('No categories returned from API');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.translation?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4 md:gap-6">
            {Array.from({ length: 16 }).map((_, i) => (
              <CategorySkeleton key={i} />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[var(--text-grey)]">لا توجد تصنيفات مطابقة</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4 md:gap-6">
            {filteredCategories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
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

