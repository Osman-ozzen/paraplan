import React, { useState } from 'react';

const tl = (t) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(t);
const fTarih = (t) => new Date(t).toLocaleDateString('tr-TR');
const kategoriler = ['Kira', 'Elektrik', 'Su', 'Doğalgaz', 'İnternet', 'Telefon', 'Kırtasiye', 'Temizlik', 'Bakım', 'Sigorta', 'Danışmanlık', 'Reklam', 'Yazılım', 'Personel', 'Diğer'];

export default function SirketGiderleri({ data, api }) {
  const [liste, setListe] = useState(data || []);
  const [form, setForm] = useState({ kategori: '', tutar: '', tarih: new Date().toISOString().split('T')[0], odemeSekli: 'banka', aciklama: '' });
  const [ekleniyor, setEkleniyor] = useState(false);
  const [duzenlenen, setDuzenlenen] = useState(null);

  const h = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.kategori || !form.tutar) return;
    setEkleniyor(true);
    const payload = { ...form, tutar: parseFloat(form.tutar) };
    const sonuc = await (duzenlenen ? api.guncelle({ ...payload, id: duzenlenen.id }) : api.ekle(payload));
    if (sonuc.basarili) {
      const key = Object.keys(sonuc).find(k => k !== 'basarili');
      setListe(sonuc[key]);
      setForm({ kategori: '', tutar: '', tarih: new Date().toISOString().split('T')[0], odemeSekli: 'banka', aciklama: '' });
      setDuzenlenen(null);
    }
    setEkleniyor(false);
  };

  const duzenle = (item) => { setDuzenlenen(item); setForm({ kategori: item.kategori, tutar: String(item.tutar), tarih: item.tarih, odemeSekli: item.odemeSekli || 'banka', aciklama: item.aciklama || '' }); };
  const sil = async (id) => { const s = await api.sil(id); if (s.basarili) { const k = Object.keys(s).find(kk => kk !== 'basarili'); setListe(s[k]); } };

  const toplam = liste.reduce((t, i) => t + Number(i.tutar), 0);
  const kategoriToplam = liste.reduce((acc, i) => { acc[i.kategori] = (acc[i.kategori] || 0) + Number(i.tutar); return acc; }, {});

  return (
    <div>
      <div className="panel-grid">
        <div className="panel panel-gider"><div className="panel-label">Toplam Gider</div><div className="panel-value">{tl(toplam)}</div></div>
        <div className="panel panel-gider"><div className="panel-label">Bu Ay</div><div className="panel-value">{tl(liste.filter(i => i.tarih?.startsWith(new Date().toISOString().slice(0, 7))).reduce((t, i) => t + Number(i.tutar), 0))}</div></div>
        <div className="panel panel-kayit"><div className="panel-label">Gider Kalemi</div><div className="panel-value" style={{ fontSize: 26 }}>{Object.keys(kategoriToplam).length}</div></div>
        <div className="panel"><div className="panel-label">Toplam Kayıt</div><div className="panel-value" style={{ fontSize: 26 }}>{liste.length}</div></div>
      </div>

      <div className="form-kutu" style={{ marginBottom: 16 }}>
        <h3>{duzenlenen ? 'Gider Düzenle' : 'Yeni Gider'}</h3>
        <form onSubmit={handleSubmit} className="ekle-form">
          <div className="form-row">
            <div className="form-grup" style={{ flex: '0 0 160px' }}><label>Kategori</label>
              <select name="kategori" value={form.kategori} onChange={h} className="form-select" required>
                <option value="">-- Seç --</option>
                {kategoriler.map(k => <option key={k} value={k}>{k}</option>)}
              </select></div>
            <div className="form-grup" style={{ flex: '0 0 130px' }}><label>Tutar (TL)</label>
              <input name="tutar" type="number" step="0.01" value={form.tutar} onChange={h} className="form-input" required /></div>
            <div className="form-grup" style={{ flex: '0 0 140px' }}><label>Tarih</label>
              <input name="tarih" type="date" value={form.tarih} onChange={h} className="form-input" /></div>
          </div>
          <div className="form-row">
            <div className="form-grup" style={{ flex: '0 0 150px' }}><label>Ödeme Şekli</label>
              <select name="odemeSekli" value={form.odemeSekli} onChange={h} className="form-select">
                <option value="banka">Banka</option><option value="nakit">Nakit</option><option value="kredi">Kredi Kartı</option><option value="cek">Çek</option>
              </select></div>
            <div className="form-grup"><label>Açıklama</label>
              <input name="aciklama" value={form.aciklama} onChange={h} className="form-input" placeholder="İsteğe bağlı" /></div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn-ekle gider" disabled={ekleniyor}>{ekleniyor ? '...' : duzenlenen ? 'Güncelle' : 'Gider Ekle'}</button>
            {duzenlenen && <button type="button" className="btn-ekle" style={{ background: 'linear-gradient(135deg, #64748b, #475569)' }} onClick={() => { setDuzenlenen(null); setForm({ kategori: '', tutar: '', tarih: new Date().toISOString().split('T')[0], odemeSekli: 'banka', aciklama: '' }); }}>İptal</button>}
          </div>
        </form>
      </div>

      <div className="tablo-kapsayici">
        <div className="tablo-baslik"><h3>Şirket Giderleri</h3></div>
        {liste.length === 0 ? <div className="bos-mesaj">Henüz gider kaydı yok.</div> : (
          <table><thead><tr><th>Tarih</th><th>Kategori</th><th className="tutar">Tutar</th><th>Ödeme</th><th>Açıklama</th><th></th></tr></thead>
            <tbody>{liste.filter(i => i).sort((a, b) => b.tarih?.localeCompare?.(a.tarih) || 0).map((i) => (
              <tr key={i.id}>
                <td>{fTarih(i.tarih)}</td><td><strong>{i.kategori}</strong></td>
                <td className="tutar deger-gider">{tl(i.tutar)}</td>
                <td><span className="tur-badge gider">{i.odemeSekli === 'banka' ? '🏦' : i.odemeSekli === 'nakit' ? '💵' : i.odemeSekli === 'kredi' ? '💳' : '📄'} {i.odemeSekli}</span></td>
                <td style={{ color: 'var(--text-secondary)', maxWidth: 120 }}>{i.aciklama || '-'}</td>
                <td><button className="btn-duzenle" onClick={() => duzenle(i)}>✎</button><button className="btn-sil" onClick={() => sil(i.id)}>x</button></td>
              </tr>
            ))}</tbody></table>
        )}
      </div>

      {Object.keys(kategoriToplam).length > 0 && (
        <div className="tablo-kapsayici">
          <div className="tablo-baslik"><h3>Kategori Bazında Giderler</h3></div>
          <table><thead><tr><th>Kategori</th><th className="tutar">Toplam</th></tr></thead>
            <tbody>{Object.entries(kategoriToplam).sort((a, b) => b[1] - a[1]).map(([kat, tut]) => (
              <tr key={kat}><td><strong>{kat}</strong></td><td className="tutar deger-gider">{tl(tut)}</td></tr>
            ))}</tbody></table>
        </div>
      )}
    </div>
  );
}
