import React, { useState, useEffect } from 'react';

const tl = (t) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(t);
const fTarih = (t) => t ? new Date(t).toLocaleDateString('tr-TR') : '-';

// ─── Ön Tanımlı Hedef Önerileri ──────────────────────────────────────────
const ONERILEN_HEDEFLER = [
  { ad: 'Telefon Almak', icon: '📱', varsayilanTutar: 30000 },
  { ad: 'Borç Kapatmak', icon: '💳', varsayilanTutar: 50000 },
  { ad: 'Araba Almak', icon: '🚗', varsayilanTutar: 200000 },
  { ad: 'Ev Almak', icon: '🏠', varsayilanTutar: 500000 },
  { ad: 'Tatil Yapmak', icon: '✈️', varsayilanTutar: 30000 },
  { ad: 'Bilgisayar', icon: '💻', varsayilanTutar: 25000 },
  { ad: 'Eğitim / Kurs', icon: '🎓', varsayilanTutar: 10000 },
  { ad: 'Özel Hedef', icon: '🎯', varsayilanTutar: 10000 },
];

// ─── Progress Bar Rengi ──────────────────────────────────────────────────
function progressRengi(yuzde) {
  if (yuzde >= 100) return 'linear-gradient(90deg, #10b981, #34d399)';
  if (yuzde >= 70) return 'linear-gradient(90deg, #3b82f6, #06b6d4)';
  if (yuzde >= 30) return 'linear-gradient(90deg, #f59e0b, #fbbf24)';
  return 'linear-gradient(90deg, #ef4444, #f87171)';
}

