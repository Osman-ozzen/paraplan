const express = require('express');
const router = express.Router();
const { useAuth, supabaseAnon, useSupabase } = require('../services/supabase.service');
const { authMiddleware } = require('../middleware/auth.middleware');
const { hata, basarili } = require('../utils/response');

// ─── Yardımcılar ──────────────────────────────────────────────────────────
function gecerliEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function gecerliSifre(sifre) {
  return sifre && sifre.length >= 6;
}

// ─── Kayıt ────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  if (!useAuth) return hata(res, 'Auth yapılandırılmamış', 400, 'AUTH_DISABLED');
  const { email, password } = req.body;

  if (!email || !password) return hata(res, 'Email ve şifre gerekli', 400, 'VALIDATION_ERROR');
  if (!gecerliEmail(email)) return hata(res, 'Geçerli bir email adresi girin', 400, 'INVALID_EMAIL');
  if (!gecerliSifre(password)) return hata(res, 'Şifre en az 6 karakter olmalıdır', 400, 'WEAK_PASSWORD');

  try {
    const { data, error } = await supabaseAnon.auth.signUp({ email, password });
    if (error) return hata(res, error.message, 400, 'AUTH_ERROR');
    return basarili(res, { user: { id: data.user.id, email: data.user.email } }, 201);
  } catch (err) {
    return hata(res, 'Kayıt başarısız', 500, 'SERVER_ERROR');
  }
});

// ─── Giriş ────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  if (!useAuth) return hata(res, 'Auth yapılandırılmamış', 400, 'AUTH_DISABLED');
  const { email, password } = req.body;

  if (!email || !password) return hata(res, 'Email ve şifre gerekli', 400, 'VALIDATION_ERROR');

  try {
    const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
    if (error) return hata(res, 'Email veya şifre hatalı', 401, 'INVALID_CREDENTIALS');
    return basarili(res, {
      user: { id: data.user.id, email: data.user.email },
      session: data.session,
    });
  } catch (err) {
    return hata(res, 'Giriş başarısız', 500, 'SERVER_ERROR');
  }
});

// ─── Kullanıcı Bilgisi ────────────────────────────────────────────────────
router.get('/me', authMiddleware, (req, res) => {
  return basarili(res, { userId: req.userId, email: req.userEmail });
});

// ─── Eski verileri kullanıcıya ata ────────────────────────────────────────
router.post('/ata', authMiddleware, async (req, res) => {
  const { userId } = req;
  if (!useSupabase) return basarili(res, { adet: 0, mesaj: 'Supabase aktif değil' });

  try {
    const { createClient } = require('@supabase/supabase-js');
    const adminSupabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      { auth: { persistSession: false } }
    );

    const tablolar = ['kategoriler', 'kayitlar', 'borclar', 'eticaret', 'sirket_gider', 'aylik_giderler', 'hedefler'];
    let toplam = 0;
    for (const table of tablolar) {
      const { data, error } = await adminSupabase
        .from(table)
        .update({ user_id: userId })
        .eq('user_id', '')
        .select();
      if (!error && data) toplam += (data || []).length;
    }
    return basarili(res, { adet: toplam, mesaj: `${toplam} kayıt kullanıcıya aktarıldı` });
  } catch (err) {
    console.error('Veri atama hatası:', err);
    return hata(res, 'Veri atanamadı', 500, 'SERVER_ERROR');
  }
});

// ─── Çıkış ──────────────────────────────────────────────────────────────
router.post('/logout', authMiddleware, (req, res) => {
  return basarili(res, { mesaj: 'Başarıyla çıkış yapıldı' });
});

module.exports = router;
