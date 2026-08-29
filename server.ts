import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { parseMemberRecordFromText, parseBookRecordFromText, enhanceOCRWithGemini } from './server/ocrParser';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        role: 'ADMIN' | 'LIBRARIAN';
        name: string;
      };
    }
  }
}

const PORT = 3000;
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage for secure book covers & digital documents
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.webp', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPG, JPEG, WEBP, and PDF files are allowed.'));
    }
  }
});

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Serve uploads securely
  app.use('/uploads', express.static(UPLOAD_DIR));

  // In-memory session store (simple bearer token map for development and container persistence)
  const sessions = new Map<string, { userId: string; username: string; role: 'ADMIN' | 'LIBRARIAN'; name: string }>();

  // Auth Middleware
  const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For convenience in dev, default to demo session if none provided or allow guest view
      const demoUser = db.getUsers()[0];
      req.user = demoUser ? { userId: demoUser.id, username: demoUser.username, role: demoUser.role, name: demoUser.name } : undefined;
      return next();
    }
    const token = authHeader.split(' ')[1];
    const session = sessions.get(token);
    if (session) {
      req.user = session;
    } else {
      const demoUser = db.getUsers()[0];
      req.user = demoUser ? { userId: demoUser.id, username: demoUser.username, role: demoUser.role, name: demoUser.name } : undefined;
    }
    next();
  };

  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied: Admin privileges required.' });
    }
    next();
  };

  app.use(authenticate);

  // ==========================================
  // AUTH ROUTES
  // ==========================================

  app.post('/api/auth/login', (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
      }

      const user = db.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password.' });
      }

      if (!user.is_active) {
        return res.status(403).json({ error: 'Account is deactivated. Please contact the Chief Librarian.' });
      }

      const validPassword = bcrypt.compareSync(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid username or password.' });
      }

      const token = `token-${user.id}-${Date.now()}`;
      const sessionData = { userId: user.id, username: user.username, role: user.role, name: user.name };
      sessions.set(token, sessionData);

      db.addAuditLog(user.id, user.name, 'USER_LOGIN', 'USER', user.id, `User ${user.name} logged into the system.`);

      const { password_hash, ...safeUser } = user;
      return res.json({
        token,
        user: safeUser
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Login failed' });
    }
  });

  app.get('/api/auth/me', (req, res) => {
    if (!req.user) {
      const defaultAdmin = db.getUsers()[0];
      return res.json({ user: defaultAdmin });
    }
    const user = db.getUserById(req.user.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    const { password_hash, ...safeUser } = user;
    return res.json({ user: safeUser });
  });

  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      sessions.delete(token);
    }
    return res.json({ success: true, message: 'Logged out successfully' });
  });

  // ==========================================
  // DASHBOARD & STATS
  // ==========================================

  app.get('/api/dashboard', (req, res) => {
    try {
      const data = db.getDashboardData();
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // MEMBERS MANAGEMENT
  // ==========================================

  app.get('/api/members', (req, res) => {
    try {
      const { search, status, village, page, limit } = req.query;
      const result = db.getMembers({
        search: search as string,
        status: status as string,
        village: village as string,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
      });
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/members/next-number', (req, res) => {
    return res.json({ next_number: db.getNextMemberNumber() });
  });

  app.get('/api/members/:id', (req, res) => {
    try {
      const member = db.getMemberById(req.params.id);
      if (!member) return res.status(404).json({ error: 'Member not found.' });
      return res.json(member);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/members', (req, res) => {
    try {
      const currentUser = req.user ? { id: req.user.userId, name: req.user.name } : { id: 'usr-lib-01', name: 'Librarian' };
      const newMember = db.createMember(req.body, currentUser);
      return res.status(201).json(newMember);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/members/:id', (req, res) => {
    try {
      const currentUser = req.user ? { id: req.user.userId, name: req.user.name } : { id: 'usr-lib-01', name: 'Librarian' };
      const updated = db.updateMember(req.params.id, req.body, currentUser);
      return res.json(updated);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/members/:id', (req, res) => {
    try {
      const currentUser = req.user ? { id: req.user.userId, name: req.user.name } : { id: 'usr-lib-01', name: 'Librarian' };
      db.deleteMember(req.params.id, currentUser);
      return res.json({ success: true, message: 'Member deleted successfully.' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  // ==========================================
  // BOOKS MANAGEMENT
  // ==========================================

  app.get('/api/books', (req, res) => {
    try {
      const { search, category_id, status, language, sort_by, sort_order, page, limit } = req.query;
      const result = db.getBooks({
        search: search as string,
        category_id: category_id as string,
        status: status as string,
        language: language as string,
        sort_by: sort_by as any,
        sort_order: sort_order as any,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 12,
      });
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/books/next-number', (req, res) => {
    return res.json({ next_number: db.getNextBookNumber() });
  });

  app.get('/api/books/:id', (req, res) => {
    try {
      const book = db.getBookById(req.params.id);
      if (!book) return res.status(404).json({ error: 'Book not found in library catalog.' });
      return res.json(book);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/books', (req, res) => {
    try {
      const currentUser = req.user ? { id: req.user.userId, name: req.user.name } : { id: 'usr-lib-01', name: 'Librarian' };
      const newBook = db.createBook(req.body, currentUser);
      return res.status(201).json(newBook);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/books/:id', (req, res) => {
    try {
      const currentUser = req.user ? { id: req.user.userId, name: req.user.name } : { id: 'usr-lib-01', name: 'Librarian' };
      const updated = db.updateBook(req.params.id, req.body, currentUser);
      return res.json(updated);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/books/:id', (req, res) => {
    try {
      const currentUser = req.user ? { id: req.user.userId, name: req.user.name } : { id: 'usr-lib-01', name: 'Librarian' };
      db.deleteBook(req.params.id, currentUser);
      return res.json({ success: true, message: 'Book deleted from catalog.' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  // ==========================================
  // CATEGORIES
  // ==========================================

  app.get('/api/categories', (req, res) => {
    return res.json(db.getCategories());
  });

  app.post('/api/categories', requireAdmin, (req, res) => {
    try {
      const currentUser = req.user ? { id: req.user.userId, name: req.user.name } : { id: 'usr-admin-01', name: 'Admin' };
      const cat = db.createCategory(req.body, currentUser);
      return res.status(201).json(cat);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/categories/:id', requireAdmin, (req, res) => {
    try {
      const currentUser = req.user ? { id: req.user.userId, name: req.user.name } : { id: 'usr-admin-01', name: 'Admin' };
      const updated = db.updateCategory(req.params.id, req.body, currentUser);
      return res.json(updated);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.delete('/api/categories/:id', requireAdmin, (req, res) => {
    try {
      const currentUser = req.user ? { id: req.user.userId, name: req.user.name } : { id: 'usr-admin-01', name: 'Admin' };
      db.deleteCategory(req.params.id, currentUser);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  // ==========================================
  // TRANSACTIONS & CIRCULATION
  // ==========================================

  app.get('/api/transactions', (req, res) => {
    try {
      const { search, status, member_id, book_id, from_date, to_date, page, limit } = req.query;
      const result = db.getTransactions({
        search: search as string,
        status: status as string,
        member_id: member_id as string,
        book_id: book_id as string,
        from_date: from_date as string,
        to_date: to_date as string,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 15,
      });
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/transactions/issue', (req, res) => {
    try {
      const currentUser = req.user ? { id: req.user.userId, name: req.user.name } : { id: 'usr-lib-01', name: 'Librarian' };
      const result = db.issueBook(req.body, currentUser);
      return res.status(201).json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/transactions/return/:id', (req, res) => {
    try {
      const currentUser = req.user ? { id: req.user.userId, name: req.user.name } : { id: 'usr-lib-01', name: 'Librarian' };
      const { remarks } = req.body;
      const result = db.returnBook(req.params.id, remarks, currentUser);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  // ==========================================
  // OVERDUE MANAGEMENT
  // ==========================================

  app.get('/api/overdue', (req, res) => {
    try {
      const search = req.query.search as string;
      const records = db.getOverdueRecords(search);
      return res.json({
        total_overdue: records.length,
        records
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // OCR PROCESSING & EXTRACTION
  // ==========================================

  app.post('/api/ocr/parse', async (req, res) => {
    try {
      const { text, type } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text is required for OCR parsing.' });
      }

      const docType = type === 'BOOK' ? 'BOOK' : 'MEMBER';

      // 1. Run local robust Regex & entity pattern extractor
      let extracted: any = docType === 'MEMBER' ? parseMemberRecordFromText(text) : parseBookRecordFromText(text);

      // 2. If text was messy, attempt optional Gemini enhancement if key is configured
      if (process.env.GEMINI_API_KEY) {
        try {
          const enhanced = await enhanceOCRWithGemini(text, docType);
          if (enhanced) {
            extracted = { ...extracted, ...enhanced };
          }
        } catch (e) {
          // keep regex extracted values
        }
      }

      return res.json({
        success: true,
        document_type: docType,
        extracted_data: extracted,
        raw_text: text
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'OCR parsing failed.' });
    }
  });

  app.post('/api/ocr/log', (req, res) => {
    try {
      const currentUser = req.user ? { id: req.user.userId, name: req.user.name } : { id: 'usr-lib-01', name: 'Librarian' };
      const scan = db.logOCRScan(req.body, currentUser);
      return res.status(201).json(scan);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/ocr/history', (req, res) => {
    return res.json(db.getOCRScans());
  });

  // ==========================================
  // GLOBAL SEARCH
  // ==========================================

  app.get('/api/search', (req, res) => {
    try {
      const query = (req.query.q as string) || '';
      const results = db.searchAll(query);
      return res.json(results);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // REPORTS & CSV EXPORT
  // ==========================================

  app.get('/api/reports', (req, res) => {
    try {
      const { type, from, to } = req.query;
      const reportType = (type as string) || 'total_books';
      const result = db.generateReport(reportType, { from: from as string, to: to as string });
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/reports/export-csv', (req, res) => {
    try {
      const { type, from, to } = req.query;
      const reportType = (type as string) || 'total_books';
      const result = db.generateReport(reportType, { from: from as string, to: to as string });

      if (!result.data || result.data.length === 0) {
        return res.status(404).send('No data available for the selected report.');
      }

      // Convert array of objects to CSV
      const headers = Object.keys(result.data[0]);
      const csvRows = [
        headers.join(','),
        ...result.data.map(row =>
          headers.map(h => {
            const val = row[h];
            if (val === null || val === undefined) return '""';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
          }).join(',')
        )
      ];

      const csvContent = csvRows.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csvContent);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // FILE UPLOAD (Covers & Digital PDFs)
  // ==========================================

  app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded or invalid file type.' });
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      return res.json({
        success: true,
        filename: req.file.filename,
        original_name: req.file.originalname,
        size: req.file.size,
        mime_type: req.file.mimetype,
        url: fileUrl,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // ADMIN USER MANAGEMENT & SETTINGS
  // ==========================================

  app.get('/api/admin/users', requireAdmin, (req, res) => {
    return res.json(db.getUsers());
  });

  app.post('/api/admin/users', requireAdmin, (req, res) => {
    try {
      const { name, username, email, password, role } = req.body;
      if (!name || !username || !email || !password) {
        return res.status(400).json({ error: 'Name, username, email, and password are required.' });
      }
      const password_hash = bcrypt.hashSync(password, 10);
      const currentUser = req.user ? { id: req.user.userId, name: req.user.name } : { id: 'usr-admin-01', name: 'Admin' };
      const user = db.createUser({
        name,
        username,
        email,
        password_hash,
        role: role || 'LIBRARIAN',
      }, currentUser);
      return res.status(201).json(user);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.put('/api/admin/users/:id', requireAdmin, (req, res) => {
    try {
      const currentUser = req.user ? { id: req.user.userId, name: req.user.name } : { id: 'usr-admin-01', name: 'Admin' };
      const { password, ...rest } = req.body;
      const updateData: any = { ...rest };
      if (password && password.trim()) {
        updateData.password_hash = bcrypt.hashSync(password.trim(), 10);
      }
      const updated = db.updateUser(req.params.id, updateData, currentUser);
      return res.json(updated);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/admin/settings', (req, res) => {
    return res.json(db.getSettings());
  });

  app.put('/api/admin/settings', requireAdmin, (req, res) => {
    try {
      const currentUser = req.user ? { id: req.user.userId, name: req.user.name } : { id: 'usr-admin-01', name: 'Admin' };
      const updated = db.updateSettings(req.body, currentUser);
      return res.json(updated);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/admin/audit-logs', requireAdmin, (req, res) => {
    return res.json(db.getAuditLogs());
  });

  // ==========================================
  // VITE DEV MIDDLEWARE / STATIC PRODUCTION
  // ==========================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Government Digital Library System running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
});
