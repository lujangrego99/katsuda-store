import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { PrismaClient } from '@prisma/client';

const router: RouterType = Router();
const prisma = new PrismaClient();

// GET /api/brands - Lista marcas
router.get('/', async (_req: Request, res: Response) => {
  try {
    const brands = await prisma.brand.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { products: { where: { isActive: true } } }
        }
      },
      orderBy: { name: 'asc' },
    });

    const result = brands.map(brand => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo,
      productCount: brand._count.products,
    }));

    res.json({ data: result });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: 'Error al obtener marcas' });
  }
});

export default router;
