import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Clock, Mail, Facebook, Instagram } from 'lucide-react';

const sucursales = [
  {
    ciudad: 'Mendoza',
    direccion: 'Av. San Martín 1234',
    telefono: '(261) 425-1234',
    horario: 'Lun a Vie 8:30 a 13:00 y 17:00 a 20:30 - Sáb 9:00 a 13:00',
  },
  {
    ciudad: 'San Juan',
    direccion: 'Calle Mitre 567',
    telefono: '(264) 421-5678',
    horario: 'Lun a Vie 8:30 a 13:00 y 17:00 a 20:30 - Sáb 9:00 a 13:00',
  },
];

const linksUtiles = [
  { name: 'Griferías', href: '/categoria/griferias' },
  { name: 'Sanitarios', href: '/categoria/sanitarios' },
  { name: 'Termotanques', href: '/categoria/termotanques' },
  { name: 'Bombas', href: '/categoria/bombas' },
  { name: 'Contacto', href: '/contacto' },
];

const marcas = ['FV', 'Piazza', 'Ferrum', 'Roca', 'Aqua', 'DECA'];

export function Footer() {
  return (
    <footer className="bg-katsuda-900 text-white">
      {/* Main footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo y descripción */}
          <div>
            <div className="mb-4">
              <span className="text-2xl font-bold">KATSUDA</span>
              <p className="text-katsuda-200 text-sm mt-1">
                Distribuidores de primeras marcas
              </p>
            </div>
            <p className="text-katsuda-100 text-sm leading-relaxed">
              Más de 40 años brindando calidad en grifería, sanitarios y
              productos para el hogar en Mendoza y San Juan.
            </p>
            {/* Redes sociales */}
            <div className="flex gap-4 mt-6">
              <a
                href="https://facebook.com/katsuda"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-katsuda-800 hover:bg-katsuda-700 p-2 rounded-full transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com/katsuda"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-katsuda-800 hover:bg-katsuda-700 p-2 rounded-full transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Sucursales */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Nuestras Sucursales</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {sucursales.map((sucursal) => (
                <div key={sucursal.ciudad} className="text-sm">
                  <h4 className="font-semibold text-katsuda-300 mb-2">
                    {sucursal.ciudad}
                  </h4>
                  <div className="space-y-2 text-katsuda-100">
                    <p className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{sucursal.direccion}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <a
                        href={`tel:${sucursal.telefono.replace(/\D/g, '')}`}
                        className="hover:text-white transition-colors"
                      >
                        {sucursal.telefono}
                      </a>
                    </p>
                    <p className="flex items-start gap-2">
                      <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{sucursal.horario}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Links útiles */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Links Útiles</h3>
            <nav className="space-y-2">
              {linksUtiles.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-katsuda-100 hover:text-white transition-colors text-sm"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
            <h4 className="font-semibold mt-6 mb-2">Marcas que trabajamos</h4>
            <p className="text-katsuda-100 text-sm">{marcas.join(' • ')}</p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-katsuda-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-katsuda-200">
            <p>&copy; {new Date().getFullYear()} Katsuda. Todos los derechos reservados.</p>
            <div className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              <a
                href="mailto:info@katsuda.com.ar"
                className="hover:text-white transition-colors"
              >
                info@katsuda.com.ar
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
