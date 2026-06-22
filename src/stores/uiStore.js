import { create } from 'zustand';

const useUIStore = create((set, get) => ({
  // State
  aktifRoute: '/',
  bildirim: null,
  mobileMenuAcik: false,
  seciliDonem: 'aylik',
  duzenlenecekKayit: null,
  tema: localStorage.getItem('paraplan-theme') || 'light',

  // Bildirim
  bildirimGoster: (mesaj, tip = 'success', sure = 3000) => {
    const id = Date.now();
    set({ bildirim: { id, mesaj, tip } });
    setTimeout(() => {
      const state = get();
      if (state.bildirim?.id === id) set({ bildirim: null });
    }, sure);
  },

  bildirimKapat: () => set({ bildirim: null }),

  // Menü
  toggleMobileMenu: () => set(state => ({ mobileMenuAcik: !state.mobileMenuAcik })),
  mobileMenuKapat: () => set({ mobileMenuAcik: false }),

  // Route
  setAktifRoute: (route) => set({ aktifRoute: route }),

  // Dönem seçimi
  setSeciliDonem: (donem) => set({ seciliDonem: donem }),

  // Düzenleme
  setDuzenlenecek: (kayit) => set({ duzenlenecekKayit: kayit }),
  duzenlemeIptal: () => set({ duzenlenecekKayit: null }),

  // Tema
  temaDegistir: () => {
    const yeniTema = get().tema === 'light' ? 'dark' : 'light';
    localStorage.setItem('paraplan-theme', yeniTema);
    set({ tema: yeniTema });
  },
}));

export default useUIStore;
