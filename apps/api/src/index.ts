import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import categoriesRouter from './routes/categories';
import brandsRouter from './routes/brands';
import productsRouter from './routes/products';

const app: Express = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', timestamp: new Date().toISOString() });
  }
});

// API routes
app.use('/api/categories', categoriesRouter);
app.use('/api/brands', brandsRouter);
app.use('/api/products', productsRouter);

// API info
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    message: 'Katsuda Store API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      categories: '/api/categories',
      brands: '/api/brands',
      products: '/api/products',
      cart: '/api/cart (coming soon)',
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Katsuda API running on http://localhost:${PORT}`);
});
