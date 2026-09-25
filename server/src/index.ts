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
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

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

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Global Error Handler - never leak stack traces to client
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal server error occurred';
  res.status(status).json({
    success: false,
    error: message,
  });
});

// Start Server
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`  NOVA Personalization Server running on :${PORT}`);
      console.log(`  Personalization Engine: ACTIVE`);
      console.log(`  AI Fallback System: ENABLED`);
      console.log(`===============================================`);
    });
  } catch (error: any) {
    console.error('Failed to initialize NOVA server:', error.message);
    process.exit(1);
  }
}

startServer();
