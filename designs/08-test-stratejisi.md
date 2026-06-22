# 08 — Test Stratejisi

## Framework: Vitest + RTL + Supertest

### Kurulum
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event jsdom supertest
```

## Test Piramidi

```
         ╱╲
        ╱ E2E ╲          ← %5 (Playwright, ileri faz)
       ╱────────╲
      ╱ Integration ╲    ← %25 (API + Component)
     ╱────────────────╲
    ╱   Unit Tests      ╲ ← %70 (Utility, hooks, helpers)
   ╱──────────────────────╲
```

## Öncelikli Testler (P1)

### 1. Backend Unit Tests (`server/validate.test.js`)
```javascript
describe('validateKayit', () => {
  test('geçerli kayıt hata döndürmez', () => {
    expect(validateKayit({
      tutar: 100, tur: 'gelir', tarih: '2026-06-22'
    }, 'kayitlar')).toEqual([]);
  });
  
  test('geçersiz tutar hata döndürür', () => {
    expect(validateKayit({ tutar: 'abc' }, 'kayitlar'))
      .toContain('Tutar geçerli bir sayı olmalıdır');
  });
});
```

### 2. camelCase/snake_case Dönüşüm Testleri
```javascript
describe('convertKeys', () => {
  test('toCamelCase user_id → userId', () => {
    expect(toCamelCase('user_id')).toBe('userId');
  });
  
  test('toSnakeCase userId → user_id', () => {
    expect(toSnakeCase('userId')).toBe('user_id');
  });
});
```

### 3. AuthContext Testleri
```javascript
describe('AuthContext', () => {
  test('başlangıçta kullanıcı null', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    expect(result.current.user).toBeNull();
  });
});
```

### 4. API Integration Tests (Supertest)
```javascript
describe('GET /health', () => {
  test('200 + status ok döndürür', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
```

### 5. GelirGiderEkle Component Testi
```jsx
describe('GelirGiderEkle', () => {
  test('form elemanlarını render eder', () => {
    render(<GelirGiderEkle kategoriler={[]} kayitEkle={vi.fn()} />);
    expect(screen.getByLabelText('Tutar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /kaydet/i })).toBeInTheDocument();
  });
});
```

## Coverage Hedefleri

| Sprint | Lines | Functions | Branches |
|--------|-------|-----------|----------|
| 1 (P1) | %40 | %35 | %30 |
| 2 (P1+P2) | %60 | %50 | %45 |
| 3 (hedef) | %70 | %60 | %55 |

## CI Entegrasyonu
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx vitest run --coverage
```
