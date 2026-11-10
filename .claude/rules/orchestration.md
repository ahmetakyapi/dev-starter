---
paths:
  - ".claude/agents/**"
  - ".claude/commands/**"
  - ".claude/skills/**"
  - "agents/**"
  - "machine/**"
  - "rules/**"
  - "phases/**"
---

# Orkestrasyon: Subagent'lar, Komutlar, Skill'ler

> 8 Kasım 2026'ya dek kök `CLAUDE.md`nin "Kayıtlı Subagent'lar", "Context
> Curation" ve komut tablosunun "Dosya" sütunuydu; agent/komut/kural
> dosyasına dokunulunca yüklensin diye buraya taşındı (`knowledge/decisions.md`
> → "Bağlam Dosyaları"). Komutların kısa listesi kök `CLAUDE.md`de kaldı.

## Kayıtlı Subagent'lar

Karar rolleri (BA, UI, AG) ana oturumun **üstlendiği rol tanımlarıdır** —
bağlamın tamamını görmeleri gerekir. Uygulayıcı ve denetleyici dokuz rol,
izolasyondan gerçekten fayda gördüğü için kayıtlı subagent'tır ve bootstrap
ile `~/.claude/agents/`a symlink'lenir (her projede kullanılabilir). Dağıtım
kuralları: `agents/AGENT_PROTOCOL.md → Orkestrasyon` (Görev Tanımı, efor
ölçekleme, referansla aktarım):

| Subagent | wrapper | Rol tanımı |
|----------|-------------|------------|
| `strategist` | `.claude/agents/strategist.md` | `agents/strategist-agent.md` |
| `gate` | `.claude/agents/gate.md` | `agents/gate-agent.md` |
| `deploy` | `.claude/agents/deploy.md` | `agents/deploy-agent.md` |
| `design-reviewer` | `.claude/agents/design-reviewer.md` | `agents/design-reviewer-agent.md` |
| `content-editor` | `.claude/agents/content-editor.md` | `agents/content-editor-agent.md` |
| `frontend` | `.claude/agents/frontend.md` | `agents/frontend-agent.md` |
| `backend` | `.claude/agents/backend.md` | `agents/backend-agent.md` |
| `qa` | `.claude/agents/qa.md` | `agents/qa-agent.md` |
| `researcher` | `.claude/agents/researcher.md` | `agents/researcher-agent.md` |

wrapper'lar bilerek incedir; rol tanımını kopyalamazlar ve onu
`~/dev-starter/agents/...` mutlak yoluyla okurlar. İki kaynak olursa biri
sessizce bayatlar — bu denetimin en sık bulduğu hata sınıfı buydu.

**Okuma izni (8 Kasım 2026):** `~/dev-starter` başka projeden çağrılan
subagent'ın çalışma dizini DIŞINDADIR; izin kuralı yoksa ilk `Read` izin
istemine/redde düşer ve bir tur yanar. `machine/bootstrap.sh` kullanıcı
ayarlarına (`~/.claude/settings.json` → `permissions.allow`)
`Read(~/dev-starter/**)` ekler (depo başka yerdeyse gerçek yolu da).
Rol içeriğini wrapper'a DERLEMEK seçilmedi: rol dosyaları da `rules/`,
`guides/` ve `knowledge/`a okuma listesi veriyor, izin zaten gerekiyor;
derleme ikinci kaynak + üretim adımı + tutarlılık denetimi getirirdi.
Gerekçe `knowledge/decisions.md` → "Bağlam Dosyaları".

### wrapper Frontmatter Sözleşmesi

- Alanlar camelCase: `name`, `description`, `tools`, `disallowedTools`,
  `model`, `color` (+ gerektiğinde `permissionMode`, `skills`, `memory`,
  `isolation`, `effort`, `maxTurns`, `background`).
- `description` NE ZAMAN kullanılacağını söyler; otomatik devir onunla olur
  ("PROAKTİF kullan: …"). Dokuz açıklamanın toplamı ~15k token'ın çok altında
  kalmalı — açıklama rol tanımının özeti değil, tetik listesidir.
- Kod yazmayan rol (`gate`, `deploy`, `design-reviewer`, `researcher`)
  `disallowedTools` ile Edit/NotebookEdit'i açıkça kapatır (`gate` ve
  `deploy` Write'ı da); rapor yazan Write'ı tutar. `strategist` karar
  belgesini düzelttiği için Edit'i tutar, yalnız NotebookEdit kapalı.
  health-check bu eşlemeyi denetler.
- **Açık `tools` listesi MCP araçlarını ve `Skill`i dışarıda bırakır**
  (resmî belge, 10 Kasım 2026). Sonuçları: (1) rol dosyası bir MCP aracını
  "varsa kullan" diyorsa wrapper onu adıyla saymalıdır (`design-reviewer` →
  `mcp__playwright__*`); (2) subagent slash komutu/skill ÇAĞIRAMAZ — rol
  dosyasında "Kullandığı Skills" tablosu olmaz, yerine doğrudan çalışan
  komutlar yazılır (`bash ~/dev-starter/scripts/...`); (3) `disallowedTools`a
  `Bash(git push *)` gibi belirteçli giriş yazılmaz, aracın TAMAMINI kaldırır.
