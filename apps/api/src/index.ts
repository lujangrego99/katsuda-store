import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import categoriesRouter from './routes/categories';
import brandsRouter from './routes/brands';
import productsRouter from './routes/products';
import cartRouter from './routes/cart';
import checkoutRouter from './routes/checkout';
import ordersRouter from './routes/orders';
import shippingRouter from './routes/shipping';
import adminAuthRouter from './routes/admin/auth';
import adminDashboardRouter from './routes/admin/dashboard';
import adminProductsRouter from './routes/admin/products';
import adminCategoriesRouter from './routes/admin/categories';
import adminBrandsRouter from './routes/admin/brands';
import adminOrdersRouter from './routes/admin/orders';

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
app.use('/api/cart', cartRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/shipping', shippingRouter);
app.use('/api/admin', adminAuthRouter);
app.use('/api/admin/dashboard', adminDashboardRouter);
app.use('/api/admin/products', adminProductsRouter);
app.use('/api/admin/categories', adminCategoriesRouter);
app.use('/api/admin/brands', adminBrandsRouter);
app.use('/api/admin/orders', adminOrdersRouter);

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
      cart: '/api/cart',
      checkout: '/api/checkout',
      orders: '/api/orders',
      shipping: '/api/shipping',
      admin: '/api/admin',
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Katsuda API running on http://localhost:${PORT}`);
});
