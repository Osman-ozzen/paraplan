-- ═══════════════════════════════════════════════════════════════════════════
-- Bütçe Takip - Supabase Veritabanı Şeması
-- Bunu Supabase SQL Editor'de çalıştır.
-- ═══════════════════════════════════════════════════════════════════════════

-- Kategoriler (Hesap Planı)
CREATE TABLE IF NOT EXISTS kategoriler (
  id TEXT PRIMARY KEY,
  ad TEXT NOT NULL,
  tur TEXT NOT NULL CHECK (tur IN ('gelir', 'gider')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gelir/Gider Kayıtları (Yevmiye Defteri)
CREATE TABLE IF NOT EXISTS kayitlar (
  id TEXT PRIMARY KEY,
  tur TEXT NOT NULL CHECK (tur IN ('gelir', 'gider')),
  kategori_id TEXT REFERENCES kategoriler(id) ON DELETE CASCADE,
  tutar NUMERIC(12,2) NOT NULL,
  tarih DATE NOT NULL,
  aciklama TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Borçlar
CREATE TABLE IF NOT EXISTS borclar (
  id TEXT PRIMARY KEY,
  alacakli TEXT NOT NULL,
  tutar NUMERIC(12,2) NOT NULL,
  tarih DATE,
  vade_tarihi DATE,
  durum TEXT DEFAULT 'odenmedi' CHECK (durum IN ('odenmedi', 'odendi', 'kismi')),
  aciklama TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- E-Ticaret Satışları
CREATE TABLE IF NOT EXISTS eticaret (
  id TEXT PRIMARY KEY,
  platform TEXT,
  urun_adi TEXT,
  kategori TEXT,
  maliyet NUMERIC(12,2) DEFAULT 0,
  satis_fiyati NUMERIC(12,2) DEFAULT 0,
  adet INTEGER DEFAULT 1,
  kargo NUMERIC(12,2) DEFAULT 0,
  komisyon NUMERIC(12,2) DEFAULT 0,
  diger_kesintiler NUMERIC(12,2) DEFAULT 0,
  kar NUMERIC(12,2) DEFAULT 0,
  tarih DATE,
  aciklama TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Şirket Giderleri
CREATE TABLE IF NOT EXISTS sirket_gider (
  id TEXT PRIMARY KEY,
  kategori TEXT,
  tutar NUMERIC(12,2) NOT NULL,
  tarih DATE,
  odeme_sekli TEXT DEFAULT 'banka',
  aciklama TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aylık Sabit Gelir/Giderler
CREATE TABLE IF NOT EXISTS aylik_giderler (
  id TEXT PRIMARY KEY,
  tur TEXT NOT NULL CHECK (tur IN ('gelir', 'gider')),
  ad TEXT NOT NULL,
  kategori TEXT,
  tutar NUMERIC(12,2) NOT NULL,
  ay TEXT NOT NULL,
  odeme_gunu INTEGER,
  periyot INTEGER,
  odendi BOOLEAN DEFAULT FALSE,
  aciklama TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ İndeksler ═══════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_kayitlar_tarih ON kayitlar(tarih);
CREATE INDEX IF NOT EXISTS idx_kayitlar_tur ON kayitlar(tur);
CREATE INDEX IF NOT EXISTS idx_kayitlar_kategori ON kayitlar(kategori_id);
CREATE INDEX IF NOT EXISTS idx_aylik_giderler_ay ON aylik_giderler(ay);
CREATE INDEX IF NOT EXISTS idx_borclar_durum ON borclar(durum);
CREATE INDEX IF NOT EXISTS idx_eticaret_tarih ON eticaret(tarih);
CREATE INDEX IF NOT EXISTS idx_sirket_gider_tarih ON sirket_gider(tarih);
