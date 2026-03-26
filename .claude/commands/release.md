---
description: Versiyon artir, changelog guncelle, git tag olustur
---

`$ARGUMENTS` seviyesinde (patch | minor | major) release yap.

Adimlar:

1. **Mevcut durumu kontrol et**:
   - `git status` — temiz mi? Commit edilmemis degisiklik var mi?
   - Mevcut versiyon: `package.json` oku

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
   - `git push && git push --tags` komutu hatirlatmasi
