// ─── Standart Response Wrapper ─────────────────────────────────────────
function basarili(res, veri, status = 200, meta = {}) {
  return res.status(status).json({
    basarili: true,
    veri,
    meta: { timestamp: new Date().toISOString(), ...meta },
  });
}

function hata(res, mesaj, status = 400, kod = 'HATA', detay = null) {
  const body = { basarili: false, hata: mesaj, hataKodu: kod };
  if (detay) body.detay = detay;
  return res.status(status).json(body);
}

module.exports = { basarili, hata };
