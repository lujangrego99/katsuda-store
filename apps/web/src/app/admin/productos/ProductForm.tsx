'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Trash2, GripVertical, ImagePlus } from 'lucide-react';

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

interface ProductImage {
  id?: string;
  url: string;
  alt?: string;
  order: number;
  isPrimary: boolean;
}

interface ProductAttribute {
  id?: string;
  name: string;
  value: string;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description?: string;
  shortDesc?: string;
  price: string;
  comparePrice: string | null;
  transferPrice: string | null;
  cost?: string | null;
  stock: number;
  stockWarning: number;
  isActive: boolean;
  isFeatured: boolean;
  freeShipping: boolean;
  weight?: string | null;
  dimensions?: { width?: number; height?: number; depth?: number } | null;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  category: Category;
  brand: Brand | null;
  images: ProductImage[];
  attributes: ProductAttribute[];
}

interface ProductFormProps {
  productId: string | null;
  categories: Category[];
  brands: Brand[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProductForm({
  productId,
  categories,
  brands,
  onSuccess,
  onCancel,
}: ProductFormProps) {
  const { token } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingProduct, setLoadingProduct] = useState(false);

  // Datos básicos
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');

  // Precios
  const [price, setPrice] = useState('');
  const [comparePrice, setComparePrice] = useState('');
  const [transferPrice, setTransferPrice] = useState('');
  const [cost, setCost] = useState('');

  // Stock
  const [stock, setStock] = useState('0');
  const [stockWarning, setStockWarning] = useState('5');

  // Opciones
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [freeShipping, setFreeShipping] = useState(false);

  // Dimensiones
  const [weight, setWeight] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [depth, setDepth] = useState('');

  // SEO
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [tags, setTags] = useState('');

  // Imágenes
  const [images, setImages] = useState<ProductImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Atributos
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);

