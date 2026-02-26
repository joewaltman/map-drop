import express from 'express';
import multer from 'multer';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { nanoid } from 'nanoid';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const UPLOADS_DIR = join(__dirname, 'uploads');
const META_DIR = join(UPLOADS_DIR, 'meta');
const DIST_DIR = join(__dirname, '..', 'dist');

// Ensure upload directories exist
mkdirSync(UPLOADS_DIR, { recursive: true });
mkdirSync(META_DIR, { recursive: true });

const app = express();

// Security headers (allow inline scripts for GA, allow GA and Facebook domains)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com", "https://www.google-analytics.com"],
      imgSrc: ["'self'", "data:", "https://www.google-analytics.com"],
      connectSrc: ["'self'", "https://www.google-analytics.com", "https://analytics.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

// Compression
app.use(compression());

// CORS
app.use(cors());

app.use(express.json());

// Rate limit for uploads: 10 per 15 minutes per IP
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many uploads, try again later' },
});

// Multer config: 2MB limit, store PNGs in uploads/
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => cb(null, `${nanoid(10)}.png`),
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    cb(null, file.mimetype === 'image/png');
  },
});

// Derive the public base URL from the request if BASE_URL is not explicitly set
function getBaseUrl(req) {
  if (process.env.BASE_URL) return process.env.BASE_URL;
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

// Health check
app.get('/health', (req, res) => res.send('ok'));

// POST /api/share — accept PNG + metadata, return share URL
app.post('/api/share', uploadLimiter, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  const id = req.file.filename.replace('.png', '');
  const metadata = {
    dayNumber: req.body.dayNumber || '?',
    totalKm: req.body.totalKm || '0',
    elapsedMs: req.body.elapsedMs || '0',
    breakdown: req.body.breakdown || '',
    createdAt: Date.now(),
  };

  writeFileSync(join(META_DIR, `${id}.json`), JSON.stringify(metadata));

  const baseUrl = getBaseUrl(req);
  const shareUrl = `${baseUrl}/share/${id}`;

  // Pre-scrape: tell Facebook to crawl the share page now so the OG image
  // is cached before the user opens the share dialog.
  if (process.env.FB_APP_ID && process.env.FB_APP_SECRET) {
    try {
      const token = `${process.env.FB_APP_ID}|${process.env.FB_APP_SECRET}`;
      const fbRes = await fetch(
        `https://graph.facebook.com/v19.0/?id=${encodeURIComponent(shareUrl)}&scrape=true&access_token=${token}`,
        { method: 'POST' }
      );
      const fbData = await fbRes.json();
      console.log('Facebook pre-scrape:', fbData.id ? 'success' : fbData);
    } catch (err) {
      console.error('Facebook pre-scrape failed:', err.message);
    }
  }

  res.json({ shareUrl });
});

// GET /share/:id — serve HTML with OG meta tags for Facebook crawler
app.get('/share/:id', (req, res) => {
  const { id } = req.params;
  const metaPath = join(META_DIR, `${id}.json`);
  const imagePath = join(UPLOADS_DIR, `${id}.png`);

  if (!existsSync(metaPath) || !existsSync(imagePath)) {
    return res.status(404).send('Share not found');
  }

  const baseUrl = getBaseUrl(req);
  const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
  const imageUrl = `${baseUrl}/api/images/${id}.png`;
  const title = `DailyPin #${meta.dayNumber} — ${Number(meta.totalKm).toLocaleString('en-US')} km`;
  const description = meta.breakdown || 'How well do you know the world? Play DailyPin daily!';

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'no-cache');
  res.send(`<!DOCTYPE html>
<html prefix="og: http://ogp.me/ns#">
<head>
  <meta charset="utf-8">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:type" content="image/png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${baseUrl}/share/${id}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${imageUrl}">
  <title>${escapeHtml(title)}</title>
  <meta http-equiv="refresh" content="3;url=${baseUrl}">
  <style>
    body { background: #1a2332; color: #e2e8f0; font-family: system-ui, -apple-system, sans-serif;
           display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .container { text-align: center; }
    h1 { font-size: 32px; margin-bottom: 8px; }
    p { color: #94a3b8; font-size: 18px; }
    img { max-width: 600px; width: 90%; border-radius: 12px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${escapeHtml(title)}</h1>
    <p>Redirecting to DailyPin...</p>
    <img src="${imageUrl}" alt="DailyPin Results">
  </div>
</body>
</html>`);
});

// GET /api/images/:filename — serve stored PNG files
app.get('/api/images/:filename', (req, res) => {
  const filePath = join(UPLOADS_DIR, req.params.filename);
  if (!existsSync(filePath)) {
    return res.status(404).send('Image not found');
  }
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=604800');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(filePath);
});

// Serve Vite's built static assets with long-term caching (files are content-hashed)
if (existsSync(join(DIST_DIR, 'assets'))) {
  app.use('/assets', express.static(join(DIST_DIR, 'assets'), {
    maxAge: '1y',
    immutable: true,
  }));
}

// Serve remaining static files (index.html, favicon, etc.) with short cache
if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR, {
    maxAge: '1h',
  }));
}

// SPA catch-all (after /share/:id route)
app.get('*', (req, res) => {
  const indexPath = join(DIST_DIR, 'index.html');
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Not found — run "npm run build" first');
  }
});

// Image cleanup: delete files older than 7 days
function cleanupOldFiles() {
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  for (const dir of [UPLOADS_DIR, META_DIR]) {
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir)) {
      const filePath = join(dir, file);
      try {
        const stat = statSync(filePath);
        if (stat.isFile() && now - stat.mtimeMs > maxAge) {
          unlinkSync(filePath);
        }
      } catch {
        // skip files that can't be read
      }
    }
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Run cleanup on startup and every 6 hours
cleanupOldFiles();
setInterval(cleanupOldFiles, 6 * 60 * 60 * 1000);

app.listen(PORT, () => {
  const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
  console.log(`DailyPin server running at ${baseUrl}`);
});
