import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

const tl = (t) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(t);
const aylar = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const AYLAR_KISA = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const simdi = new Date();
const icindeBulunulanAy = `${simdi.getFullYear()}-${String(simdi.getMonth() + 1).padStart(2, '0')}`;

const giderKategorileri = [
  'Kira', 'Elektrik', 'Su', 'Doğalgaz', 'İnternet', 'Telefon',
  'Sigorta', 'Muhasebe', 'Çalışan Maaş', 'SGK & Vergi',
  'Ofis Gideri', 'Depo Kira', 'Yazılım & Abonelik',
  'Reklam & Pazarlama', 'Ulaşım & Akaryakıt', 'Banka Aidat',
  'Kefalet & Kredi', 'Diğer Sabit Gider',
];

const gelirKategorileri = [
  'Maaş', 'Kira Geliri', 'Serbest Çalışma', 'Danışmanlık',
  'E-Ticaret Geliri', 'Faiz / Temettü', 'Kira Geliri',
  'Freelance', 'Ek İş', 'Diğer Sabit Gelir',
];

const periyotlar = [
  { deger: '1', etiket: 'Sadece bu ay' },
  { deger: '3', etiket: '3 ay tekrarla' },
  { deger: '6', etiket: '6 ay tekrarla' },
  { deger: '12', etiket: '12 ay tekrarla' },
  { deger: '24', etiket: '24 ay tekrarla' },
];

const turler = [
  { id: 'gider', etiket: 'Gider', renk: '#ef4444' },
  { id: 'gelir', etiket: 'Gelir', renk: '#10b981' },
];

const varsayilan = {
  tur: 'gider',
  ad: '',
  kategori: '',
  tutar: '',
  ay: icindeBulunulanAy,
  odemeGunu: '1',
  periyot: '1',
  odendi: false,
  aciklama: '',
};

// Kategori eşleştirme: sabit gider/gelir kategorisi → ana defter kategoriId
const kategoriEsle = (kategori, tur, kategoriler) => {
  if (!kategori) return tur === 'gelir' ? 'gelir-diger' : 'gider-diger';
  const eslesme = {
    'Maaş': 'gelir-maas', 'Kira Geliri': 'gelir-yatirim',
    'Serbest Çalışma': 'gelir-serbest', 'Danışmanlık': 'gelir-serbest',
    'E-Ticaret Geliri': 'gelir-diger', 'Faiz / Temettü': 'gelir-yatirim',
    'Freelance': 'gelir-serbest', 'Ek İş': 'gelir-serbest',
    'Diğer Sabit Gelir': 'gelir-diger',
    'Kira': 'gider-kira', 'Depo Kira': 'gider-kira',
    'Elektrik': 'gider-fatura', 'Su': 'gider-fatura',
    'Doğalgaz': 'gider-fatura', 'İnternet': 'gider-fatura',
    'Telefon': 'gider-fatura',
    'Sigorta': 'gider-diger', 'Muhasebe': 'gider-diger',
    'Çalışan Maaş': 'gider-diger', 'SGK & Vergi': 'gider-diger',
    'Ofis Gideri': 'gider-diger',
    'Yazılım & Abonelik': 'gider-diger',
    'Reklam & Pazarlama': 'gider-diger',
    'Ulaşım & Akaryakıt': 'gider-ulasim',
    'Banka Aidat': 'gider-diger',
    'Kefalet & Kredi': 'gider-diger',
    'Diğer Sabit Gider': 'gider-diger',
  };
  const eslenenId = eslesme[kategori];
  if (eslenenId) return eslenenId;
  // Kategoriler içinde ara
  const bulunan = (kategoriler || []).find(k => k.ad === kategori || k.id === kategori);
  return bulunan ? bulunan.id : (tur === 'gelir' ? 'gelir-diger' : 'gider-diger');
};

