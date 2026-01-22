import { Router, Request, Response, Router as RouterType } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';

const router: RouterType = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authMiddleware);

// GET /api/admin/messages - List messages with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      pageSize = '20',
      isRead,
      search,
      sortBy = 'newest',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const pageSizeNum = parseInt(pageSize as string, 10);
    const skip = (pageNum - 1) * pageSizeNum;

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (isRead === 'true') {
      where.isRead = true;
    } else if (isRead === 'false') {
      where.isRead = false;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { subject: { contains: search as string, mode: 'insensitive' } },
        { message: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Build orderBy
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'oldest') {
      orderBy = { createdAt: 'asc' };
    }

    const [messages, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy,
      }),
      prisma.contact.count({ where }),
    ]);

    // Get unread count
    const unreadCount = await prisma.contact.count({
      where: { isRead: false },
    });

    res.json({
      data: messages,
      total,
      unreadCount,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum),
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});

// GET /api/admin/messages/:id - Get message detail
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const message = await prisma.contact.findUnique({
      where: { id },
    });

    if (!message) {
      return res.status(404).json({ error: 'Mensaje no encontrado' });
    }

    res.json({ data: message });
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({ error: 'Error al obtener mensaje' });
  }
});

// PATCH /api/admin/messages/:id/read - Mark message as read
router.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const message = await prisma.contact.update({
      where: { id },
      data: { isRead: true },
    });

    res.json({ data: message, message: 'Mensaje marcado como leído' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Error al actualizar mensaje' });
  }
});

// PATCH /api/admin/messages/:id/unread - Mark message as unread
router.patch('/:id/unread', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const message = await prisma.contact.update({
      where: { id },
      data: { isRead: false },
    });

    res.json({ data: message, message: 'Mensaje marcado como no leído' });
  } catch (error) {
    console.error('Error marking message as unread:', error);
    res.status(500).json({ error: 'Error al actualizar mensaje' });
  }
});

// DELETE /api/admin/messages/:id - Delete message
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.contact.delete({
      where: { id },
    });

    res.json({ message: 'Mensaje eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Error al eliminar mensaje' });
  }
});

// PATCH /api/admin/messages/read-all - Mark all messages as read
router.patch('/read-all', async (_req: Request, res: Response) => {
  try {
    await prisma.contact.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });

    res.json({ message: 'Todos los mensajes marcados como leídos' });
  } catch (error) {
    console.error('Error marking all messages as read:', error);
    res.status(500).json({ error: 'Error al actualizar mensajes' });
  }
});

export default router;
