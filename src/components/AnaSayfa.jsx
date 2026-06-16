import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

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

const RENKLER = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#6366f1', '#14b8a6', '#f97316'];
const AYLAR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

export default function AnaSayfa({ kategoriler, kayitlar, kayitSil, sonEklenenId, duzenleBaslat, borclar, aylikGiderler, setAktifSekme, setSeciliAy }) {
  const [seciliDonem, setSeciliDonem] = useState('aylik');
  const [siliniyor, setSiliniyor] = useState(null);

  // ─── Gelir/Gider Hesaplamaları ──────────────────────────────────────
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

  // ─── Borç Hesaplamaları ─────────────────────────────────────────────
  const borcVerisi = useMemo(() => {
    const gecerli = (borclar || []).filter(i => i);
    const toplam = gecerli.reduce((t, i) => t + (Number(i.tutar) || 0), 0);
    const odenen = gecerli.filter(i => i.durum === 'odendi').reduce((t, i) => t + (Number(i.tutar) || 0), 0);
    const bekleyen = gecerli.filter(i => i.durum !== 'odendi').reduce((t, i) => t + (Number(i.tutar) || 0), 0);
    return { toplam, odenen, bekleyen, adet: gecerli.length };
  }, [borclar]);
  // ─── Sabit Gelir & Gider Hesaplamaları ──────────────────────────────
  const sabitGiderVerisi = useMemo(() => {
    const gecerli = (aylikGiderler || []).filter(i => i);
    const gider = gecerli.filter(i => i.tur !== 'gelir');
    const gelir = gecerli.filter(i => i.tur === 'gelir');

    const toplaOdeme = (arr, odendiMi = null) => {
      let f = arr;
      if (odendiMi !== null) f = f.filter(i => i.odendi === odendiMi);
      return f.reduce((t, i) => t + (Number(i.tutar) || 0), 0);
    };

    // Aylık periyot detayı
    const aylikDetay = {};
    gecerli.forEach(i => {
      const ay = (i.ay || '?').slice(0, 7);
      if (!aylikDetay[ay]) aylikDetay[ay] = { ay, gelir: 0, gider: 0, net: 0, adet: 0 };
      const t = Number(i.tutar) || 0;
      if (i.tur === 'gelir') aylikDetay[ay].gelir += t;
      else aylikDetay[ay].gider += t;
      aylikDetay[ay].net = aylikDetay[ay].gelir - aylikDetay[ay].gider;
      aylikDetay[ay].adet += 1;
    });

    // Tüm aylar kronolojik sırada (scroll ile gezilecek)
    const aylikPeriyot = Object.values(aylikDetay)
      .sort((a, b) => a.ay.localeCompare(b.ay))
      .map(v => {
        const [y, m] = v.ay.split('-');
        return { ...v, ayEtiket: `${AYLAR[parseInt(m) - 1] || ''} ${y}` };
      });

    return {
      gelir: {
        toplam: toplaOdeme(gelir),
        odenen: toplaOdeme(gelir, true),
        bekleyen: toplaOdeme(gelir, false),
        adet: gelir.length,
      },
      gider: {
        toplam: toplaOdeme(gider),
        odenen: toplaOdeme(gider, true),
        bekleyen: toplaOdeme(gider, false),
        adet: gider.length,
      },
      adet: gecerli.length,
      aylikPeriyot,
    };
  }, [aylikGiderler]);

  // ─── Kategori Dağılım (Pasta) ──────────────────────────────────────
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
    return Object.values(gruplar).sort((a, b) => b.deger - a.deger);
  }, [kayitlar, kategoriler]);

  // ─── Aylık Gelir/Gider Karşılaştırma ───────────────────────────────
  const aylikKarsilastirma = useMemo(() => {
    const son6Ay = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const bas = d.toISOString().split('T')[0];
      const bitis = new Date(now.getFullYear(), now.getMonth() - i + 1, 0).toISOString().split('T')[0];
      const ayStr = `${AYLAR[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
      const gelir = kayitlar.filter(k => k.tarih >= bas && k.tarih <= bitis && k.tur === 'gelir')
        .reduce((t, k) => t + Number(k.tutar), 0);
      const gider = kayitlar.filter(k => k.tarih >= bas && k.tarih <= bitis && k.tur === 'gider')
        .reduce((t, k) => t + Number(k.tutar), 0);
      son6Ay.push({ ay: ayStr, gelir, gider, kar: gelir - gider });
    }
    return son6Ay;
  }, [kayitlar]);

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
      {/* ====== ÖZET PANEL ====== */}
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
        <div className="panel panel-kar bu-ay-panel">
          <div className="panel-label">Bu Ay</div>
          <div className="panel-value">{tl(hesaplamalar.buAyKarZarar)}</div>
          <div className="panel-sub">Üstüne gel → detay</div>
          <div className="bu-ay-tooltip">
            <div className="bu-ay-tooltip-row">
              <span>📈 Gelir</span>
              <span className="bu-ay-tooltip-deger gelir">{tl(hesaplamalar.buAyGelir)}</span>
            </div>
            <div className="bu-ay-tooltip-row">
              <span>📉 Gider</span>
              <span className="bu-ay-tooltip-deger gider">{tl(hesaplamalar.buAyGider)}</span>
            </div>
            <div className="bu-ay-tooltip-ayrac" />
            <div className="bu-ay-tooltip-row bu-ay-tooltip-net">
              <span>⚖️ Net</span>
              <span className="bu-ay-tooltip-deger">{tl(hesaplamalar.buAyKarZarar)}</span>
            </div>
          </div>
        </div>
        <div className="panel" style={{ borderTop: '3px solid #f59e0b' }}>
          <div className="panel-label">Borç Kalan</div>
          <div className="panel-value">{tl(borcVerisi.bekleyen)}</div>
          <div className="panel-sub">{borcVerisi.adet} borç / {tl(borcVerisi.odenen)} ödenmiş</div>
        </div>
        <div className="panel" style={{ borderTop: '3px solid #10b981' }}>
          <div className="panel-label">Sabit Gelir</div>
          <div className="panel-value">{tl(sabitGiderVerisi.gelir.toplam)}</div>
          <div className="panel-sub">{sabitGiderVerisi.gelir.adet} kayıt / {tl(sabitGiderVerisi.gelir.bekleyen)} bekliyor</div>
        </div>
        <div className="panel" style={{ borderTop: '3px solid #8b5cf6' }}>
          <div className="panel-label">Sabit Gider</div>
          <div className="panel-value">{tl(sabitGiderVerisi.gider.toplam)}</div>
          <div className="panel-sub">{sabitGiderVerisi.gider.adet} kayıt / {tl(sabitGiderVerisi.gider.bekleyen)} bekliyor</div>
        </div>
      </div>

      {/* ====== GRAFİK: Aylık Gelir/Gider Karşılaştırma ====== */}
      <div className="grafik-alani">
        <div className="grafik-baslik">
          <h3>📊 Aylık Gelir / Gider Karşılaştırması</h3>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={aylikKarsilastirma}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="ay" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => tl(v)} />
            <Bar dataKey="gelir" name="Gelir" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="gider" name="Gider" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ====== GRAFİK: Borç Durumu ====== */}
      {borcVerisi.adet > 0 && (
        <div className="grafik-alani">
          <div className="grafik-baslik">
            <h3>💳 Borç Durumu</h3>
            <span style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 500 }}>
              Toplam: {tl(borcVerisi.toplam)} / Kalan: {tl(borcVerisi.bekleyen)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ width: 180, height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[
                    { ad: 'Ödenen', deger: borcVerisi.odenen || 1 },
                    { ad: 'Kalan', deger: borcVerisi.bekleyen || 1 },
                  ]} dataKey="deger" cx="50%" cy="50%" innerRadius={40} outerRadius={70}>
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip formatter={(v) => tl(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <YuzdeSatir renk="#10b981" label="Ödenen" deger={borcVerisi.odenen} toplam={borcVerisi.toplam} />
              <YuzdeSatir renk="#ef4444" label="Kalan" deger={borcVerisi.bekleyen} toplam={borcVerisi.toplam} />
            </div>
          </div>
        </div>
      )}

      {/* ====== GRAFİK: Sabit Gelir & Gider ====== */}
      {sabitGiderVerisi.adet > 0 && (
        <div className="grafik-alani">
          <div className="grafik-baslik">
            <h3>📆 Sabit Gelir & Gider</h3>
            <div style={{ display: 'flex', gap: 12, fontSize: 11, fontWeight: 500 }}>
              <span style={{ color: '#10b981' }}>✓ Gelir: {tl(sabitGiderVerisi.gelir.toplam)}</span>
              <span style={{ color: '#ef4444' }}>○ Gider: {tl(sabitGiderVerisi.gider.toplam)}</span>
              <span style={{ color: '#8b5cf6', fontWeight: 700 }}>
                Net: {tl(sabitGiderVerisi.gelir.toplam - sabitGiderVerisi.gider.toplam)}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ width: 180, height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[
                    { ad: 'Gelir', deger: sabitGiderVerisi.gelir.toplam || 1 },
                    { ad: 'Gider', deger: sabitGiderVerisi.gider.toplam || 1 },
                  ]} dataKey="deger" cx="50%" cy="50%" innerRadius={40} outerRadius={70}>
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip formatter={(v) => tl(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <YuzdeSatir renk="#10b981" label="Gelir" deger={sabitGiderVerisi.gelir.toplam} toplam={sabitGiderVerisi.gelir.toplam + sabitGiderVerisi.gider.toplam} />
              <YuzdeSatir renk="#ef4444" label="Gider" deger={sabitGiderVerisi.gider.toplam} toplam={sabitGiderVerisi.gelir.toplam + sabitGiderVerisi.gider.toplam} />
            </div>
          </div>

          {/* Aylık periyot detayı */}
          {sabitGiderVerisi.aylikPeriyot?.length > 0 && (
            <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                📅 Aylık Periyot ({sabitGiderVerisi.aylikPeriyot.length} ay)
                <span style={{ fontWeight: 400, color: 'var(--text-light)', marginLeft: 8, textTransform: 'none' }}>
                  — kaydırmak için → sürükle
                </span>
              </div>
              <div style={{
                display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8,
                WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory',
                cursor: 'grab',
              }}
                onMouseDown={(e) => { const el = e.currentTarget; let startX = e.pageX - el.offsetLeft; let scrollL = el.scrollLeft; const move = (ev) => { ev.preventDefault(); const x = ev.pageX - el.offsetLeft; el.scrollLeft = scrollL - (x - startX); }; const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); }; document.addEventListener('mousemove', move); document.addEventListener('mouseup', up); }}>
                {sabitGiderVerisi.aylikPeriyot.map((item, i) => (
                  <div key={i} onClick={() => {
                    if (setAktifSekme && setSeciliAy) {
                      setSeciliAy(item.ay);
                      setAktifSekme('aylikGider');
                    }
                  }} style={{
                    flex: '0 0 130px', background: 'white', borderRadius: 8,
                    padding: '10px 12px', border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow)', scrollSnapAlign: 'start',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--shadow)'}>
                  
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      {item.ayEtiket}
                    </div>
                    {item.gelir > 0 && (
                      <div style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>
                        Gelir: {tl(item.gelir)}
                      </div>
                    )}
                    {item.gider > 0 && (
                      <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>
                        Gider: {tl(item.gider)}
                      </div>
                    )}
                    <div style={{
                      fontSize: 13, fontWeight: 800, marginTop: 2,
                      color: item.net >= 0 ? '#059669' : '#dc2626',
                    }}>
                      {item.net >= 0 ? '+' : ''}{tl(item.net)}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-light)', marginTop: 2 }}>
                      {item.adet} kalem
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====== GRAFİK: Bu Ay Kategori Dağılımı ====== */}
      <div className="grafik-alani">
        <div className="grafik-baslik">
          <h3>🎯 Bu Ay Kategori Dağılımı</h3>
          {pastaVerisi.length > 0 && (
            <span style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 500 }}>
              Toplam: {tl(pastaVerisi.reduce((t, i) => t + i.deger, 0))}
            </span>
          )}
        </div>
        {pastaVerisi.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ width: 240, height: 220, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pastaVerisi} dataKey="deger" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {pastaVerisi.map((_, i) => <Cell key={i} fill={RENKLER[i % RENKLER.length]} stroke="#fff" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip formatter={(v) => tl(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              {pastaVerisi.map((item, i) => {
                const toplam = pastaVerisi.reduce((t, d) => t + d.deger, 0);
                const yuzde = ((item.deger / toplam) * 100).toFixed(1);
                return (
                  <div key={item.ad} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: RENKLER[i % RENKLER.length], flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 500 }}>{item.ad}</span>
                    <span style={{ width: 36, textAlign: 'right', fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)' }}>%{yuzde}</span>
                    <span style={{ width: 90, textAlign: 'right', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{tl(item.deger)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-light)', fontSize: 13 }}>
            Bu ay için henüz kayıt bulunmuyor.
          </div>
        )}
      </div>

      {/* ====== YEVMIYE DEFTERI ====== */}
      <div className="tablo-kapsayici">
        <div className="tablo-baslik">
          <h3>
            Yevmiye Defteri
            <span style={{ fontWeight: 400, color: 'var(--text-light)', fontSize: 12, marginLeft: 8 }}>
              ({seciliDonem === 'gunluk' ? 'Bugün' : seciliDonem === 'aylik' ? 'Bu Ay' : seciliDonem === 'yillik' ? 'Bu Yıl' : 'Tümü'})
            </span>
          </h3>
          <div className="donem-filtre">
            {['gunluk', 'aylik', 'yillik', 'tum'].map((d) => (
              <button key={d} className={`filtre-btn ${seciliDonem === d ? 'aktif' : ''}`}
                onClick={() => setSeciliDonem(d)}>
                {d === 'gunluk' ? 'Gün' : d === 'aylik' ? 'Ay' : d === 'yillik' ? 'Yıl' : 'Tüm'}
              </button>
            ))}
          </div>
        </div>

        {(() => {
          const bugunStr = bugun();
          let f = [];
          if (seciliDonem === 'gunluk') f = kayitlar.filter((k) => k.tarih === bugunStr);
          else if (seciliDonem === 'aylik') f = kayitlar.filter((k) => k.tarih >= ayinIlkGunu() && k.tarih <= bugunStr);
          else if (seciliDonem === 'yillik') f = kayitlar.filter((k) => k.tarih >= yilinIlkGunu() && k.tarih <= bugunStr);
          else f = [...kayitlar];
          const goruntulenecek = f.sort((a, b) => b.tarih.localeCompare(a.tarih)).slice(0, 20);

          return goruntulenecek.length === 0 ? (
            <div className="bos-mesaj">Henüz kayıt bulunmuyor.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: 55 }}>Fiş</th>
                  <th style={{ width: 85 }}>Tarih</th>
                  <th>Hesap</th>
                  <th>Açıklama</th>
                  <th className="tutar" style={{ width: 105 }}>Gelir</th>
                  <th className="tutar" style={{ width: 105 }}>Gider</th>
                  <th style={{ width: 55 }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {goruntulenecek.map((kayit) => (
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
                      <button className="btn-duzenle" onClick={() => duzenleBaslat(kayit)} title="Düzenle">✎</button>
                      <button className="btn-sil" onClick={() => handleSil(kayit.id)}
                        disabled={siliniyor === kayit.id} title="Sil">
                        {siliniyor === kayit.id ? '...' : 'x'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })()}
      </div>
    </div>
  );
}

// ─── Yardımcı: Yüzde Satırı ────────────────────────────────────────────
function YuzdeSatir({ renk, label, deger, toplam }) {
  const yuzde = toplam > 0 ? ((deger / toplam) * 100).toFixed(1) : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{tl(deger)} (%{yuzde})</span>
      </div>
      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${yuzde}%`, height: '100%', background: renk, borderRadius: 4, transition: 'width 0.5s' }} />
      </div>
    </div>
  );
}
