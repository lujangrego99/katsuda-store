'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  children?: Category[];
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  _count?: { products: number };
}

interface ProductFiltersProps {
  categories: Category[];
  brands: Brand[];
  activeCategory?: string;
  activeBrand?: string;
  priceMin?: string;
  priceMax?: string;
  inStock?: boolean;
  freeShipping?: boolean;
  onMobileClose?: () => void;
}

export function ProductFilters({
  categories,
  brands,
  activeCategory,
  activeBrand,
  priceMin,
  priceMax,
  inStock,
  freeShipping,
  onMobileClose,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilters = useCallback(
    (key: string, value: string | boolean | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value === null || value === '' || value === false) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }

      // Reset to page 1 when filters change
      params.delete('page');

      router.push(`/productos?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearAllFilters = useCallback(() => {
    router.push('/productos');
  }, [router]);

  const hasActiveFilters = activeCategory || activeBrand || priceMin || priceMax || inStock || freeShipping;

  return (
    <div className="space-y-4">
      {/* Header with clear button */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-katsuda-700" />
          <h2 className="font-semibold text-lg">Filtros</h2>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            Limpiar todo
            <X className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      <Accordion
        type="multiple"
        defaultValue={['categoria', 'marca', 'precio', 'otros']}
        className="w-full"
      >
        {/* Categories */}
        <AccordionItem value="categoria">
          <AccordionTrigger className="text-sm font-semibold">
            Categoría
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <button
                onClick={() => updateFilters('category', null)}
                className={`block w-full text-left text-sm py-1 px-2 rounded hover:bg-katsuda-50 ${
                  !activeCategory ? 'text-katsuda-700 font-medium bg-katsuda-50' : 'text-gray-600'
                }`}
              >
                Todas las categorías
              </button>
              {categories.map((category) => (
                <div key={category.id}>
                  <button
                    onClick={() => updateFilters('category', category.slug)}
                    className={`block w-full text-left text-sm py-1 px-2 rounded hover:bg-katsuda-50 ${
                      activeCategory === category.slug
                        ? 'text-katsuda-700 font-medium bg-katsuda-50'
                        : 'text-gray-600'
                    }`}
                  >
                    {category.name}
                    <span className="text-gray-400 ml-1">
                      ({category.productCount})
                    </span>
                  </button>
                  {category.children && category.children.length > 0 && (
                    <div className="ml-4 mt-1 space-y-1">
                      {category.children.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => updateFilters('category', child.slug)}
                          className={`block w-full text-left text-sm py-1 px-2 rounded hover:bg-katsuda-50 ${
                            activeCategory === child.slug
                              ? 'text-katsuda-700 font-medium bg-katsuda-50'
                              : 'text-gray-500'
                          }`}
                        >
                          {child.name}
                          <span className="text-gray-400 ml-1">
                            ({child.productCount})
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Brands */}
        <AccordionItem value="marca">
          <AccordionTrigger className="text-sm font-semibold">
            Marca
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <button
                onClick={() => updateFilters('brand', null)}
                className={`block w-full text-left text-sm py-1 px-2 rounded hover:bg-katsuda-50 ${
                  !activeBrand ? 'text-katsuda-700 font-medium bg-katsuda-50' : 'text-gray-600'
                }`}
              >
                Todas las marcas
              </button>
              {brands.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => updateFilters('brand', brand.slug)}
                  className={`block w-full text-left text-sm py-1 px-2 rounded hover:bg-katsuda-50 ${
                    activeBrand === brand.slug
                      ? 'text-katsuda-700 font-medium bg-katsuda-50'
                      : 'text-gray-600'
                  }`}
                >
                  {brand.name}
                  {brand._count && (
                    <span className="text-gray-400 ml-1">
                      ({brand._count.products})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Price Range */}
        <AccordionItem value="precio">
          <AccordionTrigger className="text-sm font-semibold">
            Precio
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Mín"
                  value={priceMin || ''}
                  onChange={(e) => updateFilters('priceMin', e.target.value)}
                  className="h-9"
                />
                <span className="text-gray-400">-</span>
                <Input
                  type="number"
                  placeholder="Máx"
                  value={priceMax || ''}
                  onChange={(e) => updateFilters('priceMax', e.target.value)}
                  className="h-9"
                />
              </div>
              {/* Quick price buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete('priceMin');
                    params.set('priceMax', '50000');
                    params.delete('page');
                    router.push(`/productos?${params.toString()}`);
                  }}
                  className="text-xs"
                >
                  Hasta $50.000
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('priceMin', '50000');
                    params.set('priceMax', '150000');
                    params.delete('page');
                    router.push(`/productos?${params.toString()}`);
                  }}
                  className="text-xs"
                >
                  $50.000 - $150.000
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('priceMin', '150000');
                    params.delete('priceMax');
                    params.delete('page');
                    router.push(`/productos?${params.toString()}`);
                  }}
                  className="text-xs"
                >
                  Más de $150.000
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Other Filters */}
        <AccordionItem value="otros">
          <AccordionTrigger className="text-sm font-semibold">
            Otros filtros
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={inStock}
                  onCheckedChange={(checked) =>
                    updateFilters('inStock', checked as boolean)
                  }
                />
                <span className="text-sm text-gray-700">Solo con stock</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={freeShipping}
                  onCheckedChange={(checked) =>
                    updateFilters('freeShipping', checked as boolean)
                  }
                />
                <span className="text-sm text-gray-700">Envío gratis</span>
              </label>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Mobile close button */}
      {onMobileClose && (
        <Button
          onClick={onMobileClose}
          className="w-full mt-4 lg:hidden"
        >
          Aplicar filtros
        </Button>
      )}
    </div>
  );
}
