import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg; 

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for Neon
});

pool.on("connect", () => {
  console.log("Connected to PostgreSQL database");
});

// Add to db.js
export async function executeTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await callback(client);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export const query = (text, params) => pool.query(text, params);