export default function AylikGiderler({ data, api, kayitEkle, kategoriler, seciliAy, setSeciliAy }) {
  const [liste, setListe] = useState(data || []);
  useEffect(() => { setListe(data || []); }, [data]);

  const [form, setForm] = useState(varsayilan);
  const [ekleniyor, setEkleniyor] = useState(false);
  const [duzenlenen, setDuzenlenen] = useState(null);
  const [filtreAy, setFiltreAy] = useState(icindeBulunulanAy);
  const [filtreTur, setFiltreTur] = useState('tumu');
  const [filtreKategori, setFiltreKategori] = useState([]); // array: çoklu seçim
  const [secili, setSecili] = useState([]);

  // Ana sayfadan ay seçilince filtreyi otomatik ayarla
  useEffect(() => {
    if (seciliAy) {
      setFiltreAy(seciliAy);
      if (setSeciliAy) setSeciliAy(null);
    }
  }, [seciliAy]);

  const h = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const turDegistir = (tur) => {
    setForm({ ...varsayilan, tur, ay: form.ay });
  };

  // ─── Kaydet ───────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.ad || !form.tutar) return;
    setEkleniyor(true);

    const periyot = parseInt(form.periyot) || 1;
    const tutar = parseFloat(form.tutar) || 0;
    const odemeGunu = parseInt(form.odemeGunu) || 1;

    if (duzenlenen) {
      const sonuc = await api.guncelle({ ...form, tutar, odemeGunu, id: duzenlenen.id });
      if (sonuc.basarili) {
        const key = Object.keys(sonuc).find(k => k !== 'basarili');
        setListe(sonuc[key]);
        setForm(varsayilan);
        setDuzenlenen(null);
      }
      setEkleniyor(false);
      return;
    }

    const [yil, ay] = form.ay.split('-').map(Number);
    let basariliCount = 0;
    let sonListe = [];

    for (let i = 0; i < periyot; i++) {
      const ayToplam = ay + i;
      const hedefYil = yil + Math.floor((ayToplam - 1) / 12);
      const hedefAy = ((ayToplam - 1) % 12) + 1;
      const ayStr = `${hedefYil}-${String(hedefAy).padStart(2, '0')}`;

      const payload = {
        tur: form.tur,
        ad: form.ad,
        kategori: form.kategori,
        tutar,
        ay: ayStr,
        odemeGunu,
        periyot: String(periyot),
        odendi: i === 0 ? form.odendi : false,
        aciklama: i > 0 ? `${form.aciklama} (${periyot} ay periyot)`.trim() : form.aciklama,
      };

      const sonuc = await api.ekle(payload);
      if (sonuc.basarili) {
        basariliCount++;
        const key = Object.keys(sonuc).find(k => k !== 'basarili');
        sonListe = sonuc[key];
      }

      // Ana deftere de işle (kayitEkle)
      if (kayitEkle) {
        const gun = String(odemeGunu).padStart(2, '0');
        kayitEkle({
          tur: form.tur,
          kategoriId: kategoriEsle(form.kategori, form.tur, kategoriler),
          tutar,
          tarih: `${ayStr}-${gun}`,
          aciklama: `[Sabit] ${form.ad}${form.kategori ? ` (${form.kategori})` : ''}`,
        });
      }
    }

    if (basariliCount > 0) {
      setListe(sonListe);
      setForm(varsayilan);
      setDuzenlenen(null);
    }
    setEkleniyor(false);
  };

  const duzenle = (item) => {
    setDuzenlenen(item);
    setForm({
      tur: item.tur || 'gider',
      ad: item.ad || '',
      kategori: item.kategori || '',
      tutar: String(item.tutar || ''),
      ay: item.ay || icindeBulunulanAy,
      odemeGunu: String(item.odemeGunu || '1'),
      periyot: '1',
      odendi: item.odendi || false,
      aciklama: item.aciklama || '',
    });
  };

  const sil = async (id) => {
    const s = await api.sil(id);
    if (s.basarili) {
      const k = Object.keys(s).find(kk => kk !== 'basarili');
      setListe(s[k]);
    }
  };

  const odendiToggle = async (item) => {
    const sonuc = await api.guncelle({ ...item, odendi: !item.odendi });
    if (sonuc.basarili) {
      const k = Object.keys(sonuc).find(kk => kk !== 'basarili');
      setListe(sonuc[k]);
    }
  };

  // ─── Aynı addakileri seç ──────────────────────────────────────────────
  const ayniAdiSec = (ad) => {
    const ids = liste.filter(i => i && i.ad === ad).map(i => i.id);
    setSecili(prev => {
      const zatenVar = ids.every(id => prev.includes(id));
      if (zatenVar) return prev.filter(id => !ids.includes(id));
      const yeni = [...prev];
      ids.forEach(id => { if (!yeni.includes(id)) yeni.push(id); });
      return yeni;
    });
  };

  // ─── Toplu silme ──────────────────────────────────────────────────────
  const secimToggle = (id) => {
    setSecili(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const tumunuSecToggle = () => {
    if (secili.length === filtreliListe.length) setSecili([]);
    else setSecili(filtreliListe.map(i => i.id));
  };

  const topluSil = async () => {
    if (secili.length === 0) return;
    if (!confirm(`${secili.length} kaydı silmek istediğine emin misin?`)) return;
    let sonListe = [];
    for (const id of secili) {
      const s = await api.sil(id);
      if (s.basarili) {
        const k = Object.keys(s).find(kk => kk !== 'basarili');
        sonListe = s[k];
      }
    }
    setListe(sonListe);
    setSecili([]);
  };

  // ─── Filtreleme ───────────────────────────────────────────────────────
  const filtreliListe = useMemo(() => {
    let sonuc = [...liste].filter(i => i);
    if (filtreAy !== 'tumu') sonuc = sonuc.filter(i => i.ay === filtreAy);
    if (filtreTur !== 'tumu') sonuc = sonuc.filter(i => i.tur === filtreTur);
    if (filtreKategori.length > 0) sonuc = sonuc.filter(i => filtreKategori.includes(i.kategori));
    return sonuc.sort((a, b) => (a.ay || '').localeCompare(b.ay || ''));
  }, [liste, filtreAy, filtreTur, filtreKategori]);

  const formKategoriler = form.tur === 'gelir' ? gelirKategorileri : giderKategorileri;

  const mevcutAylar = useMemo(() => {
    const set = new Set();
    liste.forEach(i => { if (i?.ay) set.add(i.ay); });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [liste]);

  const ayEtiketi = (ay) => {
    if (!ay) return '—';
    const [y, m] = ay.split('-');
    return `${aylar[parseInt(m) - 1] || ''} ${y}`;
  };

  // ─── Hesaplama Grafiği ────────────────────────────────────────────────
  const grafikVerisi = useMemo(() => {
    const aylik = {};
    liste.filter(i => i).forEach(i => {
      const ay = (i.ay || '?').slice(0, 7);
      if (!aylik[ay]) aylik[ay] = { ay, gelir: 0, gider: 0 };
      const tutar = Number(i.tutar) || 0;
      if (i.tur === 'gelir') aylik[ay].gelir += tutar;
      else aylik[ay].gider += tutar;
    });

    return Object.values(aylik)
      .sort((a, b) => a.ay.localeCompare(b.ay))
      .slice(-6)
      .map(v => {
        const [y, m] = v.ay.split('-');
        return { ...v, ay: `${AYLAR_KISA[parseInt(m) - 1] || ''} ${y.slice(2)}` };
      });
  }, [liste]);

  // ─── Toplamlar (gelir/gider ayrı) ─────────────────────────────────────
  const toplamlar = useMemo(() => {
    const gecerli = liste.filter(i => i);
    const buAy = gecerli.filter(i => i.ay === icindeBulunulanAy);

    const topla = (arr, tur, odendiMi = null) => {
      let f = arr;
      if (tur) f = f.filter(i => i.tur === tur);
      if (odendiMi !== null) f = f.filter(i => i.odendi === odendiMi);
      return f.reduce((t, i) => t + (Number(i.tutar) || 0), 0);
    };

    return {
      toplamGelir: topla(gecerli, 'gelir'),
      toplamGider: topla(gecerli, 'gider'),
      net: topla(gecerli, 'gelir') - topla(gecerli, 'gider'),
      buAyGelir: topla(buAy, 'gelir'),
      buAyGider: topla(buAy, 'gider'),
      buAyNet: topla(buAy, 'gelir') - topla(buAy, 'gider'),
      buAyOdenenGelir: topla(buAy, 'gelir', true),
      buAyOdenenGider: topla(buAy, 'gider', true),
      buAyBekleyenGelir: topla(buAy, 'gelir', false),
      buAyBekleyenGider: topla(buAy, 'gider', false),
    };
  }, [liste]);

  // ─── Aya göre gruplama ───────────────────────────────────────────────
  const ayGruplari = useMemo(() => {
    const gruplar = {};
    filtreliListe.forEach(i => {
      const ay = i.ay || 'bilinmiyor';
      if (!gruplar[ay]) gruplar[ay] = [];
      gruplar[ay].push(i);
    });
    return Object.entries(gruplar).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtreliListe]);

  return (
    <div>
      {/* ====== ÖZET PANEL ====== */}
      <div className="panel-grid">
        <div className="panel panel-gelir">
          <div className="panel-label">Sabit Gelir (Bu Ay)</div>
          <div className="panel-value">{tl(toplamlar.buAyGelir)}</div>
          <div className="panel-sub">Ödenen: {tl(toplamlar.buAyOdenenGelir)}</div>
        </div>
        <div className="panel panel-gider">
          <div className="panel-label">Sabit Gider (Bu Ay)</div>
          <div className="panel-value">{tl(toplamlar.buAyGider)}</div>
          <div className="panel-sub">Ödenen: {tl(toplamlar.buAyOdenenGider)}</div>
        </div>
        <div className={`panel ${toplamlar.buAyNet >= 0 ? 'panel-kar' : 'panel-zarar'}`}>
          <div className="panel-label">Net (Bu Ay)</div>
          <div className="panel-value">{tl(toplamlar.buAyNet)}</div>
          <div className="panel-sub">{toplamlar.buAyNet >= 0 ? 'Fazla' : 'Açık'}</div>
        </div>
        <div className="panel panel-kar">
          <div className="panel-label">Tüm Zamanlar Net</div>
          <div className="panel-value">{tl(toplamlar.net)}</div>
          <div className="panel-sub">Gelir: {tl(toplamlar.toplamGelir)} / Gider: {tl(toplamlar.toplamGider)}</div>
        </div>
      </div>

      {/* ====== GRAFİK: Aylık Karşılaştırma ====== */}
      {grafikVerisi.length > 0 && (
        <div className="grafik-alani">
          <div className="grafik-baslik">
            <h3>📊 Aylık Sabit Gelir / Gider Karşılaştırması</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={grafikVerisi}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="ay" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => tl(v)} />
              <Bar dataKey="gelir" name="Gelir" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gider" name="Gider" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ====== FİLTRE ====== */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <div className="donem-filtre">
          <button className={`filtre-btn ${filtreAy === icindeBulunulanAy ? 'aktif' : ''}`}
            onClick={() => setFiltreAy(icindeBulunulanAy)}>Bu Ay</button>
          <button className={`filtre-btn ${filtreAy === 'tumu' ? 'aktif' : ''}`}
            onClick={() => setFiltreAy('tumu')}>Tümü</button>
        </div>
        <select value={filtreAy} onChange={(e) => setFiltreAy(e.target.value)}
          style={{ padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, fontFamily: 'inherit', background: 'white' }}>
          <option value="tumu">Tüm Aylar</option>
          {mevcutAylar.map(a => <option key={a} value={a}>{ayEtiketi(a)}</option>)}
        </select>
        <select value={filtreTur} onChange={(e) => setFiltreTur(e.target.value)}
          style={{ padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, fontFamily: 'inherit', background: 'white' }}>
          <option value="tumu">Gelir + Gider</option>
          <option value="gelir">Sadece Gelir</option>
          <option value="gider">Sadece Gider</option>
        </select>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 400 }}>
          {/* Aktif seçili olanlar */}
          {filtreKategori.map(k => (
            <span key={k} onClick={() => setFiltreKategori(prev => prev.filter(x => x !== k))}
              style={{
                padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                background: '#6366f1', color: 'white', display: 'inline-flex', alignItems: 'center', gap: 4,
              }}>
              ✕ {k}
            </span>
          ))}
          {/* Eğer seçili yoksa "Tümü" göster, tıklayınca dropdown aç */}
          {filtreKategori.length === 0 && (
            <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 600, color: 'var(--text-light)', background: '#f1f5f9' }}>
              Tüm Kategoriler
            </span>
          )}
          {/* Hızlı kategoriler (dropdown yerine tıklanabilir etiketler) */}
          <span style={{ fontSize: 10, color: 'var(--text-light)', display: 'flex', alignItems: 'center' }}>|</span>
          {[...new Set([...giderKategorileri, ...gelirKategorileri].filter(k => !filtreKategori.includes(k)))].slice(0, 6).map(k => (
            <span key={k} onClick={() => setFiltreKategori(prev => [...prev, k])}
              style={{
                padding: '3px 8px', borderRadius: 12, fontSize: 9, fontWeight: 500, cursor: 'pointer',
                background: '#f1f5f9', color: 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}>
              +{k}
            </span>
          ))}
          {filtreKategori.length > 0 && (
            <span onClick={() => setFiltreKategori([])}
              style={{ padding: '3px 8px', borderRadius: 12, fontSize: 9, fontWeight: 600, cursor: 'pointer', color: '#dc2626' }}>
              Temizle
            </span>
          )}
        </div>
      </div>

      {/* ====== FORM ====== */}
      <div className="form-kutu" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}>
          {duzenlenen ? '✏️ Kaydı Düzenle' : '➕ Yeni Kayıt'}
        </h3>

        {/* Tür seçici */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 12, background: 'var(--bg-alt)', borderRadius: 8, padding: 3, width: 'fit-content' }}>
          {turler.map(t => (
            <button key={t.id} type="button" onClick={() => turDegistir(t.id)}
              style={{
                padding: '6px 18px', border: 'none', borderRadius: 6,
                fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                background: form.tur === t.id ? t.renk : 'transparent',
                color: form.tur === t.id ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}>
              {t.etiket}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="ekle-form">
          <div className="form-row">
            <div className="form-grup" style={{ flex: 1 }}>
              <label>Ad</label>
              <input name="ad" value={form.ad} onChange={h} className="form-input"
                placeholder={form.tur === 'gelir' ? 'Örn: Maaş, Kira...' : 'Örn: Kira, Elektrik...'} required />
            </div>
            <div className="form-grup" style={{ flex: '0 0 160px' }}>
              <label>Kategori</label>
              <select name="kategori" value={form.kategori} onChange={h} className="form-select">
                <option value="">-- Seç --</option>
                {formKategoriler.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div className="form-grup" style={{ flex: '0 0 120px' }}>
              <label>💳 Tutar</label>
              <input name="tutar" type="number" step="0.01" value={form.tutar} onChange={h} className="form-input" required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-grup" style={{ flex: '0 0 120px' }}>
              <label>📅 Başlangıç Ayı</label>
              <input name="ay" type="month" value={form.ay} onChange={h} className="form-input" />
            </div>
            <div className="form-grup" style={{ flex: '0 0 80px' }}>
              <label>Ödeme Günü</label>
              <input name="odemeGunu" type="number" min="1" max="31" value={form.odemeGunu} onChange={h} className="form-input" />
            </div>
            {!duzenlenen && (
              <div className="form-grup" style={{ flex: '0 0 130px' }}>
                <label>🔄 Tekrarlama</label>
                <select name="periyot" value={form.periyot} onChange={h} className="form-select">
                  {periyotlar.map(p => <option key={p.deger} value={p.deger}>{p.etiket}</option>)}
                </select>
              </div>
            )}
            <div className="form-grup" style={{ flex: '0 0 120px', display: 'flex', alignItems: 'center', gap: 6, paddingTop: 20 }}>
              <input type="checkbox" id="odendi" checked={form.odendi} onChange={(e) => setForm({ ...form, odendi: e.target.checked })} />
              <label htmlFor="odendi" style={{ fontSize: 12, cursor: 'pointer' }}>Ödendi</label>
            </div>
          </div>
          <div className="form-row" style={{ alignItems: 'flex-end' }}>
            <div className="form-grup" style={{ flex: 1 }}>
              <label>Açıklama</label>
              <input name="aciklama" value={form.aciklama} onChange={h} className="form-input" placeholder="Opsiyonel" />
            </div>
            <div style={{ display: 'flex', gap: 8, paddingBottom: 2 }}>
              <button type="submit" className="btn-ekle gelir" disabled={ekleniyor}
                style={{ background: form.tur === 'gelir' ? '#10b981' : '#ef4444' }}>
                {ekleniyor ? '...' : duzenlenen ? 'Güncelle' : 'Ekle'}
              </button>
              {duzenlenen && (
                <button type="button" className="btn-ekle" style={{ background: 'linear-gradient(135deg, #64748b, #475569)' }}
                  onClick={() => { setDuzenlenen(null); setForm(varsayilan); }}>İptal</button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* ====== LİSTE ====== */}
      <div className="tablo-kapsayici">
        <div className="tablo-baslik">
          <h3>Sabit Gelir / Gider Kayıtları {filtreliListe.length > 0 &&
            <span style={{ fontWeight: 400, color: 'var(--text-light)', fontSize: 12 }}>({filtreliListe.length} kayıt)</span>}</h3>
          {secili.length > 0 && (
            <button onClick={topluSil} style={{
              padding: '5px 14px', border: 'none', borderRadius: 6,
              background: '#fee2e2', color: '#dc2626', fontSize: 11, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              🗑 {secili.length} kaydı sil
            </button>
          )}
        </div>

        {filtreliListe.length === 0 ? (
          <div className="bos-mesaj">Henüz kayıt yok. Yukarıdaki formu kullanarak aylık sabit gelir/gider ekleyebilirsin.</div>
        ) : (
          <div>
            {ayGruplari.map(([ay, items]) => {
              const ayGelir = items.filter(i => i.tur === 'gelir').reduce((t, i) => t + (Number(i.tutar) || 0), 0);
              const ayGider = items.filter(i => i.tur === 'gider').reduce((t, i) => t + (Number(i.tutar) || 0), 0);
              return (
                <div key={ay} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 16px', background: 'var(--bg-alt)', fontWeight: 700, fontSize: 12,
                  }}>
                    <span>{ayEtiketi(ay)}</span>
                    <span style={{ display: 'flex', gap: 16 }}>
                      {ayGelir > 0 && <span style={{ color: '#059669' }}>Gelir: {tl(ayGelir)}</span>}
                      {ayGider > 0 && <span style={{ color: '#dc2626' }}>Gider: {tl(ayGider)}</span>}
                      <span style={{ color: (ayGelir - ayGider) >= 0 ? '#059669' : '#dc2626' }}>
                        Net: {tl(ayGelir - ayGider)}
                      </span>
                    </span>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: 32 }}>
                          <input type="checkbox" checked={secili.length === filtreliListe.length && filtreliListe.length > 0}
                            onChange={tumunuSecToggle}
                            style={{ cursor: 'pointer', accentColor: '#6366f1' }} />
                        </th>
                        <th style={{ width: 40 }}>Tür</th>
                        <th>Ad</th>
                        <th>Kategori</th>
                        <th>Öd. Günü</th>
                        <th className="tutar">Tutar</th>
                        <th>Durum</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(i => (
                        <tr key={i.id} style={{ opacity: i.odendi ? 0.6 : 1, background: secili.includes(i.id) ? '#eef2ff' : undefined }}>
                          <td>
                            <input type="checkbox" checked={secili.includes(i.id)} onChange={() => secimToggle(i.id)}
                              style={{ cursor: 'pointer', accentColor: '#6366f1' }} />
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-block', padding: '1px 6px', borderRadius: 4,
                              fontSize: 9, fontWeight: 700, color: 'white',
                              background: i.tur === 'gelir' ? '#10b981' : '#ef4444',
                            }}>
                              {i.tur === 'gelir' ? 'G' : 'Gd'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            <span onClick={() => ayniAdiSec(i.ad)} title="Aynı addaki tüm kayıtları seç"
                              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              {i.ad}
                              <span style={{ fontSize: 9, color: 'var(--text-light)', opacity: 0.4, fontWeight: 400 }}>◎</span>
                            </span>
                          </td>
                          <td><span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{i.kategori || '—'}</span></td>
                          <td style={{ fontSize: 11, color: 'var(--text-light)' }}>{i.odemeGunu || '—'}</td>
                          <td className="tutar" style={{ color: i.tur === 'gelir' ? '#059669' : '#dc2626' }}>
                            {tl(i.tutar || 0)}
                          </td>
                          <td>
                            <span onClick={() => odendiToggle(i)} style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              cursor: 'pointer', padding: '2px 8px', borderRadius: 10,
                              fontSize: 10, fontWeight: 600,
                              background: i.odendi ? '#d1fae5' : '#fee2e2',
                              color: i.odendi ? '#059669' : '#dc2626',
                              transition: 'all 0.2s',
                            }}>
                              {i.odendi ? '✓ Ödendi' : '○ Bekliyor'}
                            </span>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <button className="btn-duzenle" onClick={() => duzenle(i)} title="Düzenle">✎</button>
                            <button className="btn-sil" onClick={() => sil(i.id)} title="Sil">x</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
