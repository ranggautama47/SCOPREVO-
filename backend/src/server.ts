import { env } from './config/env';
import { db } from './config/database';
import app from './app';
async function start(): Promise<void> {
  try {
    await db.query('SELECT 1');
    console.log('[DB] Connected to Supabase PostgreSQL');
  } catch (err) {
    console.error('[DB] Connection failed:', err);
    process.exit(1);
  }
  app.listen(env.PORT, () => {
    console.log(`[SERVER] SCOPREVO backend running on port ${env.PORT}`);
    console.log(`[SERVER] Environment: ${env.NODE_ENV}`);
    console.log(`[SERVER] Health: http://localhost:${env.PORT}/api/health`);
  });
}
start().catch((err) => {
  console.error('[SERVER] Fatal startup error:', err);
  process.exit(1);
});
