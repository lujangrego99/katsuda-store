'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Search,
  Eye,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  MailOpen,
  Trash2,
  CheckCheck,
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Message {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  province: string | null;
  subject: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface MessagesResponse {
  data: Message[];
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function formatRelativeDate(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return formatDate(dateString);
}

export default function AdminMessagesPage() {
  const { token, loading: authLoading } = useAdminAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [isRead, setIsRead] = useState(searchParams.get('isRead') || 'all');
  const [page, setPage] = useState(
    parseInt(searchParams.get('page') || '1', 10)
  );

  // Detail modal
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('pageSize', '20');

      if (search) params.set('search', search);
      if (isRead && isRead !== 'all') params.set('isRead', isRead);

      const response = await fetch(
        `${API_URL}/api/admin/messages?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Error fetching messages');

      const data: MessagesResponse = await response.json();
      setMessages(data.data);
      setTotal(data.total);
      setUnreadCount(data.unreadCount);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [token, page, search, isRead]);

  useEffect(() => {
    if (!authLoading && token) {
      fetchMessages();
    }
  }, [authLoading, token, fetchMessages]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (isRead && isRead !== 'all') params.set('isRead', isRead);
    if (page > 1) params.set('page', page.toString());

    const newUrl = params.toString()
      ? `/admin/mensajes?${params.toString()}`
      : '/admin/mensajes';
    router.replace(newUrl, { scroll: false });
  }, [search, isRead, page, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleMarkAsRead = async (message: Message) => {
    if (!token) return;

    const endpoint = message.isRead ? 'unread' : 'read';

    try {
      const response = await fetch(
        `${API_URL}/api/admin/messages/${message.id}/${endpoint}`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Error updating message');

      // Update local state
      setMessages((prev) =>
        prev.map((m) =>
          m.id === message.id ? { ...m, isRead: !message.isRead } : m
        )
      );

      // Update unread count
      setUnreadCount((prev) => (message.isRead ? prev + 1 : prev - 1));

      // Update selected message if in detail view
      if (selectedMessage?.id === message.id) {
        setSelectedMessage({ ...selectedMessage, isRead: !message.isRead });
      }
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/messages/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Error marking all as read');

      // Update local state
      setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleViewDetail = async (message: Message) => {
    setSelectedMessage(message);
    setDetailOpen(true);

    // Mark as read when opening
    if (!message.isRead && token) {
      try {
        await fetch(`${API_URL}/api/admin/messages/${message.id}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        });

        // Update local state
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? { ...m, isRead: true } : m))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setSelectedMessage({ ...message, isRead: true });
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  const handleDeleteClick = (message: Message) => {
    setMessageToDelete(message);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!token || !messageToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `${API_URL}/api/admin/messages/${messageToDelete.id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Error deleting message');

      // Update local state
      setMessages((prev) => prev.filter((m) => m.id !== messageToDelete.id));
      setTotal((prev) => prev - 1);
      if (!messageToDelete.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      setDeleteConfirmOpen(false);
      setMessageToDelete(null);

      // Close detail modal if open
      if (selectedMessage?.id === messageToDelete.id) {
        setDetailOpen(false);
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-katsuda-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mensajes</h1>
          <p className="text-gray-500">
            Gestiona los mensajes de contacto recibidos
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            Marcar todos como leídos
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total mensajes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Sin leer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-orange-600">
                {unreadCount}
              </div>
              {unreadCount > 0 && (
                <Badge variant="warning" className="text-xs">
                  Pendientes
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Leídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {total - unreadCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form
            onSubmit={handleSearch}
            className="flex flex-col md:flex-row gap-4"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, email, asunto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={isRead} onValueChange={setIsRead}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="false">Sin leer</SelectItem>
                <SelectItem value="true">Leídos</SelectItem>
              </SelectContent>
            </Select>

            <Button type="submit" className="bg-katsuda-700 hover:bg-katsuda-800">
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Messages Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-katsuda-700" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay mensajes
              </h3>
              <p className="text-gray-500">
                {search || isRead !== 'all'
                  ? 'No se encontraron mensajes con los filtros aplicados'
                  : 'Todavía no has recibido mensajes de contacto'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Remitente</TableHead>
                  <TableHead>Asunto / Mensaje</TableHead>
                  <TableHead>Provincia</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((message) => (
                  <TableRow
                    key={message.id}
                    className={!message.isRead ? 'bg-blue-50/50' : ''}
                  >
                    <TableCell>
                      {message.isRead ? (
                        <MailOpen className="w-5 h-5 text-gray-400" />
                      ) : (
                        <Mail className="w-5 h-5 text-blue-600" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div
                          className={`font-medium ${!message.isRead ? 'text-gray-900' : 'text-gray-700'}`}
                        >
                          {message.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {message.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {message.subject && (
                        <div
                          className={`font-medium truncate ${!message.isRead ? 'text-gray-900' : 'text-gray-700'}`}
                        >
                          {message.subject}
                        </div>
                      )}
                      <div className="text-sm text-gray-500 truncate">
                        {message.message}
                      </div>
                    </TableCell>
                    <TableCell>
                      {message.province ? (
                        <Badge variant="outline" className="capitalize">
                          {message.province.replace('_', ' ')}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-gray-500">
                      {formatRelativeDate(message.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(message)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(message)}
                          className="text-gray-600 hover:text-gray-900"
                          title={
                            message.isRead
                              ? 'Marcar como no leído'
                              : 'Marcar como leído'
                          }
                        >
                          {message.isRead ? (
                            <Mail className="w-4 h-4" />
                          ) : (
                            <MailOpen className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(message)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando {(page - 1) * 20 + 1} -{' '}
            {Math.min(page * 20, total)} de {total} mensajes
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-700">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del mensaje</DialogTitle>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-6">
              {/* Sender Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <User className="w-4 h-4" />
                    Nombre
                  </div>
                  <p className="font-medium">{selectedMessage.name}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Mail className="w-4 h-4" />
                    Email
                  </div>
                  <a
                    href={`mailto:${selectedMessage.email}`}
                    className="font-medium text-katsuda-700 hover:underline"
                  >
                    {selectedMessage.email}
                  </a>
                </div>

                {selectedMessage.phone && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Phone className="w-4 h-4" />
                      Teléfono
                    </div>
                    <a
                      href={`tel:${selectedMessage.phone}`}
                      className="font-medium text-katsuda-700 hover:underline"
                    >
                      {selectedMessage.phone}
                    </a>
                  </div>
                )}

                {selectedMessage.province && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      Provincia
                    </div>
                    <p className="font-medium capitalize">
                      {selectedMessage.province.replace('_', ' ')}
                    </p>
                  </div>
                )}
              </div>

              {/* Subject */}
              {selectedMessage.subject && (
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">Asunto</div>
                  <p className="font-medium">{selectedMessage.subject}</p>
                </div>
              )}

              {/* Message */}
              <div className="space-y-1">
                <div className="text-sm text-gray-500">Mensaje</div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                Recibido el {formatDate(selectedMessage.createdAt)}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleMarkAsRead(selectedMessage)}
                  >
                    {selectedMessage.isRead ? (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Marcar como no leído
                      </>
                    ) : (
                      <>
                        <MailOpen className="w-4 h-4 mr-2" />
                        Marcar como leído
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleDeleteClick(selectedMessage);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                  <a
                    href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject || 'Contacto Katsuda'}`}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-katsuda-700 text-white hover:bg-katsuda-800 h-10 px-4 py-2"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Responder
                  </a>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar mensaje</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este mensaje? Esta acción no
              se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          {messageToDelete && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium">{messageToDelete.name}</p>
              <p className="text-sm text-gray-500">{messageToDelete.email}</p>
              {messageToDelete.subject && (
                <p className="text-sm mt-2">{messageToDelete.subject}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
