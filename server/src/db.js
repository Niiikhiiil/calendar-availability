import postgres from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = postgres;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("error", (err) => {
  console.error("Unexpected PG error", err);
});

const db = {
  query: (text, params) => pool.query(text, params),
  pool,
};

const testConnection = async () => {
  try {
    const res = await db.query("SELECT NOW()");
    console.log("Connected! Current time:", res.rows[0].now);
  } catch (err) {
    console.error("Connection failed:", err);
  }
};

testConnection();

export default db;
