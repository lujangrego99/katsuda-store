import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const router: RouterType = Router();
const prisma = new PrismaClient();

// Helper: generar número de pedido único
// Formato: KAT-YYMMDD-XXXX (ej: KAT-260122-0001)
async function generateOrderNumber(): Promise<string> {
  const today = new Date();
  const datePrefix = today.toISOString().slice(2, 10).replace(/-/g, '');
  const prefix = `KAT-${datePrefix}`;

  // Buscar el último pedido del día
  const lastOrder = await prisma.order.findFirst({
    where: {
      orderNumber: { startsWith: prefix },
    },
    orderBy: { orderNumber: 'desc' },
  });

  let sequence = 1;
  if (lastOrder) {
    const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2], 10);
    sequence = lastSequence + 1;
  }

  return `${prefix}-${sequence.toString().padStart(4, '0')}`;
}

// POST /api/checkout - Crear pedido desde carrito
router.post('/', async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID requerido' });
    }

    const {
      // Datos de contacto
      email,
      firstName,
      lastName,
      phone,
      // Dirección de envío
      street,
      number,
      floor,
      apartment,
      city,
      province,
      postalCode,
      // Método de envío y pago
      shippingMethod, // 'pickup' | 'delivery'
      paymentMethod,  // 'transfer' | 'cash'
      notes,
    } = req.body;

    // Validar campos requeridos
    if (!email || !firstName || !lastName) {
      return res.status(400).json({ error: 'Datos de contacto incompletos' });
    }

    if (!paymentMethod) {
      return res.status(400).json({ error: 'Método de pago requerido' });
    }

    // Si es envío a domicilio, validar dirección
    if (shippingMethod === 'delivery') {
      if (!street || !number || !city || !province || !postalCode) {
        return res.status(400).json({ error: 'Dirección de envío incompleta' });
      }
    }

    // Obtener carrito
    const cart = await prisma.cart.findFirst({
      where: { sessionId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Carrito vacío' });
    }

    // Validar stock de todos los productos
    const stockErrors: { productId: string; name: string; requested: number; available: number }[] = [];

    for (const item of cart.items) {
      if (item.quantity > item.product.stock) {
        stockErrors.push({
          productId: item.productId,
          name: item.product.name,
          requested: item.quantity,
          available: item.product.stock,
        });
      }
    }

    if (stockErrors.length > 0) {
      return res.status(400).json({
        error: 'Stock insuficiente para algunos productos',
        stockErrors,
      });
    }

    // Calcular subtotal (usando precio transferencia si aplica)
    const useTransferPrice = paymentMethod === 'transfer';
    let subtotal = new Prisma.Decimal(0);

    for (const item of cart.items) {
      const price = useTransferPrice && item.product.transferPrice
        ? item.product.transferPrice
        : item.product.price;
      subtotal = subtotal.add(new Prisma.Decimal(price.toString()).mul(item.quantity));
    }

    // Calcular envío
    let shippingCost = new Prisma.Decimal(0);

    if (shippingMethod === 'delivery') {
      // Buscar zona de envío por provincia
      const zone = await prisma.shippingZone.findFirst({
        where: {
          province: { contains: province, mode: 'insensitive' },
          isActive: true,
        },
      });

      if (zone) {
        // Verificar si tiene envío gratis
        if (zone.minFree && subtotal.gte(zone.minFree)) {
          shippingCost = new Prisma.Decimal(0);
        } else {
          shippingCost = zone.price;
        }
      } else {
        // Si no hay zona configurada, usar un valor por defecto
        shippingCost = new Prisma.Decimal(5000); // $5000 por defecto
      }
    }

    const total = subtotal.add(shippingCost);

    // Generar número de pedido
    const orderNumber = await generateOrderNumber();

    // Crear pedido en una transacción
    const order = await prisma.$transaction(async (tx) => {
      // 1. Crear el pedido
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          subtotal,
          shipping: shippingCost,
          total,
          paymentMethod,
          guestEmail: email,
          guestName: `${firstName} ${lastName}`,
          guestPhone: phone || null,
          notes: notes || null,
          items: {
            create: cart.items.map(item => {
              const price = useTransferPrice && item.product.transferPrice
                ? item.product.transferPrice
                : item.product.price;
              return {
                productId: item.productId,
                quantity: item.quantity,
                price,
                total: new Prisma.Decimal(price.toString()).mul(item.quantity),
              };
            }),
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      });

      // 2. Reducir stock de cada producto
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // 3. Vaciar el carrito
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    // Formatear respuesta
    const response = {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      items: order.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      })),
      subtotal: order.subtotal,
      shipping: order.shipping,
      total: order.total,
      contact: {
        email: order.guestEmail,
        name: order.guestName,
        phone: order.guestPhone,
      },
      shippingAddress: shippingMethod === 'delivery' ? {
        street,
        number,
        floor,
        apartment,
        city,
        province,
        postalCode,
      } : null,
      createdAt: order.createdAt,
    };

    res.status(201).json({
      data: response,
      message: 'Pedido creado exitosamente',
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Error al crear el pedido' });
  }
});

export default router;
