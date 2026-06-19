import React, { useState, useMemo, useEffect } from 'react';

const tl = (t) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(t);
const fTarih = (t) => new Date(t).toLocaleDateString('tr-TR');
const fTarihKisa = (t) => new Date(t).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });

const platformlar = ['Trendyol', 'Hepsiburada', 'Amazon', 'N11', 'ÇiçekSepeti', 'Shopier', 'Etsy', 'Shopify', 'Kendi Sitem', 'Diğer'];

const kategoriler = ['Giyim & Moda', 'Elektronik', 'Kozmetik', 'Gıda', 'Kitap & Kırtasiye', 'Ev & Yaşam', 'Spor & Outdoor', 'Diğer'];

// ─── Platform komisyon bilgileri (2026 güncel) ──────────────────────────
const PLATFORM_BILGI = {
  Trendyol:     { komisyon: 19, kdvOran: null, not: 'KDV hariç fiyattan + hizmet bedeli ~7 TL' },
  Hepsiburada: { komisyon: 18, kdvOran: null, not: 'KDV dahil fiyattan, ödeme 28-45 gün' },
  Amazon:      { komisyon: 15, kdvOran: null, not: '14 günde ödeme' },
  N11:         { komisyon: 14, kdvOran: null, not: 'KDV dahil fiyattan' },
  'ÇiçekSepeti': { komisyon: 22, kdvOran: null, not: 'Moda kategorisi, KDV dahil' },
  Shopier:     { komisyon: 4.5, kdvOran: null, not: 'Ödeme işlem ücreti ~2,50 TL + %4,5' },
  Etsy:        { komisyon: 6.5, kdvOran: null, not: '+ $0,20 listeleme ücreti' },
  Shopify:     { komisyon: 2.9, kdvOran: null, not: '+ 3 TL işlem başı' },
  'Kendi Sitem': { komisyon: 0, kdvOran: null, not: 'Platform yok' },
  Diğer:       { komisyon: 0, kdvOran: null, not: '' },
};

// ─── Kategori bazlı devlet kesinti profilleri ──────────────────────────
const KATEGORI_VERGI = {
  'Giyim & Moda':     { kdv: 20, stopaj: 0, otv: 0, not: '' },
  'Elektronik':       { kdv: 20, stopaj: 0, otv: 0, not: 'Bazı ürünlerde ÖTV eklenebilir' },
  'Kozmetik':         { kdv: 20, stopaj: 0, otv: 0, not: '' },
  'Gıda':             { kdv: 10, stopaj: 0, otv: 0, not: 'Temel gıda %10, işlenmiş %20' },
  'Kitap & Kırtasiye': { kdv: 10, stopaj: 0, otv: 0, not: '' },
  'Ev & Yaşam':       { kdv: 20, stopaj: 0, otv: 0, not: '' },
  'Spor & Outdoor':   { kdv: 20, stopaj: 0, otv: 0, not: '' },
  'Diğer':            { kdv: 20, stopaj: 0, otv: 0, not: '' },
};

// KKDF: Taksitli satışlarda uygulanır
const KKDF_ORANLARI = { '0': 0, '3': 0, '6': 5, '9': 10, '12': 15 };

const varsayilan = {
  urunAd: '',
  kategori: '',
  platform: '',
  satisFiyat: '',
  urunMaliyet: '',
  komisyonOran: '',
  kargo: '',
  // Kategoriye göre otomatik dolacak
  kdvOran: '20',
  stopajOran: '0',
  otvOran: '0',
  // Taksit bazlı KKDF
  taksit: '0',
  kkdfOran: '0',
  not: '',
  tarih: new Date().toISOString().split('T')[0],
};

