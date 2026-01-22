import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';

const router: RouterType = Router();
const prisma = new PrismaClient();

// GET /api/admin/dashboard - Métricas del dashboard
router.get('/', authMiddleware, async (_req: Request, res: Response) => {
  try {
    // Fecha de hoy al inicio del día
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Pedidos pendientes (PENDING)
    const pendingOrders = await prisma.order.count({
      where: { status: OrderStatus.PENDING },
    });

    // Ventas del día (pedidos creados hoy que no estén cancelados)
    const todayOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: todayStart },
        status: { not: OrderStatus.CANCELLED },
      },
      select: { total: true },
    });

    const todaySales = todayOrders.reduce(
      (sum, order) => sum + Number(order.total),
      0
    );
    const todayOrdersCount = todayOrders.length;

    // Productos con bajo stock (stock <= 5)
    const lowStockProducts = await prisma.product.count({
      where: {
        stock: { lte: 5 },
        isActive: true,
      },
    });

    // Mensajes sin leer
    const unreadMessages = await prisma.contact.count({
      where: { isRead: false },
    });

    // Pedidos recientes (últimos 5)
    const recentOrdersRaw = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        guestName: true,
        guestEmail: true,
        total: true,
        status: true,
        createdAt: true,
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Mapear para tener customerName unificado
    const recentOrders = recentOrdersRaw.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customer
        ? `${order.customer.firstName} ${order.customer.lastName}`
        : order.guestName || order.guestEmail || 'Cliente anónimo',
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
    }));

    // Productos con bajo stock (lista, top 5)
    const lowStockList = await prisma.product.findMany({
      where: {
        stock: { lte: 5 },
        isActive: true,
      },
      take: 5,
      orderBy: { stock: 'asc' },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        images: {
          take: 1,
          select: { url: true },
        },
      },
    });

    res.json({
      data: {
        metrics: {
          pendingOrders,
          todaySales,
          todayOrdersCount,
          lowStockProducts,
          unreadMessages,
        },
        recentOrders,
        lowStockList,
      },
    });
  } catch (error) {
    console.error('Error obteniendo dashboard:', error);
    res.status(500).json({ error: 'Error obteniendo métricas del dashboard' });
  }
});

export default router;
