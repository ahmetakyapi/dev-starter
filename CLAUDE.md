# dev-starter — Ekosistem CLAUDE.md

Bu, Ahmet'in kişisel geliştirme ekosistemi. Yeni proje başlatmak, tema uygulamak veya deploy etmek için buradan başla.

**Versiyon**: 3.0.0 (+ yayınlanmamış: orkestrasyon) — Next 16 · React 19.2 · Tailwind v4 · `motion/react` · Drizzle + Neon · next-auth v5 · gerçek subagent orkestrasyonu (9 kayıtlı subagent, Görev Tanımı, dalga planı)

Projeye başlarken sırayla izlenecek rehber: `guides/` (00 kimlik → 01 ilk gün → 08 yayına çıkış).
Global kuralların tek kaynağı: `machine/CLAUDE.md` (`~/.claude/CLAUDE.md` ona symlink);
yol kapsamlı global kurallar `machine/rules/` (→ `~/.claude/rules/dev-starter/`).

**Bu dosyanın sözleşmesi** (8 Kasım 2026, Claude Code resmî önerisi): her
oturumda yüklenir, ~200 satırın altında kalır (`scripts/health-check.sh`
denetler). Burada yalnız her oturumda gereken harita, kural ve adres durur.
Belirli dizinlere ait ayrıntı `.claude/rules/*.md` içinde `paths:`
frontmatter'ıyla, o dosyalar okununca yüklenir; uzun harita ve örnekler
`docs/ECOSYSTEM.md`de (otomatik yüklenmez). Taşınan bölümlerin listesi ve
gerekçe: `knowledge/decisions.md` → "Bağlam Dosyaları".

| Ne arıyorsan | Nerede |
|---|---|
| Ayrıntılı dizin ağacı, yaşam döngüsü fazları, komut örnekleri | `docs/ECOSYSTEM.md` |
| Hook tablosu, engelleme sözleşmesi (exit 2, `if`, matcher) | `.claude/rules/hooks.md` (`hooks/`, ayarlar) |
| health-check, verify:*, anatomy/cinecode pin'i, slop, canlı denetim | `.claude/rules/verification.md` (`scripts/`, bootstrap) |
| Paket kullanımı (`@ahmetakyapi/theme`, `/ui`) | `.claude/rules/packages.md` (`packages/`, `snippets/`, `templates/`) |
| Subagent tablosu, wrapper sözleşmesi, context curation, komut ↔ skill | `.claude/rules/orchestration.md` (`.claude/`, `agents/`, `machine/`) |
| Kararlar ve geçmişi ("Değişti (tarih)") | `knowledge/decisions.md` |

---

## Ekosistem Haritası (kısa)

```text
guides/      12 rehber, sırayla okunur (00 kimlik → 08 yayına çıkış → 11 VPS/e-posta/push)
machine/     global CLAUDE.md + rules/ + bootstrap.sh + depoda taşınan skill'ler (motion-design, motion-film)
packages/    @ahmet/theme (Tailwind v4 theme.css + tokens.ts) · @ahmet/ui (snippets/ui'dan üretilen kit)
knowledge/   themes/ · decisions · mistakes (indeksli) · patterns · tech-radar · design-references · references · live-projects-audit
agents/      12 rol tanımı + AGENT_PROTOCOL.md (haberleşme, orkestrasyon, Görev Tanımı)
rules/       10 kural dosyası (aşağıdaki tablo) · phases/ planning, development, e2e-polish, release-maintenance
hooks/       gate-guard · quality-scan · routemap-sync · session-brief (+ lib/)
scripts/     health-check · test-hooks · slop-scan · audit-project · verify-* · build-* · add-ui · add-figure-kit
.claude/     settings.json (hook'lar) · rules/ · commands/ (20) · agents/ (9 wrapper) · skills/clone-website
templates/   nextjs-fullstack · landing · agentic-chat · docs/ (KICKOFF, PRODUCT, ROUTEMAP, DESIGN, ARCHITECTURE, SCREENS)
storybook/   görsel katalog (Storybook 10, kendi kilidi) · snippets/ hazır parçalar + ui/ kütüphanesi + fonts/ + live-preview/
```

Tam ağaç (dosya başına açıklama, sayılar): `docs/ECOSYSTEM.md`.

## Yaşam Döngüsü ve ROUTEMAP

```text
KICKOFF  →  PLANNING (P1→P6)  →  DEVELOPMENT  →  E2E & POLISH (E0→E5)  →  RELEASE  →  MAINTENANCE
```

Faz playbook'ları `phases/` (planning · development · e2e-polish ·
release-maintenance); tek story'nin iç akışı `rules/dev-cycle.md`:
Plan → Validate → Develop → Self-Check → Gate → Commit → Review → Compound.
Kickoff `/kickoff` (`agents/strategist-agent.md`), çıktısı `docs/KICKOFF.md`
+ taslak `docs/PRODUCT.md`; onaylanınca `/new-project`.

