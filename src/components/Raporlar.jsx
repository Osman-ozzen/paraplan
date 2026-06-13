import React, { useMemo, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip as PieTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as BarTooltip,
  LineChart, Line, Tooltip as LineTooltip,
} from 'recharts';

// Canlı, parlak renk paleti
const RENKLER = [
  '#ff6b6b', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd',
  '#01a3a4', '#f368e0', '#ff9f43', '#00d2d3', '#ee5a24',
  '#0abde3', '#10ac84', '#ff6348', '#7bed9f', '#eccc68',
];

const GELIR_RENK = '#00b894';
const GIDER_RENK = '#ff6b6b';

const tl = (tutar) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(tutar);
const AYLAR = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
const ayYil = (t) => { const d = new Date(t); return `${AYLAR[d.getMonth()]} ${d.getFullYear()}`; };
const bugun = () => new Date().toISOString().split('T')[0];
const nGunOnce = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]; };

// Özel Tooltip - daha okunaklı
const OzelTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="recharts-tooltip">
        <div className="tooltip-label">{label || payload[0].name}</div>
        {payload.map((p, i) => (
          <div key={i} className="tooltip-deger" style={{ color: p.color }}>
            {p.name}: <strong>{tl(p.value)}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Raporlar({ kategoriler, kayitlar }) {
  const [donem, setDonem] = useState('aylik');

  const filtrelenmisKayitlar = useMemo(() => {
    const bugunStr = bugun();
    switch (donem) {
      case 'gunluk': return kayitlar.filter((k) => k.tarih === bugunStr);
      case 'haftalik': return kayitlar.filter((k) => k.tarih >= nGunOnce(7) && k.tarih <= bugunStr);
      case 'aylik': {
        const d = new Date();
        const ayBas = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
        return kayitlar.filter((k) => k.tarih >= ayBas && k.tarih <= bugunStr);
      }
      case 'yillik': {
        const d = new Date();
        const yilBas = new Date(d.getFullYear(), 0, 1).toISOString().split('T')[0];
        return kayitlar.filter((k) => k.tarih >= yilBas && k.tarih <= bugunStr);
      }
      default: return kayitlar;
    }
  }, [kayitlar, donem]);

  const kategoriAdi = (id) => {
    const kat = kategoriler.find((k) => k.id === id);
    return kat ? kat.ad : 'Bilinmeyen';
  };

  // Pasta verisi
  const pastaVerisi = useMemo(() => {
    const gruplar = {};
    filtrelenmisKayitlar.forEach((k) => {
      const ad = kategoriAdi(k.kategoriId);
      if (!gruplar[ad]) gruplar[ad] = { ad, deger: 0 };
      gruplar[ad].deger += k.tur === 'gelir' ? Number(k.tutar) : -Number(k.tutar);
    });
    return Object.values(gruplar).filter(g => g.deger !== 0);
  }, [filtrelenmisKayitlar, kategoriler]);

  // Gider dağılımı pasta
  const giderPasta = useMemo(() => {
    const gruplar = {};
    filtrelenmisKayitlar.filter(k => k.tur === 'gider').forEach((k) => {
      const ad = kategoriAdi(k.kategoriId);
      if (!gruplar[ad]) gruplar[ad] = { ad, deger: 0 };
      gruplar[ad].deger += Number(k.tutar);
    });
    return Object.values(gruplar).sort((a, b) => b.deger - a.deger);
  }, [filtrelenmisKayitlar, kategoriler]);

  // Gelir dağılımı pasta
  const gelirPasta = useMemo(() => {
    const gruplar = {};
    filtrelenmisKayitlar.filter(k => k.tur === 'gelir').forEach((k) => {
      const ad = kategoriAdi(k.kategoriId);
      if (!gruplar[ad]) gruplar[ad] = { ad, deger: 0 };
      gruplar[ad].deger += Number(k.tutar);
    });
    return Object.values(gruplar).sort((a, b) => b.deger - a.deger);
  }, [filtrelenmisKayitlar, kategoriler]);

  // Bar verisi
  const barVerisi = useMemo(() => {
    if (donem === 'yillik') {
      const aylik = {};
      kayitlar.forEach((k) => {
        const ay = ayYil(k.tarih);
        if (!aylik[ay]) aylik[ay] = { ad: ay, gelir: 0, gider: 0 };
        aylik[ay][k.tur] += Number(k.tutar);
      });
      return Object.values(aylik).sort((a, b) => a.ad.localeCompare(b.ad));
    } else {
      const gunluk = {};
      filtrelenmisKayitlar.forEach((k) => {
        if (!gunluk[k.tarih]) gunluk[k.tarih] = { ad: k.tarih, gelir: 0, gider: 0 };
        gunluk[k.tarih][k.tur] += Number(k.tutar);
      });
      return Object.values(gunluk).sort((a, b) => a.ad.localeCompare(b.ad));
    }
  }, [kayitlar, filtrelenmisKayitlar, donem]);

  // Özet
  const ozet = useMemo(() => {
    const gelir = filtrelenmisKayitlar.filter(k => k.tur === 'gelir').reduce((t, k) => t + Number(k.tutar), 0);
    const gider = filtrelenmisKayitlar.filter(k => k.tur === 'gider').reduce((t, k) => t + Number(k.tutar), 0);
    return { gelir, gider, karZarar: gelir - gider };
  }, [filtrelenmisKayitlar]);

  // Kategori detay
  const kategoriDetay = useMemo(() => {
    const gruplar = {};
    filtrelenmisKayitlar.forEach((k) => {
      const ad = kategoriAdi(k.kategoriId);
      if (!gruplar[ad]) gruplar[ad] = { ad, gelir: 0, gider: 0, adet: 0 };
      gruplar[ad][k.tur] += Number(k.tutar);
      gruplar[ad].adet += 1;
    });
    return Object.values(gruplar).sort((a, b) => (b.gelir + b.gider) - (a.gelir + a.gider));
  }, [filtrelenmisKayitlar, kategoriler]);

  return (
    <div>
      {/* Özet Paneller */}
      <div className="panel-grid">
        <div className="panel panel-gelir">
          <div className="panel-label">Gelir</div>
          <div className="panel-value">{tl(ozet.gelir)}</div>
        </div>
        <div className="panel panel-gider">
          <div className="panel-label">Gider</div>
          <div className="panel-value">{tl(ozet.gider)}</div>
        </div>
        <div className={`panel ${ozet.karZarar >= 0 ? 'panel-kar' : 'panel-zarar'}`}>
          <div className="panel-label">Net Durum</div>
          <div className="panel-value">{ozet.karZarar >= 0 ? '+' : '-'}{tl(Math.abs(ozet.karZarar))}</div>
        </div>
        <div className="panel">
          <div className="panel-label">Dönem</div>
          <div className="donem-filtre" style={{ marginTop: 6 }}>
            {['gunluk', 'haftalik', 'aylik', 'yillik'].map((d) => (
              <button key={d} className={`filtre-btn ${donem === d ? 'aktif' : ''}`}
                onClick={() => setDonem(d)}>
                {d === 'gunluk' ? 'Gün' : d === 'haftalik' ? 'Hafta' : d === 'aylik' ? 'Ay' : 'Yıl'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3 Grafik Yan Yana Üst Sıra */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 18 }}>
        {/* Pasta - Gider Dağılımı */}
        <div className="grafik-alani" style={{ marginBottom: 0 }}>
          <div className="grafik-baslik" style={{ marginBottom: 8 }}>
            <h3>Gider Dağılımı</h3>
          </div>
          {giderPasta.length === 0 ? (
            <div className="bos-mesaj" style={{ padding: 20 }}>Veri yok</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={giderPasta} dataKey="deger" nameKey="ad"
                  cx="50%" cy="50%" outerRadius={80} innerRadius={40}
                  label={({ ad, percent }) => `${(percent * 100).toFixed(0)}%`}>
                  {giderPasta.map((_, i) => <Cell key={i} fill={RENKLER[i % RENKLER.length]} stroke="#fff" strokeWidth={2} />)}
                </Pie>
                <PieTooltip content={<OzelTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 4 }}>
            {giderPasta.map((g, i) => (
              <span key={g.ad} style={{ margin: '0 4px' }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: RENKLER[i % RENKLER.length], marginRight: 2, verticalAlign: 'middle' }}></span>
                {g.ad}
              </span>
            ))}
          </div>
        </div>

        {/* Pasta - Gelir Dağılımı */}
        <div className="grafik-alani" style={{ marginBottom: 0 }}>
          <div className="grafik-baslik" style={{ marginBottom: 8 }}>
            <h3>Gelir Dağılımı</h3>
          </div>
          {gelirPasta.length === 0 ? (
            <div className="bos-mesaj" style={{ padding: 20 }}>Veri yok</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={gelirPasta} dataKey="deger" nameKey="ad"
                  cx="50%" cy="50%" outerRadius={80} innerRadius={40}
                  label={({ ad, percent }) => `${(percent * 100).toFixed(0)}%`}>
                  {gelirPasta.map((_, i) => <Cell key={i} fill={RENKLER[(i + 5) % RENKLER.length]} stroke="#fff" strokeWidth={2} />)}
                </Pie>
                <PieTooltip content={<OzelTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 4 }}>
            {gelirPasta.map((g, i) => (
              <span key={g.ad} style={{ margin: '0 4px' }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: RENKLER[(i + 5) % RENKLER.length], marginRight: 2, verticalAlign: 'middle' }}></span>
                {g.ad}
              </span>
            ))}
          </div>
        </div>

        {/* Çubuk Grafik - Gelir/Gider Karşılaştırma */}
        <div className="grafik-alani" style={{ marginBottom: 0 }}>
          <div className="grafik-baslik" style={{ marginBottom: 8 }}>
            <h3>Gelir / Gider</h3>
          </div>
          {barVerisi.length === 0 ? (
            <div className="bos-mesaj" style={{ padding: 20 }}>Veri yok</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barVerisi}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ad" tick={{ fontSize: 9, fill: '#475569', fontWeight: 600 }} />
                <YAxis tick={{ fontSize: 9, fill: '#475569' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <BarTooltip content={<OzelTooltip />} />
                <Bar dataKey="gelir" name="Gelir" fill={GELIR_RENK} radius={[4,4,0,0]} />
                <Bar dataKey="gider" name="Gider" fill={GIDER_RENK} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Alt Sıra - Çizgi Grafik + Bakiye */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
        <div className="grafik-alani" style={{ marginBottom: 0 }}>
          <div className="grafik-baslik" style={{ marginBottom: 8 }}>
            <h3>Bakiye Trendi</h3>
          </div>
          {barVerisi.length === 0 ? (
            <div className="bos-mesaj" style={{ padding: 20 }}>Veri yok</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={barVerisi}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ad" tick={{ fontSize: 9, fill: '#475569', fontWeight: 600 }} />
                <YAxis tick={{ fontSize: 9, fill: '#475569' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <LineTooltip content={<OzelTooltip />} />
                <Line type="monotone" dataKey="gelir" name="Gelir" stroke={GELIR_RENK} strokeWidth={3} dot={{ r: 3, fill: GELIR_RENK, strokeWidth: 2, stroke: '#fff' }} />
                <Line type="monotone" dataKey="gider" name="Gider" stroke={GIDER_RENK} strokeWidth={3} dot={{ r: 3, fill: GIDER_RENK, strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grafik-alani" style={{ marginBottom: 0 }}>
          <div className="grafik-baslik" style={{ marginBottom: 8 }}>
            <h3>Net Bakiye (Kar/Zarar)</h3>
          </div>
          {pastaVerisi.length === 0 ? (
            <div className="bos-mesaj" style={{ padding: 20 }}>Veri yok</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pastaVerisi} dataKey="deger" nameKey="ad"
                  cx="50%" cy="50%" outerRadius={80}
                  label={({ ad, deger }) => `${ad}`}>
                  {pastaVerisi.map((_, i) => <Cell key={i} fill={RENKLER[i % RENKLER.length]} stroke="#fff" strokeWidth={2} />)}
                </Pie>
                <PieTooltip content={<OzelTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Hesap Detay Tablosu */}
      <div className="tablo-kapsayici">
        <div className="tablo-baslik">
          <h3>Hesap Detayı</h3>
        </div>
        {kategoriDetay.length === 0 ? (
          <div className="bos-mesaj">Bu dönemde kayıt bulunmuyor.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Hesap</th>
                <th className="tutar">Gelir</th>
                <th className="tutar">Gider</th>
                <th className="tutar">Net</th>
                <th className="tutar">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {kategoriDetay.map((kat, i) => (
                <tr key={kat.ad}>
                  <td>
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: RENKLER[i % RENKLER.length], marginRight: 8, verticalAlign: 'middle', border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}></span>
                    <strong>{kat.ad}</strong>
                  </td>
                  <td className="tutar deger-gelir">{kat.gelir > 0 ? tl(kat.gelir) : '-'}</td>
                  <td className="tutar deger-gider">{kat.gider > 0 ? tl(kat.gider) : '-'}</td>
                  <td className={`tutar ${kat.gelir - kat.gider >= 0 ? 'deger-gelir' : 'deger-gider'}`}
                    style={{ fontWeight: 800 }}>
                    {kat.gelir - kat.gider !== 0 ? tl(kat.gelir - kat.gider) : '-'}
                  </td>
                  <td className="tutar" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{kat.adet}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
