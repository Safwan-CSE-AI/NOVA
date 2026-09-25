import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import planRoutes from './routes/planRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import learnRoutes from './routes/learnRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

// Ensure DB connection before processing requests (especially for serverless environments)
let isConnected = false;
app.use(async (_req, _res, next) => {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    } catch (e: any) {
      console.warn('DB initialization in middleware warning:', e.message);
    }
  }
  next();
});

// Request logger for API calls
app.use((req, _res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/plan', planRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/learned-preferences', learnRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'NOVA AI Personalization Engine',
    timestamp: new Date().toISOString(),
  });
});

// 404 Handler for API routes
app.use('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'API endpoint not found' });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal server error occurred';
  res.status(status).json({
    success: false,
    error: message,
  });
});

export default app;
