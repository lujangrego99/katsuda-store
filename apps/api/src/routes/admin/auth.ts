import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authMiddleware, generateToken, JWTPayload } from '../../middleware/auth';

const router: RouterType = Router();
const prisma = new PrismaClient();

// POST /api/admin/login - Login con JWT
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    // Buscar admin por email
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!admin) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!admin.isActive) {
      return res.status(401).json({ error: 'Usuario desactivado' });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, admin.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Actualizar último login
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    });

    // Generar token JWT
    const payload: JWTPayload = {
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
    };

    const token = generateToken(payload);

    res.json({
      data: {
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
      },
      message: 'Login exitoso',
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// GET /api/admin/me - Datos del admin actual
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    // El admin ya está en req.admin gracias al middleware
    if (!req.admin) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Obtener datos frescos del admin
    const admin = await prisma.admin.findUnique({
      where: { id: req.admin.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin no encontrado' });
    }

    res.json({
      data: admin,
    });
  } catch (error) {
    console.error('Error obteniendo admin:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

export default router;
