const { createClient } = require('@supabase/supabase-js');
const { convertKeys, toSnakeCase, toCamelCase } = require('../utils/convert');
const { getTableName, DEFAULT_KATEGORILER, idOlustur } = require('../config/constants');

// ─── Supabase Client'ları ────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY;

const useSupabase = !!(SUPABASE_URL && SUPABASE_KEY);
const useAuth = !!(SUPABASE_URL && SUPABASE_ANON);

let supabase = null;
let supabaseAnon = null;

if (useSupabase) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
  if (useAuth) {
    supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: { persistSession: false },
    });
  }
  console.log('  🗄️  Veritabanı: Supabase' + (useAuth ? ' + Auth' : ''));
} else {
  console.log('  🗄️  Veritabanı: JSON (yerel dosya)');
}

// ─── Supabase: Tüm Veriyi Oku ─────────────────────────────────────────
async function veriOku(userId) {
  const result = {};
  const queries = Object.entries({
    kategoriler: 'kategoriler',
    kayitlar: 'kayitlar',
    borclar: 'borclar',
    eticaret: 'eticaret',
    sirketGider: 'sirket_gider',
    aylikGiderler: 'aylik_giderler',
    hedefler: 'hedefler',
  }).map(async ([key, table]) => {
    try {
      let query = supabase.from(table).select('*');
      if (userId) query = query.eq('user_id', userId);
      const { data, error } = await query;
      return [key, !error && data ? convertKeys(data, toCamelCase) : []];
    } catch {
      return [key, []];
    }
  });

  const results = await Promise.all(queries);
  for (const [key, data] of results) {
    result[key] = data;
  }

  // Varsayılan kategorileri ekle
  if ((!result.kategoriler || result.kategoriler.length === 0) && userId) {
    try {
      const varsayilan = DEFAULT_KATEGORILER.map(k => ({ ...k, user_id: userId }));
      const { data: katData, error: katError } = await supabase
        .from('kategoriler')
        .upsert(convertKeys(varsayilan, toSnakeCase), { onConflict: 'id' })
        .select();
      if (!katError && katData) result.kategoriler = convertKeys(katData, toCamelCase);
    } catch {}
  }

  if (!result.kategoriler) result.kategoriler = [...DEFAULT_KATEGORILER];
  return result;
}

// ─── Supabase: Bölüm Ekle ──────────────────────────────────────────────
async function bolumEkle(bolum, kayit, userId) {
  const table = getTableName(bolum);
  const yeni = { ...convertKeys(kayit, toSnakeCase), id: kayit.id || idOlustur() };
  if (userId) yeni.user_id = userId;

  const { data, error } = await supabase.from(table).insert(yeni).select();
  if (error) throw error;
  return { basarili: true, [bolum]: convertKeys(data || [], toCamelCase) };
}

// ─── Supabase: Bölüm Güncelle ─────────────────────────────────────────
async function bolumGuncelle(bolum, id, kayit, userId) {
  const table = getTableName(bolum);
  const guncel = convertKeys(kayit, toSnakeCase);

  let query = supabase.from(table).update(guncel).eq('id', id);
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query.select();
  if (error) throw error;
  return { basarili: data && data.length > 0, [bolum]: convertKeys(data || [], toCamelCase) };
}

// ─── Supabase: Bölüm Sil ─────────────────────────────────────────────
async function bolumSil(bolum, id, userId) {
  const table = getTableName(bolum);

  let query = supabase.from(table).delete().eq('id', id);
  if (userId) query = query.eq('user_id', userId);
  const { error } = await query;
  if (error) throw error;

  let selectQuery = supabase.from(table).select('*');
  if (userId) selectQuery = selectQuery.eq('user_id', userId);
  const { data } = await selectQuery;
  return { basarili: true, [bolum]: convertKeys(data || [], toCamelCase) };
}

// ─── Supabase: Kategori Sil ───────────────────────────────────────────
async function kategoriSil(id, userId) {
  let delQuery = supabase.from('kayitlar').delete().eq('kategori_id', id);
  if (userId) delQuery = delQuery.eq('user_id', userId);
  await delQuery;

  let delKatQuery = supabase.from('kategoriler').delete().eq('id', id);
  if (userId) delKatQuery = delKatQuery.eq('user_id', userId);
  await delKatQuery;

  let katQuery = supabase.from('kategoriler').select('*');
  let kayQuery = supabase.from('kayitlar').select('*');
  if (userId) {
    katQuery = katQuery.eq('user_id', userId);
    kayQuery = kayQuery.eq('user_id', userId);
  }
  const kategoriler = (await katQuery).data || [];
  const kayitlar = (await kayQuery).data || [];

  return { basarili: true, kategoriler: convertKeys(kategoriler, toCamelCase), kayitlar: convertKeys(kayitlar, toCamelCase) };
}

module.exports = { useSupabase, useAuth, supabaseAnon, veriOku, bolumEkle, bolumGuncelle, bolumSil, kategoriSil };
