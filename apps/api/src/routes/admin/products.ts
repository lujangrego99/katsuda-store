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

// GET /api/admin/products - Lista paginada con búsqueda
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      pageSize = '10',
      search = '',
      category,
      brand,
      lowStock,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string)));
    const skip = (pageNum - 1) * pageSizeNum;

    // Construir filtros
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.categoryId = category as string;
    }

    if (brand) {
      where.brandId = brand as string;
    }

    if (lowStock === 'true') {
      where.stock = { lte: 5 };
    }

    if (isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    // Construir ordenamiento
    const orderBy: Record<string, string> = {};
    orderBy[sortBy as string] = sortOrder as string;

    // Obtener productos con total
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy,
        select: {
          id: true,
          sku: true,
          name: true,
          slug: true,
          price: true,
          comparePrice: true,
          transferPrice: true,
          stock: true,
          stockWarning: true,
          isActive: true,
          isFeatured: true,
          freeShipping: true,
          createdAt: true,
          category: {
            select: { id: true, name: true, slug: true },
          },
          brand: {
            select: { id: true, name: true, slug: true },
          },
          images: {
            take: 1,
            orderBy: { order: 'asc' },
            select: { url: true, alt: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      data: products,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum),
    });
  } catch (error) {
    console.error('Error listando productos admin:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// GET /api/admin/products/:id - Detalle de producto para edición
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        images: { orderBy: { order: 'asc' } },
        attributes: true,
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ data: product });
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

// POST /api/admin/products - Crear producto
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const {
      sku,
      name,
      description,
      shortDesc,
      price,
      comparePrice,
      transferPrice,
      cost,
      stock,
      stockWarning,
      categoryId,
      brandId,
      isFeatured,
      isActive,
      freeShipping,
      weight,
      dimensions,
      tags,
      seoTitle,
      seoDescription,
      images,
      attributes,
    } = req.body;

    // Validaciones
    if (!sku || !name || !price || !categoryId) {
      return res.status(400).json({
        error: 'SKU, nombre, precio y categoría son requeridos',
      });
    }

    // Verificar SKU único
    const existingSku = await prisma.product.findUnique({
      where: { sku },
    });

    if (existingSku) {
      return res.status(400).json({ error: 'El SKU ya existe' });
    }

    // Generar slug único
    let slug = generateSlug(name);
    const existingSlug = await prisma.product.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    // Crear producto con imágenes y atributos
    const product = await prisma.product.create({
      data: {
        sku,
        name,
        slug,
        description,
        shortDesc,
        price,
        comparePrice,
        transferPrice,
        cost,
        stock: stock || 0,
        stockWarning: stockWarning || 5,
        categoryId,
        brandId: brandId || null,
        isFeatured: isFeatured || false,
        isActive: isActive !== undefined ? isActive : true,
        freeShipping: freeShipping || false,
        weight,
        dimensions,
        tags: tags || [],
        seoTitle,
        seoDescription,
        images: images?.length
          ? {
              create: images.map(
                (img: { url: string; alt?: string; order?: number; isPrimary?: boolean }, index: number) => ({
                  url: img.url,
                  alt: img.alt || name,
                  order: img.order !== undefined ? img.order : index,
                  isPrimary: img.isPrimary || index === 0,
                })
              ),
            }
          : undefined,
        attributes: attributes?.length
          ? {
              create: attributes.map((attr: { name: string; value: string }) => ({
                name: attr.name,
                value: attr.value,
              })),
            }
          : undefined,
      },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        images: true,
        attributes: true,
      },
    });

    res.status(201).json({
      data: product,
      message: 'Producto creado exitosamente',
    });
  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// PATCH /api/admin/products/:id - Actualizar producto
