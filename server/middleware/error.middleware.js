const isProd = process.env.NODE_ENV === 'production';

// ─── Input Validasyonu ────────────────────────────────────────────────────
function validateKayit(body, bolum) {
  const errors = [];
  if (body.tutar !== undefined && isNaN(Number(body.tutar))) {
    errors.push('Tutar geçerli bir sayı olmalıdır.');
  }
  if (body.tur && !['gelir', 'gider'].includes(body.tur)) {
    errors.push('Tur yalnızca "gelir" veya "gider" olabilir.');
  }
  if (body.durum && !['odendi', 'odenmedi', 'devam', 'tamamlandi'].includes(body.durum)) {
    errors.push('Geçersiz durum değeri.');
  }
  if (body.tarih && isNaN(Date.parse(body.tarih))) {
    errors.push('Tarih geçerli bir tarih formatında olmalıdır.');
  }
  return errors;
}

// ─── Merkezi Hata Yakalama ──────────────────────────────────────────────
function errorHandler(err, req, res, next) {
  console.error(`[${req.method}] ${req.path}:`, err.message);
  res.status(err.status || 500).json({
    basarili: false,
    hata: isProd ? 'Beklenmeyen bir hata oluştu' : err.message,
    hataKodu: err.code || 'SERVER_ERROR',
  });
}

module.exports = { validateKayit, errorHandler };
