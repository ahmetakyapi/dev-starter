# Katki Rehberi (Contributing Guide)

dev-starter ekosistemini gelistirmek icin bu rehberi takip edin.

---

## Genel Kurallar

- Conventional commit kullanin (`rules/commit-conventions.md`)
- Her degisiklik Gate Agent 6-pass kontrolunden gecmeli
- Hardcoded renk/deger YASAK — semantic token kullanin (`rules/design-tokens.md`)
- Turkce dokumantasyon, Ingilizce kod

---

## Yeni Tema Eklemek

1. `knowledge/themes/[proje-adi].md` dosyasi olusturun
2. Icerigi doldurun:
   - Renk paleti (primary, secondary, accent, surface, text)
   - Tipografi (font-family, weight'ler, boyutlar)
   - Bilesen stilleri (card, button, input)
   - Ozel kurallar (dark-only, data-theme, vb.)
3. `agents/AGENT_PROTOCOL.md` → "Ahmet'in Repo'lari" tablosuna ekleyin

---

## Yeni Hata Kaydetmek

1. `knowledge/mistakes.md` dosyasini acin
2. Son numaradan sonra yeni entry ekleyin
3. Format:

```markdown
### [N]. Hata Basligi

**Hata**: Ne oldu?
**Sebep**: Neden oldu?
**Cozum**: Nasil duzeltildi?
**Kural**: Gelecekte nasil onlenir?
```

4. Commit: `docs: add mistake #N — [kisa aciklama]`

---

## Yeni Desen Eklemek

1. `knowledge/patterns.md` dosyasini acin
2. Ilgili kategorinin altina ekleyin (veya yeni kategori olusturun)
3. Her desen icin:
   - Baslik ve kisa aciklama
   - Tam kod ornegi (copy-paste edilebilir)
   - Import'lar dahil
4. Commit: `docs: add pattern — [desen adi]`

---

## Yeni Agent Eklemek

1. `agents/[agent-adi]-agent.md` dosyasi olusturun
2. Zorunlu bolumler:
   - Rol tanimi
   - Sistem Baglami (hangi dosyalari okur)
   - Context seviyesi
   - Kullandigi Skills
   - Agent Iletisimi (kimden alir, kime verir)
   - Gorev Kapsami
   - Cikti Standardi
3. `agents/AGENT_PROTOCOL.md` → Agent Ekibi tablosuna ekleyin
4. `rules/context-curation.md` → Context matrisine ekleyin
5. Commit: `feat(agents): add [agent-adi] agent`

---

## Yeni Kural Eklemek

1. `rules/[kural-adi].md` dosyasi olusturun
2. Icerigi yapilandirin:
   - Kurallar listesi (numarali)
   - Her kural icin: ne, neden, nasil
   - Istisnalar (varsa)
   - Enforcement yontemi (grep pattern, hook, vb.)
3. `agents/AGENT_PROTOCOL.md` → Kurallar tablosuna ekleyin
4. Ilgili agent dosyalarinin "Sistem Baglami" bolumune referans ekleyin
5. Commit: `feat(rules): add [kural-adi] rule`

---

## Yeni Skill Eklemek

1. `.claude/commands/[skill-adi].md` dosyasi olusturun
2. Frontmatter:
   ```yaml
   ---
   description: Skill'in tek satirlik aciklamasi
   ---
   ```
3. Icerikte: Ne yaptigini, hangi adimlari izledigini, cikti formatini tanimlayin
4. `agents/AGENT_PROTOCOL.md` → Skills tablosuna ekleyin
5. Commit: `feat(skills): add /[skill-adi] command`

---

## Yeni Snippet Eklemek

1. `snippets/[snippet-adi].tsx` dosyasi olusturun
2. Zorunlu:
   - Dosya basinda JSDoc comment (aciklama + kullanim ornegi)
   - TypeScript interface'leri
   - `'use client'` sadece interaktif ise
   - Design token'lar kullanin (hardcoded renk yok)
   - Dark/light mode destegi
3. Commit: `feat(snippets): add [snippet-adi] component`

---

## Paket Guncellemek

1. `packages/@ahmet/[paket]/` icinde degisiklik yapin
2. `npm run build` ile build edin
3. Versiyon artirin: root + paket `package.json`
4. `CHANGELOG.md` guncelleyin
5. Commit: `feat(theme|ui): [degisiklik aciklamasi]`

---

## Hook Eklemek

1. `hooks/[hook-adi].sh` dosyasi olusturun
2. Bash best practice:
   - `set -euo pipefail`
   - `TOOL_INPUT` kontrolu (Claude Code hook'lari icin)
   - Temiz cikis kodlari (0=ok, 2=block)
3. `.claude/settings.local.json` → hooks bolumune ekleyin
4. `agents/AGENT_PROTOCOL.md` → Hook tablosuna ekleyin
5. Commit: `feat(hooks): add [hook-adi] enforcement hook`

---

## PR Sureci

1. Feature branch olusturun: `git checkout -b feat/[ozellik]`
2. Degisiklikleri yapin
3. `bash scripts/health-check.sh` calistirin — PASSED olmali
4. Conventional commit ile commit edin
5. PR acin, Gate raporu ekleyin

---

## Dosya Adlandirma

| Tip | Format | Ornek |
|-----|--------|-------|
| Agent | `[ad]-agent.md` | `frontend-agent.md` |
| Kural | `[ad].md` (kebab-case) | `design-tokens.md` |
| Tema | `[proje-adi].md` | `ahmetakyapi.md` |
| Snippet | `[ad].tsx` (kebab-case) | `animated-number.tsx` |
| Skill | `[ad].md` (kebab-case) | `review-ui.md` |
| Hook | `[ad].sh` (kebab-case) | `gate-guard.sh` |
