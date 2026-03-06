import express from 'express';
import { createServer as createViteServer } from 'vite';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { db } from './src/db';
import { subjects, categories, records } from './src/db/schema';
import { eq, desc, and } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-exam-tracker';
const APP_PASSWORD = process.env.APP_PASSWORD || '123456';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // --- Auth Middleware ---
  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      jwt.verify(token, JWT_SECRET);
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };

  // --- Auth API ---
  app.post('/api/auth/login', (req, res) => {
    const { password } = req.body;
    if (password === APP_PASSWORD) {
      const token = jwt.sign({ authenticated: true }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      res.json({ success: true });
    } else {
      res.status(401).json({ error: 'Invalid password' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.json({ success: true });
  });

  app.get('/api/auth/check', (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) {
      return res.json({ authenticated: false });
    }
    try {
      jwt.verify(token, JWT_SECRET);
      res.json({ authenticated: true });
    } catch (err) {
      res.json({ authenticated: false });
    }
  });

  // --- Subjects API ---
  app.get('/api/subjects', requireAuth, async (req, res) => {
    const allSubjects = await db.select().from(subjects).orderBy(subjects.createdAt);
    res.json(allSubjects);
  });

  app.post('/api/subjects', requireAuth, async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    
    const result = await db.insert(subjects).values({
      name,
      createdAt: new Date(),
    }).returning();
    res.json(result[0]);
  });

  app.delete('/api/subjects/:id', requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    await db.delete(subjects).where(eq(subjects.id, id));
    res.json({ success: true });
  });

  // --- Categories API ---
  app.get('/api/categories', requireAuth, async (req, res) => {
    const allCategories = await db.select().from(categories).orderBy(categories.createdAt);
    res.json(allCategories);
  });

  app.post('/api/categories', requireAuth, async (req, res) => {
    const { name, subjectId } = req.body;
    if (!name || !subjectId) return res.status(400).json({ error: 'Name and subjectId are required' });
    
    const result = await db.insert(categories).values({
      name,
      subjectId: parseInt(subjectId),
      createdAt: new Date(),
    }).returning();
    res.json(result[0]);
  });

  app.delete('/api/categories/:id', requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    await db.delete(categories).where(eq(categories.id, id));
    res.json({ success: true });
  });

  // --- Records API ---
  app.get('/api/records', requireAuth, async (req, res) => {
    const allRecords = await db.select().from(records).orderBy(desc(records.date));
    res.json(allRecords);
  });

  app.post('/api/records', requireAuth, async (req, res) => {
    const { 
      date, subjectId, categoryId, isAssignedGrading, 
      score, rawScore, assignedScore, classRank, gradeRank, 
      reflection, peerScores 
    } = req.body;

    if (!date || !subjectId || !categoryId) {
      return res.status(400).json({ error: 'Date, subjectId, and categoryId are required' });
    }

    const result = await db.insert(records).values({
      date: new Date(date),
      subjectId: parseInt(subjectId),
      categoryId: parseInt(categoryId),
      isAssignedGrading: Boolean(isAssignedGrading),
      score: score ? parseFloat(score) : null,
      rawScore: rawScore ? parseFloat(rawScore) : null,
      assignedScore: assignedScore ? parseFloat(assignedScore) : null,
      classRank: classRank ? parseInt(classRank) : null,
      gradeRank: gradeRank ? parseInt(gradeRank) : null,
      reflection: reflection || null,
      peerScores: peerScores ? JSON.stringify(peerScores) : null,
    }).returning();
    
    res.json(result[0]);
  });

  app.delete('/api/records/:id', requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    await db.delete(records).where(eq(records.id, id));
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
