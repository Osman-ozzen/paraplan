import React, { useState } from 'react';

const tl = (t) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(t);

export default function Hesaplama() {
  const [ekran, setEkran] = useState('0');
  const [onceki, setOnceki] = useState(null);
  const [islem, setIslem] = useState(null);
  const [yeniSayi, setYeniSayi] = useState(false);

  // KDV Hesaplama
  const [kdvTuru, setKdvTuru] = useState('kdvDahil');
  const [kdvOran, setKdvOran] = useState(18);
  const [kdvTutar, setKdvTutar] = useState('');
  const [kdvSonuc, setKdvSonuc] = useState(null);

  // Kar Marjı
  const [alisFiyat, setAlisFiyat] = useState('');
  const [satisFiyat, setSatisFiyat] = useState('');
  const [karSonuc, setKarSonuc] = useState(null);

  const tus = (deger) => {
    if (yeniSayi) { setEkran(String(deger)); setYeniSayi(false); }
    else { setEkran(ekran === '0' ? String(deger) : ekran + deger); }
  };

  const temizle = () => { setEkran('0'); setOnceki(null); setIslem(null); setYeniSayi(false); };

  const islemYap = (tur) => {
    if (islem && !yeniSayi) { hesapla(); }
    setOnceki(parseFloat(ekran));
    setIslem(tur);
    setYeniSayi(true);
  };

  const hesapla = () => {
    if (islem === null || onceki === null) return;
    const curr = parseFloat(ekran);
    let sonuc = 0;
    switch (islem) {
      case '+': sonuc = onceki + curr; break;
      case '-': sonuc = onceki - curr; break;
      case '*': sonuc = onceki * curr; break;
      case '/': sonuc = curr !== 0 ? onceki / curr : 0; break;
    }
    setEkran(String(sonuc));
    setOnceki(null);
    setIslem(null);
    setYeniSayi(true);
  };

  const yuzde = () => { setEkran(String(parseFloat(ekran) / 100)); };
  const ters = () => { setEkran(String(-parseFloat(ekran))); };

  const kdvHesapla = () => {
    const t = parseFloat(kdvTutar) || 0;
    const o = kdvOran / 100;
    if (kdvTuru === 'kdvDahil') {
      const kdv = t - (t / (1 + o));
      const matrah = t / (1 + o);
      setKdvSonuc({ matrah, kdv, toplam: t });
    } else {
      const kdv = t * o;
      setKdvSonuc({ matrah: t, kdv, toplam: t + kdv });
    }
  };

  const karHesapla = () => {
    const alis = parseFloat(alisFiyat) || 0;
    const satis = parseFloat(satisFiyat) || 0;
    if (alis > 0) {
      const kar = satis - alis;
      const oran = (kar / alis) * 100;
      setKarSonuc({ kar, oran });
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: 20, alignItems: 'start' }}>
      {/* Hesap Makinesi */}
      <div className="form-kutu">
        <h3>Hesap Makinesi</h3>
        <div style={{ background: 'var(--bg-dark)', color: 'white', padding: '16px 20px', borderRadius: 10, marginBottom: 14, textAlign: 'right', fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', minHeight: 64 }}>
          {parseFloat(ekran).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
          {[
            ['C', '±', '%', '÷'],
            ['7','8','9','×'],
            ['4','5','6','-'],
            ['1','2','3','+'],
            ['0','','.','=']
          ].flatMap((row, ri) => row.map((t, ci) => {
            if (!t) return <div key={`${ri}-${ci}`}></div>;
            const isOp = ['+','-','×','÷'].includes(t);
            const isEq = t === '=';
            const isClear = t === 'C';
            const isOther = ['±','%'].includes(t);
            return (
              <button key={`${ri}-${ci}`} onClick={() => {
                if (isClear) temizle();
                else if (t === '±') ters();
                else if (t === '%') yuzde();
                else if (isOp) islemYap({ '+': '+', '-': '-', '×': '*', '÷': '/' }[t]);
                else if (isEq) hesapla();
                else if (t === '.') tus('.');
                else tus(t);
              }} style={{
                padding: '12px 0', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer',
                background: isOp ? 'var(--primary-gradient)' : isClear ? '#fee2e2' : isEq ? 'var(--success-gradient)' : isOther ? '#f1f5f9' : 'white',
                color: isOp || isEq ? 'white' : isClear ? '#dc2626' : 'var(--text)',
                border: isOp || isEq ? 'none' : '1px solid var(--border)',
                transition: 'all 0.15s',
              }}
              onMouseOver={e => e.target.style.opacity = '0.8'}
              onMouseOut={e => e.target.style.opacity = '1'}
              >{t}</button>
            );
          }))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* KDV Hesaplama */}
        <div className="form-kutu">
          <h3>KDV Hesaplama</h3>
          <div className="form-row">
            <div className="tur-secimi" style={{ flex: '0 0 200px' }}>
              <button className={`tur-btn ${kdvTuru === 'kdvDahil' ? 'aktif' : ''}`} onClick={() => setKdvTuru('kdvDahil')}>KDV Dahil</button>
              <button className={`tur-btn ${kdvTuru === 'kdvHaric' ? 'aktif' : ''}`} onClick={() => setKdvTuru('kdvHaric')}>KDV Hariç</button>
            </div>
          </div>
          <div className="form-row" style={{ marginTop: 10 }}>
            <div className="form-grup" style={{ flex: '0 0 100px' }}>
              <label>KDV Oranı</label>
              <select value={kdvOran} onChange={e => setKdvOran(Number(e.target.value))} className="form-select">
                {[1, 8, 10, 18, 20].map(o => <option key={o} value={o}>%{o}</option>)}
              </select>
            </div>
            <div className="form-grup" style={{ flex: '0 0 130px' }}>
              <label>{kdvTuru === 'kdvDahil' ? 'KDV Dahil Tutar' : 'Matrah'}</label>
              <input type="number" value={kdvTutar} onChange={e => setKdvTutar(e.target.value)} className="form-input" placeholder="0" />
            </div>
            <button className="btn-ekle" onClick={kdvHesapla} style={{ marginBottom: 0 }}>Hesapla</button>
          </div>
          {kdvSonuc && (
            <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--bg-alt)', borderRadius: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}><span>Matrah:</span><strong>{tl(kdvSonuc.matrah)}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}><span>KDV (%{kdvOran}):</span><strong style={{ color: 'var(--danger)' }}>{tl(kdvSonuc.kdv)}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderTop: '1px solid var(--border)', marginTop: 2, paddingTop: 4 }}><span><strong>Toplam:</strong></span><strong style={{ color: 'var(--primary)', fontSize: 14 }}>{tl(kdvSonuc.toplam)}</strong></div>
            </div>
          )}
        </div>

        {/* Kar Marjı Hesaplama */}
        <div className="form-kutu">
          <h3>Kar Marjı Hesaplama</h3>
          <div className="form-row">
            <div className="form-grup" style={{ flex: '0 0 130px' }}>
              <label>Alış Fiyatı</label>
              <input type="number" value={alisFiyat} onChange={e => setAlisFiyat(e.target.value)} className="form-input" placeholder="0" />
            </div>
            <div className="form-grup" style={{ flex: '0 0 130px' }}>
              <label>Satış Fiyatı</label>
              <input type="number" value={satisFiyat} onChange={e => setSatisFiyat(e.target.value)} className="form-input" placeholder="0" />
            </div>
            <button className="btn-ekle" onClick={karHesapla} style={{ marginBottom: 0 }}>Hesapla</button>
          </div>
          {karSonuc && (
            <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--bg-alt)', borderRadius: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}><span>Kar/Zarar:</span><strong className={karSonuc.kar >= 0 ? 'deger-gelir' : 'deger-gider'}>{tl(karSonuc.kar)}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}><span>Kar Marjı:</span><strong style={{ color: karSonuc.oran >= 0 ? 'var(--success)' : 'var(--danger)' }}>%{karSonuc.oran.toFixed(2)}</strong></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
