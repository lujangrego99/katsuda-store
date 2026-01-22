import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';

const router: RouterType = Router();
const prisma = new PrismaClient();

// Todas las rutas requieren autenticación admin
router.use(authMiddleware);

// GET /api/admin/shipping/zones - Listar todas las zonas de envío
router.get('/zones', async (req: Request, res: Response) => {
  try {
    const { search, province, isActive } = req.query;

    const where: {
      name?: { contains: string; mode: 'insensitive' };
      province?: string;
      isActive?: boolean;
    } = {};

    if (search) {
      where.name = { contains: search as string, mode: 'insensitive' };
    }
    if (province) {
      where.province = province as string;
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const zones = await prisma.shippingZone.findMany({
      where,
      orderBy: [{ province: 'asc' }, { name: 'asc' }],
    });

    res.json({ data: zones });
  } catch (error) {
    console.error('Error fetching shipping zones:', error);
    res.status(500).json({ error: 'Error al obtener zonas de envío' });
  }
});

// GET /api/admin/shipping/zones/:id - Obtener zona por ID
router.get('/zones/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const zone = await prisma.shippingZone.findUnique({
      where: { id },
    });

    if (!zone) {
      return res.status(404).json({ error: 'Zona no encontrada' });
    }

    res.json({ data: zone });
  } catch (error) {
    console.error('Error fetching shipping zone:', error);
    res.status(500).json({ error: 'Error al obtener zona de envío' });
  }
});

// POST /api/admin/shipping/zones - Crear zona de envío
router.post('/zones', async (req: Request, res: Response) => {
  try {
    const { name, province, cities, price, minFree, isActive } = req.body;

    if (!name || !province || price === undefined) {
      return res.status(400).json({ error: 'Nombre, provincia y precio son requeridos' });
    }

    const zone = await prisma.shippingZone.create({
      data: {
        name,
        province,
        cities: cities || [],
        price,
        minFree: minFree || null,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res.status(201).json({ data: zone, message: 'Zona creada exitosamente' });
  } catch (error) {
    console.error('Error creating shipping zone:', error);
    res.status(500).json({ error: 'Error al crear zona de envío' });
  }
});

// PATCH /api/admin/shipping/zones/:id - Actualizar zona de envío
router.patch('/zones/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, province, cities, price, minFree, isActive } = req.body;

    const existingZone = await prisma.shippingZone.findUnique({
      where: { id },
    });

    if (!existingZone) {
      return res.status(404).json({ error: 'Zona no encontrada' });
    }

    const zone = await prisma.shippingZone.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(province && { province }),
        ...(cities !== undefined && { cities }),
        ...(price !== undefined && { price }),
        ...(minFree !== undefined && { minFree: minFree || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({ data: zone, message: 'Zona actualizada exitosamente' });
  } catch (error) {
    console.error('Error updating shipping zone:', error);
    res.status(500).json({ error: 'Error al actualizar zona de envío' });
  }
});

// DELETE /api/admin/shipping/zones/:id - Eliminar zona de envío
router.delete('/zones/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingZone = await prisma.shippingZone.findUnique({
      where: { id },
    });

    if (!existingZone) {
      return res.status(404).json({ error: 'Zona no encontrada' });
    }

    await prisma.shippingZone.delete({
      where: { id },
    });

    res.json({ message: 'Zona eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting shipping zone:', error);
    res.status(500).json({ error: 'Error al eliminar zona de envío' });
  }
});

// PATCH /api/admin/shipping/zones/:id/toggle - Activar/desactivar zona
router.patch('/zones/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existingZone = await prisma.shippingZone.findUnique({
      where: { id },
    });

    if (!existingZone) {
      return res.status(404).json({ error: 'Zona no encontrada' });
    }

    const zone = await prisma.shippingZone.update({
      where: { id },
      data: { isActive: !existingZone.isActive },
    });

    res.json({ data: zone, message: `Zona ${zone.isActive ? 'activada' : 'desactivada'} exitosamente` });
  } catch (error) {
    console.error('Error toggling shipping zone:', error);
    res.status(500).json({ error: 'Error al cambiar estado de zona' });
  }
});

export default router;
