# machine/ — Yeni Makinede Claude Code Ortamı

Bu klasör, Claude Code'un kişisel ortamını (global kurallar, komutlar, alt
agent'lar, skill'ler) tek bir depodan kurmak için var. Amaç: yeni bir makinede
yarım saatte aynı çalışma düzenine dönmek ve iki makine arasında kuralların
**ayrışmaması**.

| Dosya | Ne |
|-------|----|
| `CLAUDE.md` | Global kurallar; `~/.claude/CLAUDE.md` buna symlink'lenir. **Tek kaynak burası** |
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
4. **Komutlar** — `.claude/commands/*.md` her biri `~/.claude/commands/`a
   symlink. `/kickoff`, `/new-project`, `/theme`, `/check`, `/deploy`... her
   projede bu sürümler çalışır.
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
9. **Eklentiler** — builtin eklentiler etkinleştirilir.

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

Projeler iCloud ile eşitlenen Masaüstü'ndeyse eşitleme ` 2.ts` kopyaları
bırakıp derlemeyi kırabilir (`knowledge/mistakes.md` #91). Yeni makinede
Sistem Ayarları → Apple Hesabı → iCloud → iCloud Drive → "Masaüstü ve Belgeler
Klasörleri"ni kapatmak ya da projeleri eşitlenmeyen bir klasörde tutmak en
temizi.

---

## Neyin Taşınmadığı ve Neden

| Taşınmayan | Neden | Yeni makinede |
|------------|-------|---------------|
| `~/.claude/settings.json` izin listesi | Makineye özgü mutlak yollar taşıyor ve depo herkese açık | İlk oturumlarda onaylandıkça yeniden birikir |
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
kurulumu `scripts/add-figure-kit.mjs`, şablon uyumu `npm run verify:anatomy`). Proje düzeyinde ayrıca
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
  `~/dev-starter/...` biçiminde mutlak olmalı.
- Yeni bir subagent: `.claude/agents/<ad>.md` (ince wrapper) +
  `agents/<ad>-agent.md` (rol tanımı).
- Yeni bir skill'i depoda taşımak: `machine/skills/<ad>/` altına koy.
- taste-skill listesine ekleme: `TASTE_SKILLS` değişkeni ve bu tablo birlikte.
