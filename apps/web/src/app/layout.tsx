import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Katsuda - Distribuidores de primeras marcas',
  description: 'Tienda online de grifería y sanitarios. Distribuidores de FV, Piazza, Ferrum y más en Mendoza y San Juan.',
  keywords: ['grifería', 'sanitarios', 'Katsuda', 'Mendoza', 'San Juan', 'FV', 'Piazza', 'Ferrum'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
