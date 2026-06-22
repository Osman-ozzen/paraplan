const express = require('express');
const router = express.Router();
const { useSupabase, veriOku } = require('../services/supabase.service');
const { readData, writeData } = require('../services/json.service');
const { authMiddleware } = require('../middleware/auth.middleware');
const { basarili, hata } = require('../utils/response');

// ─── Tüm Veriyi Oku ─────────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (useSupabase) {
      const data = await veriOku(req.userId);
      return basarili(res, data);
    } else {
      return basarili(res, readData());
    }
  } catch (err) {
    console.error('Veri okuma hatası:', err);
    return hata(res, 'Veri okunamadı', 500, 'DATA_READ_ERROR');
  }
});

// ─── Veri Yaz (JSON modu için) ──────────────────────────────────────────
router.post('/', (req, res) => {
  if (useSupabase) {
    return basarili(res, { mesaj: 'Supabase modunda manuel yazma gerekmez' });
  } else {
    const basariliMi = writeData(req.body);
    return basarili(res, { basarili: basariliMi });
  }
});

module.exports = router;
