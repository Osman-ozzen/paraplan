const express = require('express');
const router = express.Router();
const { useSupabase, bolumEkle, bolumGuncelle, bolumSil } = require('../services/supabase.service');
const { readData, writeData } = require('../services/json.service');
const { authMiddleware } = require('../middleware/auth.middleware');
const { validateKayit } = require('../middleware/error.middleware');
const { basarili, hata } = require('../utils/response');
const { GECERLI_BOLUMLER, idOlustur } = require('../config/constants');

// ─── Bölüm Ekle ────────────────────────────────────────────────────────
router.post('/:bolum', authMiddleware, async (req, res) => {
  const { bolum } = req.params;

  if (!GECERLI_BOLUMLER.includes(bolum)) {
    return hata(res, `Geçersiz bölüm: ${bolum}`, 400, 'INVALID_BOLUM');
  }
  const hatalar = validateKayit(req.body, bolum);
  if (hatalar.length > 0) {
    return hata(res, hatalar.join(' '), 400, 'VALIDATION_ERROR');
  }

  try {
    if (useSupabase) {
      const sonuc = await bolumEkle(bolum, req.body, req.userId);
      return basarili(res, sonuc, 201);
    } else {
      const data = readData();
      if (!data[bolum]) data[bolum] = [];
      const yeni = { ...req.body, id: idOlustur() };
      data[bolum].push(yeni);
      const yazildi = writeData(data);
      return basarili(res, { [bolum]: data[bolum] }, yazildi ? 201 : 500);
    }
  } catch (err) {
    console.error(`${bolum} ekleme hatası:`, err);
    return hata(res, 'Veri eklenemedi', 500, 'INSERT_ERROR');
  }
});

// ─── Bölüm Güncelle ──────────────────────────────────────────────────
router.put('/:bolum/:id', authMiddleware, async (req, res) => {
  const { bolum, id } = req.params;

  if (!GECERLI_BOLUMLER.includes(bolum)) {
    return hata(res, `Geçersiz bölüm: ${bolum}`, 400, 'INVALID_BOLUM');
  }

  try {
    if (useSupabase) {
      const sonuc = await bolumGuncelle(bolum, id, req.body, req.userId);
      return basarili(res, sonuc);
    } else {
      const data = readData();
      const idx = (data[bolum] || []).findIndex(k => k.id === id);
      if (idx !== -1) {
        data[bolum][idx] = { ...data[bolum][idx], ...req.body };
        const yazildi = writeData(data);
        return basarili(res, { [bolum]: data[bolum] });
      }
      return hata(res, 'Kayıt bulunamadı', 404, 'NOT_FOUND');
    }
  } catch (err) {
    console.error(`${bolum} güncelleme hatası:`, err);
    return hata(res, 'Veri güncellenemedi', 500, 'UPDATE_ERROR');
  }
});

// ─── Bölüm Sil ─────────────────────────────────────────────────────────
router.delete('/:bolum/:id', authMiddleware, async (req, res) => {
  const { bolum, id } = req.params;

  if (!GECERLI_BOLUMLER.includes(bolum)) {
    return hata(res, `Geçersiz bölüm: ${bolum}`, 400, 'INVALID_BOLUM');
  }

  try {
    if (useSupabase) {
      const sonuc = await bolumSil(bolum, id, req.userId);
      return basarili(res, sonuc);
    } else {
      const data = readData();
      data[bolum] = (data[bolum] || []).filter(k => k.id !== id);
      const yazildi = writeData(data);
      return res.status(204).end();
    }
  } catch (err) {
    console.error(`${bolum} silme hatası:`, err);
    return hata(res, 'Veri silinemedi', 500, 'DELETE_ERROR');
  }
});

module.exports = router;