export default function Hedefler({ data, api }) {
  const [liste, setListe] = useState(data || []);
  useEffect(() => { setListe(data || []); }, [data]);
  const [form, setForm] = useState({
    ad: '', icon: '🎯', hedefTutar: '', birikenTutar: '0',
    tamamlanmaTarihi: '', durum: 'devam', aciklama: '',
  });
  const [ekleniyor, setEkleniyor] = useState(false);
  const [duzenlenen, setDuzenlenen] = useState(null);
  const [aktifOneri, setAktifOneri] = useState(null);
  const [birikimInput, setBirikimInput] = useState({ id: null, miktar: '' });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // ─── Önerilen hedef seç ──────────────────────────────────────────────────
  const oneriSec = (oneri) => {
    setAktifOneri(oneri);
    setForm({
      ad: oneri.ad,
      icon: oneri.icon,
      hedefTutar: String(oneri.varsayilanTutar),
      birikenTutar: '0',
      tamamlanmaTarihi: '',
      durum: 'devam',
      aciklama: '',
    });
    setDuzenlenen(null);
  };

  // ─── Form gönder ─────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.ad || !form.hedefTutar || Number(form.hedefTutar) <= 0) return;
    setEkleniyor(true);

    const payload = {
      ...form,
      hedefTutar: parseFloat(form.hedefTutar),
      birikenTutar: parseFloat(form.birikenTutar) || 0,
    };

    try {
      const sonuc = await (duzenlenen
        ? api.guncelle({ ...payload, id: duzenlenen.id })
        : api.ekle(payload));

      if (sonuc.basarili) {
        const anahtar = Object.keys(sonuc).find(k => k !== 'basarili');
        setListe(sonuc[anahtar] || sonuc.hedefler || []);
        formuSifirla();
      }
    } catch (err) {
      console.error('Hedef ekleme/güncelleme hatası:', err);
    } finally {
      setEkleniyor(false);
    }
  };

  const formuSifirla = () => {
    setForm({
      ad: '', icon: '🎯', hedefTutar: '', birikenTutar: '0',
      tamamlanmaTarihi: '', durum: 'devam', aciklama: '',
    });
    setDuzenlenen(null);
    setAktifOneri(null);
  };

  // ─── Düzenle / Sil / Tamamla ─────────────────────────────────────────────
  const duzenle = (item) => {
    setDuzenlenen(item);
    setAktifOneri(null);
    setForm({
      ad: item.ad,
      icon: item.icon || '🎯',
      hedefTutar: String(item.hedefTutar),
      birikenTutar: String(item.birikenTutar || 0),
      tamamlanmaTarihi: item.tamamlanmaTarihi || '',
      durum: item.durum || 'devam',
      aciklama: item.aciklama || '',
    });
  };

  const sil = async (id) => {
    try {
      const s = await api.sil(id);
      if (s.basarili) {
        const anahtar = Object.keys(s).find(k => k !== 'basarili');
        setListe(s[anahtar] || s.hedefler || []);
      }
    } catch (err) {
      console.error('Hedef silme hatası:', err);
    }
  };

  const tamamla = async (item) => {
    try {
      const s = await api.guncelle({ ...item, durum: 'tamamlandi', birikenTutar: item.hedefTutar });
      if (s.basarili) {
        const anahtar = Object.keys(s).find(k => k !== 'basarili');
        setListe(s[anahtar] || s.hedefler || []);
      }
    } catch (err) {
      console.error('Hedef tamamlama hatası:', err);
    }
  };

  // ─── Birikim Ekle / Çıkar ─────────────────────────────────────────────────
  const birikimGuncelle = async (hedef, miktar) => {
    const yeniBiriken = Math.max(0, (Number(hedef.birikenTutar) || 0) + miktar);
    try {
      const s = await api.guncelle({
        ...hedef,
        birikenTutar: yeniBiriken,
        durum: yeniBiriken >= Number(hedef.hedefTutar) ? 'tamamlandi' : hedef.durum,
      });
      if (s.basarili) {
        const anahtar = Object.keys(s).find(k => k !== 'basarili');
        setListe(s[anahtar] || s.hedefler || []);
      }
    } catch (err) {
      console.error('Birikim güncelleme hatası:', err);
    }
    setBirikimInput({ id: null, miktar: '' });
  };

  // ─── İstatistik ──────────────────────────────────────────────────────────
  const aktifHedefler = liste.filter(h => h.durum !== 'tamamlandi');
  const tamamlananlar = liste.filter(h => h.durum === 'tamamlandi');
  const toplamHedef = liste.reduce((t, h) => t + Number(h.hedefTutar || 0), 0);
  const toplamBiriken = liste.reduce((t, h) => t + Number(h.birikenTutar || 0), 0);

  return (
    <div>
      {/* ====== İSTATİSTİK PANELİ ====== */}
      <div className="panel-grid">
        <div className="panel" style={{ borderTop: '3px solid #8b5cf6' }}>
          <div className="panel-label">Aktif Hedef</div>
          <div className="panel-value" style={{ color: '#7c3aed' }}>{aktifHedefler.length}</div>
          <div className="panel-sub">Devam eden hedef</div>
        </div>
        <div className="panel panel-gelir">
          <div className="panel-label">Tamamlanan</div>
          <div className="panel-value">{tamamlananlar.length}</div>
          <div className="panel-sub">Hedef tamamlandı ✓</div>
        </div>
        <div className="panel panel-kar">
          <div className="panel-label">Toplam Hedef</div>
          <div className="panel-value">{tl(toplamHedef)}</div>
          <div className="panel-sub">{liste.length} hedef</div>
        </div>
        <div className="panel panel-gelir">
          <div className="panel-label">Biriken Tutar</div>
          <div className="panel-value">{tl(toplamBiriken)}</div>
          <div className="panel-sub">
            %{toplamHedef > 0 ? ((toplamBiriken / toplamHedef) * 100).toFixed(1) : 0} gerçekleşti
          </div>
        </div>
      </div>

      {/* ====== HIZLI HEDEF ÖNERİLERİ ====== */}
      <div className="grafik-alani">
        <div className="grafik-baslik">
          <h3>⚡ Hızlı Hedef Ekle</h3>
          <span style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 500 }}>
            Bir hedef seç, tutarı düzenle, kaydet
          </span>
        </div>
        <div className="oneri-grid">
          {ONERILEN_HEDEFLER.map((oneri) => (
            <button
              key={oneri.ad}
              className={`oneri-btn ${aktifOneri?.ad === oneri.ad ? 'aktif' : ''}`}
              onClick={() => oneriSec(oneri)}
            >
              <span className="oneri-icon">{oneri.icon}</span>
              <span className="oneri-ad">{oneri.ad}</span>
              <span className="oneri-tutar">{tl(oneri.varsayilanTutar)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ====== HEDEF EKLE / DÜZENLE FORMU ====== */}
      {(aktifOneri || duzenlenen) && (
        <div className="form-kutu" style={{ marginBottom: 16 }}>
          <h3>{duzenlenen ? 'Hedef Düzenle' : 'Yeni Hedef'}</h3>
          <form onSubmit={handleSubmit} className="ekle-form">
            <div className="form-row">
              <div className="form-grup" style={{ flex: '0 0 80px' }}>
                <label>İkon</label>
                <select name="icon" value={form.icon} onChange={handleChange} className="form-select">
                  {['🎯', '📱', '💳', '🚗', '🏠', '✈️', '💻', '🎓', '💰', '🏦', '🎮', '📚', '🏋️', '👶', '💍', '🚀'].map(i => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>
              <div className="form-grup">
                <label>Hedef Adı</label>
                <input name="ad" value={form.ad} onChange={handleChange} className="form-input"
                  placeholder="Hedef adı..." required />
              </div>
              <div className="form-grup" style={{ flex: '0 0 140px' }}>
                <label>Hedef Tutar (₺)</label>
                <input name="hedefTutar" type="number" step="0.01" min="1"
                  value={form.hedefTutar} onChange={handleChange} className="form-input" required />
              </div>
              <div className="form-grup" style={{ flex: '0 0 120px' }}>
                <label>Biriken (₺)</label>
                <input name="birikenTutar" type="number" step="0.01" min="0"
                  value={form.birikenTutar} onChange={handleChange} className="form-input" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-grup" style={{ flex: '0 0 160px' }}>
                <label>Hedef Tarih</label>
                <input name="tamamlanmaTarihi" type="date" value={form.tamamlanmaTarihi}
                  onChange={handleChange} className="form-input" />
              </div>
              <div className="form-grup" style={{ flex: '0 0 130px' }}>
                <label>Durum</label>
                <select name="durum" value={form.durum} onChange={handleChange} className="form-select">
                  <option value="devam">Devam Ediyor</option>
                  <option value="tamamlandi">Tamamlandı ✓</option>
                </select>
              </div>
              <div className="form-grup">
                <label>Açıklama</label>
                <input name="aciklama" value={form.aciklama} onChange={handleChange}
                  className="form-input" placeholder="İsteğe bağlı..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn-ekle" disabled={ekleniyor}>
                {ekleniyor ? '...' : duzenlenen ? 'Güncelle' : 'Hedef Ekle'}
              </button>
              <button type="button" className="btn-ekle"
                style={{ background: 'linear-gradient(135deg, #64748b, #475569)' }}
                onClick={formuSifirla}>
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ====== AKTİF HEDEFLER ====== */}
      <div className="tablo-kapsayici">
        <div className="tablo-baslik">
          <h3>🎯 Aktif Hedefler</h3>
          {aktifHedefler.length > 0 && (
            <span style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 500 }}>
              {aktifHedefler.length} hedef
            </span>
          )}
        </div>
        {aktifHedefler.length === 0 ? (
          <div className="bos-mesaj">
            Henüz aktif hedef bulunmuyor. Yukarıdan hızlı bir hedef seçerek başlayın!
          </div>
        ) : (
          <div className="hedef-liste">
            {aktifHedefler.map((hedef) => {
              const yuzde = hedef.hedefTutar > 0
                ? Math.min(100, ((Number(hedef.birikenTutar) || 0) / Number(hedef.hedefTutar)) * 100)
                : 0;
              return (
                <div key={hedef.id} className="hedef-kart">
                  <div className="hedef-kart-ust">
                    <div className="hedef-kart-baslik">
                      <span className="hedef-icon">{hedef.icon || '🎯'}</span>
                      <div>
                        <div className="hedef-ad">{hedef.ad}</div>
                        <div className="hedef-tarih">
                          {hedef.tamamlanmaTarihi ? `Hedef: ${fTarih(hedef.tamamlanmaTarihi)}` : 'Tarihsiz'}
                        </div>
                      </div>
                    </div>
                    <div className="hedef-kart-actions">
                      {yuzde >= 100 && (
                        <button className="hedef-tamamla-btn" onClick={() => tamamla(hedef)} title="Tamamlandı İşaretle">
                          ✓
                        </button>
                      )}
                      <button className="btn-duzenle" onClick={() => duzenle(hedef)} title="Düzenle">✎</button>
                      <button className="btn-sil" onClick={() => sil(hedef.id)} title="Sil">x</button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="hedef-progress-container">
                    <div className="hedef-progress-bar">
                      <div
                        className="hedef-progress-dolu"
                        style={{
                          width: `${Math.min(100, yuzde)}%`,
                          background: progressRengi(yuzde),
                        }}
                      />
                    </div>
                    <div className="hedef-progress-yuzde">%{yuzde.toFixed(1)}</div>
                  </div>

                  {/* Tutar Bilgisi */}
                  <div className="hedef-kart-alt">
                    <div className="hedef-kart-tutar">
                      <span className="hedef-biriken">{tl(Number(hedef.birikenTutar) || 0)}</span>
                      <span className="hedef-ayrac"> / </span>
                      <span className="hedef-tutar">{tl(Number(hedef.hedefTutar))}</span>
                    </div>
                    <div className="hedef-kalan">
                      Kalan: <strong>{tl(Math.max(0, Number(hedef.hedefTutar) - (Number(hedef.birikenTutar) || 0)))}</strong>
                    </div>
                  </div>

                  {/* Birikim Ekle / Çıkar */}
                  <div className="hedef-birikim-actions">
                    <div className="hedef-birikim-row">
                      <div className="hedef-birikim-input-grup">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Miktar yaz..."
                          className="form-input hedef-birikim-input"
                          value={birikimInput.id === hedef.id ? birikimInput.miktar : ''}
                          onChange={(e) => setBirikimInput({ id: hedef.id, acik: true, miktar: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const m = parseFloat(birikimInput.miktar) || 0;
                              if (m > 0) birikimGuncelle(hedef, m);
                            }
                          }}
                        />
                      </div>
                      <button className="hedef-birikim-btn hedef-birikim-ekle-btn"
                        onClick={() => {
                          const m = parseFloat(birikimInput.miktar) || 0;
                          if (m > 0) birikimGuncelle(hedef, m);
                        }}
                        title="Birikime Ekle">+ Ekle</button>
                      <button className="hedef-birikim-btn hedef-birikim-cikar-btn"
                        onClick={() => {
                          const m = parseFloat(birikimInput.miktar) || 0;
                          if (m > 0) birikimGuncelle(hedef, -m);
                        }}
                        title="Birikimden Çıkar">− Çıkar</button>
                    </div>
                    <div className="hedef-birikim-quick">
                      <span className="hedef-birikim-hizli-label">Hızlı:</span>
                      {[100, 500, 1000, 5000].map((t) => (
                        <button key={t} className="hedef-birikim-hizli"
                          onClick={() => birikimGuncelle(hedef, t)}
                          title={`${t.toLocaleString('tr-TR')} ₺ ekle`}>
                          +{t.toLocaleString('tr-TR')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {hedef.aciklama && (
                    <div className="hedef-aciklama">{hedef.aciklama}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ====== TAMAMLANAN HEDEFLER ====== */}
      {tamamlananlar.length > 0 && (
        <div className="tablo-kapsayici">
          <div className="tablo-baslik">
            <h3>✅ Tamamlanan Hedefler</h3>
            <span style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 500 }}>
              {tamamlananlar.length} hedef
            </span>
          </div>
          <div className="hedef-liste">
            {tamamlananlar.map((hedef) => (
              <div key={hedef.id} className="hedef-kart hedef-tamamlandi">
                <div className="hedef-kart-ust">
                  <div className="hedef-kart-baslik">
                    <span className="hedef-icon">{hedef.icon || '🎯'}</span>
                    <div>
                      <div className="hedef-ad">{hedef.ad}</div>
                      <div className="hedef-tarih" style={{ color: '#059669' }}>
                        ✓ Tamamlandı — {fTarih(hedef.tamamlanmaTarihi)}
                      </div>
                    </div>
                  </div>
                  <button className="btn-sil" onClick={() => sil(hedef.id)} title="Sil">x</button>
                </div>
                <div className="hedef-progress-container">
                  <div className="hedef-progress-bar">
                    <div className="hedef-progress-dolu" style={{ width: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
                  </div>
                  <div className="hedef-progress-yuzde" style={{ color: '#059669' }}>%100</div>
                </div>
                <div className="hedef-kart-alt">
                  <div className="hedef-kart-tutar">
                    <span className="hedef-biriken" style={{ color: '#059669' }}>{tl(Number(hedef.hedefTutar))}</span>
                    <span className="hedef-ayrac"> / </span>
                    <span className="hedef-tutar">{tl(Number(hedef.hedefTutar))}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
