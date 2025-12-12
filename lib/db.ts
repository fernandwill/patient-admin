import {Pool} from "pg";

declare global {
    var pool: Pool | undefined;
}

const pool = global.pool || new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false, // false for local Docker
});

if (!global.pool) {
    global.pool = pool;
}

export const query = (text: string, params?: any[]) => pool.query(text, params);
export const getClient = () => pool.connect();