Her proje `docs/ROUTEMAP.md` ile durumunu takip eder (`rules/routemap-discipline.md`):

- **Tek kaynak**: Projenin durumu ROUTEMAP'te, başka yerde değil
- **Session resume**: Her yeni session'da ROUTEMAP okunur, kaldığı yerden devam edilir
- **Template**: `templates/docs/ROUTEMAP.template.md`

## Enforcement ve Denetim

Kurallar bash hook'larıyla fiziksel olarak uygulanır (`.claude/settings.json`,
şablonlar `~/dev-starter/hooks/`tan mutlak yolla aynısını çağırır):
`gate-guard` (Gate PASSED değilse commit bloklar), `quality-scan` (sır,
`.env`, debug, kilit), `routemap-sync` (DONE ⇒ Gate PASSED), `session-brief`
(oturum başında ROUTEMAP özeti). Engelleme yalnız exit 2; ayrıntı ve tablo
`.claude/rules/hooks.md`.

```bash
bash scripts/health-check.sh     # ekosistem bütünlüğü (15 kategori) — her değişiklikten sonra TEMİZ
bash scripts/test-hooks.sh       # hook davranış testleri
bash scripts/slop-scan.sh <yol>  # AI slop taraması · npm run verify:agentic / verify:anatomy (ağ, opt-in)
bash scripts/audit-project.sh ~/Desktop/Projects/<proje>   # canlı proje denetimi
```

**Açık kararlar** (palet istisnaları, referans çelişkisi): `knowledge/decisions.md` → "Açık Kararlar".

---

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `/kickoff [fikir]` | Fikirden plana: pazar, yön, palet, teknoloji, MVP (strategist) |
| `/roadmap` | Var olan projeye sıradaki işler (strategist) |
| `/new-project [ad]` | Şablon + yer tutucular + palet/tema + belgeler + hook doğrulama |
| `/plan [adım]` | Planning fazını yürüt (P1→P6): belgeler + story'ler |
| `/story [id]` | Story'yi uçtan uca işle: dağıt → Gate → commit → ROUTEMAP |
| `/gate [story]` | 6+1 adımlı denetim; sonuç ROUTEMAP Gate kolonuna — commit kontrolü |
| `/fix [tarif]` | Bugfix protokolü: triage → failing test → fix → kayıt |
| `/research [konu]` | Benzer çözümlerin araştırması (researcher) → docs/research/ |
| `/status` | Kaldığın yer + sıradaki en değerli 3 iş |
| `/retro [kapsam]` | Dersleri onayla bilgi tabanına işle |
| `/evolve [odak]` | Ekosistemin kendi gelişim turu: sağlık + tazelik + dış tarama |
| `/theme [palet\|proje]` | Palet ya da referans tema uygula (Tailwind v4) |
| `/snippet [tip]` | Hazır parçayı projeye uyarla |
| `/check` | Sağlık: build, tip, lint, test, tech stack uyumu, token, güvenlik |
| `/reference <bölüm> [görsel\|url]` | Gerçek sitenin bölümünü referans al, yapısını kendi token'larınla kur (galeri: `knowledge/design-references.md`) |
| `/harvest <url>` | Referans turu: bütün siteyi tara, ekosistemde olmayan desenleri kütüphaneye + Storybook'a + bilgi tabanına işle (yalnız dev-starter) |
| `/review-ui` | UI incelemesi: token, kimlik, iki tema, düzen, a11y, hareket |
| `/deploy` | Vercel deployment checklist |
| `/release [seviye]` | Versiyon artırma + changelog |
| `/agentic [konu]` | Agentic UI karar ağacı — tool, kontrol, state, dsl, test, kurulum, denetle |
| `/clone-website <url>` | Ölçümlü site klonu: betikli yakalama, stil dökümü, varlık indirme, piksel/tipografi farkı geçene kadar düzeltme (Playwright; skill, yalnız bu depoda) |

Dosyalar `.claude/commands/<ad>.md` (`/clone-website`: `.claude/skills/clone-website/SKILL.md`).
**Tek kaynak bu repo**: bootstrap her komutu `~/.claude/commands/`a symlink'ler,
her projede bu sürümler çalışır; bu yüzden komut içindeki yollar `~/dev-starter/...`
biçiminde mutlaktır. Komut ↔ skill kararı ve wrapper sözleşmesi: `.claude/rules/orchestration.md`.

