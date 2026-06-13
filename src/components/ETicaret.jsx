import React, { useState } from 'react';

const tl = (t) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(t);
const fTarih = (t) => new Date(t).toLocaleDateString('tr-TR');
const platformlar = ['Trendyol', 'Hepsiburada', 'Amazon', 'N11', 'ÇiçekSepeti', 'Etsy', 'Shopify', 'Kendi Sitem', 'Diğer'];

export default function ETicaret({ data, api }) {
  const [liste, setListe] = useState(data || []);
  const [form, setForm] = useState({ platform: '', urun: '', satisTutari: '', komisyonOran: '', kargo: '', tarih: new Date().toISOString().split('T')[0], not: '' });
  const [ekleniyor, setEkleniyor] = useState(false);
  const [duzenlenen, setDuzenlenen] = useState(null);

  const h = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const netHesapla = () => {
    const satis = parseFloat(form.satisTutari) || 0;
    const komOran = parseFloat(form.komisyonOran) || 0;
    const kargo = parseFloat(form.kargo) || 0;
    return satis - (satis * komOran / 100) - kargo;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.platform || !form.satisTutari) return;
    setEkleniyor(true);
    const net = netHesapla();
    const payload = { ...form, satisTutari: parseFloat(form.satisTutari), komisyonOran: parseFloat(form.komisyonOran) || 0, kargo: parseFloat(form.kargo) || 0, net };
    const sonuc = await (duzenlenen ? api.guncelle({ ...payload, id: duzenlenen.id }) : api.ekle(payload));
    if (sonuc.basarili) {
      const key = Object.keys(sonuc).find(k => k !== 'basarili');
      setListe(sonuc[key]);
      setForm({ platform: '', urun: '', satisTutari: '', komisyonOran: '', kargo: '', tarih: new Date().toISOString().split('T')[0], not: '' });
      setDuzenlenen(null);
    }
    setEkleniyor(false);
  };

  const duzenle = (item) => { setDuzenlenen(item); setForm({ platform: item.platform, urun: item.urun, satisTutari: String(item.satisTutari), komisyonOran: String(item.komisyonOran || ''), kargo: String(item.kargo || ''), tarih: item.tarih, not: item.not || '' }); };
  const sil = async (id) => { const key = Object.keys(liste).length ? '' : ''; const s = await api.sil(id); if (s.basarili) { const k = Object.keys(s).find(kk => kk !== 'basarili'); setListe(s[k]); } };

  const toplamSatis = liste.reduce((t, i) => t + Number(i.satisTutari), 0);
  const toplamNet = liste.reduce((t, i) => t + Number(i.net || 0), 0);
  const toplamKomisyon = liste.reduce((t, i) => t + (Number(i.satisTutari) * (Number(i.komisyonOran) || 0) / 100), 0);
  const toplamKargo = liste.reduce((t, i) => t + (Number(i.kargo) || 0), 0);

  return (
    <div>
      <div className="panel-grid">
        <div className="panel panel-gelir"><div className="panel-label">Toplam Satış</div><div className="panel-value">{tl(toplamSatis)}</div></div>
        <div className="panel panel-kar"><div className="panel-label">Net Gelir</div><div className="panel-value">{tl(toplamNet)}</div></div>
        <div className="panel panel-gider"><div className="panel-label">Komisyon</div><div className="panel-value">{tl(toplamKomisyon)}</div></div>
        <div className="panel panel-zarar"><div className="panel-label">Kargo</div><div className="panel-value">{tl(toplamKargo)}</div></div>
      </div>

      <div className="form-kutu" style={{ marginBottom: 16 }}>
        <h3>{duzenlenen ? 'Satış Düzenle' : 'Yeni Satış'}</h3>
        <form onSubmit={handleSubmit} className="ekle-form">
          <div className="form-row">
            <div className="form-grup" style={{ flex: '0 0 150px' }}><label>Platform</label>
              <select name="platform" value={form.platform} onChange={h} className="form-select" required>
                <option value="">-- Seç --</option>
                {platformlar.map(p => <option key={p} value={p}>{p}</option>)}
              </select></div>
            <div className="form-grup"><label>Ürün Adı</label>
              <input name="urun" value={form.urun} onChange={h} className="form-input" placeholder="Ürün adı" required /></div>
            <div className="form-grup" style={{ flex: '0 0 130px' }}><label>Satış Tutarı</label>
              <input name="satisTutari" type="number" step="0.01" value={form.satisTutari} onChange={h} className="form-input" required /></div>
          </div>
          <div className="form-row">
            <div className="form-grup" style={{ flex: '0 0 130px' }}><label>Komisyon %</label>
              <input name="komisyonOran" type="number" step="0.1" value={form.komisyonOran} onChange={h} className="form-input" placeholder="15" /></div>
            <div className="form-grup" style={{ flex: '0 0 130px' }}><label>Kargo</label>
              <input name="kargo" type="number" step="0.01" value={form.kargo} onChange={h} className="form-input" placeholder="0" /></div>
            <div className="form-grup" style={{ flex: '0 0 140px' }}><label>Tarih</label>
              <input name="tarih" type="date" value={form.tarih} onChange={h} className="form-input" /></div>
          </div>
          {form.satisTutari && <div className="form-grup"><label>Net Hesaplama</label>
            <div style={{ padding: '6px 10px', background: 'var(--bg-alt)', borderRadius: 8, fontSize: 13 }}>
              <strong>{tl(parseFloat(form.satisTutari) || 0)}</strong> - Komisyon: {tl((parseFloat(form.satisTutari) || 0) * (parseFloat(form.komisyonOran) || 0) / 100)} - Kargo: {tl(parseFloat(form.kargo) || 0)} = <strong style={{ color: 'var(--success)' }}>{tl(netHesapla())}</strong>
            </div>
          </div>}
          <div className="form-grup"><label>Not</label>
            <input name="not" value={form.not} onChange={h} className="form-input" placeholder="İsteğe bağlı not" /></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn-ekle gelir" disabled={ekleniyor}>{ekleniyor ? '...' : duzenlenen ? 'Güncelle' : 'Satış Ekle'}</button>
            {duzenlenen && <button type="button" className="btn-ekle" style={{ background: 'linear-gradient(135deg, #64748b, #475569)' }} onClick={() => { setDuzenlenen(null); setForm({ platform: '', urun: '', satisTutari: '', komisyonOran: '', kargo: '', tarih: new Date().toISOString().split('T')[0], not: '' }); }}>İptal</button>}
          </div>
        </form>
      </div>

      <div className="tablo-kapsayici">
        <div className="tablo-baslik"><h3>Satış Geçmişi</h3></div>
        {liste.length === 0 ? <div className="bos-mesaj">Henüz satış kaydı yok.</div> : (
          <table><thead><tr><th>Tarih</th><th>Platform</th><th>Ürün</th><th className="tutar">Satış</th><th className="tutar">Komisyon</th><th className="tutar">Kargo</th><th className="tutar">Net</th><th></th></tr></thead>
            <tbody>{liste.filter(i => i).sort((a, b) => b.tarih?.localeCompare?.(a.tarih) || 0).map((i) => (
              <tr key={i.id}>
                <td>{fTarih(i.tarih)}</td><td>{i.platform}</td>
                <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.urun}</td>
                <td className="tutar deger-gelir">{tl(i.satisTutari)}</td>
                <td className="tutar deger-gider">{tl((i.satisTutari * (i.komisyonOran || 0) / 100))}</td>
                <td className="tutar deger-gider">{tl(i.kargo || 0)}</td>
                <td className="tutar" style={{ color: 'var(--primary)', fontWeight: 800 }}>{tl(i.net || 0)}</td>
                <td><button className="btn-duzenle" onClick={() => duzenle(i)}>✎</button><button className="btn-sil" onClick={() => sil(i.id)}>x</button></td>
              </tr>
            ))}</tbody></table>
        )}
      </div>
    </div>
  );
}
