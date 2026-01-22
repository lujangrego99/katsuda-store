import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const router: RouterType = Router();
const prisma = new PrismaClient();

// Mapeo de rangos de códigos postales a provincias/zonas
const postalCodeRanges: { min: number; max: number; province: string; zone: string }[] = [
  // Mendoza - Gran Mendoza (Capital, Godoy Cruz, Guaymallén, Las Heras, Maipú)
  { min: 5500, max: 5509, province: 'Mendoza', zone: 'Gran Mendoza' },
  { min: 5510, max: 5519, province: 'Mendoza', zone: 'Gran Mendoza' },
  { min: 5520, max: 5529, province: 'Mendoza', zone: 'Gran Mendoza' },
  { min: 5530, max: 5539, province: 'Mendoza', zone: 'Gran Mendoza' },
  { min: 5540, max: 5549, province: 'Mendoza', zone: 'Gran Mendoza' },
  // Mendoza - Interior
  { min: 5550, max: 5599, province: 'Mendoza', zone: 'Interior Mendoza' },
  { min: 5600, max: 5699, province: 'Mendoza', zone: 'Interior Mendoza' },
  // San Juan - Capital
  { min: 5400, max: 5413, province: 'San Juan', zone: 'San Juan Capital' },
  // San Juan - Interior
  { min: 5414, max: 5499, province: 'San Juan', zone: 'Interior San Juan' },
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
    const { postalCode, cartTotal, productPrice } = req.body;

    if (!postalCode) {
      return res.status(400).json({ error: 'Código postal requerido' });
    }

    // Usar cartTotal si viene, sino productPrice (para calcular desde producto individual)
    const totalToCheck = cartTotal || productPrice || 0;

    // Detectar zona por código postal
    const zoneInfo = getZoneFromPostalCode(postalCode);

    // Obtener sucursales de Settings
    const settings = await prisma.settings.findUnique({
      where: { id: 'singleton' },
    });

    const mendozaAddress = settings?.address && typeof settings.address === 'object'
      ? (settings.address as Record<string, { address?: string }>)?.mendoza?.address || 'Av. Las Heras 343, Ciudad'
      : 'Av. Las Heras 343, Ciudad';

    const sanJuanAddress = settings?.address && typeof settings.address === 'object'
      ? (settings.address as Record<string, { address?: string }>)?.sanJuan?.address || 'Av. Rawson 123 Sur'
      : 'Av. Rawson 123 Sur';

    if (!zoneInfo) {
      return res.json({
        data: {
          available: false,
          message: 'No realizamos envíos a esta zona. Puede retirar en nuestras sucursales.',
          pickup: {
            available: true,
            price: 0,
            message: 'Retiro gratis en sucursal',
            locations: [
              `Sucursal Mendoza - ${mendozaAddress}`,
              `Sucursal San Juan - ${sanJuanAddress}`,
            ],
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
            locations: zoneInfo.province === 'Mendoza'
              ? [`Sucursal Mendoza - ${mendozaAddress}`]
              : [`Sucursal San Juan - ${sanJuanAddress}`],
          },
        },
      });
    }

    // Calcular si aplica envío gratis
    const totalDecimal = totalToCheck ? new Prisma.Decimal(totalToCheck) : null;
    let shippingPrice = shippingZone.price;
    let freeShipping = false;
    let amountForFreeShipping: number | null = null;

    if (shippingZone.minFree) {
      if (totalDecimal && totalDecimal.gte(shippingZone.minFree)) {
        shippingPrice = new Prisma.Decimal(0);
        freeShipping = true;
      } else if (totalDecimal) {
        // Calcular cuánto falta para envío gratis
        amountForFreeShipping = Number(shippingZone.minFree) - Number(totalDecimal);
      }
    }

    const estimatedDays = zoneInfo.zone.includes('Capital') || zoneInfo.zone.includes('Gran')
      ? '1-2 días hábiles'
      : '3-5 días hábiles';

    res.json({
      data: {
        available: true,
        province: zoneInfo.province,
        zone: zoneInfo.zone,
        postalCode,
        delivery: {
          available: true,
          price: Number(shippingPrice),
          freeShipping,
          freeShippingMin: shippingZone.minFree ? Number(shippingZone.minFree) : null,
          amountForFreeShipping,
          estimatedDays,
          message: freeShipping
            ? '¡Envío gratis!'
            : `Envío a domicilio: $${Number(shippingPrice).toLocaleString('es-AR')}`,
        },
        pickup: {
          available: true,
          price: 0,
          message: 'Retiro gratis en sucursal',
          locations: zoneInfo.province === 'Mendoza'
            ? [`Sucursal Mendoza - ${mendozaAddress}`]
            : [`Sucursal San Juan - ${sanJuanAddress}`],
        },
      },
    });
  } catch (error) {
    console.error('Error calculating shipping:', error);
    res.status(500).json({ error: 'Error al calcular envío' });
  }
});

export default router;
