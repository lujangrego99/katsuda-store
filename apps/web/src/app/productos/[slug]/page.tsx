import { Metadata } from 'next';
import { ProductDetail } from './ProductDetail';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://katsuda.com.ar';

interface ProductData {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  shortDesc: string | null;
  price: number;
  comparePrice: number | null;
  seoTitle: string | null;
  seoDescription: string | null;
  brand: { name: string } | null;
  category: { name: string } | null;
  images: { url: string; alt: string | null; isPrimary: boolean }[];
}

async function getProduct(slug: string): Promise<ProductData | null> {
  try {
    const res = await fetch(`${API_URL}/api/products/${slug}`, {
      next: { revalidate: 60 }, // Revalidar cada 60 segundos
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
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
      description: 'El producto que buscás no está disponible.',
    };
  }

  const title = product.seoTitle || `${product.name} | Katsuda`;
  const description =
    product.seoDescription ||
    product.shortDesc ||
    `${product.name} - ${product.brand?.name || ''} - ${formatPrice(product.price)} - Katsuda Distribuidores`;

  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];
  const imageUrl = primaryImage?.url || `${SITE_URL}/og-image.jpg`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE_URL}/productos/${product.slug}`,
      siteName: 'Katsuda',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
      locale: 'es_AR',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    other: {
      'product:price:amount': product.price.toString(),
      'product:price:currency': 'ARS',
      'product:availability': 'in stock',
      'product:condition': 'new',
      'product:brand': product.brand?.name || 'Katsuda',
      'product:retailer_item_id': product.sku,
    },
  };
}

// JSON-LD Schema for Product
function generateProductSchema(product: ProductData) {
  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDesc || product.description,
    sku: product.sku,
    image: primaryImage?.url,
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
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'Katsuda',
      },
    },
  };
}

// JSON-LD Schema for BreadcrumbList
function generateBreadcrumbSchema(product: ProductData) {
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Inicio',
      item: SITE_URL,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Productos',
      item: `${SITE_URL}/productos`,
    },
  ];

  if (product.category) {
    items.push({
      '@type': 'ListItem',
      position: 3,
      name: product.category.name,
      item: `${SITE_URL}/categoria/${product.category.name.toLowerCase().replace(/\s+/g, '-')}`,
    });
    items.push({
      '@type': 'ListItem',
      position: 4,
      name: product.name,
      item: `${SITE_URL}/productos/${product.slug}`,
    });
  } else {
    items.push({
      '@type': 'ListItem',
      position: 3,
      name: product.name,
      item: `${SITE_URL}/productos/${product.slug}`,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  return (
    <>
      {product && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(generateProductSchema(product)),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(generateBreadcrumbSchema(product)),
            }}
          />
        </>
      )}
      <ProductDetail slug={slug} />
    </>
  );
}
