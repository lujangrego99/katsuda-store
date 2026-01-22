import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes placeholder
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    message: 'Katsuda Store API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      products: '/api/products (coming soon)',
      categories: '/api/categories (coming soon)',
      cart: '/api/cart (coming soon)',
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Katsuda API running on http://localhost:${PORT}`);
});
