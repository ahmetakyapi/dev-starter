---
description: Sürüm artır, changelog güncelle, git etiketi oluştur
argument-hint: "patch | minor | major"
disable-model-invocation: true
---

`$ARGUMENTS` seviyesinde (patch | minor | major) release yap. Bu komut
npm paketi yayınlanan depolar içindir (`~/dev-starter` → `@ahmetakyapi/theme`, `@ahmetakyapi/ui`);
uygulama projelerinde sürüm etiketi için de kullanılabilir.

Adımlar:

1. **Mevcut durumu kontrol et**:
   - `git status` — temiz mi? Commit edilmemiş değişiklik var mı?
   - Mevcut versiyon: `package.json` oku
   - Doğrulama: `npm run build && npm run typecheck && npm run lint && npm test`
   - Paket deposuysa: `npm run verify:exports` ve `npm pack --dry-run -w <paket>`
     (manifestin vaat ettiği her yol tarball'da mı — `~/dev-starter/knowledge/mistakes.md` #48)

2. **Versiyon artır**:
   - `patch`: Bug fix (1.0.0 → 1.0.1)
   - `minor`: Yeni özellik (1.0.0 → 1.1.0)
   - `major`: Breaking change (1.0.0 → 2.0.0)
   - Root `package.json` ve tüm workspace paketlerini güncelle

3. **CHANGELOG.md güncelle**:
   - Son tag'den bu yana commit'leri oku: `git log --oneline [last-tag]..HEAD`
   - Commit'leri kategorize et: feat, fix, refactor, perf, docs, chore
   - Yeni versiyon başlığı ekle

4. **Commit + Tag** — yalnız sürüm dosyaları stage'lenir (`git add -A` değil:
   çalışma ağacında başka ne varsa sürüm commit'ine sızar):
   ```bash
   git add package.json package-lock.json CHANGELOG.md packages/*/*/package.json 2>/dev/null
   git status --short                      # yalnız amaçlanan dosyalar mı?
   git commit -m "chore(release): v[yeni-versiyon]"
   git tag v[yeni-versiyon]
   ```
   dev-starter'da sayılar değiştiyse önce `npm run readme:assets`
   (`verify:readme` CI'da kırılır) ve üretilen dosyaları da ekle.

5. **Push ve yayın**:
   - `git push && git push --tags` (commit istendiyse push da aynı turda;
     `~/.claude/CLAUDE.md` → Commit ve Push)
   - npm'e yayın (`npm publish -w <paket>`) yalnızca kullanıcı açıkça isterse
     ve ayrıca onay ister (`permissions.ask`); 2FA etkinse OTP gerekir. Yayından
     sonra temiz dizinde kur ve içe aktar
     (`~/dev-starter/agents/deploy-agent.md` → npm Paketi Yayınlarken)

Sonucu şu formatta raporla:

```
RELEASE
━━━━━━━━━━━━━━━━━━
Sürüm:      [eski] → [yeni] ([patch | minor | major])
Doğrulama:  build ✅|❌ · typecheck ✅|❌ · lint ✅|❌ · test ✅|❌ · verify:exports ✅|❌|⏭️
Değişenler: [feat N · fix N · diğer N — en önemli üç satır]
Commit/Tag: [hash] · v[yeni] · push: yapıldı | yapılmadı (neden)
npm:        yayınlanmadı (istenmedi) | yayınlandı + temiz kurulum çıktısı
```

Doğrulama adımlarından biri kırmızıysa DUR: sürüm artırma, etiket atma.
