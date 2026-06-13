import React, { useState } from 'react';

export default function Kategoriler({ kategoriler, kategoriEkle, kategoriSil }) {
  const [tur, setTur] = useState('gider');
  const [ad, setAd] = useState('');
  const [ekleniyor, setEkleniyor] = useState(false);
  const [hata, setHata] = useState('');
  const [silmeOnay, setSilmeOnay] = useState(null);

  const handleEkle = async (e) => {
    e.preventDefault();
    setHata('');

    if (!ad.trim()) { setHata('Kategori adı gerekli.'); return; }

    const varMi = kategoriler.some(
      (k) => k.ad.toLowerCase() === ad.trim().toLowerCase() && k.tur === tur
    );
    if (varMi) { setHata('Bu isimde bir kategori zaten mevcut.'); return; }

    setEkleniyor(true);
    const basarili = await kategoriEkle({ ad: ad.trim(), tur });
    setEkleniyor(false);
    if (basarili) setAd('');
    else setHata('Kategori eklenirken hata oluştu.');
  };

  const handleSil = async (kategoriId) => {
    if (silmeOnay === kategoriId) {
      await kategoriSil(kategoriId);
      setSilmeOnay(null);
    } else {
      setSilmeOnay(kategoriId);
      setTimeout(() => setSilmeOnay(null), 3000);
    }
  };

  const gelirKategoriler = kategoriler.filter((k) => k.tur === 'gelir');
  const giderKategoriler = kategoriler.filter((k) => k.tur === 'gider');

  return (
    <div className="kategori-alani">
      <div className="form-kutu" style={{ marginBottom: 16 }}>
        <h3>Yeni Hesap</h3>
        <form onSubmit={handleEkle} className="kategori-form">
          {hata && <div className="hata-mesaji">{hata}</div>}
          <div className="form-row">
            <div className="form-grup" style={{ flex: '0 0 160px' }}>
              <label>Tür</label>
              <div className="tur-secimi">
                <button type="button" className={`tur-btn ${tur === 'gelir' ? 'aktif' : ''}`}
                  onClick={() => setTur('gelir')}>Gelir</button>
                <button type="button" className={`tur-btn ${tur === 'gider' ? 'aktif' : ''}`}
                  onClick={() => setTur('gider')}>Gider</button>
              </div>
            </div>
            <div className="form-grup">
              <label>Hesap Adı</label>
              <input type="text" value={ad} onChange={(e) => setAd(e.target.value)}
                placeholder="Örn: Kira, Maaş..." className="form-input" />
            </div>
            <button type="submit" className="btn-ekle" disabled={ekleniyor}>
              {ekleniyor ? '...' : 'Ekle'}
            </button>
          </div>
        </form>
      </div>

      <div className="kategori-grup">
        <h3>Gelir Hesapları (+)</h3>
        <div className="kategori-liste">
          {gelirKategoriler.length === 0 ? (
            <div className="bos-mesaj" style={{ padding: 12 }}>Henüz hesap eklenmemiş.</div>
          ) : gelirKategoriler.map((kat) => (
            <div key={kat.id} className="kategori-item">
              <span className="isim">{kat.ad}</span>
              <button className="btn-sil" onClick={() => handleSil(kat.id)}>
                {silmeOnay === kat.id ? 'Emin?' : 'x'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="kategori-grup">
        <h3>Gider Hesapları (-)</h3>
        <div className="kategori-liste">
          {giderKategoriler.length === 0 ? (
            <div className="bos-mesaj" style={{ padding: 12 }}>Henüz hesap eklenmemiş.</div>
          ) : giderKategoriler.map((kat) => (
            <div key={kat.id} className="kategori-item">
              <span className="isim">{kat.ad}</span>
              <button className="btn-sil" onClick={() => handleSil(kat.id)}>
                {silmeOnay === kat.id ? 'Emin?' : 'x'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
