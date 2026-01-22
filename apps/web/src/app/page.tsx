'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Truck,
  Award,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MessageCircle,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  productCount: number;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

interface ProductImage {
  url: string;
  alt: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  shortDesc: string | null;
  price: number;
  comparePrice: number | null;
  transferPrice: number | null;
  freeShipping: boolean;
  images: ProductImage[];
  brand: { name: string } | null;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/categories`).then((r) => r.json()),
      fetch(`${API_URL}/api/brands`).then((r) => r.json()),
      fetch(`${API_URL}/api/products/featured?limit=8`).then((r) => r.json()),
    ])
      .then(([catData, brandData, prodData]) => {
        setCategories(catData.data || []);
        setBrands(brandData.data || []);
        setFeaturedProducts(prodData.data || []);
      })
      .catch(console.error);
  }, []);

  const visibleProducts = 4;
  const maxIndex = Math.max(0, featuredProducts.length - visibleProducts);

  const handlePrev = () => {
    setCarouselIndex((i) => Math.max(0, i - 1));
  };

  const handleNext = () => {
    setCarouselIndex((i) => Math.min(maxIndex, i + 1));
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Simular envío (la API de contacto se implementará en otro sprint)
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSending(false);
    setSent(true);
    setContactForm({ name: '', email: '', message: '' });
    setTimeout(() => setSent(false), 5000);
  };

  return (
    <>
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-r from-katsuda-900 via-katsuda-800 to-katsuda-700 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h1 className="text-3xl md:text-5xl font-bold leading-tight">
                Grifería y Sanitarios de las{' '}
                <span className="text-katsuda-300">Mejores Marcas</span>
              </h1>
              <p className="text-lg md:text-xl text-katsuda-100">
                Más de 50 años equipando hogares en Mendoza y San Juan.
                Distribuidores oficiales de FV, Piazza, Ferrum, Roca y más.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" variant="orange" asChild>
                  <Link href="/productos">Ver Catálogo</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-katsuda-900"
                  asChild
                >
                  <Link href="/contacto">Contactanos</Link>
                </Button>
              </div>
              <div className="flex items-center gap-6 pt-4 text-sm text-katsuda-200">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  <span>Envíos a todo Cuyo</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  <span>Garantía oficial</span>
                </div>
              </div>
            </div>
            <div className="hidden md:block relative">
              <div className="aspect-square relative rounded-lg overflow-hidden shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600"
                  alt="Grifería de alta calidad"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-accent-orange text-white px-4 py-2 rounded-lg shadow-lg font-semibold">
                9% OFF Transferencia
              </div>
            </div>
          </div>
        </div>
        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
          >
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* Por qué elegirnos */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-katsuda-900 mb-12">
            ¿Por qué elegirnos?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-katsuda-100 rounded-full flex items-center justify-center">
                  <ShieldCheck className="h-8 w-8 text-katsuda-700" />
                </div>
                <h3 className="text-xl font-semibold text-katsuda-900 mb-2">
                  Confiabilidad
                </h3>
                <p className="text-gray-600">
                  Distribuidores oficiales de las mejores marcas del mercado.
                  Todos nuestros productos cuentan con garantía de fábrica.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-katsuda-100 rounded-full flex items-center justify-center">
                  <Truck className="h-8 w-8 text-katsuda-700" />
                </div>
                <h3 className="text-xl font-semibold text-katsuda-900 mb-2">
                  Efectividad
                </h3>
                <p className="text-gray-600">
                  Amplio stock disponible para entrega inmediata. Envíos a
                  Mendoza, San Juan y toda la región de Cuyo.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-katsuda-100 rounded-full flex items-center justify-center">
                  <Award className="h-8 w-8 text-katsuda-700" />
                </div>
                <h3 className="text-xl font-semibold text-katsuda-900 mb-2">
                  Trayectoria
                </h3>
                <p className="text-gray-600">
                  Más de 50 años de experiencia en el rubro nos respaldan.
                  Asesoramiento profesional para tu proyecto.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="py-16 bg-katsuda-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-katsuda-900 mb-4">
            Nuestras Categorías
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Encontrá todo lo que necesitás para tu baño, cocina y hogar
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categoria/${category.slug}`}
                className="group"
              >
                <Card className="overflow-hidden border-0 shadow hover:shadow-lg transition-all group-hover:-translate-y-1">
                  <div className="aspect-square relative bg-gray-100">
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-katsuda-100">
                        <span className="text-4xl text-katsuda-300">
                          {category.name[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 text-center">
                    <h3 className="font-semibold text-katsuda-900 group-hover:text-katsuda-700">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {category.productCount || 0} productos
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Productos destacados */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-katsuda-900">
                Productos Destacados
              </h2>
              <p className="text-gray-600 mt-1">
                Las mejores ofertas del momento
              </p>
            </div>
            <div className="hidden md:flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrev}
                disabled={carouselIndex === 0}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                disabled={carouselIndex >= maxIndex}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="overflow-hidden">
            <div
              className="flex gap-4 transition-transform duration-300"
              style={{
                transform: `translateX(-${carouselIndex * (100 / visibleProducts + 1)}%)`,
              }}
            >
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/productos/${product.slug}`}
                  className="flex-none w-full sm:w-1/2 lg:w-1/4"
                >
                  <Card className="h-full border hover:shadow-lg transition-shadow group">
                    <div className="aspect-square relative bg-gray-50 overflow-hidden">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.images[0].alt || product.name}
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
                        {product.comparePrice && (
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
                    </div>
                    <CardContent className="p-4">
                      {product.brand && (
                        <p className="text-xs text-katsuda-600 font-medium mb-1">
                          {product.brand.name}
                        </p>
                      )}
                      <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-katsuda-700">
                        {product.name}
                      </h3>
                      <div className="space-y-1">
                        {product.comparePrice && (
                          <p className="text-sm text-gray-400 line-through">
                            {formatPrice(product.comparePrice)}
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
              ))}
            </div>
          </div>

          {/* Mobile carousel controls */}
          <div className="flex justify-center gap-2 mt-6 md:hidden">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrev}
              disabled={carouselIndex === 0}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={carouselIndex >= maxIndex}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="text-center mt-8">
            <Button size="lg" asChild>
              <Link href="/productos">Ver todos los productos</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Marcas */}
      <section className="py-16 bg-katsuda-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-katsuda-900 mb-4">
            Marcas que Trabajamos
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Distribuidores oficiales de las mejores marcas de grifería y
            sanitarios
          </p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-6 items-center">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/productos?marca=${brand.slug}`}
                className="group"
              >
                <div className="bg-white rounded-lg p-4 h-20 flex items-center justify-center shadow hover:shadow-md transition-shadow group-hover:bg-katsuda-100">
                  {brand.logo ? (
                    <Image
                      src={brand.logo}
                      alt={brand.name}
                      width={100}
                      height={50}
                      className="max-h-12 w-auto object-contain grayscale group-hover:grayscale-0 transition-all"
                    />
                  ) : (
                    <span className="text-xl font-bold text-gray-600 group-hover:text-katsuda-700">
                      {brand.name}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Formulario de contacto rápido */}
      <section className="py-16 bg-katsuda-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                ¿Tenés alguna consulta?
              </h2>
              <p className="text-katsuda-200 mb-8">
                Dejanos tu mensaje y te respondemos a la brevedad. También podés
                contactarnos directamente por teléfono o WhatsApp.
              </p>
              <div className="space-y-4">
                <a
                  href="tel:+542614292473"
                  className="flex items-center gap-3 text-katsuda-100 hover:text-white transition-colors"
                >
                  <Phone className="h-5 w-5" />
                  <span>261 429-2473</span>
                </a>
                <a
                  href="mailto:info@katsuda.com.ar"
                  className="flex items-center gap-3 text-katsuda-100 hover:text-white transition-colors"
                >
                  <Mail className="h-5 w-5" />
                  <span>info@katsuda.com.ar</span>
                </a>
                <a
                  href="https://wa.me/5492614292473?text=Hola!%20Quiero%20hacer%20una%20consulta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-katsuda-100 hover:text-white transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
            <div>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Tu nombre"
                    value={contactForm.name}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, name: e.target.value })
                    }
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
                <div>
                  <Input
                    type="email"
                    placeholder="Tu email"
                    value={contactForm.email}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, email: e.target.value })
                    }
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
                <div>
                  <textarea
                    placeholder="Tu mensaje"
                    value={contactForm.message}
                    onChange={(e) =>
                      setContactForm({
                        ...contactForm,
                        message: e.target.value,
                      })
                    }
                    required
                    rows={4}
                    className="w-full rounded-md bg-white/10 border border-white/20 text-white placeholder:text-white/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <Button
                  type="submit"
                  variant="orange"
                  size="lg"
                  className="w-full"
                  disabled={sending}
                >
                  {sending ? (
                    'Enviando...'
                  ) : sent ? (
                    '¡Mensaje enviado!'
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar mensaje
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
