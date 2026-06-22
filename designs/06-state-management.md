# 06 — State Management Tasarımı

## Mevcut Durum
- 10+ `useState` App.jsx'te (kayitlar, kategoriler, borclar, eticaret, aylikGiderler, hedefler, aktifSekme, bildirim, seciliDonem, duzenlenecekKayit, mobileMenuAcik)
- CRUD işlemleri App.jsx'te (kayitEkle, kayitSil, kayitGuncelle, kategoriEkle, kategoriSil, vs.)
- Component'lere prop drilling ile geçiyor
- Her state değişikliği tüm ağacı re-render ediyor

## Hedef: Zustand Store

### Store Yapısı
```javascript
// stores/financeStore.js
import { create } from 'zustand';
import { api } from '../utils/api';

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
  
  // Actions
  verileriYukle: async () => {
    set({ yukleniyor: true, hata: null });
    try {
      const veri = await api.veriOku();
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
      set({ hata: err.message, yukleniyor: false });
    }
  },
  
  kayitEkle: async (kayit) => {
    // Optimistic update
    const yeniKayit = { ...kayit, id: idOlustur() };
    set(state => ({ kayitlar: [...state.kayitlar, yeniKayit] }));
    
    try {
      const sonuc = await api.kayitEkle(kayit);
      if (!sonuc?.basarili) throw new Error('Kayıt başarısız');
      // Server'dan gelen gerçek veriyle güncelle
      set(state => ({
        kayitlar: state.kayitlar.map(k => 
          k.id === yeniKayit.id ? { ...k, id: sonuc.id } : k
        )
      }));
    } catch (err) {
      // Rollback
      set(state => ({
        kayitlar: state.kayitlar.filter(k => k.id !== yeniKayit.id),
        hata: err.message
      }));
    }
  },
  
  // ... diğer CRUD action'lar
}));

// stores/uiStore.js
import { create } from 'zustand';

const useUIStore = create((set) => ({
  aktifRoute: '/',
  bildirim: null,
  mobileMenuAcik: false,
  seciliDonem: 'aylik',
  duzenlenecekKayit: null,
  
  setAktifRoute: (route) => set({ aktifRoute: route }),
  bildirimGoster: (mesaj, tip = 'success') => set({ bildirim: { mesaj, tip } }),
  bildirimKapat: () => set({ bildirim: null }),
  toggleMobileMenu: () => set(state => ({ mobileMenuAcik: !state.mobileMenuAcik })),
  setSeciliDonem: (donem) => set({ seciliDonem: donem }),
  
  // Toast + undo pattern
  bildirimGoster: (mesaj, tip = 'success', undoCallback = null) => {
    const id = Date.now();
    set({ bildirim: { id, mesaj, tip, undoCallback } });
    setTimeout(() => {
      const state = get();
      if (state.bildirim?.id === id) set({ bildirim: null });
    }, 5000);
  },
}));

// stores/authStore.js
import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  yukleniyor: true,
  
  setUser: (user) => set({ user, yukleniyor: false }),
  logout: () => {
    document.cookie = 'session_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    set({ user: null });
  },
}));
```

### Component'lerde Kullanım
```jsx
function AnaSayfa() {
  const kayitlar = useFinanceStore(state => state.kayitlar);
  const kategoriler = useFinanceStore(state => state.kategoriler);
  const verileriYukle = useFinanceStore(state => state.verileriYukle);
  const bildirimGoster = useUIStore(state => state.bildirimGoster);
  
  // Sadece ilgili state değişince re-render olur
  const toplamGelir = useMemo(() =>
    kayitlar.filter(k => k.tur === 'gelir').reduce((t, k) => t + Number(k.tutar), 0),
    [kayitlar]
  );
  
  // ...
}
```

### Faydaları
| Metrik | Önce | Sonra |
|--------|------|-------|
| App.jsx satır sayısı | 396 | ~80 |
| Re-render sıklığı | Her state değişiminde tüm ağaç | Sadece ilgili store'u dinleyenler |
| Veri akışı | Prop drilling (6+ seviye) | Doğrudan store selector |
| CRUD kod tekrarı | Her component'te manuel | Store action'ları |
| Test edilebilirlik | Zor (tüm state bağımlı) | Kolay (store mock'lanabilir) |
