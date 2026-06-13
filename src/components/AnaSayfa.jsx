import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const formatTarih = (tarih) => {
  const d = new Date(tarih);
  return d.toLocaleDateString('tr-TR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
};

const bugun = () => new Date().toISOString().split('T')[0];
const ayinIlkGunu = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
const yilinIlkGunu = () => new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];

const tl = (tutar) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency', currency: 'TRY', minimumFractionDigits: 2,
  }).format(tutar);

const RENKLER = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#6366f1'];

export default function AnaSayfa({ kategoriler, kayitlar, kayitSil, sonEklenenId, duzenleBaslat }) {
  const [seciliDonem, setSeciliDonem] = useState('aylik');
  const [siliniyor, setSiliniyor] = useState(null);

  const hesaplamalar = useMemo(() => {
    const bugunStr = bugun();
    const ayIlk = ayinIlkGunu();
    const yilIlk = yilinIlkGunu();

    const buAy = kayitlar.filter((k) => k.tarih >= ayIlk && k.tarih <= bugunStr);
    const buYil = kayitlar.filter((k) => k.tarih >= yilIlk && k.tarih <= bugunStr);

    const topla = (arr, tur) => arr.filter(k => k.tur === tur).reduce((t, k) => t + Number(k.tutar), 0);

    return {
      toplamGelir: topla(kayitlar, 'gelir'), toplamGider: topla(kayitlar, 'gider'),
      toplamKarZarar: topla(kayitlar, 'gelir') - topla(kayitlar, 'gider'),
      buAyGelir: topla(buAy, 'gelir'), buAyGider: topla(buAy, 'gider'),
      buAyKarZarar: topla(buAy, 'gelir') - topla(buAy, 'gider'),
      buYilGelir: topla(buYil, 'gelir'), buYilGider: topla(buYil, 'gider'),
      buYilKarZarar: topla(buYil, 'gelir') - topla(buYil, 'gider'),
    };
  }, [kayitlar]);

  const goruntulenecekKayitlar = useMemo(() => {
    const bugunStr = bugun();
    let f = [];
    if (seciliDonem === 'gunluk') f = kayitlar.filter((k) => k.tarih === bugunStr);
    else if (seciliDonem === 'aylik') f = kayitlar.filter((k) => k.tarih >= ayinIlkGunu() && k.tarih <= bugunStr);
    else if (seciliDonem === 'yillik') f = kayitlar.filter((k) => k.tarih >= yilinIlkGunu() && k.tarih <= bugunStr);
    else f = [...kayitlar];
    return f.sort((a, b) => b.tarih.localeCompare(a.tarih)).slice(0, 20);
  }, [kayitlar, seciliDonem]);

  const pastaVerisi = useMemo(() => {
    const gruplar = {};
    const bugunStr = bugun();
    const ayIlk = ayinIlkGunu();
    const buAy = kayitlar.filter((k) => k.tarih >= ayIlk && k.tarih <= bugunStr);
    buAy.forEach((k) => {
      const kat = kategoriler.find(x => x.id === k.kategoriId);
      const ad = kat ? kat.ad : 'Diğer';
      if (!gruplar[ad]) gruplar[ad] = { ad, deger: 0 };
      gruplar[ad].deger += Number(k.tutar);
    });
    return Object.values(gruplar);
  }, [kayitlar, kategoriler]);

  const kategoriAdiBul = (id) => {
    const kat = kategoriler.find((k) => k.id === id);
    return kat ? kat.ad : 'Bilinmeyen';
  };

  const handleSil = async (id) => {
    setSiliniyor(id);
    await kayitSil(id);
    setSiliniyor(null);
  };

  return (
    <div>
      {/* Paneller */}
      <div className="panel-grid">
        <div className="panel panel-gelir">
          <div className="panel-label">Toplam Gelir</div>
          <div className="panel-value">{tl(hesaplamalar.toplamGelir)}</div>
          <div className="panel-sub">Bu ay: {tl(hesaplamalar.buAyGelir)}</div>
        </div>
        <div className="panel panel-gider">
          <div className="panel-label">Toplam Gider</div>
          <div className="panel-value">{tl(hesaplamalar.toplamGider)}</div>
          <div className="panel-sub">Bu ay: {tl(hesaplamalar.buAyGider)}</div>
        </div>
        <div className={`panel ${hesaplamalar.toplamKarZarar >= 0 ? 'panel-kar' : 'panel-zarar'}`}>
          <div className="panel-label">Net Bakiye</div>
          <div className="panel-value">{tl(hesaplamalar.toplamKarZarar)}</div>
          <div className="panel-sub">{hesaplamalar.toplamKarZarar >= 0 ? 'Kâr' : 'Zarar'}</div>
        </div>
        <div className="panel panel-kar">
          <div className="panel-label">Bu Ay</div>
          <div className="panel-value">{tl(hesaplamalar.buAyKarZarar)}</div>
          <div className="panel-sub">Gelir: {tl(hesaplamalar.buAyGelir)} / Gider: {tl(hesaplamalar.buAyGider)}</div>
        </div>
      </div>

      <div className="panel-grid">
        <div className="panel">
          <div className="panel-label">Bu Yıl</div>
          <div className="panel-value">{tl(hesaplamalar.buYilKarZarar)}</div>
          <div className="panel-sub">Gelir: {tl(hesaplamalar.buYilGelir)} / Gider: {tl(hesaplamalar.buYilGider)}</div>
        </div>
        <div className="panel">
          <div className="panel-label">Toplam Kayıt</div>
          <div className="panel-value" style={{ fontSize: 26 }}>{kayitlar.length}</div>
          <div className="panel-sub">
            {kayitlar.filter(k => k.tur === 'gelir').length} Gelir / {kayitlar.filter(k => k.tur === 'gider').length} Gider
          </div>
        </div>
        <div className="panel">
          <div className="panel-label">Bu Ay Dağılım</div>
          {pastaVerisi.length > 0 ? (
            <ResponsiveContainer width="100%" height={80}>
              <PieChart>
                <Pie data={pastaVerisi} dataKey="deger" cx="50%" cy="50%" innerRadius={22} outerRadius={35}>
                  {pastaVerisi.map((_, i) => <Cell key={i} fill={RENKLER[i % RENKLER.length]} stroke="#fff" strokeWidth={2} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="panel-sub">Veri yok</div>
          )}
        </div>
        <div className="panel">
          <div className="panel-label">Dönem</div>
          <div className="donem-filtre" style={{ marginTop: 6 }}>
            {['gunluk', 'aylik', 'yillik', 'tum'].map((d) => (
              <button key={d} className={`filtre-btn ${seciliDonem === d ? 'aktif' : ''}`}
                onClick={() => setSeciliDonem(d)}>
                {d === 'gunluk' ? 'Gün' : d === 'aylik' ? 'Ay' : d === 'yillik' ? 'Yıl' : 'Tüm'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Yevmiye Defteri Tablosu */}
      <div className="tablo-kapsayici">
        <div className="tablo-baslik">
          <h3>
            Yevmiye Defteri
            <span className="donem-bilgisi">
              ({seciliDonem === 'gunluk' ? 'Bugün' : seciliDonem === 'aylik' ? 'Bu Ay' : seciliDonem === 'yillik' ? 'Bu Yıl' : 'Tümü'})
            </span>
          </h3>
        </div>

        {goruntulenecekKayitlar.length === 0 ? (
          <div className="bos-mesaj">Henüz kayıt bulunmuyor. Fiş ekleyerek başlayın!</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{width: 55}}>Fiş</th>
                <th style={{width: 85}}>Tarih</th>
                <th>Hesap</th>
                <th>Açıklama</th>
                <th className="tutar" style={{width: 105}}>Gelir</th>
                <th className="tutar" style={{width: 105}}>Gider</th>
                <th style={{width: 55}}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {goruntulenecekKayitlar.map((kayit) => (
                <tr key={kayit.id} className={sonEklenenId === kayit.id ? 'yeni-kayit' : ''}>
                  <td className="tablo-kod">{String(kayitlar.indexOf(kayit) + 1).padStart(4, '0')}</td>
                  <td>{formatTarih(kayit.tarih)}</td>
                  <td>{kategoriAdiBul(kayit.kategoriId)}</td>
                  <td style={{ color: 'var(--text-secondary)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {kayit.aciklama || '-'}
                  </td>
                  {kayit.tur === 'gelir' ? (
                    <td className="tutar deger-gelir">{tl(kayit.tutar)}</td>
                  ) : (
                    <td className="tutar" style={{ color: 'var(--text-light)' }}>-</td>
                  )}
                  {kayit.tur === 'gider' ? (
                    <td className="tutar deger-gider">{tl(kayit.tutar)}</td>
                  ) : (
                    <td className="tutar" style={{ color: 'var(--text-light)' }}>-</td>
                  )}
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button className="btn-duzenle" onClick={() => duzenleBaslat(kayit)}
                      title="Düzenle">
                      ✎
                    </button>
                    <button className="btn-sil" onClick={() => handleSil(kayit.id)}
                      disabled={siliniyor === kayit.id} title="Sil">
                      {siliniyor === kayit.id ? '...' : 'x'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
