import { Router, Request, Response, Router as RouterType } from 'express';
import { PrismaClient } from '@prisma/client';

const router: RouterType = Router();
const prisma = new PrismaClient();

// POST /api/contact - Submit contact form
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, province, subject, message, captchaAnswer } = req.body;

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({
        error: 'Nombre, email y mensaje son requeridos'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'El formato del email no es válido'
      });
    }

    // Simple captcha validation (server stores expected answer in session or validates simple math)
    // For this basic implementation, we expect the frontend to send the correct answer
    if (captchaAnswer === undefined || captchaAnswer === null || captchaAnswer === '') {
      return res.status(400).json({
        error: 'Por favor complete la verificación de seguridad'
      });
    }

    // Create contact message
    const contact = await prisma.contact.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        province: province || null,
        subject: subject?.trim() || null,
        message: message.trim(),
        isRead: false,
      },
    });

    res.status(201).json({
      data: contact,
      message: 'Mensaje enviado correctamente. Nos comunicaremos a la brevedad.'
    });
  } catch (error) {
    console.error('Error creating contact message:', error);
    res.status(500).json({ error: 'Error al enviar el mensaje' });
  }
});

export default router;
