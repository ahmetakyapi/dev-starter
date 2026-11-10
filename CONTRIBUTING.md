# Katkı Rehberi (Contributing Guide)

dev-starter ekosistemini geliştirmek için bu rehberi takip edin.

---

## Genel Kurallar

- Conventional commit kullanın (`rules/commit-conventions.md`)
- Her değişiklik Gate Agent 6+1 adım kontrolünden geçmeli
- Hardcoded renk/değer YASAK — semantic token kullanın (`rules/design-tokens.md`)
- Türkçe dokümantasyon, İngilizce kod

---

## Yeni Tema Eklemek

1. `knowledge/themes/[proje-adi].md` dosyası oluşturun (şablon: `templates/docs/DESIGN.template.md`)
2. İçeriği doldurun:
   - Renk paleti (primary, secondary, accent, surface, text)
   - Tipografi (font-family, weight'ler, boyutlar)
   - Bileşen stilleri (card, button, input)
   - Özel kurallar (dark-only, data-theme, vb.)
3. `agents/AGENT_PROTOCOL.md` → "Ahmet'in Repo'ları" tablosuna ekleyin

---

## Rehber Güncellemek

`guides/` "ne yapılır"ı sırayla anlatır; `knowledge/` "neden"i saklar. Bir
hata kaydı eklediğinizde, o hatayı bir sonraki projede hiç yaşatmayacak adımı
ilgili rehbere de yazın (kod örneği + ✅/❌ + bir cümlelik neden + hangi proje).

---

## Global Kurallar

`~/.claude/CLAUDE.md` depodaki `machine/CLAUDE.md`ye symlink'tir; değişikliği
orada yapın ve commit'leyin.

---

## Yeni Hata Kaydetmek

1. `knowledge/mistakes.md` dosyasını açın
2. Son numaradan sonra yeni entry ekleyin
3. Format:

```markdown
### [N]. Hata Başlığı

**Hata**: Ne oldu?
**Sebep**: Neden oldu?
**Cozum**: Nasil duzeltildi?
**Kural**: Gelecekte nasil onlenir?
```

4. Commit: `docs: add mistake #N — [kisa aciklama]`

---

## Yeni Desen Eklemek

1. `knowledge/patterns.md` dosyasını açın
2. İlgili kategorinin altına ekleyin (veya yeni kategori oluşturun)
3. Her desen için:
   - Başlık ve kısa açıklama
   - Tam kod örneği (copy-paste edilebilir)
   - Import'lar dahil
4. Commit: `docs: add pattern — [desen adi]`

---

## Yeni Agent Eklemek

1. `agents/[agent-adi]-agent.md` dosyası oluşturun
2. Zorunlu bölümler:
   - Rol tanımı
   - Sistem Bağlamı (hangi dosyaları okur)
   - Context seviyesi
   - Kullandığı Skills
   - Agent İletişimi (kimden alır, kime verir)
   - Görev Kapsamı
   - Çıktı Standardı
3. `agents/AGENT_PROTOCOL.md` → Agent Ekibi tablosuna ekleyin (tur: rol mu,
   kayıtlı subagent mi)
4. `rules/context-curation.md` → Context matrisine ekleyin
5. Kayıtlı subagent olacaksa: `.claude/agents/[ad].md` INCE wrapper
   (rol dosyasını `~/dev-starter/agents/...` mutlak yoluyla okur, içerik
   KOPYALANMAZ) + `scripts/health-check.sh` → `WRAPPERS` listesine ekleyin
6. Commit: `feat(agents): add [agent-adi] agent`

---

## Yeni Kural Eklemek

1. `rules/[kural-adi].md` dosyası oluşturun
2. İçeriği yapılandırın:
   - Kurallar listesi (numaralı)
   - Her kural için: ne, neden, nasıl
   - İstisnalar (varsa)
   - Enforcement yöntemi (grep pattern, hook, vb.)
3. `agents/AGENT_PROTOCOL.md` → Kurallar tablosuna ekleyin
4. İlgili agent dosyalarının "Sistem Bağlamı" bölümüne referans ekleyin
5. Commit: `feat(rules): add [kural-adi] rule`

---

## Yeni Skill Eklemek

0. **Örtüşme denetimi**: önce mevcut komutları tarayin (`ls .claude/commands`) — yeni komut var
   olanla aynı işi yapıyorsa komut değil, var olana bir mod ekleyin
   (/check ↔ /gate sınırı gibi: kesişiyorlarsa sınır cümlesi yazın)
1. `.claude/commands/[skill-adi].md` dosyası oluşturun
2. Frontmatter:
   ```yaml
   ---
   description: Skill'in tek satirlik aciklamasi
   argument-hint: "[arguman]"
   ---
   ```
   Yan etkisi olan komutta (sürüm, deploy, proje kurma) modelin kendiliğinden
   çağırmaması için `disable-model-invocation: true` düşünün. Yalnız bu depoda
   çalışan komut (`/harvest`, `/evolve`) başka projelere BAĞLANMAZ: adını
   `machine/bootstrap.sh` → `REPO_ONLY_COMMANDS` listesine ekleyin ve
   açıklamasına "Yalnız ~/dev-starter deposunda" yazın (health-check ikisini
   birlikte denetler). Komut bir rapor biçimiyle ya da "Çıktı:" satırıyla biter.
3. İçerikte: Ne yaptığını, hangi adımları izlediğini, çıktı formatını tanımlayın
4. **Yollar mutlak**: komutlar `machine/bootstrap.sh` ile `~/.claude/commands/`a
   symlink'lenir ve her projeden çağrılır. `templates/...` değil
   `~/dev-starter/templates/...` yazın
5. `bash machine/bootstrap.sh` ile bağlayın
6. `agents/AGENT_PROTOCOL.md` → Skills tablosuna, kök `CLAUDE.md` komut
   tablosuna ve `scripts/health-check.sh` → `COMMANDS` listesine ekleyin
   (health-check listelenmemiş komutu uyarı olarak yakalar)
7. Commit: `feat(skills): add /[skill-adi] command`

---

## Yeni Snippet Eklemek

1. `snippets/[snippet-adi].tsx` dosyası oluşturun
2. Zorunlu:
   - Dosya başında JSDoc comment (açıklama + kullanım örneği)
   - TypeScript interface'leri
   - `'use client'` sadece interaktif ise
   - Rol token sınıfları (`bg-surface`, `text-strong`...); hardcoded renk ve `dark:` yok
   - Hareket `motion/react` + `m.*` (kökte LazyMotion strict varsayılır)
   - İki temada (açık/koyu) kontrol
   - Katalog: `guides/05-components.md` ya da `guides/10-component-library.md`
3. Commit: `feat(snippets): add [snippet-adi] component`

---

## Paket Güncellemek

1. `packages/@ahmet/[paket]/` içinde değişiklik yapın
2. `npm run build` ile build edin
3. Versiyon artırın: root + paket `package.json`
4. `CHANGELOG.md` güncelleyin
5. Commit: `feat(theme|ui): [degisiklik aciklamasi]`

---

## Hook Eklemek

1. `hooks/[hook-adi].sh` dosyası oluşturun
2. Bash best practice:
   - `set -euo pipefail`
   - Girdiyi stdin'den JSON olarak okuyun: `source hooks/lib/hook-input.sh`.
     `TOOL_INPUT` diye bir ortam değişkeni YOK; ona bakan hook hiç çalışmaz
     (`knowledge/mistakes.md` #52)
   - Temiz çıkış kodları (0=ok, 2=block)
3. `.claude/settings.json` → `hooks` bölümüne ekleyin (paylaşılan, versiyonlanır;
   `settings.local.json` yalnızca makineye özgü izinler için). Komut mutlak
   yolla yazılır: `bash "$CLAUDE_PROJECT_DIR"/hooks/[hook-adi].sh`. Hook
   Claude'un o anki dizininde koşar; göreli yol (`bash hooks/...`) ilk `cd`den
   sonra bulunamaz ve commit kapısız geçer (health-check bunu FAIL sayar)
   Yeni projeler de çalıştırsın diye aynı kaydı `templates/*/.claude/settings.json`
   dosyalarına `~/dev-starter/hooks/...` mutlak yoluyla ekleyin.
4. `scripts/test-hooks.sh`'e gerçek payload veren bir davranış testi ekleyin ve
   önce KIRMIZI gördüğünüzü doğrulayın
5. `agents/AGENT_PROTOCOL.md` → Hook tablosuna ekleyin
6. Commit: `feat(hooks): add [hook-adi] enforcement hook`

---

## PR Süreci

1. Feature branch oluşturun: `git checkout -b feat/[ozellik]`
2. Değişiklikleri yapın
3. `bash scripts/health-check.sh` çalıştırın — PASSED olmalı
4. Conventional commit ile commit edin
5. PR açın, Gate raporu ekleyin

---

## Dosya Adlandırma

| Tip | Format | Örnek |
|-----|--------|-------|
| Agent | `[ad]-agent.md` | `frontend-agent.md` |
| Kural | `[ad].md` (kebab-case) | `design-tokens.md` |
| Tema | `[proje-adi].md` | `ahmetakyapi.md` |
| Snippet | `[ad].tsx` (kebab-case) | `animated-number.tsx` |
| Skill | `[ad].md` (kebab-case) | `review-ui.md` |
| Hook | `[ad].sh` (kebab-case) | `gate-guard.sh` |
