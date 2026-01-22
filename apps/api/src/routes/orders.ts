import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { PrismaClient } from '@prisma/client';

const router: RouterType = Router();
const prisma = new PrismaClient();

// GET /api/orders/:orderNumber - Ver pedido por número
router.get('/:orderNumber', async (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                slug: true,
                images: {
                  where: { isPrimary: true },
                  take: 1,
                  select: { url: true },
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

    // Formatear respuesta
    const response = {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      items: order.items.map(item => ({
        product: {
          ...item.product,
          image: item.product.images[0]?.url || null,
        },
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      })),
      subtotal: order.subtotal,
      shipping: order.shipping,
      discount: order.discount,
      total: order.total,
      contact: {
        email: order.guestEmail,
        name: order.guestName,
        phone: order.guestPhone,
      },
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    res.json({ data: response });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Error al obtener el pedido' });
  }
});

export default router;
