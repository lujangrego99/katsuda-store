import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://katsuda.com.ar';

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
}

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_URL}/api/products/${slug}`, {
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: 'Producto no encontrado | Katsuda',
      description: 'El producto que buscas no existe o fue eliminado.',
    };
  }

  const title = product.seoTitle || `${product.name} | Katsuda`;
  const description =
    product.seoDescription ||
    product.shortDesc ||
    `Comprar ${product.name} ${product.brand?.name ? `de ${product.brand.name}` : ''} en Katsuda. ${product.freeShipping ? 'Envío gratis. ' : ''}9% OFF con transferencia.`;

  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];
  const imageUrl = primaryImage?.url || `${SITE_URL}/og-default.jpg`;

  return {
    title,
    description,
    keywords: [
      product.name,
      product.brand?.name,
      product.category?.name,
      product.sku,
      'grifería',
      'sanitarios',
      'Katsuda',
      'Mendoza',
      'San Juan',
      ...(product.tags || []),
    ].filter(Boolean) as string[],
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/productos/${product.slug}`,
      siteName: 'Katsuda',
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
      locale: 'es_AR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: `${SITE_URL}/productos/${product.slug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];

  // Build breadcrumb items for Schema.org
  const breadcrumbItems = [
    { name: 'Inicio', url: SITE_URL },
    { name: 'Productos', url: `${SITE_URL}/productos` },
  ];

  if (product.category?.parent) {
    breadcrumbItems.push({
      name: product.category.parent.name,
      url: `${SITE_URL}/categoria/${product.category.parent.slug}`,
    });
  }

  if (product.category) {
    breadcrumbItems.push({
      name: product.category.name,
      url: `${SITE_URL}/categoria/${product.category.slug}`,
    });
  }

  breadcrumbItems.push({
    name: product.name,
    url: `${SITE_URL}/productos/${product.slug}`,
  });

  // Schema.org Product structured data
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.shortDesc || `${product.name} disponible en Katsuda`,
    sku: product.sku,
    image: product.images.map((img) => img.url),
    brand: product.brand
      ? {
          '@type': 'Brand',
          name: product.brand.name,
        }
      : undefined,
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/productos/${product.slug}`,
      priceCurrency: 'ARS',
      price: product.price,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Katsuda',
      },
    },
    aggregateRating: undefined, // Could add if we have ratings
    review: undefined, // Could add if we have reviews
  };

  // Schema.org BreadcrumbList
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <ProductDetailClient slug={slug} initialProduct={product} />
    </>
  );
}
