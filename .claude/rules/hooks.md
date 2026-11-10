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
| `hooks/git-pre-commit.sh` | git `pre-commit` (Claude Code DIŞI) | Aynı iki commit script'ini terminalden/başka asistandan atılan commit'te koşturur; klon başına `--install` |

Entegrasyon: **`.claude/settings.json`** içindeki `hooks` bloğu (paylaşılan,
versiyonlanır). `.claude/settings.local.json` yalnızca makineye özgü izinler
içindir ve gitignore'dadır. impeccable eklentisi ve `.impeccable/` 3.0.0'da
kaldırıldı. **Şablonlar da aynı hook'ları taşır**: `templates/*/.claude/settings.json`
hook'ları `~/dev-starter/hooks/`tan mutlak yolla çağırır — yeni proje ilk
gününden denetimli doğar, kopya yok (tek kaynak).

**`~/dev-starter` yoksa** (bulut oturumu, ekosistemi kurmamış makine) şablon
hook'ları koşmaz: bash 127 ile çıkar, bu engelleme değildir, Gate ve sır
taraması kapanır. Sessiz kalmasın diye şablonun SessionStart komutu yolu
önce sınar ve yoksa "hook'lar KAPALI, commit öncesi elle şunları çalıştır"
satırını bağlama basar (`test-hooks.sh` kayıtlı komutun kendisini koşturur).
Commit'i bu durumda BLOKLAMAK seçilmedi: `if: Bash(git *)` filtresiyle her
git komutunu, `onFailure: "block"` ile de aynı şeyi durdururdu ve bulut
oturumu hiç commit atamazdı.

**Claude Code dışı commit'ler.** PreToolUse yalnız Claude'un Bash aracında
tetiklenir. `bash ~/dev-starter/hooks/git-pre-commit.sh --install` (proje
kökünde, klon başına bir kez; `/new-project` adım 8 yapar) `.git/hooks/pre-commit`e
ince bir köprü yazar: `gate-guard` ve `quality-scan` aynı payload'la koşar,
biri exit 2 verirse commit oluşmaz. Mesaj o aşamada bilinmediği için biçim
ve fix/TDD uyarıları yalnız Claude Code yolundadır; `--no-verify` köprüyü
atlar (disiplin aracı, güvenlik sınırı değil). Var olan yabancı
`pre-commit` ezilmez.

**İzinler (`permissions`).** `deny`: sır dosyalarının Read'i. `ask`: zorla
push, `vercel --prod`, `npm publish` — her modda (auto dahil) onay ister ve
allow kuralından önce gelir. Düz `git push` listede YOK ("commitle = push").
Yeni `allow` kuralı paylaşılan ayara eklenmez; makineye özgü izin
`settings.local.json`a.

## Engelleme ve Filtre Sözleşmesi (Claude Code resmî belgesi, 8 Kasım 2026)

- **Engelleme yalnız exit 2** (gerekçe STDERR'de) ya da
  `hookSpecificOutput.permissionDecision: "deny"`. **exit 1 ENGELLEMEZ**;
  hook'un çökmesi (127, 1) commit'i taramasız geçirir. İki commit hook'u
  exit 2 kullanır; `test-hooks.sh` bunu davranışla denetler. (Handler'a
  `"onFailure": "block"` yazmak çökmeyi de engellemeye çevirir, v2.1.295+;
  KULLANILMIYOR — gerekçe yukarıda, `~/dev-starter` yoksa.)
- **Commit konusu çapalı okunur**: `lib/hook-input.sh` → `hook_commit_subject`
  ilk `-m`in ilk satırını çıkarır (heredoc'lu mesaj dahil); biçim ve
  fix/TDD denetimi yalnız ona bakar. Tip listesi `quality-scan.sh` →
  `CC_TYPES`, `rules/commit-conventions.md` tablosuyla aynı (health-check).
- Ayar dosyasındaki hook'lar **subagent'ların araç çağrılarında da** koşar
  (girdi `agent_id`/`agent_type` taşır): subagent commit atmaya kalkarsa
  aynı Gate'e takılır.
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
  davranış testi (önce KIRMIZI gör), `scripts/health-check.sh` → `HOOKS` listesi.
  Commit'i denetleyen yeni script `hooks/git-pre-commit.sh`e de eklenir.
- Hook'un çalıştığını varsayma — `bash scripts/test-hooks.sh` ve
  `bash scripts/health-check.sh` (varlık değil davranış, `knowledge/mistakes.md #52`).
