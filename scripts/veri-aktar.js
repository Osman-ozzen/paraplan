/**
 * Bütçe Takip - JSON → Supabase Veri Aktarma Scripti
 *
 * Kullanım:
 *   1. .env dosyasına SUPABASE_URL ve SUPABASE_SERVICE_KEY yaz
 *   2. Supabase SQL Editor'de supabase-schema.sql çalıştır
 *   3. node scripts/veri-aktar.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ SUPABASE_URL ve SUPABASE_SERVICE_KEY .env dosyasında tanımlanmalı.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// JSON verisini oku
const dataPath = path.join(__dirname, '..', 'data', 'butce-verisi.json');
if (!fs.existsSync(dataPath)) {
  console.error('❌ data/butce-verisi.json bulunamadı.');
  process.exit(1);
}

const veri = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// Tablo isimleri (BOLUM_TABLO ile aynı)
const TABLOLAR = {
  kategoriler: 'kategoriler',
  kayitlar: 'kayitlar',
  borclar: 'borclar',
  eticaret: 'eticaret',
  sirketGider: 'sirket_gider',
  aylikGiderler: 'aylik_giderler',
};

async function aktar() {
  console.log('💰 Bütçe Takip - Veri Aktarımı');
  console.log('═══════════════════════════════\n');

  for (const [bolum, tablo] of Object.entries(TABLOLAR)) {
    const items = veri[bolum];
    if (!items || items.length === 0) {
      console.log(`  ⏭️  ${bolum}: kayıt yok, atlanıyor`);
      continue;
    }

    console.log(`  📤 ${bolum} → ${tablo} (${items.length} kayıt)`);

    // Küçük parçalar halinde gönder (Supabase limit ~1000 satır)
    const chunkSize = 50;
    let basarili = 0;
    let hata = 0;

    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const { error } = await supabase.from(tablo).upsert(chunk, { onConflict: 'id' });

      if (error) {
        console.error(`    ❌ Hata (${i}-${i + chunk.length}): ${error.message}`);
        hata += chunk.length;
      } else {
        basarili += chunk.length;
      }
    }

    console.log(`    ✅ ${basarili} aktarıldı${hata > 0 ? `, ${hata} hata` : ''}`);
  }

  console.log('\n═══════════════════════════════');
  console.log('✅ Veri aktarımı tamamlandı!');
  console.log('📋 Supabase SQL Editor\'de şu sorguyu çalıştırarak doğrulayabilirsin:');
  console.log('   SELECT * FROM kategoriler;');
  console.log('   SELECT COUNT(*) FROM kayitlar;');
}

aktar().catch(err => {
  console.error('❌ Beklenmeyen hata:', err);
  process.exit(1);
});
