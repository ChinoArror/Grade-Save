import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, desc } from 'drizzle-orm';
import { subjects, categories, records, users } from './src/db/schema';
import { ensureTables } from './src/db/init';

type Bindings = {
    DB: D1Database;
    ASSETS: Fetcher;
    SSO_SECRET: string;
    APP_ID: string;
};

type Variables = {
    userUuid: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Auth Middleware
app.use('/api/*', async (c, next) => {
    // Allow SSO callback unauthenticated
    if (c.req.path === '/api/sso-callback') {
        return next();
    }

    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    // We don't parse the JWT ourselves locally to check signature. We just check if user with this token is in DB
    const db = drizzle(c.env.DB);
    const user = await db.select().from(users).where(eq(users.token, token)).get();

    if (!user) {
        return c.json({ error: 'Unauthorized locally. Please re-login.' }, 401);
    }

    c.set('userUuid', user.uuid);
    return next();
});

// SSO Callback API
app.post('/api/sso-callback', async (c) => {
    let token: string;
    try {
        const body = await c.req.json<{ token: string }>();
        token = body?.token;
        if (!token) throw new Error("No token");
    } catch {
        return c.json({ success: false, message: 'Invalid request body' }, 400);
    }

    let verifyRes: Response;
    let verifyErr = '';
    try {
        verifyRes = await fetch(`https://accounts.aryuki.com/api/verify?app_id=${c.env.APP_ID}`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(6000),
        });

        if (!verifyRes.ok) {
            let errBody: any = {};
            try { errBody = await verifyRes.json(); } catch { }
            verifyErr = errBody?.error || `HTTP ${verifyRes.status}`;
            return c.json({ success: false, message: verifyErr }, 403);
        }
    } catch (fetchErr: any) {
        return c.json({ success: false, message: `Network error: ${fetchErr?.message}` }, 502);
    }

    const { user } = await verifyRes.json() as any;
    const { uuid, user_id, name, username } = user;

    try {
        // Make sure tables are generated! D1 raw SQL
        await ensureTables(c.env.DB);
    } catch (err: any) {
        return c.json({ success: false, message: `Init DB error: ${err.message}` }, 500);
    }

    try {
        const db = drizzle(c.env.DB);
        const existing = await db.select().from(users).where(eq(users.uuid, uuid)).get();

        const now = new Date().toISOString();
        if (existing) {
            await db.update(users).set({
                token,
                lastSeen: now,
                name,
                username,
                userId: user_id
            }).where(eq(users.uuid, uuid));
        } else {
            await db.insert(users).values({
                uuid,
                userId: user_id,
                name,
                username,
                token,
                firstSeen: now,
                lastSeen: now,
            });
        }

        return c.json({ success: true, user: { uuid, name, username }, token });
    } catch (dbErr: any) {
        return c.json({ success: false, message: `Database error: ${dbErr?.message}` }, 500);
    }
});

// --- Subjects API ---
app.get('/api/subjects', async (c) => {
    const userUuid = c.get('userUuid');
    const db = drizzle(c.env.DB);
    const allSubjects = await db.select().from(subjects).where(eq(subjects.userUuid, userUuid));
    return c.json(allSubjects);
});

app.post('/api/subjects', async (c) => {
    const userUuid = c.get('userUuid');
    const { name } = await c.req.json();
    if (!name) return c.json({ error: 'Name is required' }, 400);

    const db = drizzle(c.env.DB);
    const result = await db.insert(subjects).values({
        userUuid,
        name,
        createdAt: new Date(),
    }).returning();
    return c.json(result[0]);
});

app.delete('/api/subjects/:id', async (c) => {
    const userUuid = c.get('userUuid');
    const id = parseInt(c.req.param('id'));
    const db = drizzle(c.env.DB);
    await db.delete(subjects).where(and(eq(subjects.id, id), eq(subjects.userUuid, userUuid)));
    return c.json({ success: true });
});

// --- Categories API ---
app.get('/api/categories', async (c) => {
    const userUuid = c.get('userUuid');
    const db = drizzle(c.env.DB);
    const allCategories = await db.select().from(categories).where(eq(categories.userUuid, userUuid));
    return c.json(allCategories);
});

app.post('/api/categories', async (c) => {
    const userUuid = c.get('userUuid');
    const { name, subjectId } = await c.req.json();
    if (!name || !subjectId) return c.json({ error: 'Name and subjectId are required' }, 400);

    const db = drizzle(c.env.DB);
    const result = await db.insert(categories).values({
        userUuid,
        name,
        subjectId: parseInt(subjectId),
        createdAt: new Date(),
    }).returning();
    return c.json(result[0]);
});

app.delete('/api/categories/:id', async (c) => {
    const userUuid = c.get('userUuid');
    const id = parseInt(c.req.param('id'));
    const db = drizzle(c.env.DB);
    await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userUuid, userUuid)));
    return c.json({ success: true });
});

// --- Records API ---
app.get('/api/records', async (c) => {
    const userUuid = c.get('userUuid');
    const db = drizzle(c.env.DB);
    const allRecords = await db.select().from(records).where(eq(records.userUuid, userUuid)).orderBy(desc(records.date));
    return c.json(allRecords);
});

app.post('/api/records', async (c) => {
    const userUuid = c.get('userUuid');
    const body = await c.req.json();
    const {
        date, subjectId, categoryId, isAssignedGrading,
        score, rawScore, assignedScore, classRank, gradeRank,
        reflection, peerScores
    } = body;

    if (!date || !subjectId || !categoryId) {
        return c.json({ error: 'Date, subjectId, and categoryId are required' }, 400);
    }

    const db = drizzle(c.env.DB);
    const result = await db.insert(records).values([{
        userUuid: userUuid as string,
        date: new Date(date),
        subjectId: parseInt(subjectId),
        categoryId: parseInt(categoryId),
        isAssignedGrading: Boolean(isAssignedGrading),
        score: score ? parseFloat(score) : null,
        rawScore: rawScore ? parseFloat(rawScore) : null,
        assignedScore: assignedScore ? parseFloat(assignedScore) : null,
        classRank: classRank ? parseInt(classRank) : null,
        gradeRank: gradeRank ? parseInt(gradeRank) : null,
        reflection: reflection ? String(reflection) : null,
        peerScores: peerScores && peerScores.length > 0 ? JSON.stringify(peerScores) : null,
    } as any]).returning();

    return c.json(result[0]);
});

app.delete('/api/records/:id', async (c) => {
    const userUuid = c.get('userUuid');
    const id = parseInt(c.req.param('id'));
    const db = drizzle(c.env.DB);
    await db.delete(records).where(and(eq(records.id, id), eq(records.userUuid, userUuid)));
    return c.json({ success: true });
});

app.notFound(async (c) => {
    // Pass to frontend SPA for routing
    return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
