'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Search,
  ShoppingCart,
  Phone,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useCart } from '@/context/CartContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const categories = [
  { name: 'Griferías', href: '/categoria/griferias' },
  { name: 'Sanitarios', href: '/categoria/sanitarios' },
  { name: 'Termotanques', href: '/categoria/termotanques' },
  { name: 'Bombas', href: '/categoria/bombas' },
  { name: 'Hogar', href: '/categoria/hogar' },
  { name: 'Instalaciones', href: '/categoria/instalaciones' },
];

interface SearchResult {
  id: string;
  sku: string;
  name: string;
  slug: string;
  price: number;
  transferPrice: number | null;
  stock: number;
  brand: { id: string; name: string; slug: string } | null;
  category: { id: string; name: string; slug: string } | null;
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

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2) return text;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
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

export function Header() {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const { cart } = useCart();

  const itemCount = cart?.itemCount || 0;

  // Debounced search
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `${API_URL}/api/products/search?q=${encodeURIComponent(trimmedQuery)}&limit=5`
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.data || []);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node) &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      router.push(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (slug: string) => {
    setShowSuggestions(false);
    setSearchQuery('');
    setSearchOpen(false);
    router.push(`/productos/${slug}`);
  };

  const handleViewAllResults = () => {
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      router.push(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const SuggestionsDropdown = () => (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
      {isSearching ? (
        <div className="p-4 text-center text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
          Buscando...
        </div>
      ) : suggestions.length > 0 ? (
        <>
          <ul className="divide-y divide-gray-100">
            {suggestions.map((product) => (
              <li key={product.id}>
                <button
                  type="button"
                  onClick={() => handleSuggestionClick(product.slug)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-12 h-12 relative flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ShoppingCart className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {highlightMatch(product.name, searchQuery)}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {product.brand?.name && (
                        <span className="font-medium">{highlightMatch(product.brand.name, searchQuery)}</span>
                      )}
                      {product.brand?.name && ' · '}
                      SKU: {highlightMatch(product.sku, searchQuery)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-katsuda-900">
                      {formatPrice(Number(product.price))}
                    </p>
                    {product.transferPrice && (
                      <p className="text-xs text-green-600">
                        Trans: {formatPrice(Number(product.transferPrice))}
                      </p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={handleViewAllResults}
            className="w-full p-3 text-center text-sm font-medium text-katsuda-700 hover:bg-katsuda-50 border-t transition-colors"
          >
            Ver todos los resultados
          </button>
        </>
      ) : searchQuery.trim().length >= 2 ? (
        <div className="p-4 text-center text-gray-500">
          No se encontraron productos
        </div>
      ) : null}
    </div>
  );

  return (
    <header className="sticky top-0 z-50">
      {/* Top bar con teléfono */}
      <div className="bg-katsuda-900 text-white py-2">
        <div className="container mx-auto px-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <a
              href="tel:+542614251234"
              className="flex items-center gap-1 hover:text-katsuda-200 transition-colors"
            >
              <Phone className="h-4 w-4" />
              <span className="hidden sm:inline">(261) 425-1234</span>
            </a>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline">Sucursales en Mendoza y San Juan</span>
            <a
              href="https://wa.me/5492614251234?text=Hola!%20Quiero%20hacer%20una%20consulta"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700 px-3 py-1 rounded-full transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px]">
                <SheetHeader>
                  <SheetTitle className="text-katsuda-900">Menú</SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col gap-2">
                  {categories.map((category) => (
                    <Link
                      key={category.href}
                      href={category.href}
                      className="py-3 px-4 text-lg hover:bg-katsuda-50 rounded-md transition-colors"
                    >
                      {category.name}
                    </Link>
                  ))}
                  <hr className="my-4" />
                  <Link
                    href="/contacto"
                    className="py-3 px-4 text-lg hover:bg-katsuda-50 rounded-md transition-colors"
                  >
                    Contacto
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <div className="flex flex-col">
                <span className="text-2xl md:text-3xl font-bold text-katsuda-900">
                  KATSUDA
                </span>
                <span className="text-xs md:text-sm text-katsuda-600 -mt-1">
                  Distribuidores de primeras marcas
                </span>
              </div>
            </Link>

            {/* Desktop navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {categories.map((category) => (
                <Link
                  key={category.href}
                  href={category.href}
                  className="text-gray-700 hover:text-katsuda-900 font-medium transition-colors"
                >
                  {category.name}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Search - Desktop */}
              <div ref={searchRef} className="hidden md:block relative">
                <form onSubmit={handleSearch} className="flex items-center">
                  <div className="relative">
                    <Input
                      type="search"
                      placeholder="Buscar productos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => {
                        if (suggestions.length > 0) setShowSuggestions(true);
                      }}
                      className="w-64 pr-10"
                    />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                    >
                      {isSearching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      <span className="sr-only">Buscar</span>
                    </Button>
                  </div>
                </form>
                {showSuggestions && <SuggestionsDropdown />}
              </div>

              {/* Search - Mobile toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSearchOpen(!searchOpen)}
              >
                {searchOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
                <span className="sr-only">Buscar</span>
              </Button>

              {/* Cart */}
              <Link href="/carrito">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent-orange text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                  <span className="sr-only">Carrito</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile search bar */}
          {searchOpen && (
            <div ref={mobileSearchRef} className="mt-4 md:hidden relative">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Input
                    type="search"
                    placeholder="Buscar productos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    className="w-full pr-10"
                    autoFocus
                  />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0"
                  >
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    <span className="sr-only">Buscar</span>
                  </Button>
                </div>
              </form>
              {showSuggestions && <SuggestionsDropdown />}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
