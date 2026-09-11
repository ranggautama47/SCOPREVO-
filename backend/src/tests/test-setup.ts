// Test setup: must be imported FIRST to override env for tests
// Importing env triggers dotenv.config() which re-reads .env;
// we must override the env object directly after it is created.
import { env } from '../config/env';
delete process.env.SMTP_HOST;
(env as any).SMTP_HOST = '';