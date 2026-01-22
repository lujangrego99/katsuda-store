import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CartProvider } from '@/context/CartContext';
import { WhatsAppProvider } from '@/context/WhatsAppContext';
import { WhatsAppButton } from '@/components/WhatsAppButton';

const inter = Inter({ subsets: ['latin'] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://katsuda.com.ar';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Katsuda - Distribuidores de Grifería y Sanitarios en Mendoza y San Juan',
    template: '%s | Katsuda',
  },
  description: 'Tienda online de grifería y sanitarios. Distribuidores oficiales de FV, Piazza, Ferrum, Roca y más. Envíos a Mendoza, San Juan y toda la región de Cuyo. 9% OFF con transferencia.',
  keywords: ['grifería', 'sanitarios', 'Katsuda', 'Mendoza', 'San Juan', 'FV', 'Piazza', 'Ferrum', 'Roca', 'termotanques', 'bombas de agua', 'baño', 'cocina'],
  authors: [{ name: 'Katsuda' }],
  creator: 'Katsuda',
  publisher: 'Katsuda',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: SITE_URL,
    siteName: 'Katsuda',
    title: 'Katsuda - Distribuidores de Grifería y Sanitarios',
    description: 'Tienda online de grifería y sanitarios. Distribuidores oficiales de FV, Piazza, Ferrum, Roca y más. Envíos a Mendoza, San Juan y toda la región de Cuyo.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Katsuda - Distribuidores de Grifería y Sanitarios',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Katsuda - Distribuidores de Grifería y Sanitarios',
    description: 'Tienda online de grifería y sanitarios. Distribuidores oficiales de FV, Piazza, Ferrum, Roca y más.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <CartProvider>
          <WhatsAppProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <WhatsAppButton />
          </WhatsAppProvider>
        </CartProvider>
      </body>
    </html>
  );
}
