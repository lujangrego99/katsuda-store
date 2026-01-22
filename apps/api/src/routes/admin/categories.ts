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

// GET /api/admin/categories - Lista todas las categorías con jerarquía
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { includeInactive = 'false' } = req.query;

    const where = includeInactive === 'true' ? {} : { isActive: true };

    // Obtener categorías padre con hijos
    const categories = await prisma.category.findMany({
      where: {
        ...where,
        parentId: null, // Solo categorías padre
      },
      orderBy: { order: 'asc' },
      include: {
        children: {
          where,
          orderBy: { order: 'asc' },
          include: {
            _count: {
              select: { products: true },
            },
          },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    res.json({ data: categories });
  } catch (error) {
    console.error('Error listando categorías admin:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// GET /api/admin/categories/all - Lista plana para selects
router.get('/all', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ parentId: 'asc' }, { order: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        isActive: true,
        parent: {
          select: { id: true, name: true },
        },
      },
    });

    res.json({ data: categories });
  } catch (error) {
    console.error('Error listando todas las categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// GET /api/admin/categories/:id - Detalle de categoría
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true } },
        children: {
          orderBy: { order: 'asc' },
          select: { id: true, name: true, slug: true, isActive: true },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    res.json({ data: category });
  } catch (error) {
    console.error('Error obteniendo categoría:', error);
    res.status(500).json({ error: 'Error al obtener categoría' });
  }
});

// POST /api/admin/categories - Crear categoría
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, description, image, parentId, order, isActive } = req.body;

    // Validaciones
    if (!name) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    // Generar slug único
    let slug = generateSlug(name);
    const existingSlug = await prisma.category.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    // Verificar que el padre existe si se proporciona
    if (parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        return res.status(400).json({ error: 'La categoría padre no existe' });
      }

      // No permitir más de 2 niveles de profundidad
      if (parent.parentId) {
        return res.status(400).json({
          error: 'No se pueden crear subcategorías de subcategorías',
        });
      }
    }

    // Obtener el orden máximo si no se proporciona
    let finalOrder = order;
    if (finalOrder === undefined) {
      const maxOrder = await prisma.category.aggregate({
        where: { parentId: parentId || null },
        _max: { order: true },
      });
      finalOrder = (maxOrder._max.order ?? -1) + 1;
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        image,
        parentId: parentId || null,
        order: finalOrder,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        parent: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({
      data: category,
      message: 'Categoría creada exitosamente',
    });
  } catch (error) {
    console.error('Error creando categoría:', error);
    res.status(500).json({ error: 'Error al crear categoría' });
  }
});

// PATCH /api/admin/categories/:id - Actualizar categoría
router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, image, parentId, order, isActive } = req.body;

    // Verificar que la categoría existe
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: { children: { select: { id: true } } },
    });

    if (!existingCategory) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    // Si se actualiza el nombre, actualizar el slug
    let newSlug = existingCategory.slug;
    if (name && name !== existingCategory.name) {
      newSlug = generateSlug(name);
      const slugExists = await prisma.category.findFirst({
        where: {
          slug: newSlug,
          id: { not: id },
        },
      });

      if (slugExists) {
        newSlug = `${newSlug}-${Date.now()}`;
      }
    }

    // Verificar parentId si se proporciona
    if (parentId !== undefined) {
      // No permitir que una categoría sea su propia padre
      if (parentId === id) {
        return res.status(400).json({
          error: 'Una categoría no puede ser su propia padre',
        });
      }

      // No permitir que una categoría con hijos se convierta en subcategoría
      if (parentId && existingCategory.children.length > 0) {
        return res.status(400).json({
          error: 'No se puede mover una categoría con subcategorías a otra categoría',
        });
      }

      if (parentId) {
        const parent = await prisma.category.findUnique({
          where: { id: parentId },
        });

        if (!parent) {
          return res.status(400).json({ error: 'La categoría padre no existe' });
        }

        // No permitir más de 2 niveles
        if (parent.parentId) {
          return res.status(400).json({
            error: 'No se pueden crear subcategorías de subcategorías',
          });
        }
      }
    }

    const updateData: Record<string, unknown> = {
      ...(name !== undefined && { name, slug: newSlug }),
      ...(description !== undefined && { description }),
      ...(image !== undefined && { image }),
      ...(parentId !== undefined && { parentId: parentId || null }),
      ...(order !== undefined && { order }),
      ...(isActive !== undefined && { isActive }),
    };

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        parent: { select: { id: true, name: true } },
        children: {
          orderBy: { order: 'asc' },
          select: { id: true, name: true, slug: true },
        },
      },
    });

    res.json({
      data: category,
      message: 'Categoría actualizada exitosamente',
    });
  } catch (error) {
    console.error('Error actualizando categoría:', error);
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
});

// DELETE /api/admin/categories/:id - Eliminar categoría
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: { select: { id: true } },
        products: { select: { id: true } },
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    // No permitir eliminar si tiene subcategorías
    if (category.children.length > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar una categoría con subcategorías. Elimina las subcategorías primero.',
      });
    }

    // No permitir eliminar si tiene productos
    if (category.products.length > 0) {
      return res.status(400).json({
        error: `No se puede eliminar porque tiene ${category.products.length} producto(s) asociado(s). Mueve los productos a otra categoría primero.`,
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    res.json({ message: 'Categoría eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando categoría:', error);
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
});

// PATCH /api/admin/categories/:id/toggle - Activar/Desactivar categoría
router.patch('/:id/toggle', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { isActive: !category.isActive },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    res.json({
      data: updated,
      message: `Categoría ${updated.isActive ? 'activada' : 'desactivada'} exitosamente`,
    });
  } catch (error) {
    console.error('Error toggleando categoría:', error);
    res.status(500).json({ error: 'Error al cambiar estado de la categoría' });
  }
});

// PATCH /api/admin/categories/reorder - Reordenar categorías
router.patch('/reorder', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { categories } = req.body;

    if (!Array.isArray(categories)) {
      return res.status(400).json({ error: 'Se espera un array de categorías' });
    }

    // Actualizar el orden de cada categoría
    await prisma.$transaction(
      categories.map(({ id, order }: { id: string; order: number }) =>
        prisma.category.update({
          where: { id },
          data: { order },
        })
      )
    );

    res.json({ message: 'Orden actualizado exitosamente' });
  } catch (error) {
    console.error('Error reordenando categorías:', error);
    res.status(500).json({ error: 'Error al reordenar categorías' });
  }
});

export default router;
