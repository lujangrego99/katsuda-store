'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronRight,
  Minus,
  Plus,
  ShoppingCart,
  Truck,
  Shield,
  Package,
  MapPin,
  Loader2,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductCard } from '@/components/ProductCard';
import { useCart } from '@/context/CartContext';
import { useWhatsApp } from '@/context/WhatsAppContext';

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

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parent?: { id: string; name: string; slug: string } | null;
}

interface RelatedProduct {
  id: string;
  sku: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  transferPrice?: number | null;
  stock: number;
  freeShipping: boolean;
  brand?: { name: string } | null;
  image?: string | null;
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
  brand: Brand | null;
  category: Category | null;
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

function ProductDetailContent() {
  const params = useParams();
  const slug = params.slug as string;
  const { addToCart } = useCart();
  const { setProductInfo } = useWhatsApp();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [postalCode, setPostalCode] = useState('');
  const [shippingResult, setShippingResult] = useState<string | null>(null);
  const [shippingData, setShippingData] = useState<{
    available: boolean;
    province?: string;
    zone?: string;
    message?: string;
    delivery?: {
      available: boolean;
      price: number;
      freeShipping: boolean;
      freeShippingMin: number | null;
      amountForFreeShipping: number | null;
      estimatedDays: string;
      message: string;
    };
    pickup?: {
      available: boolean;
      price: number;
      message: string;
      locations?: string[];
    };
  } | null>(null);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    setError(null);

    fetch(`${API_URL}/api/products/${slug}`)
      .then((r) => {
        if (!r.ok) {
          throw new Error('Producto no encontrado');
        }
        return r.json();
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

  // Update WhatsApp context when product is loaded
  useEffect(() => {
    if (product) {
      setProductInfo({ name: product.name, sku: product.sku });
    }
    // Clear product info when leaving the page
    return () => {
      setProductInfo(null);
    };
  }, [product, setProductInfo]);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 1)) {
      setQuantity(newQuantity);
    }
  };

