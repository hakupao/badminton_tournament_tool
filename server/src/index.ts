
import fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { db } from './db';
import {
    tournamentConfigs,
    players,
    formations,
    matches,
    schedules,
    timeSlots,
    defaultImportState
} from './db/schema';
import { eq } from 'drizzle-orm';
import fastifyStatic from '@fastify/static';
import path from 'path';

dotenv.config();

const app = fastify({ logger: true });

app.register(cors, {
    origin: true, // Allow all origins for local NAS convenience, or lock down later
});

// Middleware to check authentication (Simplified for NAS)
// We assume a single user 'admin' with a fixed ID
const ADMIN_USER_ID = '00000000-0000-0000-0000-000000000000';

// Serve Static Files (Frontend) in Production
if (process.env.NODE_ENV === 'production' || process.env.SERVE_STATIC === 'true') {
    app.register(fastifyStatic, {
        root: path.join(__dirname, '../public'),
        prefix: '/',
    });

    // SPA Fallback
    app.setNotFoundHandler((req, reply) => {
        if (req.raw.url?.startsWith('/api')) {
            reply.code(404).send({ error: 'Endpoint not found' });
            return;
        }
        reply.sendFile('index.html');
    });
}

app.get('/health', async () => {
    return { status: 'ok' };
});

// Auth Routes
app.post('/api/auth/login', async (request, reply) => {
    const { password } = request.body as { password: string };
    if (password === process.env.ADMIN_PASSWORD) {
        return {
            session: {
                access_token: 'local-token',
                user: {
                    id: ADMIN_USER_ID,
                    email: 'admin@local.nas',
                },
            },
        };
    }
    return reply.code(401).send({ error: 'Invalid password' });
});

// Data Routes

// Config
app.get('/api/config', async (request) => {
    const result = await db.select().from(tournamentConfigs).where(eq(tournamentConfigs.user_id, ADMIN_USER_ID)).limit(1);
    return result[0] || null;
});

app.post('/api/config', async (request) => {
    const body = request.body as any;
    // Upsert logic
    await db.delete(tournamentConfigs).where(eq(tournamentConfigs.user_id, ADMIN_USER_ID));
    const result = await db.insert(tournamentConfigs).values({ ...body, user_id: ADMIN_USER_ID }).returning();
    return result[0];
});

// Players
app.get('/api/players', async () => {
    return db.select().from(players).where(eq(players.user_id, ADMIN_USER_ID));
});

app.post('/api/players', async (request) => {
    const body = request.body as any[]; // Expect array
    await db.delete(players).where(eq(players.user_id, ADMIN_USER_ID));
    if (body.length > 0) {
        const rows = body.map(p => ({ ...p, user_id: ADMIN_USER_ID }));
        const result = await db.insert(players).values(rows).returning();
        return result;
    }
    return [];
});

// Formations
app.get('/api/formations', async () => {
    return db.select().from(formations).where(eq(formations.user_id, ADMIN_USER_ID));
});

app.post('/api/formations', async (request) => {
    const body = request.body as any[];
    await db.delete(formations).where(eq(formations.user_id, ADMIN_USER_ID));
    if (body.length > 0) {
        const rows = body.map(f => ({ ...f, user_id: ADMIN_USER_ID }));
        const result = await db.insert(formations).values(rows).returning();
        return result;
    }
    return [];
});

// Matches
app.get('/api/matches', async () => {
    return db.select().from(matches).where(eq(matches.user_id, ADMIN_USER_ID));
});

app.post('/api/matches', async (request) => {
    const body = request.body as any[];
    await db.delete(matches).where(eq(matches.user_id, ADMIN_USER_ID));
    if (body.length > 0) {
        const rows = body.map(m => ({ ...m, user_id: ADMIN_USER_ID }));
        const result = await db.insert(matches).values(rows).returning();
        return result;
    }
    return [];
});

// Schedule
app.get('/api/schedule', async () => {
    return db.select().from(schedules).where(eq(schedules.user_id, ADMIN_USER_ID));
});

app.post('/api/schedule', async (request) => {
    const body = request.body as any[];
    await db.delete(schedules).where(eq(schedules.user_id, ADMIN_USER_ID));
    if (body.length > 0) {
        const rows = body.map(s => ({ ...s, user_id: ADMIN_USER_ID }));
        const result = await db.insert(schedules).values(rows).returning();
        return result;
    }
    return [];
});

// TimeSlots
app.get('/api/time-slots', async () => {
    return db.select().from(timeSlots).where(eq(timeSlots.user_id, ADMIN_USER_ID));
});

app.post('/api/time-slots', async (request) => {
    const body = request.body as any[];
    await db.delete(timeSlots).where(eq(timeSlots.user_id, ADMIN_USER_ID));
    if (body.length > 0) {
        const rows = body.map(t => ({ ...t, user_id: ADMIN_USER_ID }));
        const result = await db.insert(timeSlots).values(rows).returning();
        return result;
    }
    return [];
});

// Import State
app.get('/api/import-state', async () => {
    const result = await db.select().from(defaultImportState).where(eq(defaultImportState.user_id, ADMIN_USER_ID)).limit(1);
    return result[0] || null;
});

app.post('/api/import-state', async (request) => {
    const body = request.body as any;
    await db.insert(defaultImportState)
        .values({ ...body, user_id: ADMIN_USER_ID })
        .onConflictDoUpdate({
            target: defaultImportState.user_id,
            set: { ...body, imported_at: new Date() }
        })
        .returning();
    return body;
});


const start = async () => {
    try {
        const port = parseInt(process.env.PORT || '3000');
        await app.listen({ port, host: '0.0.0.0' });
        console.log(`Server listening on port ${port}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
