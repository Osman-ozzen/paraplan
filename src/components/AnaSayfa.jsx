import React, { useMemo, useState, useCallback } from 'react';
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

export default function AnaSayfa({ kategoriler, kayitlar, kayitSil, sonEklenenId, duzenleBaslat, borclar, aylikGiderler, hedefler, setAktifSekme, setSeciliAy }) {
  const [seciliDonem, setSeciliDonem] = useState('aylik');
  const [siliniyor, setSiliniyor] = useState(null);
  const [tooltipGoster, setTooltipGoster] = useState(null); // { tip: 'buAy'|'hedef', x, y }

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
  // ─── Hedef Hesaplamaları ────────────────────────────────────────────
  const hedefVerisi = useMemo(() => {
    const gecerli = (hedefler || []).filter(i => i);
    const aktif = gecerli.filter(i => i.durum !== 'tamamlandi');
    const tamamlanan = gecerli.filter(i => i.durum === 'tamamlandi');
    const toplamHedef = gecerli.reduce((t, i) => t + (Number(i.hedefTutar) || 0), 0);
    const toplamBiriken = gecerli.reduce((t, i) => t + (Number(i.birikenTutar) || 0), 0);
    const aktifHedef = aktif.reduce((t, i) => t + (Number(i.hedefTutar) || 0), 0);
    const aktifBiriken = aktif.reduce((t, i) => t + (Number(i.birikenTutar) || 0), 0);
    return { aktif: aktif.length, tamamlanan: tamamlanan.length, toplamHedef, toplamBiriken, aktifHedef, aktifBiriken, adet: gecerli.length };
  }, [hedefler]);
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

  // ─── Tooltip göster/gizle (position: fixed ile stacking context sorunu yok) ─
  const tooltipAc = useCallback((e, tip) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipGoster({
      tip,
      x: rect.left + rect.width / 2,
      y: rect.bottom + 12,
    });
  }, []);

  const tooltipKapat = useCallback(() => {
    setTooltipGoster(null);
  }, []);

  return (
    <div>
      {/* ====== ÖZET PANEL ====== */}
      <div className="panel-grid">
        <div className="panel panel-gelir" style={{ cursor: 'pointer' }}
          onClick={() => setAktifSekme('ekle')}
          onMouseEnter={(e) => tooltipAc(e, 'gelir')}
          onMouseLeave={tooltipKapat}>
          <div className="panel-label">Toplam Gelir</div>
          <div className="panel-value">{tl(hesaplamalar.toplamGelir)}</div>
          <div className="panel-sub">Bu ay: {tl(hesaplamalar.buAyGelir)}</div>
        </div>
        <div className="panel panel-gider" style={{ cursor: 'pointer' }}
          onClick={() => setAktifSekme('ekle')}
          onMouseEnter={(e) => tooltipAc(e, 'gider')}
          onMouseLeave={tooltipKapat}>
          <div className="panel-label">Toplam Gider</div>
          <div className="panel-value">{tl(hesaplamalar.toplamGider)}</div>
          <div className="panel-sub">Bu ay: {tl(hesaplamalar.buAyGider)}</div>
        </div>
        <div className={`panel ${hesaplamalar.toplamKarZarar >= 0 ? 'panel-kar' : 'panel-zarar'}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setAktifSekme('raporlar')}
          onMouseEnter={(e) => tooltipAc(e, 'net')}
          onMouseLeave={tooltipKapat}>
          <div className="panel-label">Net Bakiye</div>
          <div className="panel-value">{tl(hesaplamalar.toplamKarZarar)}</div>
          <div className="panel-sub">{hesaplamalar.toplamKarZarar >= 0 ? 'Kâr' : 'Zarar'}</div>
        </div>
        <div className="panel panel-kar bu-ay-panel" style={{ cursor: 'pointer' }}
          onClick={() => setAktifSekme('raporlar')}
          onMouseEnter={(e) => tooltipAc(e, 'buAy')}
          onMouseLeave={tooltipKapat}>
          <div className="panel-label">Bu Ay</div>
          <div className="panel-value">{tl(hesaplamalar.buAyKarZarar)}</div>
          <div className="panel-sub">Üstüne gel → detay</div>
        </div>
        <div className="panel" style={{ borderTop: '3px solid #f59e0b', cursor: 'pointer' }}
          onClick={() => setAktifSekme('borclar')}
          onMouseEnter={(e) => tooltipAc(e, 'borc')}
          onMouseLeave={tooltipKapat}>
          <div className="panel-label">Borç Kalan</div>
          <div className="panel-value">{tl(borcVerisi.bekleyen)}</div>
          <div className="panel-sub">{borcVerisi.adet} borç / {tl(borcVerisi.odenen)} ödenmiş</div>
        </div>
        <div className="panel hedef-panel" style={{ borderTop: '3px solid #8b5cf6', cursor: 'pointer' }}
          onClick={() => setAktifSekme('hedefler')}
          onMouseEnter={(e) => tooltipAc(e, 'hedef')}
          onMouseLeave={tooltipKapat}>
          <div className="panel-label">🎯 Hedefler</div>
          <div className="panel-value" style={{ color: '#7c3aed', fontSize: 20 }}>
            {hedefVerisi.aktif} aktif / {hedefVerisi.tamamlanan} tamam
          </div>
          <div className="panel-sub">
            %{hedefVerisi.toplamHedef > 0 ? ((hedefVerisi.toplamBiriken / hedefVerisi.toplamHedef) * 100).toFixed(1) : 0} birikti
            {hedefVerisi.adet > 0 && ` · ${tl(hedefVerisi.toplamBiriken)} / ${tl(hedefVerisi.toplamHedef)}`}
          </div>
        </div>
        <div className="panel" style={{ borderTop: '3px solid #10b981', cursor: 'pointer' }}
          onClick={() => setAktifSekme('aylikGider')}
          onMouseEnter={(e) => tooltipAc(e, 'sabitGelir')}
          onMouseLeave={tooltipKapat}>
          <div className="panel-label">Sabit Gelir</div>
          <div className="panel-value">{tl(sabitGiderVerisi.gelir.toplam)}</div>
          <div className="panel-sub">{sabitGiderVerisi.gelir.adet} kayıt / {tl(sabitGiderVerisi.gelir.bekleyen)} bekliyor</div>
        </div>
        <div className="panel" style={{ borderTop: '3px solid #8b5cf6', cursor: 'pointer' }}
          onClick={() => setAktifSekme('aylikGider')}
          onMouseEnter={(e) => tooltipAc(e, 'sabitGider')}
          onMouseLeave={tooltipKapat}>
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
            <div className="pie-container" style={{ width: 180, height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[
                    { ad: 'Ödenen', deger: borcVerisi.odenen || 1 },
                    { ad: 'Kalan', deger: borcVerisi.bekleyen || 1 },
                  ]} dataKey="deger" cx="50%" cy="50%" innerRadius={0} outerRadius={70} cornerRadius={4}>
                    <Cell fill="#10b981" stroke="none" />
                    <Cell fill="#ef4444" stroke="none" />
                  </Pie>
                  <circle cx="50%" cy="50%" r={28} fill="white" />
                  <Tooltip formatter={(v) => tl(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="pie-liste" style={{ flex: 1, minWidth: 160 }}>
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
            <div className="pie-container" style={{ width: 180, height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[
                    { ad: 'Gelir', deger: sabitGiderVerisi.gelir.toplam || 1 },
                    { ad: 'Gider', deger: sabitGiderVerisi.gider.toplam || 1 },
                  ]} dataKey="deger" cx="50%" cy="50%" innerRadius={0} outerRadius={70} cornerRadius={4}>
                    <Cell fill="#10b981" stroke="none" />
                    <Cell fill="#ef4444" stroke="none" />
                  </Pie>
                  <circle cx="50%" cy="50%" r={28} fill="white" />
                  <Tooltip formatter={(v) => tl(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="pie-liste" style={{ flex: 1, minWidth: 160 }}>
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

      {/* ====== HEDEF TAKİBİ ÖZETİ ====== */}
      {hedefler && hedefler.length > 0 && (() => {
        const aktif = hedefler.filter(h => h.durum !== 'tamamlandi');
        const tamamlanan = hedefler.filter(h => h.durum === 'tamamlandi');
        const grafikVerisi = [...aktif, ...tamamlanan].slice(0, 8).map(h => ({
          ad: h.ad,
          icon: h.icon || '🎯',
          biriken: Number(h.birikenTutar) || 0,
          hedef: Number(h.hedefTutar) || 1,
          yuzde: Math.min(100, ((Number(h.birikenTutar) || 0) / Math.max(1, Number(h.hedefTutar))) * 100),
          durum: h.durum,
        }));

        return (
          <div className="grafik-alani">
            <div className="grafik-baslik">
              <h3>🎯 Hedef Takibi</h3>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: 'var(--text-light)', fontWeight: 500 }}>
                  {aktif.length} aktif / {tamamlanan.length} tamamlandı
                </span>
                <button className="btn-ekle" style={{ padding: '5px 12px', fontSize: 10 }}
                  onClick={() => setAktifSekme('hedefler')}>
                  Tümünü Gör →
                </button>
              </div>
            </div>

            {/* Grafik: Hedef İlerleme Çubukları */}
            <ResponsiveContainer width="100%" height={Math.max(120, grafikVerisi.length * 48)}>
              <BarChart
                data={grafikVerisi}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 36, bottom: 0 }}
                barSize={20}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#94a3b8"
                  tickFormatter={(v) => `%${v}`} />
                <YAxis
                  type="category"
                  dataKey="ad"
                  tick={{ fontSize: 10, fontWeight: 600 }}
                  stroke="#94a3b8"
                  width={90}
                  tickFormatter={(v) => {
                    const item = grafikVerisi.find(g => g.ad === v);
                    return `${item?.icon || ''} ${v.length > 12 ? v.substring(0, 12) + '…' : v}`;
                  }}
                />
                <Tooltip
                  formatter={(v) => [`%${v.toFixed(1)}`, 'İlerleme']}
                  labelFormatter={(label) => {
                    const item = grafikVerisi.find(g => g.ad === label);
                    return `${item?.icon || '🎯'} ${label} — ${item ? tl(item.biriken) + ' / ' + tl(item.hedef) : ''}`;
                  }}
                  contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
                />
                <Bar
                  dataKey="yuzde"
                  name="İlerleme"
                  radius={[0, 4, 4, 0]}
                  background={{ fill: '#f1f5f9', radius: [0, 4, 4, 0] }}
                >
                  {grafikVerisi.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={
                        entry.durum === 'tamamlandi' ? '#10b981'
                        : entry.yuzde >= 70 ? '#3b82f6'
                        : entry.yuzde >= 30 ? '#f59e0b'
                        : '#ef4444'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Liste Özeti */}
            {aktif.length > 0 && (
              <div style={{ marginTop: 10, borderTop: '1px solid var(--border-light)', paddingTop: 10 }}>
                {aktif.slice(0, 4).map((hedef) => {
                  const yuzde = hedef.hedefTutar > 0
                    ? Math.min(100, ((Number(hedef.birikenTutar) || 0) / Number(hedef.hedefTutar)) * 100)
                    : 0;
                  return (
                    <div key={hedef.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '6px 0', borderBottom: '1px solid var(--border-light)',
                    }}>
                      <span style={{ fontSize: 18, width: 28, textAlign: 'center', flexShrink: 0 }}>
                        {hedef.icon || '🎯'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex', justifyContent: 'space-between',
                          fontSize: 11, fontWeight: 600, marginBottom: 3,
                        }}>
                          <span style={{ color: 'var(--text)' }}>{hedef.ad}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-light)' }}>
                            {tl(Number(hedef.birikenTutar) || 0)} / {tl(Number(hedef.hedefTutar))}
                          </span>
                        </div>
                        <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{
                            width: `${yuzde}%`, height: '100%',
                            background: yuzde >= 100 ? 'linear-gradient(90deg, #10b981, #34d399)'
                              : yuzde >= 70 ? 'linear-gradient(90deg, #3b82f6, #06b6d4)'
                              : yuzde >= 30 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                              : 'linear-gradient(90deg, #ef4444, #f87171)',
                            borderRadius: 3, transition: 'width 0.5s',
                          }} />
                        </div>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 800, fontFamily: 'var(--font-mono)',
                        color: yuzde >= 100 ? '#059669' : yuzde >= 70 ? '#3b82f6' : yuzde >= 30 ? '#d97706' : '#dc2626',
                        width: 36, textAlign: 'right', flexShrink: 0,
                      }}>
                        %{yuzde.toFixed(0)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

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
                  <Pie data={pastaVerisi} dataKey="deger" cx="50%" cy="50%" innerRadius={0} outerRadius={90} cornerRadius={4}>
                    {pastaVerisi.map((_, i) => <Cell key={i} fill={RENKLER[i % RENKLER.length]} stroke="none" />)}
                  </Pie>
                  <circle cx="50%" cy="50%" r={40} fill="white" />
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

      {/* ====== SABİT KONUMLU TOOLTIP (position: fixed, stacking context yok) ====== */}
      {tooltipGoster && (() => {
        const { tip, x, y } = tooltipGoster;
        const style = { position: 'fixed', top: y, left: x, transform: 'translateX(-50%)', zIndex: 999999 };

        // Ortak tooltip kutusu
        const kutu = (icerik, minGenislik = 220) => (
          <div style={{ ...style, background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 14, padding: '16px 20px', boxShadow: '0 20px 70px rgba(0,0,0,0.7)', whiteSpace: 'nowrap', minWidth: minGenislik }}>
            {icerik}
          </div>
        );
        const satir = (sol, sag, renk = '#ffffff') => (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, padding: '3px 0', fontSize: 13, fontWeight: 700, color: renk }}>
            <span>{sol}</span>
            <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: 14, color: renk }}>{sag}</span>
          </div>
        );
        const ayrac = () => <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', margin: '6px 0' }} />;
        const baslik = (text) => <div style={{ fontSize: 11, fontWeight: 800, color: '#c4b5fd', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{text}</div>;

        if (tip === 'buAy') {
          return kutu(
            <>
              {satir('📈 Gelir', tl(hesaplamalar.buAyGelir), '#34d399')}
              {satir('📉 Gider', tl(hesaplamalar.buAyGider), '#f87171')}
              {ayrac()}
              {satir('⚖️ Net', tl(hesaplamalar.buAyKarZarar), '#c4b5fd')}
            </>
          );
        }

        if (tip === 'hedef') {
          const hedefListe = (hedefler || []).filter(i => i).slice(0, 5);
          return kutu(
            hedefListe.length > 0 ? (
              <>
                {baslik('Hedefler')}
                {hedefListe.map(h => {
                  const yuzde = h.hedefTutar > 0 ? Math.min(100, ((Number(h.birikenTutar) || 0) / Number(h.hedefTutar)) * 100) : 0;
                  return (
                    <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: 13 }}>
                      <span style={{ fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 }}>{h.icon || '🎯'}</span>
                      <span style={{ color: '#fff', fontWeight: 700, width: 70, textAlign: 'left', flexShrink: 0 }}>{h.ad.length > 16 ? h.ad.substring(0, 16) + '…' : h.ad}</span>
                      <span style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.12)', borderRadius: 3, overflow: 'hidden', minWidth: 40 }}>
                        <span style={{ display: 'block', height: '100%', width: `${yuzde}%`, borderRadius: 3, background: yuzde >= 100 ? '#10b981' : yuzde >= 70 ? '#3b82f6' : yuzde >= 30 ? '#f59e0b' : '#ef4444' }} />
                      </span>
                      <span style={{ width: 36, textAlign: 'right', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#e2e8f0', fontSize: 12, flexShrink: 0 }}>%{yuzde.toFixed(0)}</span>
                    </div>
                  );
                })}
                {ayrac()}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#cbd5e1', fontWeight: 600 }}>
                  <span>Toplam: {tl(hedefVerisi.toplamBiriken)} / {tl(hedefVerisi.toplamHedef)}</span>
                  <span style={{ color: '#c4b5fd', fontWeight: 800 }}>Tıkla →</span>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 11, fontWeight: 700, color: '#c4b5fd' }}>Henüz hedef yok</div>
            ), 280
          );
        }

        // ─── Toplam Gelir Detayı ──────────────────────────────────────────
        if (tip === 'gelir') {
          const gruplar = {};
          (kayitlar || []).filter(k => k.tur === 'gelir').forEach(k => {
            const kat = kategoriler.find(x => x.id === k.kategoriId);
            const ad = kat ? kat.ad : 'Diğer';
            if (!gruplar[ad]) gruplar[ad] = { ad, deger: 0 };
            gruplar[ad].deger += Number(k.tutar);
          });
          const sirali = Object.values(gruplar).sort((a, b) => b.deger - a.deger).slice(0, 6);
          return kutu(
            <>
              {baslik('Gelir Kategorileri')}
              {sirali.map((g, i) => satir(g.ad, tl(g.deger), i === 0 ? '#34d399' : '#e2e8f0'))}
              {ayrac()}
              {satir('💰 Toplam Gelir', tl(hesaplamalar.toplamGelir), '#34d399')}
            </>
          );
        }

        // ─── Toplam Gider Detayı ──────────────────────────────────────────
        if (tip === 'gider') {
          const gruplar = {};
          (kayitlar || []).filter(k => k.tur === 'gider').forEach(k => {
            const kat = kategoriler.find(x => x.id === k.kategoriId);
            const ad = kat ? kat.ad : 'Diğer';
            if (!gruplar[ad]) gruplar[ad] = { ad, deger: 0 };
            gruplar[ad].deger += Number(k.tutar);
          });
          const sirali = Object.values(gruplar).sort((a, b) => b.deger - a.deger).slice(0, 6);
          return kutu(
            <>
              {baslik('Gider Kategorileri')}
              {sirali.map((g, i) => satir(g.ad, tl(g.deger), i === 0 ? '#f87171' : '#e2e8f0'))}
              {ayrac()}
              {satir('📉 Toplam Gider', tl(hesaplamalar.toplamGider), '#f87171')}
            </>
          );
        }

        // ─── Net Bakiye Detayı ───────────────────────────────────────────
        if (tip === 'net') {
          const yillikGelir = hesaplamalar.buYilGelir;
          const yillikGider = hesaplamalar.buYilGider;
          return kutu(
            <>
              {baslik('Bakiye Özeti')}
              {satir('📈 Yıllık Gelir', tl(yillikGelir), '#34d399')}
              {satir('📉 Yıllık Gider', tl(yillikGider), '#f87171')}
              {ayrac()}
              {satir('📊 Yıllık Net', tl(yillikGelir - yillikGider), yillikGelir - yillikGider >= 0 ? '#34d399' : '#f87171')}
              {ayrac()}
              {satir('⚖️ Genel Bakiye', tl(hesaplamalar.toplamKarZarar), '#c4b5fd')}
            </>
          );
        }

        // ─── Borç Detayı ────────────────────────────────────────────────
        if (tip === 'borc') {
          const borcListe = (borclar || []).filter(i => i).slice(0, 6);
          return kutu(
            <>
              {baslik('Borç Listesi')}
              {borcListe.map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '3px 0', fontSize: 13, fontWeight: 600 }}>
                  <span style={{ color: '#fff', flex: 1, textAlign: 'left' }}>{b.alacakli?.length > 14 ? b.alacakli.substring(0, 14) + '…' : b.alacakli}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: b.durum === 'odendi' ? '#34d399' : '#f87171', fontSize: 13 }}>
                    {tl(b.tutar)}
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: b.durum === 'odendi' ? '#34d399' : '#f59e0b', flexShrink: 0 }}>
                    {b.durum === 'odendi' ? '✓' : '○'}
                  </span>
                </div>
              ))}
              {borcListe.length === 0 && <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>Borç bulunmuyor</div>}
              {borcListe.length > 0 && (
                <>
                  {ayrac()}
                  {satir('📊 Toplam', tl(borcVerisi.toplam))}
                  {satir('✅ Ödenen', tl(borcVerisi.odenen), '#34d399')}
                  {satir('⏳ Kalan', tl(borcVerisi.bekleyen), '#f59e0b')}
                </>
              )}
            </>
          );
        }

        // ─── Sabit Gelir Detayı ──────────────────────────────────────────
        if (tip === 'sabitGelir') {
          const sabitGelirListe = (aylikGiderler || []).filter(i => i.tur === 'gelir');
          // Grupla: ad'e göre topla
          const gruplar = {};
          sabitGelirListe.forEach(g => {
            if (!gruplar[g.ad]) gruplar[g.ad] = { ad: g.ad, toplam: 0, adet: 0, bekleyen: 0, periyot: g.periyot || '' };
            gruplar[g.ad].toplam += Number(g.tutar) || 0;
            gruplar[g.ad].adet += 1;
            if (!g.odendi) gruplar[g.ad].bekleyen += Number(g.tutar) || 0;
          });
          const gruplanmis = Object.values(gruplar).sort((a, b) => b.toplam - a.toplam);
          return kutu(
            gruplanmis.length > 0 ? (
              <>
                {baslik(`Düzenli Gelirler (${sabitGelirListe.length} kayıt)`)}
                {gruplanmis.map((g, i) => (
                  <div key={g.ad} style={{ borderBottom: i < gruplanmis.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', padding: '4px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 700 }}>
                      <span style={{ color: '#fff' }}>{g.ad}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#34d399', fontSize: 13 }}>{tl(g.toplam)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                      <span>{g.adet} kayıt</span>
                      <span>{g.periyot ? `${g.periyot} ay` : ''}</span>
                      {g.bekleyen > 0 && <span style={{ color: '#f59e0b' }}>{tl(g.bekleyen)} bekliyor</span>}
                    </div>
                  </div>
                ))}
                {ayrac()}
                {satir('📊 Toplam', tl(sabitGiderVerisi.gelir.toplam), '#34d399')}
                <div style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', marginTop: 4 }}>
                  {sabitGiderVerisi.gelir.adet} kayıt / {tl(sabitGiderVerisi.gelir.bekleyen)} bekliyor
                </div>
              </>
            ) : (
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>Düzenli gelir yok</div>
            ), 280
          );
        }

        // ─── Sabit Gider Detayı ──────────────────────────────────────────
        if (tip === 'sabitGider') {
          const sabitGiderListe = (aylikGiderler || []).filter(i => i.tur !== 'gelir');
          // Grupla: ad'e göre topla
          const gruplar = {};
          sabitGiderListe.forEach(g => {
            if (!gruplar[g.ad]) gruplar[g.ad] = { ad: g.ad, toplam: 0, adet: 0, odenenAdet: 0, bekleyen: 0, periyot: g.periyot || '' };
            gruplar[g.ad].toplam += Number(g.tutar) || 0;
            gruplar[g.ad].adet += 1;
            if (g.odendi) gruplar[g.ad].odenenAdet += 1;
            else gruplar[g.ad].bekleyen += Number(g.tutar) || 0;
          });
          const gruplanmis = Object.values(gruplar).sort((a, b) => b.toplam - a.toplam);
          return kutu(
            gruplanmis.length > 0 ? (
              <>
                {baslik(`Düzenli Giderler (${sabitGiderListe.length} kayıt)`)}
                {gruplanmis.map((g, i) => (
                  <div key={g.ad} style={{ borderBottom: i < gruplanmis.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', padding: '4px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 700 }}>
                      <span style={{ color: '#fff' }}>{g.ad}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#f87171', fontSize: 13 }}>{tl(g.toplam)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                      <span>{g.adet} kayıt</span>
                      <span>{g.periyot ? `${g.periyot} ay` : ''}</span>
                      <span style={{ color: '#34d399' }}>{g.odenenAdet} ödendi</span>
                      {g.bekleyen > 0 && <span style={{ color: '#f59e0b' }}>{tl(g.bekleyen)} bekliyor</span>}
                    </div>
                  </div>
                ))}
                {ayrac()}
                {satir('📊 Toplam', tl(sabitGiderVerisi.gider.toplam), '#f87171')}
                <div style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', marginTop: 4 }}>
                  {sabitGiderVerisi.gider.adet} kayıt / {tl(sabitGiderVerisi.gider.bekleyen)} bekliyor
                </div>
              </>
            ) : (
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>Düzenli gider yok</div>
            ), 280
          );
        }

        return null;
      })()}
    </div>
  );
}

// ─── Yardımcı: Yüzde Satırı ────────────────────────────────────────────
function YuzdeSatir({ renk, label, deger, toplam }) {
  const yuzde = toplam > 0 ? ((deger / toplam) * 100).toFixed(1) : 0;
  return (
    <div className="yuzde-satir">
      <span className="yuzde-label">{label}</span>
      <div className="yuzde-cizgi">
        <div className="yuzde-dolu" style={{ width: `${yuzde}%`, background: renk }} />
      </div>
      <span className="yuzde-deger">{tl(deger)} (%{yuzde})</span>
    </div>
  );
}