router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      sku,
      name,
      description,
      shortDesc,
      price,
      comparePrice,
      transferPrice,
      cost,
      stock,
      stockWarning,
      categoryId,
      brandId,
      isFeatured,
      isActive,
      freeShipping,
      weight,
      dimensions,
      tags,
      seoTitle,
      seoDescription,
      images,
      attributes,
    } = req.body;

    // Verificar que el producto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Si se actualiza el SKU, verificar que sea único
    if (sku && sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku },
      });

      if (skuExists) {
        return res.status(400).json({ error: 'El SKU ya existe' });
      }
    }

    // Si se actualiza el nombre, actualizar el slug
    let newSlug = existingProduct.slug;
    if (name && name !== existingProduct.name) {
      newSlug = generateSlug(name);
      const slugExists = await prisma.product.findFirst({
        where: {
          slug: newSlug,
          id: { not: id },
        },
      });

      if (slugExists) {
        newSlug = `${newSlug}-${Date.now()}`;
      }
    }

    // Preparar datos de actualización
    const updateData: Record<string, unknown> = {
      ...(sku !== undefined && { sku }),
      ...(name !== undefined && { name, slug: newSlug }),
      ...(description !== undefined && { description }),
      ...(shortDesc !== undefined && { shortDesc }),
      ...(price !== undefined && { price }),
      ...(comparePrice !== undefined && { comparePrice }),
      ...(transferPrice !== undefined && { transferPrice }),
      ...(cost !== undefined && { cost }),
      ...(stock !== undefined && { stock }),
      ...(stockWarning !== undefined && { stockWarning }),
      ...(categoryId !== undefined && { categoryId }),
      ...(brandId !== undefined && { brandId: brandId || null }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(isActive !== undefined && { isActive }),
      ...(freeShipping !== undefined && { freeShipping }),
      ...(weight !== undefined && { weight }),
      ...(dimensions !== undefined && { dimensions }),
      ...(tags !== undefined && { tags }),
      ...(seoTitle !== undefined && { seoTitle }),
      ...(seoDescription !== undefined && { seoDescription }),
    };

    // Actualizar en una transacción si hay imágenes o atributos
    const product = await prisma.$transaction(async (tx) => {
      // Actualizar imágenes si se proporcionan
      if (images !== undefined) {
        // Eliminar imágenes existentes
        await tx.productImage.deleteMany({
          where: { productId: id },
        });

        // Crear nuevas imágenes
        if (images.length > 0) {
          await tx.productImage.createMany({
            data: images.map(
              (img: { url: string; alt?: string; order?: number; isPrimary?: boolean }, index: number) => ({
                productId: id,
                url: img.url,
                alt: img.alt || name || existingProduct.name,
                order: img.order !== undefined ? img.order : index,
                isPrimary: img.isPrimary || index === 0,
              })
            ),
          });
        }
      }

      // Actualizar atributos si se proporcionan
      if (attributes !== undefined) {
        // Eliminar atributos existentes
        await tx.productAttribute.deleteMany({
          where: { productId: id },
        });

        // Crear nuevos atributos
        if (attributes.length > 0) {
          await tx.productAttribute.createMany({
            data: attributes.map((attr: { name: string; value: string }) => ({
              productId: id,
              name: attr.name,
              value: attr.value,
            })),
          });
        }
      }

      // Actualizar producto
      return tx.product.update({
        where: { id },
        data: updateData,
        include: {
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
          images: { orderBy: { order: 'asc' } },
          attributes: true,
        },
      });
    });

    res.json({
      data: product,
      message: 'Producto actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// DELETE /api/admin/products/:id - Eliminar producto
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verificar que el producto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        cartItems: { select: { id: true } },
        orderItems: { select: { id: true } },
      },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Verificar si tiene items de pedido asociados
    if (existingProduct.orderItems.length > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar el producto porque tiene pedidos asociados. Desactívalo en su lugar.',
      });
    }

    // Eliminar producto (cascade elimina imágenes, atributos y cart items)
    await prisma.product.delete({
      where: { id },
    });

    res.json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando producto:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

// PATCH /api/admin/products/:id/toggle - Activar/Desactivar producto
router.patch('/:id/toggle', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { isActive: !product.isActive },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    res.json({
      data: updated,
      message: `Producto ${updated.isActive ? 'activado' : 'desactivado'} exitosamente`,
    });
  } catch (error) {
    console.error('Error toggleando producto:', error);
    res.status(500).json({ error: 'Error al cambiar estado del producto' });
  }
});

export default router;
