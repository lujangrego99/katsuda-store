import { Metadata } from 'next';
import ProductsClientPage from './ProductsClient';

export const metadata: Metadata = {
  title: 'Productos - Catálogo de Grifería y Sanitarios',
  description: 'Explorá nuestro catálogo completo de grifería, sanitarios, termotanques, bombas y más. Filtrá por categoría, marca y precio. Envíos a Mendoza y San Juan.',
  openGraph: {
    title: 'Productos | Katsuda',
    description: 'Catálogo completo de grifería y sanitarios. Filtrá por categoría, marca y precio.',
  },
};

export default function ProductosPage() {
  return <ProductsClientPage />;
}
