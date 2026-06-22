const { useAuth, supabaseAnon } = require('../services/supabase.service');

// ─── Auth Middleware ───────────────────────────────────────────────────────
async function authMiddleware(req, res, next) {
  if (!useAuth) return next();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ basarili: false, hata: 'Oturum gerekli', hataKodu: 'AUTH_REQUIRED' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ basarili: false, hata: 'Geçersiz oturum', hataKodu: 'INVALID_TOKEN' });
    }
    req.userId = user.id;
    req.userEmail = user.email;
    next();
  } catch {
    return res.status(401).json({ basarili: false, hata: 'Oturum doğrulanamadı', hataKodu: 'AUTH_ERROR' });
  }
}

module.exports = { authMiddleware };
