---
paths:
  - "**/*.tsx"
  - "lib/motion.ts"
  - "hooks/**"
  - "app/**/*.css"
---

# Hareket Kuralları

> Şablon CLAUDE.md'sinden taşındı (dev-starter, 8 Kasım 2026): bileşen ya da
> hareket dosyasına dokunulunca yüklenir. İki Next şablonunda bu dosya bayt
> bayt aynıdır (dev-starter `health-check.sh` → `SHARED_TEMPLATE_FILES`).

- Import `motion/react`; `framer-motion` YOK. Kök `MotionProvider` →
  `LazyMotion strict` + `MotionConfig reducedMotion="user"`. Bileşende
  `m.div` yazılır, `motion.div` strict modda hata verir.
- Eğri ve süreler `lib/motion.ts` (`EASE`, `DUR`, `SPRING`, `STAGGER`,
  `fadeUp`...). CSS karşılığı `--ease-brand`; her `transition-*` onu
  kendiliğinden alır.
- **`Reveal`de hareketi azaltan kullanıcı için `initial={false}` YAZMA**:
  sunucu HTML'i `opacity: 0` gelir ve içerik görünmez kalır. `initial`
  hedefini değiştir. Kahraman başlığı ve LCP öğesi Reveal'e sarılmaz.
- Sonradan değişen "hareketi azalt" tercihi için `useMotionPreference`.
- Yalnızca `transform` ve `opacity` animasyonu. Nedeni tek cümleyle
  yazılamayan hareket eklenmez.
