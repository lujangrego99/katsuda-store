'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Eye,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Package,
  User,
  MapPin,
  CreditCard,
  Clock,
  Check,
  X,
  Truck,
  Calendar,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Tipos de estado del pedido
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
}

interface Address {
  street: string;
  number: string;
  floor: string | null;
  apartment: string | null;
  city: string;
  province: string;
  postalCode: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: string;
  total: string;
  product: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    images: Array<{ url: string; alt: string | null }>;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: string | null;
  paymentStatus: PaymentStatus;
  subtotal: string;
  shipping: string;
  discount: string;
  total: string;
  guestEmail: string | null;
  guestName: string | null;
  guestPhone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer: Customer | null;
  address: Address | null;
  _count?: { items: number };
  items?: OrderItem[];
}

interface OrdersResponse {
  data: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Mapeo de estados a estilos
const statusConfig: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline' }> = {
  PENDING: { label: 'Pendiente', variant: 'warning' },
  CONFIRMED: { label: 'Confirmado', variant: 'default' },
  PROCESSING: { label: 'Procesando', variant: 'secondary' },
  SHIPPED: { label: 'Enviado', variant: 'success' },
  DELIVERED: { label: 'Entregado', variant: 'success' },
  CANCELLED: { label: 'Cancelado', variant: 'destructive' },
};

const paymentStatusConfig: Record<PaymentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline' }> = {
  PENDING: { label: 'Pendiente', variant: 'warning' },
  PAID: { label: 'Pagado', variant: 'success' },
  FAILED: { label: 'Fallido', variant: 'destructive' },
  REFUNDED: { label: 'Reembolsado', variant: 'outline' },
};

const paymentMethodLabels: Record<string, string> = {
  transfer: 'Transferencia',
  cash: 'Efectivo',
  mercadopago: 'MercadoPago',
};

// Transiciones de estado permitidas
const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

