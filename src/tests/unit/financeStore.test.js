import { describe, it, expect, beforeEach, vi } from 'vitest';

// API modülünü mock'la (browser API'leri test ortamında yok)
vi.mock('../../utils/api', () => ({
  api: {
    veriOku: vi.fn(),
    kayitEkle: vi.fn().mockRejectedValue(new Error('mock')),
    kayitSil: vi.fn().mockRejectedValue(new Error('mock')),
    kayitGuncelle: vi.fn().mockRejectedValue(new Error('mock')),
    kategoriEkle: vi.fn().mockRejectedValue(new Error('mock')),
    kategoriSil: vi.fn().mockRejectedValue(new Error('mock')),
    bolumEkle: vi.fn().mockRejectedValue(new Error('mock')),
    bolumSil: vi.fn().mockRejectedValue(new Error('mock')),
  },
}));

import useFinanceStore from '../../stores/financeStore';

describe('financeStore', () => {
  beforeEach(() => {
    // Store'u sıfırla
    useFinanceStore.setState({
      kayitlar: [],
      kategoriler: [],
      borclar: [],
      yukleniyor: false,
      hata: null,
    });
  });

  it('başlangıç state doğru', () => {
    const state = useFinanceStore.getState();
    expect(state.kayitlar).toEqual([]);
    expect(state.yukleniyor).toBe(false);
    expect(state.hata).toBeNull();
  });

  it('kayitEkle state günceller', () => {
    useFinanceStore.getState().kayitEkle({ tur: 'gelir', tutar: 100, aciklama: 'Test' });
    const state = useFinanceStore.getState();
    expect(state.kayitlar).toHaveLength(1);
    expect(state.kayitlar[0].tur).toBe('gelir');
    expect(state.kayitlar[0].tutar).toBe(100);
  });

  it('kayitSil state günceller', () => {
    const store = useFinanceStore.getState();
    store.kayitEkle({ tur: 'gelir', tutar: 100 });
    const kayitId = useFinanceStore.getState().kayitlar[0].id;

    useFinanceStore.getState().kayitSil(kayitId);
    expect(useFinanceStore.getState().kayitlar).toHaveLength(0);
  });

  it('kategoriEkle kategori ekler', () => {
    useFinanceStore.getState().kategoriEkle({ ad: 'Maaş', tur: 'gelir' });
    expect(useFinanceStore.getState().kategoriler).toHaveLength(1);
    expect(useFinanceStore.getState().kategoriler[0].ad).toBe('Maaş');
  });

  it('hatayiTemizle hatayı sıfırlar', () => {
    useFinanceStore.setState({ hata: 'Bir hata oluştu' });
    useFinanceStore.getState().hatayiTemizle();
    expect(useFinanceStore.getState().hata).toBeNull();
  });
});
