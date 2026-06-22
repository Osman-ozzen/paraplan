# 02 — Component Tree (Önerilen Yeniden Yapılanma)

## Mevcut Durum (God Component Problemi)

```
<App>  ← 396 satır (state, CRUD, routing, layout)
  ├── <AuthPage />
  ├── <Sidebar>  ← inline
  ├── <GelirGiderEkle />
  ├── <AnaSayfa />  ← 902 satır
  ├── <Raporlar />  ← 359 satır
  ├── <Kategoriler />
  ├── <Borclar />
  ├── <ETicaret />  ← 579 satır
  ├── <AylikGiderler />  ← 640 satır
  └── <Hedefler />  ← 439 satır
```

## Hedef Component Tree (v3.0.0)

```
<App>  ← ~80 satır (sadece layout + routing)
  ├── <AuthPage />
  │
  ├── <AppLayout>  ← YENİ: layout wrapper
  │   ├── <Sidebar />
  │   │   ├── <Logo />
  │   │   ├── <NavMenu />  ← sekme listesi
  │   │   └── <UserInfo />
  │   │
  │   ├── <MobileTabBar />  ← mobil için alt tab bar
  │   │
  │   ├── <NotificationToast />  ← AYRILDI (App.jsx'ten)
  │   │
  │   └── <Suspense fallback={<SkeletonLoader />}>
  │       └── {route === 'anasayfa' && <AnaSayfa />}  ← lazy
  │           ├── <OzetKartlari />  ← YENİ: 4 özet kartı
  │           │   ├── <OzetKart tip="gelir" />
  │           │   ├── <OzetKart tip="gider" />
  │           │   ├── <OzetKart tip="net" />
  │           │   └── <OzetKart tip="hedef" />
  │           │
  │           ├── <GrafikAlani />  ← YENİ: grafikleri grupla
  │           │   ├── <PastaGrafik veri={secilenGrafik} />
  │           │   └── <BarGrafik veri={secilenGrafik} />
  │           │
  │           └── <YevmiyeDefteri />  ← YENİ: filtreleme + liste
  │               ├── <FiltreCubugu />
  │               └── <KayitListesi />
  │
  │       {route === 'raporlar' && <Raporlar />}  ← lazy
  │           ├── <GrafikSecici />
  │           ├── <PastaGrafik />
  │           ├── <BarGrafik />
  │           ├── <CizgiGrafik />
  │           └── <HesapDetayTablosu />
  │
  │       {route === 'gelir-gider' && <GelirGiderEkle />}  ← lazy
  │
  │       {route === 'kategoriler' && <Kategoriler />}  ← lazy
  │
  │       {route === 'borclar' && <Borclar />}  ← lazy
  │           ├── <BorcOzeti />
  │           └── <BorcFormu />
  │
  │       {route === 'eticaret' && <ETicaret />}  ← lazy
  │           ├── <EticaretFormu />
  │           ├── <KarZararTablosu />
  │           └── <PlatformKomisyonu />
  │
  │       {route === 'aylik-giderler' && <AylikGiderler />}  ← lazy
  │
  │       {route === 'hedefler' && <Hedefler />}  ← lazy
  │           ├── <HedefKarti />
  │           └── <HedefFormu />
  │
  └── <Footer />  ← opsiyonel
```

## Yeni Paylaşılan Component'ler

```
src/components/common/
├── OzetKart.jsx       ← Tekrar kullanılabilir kart
├── Modal.jsx          ← confirm() yerine modal
├── Toast.jsx          ← Bildirim sistemi
├── SkeletonLoader.jsx ← Yükleniyor animasyonu
├── BosDurum.jsx       ← "Henüz kayıt yok" mesajı
├── HataDurumu.jsx     ← Hata durumu göstergesi
└── ConfirmDialog.jsx  ← Silme onay diyaloğu
```

## Önemli Değişiklikler

| Değişiklik | Sebep |
|-----------|-------|
| App.jsx → ~80 satır | Routing + layout'a indirgenmiş |
| Sekme bazlı lazy loading | %62 daha az JS (650→250 KB) |
| Ortak component'ler | Kod tekrarını azaltır |
| Skeleton loader | UX iyileştirmesi |
| Modal (confirm() yerine) | Modern UX, undo desteği |
