'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, SlidersHorizontal, X, PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ProductCard } from '@/components/ProductCard';
import { ProductFilters } from '@/components/ProductFilters';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  shortDesc?: string | null;
  price: number;
  comparePrice?: number | null;
  transferPrice?: number | null;
  stock: number;
  freeShipping: boolean;
  brand?: { name: string } | null;
  image?: string | null;
}

interface ProductsResponse {
  data: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Get filter values from URL
  const page = parseInt(searchParams.get('page') || '1');
  const sortBy = searchParams.get('sortBy') || 'newest';
  const category = searchParams.get('category') || undefined;
  const brand = searchParams.get('brand') || undefined;
  const priceMin = searchParams.get('priceMin') || undefined;
  const priceMax = searchParams.get('priceMax') || undefined;
  const inStock = searchParams.get('inStock') === 'true';
  const freeShipping = searchParams.get('freeShipping') === 'true';

  // Fetch categories and brands once
  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/categories`).then((r) => r.json()),
      fetch(`${API_URL}/api/brands`).then((r) => r.json()),
    ])
      .then(([catData, brandData]) => {
        setCategories(catData.data || []);
        setBrands(brandData.data || []);
      })
      .catch(console.error);
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    setLoading(true);

    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('pageSize', '12');
    params.set('sortBy', sortBy);
    if (category) params.set('category', category);
    if (brand) params.set('brand', brand);
    if (priceMin) params.set('priceMin', priceMin);
    if (priceMax) params.set('priceMax', priceMax);
    if (inStock) params.set('inStock', 'true');
    if (freeShipping) params.set('freeShipping', 'true');

    fetch(`${API_URL}/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((data: ProductsResponse) => {
        setProducts(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 0);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [page, sortBy, category, brand, priceMin, priceMax, inStock, freeShipping]);

  const updateSort = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('sortBy', value);
      params.delete('page');
      router.push(`/productos?${params.toString()}`);
    },
    [router, searchParams]
  );

  const goToPage = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', newPage.toString());
      router.push(`/productos?${params.toString()}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [router, searchParams]
  );

  // Active filters count
  const activeFiltersCount = [category, brand, priceMin, priceMax, inStock, freeShipping].filter(Boolean).length;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="text-sm text-gray-600">
            <a href="/" className="hover:text-katsuda-700">
              Inicio
            </a>
            <span className="mx-2">/</span>
            <span className="text-katsuda-900 font-medium">Productos</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg p-4 shadow-sm sticky top-4">
              <ProductFilters
                categories={categories}
                brands={brands}
                activeCategory={category}
                activeBrand={brand}
                priceMin={priceMin}
                priceMax={priceMax}
                inStock={inStock}
                freeShipping={freeShipping}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Header with count and sort */}
            <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Mobile filter button */}
                  <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="lg:hidden">
                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                        Filtros
                        {activeFiltersCount > 0 && (
                          <span className="ml-1 bg-katsuda-700 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {activeFiltersCount}
                          </span>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80 p-4">
                      <ProductFilters
                        categories={categories}
                        brands={brands}
                        activeCategory={category}
                        activeBrand={brand}
                        priceMin={priceMin}
                        priceMax={priceMax}
                        inStock={inStock}
                        freeShipping={freeShipping}
                        onMobileClose={() => setMobileFiltersOpen(false)}
                      />
                    </SheetContent>
                  </Sheet>

                  <p className="text-gray-600">
                    <span className="font-semibold text-katsuda-900">{total}</span>{' '}
                    {total === 1 ? 'producto' : 'productos'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Ordenar por:</span>
                  <Select value={sortBy} onValueChange={updateSort}>
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Más recientes</SelectItem>
                      <SelectItem value="price_asc">Menor precio</SelectItem>
                      <SelectItem value="price_desc">Mayor precio</SelectItem>
                      <SelectItem value="name_asc">A - Z</SelectItem>
                      <SelectItem value="name_desc">Z - A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active filters chips */}
              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                  {category && (
                    <span className="inline-flex items-center gap-1 bg-katsuda-100 text-katsuda-800 text-sm px-3 py-1 rounded-full">
                      Categoría: {categories.find((c) => c.slug === category)?.name || category}
                      <button
                        onClick={() => {
                          const params = new URLSearchParams(searchParams.toString());
                          params.delete('category');
                          params.delete('page');
                          router.push(`/productos?${params.toString()}`);
                        }}
                        className="hover:bg-katsuda-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {brand && (
                    <span className="inline-flex items-center gap-1 bg-katsuda-100 text-katsuda-800 text-sm px-3 py-1 rounded-full">
                      Marca: {brands.find((b) => b.slug === brand)?.name || brand}
                      <button
                        onClick={() => {
                          const params = new URLSearchParams(searchParams.toString());
                          params.delete('brand');
                          params.delete('page');
                          router.push(`/productos?${params.toString()}`);
                        }}
                        className="hover:bg-katsuda-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {(priceMin || priceMax) && (
                    <span className="inline-flex items-center gap-1 bg-katsuda-100 text-katsuda-800 text-sm px-3 py-1 rounded-full">
                      Precio: {priceMin ? `$${priceMin}` : '$0'} - {priceMax ? `$${priceMax}` : '∞'}
                      <button
                        onClick={() => {
                          const params = new URLSearchParams(searchParams.toString());
                          params.delete('priceMin');
                          params.delete('priceMax');
                          params.delete('page');
                          router.push(`/productos?${params.toString()}`);
                        }}
                        className="hover:bg-katsuda-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {inStock && (
                    <span className="inline-flex items-center gap-1 bg-katsuda-100 text-katsuda-800 text-sm px-3 py-1 rounded-full">
                      Con stock
                      <button
                        onClick={() => {
                          const params = new URLSearchParams(searchParams.toString());
                          params.delete('inStock');
                          params.delete('page');
                          router.push(`/productos?${params.toString()}`);
                        }}
                        className="hover:bg-katsuda-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {freeShipping && (
                    <span className="inline-flex items-center gap-1 bg-katsuda-100 text-katsuda-800 text-sm px-3 py-1 rounded-full">
                      Envío gratis
                      <button
                        onClick={() => {
                          const params = new URLSearchParams(searchParams.toString());
                          params.delete('freeShipping');
                          params.delete('page');
                          router.push(`/productos?${params.toString()}`);
                        }}
                        className="hover:bg-katsuda-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm animate-pulse">
                    <div className="aspect-square bg-gray-200" />
                    <div className="p-4 space-y-3">
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                      <div className="h-4 bg-gray-200 rounded" />
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                      <div className="h-6 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              /* Empty State */
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <PackageSearch className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No encontramos productos
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  No hay productos que coincidan con los filtros seleccionados.
                  Probá quitando algunos filtros o explorando otras categorías.
                </p>
                <Button
                  onClick={() => router.push('/productos')}
                  variant="outline"
                >
                  Ver todos los productos
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page === 1}
                      onClick={() => goToPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-1">
                      {/* First page */}
                      {page > 3 && (
                        <>
                          <Button
                            variant={page === 1 ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => goToPage(1)}
                          >
                            1
                          </Button>
                          {page > 4 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                        </>
                      )}

                      {/* Page numbers around current */}
                      {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        if (
                          pageNum >= page - 2 &&
                          pageNum <= page + 2 &&
                          pageNum > 0 &&
                          pageNum <= totalPages
                        ) {
                          return (
                            <Button
                              key={pageNum}
                              variant={page === pageNum ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => goToPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                        return null;
                      })}

                      {/* Last page */}
                      {page < totalPages - 2 && (
                        <>
                          {page < totalPages - 3 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <Button
                            variant={page === totalPages ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => goToPage(totalPages)}
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page === totalPages}
                      onClick={() => goToPage(page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function ProductosPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-gray-50 min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-katsuda-700" />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
