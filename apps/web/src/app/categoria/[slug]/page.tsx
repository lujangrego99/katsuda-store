import { Metadata } from 'next';
import CategoryClientPage from './CategoryClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://katsuda.com.ar';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

async function getCategory(slug: string): Promise<Category | null> {
  try {
    const res = await fetch(`${API_URL}/api/categories/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.category || null;
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
  const category = await getCategory(slug);

  if (!category) {
    return {
      title: 'Categoría no encontrada',
      description: 'La categoría que buscas no existe.',
    };
  }

  const title = `${category.name} - Grifería y Sanitarios`;
  const description = category.description || `Explorá nuestra selección de ${category.name.toLowerCase()}. Encontrá las mejores marcas al mejor precio en Katsuda.`;

  return {
    title,
    description,
    openGraph: {
      title: `${category.name} | Katsuda`,
      description,
      url: `${SITE_URL}/categoria/${category.slug}`,
      images: category.image ? [{ url: category.image, alt: category.name }] : undefined,
    },
    alternates: {
      canonical: `${SITE_URL}/categoria/${category.slug}`,
    },
  };
}

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CategoryClientPage slug={slug} />;
}
