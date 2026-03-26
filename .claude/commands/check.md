---
description: Proje saglik kontrolu — build, type, lint, design token, test
---

Projenin saglik durumunu kontrol et. Sirayla:

1. **Build kontrolu**: `npm run build` calistir (varsa)
2. **TypeScript kontrolu**: `npx tsc --noEmit` calistir
3. **Lint kontrolu**: Lint script varsa calistir
4. **Design token taramasi**: `rules/design-tokens.md` kurallarini kontrol et — tsx/ts dosyalarinda hardcoded hex renk, `bg-white`, `text-gray-*` gibi ihlaller ara
5. **Guvenlik taramasi**: Hardcoded secret, .env dosyalari, console.log kalintilari kontrol et
6. **Test**: Test script varsa calistir

Sonucu su formatta raporla:

```
CHECK REPORT
━━━━━━━━━━━━━━━━━━━━━━━
Build:        ✅ | ❌
TypeScript:   ✅ | ❌
Lint:         ✅ | ❌ | ⏭️ (yoksa)
Design Token: ✅ | ⚠️ [N ihlal]
Security:     ✅ | ❌
Tests:        ✅ | ❌ | ⏭️ (yoksa)
━━━━━━━━━━━━━━━━━━━━━━━
Sonuc: PASSED | FAILED | PASSED_WITH_WARNINGS
```

Her basarisiz adimda hatayi ve duzeltme onerisini belirt.
