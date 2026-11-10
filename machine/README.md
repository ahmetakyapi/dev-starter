# machine/ — Yeni Makinede Claude Code Ortamı

Bu klasör, Claude Code'un kişisel ortamını (global kurallar, komutlar, alt
agent'lar, skill'ler) tek bir depodan kurmak için var. Amaç: yeni bir makinede
yarım saatte aynı çalışma düzenine dönmek ve iki makine arasında kuralların
**ayrışmaması**.

| Dosya | Ne |
|-------|----|
| `CLAUDE.md` | Global kurallar; `~/.claude/CLAUDE.md` buna symlink'lenir. **Tek kaynak burası**. Her projede, her oturumda yüklenir: ~200 satır tavanı, yalnız her projede gereken kural |
| `rules/` | Yol kapsamlı global kurallar (`paths:` frontmatter'ı); `~/.claude/rules/dev-starter/` buna symlink'lenir. Eşleşen dosya okununca yüklenir (React/Next, veri/env, görsel dil, tasarım skill'leri, canlı önizleme) |
| `bootstrap.sh` | Kurulum script'i; tekrar çalıştırmak güvenli |
| `skills/` | Depoda taşınan skill'ler (bugün: `motion-design`, `motion-film`) |

> Global `CLAUDE.md`yi düzenlerken `~/.claude/CLAUDE.md`yi değil bu dosyayı
> düzenle (symlink zaten buraya gider) ve depoya commit'le. Diğer makine
> `git pull` ile alır.

---

## `bootstrap.sh` Ne Yapar

Sırayla:

1. **Ön koşullar** — `node`, `npm`, `git`, `claude` var mı; Node major ≥ 20
   (Next 16 en az 20.9 istiyor). Eksikse durur.
2. **`~/dev-starter` bağlantısı** — depo başka bir yere klonlandıysa
   `~/dev-starter` ona symlink'lenir. Komutlar ve rehberler bu yolu mutlak
   olarak kullanır.
3. **Global `CLAUDE.md`** — `~/.claude/CLAUDE.md` → `machine/CLAUDE.md`.
   **Yol kapsamlı kurallar** — `~/.claude/rules/dev-starter/` → `machine/rules/`
   (tek klasör symlink'i; kendi kural dosyaların `~/.claude/rules/` altında
   yanında kalır). **Okuma izni** — `~/.claude/settings.json` →
   `permissions.allow`e `Read(~/dev-starter/**)` eklenir (depo başka yerdeyse
   gerçek yolu da); başka hiçbir izne dokunulmaz, dosya önce yedeklenir.
   Neden: subagent wrapper'ları rol dosyasını proje dışından okur.
4. **Komutlar** — `.claude/commands/*.md` her biri `~/.claude/commands/`a
   symlink. `/kickoff`, `/new-project`, `/theme`, `/check`, `/deploy`... her
   projede bu sürümler çalışır. Yalnız bu depoda anlamlı olanlar
   (`REPO_ONLY_COMMANDS`: `/harvest`, `/evolve`) bağlanmaz. Depodan silinen ya
   da o listeye giren komutun eski bağlantısı kaldırılır (yalnız bu depoya
   giden symlink'ler; kendi komutlarına dokunulmaz).
5. **Subagent'lar** — `.claude/agents/*.md` → `~/.claude/agents/` (`gate`,
   `deploy`, `strategist`, `design-reviewer`, `content-editor`, `frontend`,
   `backend`, `qa`, `researcher`). wrapper'lar ince; rol tanımlarını
   `~/dev-starter/agents/` altından okurlar.
6. **Depodaki skill'ler** — `machine/skills/*` → `~/.claude/skills/`.
7. **taste-skill** — `npx skills add Leonxlnx/taste-skill -g` yalnızca
   kullanılan yedi skill ile (liste aşağıda).
8. **anatomy** — `wheresryan22/anatomy` → `~/.claude/skills/anatomy`
   (açıklayıcı figür skill'i, MIT), `bootstrap.sh` → `ANATOMY_REF` commit'ine
   sabitli. Yerel değişiklik varsa dokunulmaz; ağ hatası kurulumu durdurmaz.
   Kiti bir projeye kurmak: `node ~/dev-starter/scripts/add-figure-kit.mjs <proje>`.
9. **cinecode** — `sarpstar/cinecode` → `~/.claude/skills/cinecode` (kodla
   film stüdyosu, MIT), `bootstrap.sh` → `CINECODE_REF` commit'ine sabitli;
   anatomy ile aynı `pinned_skill` yolu. Node 22+, Python 3, ffmpeg ve Chrome
   ister. Kitin "güncelle" komutu (`git pull`) sabit commit'te çalışmaz:
   yükseltme `CINECODE_REF`'i değiştirmektir.
10. **Eklentiler** — builtin eklentiler etkinleştirilir.

Hedefte farklı bir dosya varsa üzerine yazılmaz: önce
`~/.claude/backups/bootstrap-<tarih>/` altına taşınır. Zaten doğru bağlı olan
atlanır (`=` ile yazılır).

```bash
bash ~/dev-starter/machine/bootstrap.sh --dry-run   # yalnızca ne yapacağını yaz
bash ~/dev-starter/machine/bootstrap.sh             # uygula
```

---

## Yeni Makinede Adım Adım

```bash
# 1. Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Node 24 (depodaki .nvmrc ile aynı major — kilit dosyası uyumu için, mistakes.md #57)
brew install node@24
brew link --overwrite --force node@24   # keg-only paket
node -v   # v24.x

# 3. Araçlar
brew install git gh
npm i -g vercel

# 4. Claude Code
curl -fsSL https://claude.ai/install.sh | bash

# 5. Depo
git clone https://github.com/ahmetakyapi/dev-starter.git ~/Desktop/Projects/dev-starter
cd ~/Desktop/Projects/dev-starter && npm ci

# 6. Kurulum
bash machine/bootstrap.sh --dry-run
bash machine/bootstrap.sh

# 7. Girişler
claude            # oturum içinde: /login
gh auth login
vercel login

# 8. Doğrulama
bash ~/dev-starter/scripts/health-check.sh
```

### Linux ve Bulut Oturumu

Yukarıdaki adımlar macOS içindir. Linux'ta Homebrew yerine dağıtımın paket
yöneticisi: `git`, `jq` (hook'lar JSON'u `jq` ile okur; yoksa `python3`e
düşer, ikisi de yoksa uyarıp kontrolü atlar) ve Node 24 (`nvm install 24`).
Depoyu istediğin yere klonla; `bootstrap.sh` `~/dev-starter` bağlantısını
kendisi kurar. Önce `--dry-run`.

**Bulut oturumunda (claude.ai/code) bootstrap koşmaz**: `~/.claude/CLAUDE.md`,
`~/.claude/rules/dev-starter/`, global komutlar ve subagent'lar orada yoktur.
Sonuçları:

- dev-starter deposunun kendi oturumunda komutlar ve subagent'lar proje
  kapsamından (`.claude/commands`, `.claude/agents`) gelir; hook'lar
  `$CLAUDE_PROJECT_DIR`dan çalışır. Eksik olan yalnız global kurallardır.
- Şablondan doğmuş bir projenin bulut oturumunda `~/dev-starter` yoktur:
  hook'lar koşmaz, SessionStart bunu oturum başında söyler. Gate ve sır
  taraması isteniyorsa oturumun başında depoyu `~/dev-starter`a klonla
  (ortamın kurulum betiğine eklenebilir); bootstrap şart değil, hook'lar
  yalnız o yolu arar.
- Tarayıcı işleri (`/reference`, `/harvest`, `/clone-website`,
  design-reviewer) bulut oturumunda kurulu Playwright'la çalışır
  (`require('playwright')`); yerelde `npm i -D playwright && npx playwright
  install chromium` ya da Playwright MCP.

Projeler iCloud ile eşitlenen Masaüstü'ndeyse eşitleme ` 2.ts` kopyaları
bırakıp derlemeyi kırabilir (`knowledge/mistakes.md` #91). Yeni makinede
Sistem Ayarları → Apple Hesabı → iCloud → iCloud Drive → "Masaüstü ve Belgeler
Klasörleri"ni kapatmak ya da projeleri eşitlenmeyen bir klasörde tutmak en
temizi.

---

## Neyin Taşınmadığı ve Neden

| Taşınmayan | Neden | Yeni makinede |
|------------|-------|---------------|
| `~/.claude/settings.json` izin listesi | Makineye özgü mutlak yollar taşıyor ve depo herkese açık | İlk oturumlarda onaylandıkça yeniden birikir. Tek istisna: bootstrap `Read(~/dev-starter/**)` ekler (2026-11-08) |
| claude.ai'den eşitlenen eklenti ve skill'ler | Hesaba bağlı; aynı hesapla `/login` olunca kendiliğinden gelir | Bir şey yapmaya gerek yok |
| MCP bağlantılarının yetkileri (Gmail, Drive, GitHub...) | OAuth belirteçleri makineye ve hesaba özgü | İlk kullanımda `/mcp` ya da claude.ai bağlayıcı ayarları |
| `~/.claude/projects/*/memory` | Oturum hafızası makineye özgü, kişisel içerik taşıyabilir | Kurallar zaten `CLAUDE.md`lerde; hafıza yeniden birikir |
| Projelerin `.env.local` dosyaları | Sır | Vercel'den `vercel env pull` ya da elle |
| `gh` / `vercel` / npm oturumları | Kimlik bilgisi | Adım 7 |

Depoya hiçbir sır, kişisel yol ya da e-posta yazılmaz: `.claude/settings.json`
yalnızca hook'ları taşır, makineye özgü izinler gitignore'daki
`.claude/settings.local.json`a gider.

---

## Skill ve Eklenti Listesi

**taste-skill'den kurulanlar** (`bootstrap.sh` → `TASTE_SKILLS`):

| Skill | Ne zaman |
|-------|----------|
| `design-taste-frontend` | Tanıtım sayfası, portfolyo ya da pazarlama sayfası içeren her frontend işinde, kod yazmadan önce |
| `redesign-existing-projects` | Var olan arayüzü yükseltme ("Redesign — Preserve") |
| `high-end-visual-design` | Tema dosyası olmayan projede ajans düzeyi görsel dil |
| `minimalist-ui` | Sade, editoryal arayüz |
| `brandkit` | Marka rehberi, logo sistemi |
| `imagegen-frontend-web` · `imagegen-frontend-mobile` | Görsel referans üretimi |

Paketin geri kalanı (`gpt-taste` GSAP dayatıyordu; `design-taste-frontend-v1`
eski sürüm; `stitch-design-taste`, `image-to-code`, `industrial-brutalist-ui`,
`full-output-enforcement` hiç çağrılmadı) 3 Ekim 2026'da kaldırıldı. impeccable
eklentisi de aynı gün kaldırıldı; yerini rehberler ve `design-reviewer` alt
agent'ı aldı.

**Depodan:** `motion-design` ve `motion-film` (`machine/skills/`). **Dış depodan:**
`anatomy` (wheresryan22/anatomy, MIT; izometrik açıklayıcı figür, WebGL, 3D —
ne zaman kullanılacağı `motion-film/reference/aciklayici-figur.md`de; projeye
kurulumu `scripts/add-figure-kit.mjs`, şablon uyumu `npm run verify:anatomy`) ve
`cinecode` (sarpstar/cinecode, MIT; MP4 teslim edilen kısa film, reklam,
müzik videosu; `motion-film` ile iş bölümü o skill'in § 1b'sinde). Proje düzeyinde ayrıca
`.claude/skills/clone-website` (yalnızca dev-starter içinde).

**Builtin eklenti:** `cc-plugin-you-should-know@builtin`.

**Hesaptan gelenler** (bootstrap kurmaz, `/login` getirir): claude.ai'de etkin
olan eklenti ve skill'ler (ör. design, engineering, data eklentileri,
`design-dna`, `scroll-craft`).

---

## Paralel Oturumlar (isteğe bağlı: cmux)

Mac'te aynı anda birden fazla Claude Code oturumu açılıyorsa önerilir;
tek oturumla ya da yalnız bulut oturumlarıyla çalışılıyorsa gereksiz.
Global CLAUDE.md bu durumu fark edince bir kez önerir.

```bash
brew tap manaflow-ai/cmux
brew install --cask cmux
```

- **Ne kazandırır:** agent bekleyince panel mavi halka alır, kenar çubuğunda
  okunmamış rozeti çıkar; her çalışma alanında git dalı, port ve son
  bildirim görünür. Uygulama içi tarayıcıyı agent kullanabilir (dev
  sunucusuna bakmak, tıklamak) — `design-reviewer` ve `/reference`
  işlerinde headless Chrome'a ek bir yol; o yol kalkmaz.
- **Dikkat:** `cmux hooks setup` Claude Code'a kendi hook'larını ekler.
  Çalıştırdıktan sonra `~/.claude/settings.json`a bak ve bir projede
  commit deneyip gate-guard ile quality-scan'ın hâlâ tetiklendiğini gör.
- Lisans: masaüstü uygulaması GPL-3.0, ücretsiz (Manaflow). Yalnız macOS.
- Alternatif: **Herdr** (`brew install herdr`) — her terminalin içinde
  çalışır, işler arka planda sürer, SSH ile telefondan bağlanılır; sunucuda
  çalışma ağır basıyorsa o. İkisi birden kurulmaz.

## Değişiklik Yaparken

- Yeni bir global komut: `.claude/commands/<ad>.md` ekle, `bootstrap.sh`yi
  yeniden çalıştır. Komut başka projeden çağrılacağı için içindeki yollar
  `~/dev-starter/...` biçiminde mutlak olmalı. Yalnız bu depoda çalışacaksa
  `bootstrap.sh` → `REPO_ONLY_COMMANDS`a ekle.
- Bir projede terminalden atılan commit'ler de Gate ve sır taramasından
  geçsin: proje kökünde `bash ~/dev-starter/hooks/git-pre-commit.sh --install`
  (klon başına bir kez; `/new-project` yeni projede kendisi yapar).
- Yeni bir subagent: `.claude/agents/<ad>.md` (ince wrapper) +
  `agents/<ad>-agent.md` (rol tanımı).
- Yeni bir skill'i depoda taşımak: `machine/skills/<ad>/` altına koy.
- Yeni global kural: her projede her işte gerekiyorsa `CLAUDE.md`ye; yalnız
  belirli dosyalara aitse `machine/rules/<konu>.md` (`paths:` YAML listesi).
  Klasör symlink'li olduğu için bootstrap'ı yeniden koşmaya gerek yok.
- taste-skill listesine ekleme: `TASTE_SKILLS` değişkeni ve bu tablo birlikte.
