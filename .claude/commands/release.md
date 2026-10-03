---
description: Sürüm artır, changelog güncelle, git etiketi oluştur
argument-hint: "patch | minor | major"
---

`$ARGUMENTS` seviyesinde (patch | minor | major) release yap. Bu komut
npm paketi yayinlanan depolar icindir (`~/dev-starter` → `@ahmetakyapi/theme`, `@ahmetakyapi/ui`);
uygulama projelerinde surum etiketi icin de kullanilabilir.

Adimlar:

1. **Mevcut durumu kontrol et**:
   - `git status` — temiz mi? Commit edilmemis degisiklik var mi?
   - Mevcut versiyon: `package.json` oku
   - Dogrulama: `npm run build && npm run typecheck && npm run lint && npm test`
   - Paket deposuysa: `npm run verify:exports` ve `npm pack --dry-run -w <paket>`
     (manifestin vaat ettigi her yol tarball'da mi — `~/dev-starter/knowledge/mistakes.md` #48)

2. **Versiyon artir**:
   - `patch`: Bug fix (1.0.0 → 1.0.1)
   - `minor`: Yeni ozellik (1.0.0 → 1.1.0)
   - `major`: Breaking change (1.0.0 → 2.0.0)
   - Root `package.json` ve tum workspace paketlerini guncelle

3. **CHANGELOG.md guncelle**:
   - Son tag'den bu yana commit'leri oku: `git log --oneline [last-tag]..HEAD`
   - Commit'leri kategorize et: feat, fix, refactor, perf, docs, chore
   - Yeni versiyon basligi ekle

4. **Commit + Tag**:
   ```
   git add -A
   git commit -m "chore(release): v[yeni-versiyon]"
   git tag v[yeni-versiyon]
   ```

5. **Sonuc raporla**:
   - Eski versiyon → Yeni versiyon
   - Dahil olan degisiklikler ozeti
   - `git push && git push --tags` (commit istendiyse push da ayni turda)
   - npm'e yayin (`npm publish -w <paket>`) yalnizca kullanici acikca isterse;
     2FA etkinse OTP gerekir
