import { Metadata } from 'next';
import SearchClientPage from './SearchClient';

export const metadata: Metadata = {
  title: 'Buscar Productos',
  description: 'Buscá productos de grifería, sanitarios, termotanques y más. Encontrá lo que necesitás por nombre, marca o SKU.',
  openGraph: {
    title: 'Buscar Productos | Katsuda',
    description: 'Buscá productos de grifería, sanitarios, termotanques y más.',
  },
  robots: {
    index: false, // Don't index search pages
    follow: true,
  },
};

export default function BuscarPage() {
  return <SearchClientPage />;
}
