// ═══ ParaPlan Express App ═══════════════════════════════════════════════════
// Yüklenmemiş bağımlılıkları yükle
if (process.env.NODE_ENV !== 'production') {
  try { require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') }); } catch {}
}

const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// ═══════════════════════════════════════════════════════════════════════════
//  GLOBAL MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

// Güvenlik Header'ları
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS
const CORS_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3001',
  'http://localhost:4173',
  'capacitor://localhost',
  'ionic://localhost',
];
app.use(cors({
  origin: (origin, cb) => {
    // Originsiz isteklere izin ver (curl, server-to-server, PWA)
    if (!origin) return cb(null, true);
    // Localhost, capacitor ve ionic'e izin ver
    if (CORS_ORIGINS.some(o => origin.startsWith(o))) return cb(null, true);
    // Railway/Render domain'lerine izin ver
    if (origin.includes('.up.railway.app') || origin.includes('.onrender.com')) return cb(null, true);
    // Geliştirme modunda herkese açık
    if (!isProd) return cb(null, true);
    cb(new Error('CORS: Bu kaynağa izin verilmiyor'));
  },
  credentials: true,
}));

// Body Parser
app.set('trust proxy', 1); // Railway/Render proxy desteği
app.use(express.json({ limit: '1mb' }));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 100 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { basarili: false, hata: 'Çok fazla istek, lütfen bekleyin.', hataKodu: 'RATE_LIMIT' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { basarili: false, hata: 'Çok fazla giriş denemesi. 15 dakika bekleyin.', hataKodu: 'AUTH_RATE_LIMIT' },
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ═══════════════════════════════════════════════════════════════════════════
//  ROUTES
// ═══════════════════════════════════════════════════════════════════════════

const authRoutes = require('./routes/auth.routes');
const veriRoutes = require('./routes/veri.routes');
const bolumRoutes = require('./routes/bolum.routes');
const kategoriRoutes = require('./routes/kategori.routes');

app.use('/api/auth', authRoutes);
app.use('/api/veri', veriRoutes);
app.use('/api', bolumRoutes);
app.use('/api/kategori', kategoriRoutes);

// Health Check
app.get('/health', (req, res) => {
  const { useSupabase, useAuth } = require('./services/supabase.service');
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    uptime: process.uptime(),
    db: useSupabase ? 'supabase' : 'json',
    auth: useAuth ? 'active' : 'disabled',
  });
});

// Statik Dosyalar
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// SPA Fallback (Express 5 uyumlu)
app.use((req, res) => {
  if (req.path.startsWith('/api/') || req.path === '/health') return;
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).json({
      mesaj: 'ParaPlan Sunucusu Çalışıyor',
      api: '/api/veri',
      health: '/health',
    });
  }
});

// Hata Yakalama
const { errorHandler } = require('./middleware/error.middleware');
app.use(errorHandler);

module.exports = app;
