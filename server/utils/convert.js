// ─── Alan Adı Dönüşümü (camelCase ↔ snake_case) ─────────────────────────
function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function convertKeys(obj, converter) {
  if (Array.isArray(obj)) return obj.map(item => convertKeys(item, converter));
  if (obj && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, val]) => [
        converter(key),
        val && typeof val === 'object' ? convertKeys(val, converter) : val,
      ])
    );
  }
  return obj;
}

module.exports = { toSnakeCase, toCamelCase, convertKeys };