**Kayıtlı subagent'lar** (9, `.claude/agents/` ince wrapper → `agents/<ad>-agent.md`):
`strategist`, `gate`, `deploy`, `design-reviewer`, `content-editor`, `frontend`,
`backend`, `qa`, `researcher`. Karar rolleri (BA, UI, AG) ana oturumun üstlendiği
rol tanımlarıdır. Dağıtım: `agents/AGENT_PROTOCOL.md → Orkestrasyon`; subagent
çıktısı dosyaya yazılır, ana oturuma yol + üç satır özet döner
(`rules/context-curation.md → Referansla Aktar`).

## Kurallar

Tüm agent'lar `rules/` altındaki kurallara uyar:

| Kural | Özet |
|-------|------|
| `immutable-architecture.md` | Server-first, performance, DB migration, state, auth, no shortcuts |
| `design-tokens.md` | Hardcoded renk/boyut YASAK, semantic token zorunlu, degrade kuralları (token + fallback), AI-slop yasakları |
| `commit-conventions.md` | `feat/fix/refactor(scope): description` formatı |
| `bugfix-protocol.md` | TDD: failing test → fix → green → regression → document |
| `dev-cycle.md` | Plan → Dev → Gate → Commit → Review pipeline |
| `routemap-discipline.md` | ROUTEMAP tek kaynak, session resume, durum geçişleri |
| `context-curation.md` | Agent bazlı filtered context, token bütçesi, referansla aktarım |
| `agentic-ui.md` | LLM tool çağırıyorsa: guardrail sunucuda, model yetkilendirmez, sandbox, token bütçesi, tool testi |
| `live-preview.md` | İçerik/metin/görsel/yazı tipi düzenleyen her ekranın yanında sitenin kendisi: masaüstü + telefon, açık/koyu, yazdıkça güncellenir, font anında; taslak canlıya sızmaz (kit: `snippets/live-preview/`) |
| `self-improvement.md` | Öğrenme kanalları, onay ilkesi (agent taslak önerir, onaysız yazamaz), terfi merdiveni, boy tavanları |

---

## Bu Dosyaları Güncelleme

- **Yeni hata keşfedilince**: `knowledge/mistakes.md` + o hatayı bir daha yaşatmayacak adım ilgili `guides/` dosyasına
- **Sayı değişince** (rehber, bileşen, agent, komut ya da mistakes kaydı eklenince/silinince): `npm run readme:assets` —
  README istatistik görselleri bu sayıları basar; unutulursa CI `verify:readme`de kırılır (health-check de yakalar)
- **Yeni proje tamamlanınca**: `knowledge/themes/[proje].md` doldur — şablon:
  `templates/docs/DESIGN.template.md` (YAML frontmatter token şeması + 9 bölümlük görsel hafıza);
  retro ritüeli `/retro` (Knowledge Capture, `phases/release-maintenance.md § 4.5`)
- **Yeni desen bulununca**: `knowledge/patterns.md`
- **Bir siteden ya da depodan referans alınınca**: `knowledge/references.md` (bağlantı, tarih, ne alındı, nerede yaşıyor)
- **Karar değişince**: `knowledge/decisions.md` — eskisini silme, "Değişti (tarih)" alt başlığı
- **Paket versiyonu güncellenince**: `packages/@ahmet/*/package.json` + `CHANGELOG.md`
- **Yeni kural eklenince**: `rules/` altında dosya, `AGENT_PROTOCOL.md`'ye referans
- **Yeni faz eklenince**: `phases/` altında dosya
- **Yeni hook eklenince**: `hooks/` altında script, **`.claude/settings.json`**'a kayıt, `scripts/test-hooks.sh`'e davranış testi
- **Yeni komut eklenince**: `.claude/commands/` altında `.md` — yollar `~/dev-starter/...` mutlak; `bash machine/bootstrap.sh`
- **Yeni subagent eklenince**: `.claude/agents/[ad].md` (ince) + `agents/[ad]-agent.md`
- **Yeni snippet eklenince**: `snippets/` altında, `guides/05-components.md` ya da `10-component-library.md` kataloğuna
- **İki Next şablonuna ortak dosya eklenince**: `scripts/health-check.sh` → `SHARED_TEMPLATE_FILES` (bayt bayt aynılık `cmp` ile denetlenir; biri düzelip öteki bayatlamasın)
- **Global kural değişince**: `machine/CLAUDE.md` (symlink hedefi); yalnız belirli dosyalara aitse `machine/rules/` (`paths:` frontmatter'ı)
- **Bu dosyaya bölüm eklenecekse**: önce "her oturumda gerekli mi?" — değilse `.claude/rules/<konu>.md` (`paths:`) ya da `docs/ECOSYSTEM.md`
- **Katkı rehberi**: `CONTRIBUTING.md`

---

## Global Kurallar

Bakınız: `machine/CLAUDE.md` (= `~/.claude/CLAUDE.md`) ve `machine/rules/` (= `~/.claude/rules/dev-starter/`)
