import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { PrismaClient } from '@prisma/client';

const router: RouterType = Router();
const prisma = new PrismaClient();

// Helper: obtener o crear carrito por sessionId
async function getOrCreateCart(sessionId: string) {
  let cart = await prisma.cart.findFirst({
    where: { sessionId },
    include: {
      items: {
        include: {
          product: {
            include: {
              brand: { select: { id: true, name: true, slug: true } },
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { sessionId },
      include: {
        items: {
          include: {
            product: {
              include: {
                brand: { select: { id: true, name: true, slug: true } },
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });
  }

  return cart;
}

// Helper: formatear carrito para respuesta
function formatCartResponse(cart: Awaited<ReturnType<typeof getOrCreateCart>>) {
  const items = cart.items.map(item => ({
    id: item.id,
    quantity: item.quantity,
    product: {
      id: item.product.id,
      sku: item.product.sku,
      name: item.product.name,
      slug: item.product.slug,
      price: item.product.price,
      transferPrice: item.product.transferPrice,
      stock: item.product.stock,
      brand: item.product.brand,
      image: item.product.images[0]?.url || null,
    },
  }));

  const subtotal = items.reduce((sum, item) => {
    return sum + Number(item.product.price) * item.quantity;
  }, 0);

  const transferSubtotal = items.reduce((sum, item) => {
    const price = item.product.transferPrice || item.product.price;
    return sum + Number(price) * item.quantity;
  }, 0);

  return {
    id: cart.id,
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    transferSubtotal,
  };
}

// GET /api/cart - Obtener carrito actual por sessionId
router.get('/', async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID requerido' });
    }

    const cart = await getOrCreateCart(sessionId);
    res.json({ data: formatCartResponse(cart) });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Error al obtener carrito' });
  }
});

// POST /api/cart/items - Agregar producto al carrito
router.post('/items', async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID requerido' });
    }

    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'productId requerido' });
    }

    if (quantity < 1) {
      return res.status(400).json({ error: 'Cantidad debe ser al menos 1' });
    }

    // Verificar que el producto existe y tiene stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        error: 'Stock insuficiente',
        availableStock: product.stock,
      });
    }

    // Obtener o crear carrito
    let cart = await prisma.cart.findFirst({ where: { sessionId } });

    if (!cart) {
      cart = await prisma.cart.create({ data: { sessionId } });
    }

    // Verificar si el producto ya está en el carrito
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      // Verificar stock para la cantidad total
      if (newQuantity > product.stock) {
        return res.status(400).json({
          error: 'Stock insuficiente',
          availableStock: product.stock,
          currentInCart: existingItem.quantity,
        });
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    // Retornar carrito actualizado
    const updatedCart = await getOrCreateCart(sessionId);
    res.status(201).json({
      data: formatCartResponse(updatedCart),
      message: 'Producto agregado al carrito',
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Error al agregar al carrito' });
  }
});

// PATCH /api/cart/items/:id - Actualizar cantidad
router.patch('/items/:id', async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID requerido' });
    }

    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ error: 'Cantidad inválida' });
    }

    // Si cantidad es 0, eliminar el item
    if (quantity === 0) {
      const cartItem = await prisma.cartItem.findUnique({
        where: { id },
        include: { cart: true },
      });

      if (!cartItem || cartItem.cart.sessionId !== sessionId) {
        return res.status(404).json({ error: 'Item no encontrado' });
      }

      await prisma.cartItem.delete({ where: { id } });

      const updatedCart = await getOrCreateCart(sessionId);
      return res.json({
        data: formatCartResponse(updatedCart),
        message: 'Producto eliminado del carrito',
      });
    }

    // Verificar que el item pertenece al carrito del usuario
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: {
        cart: true,
        product: true,
      },
    });

    if (!cartItem || cartItem.cart.sessionId !== sessionId) {
      return res.status(404).json({ error: 'Item no encontrado' });
    }

    // Validar stock
    if (quantity > cartItem.product.stock) {
      return res.status(400).json({
        error: 'Stock insuficiente',
        availableStock: cartItem.product.stock,
      });
    }

    await prisma.cartItem.update({
      where: { id },
      data: { quantity },
    });

    const updatedCart = await getOrCreateCart(sessionId);
    res.json({
      data: formatCartResponse(updatedCart),
      message: 'Cantidad actualizada',
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ error: 'Error al actualizar item' });
  }
});

// DELETE /api/cart/items/:id - Eliminar producto del carrito
router.delete('/items/:id', async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID requerido' });
    }

    const { id } = req.params;

    // Verificar que el item pertenece al carrito del usuario
    const cartItem = await prisma.cartItem.findUnique({
      where: { id },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.sessionId !== sessionId) {
      return res.status(404).json({ error: 'Item no encontrado' });
    }

    await prisma.cartItem.delete({ where: { id } });

    const updatedCart = await getOrCreateCart(sessionId);
    res.json({
      data: formatCartResponse(updatedCart),
      message: 'Producto eliminado del carrito',
    });
  } catch (error) {
    console.error('Error deleting cart item:', error);
    res.status(500).json({ error: 'Error al eliminar item' });
  }
});

export default router;
