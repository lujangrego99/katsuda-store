'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Star,
  Truck,
} from 'lucide-react';
import ProductForm from './ProductForm';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  price: string;
  comparePrice: string | null;
  transferPrice: string | null;
  stock: number;
  stockWarning: number;
  isActive: boolean;
  isFeatured: boolean;
  freeShipping: boolean;
  createdAt: string;
  category: Category;
  brand: Brand | null;
  images: Array<{ url: string; alt: string | null }>;
}

interface ProductsResponse {
  data: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function formatPrice(price: number | string): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(typeof price === 'string' ? parseFloat(price) : price);
}

export default function AdminProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, loading: authLoading, isAuthenticated } = useAdminAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  // Filtros
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [brandFilter, setBrandFilter] = useState(searchParams.get('brand') || '');
  const [lowStockFilter, setLowStockFilter] = useState(searchParams.get('lowStock') === 'true');
  const [activeFilter, setActiveFilter] = useState(searchParams.get('isActive') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const pageSize = 10;

  // Dialog de formulario
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Dialog de confirmación de eliminación
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      if (brandFilter) params.set('brand', brandFilter);
      if (lowStockFilter) params.set('lowStock', 'true');
      if (activeFilter) params.set('isActive', activeFilter);

      const response = await fetch(`${API_URL}/api/admin/products?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar productos');
      }

      const result: ProductsResponse = await response.json();
      setProducts(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [token, page, search, categoryFilter, brandFilter, lowStockFilter, activeFilter]);

  const fetchFilters = useCallback(async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        fetch(`${API_URL}/api/categories`),
        fetch(`${API_URL}/api/brands`),
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        // Flatten categories including children
        const flatCategories: Category[] = [];
        catData.data.forEach((cat: Category & { children?: Category[] }) => {
          flatCategories.push({ id: cat.id, name: cat.name, slug: cat.slug });
          if (cat.children) {
            cat.children.forEach((child: Category) => {
              flatCategories.push({ id: child.id, name: `  └ ${child.name}`, slug: child.slug });
            });
          }
        });
        setCategories(flatCategories);
      }

      if (brandRes.ok) {
        const brandData = await brandRes.json();
        setBrands(brandData.data);
      }
    } catch (err) {
      console.error('Error cargando filtros:', err);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFilters();
    }
  }, [isAuthenticated, fetchFilters]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts();
    }
  }, [isAuthenticated, fetchProducts]);

  // Actualizar URL con filtros
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (categoryFilter) params.set('category', categoryFilter);
    if (brandFilter) params.set('brand', brandFilter);
    if (lowStockFilter) params.set('lowStock', 'true');
    if (activeFilter) params.set('isActive', activeFilter);
    if (page > 1) params.set('page', page.toString());

    const query = params.toString();
    router.replace(`/admin/productos${query ? `?${query}` : ''}`, { scroll: false });
  }, [search, categoryFilter, brandFilter, lowStockFilter, activeFilter, page, router]);

  const handleToggleActive = async (product: Product) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/products/${product.id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cambiar estado');
      }

      // Actualizar estado local
      setProducts(prev => prev.map(p =>
        p.id === product.id ? { ...p, isActive: !p.isActive } : p
      ));
    } catch (err) {
      console.error('Error toggling product:', err);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm || !token) return;

    setDeleting(true);

    try {
      const response = await fetch(`${API_URL}/api/admin/products/${deleteConfirm.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar');
      }

      setDeleteConfirm(null);
      fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setDeleting(false);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
    fetchProducts();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-katsuda-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-gray-500">{total} productos en total</p>
        </div>
        <Button onClick={handleCreate} className="bg-katsuda-600 hover:bg-katsuda-700">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las categorías</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={brandFilter} onValueChange={(v) => { setBrandFilter(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Marca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las marcas</SelectItem>
                  {brands.map(brand => (
                    <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={lowStockFilter}
                  onChange={(e) => { setLowStockFilter(e.target.checked); setPage(1); }}
                  className="rounded border-gray-300"
                />
                Solo bajo stock
              </label>
              <Select value={activeFilter} onValueChange={(v) => { setActiveFilter(v); setPage(1); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="true">Activos</SelectItem>
                  <SelectItem value="false">Inactivos</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" variant="outline" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tabla de productos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Productos</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center gap-2 p-4 mb-4 bg-red-50 text-red-700 rounded-lg">
              <AlertTriangle className="h-5 w-5" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-katsuda-600" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron productos</p>
              {(search || categoryFilter || brandFilter || lowStockFilter || activeFilter) && (
                <Button
                  variant="link"
                  onClick={() => {
                    setSearch('');
                    setCategoryFilter('');
                    setBrandFilter('');
                    setLowStockFilter(false);
                    setActiveFilter('');
                    setPage(1);
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Imagen</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-center">Stock</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead className="w-28">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="h-12 w-12 rounded bg-gray-100 overflow-hidden">
                            {product.images[0] ? (
                              <img
                                src={product.images[0].url}
                                alt={product.images[0].alt || product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <Package className="h-6 w-6 text-gray-300" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{product.name}</span>
                            <div className="flex items-center gap-1 mt-1">
                              {product.brand && (
                                <span className="text-xs text-gray-500">{product.brand.name}</span>
                              )}
                              {product.isFeatured && (
                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                              )}
                              {product.freeShipping && (
                                <Truck className="h-3 w-3 text-green-500" />
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{product.sku}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{product.category.name}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-medium">{formatPrice(product.price)}</span>
                            {product.comparePrice && (
                              <span className="text-xs text-gray-400 line-through">
                                {formatPrice(product.comparePrice)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              product.stock === 0
                                ? 'destructive'
                                : product.stock <= product.stockWarning
                                ? 'warning'
                                : 'success'
                            }
                          >
                            {product.stock}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={product.isActive}
                            onCheckedChange={() => handleToggleActive(product)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(product)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteConfirm(product)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Mostrando {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} de {total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Página {page} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de formulario */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            productId={editingProduct?.id || null}
            categories={categories}
            brands={brands}
            onSuccess={handleFormSuccess}
            onCancel={() => { setIsFormOpen(false); setEditingProduct(null); }}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            ¿Estás seguro de que deseas eliminar el producto{' '}
            <strong>{deleteConfirm?.name}</strong>?
          </p>
          <p className="text-sm text-gray-500">
            Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
