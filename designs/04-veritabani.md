# 04 — Veritabanı Tasarımı

## Mevcut Sorunlar

| Sorun | Açıklama | Çözüm |
|-------|----------|-------|
| camelCase kolonlar | `hedefTutar`, `birikenTutar` | snake_case'e çevir |
| TEXT PK | Performans düşük | UUID'ye geç |
| Eksik FK | 3 tabloda kategori FK yok | Ekle |
| user_id TEXT | auth.users UUID ile uyumsuz | UUID yap + FK |
| RLS yok | Anon key ile tüm veri erişilebilir | RLS policy ekle |
| TEXT ay | Tarih aritmetiği yok | DATE yap |
| Sequential sorgular | 7 round-trip | Promise.all |
| fix-schema.sql tehlikeli | DROP CASCADE | Kaldır, ALTER TABLE kullan |

## Hedef Şema

```sql
-- _migrations (versiyon takip)
CREATE TABLE IF NOT EXISTS _migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kategoriler (Hesap Planı)
CREATE TABLE kategoriler (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad TEXT NOT NULL,
  tur TEXT NOT NULL CHECK (tur IN ('gelir', 'gider')),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ad, user_id)
);

CREATE INDEX idx_kategoriler_user ON kategoriler(user_id);
CREATE INDEX idx_kategoriler_tur ON kategoriler(tur);

-- Kayıtlar (Yevmiye Defteri)
CREATE TABLE kayitlar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tur TEXT NOT NULL CHECK (tur IN ('gelir', 'gider')),
  kategori_id UUID NOT NULL REFERENCES kategoriler(id) ON DELETE CASCADE,
  tutar DECIMAL(12,2) NOT NULL CHECK (tutar > 0),
  tarih DATE NOT NULL,
  aciklama TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kayitlar_user_tarih ON kayitlar(user_id, tarih);
CREATE INDEX idx_kayitlar_user_tur ON kayitlar(user_id, tur);
CREATE INDEX idx_kayitlar_tarih ON kayitlar(tarih);
CREATE INDEX idx_kayitlar_kategori ON kayitlar(kategori_id);

-- Borçlar
CREATE TABLE borclar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alacakli TEXT NOT NULL,
  tutar DECIMAL(12,2) NOT NULL CHECK (tutar > 0),
  tarih DATE NOT NULL,
  vade_tarihi DATE,
  durum TEXT NOT NULL DEFAULT 'odenmedi' CHECK (durum IN ('odenmedi', 'odendi', 'kismi')),
  kategori_id UUID REFERENCES kategoriler(id),
  aciklama TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_borclar_user_durum ON borclar(user_id, durum);

-- E-Ticaret
CREATE TABLE eticaret (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL,
  urun_adi TEXT NOT NULL,
  kategori TEXT,
  maliyet DECIMAL(12,2) NOT NULL,
  satis_fiyati DECIMAL(12,2) NOT NULL,
  adet INTEGER DEFAULT 1 CHECK (adet > 0),
  kargo DECIMAL(12,2) DEFAULT 0,
  komisyon DECIMAL(12,2) DEFAULT 0,
  diger_kesintiler DECIMAL(12,2) DEFAULT 0,
  kar DECIMAL(12,2),
  tarih DATE NOT NULL,
  kategori_id UUID REFERENCES kategoriler(id),
  aciklama TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_eticaret_user_tarih ON eticaret(user_id, tarih);
CREATE INDEX idx_eticaret_platform ON eticaret(platform);

-- Şirket Giderleri
CREATE TABLE sirket_gider (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kategori TEXT NOT NULL,
  tutar DECIMAL(12,2) NOT NULL CHECK (tutar > 0),
  tarih DATE NOT NULL,
  odeme_sekli TEXT,
  kategori_id UUID REFERENCES kategoriler(id),
  aciklama TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sirket_gider_user_tarih ON sirket_gider(user_id, tarih);

-- Aylık Giderler
CREATE TABLE aylik_giderler (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tur TEXT NOT NULL,
  ad TEXT NOT NULL,
  kategori TEXT,
  tutar DECIMAL(12,2) NOT NULL CHECK (tutar > 0),
  ay DATE NOT NULL,
  odeme_gunu INTEGER CHECK (odeme_gunu BETWEEN 1 AND 31),
  periyot TEXT DEFAULT 'aylik',
  odendi BOOLEAN DEFAULT FALSE,
  kategori_id UUID REFERENCES kategoriler(id),
  aciklama TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_aylik_giderler_user_ay ON aylik_giderler(user_id, ay);

-- Hedefler
CREATE TABLE hedefler (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad TEXT NOT NULL,
  icon TEXT,
  hedef_tutar DECIMAL(12,2) NOT NULL CHECK (hedef_tutar > 0),
  biriken_tutar DECIMAL(12,2) DEFAULT 0 CHECK (biriken_tutar >= 0),
  tamamlanma_tarihi DATE,
  durum TEXT DEFAULT 'devam' CHECK (durum IN ('devam', 'tamamlandi')),
  aciklama TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hedefler_user_durum ON hedefler(user_id, durum);
```

## Row Level Security (RLS)

```sql
-- Her tablo için RLS aktifleştir
ALTER TABLE kategoriler ENABLE ROW LEVEL SECURITY;
ALTER TABLE kayitlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE borclar ENABLE ROW LEVEL SECURITY;
ALTER TABLE eticaret ENABLE ROW LEVEL SECURITY;
ALTER TABLE sirket_gider ENABLE ROW LEVEL SECURITY;
ALTER TABLE aylik_giderler ENABLE ROW LEVEL SECURITY;
ALTER TABLE hedefler ENABLE ROW LEVEL SECURITY;

-- Her tablo için policy (anon key kullanıcısı sadece kendi verisini görebilir)
CREATE POLICY user_isolation ON kayitlar
  FOR ALL USING (auth.uid() = user_id);

-- Diğer tablolar için aynı...
```

## Migration Planı

```yaml
v001: Initial schema (mevcut supabase-schema.sql'den uyarla)
v002: Add UUID PK, snake_case kolonlar
v003: Add FK constraints (kategori_id, user_id UUID)
v004: Enable RLS policies
v005: Add composite indexes
v006: Convert aylik_giderler.ay to DATE
```

## Performans İyileştirmeleri

### Sorgu Optimizasyonu
```javascript
// Sequential (mevcut) → Parallel (hedef)
async function veriOku(userId) {
  const queries = Object.entries(BOLUM_TABLO).map(([key, table]) =>
    supabase.from(table)
      .select('*')
      .eq('user_id', userId)
      .then(({ data, error }) => [key, data || []])
  );
  return Object.fromEntries(await Promise.all(queries));
}
```

### N+1 Koruması
```javascript
// Frontend: kategori find yerine Map kullan
const kategoriMap = useMemo(() => 
  new Map(kategoriler.map(k => [k.id, k.ad])), 
  [kategoriler]
);
const katAd = kategoriMap.get(kayit.kategoriId) || 'Diğer';
```