  // Cargar datos del producto si estamos editando
  useEffect(() => {
    const loadProductDetails = async () => {
      if (!productId || !token) return;

      setLoadingProduct(true);
      try {
        const response = await fetch(`${API_URL}/api/admin/products/${productId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Error al cargar producto');

        const { data } = await response.json();

        setSku(data.sku);
        setName(data.name);
        setDescription(data.description || '');
        setShortDesc(data.shortDesc || '');
        setCategoryId(data.category.id);
        setBrandId(data.brand?.id || '');
        setPrice(data.price);
        setComparePrice(data.comparePrice || '');
        setTransferPrice(data.transferPrice || '');
        setCost(data.cost || '');
        setStock(data.stock.toString());
        setStockWarning(data.stockWarning.toString());
        setIsActive(data.isActive);
        setIsFeatured(data.isFeatured);
        setFreeShipping(data.freeShipping);
        setWeight(data.weight || '');
        setWidth(data.dimensions?.width?.toString() || '');
        setHeight(data.dimensions?.height?.toString() || '');
        setDepth(data.dimensions?.depth?.toString() || '');
        setSeoTitle(data.seoTitle || '');
        setSeoDescription(data.seoDescription || '');
        setTags(data.tags?.join(', ') || '');
        setImages(data.images || []);
        setAttributes(data.attributes || []);
      } catch (err) {
        console.error('Error loading product:', err);
        setError('Error al cargar los datos del producto');
      } finally {
        setLoadingProduct(false);
      }
    };

    if (productId) {
      loadProductDetails();
    }
  }, [productId, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validaciones básicas
      if (!sku.trim()) throw new Error('El SKU es requerido');
      if (!name.trim()) throw new Error('El nombre es requerido');
      if (!price || parseFloat(price) <= 0) throw new Error('El precio debe ser mayor a 0');
      if (!categoryId) throw new Error('La categoría es requerida');

      const body = {
        sku: sku.trim(),
        name: name.trim(),
        description: description.trim() || null,
        shortDesc: shortDesc.trim() || null,
        price: parseFloat(price),
        comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        transferPrice: transferPrice ? parseFloat(transferPrice) : null,
        cost: cost ? parseFloat(cost) : null,
        stock: parseInt(stock) || 0,
        stockWarning: parseInt(stockWarning) || 5,
        categoryId,
        brandId: brandId || null,
        isActive,
        isFeatured,
        freeShipping,
        weight: weight ? parseFloat(weight) : null,
        dimensions: (width || height || depth)
          ? {
              width: width ? parseFloat(width) : null,
              height: height ? parseFloat(height) : null,
              depth: depth ? parseFloat(depth) : null,
            }
          : null,
        seoTitle: seoTitle.trim() || null,
        seoDescription: seoDescription.trim() || null,
        tags: tags
          ? tags.split(',').map(t => t.trim()).filter(Boolean)
          : [],
        images: images.map((img, index) => ({
          url: img.url,
          alt: img.alt || name,
          order: index,
          isPrimary: index === 0,
        })),
        attributes: attributes
          .filter(attr => attr.name.trim() && attr.value.trim())
          .map(attr => ({
            name: attr.name.trim(),
            value: attr.value.trim(),
          })),
      };

      const url = productId
        ? `${API_URL}/api/admin/products/${productId}`
        : `${API_URL}/api/admin/products`;

      const response = await fetch(url, {
        method: productId ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar producto');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const addImage = () => {
    if (!newImageUrl.trim()) return;

    setImages(prev => [
      ...prev,
      {
        url: newImageUrl.trim(),
        alt: name || 'Imagen del producto',
        order: prev.length,
        isPrimary: prev.length === 0,
      },
    ]);
    setNewImageUrl('');
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const addAttribute = () => {
    setAttributes(prev => [...prev, { name: '', value: '' }]);
  };

  const updateAttribute = (index: number, field: 'name' | 'value', value: string) => {
    setAttributes(prev => prev.map((attr, i) =>
      i === index ? { ...attr, [field]: value } : attr
    ));
  };

  const removeAttribute = (index: number) => {
    setAttributes(prev => prev.filter((_, i) => i !== index));
  };

  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-katsuda-600" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Básico</TabsTrigger>
          <TabsTrigger value="pricing">Precios</TabsTrigger>
          <TabsTrigger value="images">Imágenes</TabsTrigger>
          <TabsTrigger value="attributes">Atributos</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* Tab: Datos Básicos */}
        <TabsContent value="basic" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="ABC-123"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del producto"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoría *</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Marca</Label>
              <Select value={brandId} onValueChange={setBrandId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar marca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin marca</SelectItem>
                  {brands.map(brand => (
                    <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDesc">Descripción corta</Label>
            <Input
              id="shortDesc"
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="Descripción breve para listados"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción completa</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción detallada del producto"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockWarning">Alerta de stock bajo</Label>
              <Input
                id="stockWarning"
                type="number"
                min="0"
                value={stockWarning}
                onChange={(e) => setStockWarning(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="isActive">Activo</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="isFeatured"
                checked={isFeatured}
                onCheckedChange={setIsFeatured}
              />
              <Label htmlFor="isFeatured">Destacado</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="freeShipping"
                checked={freeShipping}
                onCheckedChange={setFreeShipping}
              />
              <Label htmlFor="freeShipping">Envío gratis</Label>
            </div>
          </div>
        </TabsContent>

        {/* Tab: Precios */}
        <TabsContent value="pricing" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Precio *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comparePrice">Precio comparación (tachado)</Label>
              <Input
                id="comparePrice"
                type="number"
                min="0"
                step="0.01"
                value={comparePrice}
                onChange={(e) => setComparePrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transferPrice">Precio transferencia</Label>
              <Input
                id="transferPrice"
                type="number"
                min="0"
                step="0.01"
                value={transferPrice}
                onChange={(e) => setTransferPrice(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500">Precio con descuento por pago con transferencia</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Costo (interno)</Label>
              <Input
                id="cost"
                type="number"
                min="0"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500">Costo del producto (no visible al público)</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-4">Dimensiones y Peso</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  min="0"
                  step="0.01"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width">Ancho (cm)</Label>
                <Input
                  id="width"
                  type="number"
                  min="0"
                  step="0.1"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Alto (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  min="0"
                  step="0.1"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="depth">Profundidad (cm)</Label>
                <Input
                  id="depth"
                  type="number"
                  min="0"
                  step="0.1"
                  value={depth}
                  onChange={(e) => setDepth(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab: Imágenes */}
        <TabsContent value="images" className="space-y-4 mt-4">
          <div className="flex gap-2">
            <Input
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="URL de la imagen"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
            />
            <Button type="button" onClick={addImage} variant="outline">
              <ImagePlus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </div>

          {images.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <ImagePlus className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No hay imágenes</p>
              <p className="text-sm text-gray-400">Agrega URLs de imágenes para el producto</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div
                  key={index}
                  className="relative group border rounded-lg overflow-hidden"
                >
                  <img
                    src={image.url}
                    alt={image.alt || 'Imagen del producto'}
                    className="w-full h-32 object-cover"
                  />
                  {index === 0 && (
                    <span className="absolute top-2 left-2 bg-katsuda-600 text-white text-xs px-2 py-1 rounded">
                      Principal
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeImage(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-4 w-4 text-white" />
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500">
            La primera imagen será la imagen principal del producto
          </p>
        </TabsContent>

        {/* Tab: Atributos */}
        <TabsContent value="attributes" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Agrega especificaciones técnicas del producto
            </p>
            <Button type="button" onClick={addAttribute} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Atributo
            </Button>
          </div>

          {attributes.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <p className="text-gray-500">No hay atributos</p>
              <p className="text-sm text-gray-400">Ej: Color, Material, Tecnología</p>
            </div>
          ) : (
            <div className="space-y-2">
              {attributes.map((attr, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    value={attr.name}
                    onChange={(e) => updateAttribute(index, 'name', e.target.value)}
                    placeholder="Nombre (ej: Color)"
                    className="flex-1"
                  />
                  <Input
                    value={attr.value}
                    onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                    placeholder="Valor (ej: Cromo)"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAttribute(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab: SEO */}
        <TabsContent value="seo" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="seoTitle">Título SEO</Label>
            <Input
              id="seoTitle"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="Título para buscadores (si está vacío se usa el nombre)"
            />
            <p className="text-xs text-gray-500">
              {seoTitle.length}/60 caracteres recomendados
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seoDescription">Descripción SEO</Label>
            <Textarea
              id="seoDescription"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Descripción para buscadores"
              rows={3}
            />
            <p className="text-xs text-gray-500">
              {seoDescription.length}/160 caracteres recomendados
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags/Etiquetas</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Separadas por comas: grifería, cocina, monocomando"
            />
            <p className="text-xs text-gray-500">
              Palabras clave para búsqueda interna
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Botones de acción */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="bg-katsuda-600 hover:bg-katsuda-700">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Guardando...
            </>
          ) : (
            productId ? 'Guardar cambios' : 'Crear producto'
          )}
        </Button>
      </div>
    </form>
  );
}
