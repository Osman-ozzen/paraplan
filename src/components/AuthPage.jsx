import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mod, setMod] = useState('giris'); // 'giris' veya 'kayit'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHata('');
    setYukleniyor(true);

    try {
      const data = mod === 'giris'
        ? await login(email, password)
        : await register(email, password);

      if (data.error) {
        setHata(data.error);
      } else if (mod === 'kayit' && !data.session) {
        setHata('Kayıt başarılı! Email adresinizi kontrol edin. (Supabase doğrulama emaili göndermiş olabilir)');
        setYukleniyor(false);
        return;
      }
    } catch (err) {
      setHata('Bağlantı hatası');
    }
    setYukleniyor(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1040 100%)',
      padding: 20,
    }}>
      <div style={{
        background: 'white', borderRadius: 20, padding: '40px 32px',
        width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', fontSize: 24, fontWeight: 900, color: 'white',
            boxShadow: '0 8px 24px rgba(79,70,229,0.4)',
          }}>P</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, color: '#0f172a' }}>
            Para<span style={{ color: '#7c3aed' }}>Plan</span>
          </h1>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            {mod === 'giris' ? 'Hesabına giriş yap' : 'Yeni hesap oluştur'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <input
            type="email" placeholder="Email adresiniz" required
            value={email} onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%', padding: '12px 14px', marginBottom: 10,
              border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14,
              fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
          <input
            type="password" placeholder="Şifreniz" required
            value={password} onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%', padding: '12px 14px', marginBottom: 16,
              border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14,
              fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />

          {hata && (
            <div style={{
              padding: '10px 12px', background: hata.includes('başarılı') ? '#d1fae5' : '#fee2e2',
              color: hata.includes('başarılı') ? '#065f46' : '#dc2626',
              borderRadius: 8, fontSize: 12, marginBottom: 14, textAlign: 'center',
            }}>
              {hata}
            </div>
          )}

          <button
            type="submit" disabled={yukleniyor}
            style={{
              width: '100%', padding: '12px', border: 'none', borderRadius: 10,
              background: yukleniyor ? '#a5b4fc' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              color: 'white', fontSize: 14, fontWeight: 700, cursor: yukleniyor ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'opacity 0.2s',
              boxShadow: '0 4px 16px rgba(79,70,229,0.3)',
            }}
          >
            {yukleniyor ? 'İşleniyor...' : mod === 'giris' ? 'Giriş Yap' : 'Kayıt Ol'}
          </button>
        </form>

        {/* Mod değiştir */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            onClick={() => { setMod(mod === 'giris' ? 'kayit' : 'giris'); setHata(''); }}
            style={{
              background: 'none', border: 'none', fontSize: 12, color: '#4f46e5',
              fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {mod === 'giris' ? 'Hesabın yok mu? Kayıt ol' : 'Zaten hesabın var mı? Giriş yap'}
          </button>
        </div>
      </div>
    </div>
  );
}
