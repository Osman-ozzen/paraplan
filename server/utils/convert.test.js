import { describe, it, expect } from 'vitest';
import { toSnakeCase, toCamelCase, convertKeys } from './convert';

describe('toSnakeCase', () => {
  it('userId → user_id', () => {
    expect(toSnakeCase('userId')).toBe('user_id');
  });

  it('hedefTutar → hedef_tutar', () => {
    expect(toSnakeCase('hedefTutar')).toBe('hedef_tutar');
  });

  it('basit kelime değişmez', () => {
    expect(toSnakeCase('ad')).toBe('ad');
  });
});

describe('toCamelCase', () => {
  it('user_id → userId', () => {
    expect(toCamelCase('user_id')).toBe('userId');
  });

  it('hedef_tutar → hedefTutar', () => {
    expect(toCamelCase('hedef_tutar')).toBe('hedefTutar');
  });

  it('created_at → createdAt', () => {
    expect(toCamelCase('created_at')).toBe('createdAt');
  });
});

describe('convertKeys', () => {
  it('dizi elemanlarını dönüştürür', () => {
    const input = [{ user_id: 1 }, { user_id: 2 }];
    const result = convertKeys(input, toCamelCase);
    expect(result).toEqual([{ userId: 1 }, { userId: 2 }]);
  });

  it('iç içe objeleri dönüştürür', () => {
    const input = { user_data: { first_name: 'Ali' } };
    const result = convertKeys(input, toCamelCase);
    expect(result).toEqual({ userData: { firstName: 'Ali' } });
  });

  it('null objeyi dönüştürmez', () => {
    expect(convertKeys(null, toCamelCase)).toBe(null);
  });

  it('string değerleri dönüştürmez', () => {
    expect(convertKeys('test', toCamelCase)).toBe('test');
  });
});
