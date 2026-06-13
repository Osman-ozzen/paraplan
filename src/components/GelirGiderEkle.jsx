import React, { useState, useEffect } from 'react';

export default function GelirGiderEkle({ kategoriler, kayitEkle, kayitGuncelle, duzenlenecekKayit, duzenleIptal }) {
  const [tur, setTur] = useState('gelir');
  const [kategoriId, setKategoriId] = useState('');
  const [tutar, setTutar] = useState('');
  const [tarih, setTarih] = useState(new Date().toISOString().split('T')[0]);
  const [aciklama, setAciklama] = useState('');
  const [ekleniyor, setEkleniyor] = useState(false);
  const [hata, setHata] = useState('');

  const duzenlemeModu = duzenlenecekKayit !== null;

  // Düzenleme modunda formu doldur
  useEffect(() => {
    if (duzenlenecekKayit) {
      setTur(duzenlenecekKayit.tur);
      setKategoriId(duzenlenecekKayit.kategoriId);
      setTutar(String(duzenlenecekKayit.tutar));
      setTarih(duzenlenecekKayit.tarih);
      setAciklama(duzenlenecekKayit.aciklama || '');
      setHata('');
    }
  }, [duzenlenecekKayit]);

  const formuSifirla = () => {
    setTutar(''); setAciklama(''); setKategoriId('');
    setTarih(new Date().toISOString().split('T')[0]); setHata('');
    if (duzenlemeModu) duzenleIptal();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHata('');

    if (!kategoriId) { setHata('Lütfen bir kategori seçin.'); return; }
    if (!tutar || Number(tutar) <= 0) { setHata('Geçerli bir tutar girin.'); return; }
    if (!tarih) { setHata('Bir tarih seçin.'); return; }

    setEkleniyor(true);

    let basarili = false;
    if (duzenlemeModu) {
      basarili = await kayitGuncelle({
        id: duzenlenecekKayit.id,
        tur, kategoriId, tutar: parseFloat(tutar), tarih, aciklama: aciklama.trim(),
      });
    } else {
      basarili = await kayitEkle({
        tur, kategoriId, tutar: parseFloat(tutar), tarih, aciklama: aciklama.trim(),
      });
    }

    setEkleniyor(false);
    if (basarili) formuSifirla();
    else setHata('İşlem sırasında hata oluştu.');
  };

  const filtrelenmisKategoriler = kategoriler.filter((k) => k.tur === tur);
  const hizliTutarlar = tur === 'gelir' ? [1000, 5000, 10000, 25000, 50000] : [50, 100, 200, 500, 1000];

  return (
    <div className="ekleme-alani">
      <div className="form-kutu">
        <h3>{duzenlemeModu ? 'Fiş Düzenle' : 'Yeni Fiş'}</h3>

        <div className="tur-secimi" style={{ marginBottom: 16 }}>
          <button className={`tur-btn ${tur === 'gelir' ? 'aktif' : ''}`}
            onClick={() => { setTur('gelir'); setKategoriId(''); }}>
            + Gelir
          </button>
          <button className={`tur-btn ${tur === 'gider' ? 'aktif' : ''}`}
            onClick={() => { setTur('gider'); setKategoriId(''); }}>
            - Gider
          </button>
        </div>

        <form onSubmit={handleSubmit} className="ekle-form">
          {hata && <div className="hata-mesaji">{hata}</div>}

          <div className="form-grup">
            <label>Kategori</label>
            <select value={kategoriId} onChange={(e) => setKategoriId(e.target.value)} className="form-select">
              <option value="">-- Seçin --</option>
              {filtrelenmisKategoriler.map((kat) => (
                <option key={kat.id} value={kat.id}>{kat.ad}</option>
              ))}
            </select>
          </div>

          <div className="form-grup">
            <label>Tutar (TL)</label>
            <input type="number" step="0.01" min="0.01" placeholder="0.00"
              value={tutar} onChange={(e) => setTutar(e.target.value)} className="form-input" autoFocus />
            <div className="hizli-tutarlar">
              {hizliTutarlar.map((t) => (
                <button key={t} type="button" className="hizli-tutar-btn"
                  onClick={() => setTutar(t.toString())}>
                  {t.toLocaleString('tr-TR')}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-grup" style={{ flex: '0 0 160px' }}>
              <label>Tarih</label>
              <input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)}
                className="form-input" max={new Date().toISOString().split('T')[0]} />
            </div>
          </div>

          <div className="form-grup">
            <label>Açıklama</label>
            <textarea value={aciklama} onChange={(e) => setAciklama(e.target.value)}
              placeholder="İsteğe bağlı..." className="form-textarea" rows={2} />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className={`btn-ekle ${tur}`} disabled={ekleniyor}>
              {ekleniyor
                ? 'Kaydediliyor...'
                : duzenlemeModu
                  ? `${tur === 'gelir' ? 'Gelir' : 'Gider'} Güncelle`
                  : `${tur === 'gelir' ? 'Gelir' : 'Gider'} Kaydet`
              }
            </button>
            {duzenlemeModu && (
              <button type="button" className="btn-ekle"
                style={{ background: 'linear-gradient(135deg, #64748b, #475569)' }}
                onClick={formuSifirla}>
                İptal
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
