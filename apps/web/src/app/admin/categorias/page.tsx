'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertTriangle,
  FolderTree,
  ChevronRight,
  GripVertical,
  ImageIcon,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  order: number;
  isActive: boolean;
  parent?: { id: string; name: string } | null;
  children?: Category[];
  _count?: { products: number };
}

export default function AdminCategoriesPage() {
  const { token, loading: authLoading, isAuthenticated } = useAdminAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog de formulario
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    parentId: '',
    isActive: true,
  });

  // Dialog de confirmación de eliminación
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/admin/categories?includeInactive=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar categorías');
      }

      const result = await response.json();
      setCategories(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
    }
  }, [isAuthenticated, fetchCategories]);

  const handleToggleActive = async (category: Category) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/categories/${category.id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cambiar estado');
      }

      fetchCategories();
    } catch (err) {
      console.error('Error toggling category:', err);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm || !token) return;

    setDeleting(true);

    try {
      const response = await fetch(`${API_URL}/api/admin/categories/${deleteConfirm.id}`, {
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
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      parentId: category.parentId || '',
      isActive: category.isActive,
    });
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      image: '',
      parentId: '',
      isActive: true,
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setFormLoading(true);
    setError('');

    try {
      const url = editingCategory
        ? `${API_URL}/api/admin/categories/${editingCategory.id}`
        : `${API_URL}/api/admin/categories`;

      const response = await fetch(url, {
        method: editingCategory ? 'PATCH' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          image: formData.image || null,
          parentId: formData.parentId || null,
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar');
      }

      setIsFormOpen(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setFormLoading(false);
    }
  };

  // Obtener categorías padre (sin parentId y que no sean la categoría actual)
  const getParentOptions = () => {
    const parents: Category[] = [];
    categories.forEach(cat => {
      // No permitir seleccionar la categoría actual como padre
      if (!editingCategory || cat.id !== editingCategory.id) {
        parents.push(cat);
      }
    });
    return parents;
  };

  // Calcular total de productos incluyendo hijos
  const getTotalProducts = (category: Category): number => {
    let total = category._count?.products || 0;
    if (category.children) {
      category.children.forEach(child => {
        total += child._count?.products || 0;
      });
    }
    return total;
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
          <h1 className="text-2xl font-bold">Categorías</h1>
          <p className="text-gray-500">{categories.length} categorías principales</p>
        </div>
        <Button onClick={handleCreate} className="bg-katsuda-600 hover:bg-katsuda-700">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Categoría
        </Button>
      </div>

      {/* Tabla de categorías */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Categorías</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center gap-2 p-4 mb-4 bg-red-50 text-red-700 rounded-lg">
              <AlertTriangle className="h-5 w-5" />
              {error}
              <Button variant="ghost" size="sm" onClick={() => setError('')} className="ml-auto">
                Cerrar
              </Button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-katsuda-600" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <FolderTree className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay categorías</p>
              <Button variant="link" onClick={handleCreate}>
                Crear la primera categoría
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead className="w-16">Imagen</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-center">Productos</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="w-28">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <>
                      {/* Categoría padre */}
                      <TableRow key={category.id} className="bg-gray-50/50">
                        <TableCell>
                          <GripVertical className="h-4 w-4 text-gray-400" />
                        </TableCell>
                        <TableCell>
                          <div className="h-10 w-10 rounded bg-gray-100 overflow-hidden flex items-center justify-center">
                            {category.image ? (
                              <img
                                src={category.image}
                                alt={category.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-gray-300" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{category.name}</span>
                            {category.description && (
                              <span className="text-xs text-gray-500 line-clamp-1">
                                {category.description}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            {getTotalProducts(category)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={category.isActive}
                            onCheckedChange={() => handleToggleActive(category)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(category)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteConfirm(category)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Subcategorías */}
                      {category.children?.map((child) => (
                        <TableRow key={child.id}>
                          <TableCell>
                            <div className="ml-4">
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="h-10 w-10 rounded bg-gray-100 overflow-hidden flex items-center justify-center ml-4">
                              {child.image ? (
                                <img
                                  src={child.image}
                                  alt={child.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="h-5 w-5 text-gray-300" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col pl-4">
                              <span className="text-sm">{child.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              {child._count?.products || 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={child.isActive}
                              onCheckedChange={() => handleToggleActive(child)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(child)}
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteConfirm(child)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de formulario */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre de la categoría"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción opcional"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">URL de imagen</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
              {formData.image && (
                <div className="mt-2 h-24 w-24 rounded overflow-hidden bg-gray-100">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '';
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentId">Categoría padre</Label>
              <Select
                value={formData.parentId}
                onValueChange={(v) => setFormData({ ...formData, parentId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin categoría padre (principal)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin categoría padre (principal)</SelectItem>
                  {getParentOptions().map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Si seleccionas una categoría padre, esta será una subcategoría.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Activa</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingCategory(null);
                }}
                disabled={formLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={formLoading || !formData.name}
                className="bg-katsuda-600 hover:bg-katsuda-700"
              >
                {formLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  editingCategory ? 'Guardar cambios' : 'Crear categoría'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            ¿Estás seguro de que deseas eliminar la categoría{' '}
            <strong>{deleteConfirm?.name}</strong>?
          </p>
          {deleteConfirm?.children && deleteConfirm.children.length > 0 && (
            <p className="text-sm text-amber-600">
              Esta categoría tiene {deleteConfirm.children.length} subcategoría(s).
              Debes eliminarlas primero.
            </p>
          )}
          {(deleteConfirm?._count?.products ?? 0) > 0 && (
            <p className="text-sm text-amber-600">
              Esta categoría tiene {deleteConfirm?._count?.products} producto(s) asociado(s).
              Debes moverlos a otra categoría primero.
            </p>
          )}
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