function formatPrice(price: number | string): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(typeof price === 'string' ? parseFloat(price) : price);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function AdminOrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, loading: authLoading, isAuthenticated } = useAdminAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState(searchParams.get('paymentStatus') || '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const pageSize = 10;

  // Modal de detalle
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetail, setOrderDetail] = useState<Order | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');

  const fetchOrders = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('pageSize', pageSize.toString());
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (paymentStatusFilter) params.set('paymentStatus', paymentStatusFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const response = await fetch(`${API_URL}/api/admin/orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar pedidos');
      }

      const result: OrdersResponse = await response.json();
      setOrders(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [token, page, search, statusFilter, paymentStatusFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, fetchOrders]);

  // Actualizar URL con filtros
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (paymentStatusFilter) params.set('paymentStatus', paymentStatusFilter);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (page > 1) params.set('page', page.toString());

    const query = params.toString();
    router.replace(`/admin/pedidos${query ? `?${query}` : ''}`, { scroll: false });
  }, [search, statusFilter, paymentStatusFilter, dateFrom, dateTo, page, router]);

  const fetchOrderDetail = async (orderId: string) => {
    if (!token) return;

    setLoadingDetail(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar detalle');
      }

      const result = await response.json();
      setOrderDetail(result.data);
      setNotesValue(result.data.notes || '');
    } catch (err) {
      console.error('Error fetching order detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    fetchOrderDetail(order.id);
  };

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!token || !orderDetail) return;

    setUpdatingStatus(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/orders/${orderDetail.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al actualizar estado');
      }

      const result = await response.json();
      setOrderDetail(result.data);

      // Actualizar en la lista
      setOrders(prev => prev.map(o =>
        o.id === orderDetail.id ? { ...o, status: newStatus } : o
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePaymentStatusChange = async (newPaymentStatus: PaymentStatus) => {
    if (!token || !orderDetail) return;

    setUpdatingStatus(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/orders/${orderDetail.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentStatus: newPaymentStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al actualizar pago');
      }

      const result = await response.json();
      setOrderDetail(result.data);

      // Actualizar en la lista
      setOrders(prev => prev.map(o =>
        o.id === orderDetail.id ? { ...o, paymentStatus: newPaymentStatus } : o
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!token || !orderDetail) return;

    setUpdatingStatus(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/orders/${orderDetail.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: notesValue }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar notas');
      }

      const result = await response.json();
      setOrderDetail(result.data);
      setEditingNotes(false);

      // Actualizar en la lista
      setOrders(prev => prev.map(o =>
        o.id === orderDetail.id ? { ...o, notes: notesValue } : o
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const getCustomerName = (order: Order): string => {
    if (order.customer) {
      return `${order.customer.firstName} ${order.customer.lastName}`;
    }
    return order.guestName || 'Sin nombre';
  };

  const getCustomerEmail = (order: Order): string => {
    return order.customer?.email || order.guestEmail || 'Sin email';
  };

  const getCustomerPhone = (order: Order): string => {
    return order.customer?.phone || order.guestPhone || '-';
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-katsuda-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <p className="text-gray-500">{total} pedidos en total</p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por N de pedido, email, nombre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los estados</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={paymentStatusFilter} onValueChange={(v) => { setPaymentStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Estado de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {Object.entries(paymentStatusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                  className="w-40"
                  placeholder="Desde"
                />
                <span className="text-gray-400">-</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                  className="w-40"
                  placeholder="Hasta"
                />
              </div>
              <Button type="submit" variant="outline" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
              {(search || statusFilter || paymentStatusFilter || dateFrom || dateTo) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('');
                    setPaymentStatusFilter('');
                    setDateFrom('');
                    setDateTo('');
                    setPage(1);
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tabla de pedidos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center gap-2 p-4 mb-4 bg-red-50 text-red-700 rounded-lg">
              <AlertTriangle className="h-5 w-5" />
              {error}
              <Button variant="ghost" size="sm" onClick={() => setError('')} className="ml-auto">
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-katsuda-600" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron pedidos</p>
              {(search || statusFilter || paymentStatusFilter || dateFrom || dateTo) && (
                <Button
                  variant="link"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('');
                    setPaymentStatusFilter('');
                    setDateFrom('');
                    setDateTo('');
                    setPage(1);
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N Pedido</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-center">Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead className="text-center">Pago</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="w-20">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <span className="font-mono font-medium">{order.orderNumber}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{getCustomerName(order)}</span>
                            <span className="text-xs text-gray-500">{getCustomerEmail(order)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{order._count?.items || 0}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPrice(order.total)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={statusConfig[order.status].variant}>
                            {statusConfig[order.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={paymentStatusConfig[order.paymentStatus].variant}>
                            {paymentStatusConfig[order.paymentStatus].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500">
                            {formatDate(order.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewOrder(order)}
                            title="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginacion */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Mostrando {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} de {total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Pagina {page} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalle del pedido */}
      <Dialog open={!!selectedOrder} onOpenChange={() => { setSelectedOrder(null); setOrderDetail(null); setEditingNotes(false); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Pedido {selectedOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-katsuda-600" />
            </div>
          ) : orderDetail ? (
            <div className="space-y-6">
              {/* Estado y pago */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-500">Estado del Pedido</span>
                      <Badge variant={statusConfig[orderDetail.status].variant} className="text-sm">
                        {statusConfig[orderDetail.status].label}
                      </Badge>
                    </div>
                    {allowedTransitions[orderDetail.status].length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {allowedTransitions[orderDetail.status].map((nextStatus) => (
                          <Button
                            key={nextStatus}
                            variant={nextStatus === 'CANCELLED' ? 'destructive' : 'outline'}
                            size="sm"
                            onClick={() => handleStatusChange(nextStatus)}
                            disabled={updatingStatus}
                          >
                            {updatingStatus ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : nextStatus === 'CANCELLED' ? (
                              <X className="h-3 w-3 mr-1" />
                            ) : nextStatus === 'SHIPPED' ? (
                              <Truck className="h-3 w-3 mr-1" />
                            ) : (
                              <Check className="h-3 w-3 mr-1" />
                            )}
                            {statusConfig[nextStatus].label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-500">Estado del Pago</span>
                      <Badge variant={paymentStatusConfig[orderDetail.paymentStatus].variant} className="text-sm">
                        {paymentStatusConfig[orderDetail.paymentStatus].label}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      <CreditCard className="h-4 w-4 inline mr-1" />
                      {paymentMethodLabels[orderDetail.paymentMethod || ''] || orderDetail.paymentMethod || 'No especificado'}
                    </div>
                    {orderDetail.paymentStatus !== 'PAID' && orderDetail.paymentStatus !== 'REFUNDED' && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePaymentStatusChange('PAID')}
                          disabled={updatingStatus}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Marcar como pagado
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Cliente y direccion */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Datos del Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm">
                      <p><strong>Nombre:</strong> {getCustomerName(orderDetail)}</p>
                      <p><strong>Email:</strong> {getCustomerEmail(orderDetail)}</p>
                      <p><strong>Telefono:</strong> {getCustomerPhone(orderDetail)}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Direccion de Envio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {orderDetail.address ? (
                      <div className="text-sm">
                        <p>{orderDetail.address.street} {orderDetail.address.number}</p>
                        {orderDetail.address.floor && (
                          <p>Piso {orderDetail.address.floor}, Depto {orderDetail.address.apartment}</p>
                        )}
                        <p>{orderDetail.address.city}, {orderDetail.address.province}</p>
                        <p>CP: {orderDetail.address.postalCode}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Retiro en sucursal</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Productos */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Productos ({orderDetail.items?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orderDetail.items?.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="h-16 w-16 rounded bg-white overflow-hidden flex-shrink-0">
                          {item.product.images[0] ? (
                            <img
                              src={item.product.images[0].url}
                              alt={item.product.images[0].alt || item.product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.product.name}</p>
                          <p className="text-xs text-gray-500">SKU: {item.product.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">{item.quantity} x {formatPrice(item.price)}</p>
                          <p className="font-medium">{formatPrice(item.total)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Totales */}
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subtotal</span>
                      <span>{formatPrice(orderDetail.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Envio</span>
                      <span>{parseFloat(orderDetail.shipping) === 0 ? 'Gratis' : formatPrice(orderDetail.shipping)}</span>
                    </div>
                    {parseFloat(orderDetail.discount) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Descuento</span>
                        <span>-{formatPrice(orderDetail.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total</span>
                      <span>{formatPrice(orderDetail.total)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notas internas */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Notas Internas
                    </span>
                    {!editingNotes && (
                      <Button variant="ghost" size="sm" onClick={() => setEditingNotes(true)}>
                        Editar
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editingNotes ? (
                    <div className="space-y-2">
                      <Textarea
                        value={notesValue}
                        onChange={(e) => setNotesValue(e.target.value)}
                        placeholder="Agregar notas internas sobre este pedido..."
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveNotes}
                          disabled={updatingStatus}
                          className="bg-katsuda-600 hover:bg-katsuda-700"
                        >
                          {updatingStatus ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                          Guardar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setEditingNotes(false); setNotesValue(orderDetail.notes || ''); }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      {orderDetail.notes || 'Sin notas'}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Fechas */}
              <div className="text-xs text-gray-400 flex justify-between">
                <span>Creado: {formatDate(orderDetail.createdAt)}</span>
                <span>Actualizado: {formatDate(orderDetail.updatedAt)}</span>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-katsuda-600" />
      </div>
    }>
      <AdminOrdersContent />
    </Suspense>
  );
}
