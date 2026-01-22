import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { PrismaClient, OrderStatus, PaymentStatus } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';

const router: RouterType = Router();
const prisma = new PrismaClient();

// GET /api/admin/orders - Lista paginada con filtros
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      pageSize = '10',
      search = '',
      status,
      paymentStatus,
      dateFrom,
      dateTo,
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
        { orderNumber: { contains: search as string, mode: 'insensitive' } },
        { guestEmail: { contains: search as string, mode: 'insensitive' } },
        { guestName: { contains: search as string, mode: 'insensitive' } },
        {
          customer: {
            OR: [
              { email: { contains: search as string, mode: 'insensitive' } },
              { firstName: { contains: search as string, mode: 'insensitive' } },
              { lastName: { contains: search as string, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    if (status) {
      where.status = status as OrderStatus;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus as PaymentStatus;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        (where.createdAt as Record<string, Date>).gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        const endDate = new Date(dateTo as string);
        endDate.setHours(23, 59, 59, 999);
        (where.createdAt as Record<string, Date>).lte = endDate;
      }
    }

    // Construir ordenamiento
    const orderBy: Record<string, string> = {};
    orderBy[sortBy as string] = sortOrder as string;

    // Obtener pedidos con total
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentMethod: true,
          paymentStatus: true,
          subtotal: true,
          shipping: true,
          discount: true,
          total: true,
          guestEmail: true,
          guestName: true,
          guestPhone: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          customer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          address: {
            select: {
              street: true,
              number: true,
              floor: true,
              apartment: true,
              city: true,
              province: true,
              postalCode: true,
            },
          },
          _count: {
            select: { items: true },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      data: orders,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum),
    });
  } catch (error) {
    console.error('Error listando pedidos admin:', error);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

// GET /api/admin/orders/:id - Detalle de pedido
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        address: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                sku: true,
                images: {
                  take: 1,
                  orderBy: { order: 'asc' },
                  select: { url: true, alt: true },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json({ data: order });
  } catch (error) {
    console.error('Error obteniendo pedido:', error);
    res.status(500).json({ error: 'Error al obtener pedido' });
  }
});

// PATCH /api/admin/orders/:id - Actualizar estado del pedido
router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus, notes } = req.body;

    // Verificar que el pedido existe
    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    // Validar transiciones de estado permitidas
    if (status) {
      const validTransitions: Record<OrderStatus, OrderStatus[]> = {
        PENDING: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['PROCESSING', 'CANCELLED'],
        PROCESSING: ['SHIPPED', 'CANCELLED'],
        SHIPPED: ['DELIVERED', 'CANCELLED'],
        DELIVERED: [],
        CANCELLED: [],
      };

      const allowedStatuses = validTransitions[existingOrder.status];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          error: `No se puede cambiar de ${existingOrder.status} a ${status}`,
          allowedTransitions: allowedStatuses,
        });
      }
    }

    // Preparar datos de actualización
    const updateData: Record<string, unknown> = {};

    if (status !== undefined) {
      updateData.status = status;
    }

    if (paymentStatus !== undefined) {
      updateData.paymentStatus = paymentStatus;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        address: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                images: {
                  take: 1,
                  orderBy: { order: 'asc' },
                  select: { url: true, alt: true },
                },
              },
            },
          },
        },
      },
    });

    res.json({
      data: order,
      message: 'Pedido actualizado exitosamente',
    });
  } catch (error) {
    console.error('Error actualizando pedido:', error);
    res.status(500).json({ error: 'Error al actualizar pedido' });
  }
});

// GET /api/admin/orders/stats - Estadísticas de pedidos
router.get('/stats/summary', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      todayOrders,
      todaySales,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'CONFIRMED' } }),
      prisma.order.count({ where: { status: 'PROCESSING' } }),
      prisma.order.count({ where: { status: 'SHIPPED' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: today },
          status: { not: 'CANCELLED' },
        },
        _sum: { total: true },
      }),
    ]);

    res.json({
      data: {
        total: totalOrders,
        byStatus: {
          pending: pendingOrders,
          confirmed: confirmedOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
        },
        today: {
          orders: todayOrders,
          sales: todaySales._sum.total || 0,
        },
      },
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

export default router;
