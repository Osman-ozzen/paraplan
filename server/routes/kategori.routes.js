const express = require('express');
const router = express.Router();
const { useSupabase, kategoriSil } = require('../services/supabase.service');
const { readData, writeData } = require('../services/json.service');
const { authMiddleware } = require('../middleware/auth.middleware');
const { basarili, hata } = require('../utils/response');

// ─── Kategori Sil (cascade) ─────────────────────────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    if (useSupabase) {
      const sonuc = await kategoriSil(id, req.userId);
      return basarili(res, sonuc);
    } else {
      const data = readData();
      data.kategoriler = data.kategoriler.filter(k => k.id !== id);
      data.kayitlar = data.kayitlar.filter(k => k.kategoriId !== id);
      const yazildi = writeData(data);
      return basarili(res, { kategoriler: data.kategoriler, kayitlar: data.kayitlar });
    }
  } catch (err) {
    console.error('Kategori silme hatası:', err);
    return hata(res, 'Kategori silinemedi', 500, 'DELETE_ERROR');
  }
});

module.exports = router;
