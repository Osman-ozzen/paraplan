import { describe, it, expect } from 'vitest';
import { validateKayit } from './error.middleware';

describe('validateKayit', () => {
  it('geçerli kayıt hata döndürmez', () => {
    const errors = validateKayit({
      tutar: 100,
      tur: 'gelir',
      tarih: '2026-06-22',
    }, 'kayitlar');
    expect(errors).toEqual([]);
  });

  it('geçersiz tutar hata döndürür', () => {
    const errors = validateKayit({ tutar: 'abc' }, 'kayitlar');
    expect(errors).toContain('Tutar geçerli bir sayı olmalıdır.');
  });

  it('geçersiz tur hata döndürür', () => {
    const errors = validateKayit({ tur: 'yatirim' }, 'kayitlar');
    expect(errors).toContain('Tur yalnızca "gelir" veya "gider" olabilir.');
  });

  it('geçersiz tarih hata döndürür', () => {
    const errors = validateKayit({ tarih: 'degil-tarih' }, 'kayitlar');
    expect(errors).toContain('Tarih geçerli bir tarih formatında olmalıdır.');
  });

  it('boş body hata fırlatmaz', () => {
    const errors = validateKayit({}, 'kayitlar');
    expect(errors).toEqual([]);
  });

  it('geçersiz durum hata döndürür', () => {
    const errors = validateKayit({ durum: 'bilinmeyen' }, 'borclar');
    expect(errors.length).toBeGreaterThan(0);
  });
});
