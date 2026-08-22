const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

async function test() {
  try {
    const passwordHash = await bcrypt.hash('password123', 12);
    const result = await pool.query(
      `INSERT INTO account (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, password_hash, created_at`,
      ['Test User A', 'testusera@example.com', passwordHash]
    );
    console.log('Created:', result.rows[0]);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}
test();