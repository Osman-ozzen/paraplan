import React, { useState, useEffect } from 'react';

const tl = (t) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(t);
const fTarih = (t) => new Date(t).toLocaleDateString('tr-TR');

export default function Borclar({ data, api }) {
  const [liste, setListe] = useState(data || []);
  useEffect(() => { setListe(data || []); }, [data]);
  const [form, setForm] = useState({ alacakli: '', tutar: '', tarih: new Date().toISOString().split('T')[0], vadeTarihi: '', durum: 'odenmedi', aciklama: '' });
  const [ekleniyor, setEkleniyor] = useState(false);
  const [duzenlenen, setDuzenlenen] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.alacakli || !form.tutar) return;
    setEkleniyor(true);
    try {
      const sonuc = await (duzenlenen
        ? api.guncelle({ ...form, id: duzenlenen.id, tutar: parseFloat(form.tutar) })
        : api.ekle({ ...form, tutar: parseFloat(form.tutar) }));
      if (sonuc.basarili) {
        setListe(sonuc.borclar || sonuc[Object.keys(sonuc).find(k => k !== 'basarili')]);
        setForm({ alacakli: '', tutar: '', tarih: new Date().toISOString().split('T')[0], vadeTarihi: '', durum: 'odenmedi', aciklama: '' });
        setDuzenlenen(null);
      }
    } catch (err) {
      console.error('Borç ekleme/güncelleme hatası:', err);
    } finally {
      setEkleniyor(false);
    }
  };

  const duzenle = (item) => { setDuzenlenen(item); setForm({ alacakli: item.alacakli, tutar: String(item.tutar), tarih: item.tarih, vadeTarihi: item.vadeTarihi || '', durum: item.durum, aciklama: item.aciklama || '' }); };

  const sil = async (id) => {
    try {
      const s = await api.sil(id);
      if (s.basarili) setListe(s.borclar || s[Object.keys(s).find(k => k !== 'basarili')]);
    } catch (err) {
      console.error('Borç silme hatası:', err);
    }
  };

  const toplam = liste.reduce((t, b) => b.durum === 'odenmedi' ? t + Number(b.tutar) : t, 0);
  const odenen = liste.filter(b => b.durum === 'odendi').reduce((t, b) => t + Number(b.tutar), 0);

  return (
    <div>
      <div className="panel-grid">
        <div className="panel panel-gider"><div className="panel-label">Ödenmemiş Borç</div><div className="panel-value">{tl(toplam)}</div></div>
        <div className="panel panel-gelir"><div className="panel-label">Ödenmiş Borç</div><div className="panel-value">{tl(odenen)}</div></div>
        <div className="panel"><div className="panel-label">Toplam Borç</div><div className="panel-value">{tl(toplam + odenen)}</div></div>
        <div className="panel panel-kar"><div className="panel-label">Borç Sayısı</div><div className="panel-value" style={{ fontSize: 26 }}>{liste.length}</div></div>
      </div>

      <div className="form-kutu" style={{ marginBottom: 16 }}>
        <h3>{duzenlenen ? 'Borç Düzenle' : 'Yeni Borç'}</h3>
        <form onSubmit={handleSubmit} className="ekle-form">
          <div className="form-row">
            <div className="form-grup"><label>Alacaklı</label>
              <input name="alacakli" value={form.alacakli} onChange={handleChange} className="form-input" placeholder="Kime borçlusun?" required /></div>
            <div className="form-grup" style={{ flex: '0 0 140px' }}><label>Tutar (TL)</label>
              <input name="tutar" type="number" step="0.01" value={form.tutar} onChange={handleChange} className="form-input" required /></div>
            <div className="form-grup" style={{ flex: '0 0 140px' }}><label>Durum</label>
              <select name="durum" value={form.durum} onChange={handleChange} className="form-select">
                <option value="odenmedi">Ödenmedi</option><option value="odendi">Ödendi</option></select></div>
          </div>
          <div className="form-row">
            <div className="form-grup" style={{ flex: '0 0 150px' }}><label>İşlem Tarihi</label>
              <input name="tarih" type="date" value={form.tarih} onChange={handleChange} className="form-input" /></div>
            <div className="form-grup" style={{ flex: '0 0 150px' }}><label>Vade Tarihi</label>
              <input name="vadeTarihi" type="date" value={form.vadeTarihi} onChange={handleChange} className="form-input" /></div>
            <div className="form-grup"><label>Açıklama</label>
              <input name="aciklama" value={form.aciklama} onChange={handleChange} className="form-input" placeholder="İsteğe bağlı" /></div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn-ekle" disabled={ekleniyor}>{ekleniyor ? '...' : duzenlenen ? 'Güncelle' : 'Borç Ekle'}</button>
            {duzenlenen && <button type="button" className="btn-ekle" style={{ background: 'linear-gradient(135deg, #64748b, #475569)' }} onClick={() => { setDuzenlenen(null); setForm({ alacakli: '', tutar: '', tarih: new Date().toISOString().split('T')[0], vadeTarihi: '', durum: 'odenmedi', aciklama: '' }); }}>İptal</button>}
          </div>
        </form>
      </div>

      <div className="tablo-kapsayici">
        <div className="tablo-baslik"><h3>Borç Listesi</h3></div>
        {liste.length === 0 ? <div className="bos-mesaj">Henüz borç kaydı yok.</div> : (
          <table><thead><tr><th>Alacaklı</th><th>Tutar</th><th>İşlem Tarihi</th><th>Vade</th><th>Durum</th><th>Açıklama</th><th></th></tr></thead>
            <tbody>{liste.map((b) => (
              <tr key={b.id}>
                <td><strong>{b.alacakli}</strong></td>
                <td className="tutar deger-gider">{tl(b.tutar)}</td>
                <td>{fTarih(b.tarih)}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{b.vadeTarihi ? fTarih(b.vadeTarihi) : '-'}</td>
                <td><span className={`tur-badge ${b.durum === 'odendi' ? 'gelir' : 'gider'}`}>{b.durum === 'odendi' ? 'Ödendi' : 'Ödenmedi'}</span></td>
                <td style={{ color: 'var(--text-secondary)', maxWidth: 120 }}>{b.aciklama || '-'}</td>
                <td><button className="btn-duzenle" onClick={() => duzenle(b)}>✎</button><button className="btn-sil" onClick={() => sil(b.id)}>x</button></td>
              </tr>
            ))}</tbody></table>
        )}
      </div>
    </div>
  );
}
