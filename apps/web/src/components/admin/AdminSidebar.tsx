'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
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

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 bg-katsuda-900 lg:block">
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

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
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
      </nav>

      {/* Footer - Link to store */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-katsuda-800">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-katsuda-200 hover:bg-katsuda-800/50 hover:text-white transition-colors"
        >
          <Store className="h-5 w-5" />
          Ver tienda
        </Link>
      </div>
    </aside>
  );
}
