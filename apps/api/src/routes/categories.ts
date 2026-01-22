import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { PrismaClient } from '@prisma/client';

const router: RouterType = Router();
const prisma = new PrismaClient();

// GET /api/categories - Lista categorías con conteo de productos
router.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { products: { where: { isActive: true } } }
        }
      },
      orderBy: { order: 'asc' },
    });

    // Solo devolver categorías padre (sin parentId)
    const parentCategories = categories.filter(c => !c.parentId);

    const result = parentCategories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      productCount: category._count.products,
      updatedAt: category.updatedAt,
      children: category.children.map(child => {
        const childData = categories.find(c => c.id === child.id);
        return {
          id: child.id,
          name: child.name,
          slug: child.slug,
          description: child.description,
          image: child.image,
          productCount: childData?._count.products || 0,
          updatedAt: child.updatedAt,
        };
      }),
    }));

    res.json({ data: result });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// GET /api/categories/:slug - Categoría con productos
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 12;
    const skip = (page - 1) * pageSize;

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        parent: {
          select: { id: true, name: true, slug: true }
        },
        children: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          select: { id: true, name: true, slug: true, image: true }
        },
      },
    });

    if (!category || !category.isActive) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    // Obtener IDs de esta categoría y sus hijos para buscar productos
    const categoryIds = [category.id, ...category.children.map(c => c.id)];

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: {
          categoryId: { in: categoryIds },
          isActive: true,
        },
        include: {
          brand: { select: { id: true, name: true, slug: true } },
          images: {
            where: { isPrimary: true },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.product.count({
        where: {
          categoryId: { in: categoryIds },
          isActive: true,
        },
      }),
    ]);

    const formattedProducts = products.map(product => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      shortDesc: product.shortDesc,
      price: product.price,
      comparePrice: product.comparePrice,
      transferPrice: product.transferPrice,
      stock: product.stock,
      isFeatured: product.isFeatured,
      freeShipping: product.freeShipping,
      brand: product.brand,
      image: product.images[0]?.url || null,
    }));

    res.json({
      data: {
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          image: category.image,
          parent: category.parent,
          children: category.children,
        },
        products: formattedProducts,
      },
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Error al obtener categoría' });
  }
});

export default router;
