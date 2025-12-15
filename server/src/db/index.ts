
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function connect() {
    await client.connect();
}

connect().catch((err) => {
    console.error('Failed to connect to database', err);
});

export const db = drizzle(client, { schema });
