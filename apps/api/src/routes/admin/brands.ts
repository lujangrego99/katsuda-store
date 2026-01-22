import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';

const router: RouterType = Router();
const prisma = new PrismaClient();

// Función para generar slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9\s-]/g, '') // Eliminar caracteres especiales
    .trim()
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-'); // Múltiples guiones a uno
}

// GET /api/admin/brands - Lista todas las marcas
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      pageSize = '50',
      search = '',
      isActive,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string)));
    const skip = (pageNum - 1) * pageSizeNum;

    // Construir filtros
    const where: Record<string, unknown> = {};

    if (search) {
      where.name = { contains: search as string, mode: 'insensitive' };
    }

    if (isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    const [brands, total] = await Promise.all([
      prisma.brand.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { products: true },
          },
        },
      }),
      prisma.brand.count({ where }),
    ]);

    res.json({
      data: brands,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum),
    });
  } catch (error) {
    console.error('Error listando marcas admin:', error);
    res.status(500).json({ error: 'Error al obtener marcas' });
  }
});

// GET /api/admin/brands/all - Lista plana para selects
router.get('/all', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
      },
    });

    res.json({ data: brands });
  } catch (error) {
    console.error('Error listando todas las marcas:', error);
    res.status(500).json({ error: 'Error al obtener marcas' });
  }
});

// GET /api/admin/brands/:id - Detalle de marca
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!brand) {
      return res.status(404).json({ error: 'Marca no encontrada' });
    }

    res.json({ data: brand });
  } catch (error) {
    console.error('Error obteniendo marca:', error);
    res.status(500).json({ error: 'Error al obtener marca' });
  }
});

// POST /api/admin/brands - Crear marca
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, logo, isActive } = req.body;

    // Validaciones
    if (!name) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    // Generar slug único
    let slug = generateSlug(name);
    const existingSlug = await prisma.brand.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const brand = await prisma.brand.create({
      data: {
        name,
        slug,
        logo,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res.status(201).json({
      data: brand,
      message: 'Marca creada exitosamente',
    });
  } catch (error) {
    console.error('Error creando marca:', error);
    res.status(500).json({ error: 'Error al crear marca' });
  }
});

// PATCH /api/admin/brands/:id - Actualizar marca
router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, logo, isActive } = req.body;

    // Verificar que la marca existe
    const existingBrand = await prisma.brand.findUnique({
      where: { id },
    });

    if (!existingBrand) {
      return res.status(404).json({ error: 'Marca no encontrada' });
    }

    // Si se actualiza el nombre, actualizar el slug
    let newSlug = existingBrand.slug;
    if (name && name !== existingBrand.name) {
      newSlug = generateSlug(name);
      const slugExists = await prisma.brand.findFirst({
        where: {
          slug: newSlug,
          id: { not: id },
        },
      });

      if (slugExists) {
        newSlug = `${newSlug}-${Date.now()}`;
      }
    }

    const updateData: Record<string, unknown> = {
      ...(name !== undefined && { name, slug: newSlug }),
      ...(logo !== undefined && { logo }),
      ...(isActive !== undefined && { isActive }),
    };

    const brand = await prisma.brand.update({
      where: { id },
      data: updateData,
    });

    res.json({
      data: brand,
      message: 'Marca actualizada exitosamente',
    });
  } catch (error) {
    console.error('Error actualizando marca:', error);
    res.status(500).json({ error: 'Error al actualizar marca' });
  }
});

// DELETE /api/admin/brands/:id - Eliminar marca
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        products: { select: { id: true } },
      },
    });

    if (!brand) {
      return res.status(404).json({ error: 'Marca no encontrada' });
    }

    // No permitir eliminar si tiene productos
    if (brand.products.length > 0) {
      return res.status(400).json({
        error: `No se puede eliminar porque tiene ${brand.products.length} producto(s) asociado(s). Cambia la marca de los productos primero.`,
      });
    }

    await prisma.brand.delete({
      where: { id },
    });

    res.json({ message: 'Marca eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando marca:', error);
    res.status(500).json({ error: 'Error al eliminar marca' });
  }
});

// PATCH /api/admin/brands/:id/toggle - Activar/Desactivar marca
router.patch('/:id/toggle', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const brand = await prisma.brand.findUnique({
      where: { id },
    });

    if (!brand) {
      return res.status(404).json({ error: 'Marca no encontrada' });
    }

    const updated = await prisma.brand.update({
      where: { id },
      data: { isActive: !brand.isActive },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    res.json({
      data: updated,
      message: `Marca ${updated.isActive ? 'activada' : 'desactivada'} exitosamente`,
    });
  } catch (error) {
    console.error('Error toggleando marca:', error);
    res.status(500).json({ error: 'Error al cambiar estado de la marca' });
  }
});

export default router;
