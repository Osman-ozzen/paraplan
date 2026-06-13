import React, { useState } from 'react';

const tl = (t) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(t);
const fTarih = (t) => new Date(t).toLocaleDateString('tr-TR');

const KDV_ORANLARI = [1, 8, 10, 18, 20];
const VERGI_TURLERI = ['KDV', 'Gelir Vergisi', 'Kurumlar Vergisi', 'Stopaj', 'Damga Vergisi', 'MTV', 'Emlak Vergisi', 'Diğer'];

export default function VergiKdv({ data, api }) {
  const [liste, setListe] = useState(data || []);
  const [form, setForm] = useState({ tur: 'KDV', oran: 18, matrah: '', tutar: '', tarih: new Date().toISOString().split('T')[0], durum: 'bekliyor', aciklama: '' });
  const [ekleniyor, setEkleniyor] = useState(false);
  const [duzenlenen, setDuzenlenen] = useState(null);

  const h = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Oran değişince veya matrah değişince tutarı otomatik hesapla
  React.useEffect(() => {
    if (form.tur === 'KDV' && form.matrah) {
      const matrah = parseFloat(form.matrah) || 0;
      const oran = parseFloat(form.oran) || 0;
      setForm(f => ({ ...f, tutar: (matrah * oran / 100).toFixed(2) }));
    }
  }, [form.oran, form.matrah, form.tur]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tur || (!form.tutar && form.tur !== 'KDV') || (form.tur === 'KDV' && !form.matrah)) return;
    setEkleniyor(true);
    const payload = { ...form, oran: parseFloat(form.oran) || 0, matrah: parseFloat(form.matrah) || 0, tutar: parseFloat(form.tutar) || 0 };
    const sonuc = await (duzenlenen ? api.guncelle({ ...payload, id: duzenlenen.id }) : api.ekle(payload));
    if (sonuc.basarili) {
      const key = Object.keys(sonuc).find(k => k !== 'basarili');
      setListe(sonuc[key]);
      setForm({ tur: 'KDV', oran: 18, matrah: '', tutar: '', tarih: new Date().toISOString().split('T')[0], durum: 'bekliyor', aciklama: '' });
      setDuzenlenen(null);
    }
    setEkleniyor(false);
  };

  const duzenle = (item) => { setDuzenlenen(item); setForm({ tur: item.tur, oran: String(item.oran || 18), matrah: String(item.matrah || ''), tutar: String(item.tutar || ''), tarih: item.tarih, durum: item.durum || 'bekliyor', aciklama: item.aciklama || '' }); };
  const sil = async (id) => { const s = await api.sil(id); if (s.basarili) { const k = Object.keys(s).find(kk => kk !== 'basarili'); setListe(s[k]); } };

  const toplamVergi = liste.reduce((t, i) => t + Number(i.tutar), 0);
  const odenen = liste.filter(i => i.durum === 'odendi').reduce((t, i) => t + Number(i.tutar), 0);
  const bekleyen = liste.filter(i => i.durum === 'bekliyor').reduce((t, i) => t + Number(i.tutar), 0);

  return (
    <div>
      <div className="panel-grid">
        <div className="panel panel-gider"><div className="panel-label">Toplam Vergi/KDV</div><div className="panel-value">{tl(toplamVergi)}</div></div>
        <div className="panel panel-gelir"><div className="panel-label">Ödenen</div><div className="panel-value">{tl(odenen)}</div></div>
        <div className="panel panel-zarar"><div className="panel-label">Ödenecek</div><div className="panel-value">{tl(bekleyen)}</div></div>
        <div className="panel"><div className="panel-label">Toplam Kayıt</div><div className="panel-value" style={{ fontSize: 26 }}>{liste.length}</div></div>
      </div>

      <div className="form-kutu" style={{ marginBottom: 16 }}>
        <h3>{duzenlenen ? 'Düzenle' : 'Yeni Vergi/KDV'}</h3>
        <form onSubmit={handleSubmit} className="ekle-form">
          <div className="form-row">
            <div className="form-grup" style={{ flex: '0 0 150px' }}><label>Vergi Türü</label>
              <select name="tur" value={form.tur} onChange={h} className="form-select">
                {VERGI_TURLERI.map(v => <option key={v} value={v}>{v}</option>)}
              </select></div>
            {form.tur === 'KDV' && (
              <><div className="form-grup" style={{ flex: '0 0 120px' }}><label>KDV Oranı %</label>
                <select name="oran" value={form.oran} onChange={h} className="form-select">
                  {KDV_ORANLARI.map(o => <option key={o} value={o}>%{o}</option>)}
                </select></div>
              <div className="form-grup" style={{ flex: '0 0 130px' }}><label>Matrah (TL)</label>
                <input name="matrah" type="number" step="0.01" value={form.matrah} onChange={h} className="form-input" /></div></>
            )}
            {form.tur !== 'KDV' && (
              <div className="form-grup" style={{ flex: '0 0 130px' }}><label>Tutar (TL)</label>
                <input name="tutar" type="number" step="0.01" value={form.tutar} onChange={h} className="form-input" /></div>
            )}
            <div className="form-grup" style={{ flex: '0 0 130px' }}><label>KDV Tutarı</label>
              <input name="tutar" type="number" step="0.01" value={form.tur === 'KDV' ? (parseFloat(form.matrah || 0) * parseFloat(form.oran || 0) / 100).toFixed(2) : form.tutar} className="form-input" readOnly={form.tur === 'KDV'} /></div>
          </div>
          <div className="form-row">
            <div className="form-grup" style={{ flex: '0 0 140px' }}><label>Tarih</label>
              <input name="tarih" type="date" value={form.tarih} onChange={h} className="form-input" /></div>
            <div className="form-grup" style={{ flex: '0 0 140px' }}><label>Durum</label>
              <select name="durum" value={form.durum} onChange={h} className="form-select">
                <option value="bekliyor">Ödenmedi</option><option value="odendi">Ödendi</option>
              </select></div>
            <div className="form-grup"><label>Açıklama</label>
              <input name="aciklama" value={form.aciklama} onChange={h} className="form-input" placeholder="Dönem, açıklama..." /></div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn-ekle gider" disabled={ekleniyor}>{ekleniyor ? '...' : duzenlenen ? 'Güncelle' : 'Kaydet'}</button>
            {duzenlenen && <button type="button" className="btn-ekle" style={{ background: 'linear-gradient(135deg, #64748b, #475569)' }} onClick={() => { setDuzenlenen(null); setForm({ tur: 'KDV', oran: 18, matrah: '', tutar: '', tarih: new Date().toISOString().split('T')[0], durum: 'bekliyor', aciklama: '' }); }}>İptal</button>}
          </div>
        </form>
      </div>

      <div className="tablo-kapsayici">
        <div className="tablo-baslik"><h3>Vergi / KDV Kayıtları</h3></div>
        {liste.length === 0 ? <div className="bos-mesaj">Henüz kayıt yok.</div> : (
          <table><thead><tr><th>Tarih</th><th>Tür</th><th className="tutar">Matrah</th><th className="tutar">Oran</th><th className="tutar">Tutar</th><th>Durum</th><th>Açıklama</th><th></th></tr></thead>
            <tbody>{liste.filter(i => i).sort((a, b) => b.tarih?.localeCompare?.(a.tarih) || 0).map((i) => (
              <tr key={i.id}>
                <td>{fTarih(i.tarih)}</td><td><strong>{i.tur}</strong></td>
                <td className="tutar" style={{ color: 'var(--text-secondary)' }}>{i.matrah ? tl(i.matrah) : '-'}</td>
                <td className="tutar">{i.oran ? `%${i.oran}` : '-'}</td>
                <td className="tutar deger-gider">{tl(i.tutar)}</td>
                <td><span className={`tur-badge ${i.durum === 'odendi' ? 'gelir' : 'gider'}`}>{i.durum === 'odendi' ? 'Ödendi' : 'Ödenmedi'}</span></td>
                <td style={{ color: 'var(--text-secondary)', maxWidth: 120 }}>{i.aciklama || '-'}</td>
                <td><button className="btn-duzenle" onClick={() => duzenle(i)}>✎</button><button className="btn-sil" onClick={() => sil(i.id)}>x</button></td>
              </tr>
            ))}</tbody></table>
        )}
      </div>
    </div>
  );
}
