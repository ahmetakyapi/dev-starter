---
paths:
  - "hooks/**"
  - ".claude/settings.json"
  - "templates/*/.claude/**"
  - "scripts/test-hooks.sh"
---

# Enforcement Hook'ları

> 8 Kasım 2026'ya dek kök `CLAUDE.md`nin "Enforcement Hook'ları" bölümüydü;
> hook dosyasına ya da ayarlara dokunulunca yüklensin diye buraya taşındı
> (`knowledge/decisions.md` → "Bağlam Dosyaları"). Aynı tablo
> `agents/AGENT_PROTOCOL.md` → Enforcement Hook'ları'nda da var.

Kurallar kağıt üstünde kalmaz — bash hook'ları ile fiziksel olarak uygulanır:

| Hook | Tetik | Ne Yapar |
|------|-------|----------|
| `hooks/gate-guard.sh` | PreToolUse:Bash (git commit) | Aktif story Gate PASSED değilse ya da Gate'ten sonra kod değiştiyse (rapordaki `Kapsam:` izi, `hooks/lib/gate-hash.sh`) bloklar; kolon başlıktan bulunur, docs-only muaf — #99 |
| `hooks/quality-scan.sh` | PreToolUse:Bash (git commit) | Sır (AWS/PEM/JWT/URL + Anthropic/GitHub/npm/Resend/Stripe/Slack önekleri), `.env` (iç içe dahil), debug kodu, `@ts-ignore`, kilit, agentic cast; TDD'siz fix, format dışı mesaj, test zayıflatma uyarıları |
| `hooks/routemap-sync.sh` | PostToolUse:Edit/Write | ROUTEMAP tazelik + DONE ⇒ Gate PASSED değişmezi |
| `hooks/session-brief.sh` | SessionStart | ROUTEMAP özeti + sıradaki iş önerisi bağlama basılır |

Entegrasyon: **`.claude/settings.json`** içindeki `hooks` bloğu (paylaşılan,
versiyonlanır). `.claude/settings.local.json` yalnızca makineye özgü izinler
içindir ve gitignore'dadır. impeccable eklentisi ve `.impeccable/` 3.0.0'da
kaldırıldı. **Şablonlar da aynı hook'ları taşır**: `templates/*/.claude/settings.json`
hook'ları `~/dev-starter/hooks/`tan mutlak yolla çağırır — yeni proje ilk
gününden denetimli doğar, kopya yok (tek kaynak).

## Engelleme ve Filtre Sözleşmesi (Claude Code resmî belgesi, 8 Kasım 2026)

- **Engelleme yalnız exit 2** (gerekçe STDERR'de) ya da
  `hookSpecificOutput.permissionDecision: "deny"`. **exit 1 ENGELLEMEZ**;
  hook'un çökmesi (127, 1) commit'i taramasız geçirir. İki commit hook'u
  exit 2 kullanır; `test-hooks.sh` bunu davranışla denetler.
- PostToolUse'ta model yalnız `{"decision":"block","reason":...}` JSON'unu
  görür (routemap-sync), düz stdout transcript'te kalır.
- **Matcher**: yalnız harf/rakam/`|` içeren matcher TAM ad listesidir
  (`Edit|Write` NotebookEdit'i yakalamaz — bilerek). Başka karakter içeren
  matcher düzenli ifadedir ve çapasızdır: `Edit.*` NotebookEdit'i de yakalar,
  tam eşleşme için `^Edit$`.
- **Handler düzeyinde `if`** (izin kuralı sözdizimi) hook sürecini hiç
  başlatmadan eler. Commit hook'ları `"if": "Bash(git *)"` taşır: her `npm`,
  `ls`, `grep` çağrısında iki bash süreci açılmaz. Claude Code baştaki
  `VAR=değer` atamalarını atar, `a && git commit` zincirinde her alt komutu,
  `$()` ve ters tırnak içini ayrı denetler; komutu çözemezse hook'u yine
  koşturur. `Bash(git commit*)` SEÇİLMEDİ: `git -C yol commit` ve
  `git -c user.name=… commit` biçimlerini kaçırır, lib bu biçimleri
  tanıyor ve testliyor. Bilinen boşluk: `env git commit`, `command git commit`
  ve `/usr/bin/git commit` alt komut adı `git` olmadığı için filtreye takılır;
  lib bunları tanısa da hook koşmaz. Kabul edildi: `if` "best-effort"tur,
  sert sınır izin sistemidir. Script'ler kendi `hook_text_is_git_commit`
  süzgecini KORUR (filtre değişirse ya da kaldırılırsa davranış aynı kalır).
- `if` yalnız araç olaylarında değerlendirilir; `SessionStart`a `if` konursa
  hook HİÇ koşmaz.

## Değişiklik Yaparken

- Yeni hook: `hooks/` altında script, **`.claude/settings.json`**'a kayıt
  (şablon `settings.json`'larına da — ikisi bayt bayt aynı), `scripts/test-hooks.sh`'e
  davranış testi, `scripts/health-check.sh` → `HOOKS` listesi.
- Hook'un çalıştığını varsayma — `bash scripts/test-hooks.sh` ve
  `bash scripts/health-check.sh` (varlık değil davranış, `knowledge/mistakes.md #52`).
