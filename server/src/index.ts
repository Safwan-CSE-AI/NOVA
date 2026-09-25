import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

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
