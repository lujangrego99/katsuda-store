import { Router, Request, Response, Router as RouterType } from 'express';
import { PrismaClient } from '@prisma/client';

const router: RouterType = Router();
const prisma = new PrismaClient();

// GET /api/settings - Get public store settings
router.get('/', async (_req: Request, res: Response) => {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: 'singleton' },
      select: {
        storeName: true,
        phone: true,
        whatsapp: true,
        email: true,
        address: true,
        socialMedia: true,
        transferDiscount: true,
        schedules: true,
      },
    });

    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    res.json({ data: settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Error fetching settings' });
  }
});

export default router;
