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
let isInitialized = false;
app.use(async (_req, _res, next) => {
  if (!isInitialized) {
    try {
      await connectDB();
    } catch (e: any) {
      console.warn('DB initialization warning:', e.message);
    } finally {
      isInitialized = true;
    }
  }
  next();
});

// Request logger for API calls
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health checks
app.get(['/', '/api/health', '/health'], (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'NOVA AI Personalization Engine',
    timestamp: new Date().toISOString(),
  });
});

// API Routes — support both /api/* and direct prefix in case serverless gateway strips /api
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/profile', '/profile'], profileRoutes);
app.use(['/api/plan', '/plan'], planRoutes);
app.use(['/api/tasks', '/tasks'], taskRoutes);
app.use(['/api/learned-preferences', '/learned-preferences'], learnRoutes);
app.use(['/api/ai', '/ai'], aiRoutes);

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
