// ═══ ParaPlan Sunucu Başlatma ═══════════════════════════════════════════════
const os = require('os');
const app = require('./app');

const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// Ağ Bilgisi
const networks = os.networkInterfaces();
let ipAdresi = 'localhost';
Object.keys(networks).forEach((iface) => {
  networks[iface].forEach((details) => {
    if (details.family === 'IPv4' && !details.internal) {
      ipAdresi = details.address;
    }
  });
});

// Başlat
const HOST = isProd ? '0.0.0.0' : '127.0.0.1';
const { useSupabase } = require('./services/supabase.service');

app.listen(PORT, HOST, () => {
  console.log('\n═══════════════════════════════════════════');
  console.log('  💰 ParaPlan Sunucusu Çalışıyor');
  console.log('═══════════════════════════════════════════');
  console.log(`  📺 Bilgisayar: http://localhost:${PORT}`);
  console.log(`  📱 Telefon:    http://${ipAdresi}:${PORT}`);
  console.log(`  🔗 API:        http://localhost:${PORT}/api/veri`);
  console.log(`  ❤️  Sağlık:     http://localhost:${PORT}/health`);
  if (useSupabase) {
    console.log('  🗄️  Supabase bağlı (camelCase ↔ snake_case dönüşümü aktif)');
  } else {
    console.log('  🗄️  JSON dosya (atomik yazma + yedekleme aktif)');
  }
  console.log('═══════════════════════════════════════════\n');
});
