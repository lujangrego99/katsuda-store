import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

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

interface ProductCardProps {
  product: Product;
  searchQuery?: string;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function highlightMatch(text: string, query?: string): React.ReactNode {
  if (!query || query.length < 2) return text;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-200 text-inherit">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function ProductCard({ product, searchQuery }: ProductCardProps) {
  const hasDiscount = product.comparePrice && product.comparePrice > product.price;

  return (
    <Link href={`/productos/${product.slug}`} className="group">
      <Card className="h-full border hover:shadow-lg transition-shadow">
        <div className="aspect-square relative bg-gray-50 overflow-hidden">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-katsuda-50">
              <span className="text-6xl text-katsuda-200">?</span>
            </div>
          )}
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {hasDiscount && (
              <span className="bg-accent-orange text-white text-xs font-semibold px-2 py-1 rounded">
                OFERTA
              </span>
            )}
            {product.freeShipping && (
              <span className="bg-katsuda-700 text-white text-xs font-semibold px-2 py-1 rounded">
                ENVÍO GRATIS
              </span>
            )}
          </div>
          {/* Out of stock overlay */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-gray-800 font-semibold px-4 py-2 rounded">
                Sin stock
              </span>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          {product.brand && (
            <p className="text-xs text-katsuda-600 font-medium mb-1">
              {highlightMatch(product.brand.name, searchQuery)}
            </p>
          )}
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 group-hover:text-katsuda-700 min-h-[2.5rem]">
            {highlightMatch(product.name, searchQuery)}
          </h3>
          <p className="text-xs text-gray-500 mb-2">
            SKU: {highlightMatch(product.sku, searchQuery)}
          </p>
          <div className="space-y-1">
            {hasDiscount && (
              <p className="text-sm text-gray-400 line-through">
                {formatPrice(product.comparePrice!)}
              </p>
            )}
            <p className="text-xl font-bold text-katsuda-900">
              {formatPrice(product.price)}
            </p>
            {product.transferPrice && (
              <p className="text-sm text-katsuda-600">
                {formatPrice(product.transferPrice)} transferencia
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
