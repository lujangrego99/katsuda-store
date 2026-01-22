import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const router: RouterType = Router();
const prisma = new PrismaClient();

// GET /api/products/search - Búsqueda de productos para autocomplete
router.get('/search', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string)?.trim();
    const limit = Math.min(parseInt(req.query.limit as string) || 5, 10);

    if (!q || q.length < 2) {
      return res.json({ data: [], query: q || '' });
    }

    // Buscar productos por nombre, SKU o marca
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
          { brand: { name: { contains: q, mode: 'insensitive' } } },
        ],
      },
      include: {
        brand: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
      orderBy: [
        // Priorizar coincidencias exactas de SKU
        { sku: 'asc' },
      ],
      take: limit,
    });

    const result = products.map(product => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      price: product.price,
      transferPrice: product.transferPrice,
      stock: product.stock,
      brand: product.brand,
      category: product.category,
      image: product.images[0]?.url || null,
    }));

    res.json({ data: result, query: q });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Error al buscar productos' });
  }
});

// GET /api/products/featured - Productos destacados (debe ir antes de /:slug)
router.get('/featured', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 8;

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        isFeatured: true,
      },
      include: {
        brand: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const result = products.map(product => ({
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
      category: product.category,
      image: product.images[0]?.url || null,
    }));

    res.json({ data: result });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({ error: 'Error al obtener productos destacados' });
  }
});

// GET /api/products - Lista productos paginada con filtros
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 12;
    const skip = (page - 1) * pageSize;

    // Filtros
    const category = req.query.category as string | undefined;
    const brand = req.query.brand as string | undefined;
    const priceMin = req.query.priceMin ? parseFloat(req.query.priceMin as string) : undefined;
    const priceMax = req.query.priceMax ? parseFloat(req.query.priceMax as string) : undefined;
    const inStock = req.query.inStock === 'true';
    const freeShipping = req.query.freeShipping === 'true';
    const search = req.query.search as string | undefined;
    const sortBy = req.query.sortBy as string || 'newest';

    // Construir where
    const where: Prisma.ProductWhereInput = {
      isActive: true,
    };

    if (category) {
      // Buscar por slug de categoría
      const categoryData = await prisma.category.findUnique({
        where: { slug: category },
        include: { children: { select: { id: true } } },
      });
      if (categoryData) {
        const categoryIds = [categoryData.id, ...categoryData.children.map(c => c.id)];
        where.categoryId = { in: categoryIds };
      }
    }

    if (brand) {
      const brandData = await prisma.brand.findUnique({ where: { slug: brand } });
      if (brandData) {
        where.brandId = brandData.id;
      }
    }

    if (priceMin !== undefined || priceMax !== undefined) {
      where.price = {};
      if (priceMin !== undefined) {
        where.price.gte = priceMin;
      }
      if (priceMax !== undefined) {
        where.price.lte = priceMax;
      }
    }

    if (inStock) {
      where.stock = { gt: 0 };
    }

    if (freeShipping) {
      where.freeShipping = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Construir orderBy
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    switch (sortBy) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'name_asc':
        orderBy = { name: 'asc' };
        break;
      case 'name_desc':
        orderBy = { name: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          brand: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true, slug: true } },
          images: {
            where: { isPrimary: true },
            take: 1,
          },
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    const result = products.map(product => ({
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
      category: product.category,
      image: product.images[0]?.url || null,
      updatedAt: product.updatedAt,
    }));

    res.json({
      data: result,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// GET /api/products/:slug - Detalle de producto
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        brand: { select: { id: true, name: true, slug: true, logo: true } },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            parent: { select: { id: true, name: true, slug: true } }
          }
        },
        images: { orderBy: { order: 'asc' } },
        attributes: true,
      },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Productos relacionados (misma categoría, excluyendo el actual)
    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
      },
      include: {
        brand: { select: { id: true, name: true, slug: true } },
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
      take: 4,
      orderBy: { createdAt: 'desc' },
    });

    const formattedRelated = relatedProducts.map(p => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      slug: p.slug,
      price: p.price,
      comparePrice: p.comparePrice,
      transferPrice: p.transferPrice,
      stock: p.stock,
      freeShipping: p.freeShipping,
      brand: p.brand,
      image: p.images[0]?.url || null,
    }));

    res.json({
      data: {
        id: product.id,
        sku: product.sku,
        name: product.name,
        slug: product.slug,
        description: product.description,
        shortDesc: product.shortDesc,
        price: product.price,
        comparePrice: product.comparePrice,
        transferPrice: product.transferPrice,
        stock: product.stock,
        stockWarning: product.stockWarning,
        isFeatured: product.isFeatured,
        freeShipping: product.freeShipping,
        weight: product.weight,
        dimensions: product.dimensions,
        tags: product.tags,
        seoTitle: product.seoTitle,
        seoDescription: product.seoDescription,
        brand: product.brand,
        category: product.category,
        images: product.images.map(img => ({
          id: img.id,
          url: img.url,
          alt: img.alt,
          isPrimary: img.isPrimary,
        })),
        attributes: product.attributes.map(attr => ({
          id: attr.id,
          name: attr.name,
          value: attr.value,
        })),
        relatedProducts: formattedRelated,
      },
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

export default router;
