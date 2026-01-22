'use client';

import { useEffect, useState } from 'react';
import {
  Truck,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  MapPin,
  DollarSign,
  Gift,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAdminAuth } from '@/context/AdminAuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ShippingZone {
  id: string;
  name: string;
  province: string;
  cities: string[];
  price: number;
  minFree: number | null;
  isActive: boolean;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function AdminShippingPage() {
  const { token } = useAdminAuth();
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [provinceFilter, setProvinceFilter] = useState<string>('all');

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    province: 'Mendoza',
    cities: '',
    price: '',
    minFree: '',
    isActive: true,
  });

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<ShippingZone | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchZones = async () => {
    try {
      const params = new URLSearchParams();
      if (provinceFilter && provinceFilter !== 'all') {
        params.append('province', provinceFilter);
      }

      const response = await fetch(`${API_URL}/api/admin/shipping/zones?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setZones(data.data || []);
    } catch (error) {
      console.error('Error fetching zones:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchZones();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, provinceFilter]);

  const openCreateDialog = () => {
    setEditingZone(null);
    setFormData({
      name: '',
      province: 'Mendoza',
      cities: '',
      price: '',
      minFree: '',
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (zone: ShippingZone) => {
    setEditingZone(zone);
    setFormData({
      name: zone.name,
      province: zone.province,
      cities: zone.cities.join(', '),
      price: String(zone.price),
      minFree: zone.minFree ? String(zone.minFree) : '',
      isActive: zone.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.province || !formData.price) {
      return;
    }

    setSaving(true);

    try {
      const body = {
        name: formData.name,
        province: formData.province,
        cities: formData.cities
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
        price: parseFloat(formData.price),
        minFree: formData.minFree ? parseFloat(formData.minFree) : null,
        isActive: formData.isActive,
      };

      const url = editingZone
        ? `${API_URL}/api/admin/shipping/zones/${editingZone.id}`
        : `${API_URL}/api/admin/shipping/zones`;

      const response = await fetch(url, {
        method: editingZone ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        fetchZones();
      }
    } catch (error) {
      console.error('Error saving zone:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (zone: ShippingZone) => {
    try {
      await fetch(`${API_URL}/api/admin/shipping/zones/${zone.id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchZones();
    } catch (error) {
      console.error('Error toggling zone:', error);
    }
  };

  const handleDelete = async () => {
    if (!zoneToDelete) return;

    setDeleting(true);
    try {
      await fetch(`${API_URL}/api/admin/shipping/zones/${zoneToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteDialogOpen(false);
      setZoneToDelete(null);
      fetchZones();
    } catch (error) {
      console.error('Error deleting zone:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-katsuda-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="h-7 w-7" />
            Zonas de Envio
          </h1>
          <p className="text-gray-500 mt-1">
            Configura las zonas de envio y sus precios
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Zona
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={provinceFilter} onValueChange={setProvinceFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por provincia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las provincias</SelectItem>
            <SelectItem value="Mendoza">Mendoza</SelectItem>
            <SelectItem value="San Juan">San Juan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zona</TableHead>
              <TableHead>Provincia</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Envio Gratis desde</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No hay zonas de envio configuradas
                </TableCell>
              </TableRow>
            ) : (
              zones.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">{zone.name}</div>
                        {zone.cities.length > 0 && (
                          <div className="text-xs text-gray-500">
                            {zone.cities.slice(0, 3).join(', ')}
                            {zone.cities.length > 3 && ` +${zone.cities.length - 3} mas`}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{zone.province}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      {formatPrice(zone.price)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {zone.minFree ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <Gift className="h-4 w-4" />
                        {formatPrice(zone.minFree)}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={zone.isActive}
                      onCheckedChange={() => handleToggle(zone)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(zone)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setZoneToDelete(zone);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingZone ? 'Editar Zona de Envio' : 'Nueva Zona de Envio'}
            </DialogTitle>
            <DialogDescription>
              {editingZone
                ? 'Modifica los datos de la zona de envio'
                : 'Configura una nueva zona de envio'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la zona *</Label>
              <Input
                id="name"
                placeholder="Ej: Gran Mendoza"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="province">Provincia *</Label>
              <Select
                value={formData.province}
                onValueChange={(v) => setFormData({ ...formData, province: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mendoza">Mendoza</SelectItem>
                  <SelectItem value="San Juan">San Juan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cities">Ciudades/Localidades</Label>
              <Input
                id="cities"
                placeholder="Separadas por coma: Ciudad, Godoy Cruz, Las Heras"
                value={formData.cities}
                onChange={(e) => setFormData({ ...formData, cities: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                Lista de ciudades cubiertas por esta zona
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Precio de envio *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="4500"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minFree">Minimo para envio gratis</Label>
                <Input
                  id="minFree"
                  type="number"
                  placeholder="150000"
                  value={formData.minFree}
                  onChange={(e) => setFormData({ ...formData, minFree: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
              <Label htmlFor="isActive">Zona activa</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : editingZone ? (
                'Guardar cambios'
              ) : (
                'Crear zona'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar zona de envio</DialogTitle>
            <DialogDescription>
              Estas seguro de que quieres eliminar la zona {zoneToDelete?.name}?
              Esta accion no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
