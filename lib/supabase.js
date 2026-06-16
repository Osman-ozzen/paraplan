const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL ve SUPABASE_SERVICE_KEY ortam değişkenleri tanımlanmalı.');
  console.error('   .env dosyasına ekleyin veya Render dashboard\'dan ayarlayın.');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
  auth: { persistSession: false },
});

module.exports = supabase;
