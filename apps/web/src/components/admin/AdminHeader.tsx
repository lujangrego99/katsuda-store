'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  Menu,
  LogOut,
  User,
  LayoutDashboard,
  Package,
  FolderTree,
  Tags,
  ShoppingCart,
  MessageSquare,
  Settings,
  Store,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Productos', href: '/admin/productos', icon: Package },
  { name: 'Categorías', href: '/admin/categorias', icon: FolderTree },
  { name: 'Marcas', href: '/admin/marcas', icon: Tags },
  { name: 'Pedidos', href: '/admin/pedidos', icon: ShoppingCart },
  { name: 'Mensajes', href: '/admin/mensajes', icon: MessageSquare },
  { name: 'Configuración', href: '/admin/configuracion', icon: Settings },
];

export function AdminHeader() {
  const { admin, logout, loading } = useAdminAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-white px-6">
        <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-white px-6">
      {/* Mobile menu button */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-katsuda-900">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 px-6 border-b border-katsuda-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-katsuda-900 font-bold text-xl">
              K
            </div>
            <div className="text-white">
              <div className="font-semibold">Katsuda</div>
              <div className="text-xs text-katsuda-300">Panel Admin</div>
            </div>
          </div>

          {/* Mobile navigation */}
          <nav className="flex flex-col gap-1 p-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/admin' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-katsuda-800 text-white'
                      : 'text-katsuda-200 hover:bg-katsuda-800/50 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}

            <div className="border-t border-katsuda-800 mt-4 pt-4">
              <Link
                href="/"
                target="_blank"
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-katsuda-200 hover:bg-katsuda-800/50 hover:text-white transition-colors"
              >
                <Store className="h-5 w-5" />
                Ver tienda
              </Link>
            </div>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Page title - could be dynamic */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-gray-900 hidden lg:block">
          {navigation.find(item =>
            pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href))
          )?.name || 'Dashboard'}
        </h1>
      </div>

      {/* User menu */}
      {admin && (
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-katsuda-100 text-katsuda-900">
              <User className="h-4 w-4" />
            </div>
            <div>
              <div className="font-medium">{admin.name}</div>
              <div className="text-xs text-gray-500">{admin.role}</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-gray-500 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Salir</span>
          </Button>
        </div>
      )}
    </header>
  );
}