export default function ETicaret({ data, api }) {
  const [liste, setListe] = useState(data || []);
  useEffect(() => { setListe(data || []); }, [data]);
  const [form, setForm] = useState(varsayilan);
  const [ekleniyor, setEkleniyor] = useState(false);
  const [duzenlenen, setDuzenlenen] = useState(null);
  const [platformFiltre, setPlatformFiltre] = useState('tumu');
  const [arama, setArama] = useState('');

  const h = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // ─── Platform seçilince komisyon otomatik ─────────────────────────────
  useEffect(() => {
    if (!form.platform || duzenlenen) return;
    const bilgi = PLATFORM_BILGI[form.platform];
    if (bilgi) setForm((prev) => ({ ...prev, komisyonOran: String(bilgi.komisyon) }));
  }, [form.platform]);

  // ─── Kategori seçilince KDV/vergi otomatik ────────────────────────────
  useEffect(() => {
    if (!form.kategori || duzenlenen) return;
    const v = KATEGORI_VERGI[form.kategori];
    if (v) setForm((prev) => ({ ...prev, kdvOran: String(v.kdv), stopajOran: String(v.stopaj), otvOran: String(v.otv) }));
  }, [form.kategori]);

  // ─── Taksit seçilince KKDF otomatik ───────────────────────────────────
  useEffect(() => {
    const kkdfOran = KKDF_ORANLARI[form.taksit] || 0;
    setForm((prev) => ({ ...prev, kkdfOran: String(kkdfOran) }));
  }, [form.taksit]);

  // ─── Canlı hesaplama ────────────────────────────────────────────────────
  const hesapla = useMemo(() => {
    const satis = parseFloat(form.satisFiyat) || 0;
    const maliyet = parseFloat(form.urunMaliyet) || 0;
    const komOran = parseFloat(form.komisyonOran) || 0;
    const kargo = parseFloat(form.kargo) || 0;
    const kdvOran = parseFloat(form.kdvOran) || 0;
    const stopajOran = parseFloat(form.stopajOran) || 0;
    const otvOran = parseFloat(form.otvOran) || 0;

    // Platform komisyonu
    const komisyonTut = satis * (komOran / 100);

    // KDV: KDV dahil fiyattan KDV tutarını çıkar
    const kdvHaric = kdvOran > 0 ? satis / (1 + kdvOran / 100) : satis;
    const kdvTut = satis - kdvHaric;

    // Stopaj (KDV hariç tutar üzerinden)
    const stopajTut = kdvHaric * (stopajOran / 100);

    // ÖTV (varsa, KDV hariç tutar üzerinden)
    const otvTut = kdvHaric * (otvOran / 100);

    // KKDF: Taksitli satışlarda KDV hariç tutar üzerinden
    const kkdfOran = parseFloat(form.kkdfOran) || 0;
    const kkdfTut = kdvHaric * (kkdfOran / 100);

    // Toplam kesinti
    const toplamKesinti = komisyonTut + kargo + kdvTut + stopajTut + otvTut + kkdfTut;
    const netGelir = satis - toplamKesinti;
    const kar = netGelir - maliyet;
    const karMarji = satis > 0 ? (kar / satis) * 100 : 0;

    return {
      satis, maliyet, komisyonTut,
      kdvHaric, kdvTut,
      stopajOran, stopajTut,
      otvOran, otvTut,
      kkdfOran, kkdfTut,
      kargo,
      toplamKesinti, netGelir, kar, karMarji,
    };
  }, [form]);

  // ─── Kaydet ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.urunAd || !form.platform || !form.satisFiyat) return;
    setEkleniyor(true);

    const payload = {
      ...form,
      satisFiyat: hesapla.satis,
      urunMaliyet: hesapla.maliyet,
      komisyonOran: parseFloat(form.komisyonOran) || 0,
      komisyonTut: hesapla.komisyonTut,
      kargo: hesapla.kargo,
      kdvOran: hesapla.kdvOran,
      kdvTut: hesapla.kdvTut,
      stopajOran: hesapla.stopajOran,
      stopajTut: hesapla.stopajTut,
      otvOran: hesapla.otvOran,
      otvTut: hesapla.otvTut,
      taksit: form.taksit,
      kkdfOran: hesapla.kkdfOran,
      kkdfTut: hesapla.kkdfTut,
      toplamKesinti: hesapla.toplamKesinti,
      netGelir: hesapla.netGelir,
      kar: hesapla.kar,
      karMarji: hesapla.karMarji,
    };

    try {
      const sonuc = await (duzenlenen
        ? api.guncelle({ ...payload, id: duzenlenen.id })
        : api.ekle(payload)
      );

      if (sonuc.basarili) {
        const key = Object.keys(sonuc).find(k => k !== 'basarili');
        setListe(sonuc[key]);
        setForm(varsayilan);
        setDuzenlenen(null);
      }
    } catch (err) {
      console.error('E-ticaret kaydetme hatası:', err);
    } finally {
      setEkleniyor(false);
    }
  };

  // ─── Düzenle / Sil ──────────────────────────────────────────────────────
  const duzenle = (item) => {
    setDuzenlenen(item);
    setForm({
      urunAd: item.urunAd || '',
      kategori: item.kategori || '',
      platform: item.platform || '',
      satisFiyat: String(item.satisFiyat || ''),
      urunMaliyet: String(item.urunMaliyet || ''),
      komisyonOran: String(item.komisyonOran || ''),
      kargo: String(item.kargo || ''),
      kdvOran: String(item.kdvOran || '20'),
      stopajOran: String(item.stopajOran || '0'),
      otvOran: String(item.otvOran || '0'),
      taksit: String(item.taksit || '0'),
      kkdfOran: String(item.kkdfOran || '0'),
      not: item.not || '',
      tarih: item.tarih || new Date().toISOString().split('T')[0],
    });
  };

  const sil = async (id) => {
    try {
      const s = await api.sil(id);
      if (s.basarili) {
        const k = Object.keys(s).find(kk => kk !== 'basarili');
        setListe(s[k]);
      }
    } catch (err) {
      console.error('E-ticaret silme hatası:', err);
    }
  };

  // ─── Filtreleme ─────────────────────────────────────────────────────────
  const filtreliListe = useMemo(() => {
    let sonuc = [...liste].filter(i => i);
    if (platformFiltre !== 'tumu') {
      sonuc = sonuc.filter(i => i.platform === platformFiltre);
    }
    if (arama.trim()) {
      const q = arama.toLowerCase();
      sonuc = sonuc.filter(i =>
        i.urunAd?.toLowerCase().includes(q) ||
        i.platform?.toLowerCase().includes(q)
      );
    }
    return sonuc.sort((a, b) => (b.tarih || '').localeCompare(a.tarih || ''));
  }, [liste, platformFiltre, arama]);

  // ─── Toplamlar ──────────────────────────────────────────────────────────
  const toplamlar = useMemo(() => {
    const gecerli = liste.filter(i => i);
    return {
      satis: gecerli.reduce((t, i) => t + (Number(i.satisFiyat) || 0), 0),
      maliyet: gecerli.reduce((t, i) => t + (Number(i.urunMaliyet) || 0), 0),
      komisyon: gecerli.reduce((t, i) => t + (Number(i.komisyonTut) || 0), 0),
      kargo: gecerli.reduce((t, i) => t + (Number(i.kargo) || 0), 0),
      kdv: gecerli.reduce((t, i) => t + (Number(i.kdvTut) || 0), 0),
      stopaj: gecerli.reduce((t, i) => t + (Number(i.stopajTut) || 0), 0),
      otv: gecerli.reduce((t, i) => t + (Number(i.otvTut) || 0), 0),
      kkdf: gecerli.reduce((t, i) => t + (Number(i.kkdfTut) || 0), 0),
      kesinti: gecerli.reduce((t, i) => t + (Number(i.toplamKesinti) || 0), 0),
      net: gecerli.reduce((t, i) => t + (Number(i.netGelir) || 0), 0),
      kar: gecerli.reduce((t, i) => t + (Number(i.kar) || 0), 0),
      adet: gecerli.length,
    };
  }, [liste]);

  const genelKarMarji = toplamlar.satis > 0 ? (toplamlar.kar / toplamlar.satis) * 100 : 0;

  const platformBilgi = PLATFORM_BILGI[form.platform];

  return (
    <div>
      {/* ====== ÖZET PANEL ====== */}
      <div className="panel-grid">
        <div className="panel panel-gelir">
          <div className="panel-label">Toplam Satış</div>
          <div className="panel-value">{tl(toplamlar.satis)}</div>
          <div className="panel-sub">{toplamlar.adet} ürün</div>
        </div>
        <div className="panel panel-kar">
          <div className="panel-label">Net Gelir</div>
          <div className="panel-value">{tl(toplamlar.net)}</div>
          <div className="panel-sub">Tüm kesintiler sonrası</div>
        </div>
        <div className="panel" style={{ borderTop: '3px solid #8b5cf6' }}>
          <div className="panel-label">Kâr / Zarar</div>
          <div className="panel-value" style={{ color: toplamlar.kar >= 0 ? '#059669' : '#dc2626' }}>
            {tl(toplamlar.kar)}
          </div>
          <div className="panel-sub">%{genelKarMarji.toFixed(1)} marj</div>
        </div>
        <div className="panel panel-gider">
          <div className="panel-label">Toplam Kesintiler</div>
          <div className="panel-value">{tl(toplamlar.kesinti)}</div>
          <div className="panel-sub">
            Kom. {tl(toplamlar.komisyon)} / KDV {tl(toplamlar.kdv)} / Kargo {tl(toplamlar.kargo)}
            {toplamlar.stopaj > 0 && <span> / Stopaj {tl(toplamlar.stopaj)}</span>}
            {toplamlar.otv > 0 && <span> / ÖTV {tl(toplamlar.otv)}</span>}
            {toplamlar.kkdf > 0 && <span> / KKDF {tl(toplamlar.kkdf)}</span>}
          </div>
        </div>
      </div>

      {/* Platform filtre */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <span className={`filtre-btn ${platformFiltre === 'tumu' ? 'aktif' : ''}`}
          style={{ cursor: 'pointer', padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}
          onClick={() => setPlatformFiltre('tumu')}>Tümü</span>
        {platformlar.map(p => (
          <span key={p} className={`filtre-btn ${platformFiltre === p ? 'aktif' : ''}`}
            style={{ cursor: 'pointer', padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}
            onClick={() => setPlatformFiltre(p === platformFiltre ? 'tumu' : p)}>{p}</span>
        ))}
        <input type="text" placeholder="Ürün ara..." value={arama}
          onChange={(e) => setArama(e.target.value)}
          style={{ padding: '4px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, fontFamily: 'inherit', width: 160, outline: 'none', marginLeft: 'auto' }}
        />
      </div>

      {/* ====== FORM ====== */}
      <div className="form-kutu" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}>
          {duzenlenen ? '✏️ Ürün Düzenle' : '➕ Yeni Ürün Ekle'}
        </h3>
        <form onSubmit={handleSubmit} className="ekle-form">
          <div className="form-row">
            <div className="form-grup" style={{ flex: 1 }}>
              <label>Ürün Adı</label>
              <input name="urunAd" value={form.urunAd} onChange={h} className="form-input" placeholder="Ürün adı" required />
            </div>
            <div className="form-grup" style={{ flex: '0 0 140px' }}>
              <label>Kategori {form.kategori && <span style={{ fontWeight: 400, color: 'var(--text-light)', fontSize: 10 }}>— KDV otomatik</span>}</label>
              <select name="kategori" value={form.kategori} onChange={h} className="form-select" required>
                <option value="">-- Kategori --</option>
                {kategoriler.map(k => (
                  <option key={k} value={k}>{k} (KDV %{KATEGORI_VERGI[k]?.kdv || 20})</option>
                ))}
              </select>
            </div>
            <div className="form-grup" style={{ flex: '0 0 130px' }}>
              <label>Platform {form.platform && <span style={{ fontWeight: 400, color: 'var(--text-light)', fontSize: 10 }}>— komisyon otomatik</span>}</label>
              <select name="platform" value={form.platform} onChange={h} className="form-select" required>
                <option value="">-- Platform --</option>
                {platformlar.map(p => (
                  <option key={p} value={p}>{p} (%{PLATFORM_BILGI[p]?.komisyon || '?'})</option>
                ))}
              </select>
            </div>
            <div className="form-grup" style={{ flex: '0 0 100px' }}>
              <label>Tarih</label>
              <input name="tarih" type="date" value={form.tarih} onChange={h} className="form-input" />
            </div>
          </div>

          {/* Bilgi notu */}
          {platformBilgi && (
            <div style={{
              fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8,
              padding: '6px 10px', background: '#f0f0ff', borderRadius: 6,
            }}>
              💡 {platformBilgi.not}
              {!duzenlenen && form.platform && <span> • Komisyon <strong>%{platformBilgi.komisyon}</strong> otomatik atandı</span>}
              {!duzenlenen && form.kategori && <span> • KDV %{KATEGORI_VERGI[form.kategori]?.kdv} olarak ayarlandı</span>}
            </div>
          )}

          <div className="form-row">
            <div className="form-grup" style={{ flex: '0 0 120px' }}>
              <label>💰 Satış Fiyatı</label>
              <input name="satisFiyat" type="number" step="0.01" value={form.satisFiyat} onChange={h} className="form-input" placeholder="Brüt" required />
            </div>
            <div className="form-grup" style={{ flex: '0 0 120px' }}>
              <label>📦 Ürün Maliyeti</label>
              <input name="urunMaliyet" type="number" step="0.01" value={form.urunMaliyet} onChange={h} className="form-input" placeholder="0" />
            </div>
            <div className="form-grup" style={{ flex: '0 0 80px' }}>
              <label>🏪 Komisyon %</label>
              <input name="komisyonOran" type="number" step="0.1" value={form.komisyonOran} onChange={h}
                className="form-input" placeholder="15"
                style={{ fontWeight: form.platform ? 700 : 400 }}
              />
            </div>
            <div className="form-grup" style={{ flex: '0 0 80px' }}>
              <label>📤 Kargo</label>
              <input name="kargo" type="number" step="0.01" value={form.kargo} onChange={h} className="form-input" placeholder="0" />
            </div>
            <div className="form-grup" style={{ flex: '0 0 60px' }}>
              <label>🧾 KDV %</label>
              <select name="kdvOran" value={form.kdvOran} onChange={h} className="form-select" style={{ fontWeight: form.kategori ? 700 : 400 }}>
                <option value="0">%0</option>
                <option value="10">%10</option>
                <option value="20">%20</option>
              </select>
            </div>
            <div className="form-grup" style={{ flex: '0 0 60px' }}>
              <label>📊 Stopaj %</label>
              <input name="stopajOran" type="number" step="0.1" value={form.stopajOran} onChange={h} className="form-input" placeholder="0" />
            </div>
            <div className="form-grup" style={{ flex: '0 0 60px' }}>
              <label>📊 ÖTV %</label>
              <input name="otvOran" type="number" step="0.1" value={form.otvOran} onChange={h} className="form-input" placeholder="0" />
            </div>
          </div>

          {/* ─── Devlet Kesintileri ──────────────────────────────────── */}
          <div className="form-row" style={{ marginTop: 4 }}>
            <div className="form-grup" style={{ flex: '0 0 100px' }}>
              <label>📅 Taksit</label>
              <select name="taksit" value={form.taksit} onChange={h} className="form-select">
                <option value="0">Peşin</option>
                <option value="3">3 taksit</option>
                <option value="6">6 taksit</option>
                <option value="9">9 taksit</option>
                <option value="12">12 taksit</option>
              </select>
            </div>
            <div className="form-grup" style={{ flex: '0 0 70px' }}>
              <label>📋 KKDF %</label>
              <input name="kkdfOran" type="number" step="0.1" value={form.kkdfOran} onChange={h}
                className="form-input" placeholder="0"
                style={{ fontWeight: form.taksit !== '0' ? 700 : 400 }}
              />
            </div>
          </div>

          {/* Canlı Kar/Zarar Tablosu */}
          {(form.satisFiyat || form.urunMaliyet || form.komisyonOran || form.kargo) && (
            <div style={{
              margin: '8px 0', padding: 16, background: 'white',
              borderRadius: 8, border: '1px solid var(--border)',
              fontSize: 12,
            }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>📊</span> Kar/Zarar Tablosu
                {form.platform && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-light)', padding: '2px 8px', borderRadius: 4 }}>
                    {form.platform}
                  </span>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
                <HesapSatir label="Satış Fiyatı" deger={hesapla.satis} renk="var(--text)" bold />
                <HesapSatir label="Ürün Maliyeti" deger={-hesapla.maliyet} renk="#dc2626" />

                <HesapSatir label="Platform Komisyonu" deger={-hesapla.komisyonTut} renk="#dc2626" cizgili />
                <HesapSatir label="Kargo" deger={-hesapla.kargo} renk="#dc2626" />
                <HesapSatir label={`KDV (%${form.kdvOran || 0})`} deger={-hesapla.kdvTut} renk="#dc2626" />
                {(hesapla.stopajTut || 0) > 0 && (
                  <HesapSatir label={`📊 Stopaj (%${form.stopajOran || 0})`} deger={-hesapla.stopajTut} renk="#d97706" />
                )}
                {(hesapla.otvTut || 0) > 0 && (
                  <HesapSatir label={`📊 ÖTV (%${form.otvOran || 0})`} deger={-hesapla.otvTut} renk="#d97706" />
                )}
                {(hesapla.kkdfTut || 0) > 0 && (
                  <HesapSatir label={`📋 KKDF (%${form.kkdfOran || 0})`} deger={-hesapla.kkdfTut} renk="#d97706" />
                )}

                <HesapSatir label="Toplam Kesinti" deger={-hesapla.toplamKesinti} renk="#dc2626" bold cizgili2 />
                <HesapSatir label="Net Gelir" deger={hesapla.netGelir} renk="var(--primary)" bold boyut={15} />

                <HesapSatir label="Kâr / Zarar" deger={hesapla.kar}
                  renk={hesapla.kar >= 0 ? '#059669' : '#dc2626'} bold boyut={16}
                  ek={`%${hesapla.karMarji.toFixed(1)}`} cizgili2 />
              </div>
            </div>
          )}

          <div className="form-row" style={{ alignItems: 'flex-end', marginTop: 4 }}>
            <div className="form-grup" style={{ flex: 1 }}>
              <label>Not</label>
              <input name="not" value={form.not} onChange={h} className="form-input" placeholder="Not (opsiyonel)" />
            </div>
            <div style={{ display: 'flex', gap: 8, paddingBottom: 2 }}>
              <button type="submit" className="btn-ekle gelir" disabled={ekleniyor}>
                {ekleniyor ? '...' : duzenlenen ? 'Güncelle' : 'Kaydet'}
              </button>
              {duzenlenen && (
                <button type="button" className="btn-ekle" style={{ background: 'linear-gradient(135deg, #64748b, #475569)' }}
                  onClick={() => { setDuzenlenen(null); setForm(varsayilan); }}>
                  İptal
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* ====== TABLO ====== */}
      <div className="tablo-kapsayici">
        <div className="tablo-baslik">
          <h3>Ürün Bazlı Kâr/Zarar Tablosu {filtreliListe.length > 0 &&
            <span style={{ fontWeight: 400, color: 'var(--text-light)', fontSize: 12 }}>({filtreliListe.length} kayıt)</span>}</h3>
          <button className="btn-ekle" style={{ background: 'linear-gradient(135deg, #64748b, #475569)', fontSize: 11, padding: '5px 12px' }}
            onClick={() => {
              const txt = filtreliListe.map(i =>
                `${i.tarih}\t${i.platform}\t${i.urunAd}\t₺${Number(i.satisFiyat).toFixed(2)}\t₺${Number(i.netGelir || 0).toFixed(2)}\t₺${Number(i.kar || 0).toFixed(2)}`
              ).join('\n');
              navigator.clipboard?.writeText(txt);
              alert('Tablo panoya kopyalandı!');
            }}>
            📋 Kopyala
          </button>
        </div>

        {filtreliListe.length === 0 ? (
          <div className="bos-mesaj">
            {liste.length === 0
              ? 'Henüz kayıt yok. Platform seçip komisyonu otomatik al, satış fiyatını gir, kâr/zararını anında gör.'
              : 'Filtreye uygun kayıt bulunamadı.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Platform</th>
                  <th>Ürün</th>
                  <th className="tutar">Satış</th>
                  <th className="tutar">Maliyet</th>
                  <th className="tutar">Komisyon</th>
                  <th className="tutar">Kargo</th>
                  <th className="tutar">KDV</th>
                  <th className="tutar">Stopaj</th>
                  <th className="tutar">ÖTV</th>
                  <th className="tutar">KKDF</th>
                  <th className="tutar">Net</th>
                  <th className="tutar">Kâr/Zarar</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtreliListe.map((i) => {
                  const kar = Number(i.kar) || 0;
                  return (
                    <tr key={i.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 11 }}>{fTarihKisa(i.tarih)}</td>
                      <td><span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>{i.platform}</span></td>
                      <td style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={i.urunAd}>
                        {i.urunAd}
                      </td>
                      <td className="tutar deger-gelir">{tl(i.satisFiyat || 0)}</td>
                      <td className="tutar" style={{ color: 'var(--text-secondary)' }}>{i.urunMaliyet ? tl(i.urunMaliyet) : '—'}</td>
                      <td className="tutar" style={{ color: '#dc2626' }}>{i.komisyonTut ? tl(i.komisyonTut) : '—'}</td>
                      <td className="tutar" style={{ color: '#dc2626' }}>{i.kargo ? tl(i.kargo) : '—'}</td>
                      <td className="tutar" style={{ color: '#dc2626' }}>{i.kdvTut ? tl(i.kdvTut) : '—'}</td>
                      <td className="tutar" style={{ color: '#d97706' }}>{i.stopajTut ? tl(i.stopajTut) : '—'}</td>
                      <td className="tutar" style={{ color: '#d97706' }}>{i.otvTut ? tl(i.otvTut) : '—'}</td>
                      <td className="tutar" style={{ color: '#d97706' }}>{i.kkdfTut ? tl(i.kkdfTut) : '—'}</td>
                      <td className="tutar" style={{ color: 'var(--primary)', fontWeight: 800 }}>{tl(i.netGelir || 0)}</td>
                      <td className="tutar" style={{ color: kar >= 0 ? '#059669' : '#dc2626', fontWeight: 800 }}>
                        {tl(kar)}
                        <span style={{ fontSize: 9, marginLeft: 4, fontWeight: 600 }}>
                          ({(Number(i.karMarji) || 0).toFixed(1)}%)
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button className="btn-duzenle" onClick={() => duzenle(i)} title="Düzenle">✎</button>
                        <button className="btn-sil" onClick={() => sil(i.id)} title="Sil">x</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Yardımcı bileşen ───────────────────────────────────────────────────
function HesapSatir({ label, deger, renk, bold, boyut, ek, cizgili, cizgili2 }) {
  const st = {
    padding: '3px 8px',
    color: 'var(--text-secondary)',
    fontWeight: bold ? 700 : 500,
    display: 'flex',
    alignItems: 'center',
    ...(cizgili ? { borderTop: '1px dashed var(--border)', paddingTop: 5, marginTop: 4 } : {}),
    ...(cizgili2 ? { borderTop: '2px solid var(--border)', paddingTop: 6, marginTop: 6 } : {}),
  };
  return (
    <>
      <div style={st}>{label}</div>
      <div style={{
        ...st, justifyContent: 'flex-end', fontFamily: 'var(--font-mono)',
        color: renk, fontWeight: bold ? 800 : 600,
        fontSize: boyut || 12,
      }}>
        {deger >= 0 ? '' : '- '}{tl(Math.abs(deger))}
        {ek && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-light)', marginLeft: 6 }}>{ek}</span>}
      </div>
    </>
  );
}
