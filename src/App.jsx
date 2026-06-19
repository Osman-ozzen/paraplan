import React, { useState, useEffect, useCallback, useRef } from 'react';
import AnaSayfa from './components/AnaSayfa';
import GelirGiderEkle from './components/GelirGiderEkle';
import Raporlar from './components/Raporlar';
import Kategoriler from './components/Kategoriler';
import Borclar from './components/Borclar';
import ETicaret from './components/ETicaret';
import AylikGiderler from './components/AylikGiderler';
import Hedefler from './components/Hedefler';
import api from './utils/api';
import './App.css';

// ─── ID Oluşturucu ─────────────────────────────────────────────────────────
function idOlustur() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
}

// ─── App Bileşeni ───────────────────────────────────────────────────────────
export default function App() {
  const [aktifSekme, setAktifSekme] = useState('anasayfa');
  const [kategoriler, setKategoriler] = useState([]);
  const [kayitlar, setKayitlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  // PWA Splash Screen - efektli kapanış
  useEffect(() => {
    const splash = document.getElementById('pwa-splash');
    if (splash) {
      // React render tamamlanınca splash'i kapat
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          splash.classList.add('yuklendi');
          setTimeout(() => splash.remove(), 600);
        });
      });
    }
  }, []);
  const [bildirim, setBildirim] = useState(null);
  const [sonEklenenId, setSonEklenenId] = useState(null);
  const [duzenlenecekKayit, setDuzenlenecekKayit] = useState(null);
  const [borclar, setBorclar] = useState([]);
  const [eticaret, setETicaret] = useState([]);
  const [aylikGiderler, setAylikGiderler] = useState([]);
  const [hedefler, setHedefler] = useState([]);
  const [seciliAy, setSeciliAy] = useState(null);
  const [mobileMenuAcik, setMobileMenuAcik] = useState(false);
  const bildirimTimeoutRef = useRef(null);

  // ─── Veri Yükleme ─────────────────────────────────────────────────────────
  const verileriYukle = useCallback(async () => {
    try {
      const data = await api.veriOku();
      if (data) {
        setKategoriler(data.kategoriler || []);
        setKayitlar(data.kayitlar || []);
        setBorclar(data.borclar || []);
        setETicaret(data.eticaret || []);
        setAylikGiderler(data.aylikGiderler || []);
        setHedefler(data.hedefler || []);
      } else {
        throw new Error('Veri alınamadı');
      }
    } catch (err) {
      console.error('Veri yüklenirken hata:', err);
      setKategoriler([
        { id: 'gelir-maas', ad: 'Maaş', tur: 'gelir' },
        { id: 'gelir-serbest', ad: 'Serbest Çalışma', tur: 'gelir' },
        { id: 'gelir-yatirim', ad: 'Yatırım / Kira', tur: 'gelir' },
        { id: 'gelir-diger', ad: 'Diğer Gelir', tur: 'gelir' },
        { id: 'gider-kira', ad: 'Kira / Konut', tur: 'gider' },
        { id: 'gider-fatura', ad: 'Faturalar', tur: 'gider' },
        { id: 'gider-market', ad: 'Market / Gıda', tur: 'gider' },
        { id: 'gider-ulasim', ad: 'Ulaşım', tur: 'gider' },
        { id: 'gider-eglence', ad: 'Eğlence / Hobi', tur: 'gider' },
        { id: 'gider-saglik', ad: 'Sağlık', tur: 'gider' },
        { id: 'gider-egitim', ad: 'Eğitim', tur: 'gider' },
        { id: 'gider-giyim', ad: 'Giyim', tur: 'gider' },
        { id: 'gider-diger', ad: 'Diğer Gider', tur: 'gider' },
      ]);
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => {
    verileriYukle();
  }, [verileriYukle]);

  // ─── Bildirim Göster (🐛 FIX: timeout temizleme) ─────────────────────────
  const bildirimGoster = useCallback((mesaj, tur = 'basarili') => {
    if (bildirimTimeoutRef.current) clearTimeout(bildirimTimeoutRef.current);
    setBildirim({ mesaj, tur });
    bildirimTimeoutRef.current = setTimeout(() => {
      setBildirim(null);
      bildirimTimeoutRef.current = null;
    }, 3000);
  }, []);

  // ─── Kayıt İşlemleri ──────────────────────────────────────────────────────
  const kayitEkle = async (kayit) => {
    const yeniKayit = {
      ...kayit,
      id: idOlustur(),
    };

    try {
      const sonuc = await api.kayitEkle(yeniKayit);
      if (sonuc?.basarili) {
        setKayitlar(sonuc.kayitlar);
      } else {
        setKayitlar((prev) => [...prev, yeniKayit]);
      }
    } catch {
      setKayitlar((prev) => [...prev, yeniKayit]);
    }

    setSonEklenenId(yeniKayit.id);
    setTimeout(() => setSonEklenenId(null), 1500);
    bildirimGoster('Fiş kaydedildi');
    return true;
  };

  const kayitSil = async (kayitId) => {
    try {
      const sonuc = await api.kayitSil(kayitId);
      if (sonuc?.basarili) {
        setKayitlar(sonuc.kayitlar);
      } else {
        setKayitlar((prev) => prev.filter((k) => k.id !== kayitId));
      }
      bildirimGoster('Kayıt silindi');
      return true;
    } catch {
      setKayitlar((prev) => prev.filter((k) => k.id !== kayitId));
      bildirimGoster('Kayıt silindi');
      return true;
    }
  };

  // ─── Düzenleme ─────────────────────────────────────────────────────────────
  const duzenleBaslat = (kayit) => {
    setDuzenlenecekKayit(kayit);
    setAktifSekme('ekle');
  };

  const kayitGuncelle = async (guncelKayit) => {
    try {
      const sonuc = await api.kayitGuncelle(guncelKayit);
      if (sonuc?.basarili) {
        setKayitlar(sonuc.kayitlar);
        bildirimGoster('Fiş güncellendi');
        return true;
      }
    } catch {
      setKayitlar((prev) => prev.map((k) => k.id === guncelKayit.id ? guncelKayit : k));
      bildirimGoster('Fiş güncellendi (yerel)');
      return true;
    } finally {
      setDuzenlenecekKayit(null);
    }
    return false;
  };

  const duzenleIptal = () => {
    setDuzenlenecekKayit(null);
  };

  // ─── Kategori İşlemleri ───────────────────────────────────────────────────
  const kategoriEkle = async (kategori) => {
    const yeniKategori = { ...kategori, id: idOlustur() };
    try {
      const sonuc = await api.kategoriEkle(yeniKategori);
      if (sonuc?.basarili) {
        setKategoriler(sonuc.kategoriler);
      } else {
        setKategoriler((prev) => [...prev, yeniKategori]);
      }
    } catch {
      setKategoriler((prev) => [...prev, yeniKategori]);
    }
    bildirimGoster('Kategori eklendi');
    return true;
  };

  const kategoriSil = async (kategoriId) => {
    try {
      const sonuc = await api.kategoriSil(kategoriId);
      if (sonuc?.basarili) {
        setKategoriler(sonuc.kategoriler);
        setKayitlar(sonuc.kayitlar || []);
      } else {
        setKategoriler((prev) => prev.filter((k) => k.id !== kategoriId));
        setKayitlar((prev) => prev.filter((k) => k.kategoriId !== kategoriId));
      }
    } catch {
      setKategoriler((prev) => prev.filter((k) => k.id !== kategoriId));
      setKayitlar((prev) => prev.filter((k) => k.kategoriId !== kategoriId));
    }
    bildirimGoster('Kategori silindi');
    return true;
  };

  // ─── Saat ─────────────────────────────────────────────────────────────────
  const [saat, setSaat] = useState(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
  useEffect(() => {
    const interval = setInterval(() => {
      setSaat(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // ─── Sekmeler ─────────────────────────────────────────────────────────────
  const sekmeler = [
    { id: 'anasayfa', etiket: 'Ana Defter', ikon: '📋' },
    { id: 'ekle', etiket: 'Hızlı Kayıt', ikon: '➕' },
    { id: 'borclar', etiket: 'Borçlar', ikon: '💳' },
    { id: 'eticaret', etiket: 'E-Ticaret', ikon: '🛒' },
    { id: 'aylikGider', etiket: 'Aylık Sabitler', ikon: '📆' },
    { id: 'hedefler', etiket: 'Hedefler', ikon: '🎯' },
    { id: 'raporlar', etiket: 'Raporlar', ikon: '📊' },
    { id: 'kategoriler', etiket: 'Hesap Planı', ikon: '📁' },
  ];

  const sekmeAdlari = {
    anasayfa: 'Ana Defter', ekle: 'Hızlı Kayıt', borclar: 'Borçlar',
    eticaret: 'E-Ticaret',
    aylikGider: 'Sabit Giderler',
    hedefler: 'Hedef Takibi',
    raporlar: 'Raporlar', kategoriler: 'Hesap Planı',
  };

  // ─── Yükleniyor ───────────────────────────────────────────────────────────
  if (yukleniyor) {
    return (
      <div className="yukleniyor-ekrani">
        <div className="yukleniyor-spinner"></div>
        <p>ParaPlan yükleniyor...</p>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="app">
      {/* Mobil menü overlay */}
      {mobileMenuAcik && <div className="mobile-overlay" onClick={() => setMobileMenuAcik(false)} />}

      {/* Sol Menü */}
      <nav className={`sidebar ${mobileMenuAcik ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <img src="/icon-192.png" alt="ParaPlan" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain' }} />
          </div>
          <div className="sidebar-logo-text">Para<span>Plan</span></div>
          <button className="sidebar-kapat" onClick={() => setMobileMenuAcik(false)} aria-label="Menüyü Kapat">✕</button>
        </div>

        <ul className="sidebar-menu">
          <li className="sidebar-label">Menü</li>
          {sekmeler.map((sekme) => (
            <li key={sekme.id}>
              <button
                className={`sidebar-btn ${aktifSekme === sekme.id ? 'aktif' : ''}`}
                onClick={() => { setAktifSekme(sekme.id); setMobileMenuAcik(false); }}
              >
                <span className="ikon">{sekme.ikon}</span>
                <span>{sekme.etiket}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="sidebar-alt">
          <p>v1.0 • {saat}</p>
        </div>
      </nav>

      {/* Ana İçerik */}
      <main className="ana-icerik">
        {/* Mobil hamburger */}
        <div className="mobile-header">
          <button className="mobile-hamburger" onClick={() => setMobileMenuAcik(true)} aria-label="Menüyü Aç">
            <span /><span /><span />
          </button>
          <span className="mobile-baslik">{sekmeAdlari[aktifSekme] || 'ParaPlan'}</span>
          <span style={{ width: 30 }} />
        </div>
        {/* Bildirim */}
        {bildirim && (
          <div className={`bildirim ${bildirim.tur}`}>
            {bildirim.mesaj}
          </div>
        )}

        <div className="icerik-alani">
          <div className="sayfa-baslik">
            <h2>{sekmeAdlari[aktifSekme]}</h2>
          </div>

          {aktifSekme === 'anasayfa' && (
            <AnaSayfa
              kategoriler={kategoriler}
              kayitlar={kayitlar}
              kayitSil={kayitSil}
              sonEklenenId={sonEklenenId}
              duzenleBaslat={duzenleBaslat}
              borclar={borclar}
              aylikGiderler={aylikGiderler}
              hedefler={hedefler}
              setAktifSekme={setAktifSekme}
              setSeciliAy={setSeciliAy}
            />
          )}
          {aktifSekme === 'ekle' && (
            <GelirGiderEkle
              kategoriler={kategoriler}
              kayitEkle={kayitEkle}
              kayitGuncelle={kayitGuncelle}
              duzenlenecekKayit={duzenlenecekKayit}
              duzenleIptal={duzenleIptal}
            />
          )}
          {aktifSekme === 'borclar' && (
            <Borclar data={borclar} api={api.borclar} setData={setBorclar} />
          )}
          {aktifSekme === 'eticaret' && (
            <ETicaret data={eticaret} api={api.eticaret} />
          )}
          {aktifSekme === 'aylikGider' && (
            <AylikGiderler data={aylikGiderler} api={api.aylikGiderler}
              kayitEkle={kayitEkle} kategoriler={kategoriler}
              seciliAy={seciliAy} setSeciliAy={setSeciliAy} />
          )}
          {aktifSekme === 'hedefler' && (
            <Hedefler data={hedefler} api={api.hedefler} />
          )}
          {aktifSekme === 'raporlar' && (
            <Raporlar
              kategoriler={kategoriler}
              kayitlar={kayitlar}
            />
          )}
          {aktifSekme === 'kategoriler' && (
            <Kategoriler
              kategoriler={kategoriler}
              kategoriEkle={kategoriEkle}
              kategoriSil={kategoriSil}
            />
          )}
        </div>
      </main>

      {/* ====== MOBİL ALT TAB BAR ====== */}
      <nav className="mobile-tab-bar">
        {['anasayfa','borclar','ekle','hedefler','raporlar'].map(id => {
          const s = sekmeler.find(s => s.id === id);
          if (!s) return null;
          // Mobil tab'de "Hızlı Kayıt" yerine sadece "Yeni" göster
          const etiket = s.id === 'ekle' ? 'Yeni' : s.etiket;
          return { ...s, etiket };
        }).filter(Boolean).map((sekme) => (
          <button
            key={sekme.id}
            className={`mobile-tab ${aktifSekme === sekme.id ? 'aktif' : ''}`}
            onClick={() => setAktifSekme(sekme.id)}
          >
            <span className="mobile-tab-ikon">{sekme.ikon}</span>
            <span className="mobile-tab-etiket">{sekme.etiket}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