- Gövde üç şeyi söyler ve rol dosyasını kopyalamaz: ilk turda okunacaklar,
  3-5 değiştirilemez kural, dönüş biçimi (yol + üç satır özet; subagent
  kullanıcıya soramaz, `SORULAR` bloğu döndürür).
- `model: inherit`: ana oturumun modeli; ucuz modele düşürmek Gate ve
  uygulayıcıda kalite riski, karar sahibinin.
- `isolation: worktree` frontmatter'a KONMAZ: paralel dalgada izolasyonu
  orkestratör çağrı başına seçer (`AGENT_PROTOCOL.md` → Paralel Çalışma).
- Gövdenin ilk talimatı: rol dosyasını ve okuma listesini TEK turda, paralel
  `Read` ile aç.

## Context Curation

Her agent sadece ihtiyacı olan bilgiyi alır (`rules/context-curation.md`;
token bütçeli tam tablo `agents/AGENT_PROTOCOL.md` → Context Curation):

| Agent | Seviye | Ne Okur |
|-------|--------|---------|
| BA | FULL | Tüm dokümanlar |
| UI | FOCUSED | Tema + ekranlar |
| FE | TASK-SPECIFIC | Story + ilgili dosyalar |
| BE | TASK-SPECIFIC | Story + schema + API |
| QA | TASK-SPECIFIC | Story + tests/ + bugfix-protocol |
| AG | FOCUSED | Story + agentic-ui kuralları + tool şemaları |
| RS | TASK-SPECIFIC | Soru + tech-radar + decisions |
| ST | FULL (ürün) | Ürün belgeleri + radar + canlı durum |
| DR | FOCUSED | Tema belgesi + ekran görüntüleri |
| CE | TASK-SPECIFIC | İncelenen metin + yazım kuralları |
| GATE | REVIEW | Story + diff + rules (mistakes yalnız indeks) |
| DP | MINIMAL | Config + env |

Subagent çıktısı dosyaya yazılır, ana oturuma yol + üç satır özet döner
(`rules/context-curation.md → Referansla Aktar`).

## Komutlar ve Skill'ler

- **Tek kaynak: bu repo.** `machine/bootstrap.sh` komutları
  `~/.claude/commands/`a symlink'ler; global kopya yoktur, **her projede bu
  sürümler çalışır**. Bu yüzden komutların içindeki yollar `~/dev-starter/...`
  biçiminde mutlaktır — göreli yol başka bir projeden çağrılınca bulunamaz.
- **Yalnız bu depoda anlamlı komutlar** (`/harvest`, `/evolve`) global
  BAĞLANMAZ: `machine/bootstrap.sh` → `REPO_ONLY_COMMANDS`. Proje kapsamında
  (`.claude/commands/`) zaten yüklüdürler ve yolları depo köküne göre
  olabilir; açıklamaları "Yalnız ~/dev-starter deposunda" der. Bootstrap,
  depodan silinen ya da bu listeye giren komutun eski bağlantısını da
  temizler (yalnız bu depoya giden symlink'ler).
- Komut frontmatter'ı: `description` (ne yapar + ne zaman; listede 1.536
  karakterde kesilir, önemli olan başta), argüman alıyorsa `argument-hint`.
  Komut dosyasında `name` ve `paths` desteklenmez. Her komut bir rapor
  biçimiyle ya da "Çıktı:" satırıyla biter.
- Komut dosyası `.claude/commands/<ad>.md`; listesi `scripts/health-check.sh`
  → `COMMANDS`, kök `CLAUDE.md` tablosu ve README sayacıyla aynı evren.
- Geri alınması zor yan etkili komut (`/deploy`, `/release`) frontmatter'da
  `disable-model-invocation: true` taşır: model kendi kararıyla çağıramaz,
  yalnız kullanıcı `/ad` yazınca koşar. `/new-project` BİLEREK açık:
  `/kickoff` kullanıcı onayından sonra akışı ona devreder (Skill aracıyla);
  kapatılırsa o devir kırılır.
- **Komut → skill** geçişi toplu yapılmaz; ölçüt ve aday sırası
  `knowledge/decisions.md` → "Bağlam Dosyaları" → "Komut mu Skill mi".
  Yeni bir çok adımlı prosedür (yan dosya, şablon, betik gerektiren) skill
  olarak `machine/skills/<ad>/SKILL.md` (< 500 satır, ayrıntı yan dosyada)
  yazılır; bootstrap onu `~/.claude/skills/`e bağlar.

## Değişiklik Yaparken

- Yeni komut: `.claude/commands/` altında `.md` — yollar `~/dev-starter/...`
  mutlak; `health-check.sh` → `COMMANDS`, kök `CLAUDE.md` tablosu,
  `AGENT_PROTOCOL.md` → Skills tablosu, `npm run readme:assets`,
  `bash machine/bootstrap.sh`. Yalnız bu depoya özgüyse ayrıca
  `REPO_ONLY_COMMANDS`.
- Yeni subagent: `.claude/agents/[ad].md` (ince) + `agents/[ad]-agent.md`;
  `health-check.sh` → `WRAPPERS`, `AGENT_PROTOCOL.md` listesi, bu tablo.
- Yeni kural: `rules/` altında dosya, `AGENT_PROTOCOL.md`'ye referans.
- Yeni faz: `phases/` altında dosya.
- Global kural değişince: `machine/CLAUDE.md` (symlink hedefi) ya da yol
  kapsamlıysa `machine/rules/`.
