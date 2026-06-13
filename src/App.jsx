import React, { useState, useEffect, useCallback } from 'react';
import AnaSayfa from './components/AnaSayfa';
import GelirGiderEkle from './components/GelirGiderEkle';
import Raporlar from './components/Raporlar';
import Kategoriler from './components/Kategoriler';
import Borclar from './components/Borclar';
import ETicaret from './components/ETicaret';
import SirketGiderleri from './components/SirketGiderleri';
import VergiKdv from './components/VergiKdv';
import Hesaplama from './components/Hesaplama';
import api from './utils/api';

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
  const [bildirim, setBildirim] = useState(null);
  const [sonEklenenId, setSonEklenenId] = useState(null);
  const [duzenlenecekKayit, setDuzenlenecekKayit] = useState(null);
  const [borclar, setBorclar] = useState([]);
  const [eticaret, setETicaret] = useState([]);
  const [sirketGider, setSirketGider] = useState([]);
  const [vergiKdv, setVergiKdv] = useState([]);

  // ─── Veri Yükleme ─────────────────────────────────────────────────────────
  const verileriYukle = useCallback(async () => {
    try {
      const data = await api.veriOku();
      if (data) {
        setKategoriler(data.kategoriler || []);
        setKayitlar(data.kayitlar || []);
        setBorclar(data.borclar || []);
        setETicaret(data.eticaret || []);
        setSirketGider(data.sirketGider || []);
        setVergiKdv(data.vergiKdv || []);
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

  // ─── Bildirim Göster ──────────────────────────────────────────────────────
  const bildirimGoster = (mesaj, tur = 'basarili') => {
    setBildirim({ mesaj, tur });
    setTimeout(() => setBildirim(null), 3000);
  };

  // ─── Kayıt İşlemleri ──────────────────────────────────────────────────────
  const kayitEkle = async (kayit) => {
    const yeniKayit = {
      ...kayit,
      id: idOlustur(),
    };

    let basarili = false;
    try {
      const sonuc = await api.kayitEkle(yeniKayit);
      if (sonuc.basarili) {
        setKayitlar(sonuc.kayitlar);
        basarili = true;
      }
    } catch {
      setKayitlar((prev) => [...prev, yeniKayit]);
      basarili = true;
    }

    if (basarili) {
      setSonEklenenId(yeniKayit.id);
      setTimeout(() => setSonEklenenId(null), 1500);
      bildirimGoster('Fiş başarıyla kaydedildi');
      return true;
    }
    bildirimGoster('Kayıt eklenirken hata oluştu', 'hata');
    return false;
  };

  const kayitSil = async (kayitId) => {
    try {
      const sonuc = await api.kayitSil(kayitId);
      if (sonuc.basarili) {
        setKayitlar(sonuc.kayitlar);
        bildirimGoster('Kayıt silindi');
        return true;
      }
    } catch {
      setKayitlar((prev) => prev.filter((k) => k.id !== kayitId));
      bildirimGoster('Kayıt silindi');
      return true;
    }
    return false;
  };

  // ─── Düzenleme ─────────────────────────────────────────────────────────────
  const duzenleBaslat = (kayit) => {
    setDuzenlenecekKayit(kayit);
    setAktifSekme('ekle');
  };

  const kayitGuncelle = async (guncelKayit) => {
    try {
      const sonuc = await api.kayitGuncelle(guncelKayit);
      if (sonuc.basarili) {
        setKayitlar(sonuc.kayitlar);
        setDuzenlenecekKayit(null);
        bildirimGoster('Fiş güncellendi');
        return true;
      }
    } catch {
      setKayitlar((prev) => prev.map((k) => k.id === guncelKayit.id ? guncelKayit : k));
      setDuzenlenecekKayit(null);
      bildirimGoster('Fiş güncellendi');
      return true;
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
      if (sonuc.basarili) {
        setKategoriler(sonuc.kategoriler);
        bildirimGoster('Kategori eklendi');
        return true;
      }
    } catch {
      setKategoriler((prev) => [...prev, yeniKategori]);
      bildirimGoster('Kategori eklendi');
      return true;
    }
    return false;
  };

  const kategoriSil = async (kategoriId) => {
    try {
      const sonuc = await api.kategoriSil(kategoriId);
      if (sonuc.basarili) {
        setKategoriler(sonuc.kategoriler);
        setKayitlar(sonuc.kayitlar || []);
        bildirimGoster('Kategori silindi');
        return true;
      }
    } catch {
      setKategoriler((prev) => prev.filter((k) => k.id !== kategoriId));
      bildirimGoster('Kategori silindi');
      return true;
    }
    return false;
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
    { id: 'ekle', etiket: 'Fiş Kaydı', ikon: '➕' },
    { id: 'borclar', etiket: 'Borçlar', ikon: '💳' },
    { id: 'eticaret', etiket: 'E-Ticaret', ikon: '🛒' },
    { id: 'sirket', etiket: 'Şirket Gider', ikon: '🏢' },
    { id: 'vergi', etiket: 'Vergi / KDV', ikon: '🧾' },
    { id: 'hesaplama', etiket: 'Hesaplama', ikon: '🔢' },
    { id: 'raporlar', etiket: 'Raporlar', ikon: '📊' },
    { id: 'kategoriler', etiket: 'Hesap Planı', ikon: '📁' },
  ];

  const sekmeAdlari = {
    anasayfa: 'Ana Defter', ekle: 'Fiş Kaydı', borclar: 'Borçlar',
    eticaret: 'E-Ticaret', sirket: 'Şirket Giderleri',
    vergi: 'Vergi / KDV', hesaplama: 'Hesaplama',
    raporlar: 'Raporlar', kategoriler: 'Hesap Planı',
  };

  // ─── Yükleniyor ───────────────────────────────────────────────────────────
  if (yukleniyor) {
    return (
      <div className="yukleniyor-ekrani">
        <div className="yukleniyor-spinner"></div>
        <p>Bütçe Takip yükleniyor...</p>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="app">
      {/* Sol Menü */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">B</div>
          <div className="sidebar-logo-text">Bütçe <span>Takip</span></div>
        </div>

        <ul className="sidebar-menu">
          <li className="sidebar-label">Menü</li>
          {sekmeler.map((sekme) => (
            <li key={sekme.id}>
              <button
                className={`sidebar-btn ${aktifSekme === sekme.id ? 'aktif' : ''}`}
                onClick={() => setAktifSekme(sekme.id)}
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
          {aktifSekme === 'sirket' && (
            <SirketGiderleri data={sirketGider} api={api.sirketGider} />
          )}
          {aktifSekme === 'vergi' && (
            <VergiKdv data={vergiKdv} api={api.vergiKdv} />
          )}
          {aktifSekme === 'hesaplama' && <Hesaplama />}
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
    </div>
  );
}
