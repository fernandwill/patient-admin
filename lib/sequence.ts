import {getClient} from "./db"; // pull pooled PSQL client so every call share the same connection instead of opening new sockets

type SequenceType = "RM" | "REG"; // RM = Medical Record Number, REG = Registration Number

export async function generateSequence(type: SequenceType): Promise<string> {
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const yy = String(yyyy).slice(-2); // slice and take last 2 digits of year
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0"); // month (01-12)
    const dd = String(now.getUTCDate()).padStart(2, "0"); // day (01-31)
    const dateStr = `${yy}${mm}${dd}`;
    const isoDate = `${yyyy}-${mm}-${dd}`;

    const client = await getClient();
    try {
        await client.query("BEGIN");

        const upsert = `INSERT INTO sequence_counters (sequence_date, sequence_type, last_value) VALUES ($1, $2, 1) ON CONFLICT (sequence_date, sequence_type) DO UPDATE SET last_value = sequence_counters.last_value + 1 RETURNING last_value; `; // on first insert, insert 1, on subsequent insert, increment last_value by 1 then return the new value

        const {rows} = await client.query(upsert, [isoDate, type]);
        const counter = rows[0].last_value;

        await client.query("COMMIT");

        const width = type === "RM" ? 3 : 6; // RM = 3 digits, REG = 6 digits
        const suffix = String(counter).padStart(width, "0"); // format RM sequence to 3 digits, REG sequence to 6 digits

        return `${dateStr}${suffix}`;
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}