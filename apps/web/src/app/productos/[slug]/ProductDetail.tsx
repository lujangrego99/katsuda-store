'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Minus, Plus, ShoppingCart, Truck, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductCard } from '@/components/ProductCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
}

interface ProductAttribute {
  id: string;
  name: string;
  value: string;
}

interface RelatedProduct {
  id: string;
  sku: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  transferPrice: number | null;
  stock: number;
  freeShipping: boolean;
  brand: { name: string } | null;
  image: string | null;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  shortDesc: string | null;
  price: number;
  comparePrice: number | null;
  transferPrice: number | null;
  stock: number;
  stockWarning: number;
  isFeatured: boolean;
  freeShipping: boolean;
  weight: number | null;
  dimensions: string | null;
  tags: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  brand: { id: string; name: string; slug: string; logo: string | null } | null;
  category: {
    id: string;
    name: string;
    slug: string;
    parent: { id: string; name: string; slug: string } | null;
  } | null;
  images: ProductImage[];
  attributes: ProductAttribute[];
  relatedProducts: RelatedProduct[];
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function calculateInstallments(price: number, count: number): string {
  const installment = price / count;
  return formatPrice(installment);
}

interface ProductDetailProps {
  slug: string;
}

export function ProductDetail({ slug }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [postalCode, setPostalCode] = useState('');
  const [shippingResult, setShippingResult] = useState<{
    calculated: boolean;
    freePickup: boolean;
    homeDelivery: number | null;
    message: string;
  } | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`${API_URL}/api/products/${slug}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Producto no encontrado');
        }
        return res.json();
      })
      .then((data) => {
        setProduct(data.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= (product?.stock || 1)) {
      setQuantity(newQty);
    }
  };

  const handleAddToCart = () => {
    // Por ahora solo log, se implementará en E3-S02
    console.log('Add to cart:', { productId: product?.id, quantity });
    alert(`Agregado al carrito: ${quantity} x ${product?.name}`);
  };

  const handleCalculateShipping = () => {
    if (!postalCode || postalCode.length < 4) {
      return;
    }

    // Simulación de cálculo de envío (se implementará completo en E5-S02)
    const code = parseInt(postalCode);
    let result;

    if (code >= 5500 && code <= 5599) {
      // Mendoza Capital
      result = {
        calculated: true,
        freePickup: true,
        homeDelivery: product?.freeShipping ? 0 : 2500,
        message: 'Mendoza Capital',
      };
    } else if (code >= 5400 && code <= 5699) {
      // Interior Mendoza
      result = {
        calculated: true,
        freePickup: true,
        homeDelivery: product?.freeShipping ? 0 : 4500,
        message: 'Interior de Mendoza',
      };
    } else if (code >= 5400 && code <= 5499) {
      // San Juan
      result = {
        calculated: true,
        freePickup: true,
        homeDelivery: product?.freeShipping ? 0 : 5500,
        message: 'San Juan',
      };
    } else {
      result = {
        calculated: true,
        freePickup: false,
        homeDelivery: null,
        message: 'Consultar disponibilidad de envío a esta zona',
      };
    }

    setShippingResult(result);
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-64 mb-8" />
            <div className="grid md:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-lg" />
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-8 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-32" />
                <div className="h-10 bg-gray-200 rounded w-40" />
                <div className="h-12 bg-gray-200 rounded w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Producto no encontrado</h1>
          <p className="text-gray-600 mb-6">El producto que buscás no existe o no está disponible.</p>
          <Link href="/productos">
            <Button>Ver todos los productos</Button>
          </Link>
        </div>
      </div>
    );
  }

  const hasDiscount = product.comparePrice && product.comparePrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.comparePrice! - product.price) / product.comparePrice!) * 100)
    : 0;
  const allImages = product.images.length > 0 ? product.images : [{ id: '0', url: '', alt: product.name, isPrimary: true }];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center text-sm text-gray-600 flex-wrap gap-1">
            <Link href="/" className="hover:text-katsuda-700">
              Inicio
            </Link>
            <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
            {product.category?.parent && (
              <>
                <Link
                  href={`/categoria/${product.category.parent.slug}`}
                  className="hover:text-katsuda-700"
                >
                  {product.category.parent.name}
                </Link>
                <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
              </>
            )}
            {product.category && (
              <>
                <Link
                  href={`/categoria/${product.category.slug}`}
                  className="hover:text-katsuda-700"
                >
                  {product.category.name}
                </Link>
                <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
              </>
            )}
            <span className="text-katsuda-900 font-medium truncate max-w-[200px]">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square relative bg-white rounded-lg overflow-hidden border">
              {allImages[selectedImage]?.url ? (
                <Image
                  src={allImages[selectedImage].url}
                  alt={allImages[selectedImage].alt || product.name}
                  fill
                  className="object-contain p-4"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-katsuda-50">
                  <span className="text-8xl text-katsuda-200">?</span>
                </div>
              )}
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {hasDiscount && (
                  <span className="bg-accent-orange text-white text-sm font-semibold px-3 py-1 rounded">
                    {discountPercent}% OFF
                  </span>
                )}
                {product.freeShipping && (
                  <span className="bg-katsuda-700 text-white text-sm font-semibold px-3 py-1 rounded">
                    ENVÍO GRATIS
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden ${
                      selectedImage === index
                        ? 'border-katsuda-700'
                        : 'border-gray-200 hover:border-katsuda-300'
                    }`}
                  >
                    {image.url ? (
                      <Image
                        src={image.url}
                        alt={image.alt || `${product.name} - ${index + 1}`}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-katsuda-50">
                        <span className="text-2xl text-katsuda-200">?</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Brand & SKU */}
            <div className="flex items-center justify-between">
              {product.brand && (
                <span className="text-katsuda-700 font-semibold text-lg">
                  {product.brand.name}
                </span>
              )}
              <span className="text-sm text-gray-500">SKU: {product.sku}</span>
            </div>

            {/* Name */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{product.name}</h1>

            {/* Short Description */}
            {product.shortDesc && (
              <p className="text-gray-600">{product.shortDesc}</p>
            )}

            {/* Prices */}
            <div className="bg-white rounded-lg p-4 border space-y-2">
              {hasDiscount && (
                <p className="text-lg text-gray-400 line-through">
                  {formatPrice(product.comparePrice!)}
                </p>
              )}
              <p className="text-3xl font-bold text-katsuda-900">
                {formatPrice(product.price)}
              </p>
              {product.transferPrice && (
                <p className="text-lg text-katsuda-700 font-medium flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  {formatPrice(product.transferPrice)} con transferencia
                  <span className="text-sm text-katsuda-600">(9% OFF)</span>
                </p>
              )}
              <p className="text-sm text-gray-600">
                Hasta 12 cuotas de {calculateInstallments(product.price, 12)} sin interés
              </p>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {product.stock > 0 ? (
                <>
                  <span className="h-3 w-3 bg-green-500 rounded-full" />
                  <span className="text-green-700 font-medium">
                    {product.stock > product.stockWarning
                      ? 'Stock disponible'
                      : `¡Últimas ${product.stock} unidades!`}
                  </span>
                </>
              ) : (
                <>
                  <span className="h-3 w-3 bg-red-500 rounded-full" />
                  <span className="text-red-700 font-medium">Sin stock</span>
                </>
              )}
            </div>

            {/* Quantity Selector & Add to Cart */}
            {product.stock > 0 && (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center border rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-6 py-3 font-semibold text-lg min-w-[60px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.stock}
                    className="p-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <Button
                  onClick={handleAddToCart}
                  size="lg"
                  className="flex-1 bg-katsuda-700 hover:bg-katsuda-800 text-lg py-6"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Agregar al carrito
                </Button>
              </div>
            )}

            {/* Shipping Calculator */}
            <div className="bg-white rounded-lg p-4 border">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Calcular envío
              </h3>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Tu código postal"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ''))}
                  maxLength={4}
                  className="max-w-[150px]"
                />
                <Button variant="outline" onClick={handleCalculateShipping}>
                  Calcular
                </Button>
              </div>

              {shippingResult && shippingResult.calculated && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-600">{shippingResult.message}</p>
                  {shippingResult.freePickup && (
                    <div className="flex items-center gap-2 text-green-700">
                      <Check className="h-4 w-4" />
                      <span className="text-sm font-medium">Retiro gratis en sucursal</span>
                    </div>
                  )}
                  {shippingResult.homeDelivery !== null && (
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        Envío a domicilio:{' '}
                        {shippingResult.homeDelivery === 0 ? (
                          <span className="text-green-700 font-medium">Gratis</span>
                        ) : (
                          <span className="font-medium">
                            {formatPrice(shippingResult.homeDelivery)}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs: Description & Specifications */}
        <div className="bg-white rounded-lg border mb-12">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger
                value="description"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-katsuda-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none py-4 px-6"
              >
                Descripción
              </TabsTrigger>
              {product.attributes.length > 0 && (
                <TabsTrigger
                  value="specifications"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-katsuda-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none py-4 px-6"
                >
                  Especificaciones
                </TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="description" className="p-6">
              {product.description ? (
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  No hay descripción disponible para este producto.
                </p>
              )}
            </TabsContent>
            {product.attributes.length > 0 && (
              <TabsContent value="specifications" className="p-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  {product.attributes.map((attr) => (
                    <div
                      key={attr.id}
                      className="flex justify-between py-2 border-b border-gray-100"
                    >
                      <span className="text-gray-600">{attr.name}</span>
                      <span className="font-medium text-gray-900">{attr.value}</span>
                    </div>
                  ))}
                  {product.weight && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Peso</span>
                      <span className="font-medium text-gray-900">{product.weight} kg</span>
                    </div>
                  )}
                  {product.dimensions && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Dimensiones</span>
                      <span className="font-medium text-gray-900">{product.dimensions}</span>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Related Products */}
        {product.relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Productos relacionados</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {product.relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
