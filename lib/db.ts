import { Pool } from "pg";

declare global {
    var pool: Pool | undefined;
}

const isLocal =
    process.env.DATABASE_URL?.includes("localhost") ||
    process.env.DATABASE_URL?.includes("127.0.0.1") ||
    process.env.DATABASE_URL?.includes("postgres"); // Docker service name

const pool = global.pool || new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: (process.env.NODE_ENV === "production" && !isLocal) ? { rejectUnauthorized: false } : false,
});

if (!global.pool) {
    global.pool = pool;
}

export const query = (text: string, params?: any[]) => pool.query(text, params);
export const getClient = () => pool.connect();


