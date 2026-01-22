import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://katsuda.com.ar';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Product {
  slug: string;
  updatedAt: string;
}

interface Category {
  slug: string;
  updatedAt: string;
  children?: Category[];
}

async function getProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${API_URL}/api/products?pageSize=1000`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.data || [];
  } catch {
    return [];
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const response = await fetch(`${API_URL}/api/categories`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/productos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/contacto`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Category pages (including children)
  const categoryPages: MetadataRoute.Sitemap = [];

  const processCategory = (category: Category) => {
    categoryPages.push({
      url: `${SITE_URL}/categoria/${category.slug}`,
      lastModified: new Date(category.updatedAt),
      changeFrequency: 'weekly',
      priority: 0.8,
    });

    if (category.children && category.children.length > 0) {
      category.children.forEach(processCategory);
    }
  };

  categories.forEach(processCategory);

  // Product pages
  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/productos/${product.slug}`,
    lastModified: new Date(product.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