  const handleCalculateShipping = async () => {
    if (!postalCode || postalCode.length < 4) {
      setShippingResult(null);
      setShippingData(null);
      return;
    }

    setCalculatingShipping(true);
    setShippingResult(null);
    setShippingData(null);

    try {
      const productTotal = product ? product.price * quantity : 0;
      const response = await fetch(`${API_URL}/api/shipping/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postalCode,
          productPrice: productTotal,
        }),
      });

      const result = await response.json();
      if (result.data) {
        setShippingData(result.data);
      } else {
        setShippingResult('Error al calcular envío');
      }
    } catch {
      setShippingResult('Error al calcular envío. Intenta nuevamente.');
    }

    setCalculatingShipping(false);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    const success = await addToCart(product.id, quantity);
    setAddingToCart(false);
    if (success) {
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-katsuda-700" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-16 text-center">
          <Package className="h-20 w-20 mx-auto text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Producto no encontrado
          </h1>
          <p className="text-gray-600 mb-6">
            El producto que buscas no existe o fue eliminado.
          </p>
          <Button asChild>
            <Link href="/productos">Ver todos los productos</Link>
          </Button>
        </div>
      </div>
    );
  }

  const hasDiscount = product.comparePrice && product.comparePrice > product.price;
  const discountPercentage = hasDiscount
    ? Math.round((1 - product.price / product.comparePrice!) * 100)
    : 0;

  const installmentPrice = Math.round(product.price / 6);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-600 overflow-x-auto">
            <Link href="/" className="hover:text-katsuda-700 whitespace-nowrap">
              Inicio
            </Link>
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            <Link href="/productos" className="hover:text-katsuda-700 whitespace-nowrap">
              Productos
            </Link>
            {product.category?.parent && (
              <>
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
                <Link
                  href={`/categoria/${product.category.parent.slug}`}
                  className="hover:text-katsuda-700 whitespace-nowrap"
                >
                  {product.category.parent.name}
                </Link>
              </>
            )}
            {product.category && (
              <>
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
                <Link
                  href={`/categoria/${product.category.slug}`}
                  className="hover:text-katsuda-700 whitespace-nowrap"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            <span className="text-katsuda-900 font-medium truncate">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="aspect-square relative bg-gray-50 rounded-lg overflow-hidden">
                {product.images.length > 0 ? (
                  <Image
                    src={product.images[selectedImage]?.url}
                    alt={product.images[selectedImage]?.alt || product.name}
                    fill
                    className="object-contain"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-24 w-24 text-gray-300" />
                  </div>
                )}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {hasDiscount && (
                    <span className="bg-accent-orange text-white text-sm font-semibold px-3 py-1 rounded">
                      -{discountPercentage}% OFF
                    </span>
                  )}
                  {product.freeShipping && (
                    <span className="bg-katsuda-700 text-white text-sm font-semibold px-3 py-1 rounded">
                      ENVIO GRATIS
                    </span>
                  )}
                </div>
              </div>

              {product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {product.images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === index
                          ? 'border-katsuda-700'
                          : 'border-gray-200 hover:border-katsuda-300'
                      }`}
                    >
                      <Image
                        src={image.url}
                        alt={image.alt || `${product.name} - ${index + 1}`}
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              {product.brand && (
                <div className="flex items-center gap-3">
                  {product.brand.logo && (
                    <Image
                      src={product.brand.logo}
                      alt={product.brand.name}
                      width={60}
                      height={30}
                      className="object-contain"
                    />
                  )}
                  <span className="text-katsuda-600 font-medium">
                    {product.brand.name}
                  </span>
                </div>
              )}

              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h1>
                <p className="text-sm text-gray-500">SKU: {product.sku}</p>
              </div>

              <div className="space-y-2">
                {hasDiscount && (
                  <p className="text-lg text-gray-400 line-through">
                    {formatPrice(product.comparePrice!)}
                  </p>
                )}
                <p className="text-3xl lg:text-4xl font-bold text-katsuda-900">
                  {formatPrice(product.price)}
                </p>
                {product.transferPrice && (
                  <p className="text-lg text-katsuda-600 font-medium">
                    {formatPrice(product.transferPrice)}{" "}
                    <span className="text-sm font-normal">
                      con transferencia (9% OFF)
                    </span>
                  </p>
                )}
                <p className="text-gray-600">
                  6 cuotas sin interes de {formatPrice(installmentPrice)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {product.stock > 0 ? (
                  <>
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-green-700 font-medium">
                      {product.stock <= product.stockWarning
                        ? `Ultimas ${product.stock} unidades!`
                        : 'Stock disponible'}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-red-700 font-medium">Sin stock</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-4">
                <span className="text-gray-700 font-medium">Cantidad:</span>
                <div className="flex items-center border rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.stock}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-sm text-gray-500">
                  ({product.stock} disponibles)
                </span>
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={product.stock === 0 || addingToCart}
                size="lg"
                className={`w-full text-lg py-6 ${addedToCart ? 'bg-green-600 hover:bg-green-600' : ''}`}
              >
                {addingToCart ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Agregando...
                  </>
                ) : addedToCart ? (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Agregado al carrito
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Agregar al carrito
                  </>
                )}
              </Button>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Truck className="h-5 w-5 text-katsuda-700" />
                    <span className="font-medium">Calcular envio</span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Codigo postal"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ''))}
                      maxLength={4}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={handleCalculateShipping}
                      disabled={calculatingShipping || postalCode.length < 4}
                    >
                      {calculatingShipping ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Calcular'
                      )}
                    </Button>
                  </div>

                  {shippingResult && (
                    <p className="mt-3 text-sm text-red-600 flex items-start gap-2">
                      <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      {shippingResult}
                    </p>
                  )}

                  {shippingData && (
                    <div className="mt-3 space-y-2">
                      {shippingData.available && shippingData.delivery ? (
                        <>
                          <div className={`p-3 rounded-lg ${shippingData.delivery.freeShipping ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                            <div className="flex items-center gap-2">
                              <Truck className={`h-4 w-4 ${shippingData.delivery.freeShipping ? 'text-green-600' : 'text-gray-600'}`} />
                              <span className={`font-medium ${shippingData.delivery.freeShipping ? 'text-green-700' : 'text-gray-900'}`}>
                                {shippingData.delivery.message}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Llega en {shippingData.delivery.estimatedDays}
                            </p>
                            {!shippingData.delivery.freeShipping && shippingData.delivery.amountForFreeShipping && (
                              <p className="text-xs text-katsuda-600 mt-1">
                                Agrega {formatPrice(shippingData.delivery.amountForFreeShipping)} mas para envio gratis
                              </p>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                          <p className="text-sm text-yellow-700">
                            {shippingData.message || 'No realizamos envios a esta zona'}
                          </p>
                        </div>
                      )}

                      {shippingData.pickup && (
                        <div className="p-3 rounded-lg bg-katsuda-50 border border-katsuda-200">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-katsuda-600" />
                            <span className="font-medium text-katsuda-700">Retiro gratis en sucursal</span>
                          </div>
                          {shippingData.pickup.locations && shippingData.pickup.locations.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {shippingData.pickup.locations.map((loc, idx) => (
                                <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                                  <span className="text-katsuda-500">•</span>
                                  {loc}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {!shippingData && !shippingResult && (
                    <p className="mt-2 text-xs text-gray-500">
                      Retiro gratis en sucursales: Mendoza y San Juan
                    </p>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Shield className="h-5 w-5 text-katsuda-600" />
                  <span>Garantia oficial</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Truck className="h-5 w-5 text-katsuda-600" />
                  <span>Envios a todo Cuyo</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger
                value="description"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-katsuda-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
              >
                Descripcion
              </TabsTrigger>
              <TabsTrigger
                value="specs"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-katsuda-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
              >
                Especificaciones
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="pt-6">
              {product.description ? (
                <div className="prose prose-gray max-w-none">
                  <p className="whitespace-pre-wrap text-gray-700">
                    {product.description}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  Este producto no tiene descripcion detallada.
                </p>
              )}
            </TabsContent>

            <TabsContent value="specs" className="pt-6">
              {product.attributes.length > 0 ? (
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
                      <span className="font-medium text-gray-900">
                        {product.weight} kg
                      </span>
                    </div>
                  )}
                  {product.dimensions && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Dimensiones</span>
                      <span className="font-medium text-gray-900">
                        {product.dimensions}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  No hay especificaciones disponibles para este producto.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {product.relatedProducts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Productos relacionados
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {product.relatedProducts.map((related) => (
                <ProductCard key={related.id} product={related} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  return <ProductDetailContent />;
}
