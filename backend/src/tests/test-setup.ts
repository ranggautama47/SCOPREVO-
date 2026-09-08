// Test setup: must be imported FIRST to disable SMTP for tests
// This runs before any other imports that trigger env.ts
delete process.env.SMTP_HOST;