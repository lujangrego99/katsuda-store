import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, AdminRole } from '@prisma/client';

const prisma = new PrismaClient();

// JWT secret - en producción usar variable de entorno
const JWT_SECRET = process.env.JWT_SECRET || 'katsuda-secret-key-change-in-production';

export interface JWTPayload {
  adminId: string;
  email: string;
  role: AdminRole;
}

// Extender Request para incluir admin
declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: string;
        email: string;
        name: string;
        role: AdminRole;
      };
    }
  }
}

// Middleware de autenticación
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token de autorización requerido' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

      // Verificar que el admin existe y está activo
      const admin = await prisma.admin.findUnique({
        where: { id: decoded.adminId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
        },
      });

      if (!admin || !admin.isActive) {
        res.status(401).json({ error: 'Usuario no válido o inactivo' });
        return;
      }

      // Agregar admin al request
      req.admin = {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      };

      next();
    } catch {
      res.status(401).json({ error: 'Token inválido o expirado' });
      return;
    }
  } catch (error) {
    console.error('Error en authMiddleware:', error);
    res.status(500).json({ error: 'Error de autenticación' });
  }
}

// Helper para generar JWT
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

// Middleware para verificar rol mínimo
export function requireRole(...allowedRoles: AdminRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    if (!allowedRoles.includes(req.admin.role)) {
      res.status(403).json({ error: 'Permisos insuficientes' });
      return;
    }

    next();
  };
}
