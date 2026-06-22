import { create } from 'zustand';
import { api } from '../utils/api';

const useAuthStore = create((set) => ({
  // State
  user: null,
  yukleniyor: true,

  // Giriş
  giris: async (email, password) => {
    try {
      const response = await api.giris(email, password);
      if (response?.basarili && response?.veri) {
        set({ user: response.veri.user, yukleniyor: false });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Giriş hatası:', err);
      return false;
    }
  },

  // Kayıt
  kayit: async (email, password) => {
    try {
      const response = await api.kayit(email, password);
      return response?.basarili || false;
    } catch (err) {
      console.error('Kayıt hatası:', err);
      return false;
    }
  },

  // Oturum kontrolü
  oturumKontrol: async () => {
    try {
      const response = await api.oturumGetir();
      if (response?.basarili && response?.veri) {
        set({ user: response.veri, yukleniyor: false });
      } else {
        set({ user: null, yukleniyor: false });
      }
    } catch {
      set({ user: null, yukleniyor: false });
    }
  },

  // Çıkış
  cikis: () => {
    localStorage.removeItem(api.TOKEN_KEY);
    document.cookie = 'session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    set({ user: null });
  },

  // Kullanıcı ata (mevcut verileri kullanıcıya bağla)
  veriAta: async () => {
    try {
      const response = await api.veriAta();
      return response?.basarili || false;
    } catch {
      return false;
    }
  },
}));

export default useAuthStore;
