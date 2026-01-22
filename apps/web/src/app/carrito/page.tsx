'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  ArrowLeft,
  Package,
  Loader2,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart, CartItem } from '@/context/CartContext';
import { ProductCard } from '@/components/ProductCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface FeaturedProduct {
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

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
  updating,
}: {
  item: CartItem;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  updating: string | null;
}) {
  const isUpdating = updating === item.id;

  return (
    <div className="flex gap-4 py-4 border-b last:border-b-0">
      <Link
        href={`/productos/${item.product.slug}`}
        className="flex-shrink-0 w-24 h-24 relative bg-gray-50 rounded-lg overflow-hidden"
      >
        {item.product.image ? (
          <Image
            src={item.product.image}
            alt={item.product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-8 w-8 text-gray-300" />
          </div>
        )}
      </Link>

      <div className="flex-1 min-w-0">
        <Link
          href={`/productos/${item.product.slug}`}
          className="font-medium text-gray-900 hover:text-katsuda-700 line-clamp-2"
        >
          {item.product.name}
        </Link>
        <p className="text-sm text-gray-500 mt-1">
          {item.product.brand?.name && (
            <span className="text-katsuda-600">{item.product.brand.name}</span>
          )}
          {item.product.brand?.name && ' - '}
          SKU: {item.product.sku}
        </p>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center border rounded-lg">
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1 || isUpdating}
              className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center font-medium">
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                item.quantity
              )}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              disabled={item.quantity >= item.product.stock || isUpdating}
              className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => onRemove(item.id)}
            disabled={isUpdating}
            className="text-red-600 hover:text-red-700 p-2 disabled:opacity-50"
            title="Eliminar"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="text-right">
        <p className="font-bold text-katsuda-900">
          {formatPrice(item.product.price * item.quantity)}
        </p>
        {item.quantity > 1 && (
          <p className="text-sm text-gray-500">
            {formatPrice(item.product.price)} c/u
          </p>
        )}
        {item.product.transferPrice && (
          <p className="text-sm text-katsuda-600 mt-1">
            {formatPrice(item.product.transferPrice * item.quantity)} transf.
          </p>
        )}
      </div>
    </div>
  );
}

function EmptyCart({ featuredProducts }: { featuredProducts: FeaturedProduct[] }) {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <ShoppingCart className="h-24 w-24 mx-auto text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Tu carrito esta vacio
          </h1>
          <p className="text-gray-600 mb-6">
            Agrega productos para comenzar tu compra
          </p>
          <Button asChild size="lg">
            <Link href="/productos">
              <ShoppingBag className="h-5 w-5 mr-2" />
              Ver productos
            </Link>
          </Button>
        </div>

        {featuredProducts.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
              Productos destacados
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CartPage() {
  const { cart, loading, error, updateQuantity, removeFromCart } = useCart();
  const [updating, setUpdating] = useState<string | null>(null);
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/products/featured?limit=4`)
      .then((r) => r.json())
      .then((data) => setFeaturedProducts(data.data || []))
      .catch(console.error);
  }, []);

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setUpdating(itemId);
    await updateQuantity(itemId, quantity);
    setUpdating(null);
  };

  const handleRemove = async (itemId: string) => {
    setUpdating(itemId);
    await removeFromCart(itemId);
    setUpdating(null);
  };

  if (loading && !cart) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-katsuda-700" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return <EmptyCart featuredProducts={featuredProducts} />;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/productos"
            className="flex items-center text-gray-600 hover:text-katsuda-700"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Seguir comprando
          </Link>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
          Mi carrito ({cart.itemCount} {cart.itemCount === 1 ? 'producto' : 'productos'})
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-4 md:p-6">
                {cart.items.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemove}
                    updating={updating}
                  />
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Resumen del pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cart.itemCount} productos)</span>
                  <span>{formatPrice(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Envio</span>
                  <span className="text-sm">A calcular</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-katsuda-900">{formatPrice(cart.subtotal)}</span>
                </div>
                <div className="bg-katsuda-50 rounded-lg p-3">
                  <p className="text-sm text-katsuda-800">
                    <span className="font-semibold">Con transferencia:</span>{' '}
                    {formatPrice(cart.transferSubtotal)}
                    <span className="block text-xs mt-1 text-katsuda-600">
                      Ahorra {formatPrice(cart.subtotal - cart.transferSubtotal)} (9% OFF)
                    </span>
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-3">
                <Button asChild className="w-full" size="lg">
                  <Link href="/checkout">Finalizar compra</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/productos">Seguir comprando</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
