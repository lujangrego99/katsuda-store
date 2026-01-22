import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const router: RouterType = Router();
const prisma = new PrismaClient();

// Mapeo de rangos de códigos postales a provincias/zonas
const postalCodeRanges: { min: number; max: number; province: string; zone: string }[] = [
  // Mendoza
  { min: 5500, max: 5599, province: 'Mendoza', zone: 'Gran Mendoza' },
  { min: 5600, max: 5699, province: 'Mendoza', zone: 'Interior Mendoza' },
  // San Juan
  { min: 5400, max: 5449, province: 'San Juan', zone: 'San Juan Capital' },
  { min: 5450, max: 5499, province: 'San Juan', zone: 'Interior San Juan' },
];

// Helper: obtener zona por código postal
function getZoneFromPostalCode(postalCode: string): { province: string; zone: string } | null {
  const code = parseInt(postalCode, 10);
  if (isNaN(code)) return null;

  for (const range of postalCodeRanges) {
    if (code >= range.min && code <= range.max) {
      return { province: range.province, zone: range.zone };
    }
  }

  return null;
}

// GET /api/shipping/zones - Listar zonas de envío
router.get('/zones', async (_req: Request, res: Response) => {
  try {
    const zones = await prisma.shippingZone.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    res.json({ data: zones });
  } catch (error) {
    console.error('Error fetching shipping zones:', error);
    res.status(500).json({ error: 'Error al obtener zonas de envío' });
  }
});

// POST /api/shipping/calculate - Calcular envío por código postal
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    const { postalCode, cartTotal } = req.body;

    if (!postalCode) {
      return res.status(400).json({ error: 'Código postal requerido' });
    }

    // Detectar zona por código postal
    const zoneInfo = getZoneFromPostalCode(postalCode);

    if (!zoneInfo) {
      return res.json({
        data: {
          available: false,
          message: 'No realizamos envíos a esta zona. Puede retirar en nuestras sucursales.',
          pickup: {
            available: true,
            price: 0,
            message: 'Retiro gratis en sucursal',
          },
        },
      });
    }

    // Buscar zona de envío en la base de datos
    const shippingZone = await prisma.shippingZone.findFirst({
      where: {
        name: { contains: zoneInfo.zone, mode: 'insensitive' },
        isActive: true,
      },
    });

    if (!shippingZone) {
      return res.json({
        data: {
          available: false,
          province: zoneInfo.province,
          zone: zoneInfo.zone,
          message: 'No realizamos envíos a esta zona actualmente.',
          pickup: {
            available: true,
            price: 0,
            message: 'Retiro gratis en sucursal',
          },
        },
      });
    }

    // Calcular si aplica envío gratis
    const cartTotalDecimal = cartTotal ? new Prisma.Decimal(cartTotal) : null;
    let shippingPrice = shippingZone.price;
    let freeShipping = false;

    if (shippingZone.minFree && cartTotalDecimal && cartTotalDecimal.gte(shippingZone.minFree)) {
      shippingPrice = new Prisma.Decimal(0);
      freeShipping = true;
    }

    res.json({
      data: {
        available: true,
        province: zoneInfo.province,
        zone: zoneInfo.zone,
        delivery: {
          available: true,
          price: shippingPrice,
          freeShipping,
          freeShippingMin: shippingZone.minFree,
          estimatedDays: zoneInfo.zone.includes('Capital') || zoneInfo.zone.includes('Gran') ? '1-2' : '3-5',
          message: freeShipping
            ? '¡Envío gratis!'
            : `Envío a ${zoneInfo.zone}: $${Number(shippingPrice).toLocaleString('es-AR')}`,
        },
        pickup: {
          available: true,
          price: 0,
          message: 'Retiro gratis en sucursal',
          locations: zoneInfo.province === 'Mendoza'
            ? ['Sucursal Mendoza - Av. Las Heras 343']
            : ['Sucursal San Juan - Av. Rawson 123 Sur'],
        },
      },
    });
  } catch (error) {
    console.error('Error calculating shipping:', error);
    res.status(500).json({ error: 'Error al calcular envío' });
  }
});

export default router;
