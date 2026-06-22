import { create } from 'zustand';
import { api } from '../utils/api';

const idOlustur = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 11);
  }
};

const useFinanceStore = create((set, get) => ({
  // State
  kayitlar: [],
  kategoriler: [],
  borclar: [],
  eticaret: [],
  aylikGiderler: [],
  hedefler: [],
  yukleniyor: false,
  hata: null,

  // Tüm veriyi yükle
  verileriYukle: async () => {
    set({ yukleniyor: true, hata: null });
    try {
      const response = await api.veriOku();
      const veri = response?.veri || response || {};
      set({
        kayitlar: veri.kayitlar || [],
        kategoriler: veri.kategoriler || [],
        borclar: veri.borclar || [],
        eticaret: veri.eticaret || [],
        aylikGiderler: veri.aylikGiderler || [],
        hedefler: veri.hedefler || [],
        yukleniyor: false,
      });
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
      set({ hata: err.message, yukleniyor: false });
    }
  },

  // Kayıt Ekle (optimistic update)
  kayitEkle: (kayit) => {
    const yeniKayit = { ...kayit, id: idOlustur() };
    set(state => ({ kayitlar: [...state.kayitlar, yeniKayit] }));
    api.kayitEkle(kayit).catch(() => {
      set(state => ({
        kayitlar: state.kayitlar.filter(k => k.id !== yeniKayit.id),
        hata: 'Kayıt eklenirken hata oluştu',
      }));
    });
  },

  // Kayıt Sil
  kayitSil: (id) => {
    const onceki = get().kayitlar;
    set(state => ({ kayitlar: state.kayitlar.filter(k => k.id !== id) }));
    api.kayitSil(id).catch(() => {
      set({ kayitlar: onceki, hata: 'Kayıt silinirken hata oluştu' });
    });
  },

  // Kayıt Güncelle
  kayitGuncelle: (kayit) => {
    set(state => ({
      kayitlar: state.kayitlar.map(k => k.id === kayit.id ? { ...k, ...kayit } : k),
    }));
    api.kayitGuncelle(kayit).catch(() => {
      get().verileriYukle();
      set({ hata: 'Kayıt güncellenirken hata oluştu' });
    });
  },

  // Kategori İşlemleri
  kategoriEkle: (kategori) => {
    const yeni = { ...kategori, id: idOlustur() };
    set(state => ({ kategoriler: [...state.kategoriler, yeni] }));
    api.kategoriEkle(kategori).catch(() => {
      set(state => ({
        kategoriler: state.kategoriler.filter(k => k.id !== yeni.id),
      }));
    });
  },

  kategoriSil: (id) => {
    set(state => ({
      kategoriler: state.kategoriler.filter(k => k.id !== id),
      kayitlar: state.kayitlar.filter(k => k.kategoriId !== id),
    }));
    api.kategoriSil(id).catch(() => {
      get().verileriYukle();
    });
  },

  // Genel CRUD (diğer bölümler için)
  bolumEkle: (bolum, kayit) => {
    const yeni = { ...kayit, id: idOlustur() };
    set(state => ({ [bolum]: [...(state[bolum] || []), yeni] }));
    api.bolumEkle(bolum, kayit).catch(() => {
      set(state => ({
        [bolum]: (state[bolum] || []).filter(k => k.id !== yeni.id),
      }));
    });
  },

  bolumSil: (bolum, id) => {
    set(state => ({
      [bolum]: (state[bolum] || []).filter(k => k.id !== id),
    }));
    api.bolumSil(bolum, id).catch(() => {
      get().verileriYukle();
    });
  },

  // Hata temizle
  hatayiTemizle: () => set({ hata: null }),
}));

export default useFinanceStore;
