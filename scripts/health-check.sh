#!/usr/bin/env bash
# Ecosystem Health Check — dev-starter butunluk kontrolu
#
# Kullanim:
#   bash scripts/health-check.sh
#
# Kontrol eder:
#   1. Agent dosyalari ve cross-reference'lar
#   2. Rule dosyalari eksiklik kontrolu
#   3. Snippet dosyalari
#   4. Template butunlugu
#   5. Hook dosyalari
#   6. Knowledge base
#   7. Skill komutlari
#   8. Paket versiyon tutarliligi
#   9. Design token ihlalleri (UI paketi)
#  10. CI/CD workflow
#  11. Temel dosyalar
#  12. Tasarim denetimi (degrade, palet disi renk)
#  13. Tech stack uyumu (Tailwind v4, ESLint flat, Next 16 proxy, motion)
#  14. Orkestrasyon butunlugu (sarmalayici <-> rol dosyasi, komut <-> tablo)
#  15. Bilgi tabani butunlugu (mistakes numaralari, satir tavanlari)

set -euo pipefail

# Nereden cagrilirsa cagrilsin depo kokunde calis
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

PASS=0
WARN=0
FAIL=0

pass()  { PASS=$((PASS + 1)); echo "  ✅ $1"; }
warn()  { WARN=$((WARN + 1)); echo "  ⚠️  $1"; }
fail()  { FAIL=$((FAIL + 1)); echo "  ❌ $1"; }
header() { echo ""; echo "━━━ $1 ━━━"; }

# ─── 1. Agent Files ──────────────────────────────────────────────────────────
header "Agent Dosyalari"

AGENTS=("AGENT_PROTOCOL" "business-analyst-agent" "uiux-agent" "frontend-agent" "backend-agent" "agentic-ui-agent" "qa-agent" "gate-agent" "deploy-agent" "strategist-agent" "researcher-agent" "design-reviewer-agent" "content-editor-agent")
for agent in "${AGENTS[@]}"; do
  if [ -f "agents/${agent}.md" ]; then
    pass "$agent.md mevcut"
  else
    fail "$agent.md EKSIK"
  fi
done

# ─── 2. Rule Files ───────────────────────────────────────────────────────────
header "Kural Dosyalari"

RULES=("immutable-architecture" "design-tokens" "commit-conventions" "bugfix-protocol" "dev-cycle" "routemap-discipline" "context-curation" "agentic-ui" "self-improvement")
for rule in "${RULES[@]}"; do
  if [ -f "rules/${rule}.md" ]; then
    pass "$rule.md mevcut"
  else
    fail "$rule.md EKSIK"
  fi
done

# ─── 3. Phase Files ──────────────────────────────────────────────────────────
header "Faz Dosyalari"

PHASES=("planning" "development" "e2e-polish" "release-maintenance")
for phase in "${PHASES[@]}"; do
  if [ -f "phases/${phase}.md" ]; then
    pass "$phase.md mevcut"
  else
    fail "$phase.md EKSIK"
  fi
done

# ─── 4. Hook Files ───────────────────────────────────────────────────────────
header "Hook Dosyalari"

HOOKS=("gate-guard" "quality-scan" "routemap-sync" "session-brief")
for lib in "lib/hook-input" "lib/routemap"; do
  if [ -f "hooks/${lib}.sh" ]; then
    pass "hooks/$lib.sh mevcut"
  else
    fail "hooks/$lib.sh EKSIK — hook'lar ortak ayristiriciyi kaybetti"
  fi
done
for hook in "${HOOKS[@]}"; do
  if [ -f "hooks/${hook}.sh" ]; then
    if [ -x "hooks/${hook}.sh" ]; then
      pass "$hook.sh mevcut ve calistirilabilir"
    else
      warn "$hook.sh mevcut ama calistirilabilir degil (chmod +x gerekli)"
    fi
  else
    fail "$hook.sh EKSIK"
  fi
done

# DOSYA VARLIGI YETMEZ — DAVRANISI TEST ET.
# Bu kategori 5 ay boyunca "✅ mevcut" dedi; hook'lar ise girdiyi yanlis yerden
# (TOOL_INPUT env var) okudugu icin hicbir zaman calismadi. Varlik testi bu
# sinif hatayi YAPISAL olarak goremez. Bkz. knowledge/mistakes.md #52
if [ -f "scripts/test-hooks.sh" ]; then
  if bash scripts/test-hooks.sh >/dev/null 2>&1; then
    pass "Hook davranis testi geciyor (scripts/test-hooks.sh)"
  else
    fail "Hook davranis testi BASARISIZ — 'bash scripts/test-hooks.sh' calistir"
  fi
else
  fail "scripts/test-hooks.sh EKSIK — hook'lar dogrulanmiyor"
fi

# Claude Code hook entegrasyonu — paylasilan settings.json tercih edilir,
# settings.local.json makineye ozgudur ve versiyonlanmaz
if grep -qs "gate-guard" ".claude/settings.json"; then
  pass "Hook'lar Claude Code'a bagli (.claude/settings.json — paylasilan)"
elif grep -qs "gate-guard" ".claude/settings.local.json"; then
  warn "Hook'lar sadece settings.local.json'da — paylasilan settings.json'a tasi"
else
  fail "Hook'lar Claude Code'a BAGLI DEGIL — hicbiri calismaz"
fi
if grep -qs "session-brief" ".claude/settings.json"; then
  pass "session-brief SessionStart'a bagli"
else
  fail "session-brief .claude/settings.json'da kayitli degil"
fi

# Enforcement SABLONLARA tasiniyor mu? /new-project ciktisi hook'suz dogarsa
# kurallarin tamami yalniz bu depoda yasar (5 ay fark edilmedi, #99 çevresi).
for tpl_dir in "nextjs-fullstack" "landing"; do
  TPL_SET="templates/${tpl_dir}/.claude/settings.json"
  if [ -f "$TPL_SET" ] && grep -qs "dev-starter/hooks/gate-guard" "$TPL_SET" && grep -qs "session-brief" "$TPL_SET"; then
    pass "templates/$tpl_dir hook'lari ekosistemden aliyor (settings.json)"
  else
    fail "templates/$tpl_dir/.claude/settings.json eksik ya da dev-starter hook'larina bagli degil"
  fi
done

# ─── 5. Snippet Files ────────────────────────────────────────────────────────
header "Snippet Dosyalari"

SNIPPETS=("animated-number.tsx" "infinite-scroll.tsx" "og-image.tsx" "search-bar.tsx" "modal.tsx" "drawer.tsx" "form.tsx" "skeleton.tsx" "toast.tsx" "confirm.tsx" "agent-tool.tsx" "action-card.tsx" "agent-approval.tsx" "agent-feed.tsx" "agent-feed-core.ts" "agent-feed.test.ts" "reveal.tsx" "theme-toggle.tsx" "rolling-number.tsx" "rolling-number.module.css" "scroll-progress.tsx" "tab-underline.tsx" "use-scroll-lock.ts")
for snippet in "${SNIPPETS[@]}"; do
  if [ -f "snippets/${snippet}" ]; then
    pass "$snippet mevcut"
  else
    fail "$snippet EKSIK"
  fi
done

# Sablona kopyalanan snippet'ler kaynagindan ayrismasin: iki kaynak olunca biri
# sessizce bayatlar. Sablondaki kopya snippet'le BAYT BAYT ayni olmali.
for pair in "agent-feed.tsx:templates/nextjs-fullstack/components/feed/agent-feed.tsx" \
            "agent-feed-core.ts:templates/nextjs-fullstack/components/feed/agent-feed-core.ts"; do
  SRC="snippets/${pair%%:*}"; DST="${pair#*:}"
  if [ ! -f "$DST" ]; then
    fail "$DST EKSIK"
  elif cmp -s "$SRC" "$DST"; then
    pass "$DST snippet ile ayni"
  else
    fail "$DST snippet'ten AYRISMIS — cp $SRC $DST"
  fi
done

# ─── 6. Template Files ───────────────────────────────────────────────────────
header "Template Dosyalari"

TEMPLATES=("docs/ROUTEMAP.template" "docs/PRODUCT.template" "docs/ARCHITECTURE.template" "docs/SCREENS.template" "docs/STORY.template" "docs/KICKOFF.template" "docs/DESIGN.template")
for tpl in "${TEMPLATES[@]}"; do
  if [ -f "templates/${tpl}.md" ]; then
    pass "$tpl.md mevcut"
  else
    fail "$tpl.md EKSIK"
  fi
done

# Template projeleri
for tpl_dir in "nextjs-fullstack" "landing"; do
  if [ -d "templates/${tpl_dir}" ]; then
    if [ -f "templates/${tpl_dir}/package.json" ]; then
      pass "templates/$tpl_dir/ mevcut ve package.json var"
    else
      warn "templates/$tpl_dir/ var ama package.json eksik"
    fi
  else
    fail "templates/$tpl_dir/ EKSIK"
  fi

  # Lint script'i varsa ESLint config'i de gelmeli. ESLint 9 yalnizca flat
  # config okur (eslint.config.{js,mjs,ts}); .eslintrc.* sessizce yok sayilir.
  if grep -q '"lint"' "templates/${tpl_dir}/package.json" 2>/dev/null; then
    ESLINT_CFG=""
    for cfg in eslint.config.mjs eslint.config.js eslint.config.ts; do
      [ -f "templates/${tpl_dir}/${cfg}" ] && { ESLINT_CFG="$cfg"; break; }
    done
    if [ -n "$ESLINT_CFG" ]; then
      pass "templates/$tpl_dir/ ESLint flat config mevcut ($ESLINT_CFG)"
    elif ls "templates/${tpl_dir}"/.eslintrc* >/dev/null 2>&1; then
      warn "templates/$tpl_dir/ yalnizca .eslintrc var — ESLint 9 onu okumaz, eslint.config.mjs'e tasi"
    else
      warn "templates/$tpl_dir/ lint script'i var ama ESLint config yok"
    fi
    # Next 16'da `next lint` komutu kaldirildi; script `eslint` olmali
    if grep -qE '"lint"[[:space:]]*:[[:space:]]*"next lint' "templates/${tpl_dir}/package.json"; then
      warn "templates/$tpl_dir/ \"lint\": \"next lint\" — Next 16'da yok, \"eslint\" kullan"
    fi
  fi

  # Tailwind v4: `@import "tailwindcss"` + @tailwindcss/postcss. Ikisinden
  # biri eksikse hicbir utility uretilmez ve build + tsc + lint UCU DE yesil
  # verir — bu sinif hata ancak yapisal bir invaryantla yakalanir
  # (mistakes.md #28, #53).
  GLOBALS="templates/${tpl_dir}/app/globals.css"
  if [ -f "$GLOBALS" ]; then
    if grep -qs '@tailwind ' "$GLOBALS"; then
      fail "templates/$tpl_dir/ globals.css v3 '@tailwind' direktifi kullaniyor — v4'te '@import \"tailwindcss\";'"
    elif grep -qsE "@import ['\"]tailwindcss['\"]" "$GLOBALS"; then
      if grep -qs '@tailwindcss/postcss' "templates/${tpl_dir}"/postcss.config.* 2>/dev/null; then
        pass "templates/$tpl_dir/ Tailwind v4 (@import + @tailwindcss/postcss)"
      else
        fail "templates/$tpl_dir/ @import \"tailwindcss\" var ama postcss.config'te @tailwindcss/postcss YOK — hicbir stil derlenmez"
      fi
    else
      warn "templates/$tpl_dir/ globals.css Tailwind'i import etmiyor"
    fi
  fi
  if ls "templates/${tpl_dir}"/tailwind.config.* >/dev/null 2>&1; then
    warn "templates/$tpl_dir/ tailwind.config.* var — v4'te token'lar globals.css @theme blogunda"
  fi

  # Next 16: middleware.ts -> proxy.ts (export function proxy)
  if [ -f "templates/${tpl_dir}/middleware.ts" ]; then
    warn "templates/$tpl_dir/middleware.ts — Next 16'da proxy.ts (export function proxy) olmali"
  fi
done

# ─── 7. Knowledge Base ───────────────────────────────────────────────────────
header "Knowledge Base"

for kb in "mistakes" "patterns" "design-references"; do
  if [ -f "knowledge/${kb}.md" ]; then
    LINES=$(wc -l < "knowledge/${kb}.md")
    pass "$kb.md mevcut ($LINES satir)"
  else
    fail "$kb.md EKSIK"
  fi
done

THEME_COUNT=$(find knowledge/themes -name '*.md' 2>/dev/null | wc -l)
if [ "$THEME_COUNT" -gt 0 ]; then
  pass "Tema dosyalari: $THEME_COUNT adet"
else
  warn "Tema dosyasi bulunamadi"
fi

# ─── 8. Package Consistency ──────────────────────────────────────────────────
header "Paket Tutarliligi"

ROOT_VER=$(grep '"version"' package.json 2>/dev/null | head -1 | sed 's/.*: *"\(.*\)".*/\1/')
echo "  Root versiyon: $ROOT_VER"

for pkg_dir in packages/@ahmet/*/; do
  if [ -f "${pkg_dir}package.json" ]; then
    PKG_NAME=$(grep '"name"' "${pkg_dir}package.json" | head -1 | sed 's/.*: *"\(.*\)".*/\1/')
    PKG_VER=$(grep '"version"' "${pkg_dir}package.json" | head -1 | sed 's/.*: *"\(.*\)".*/\1/')
    if [ "$PKG_VER" = "$ROOT_VER" ]; then
      pass "$PKG_NAME@$PKG_VER (root ile esit)"
    else
      warn "$PKG_NAME@$PKG_VER (root: $ROOT_VER)"
    fi
  fi
done

# Kilit dosyasi `npm ci` tarafindan kabul edilebilir mi? Varligini degil,
# cozulebilirligini test eder — kirik kilit CI'in ILK adimini dusurur ve
# geri kalan hicbir kontrol calismaz. Bkz. knowledge/mistakes.md #57
if [ -f "scripts/verify-lockfile.mjs" ]; then
  set +e
  LOCK_OUT=$(node scripts/verify-lockfile.mjs 2>&1)
  LOCK_CODE=$?
  set -e
  if [ $LOCK_CODE -eq 0 ]; then
    pass "package-lock.json npm ci ile tutarli"
  else
    fail "package-lock.json senkron degil — CI npm ci adiminda olur:"
    echo "$LOCK_OUT" | head -6 | sed 's/^/     /'
  fi
else
  fail "scripts/verify-lockfile.mjs EKSIK"
fi

# Agentic dogrulama: script VAR MI + pin tutarli mi?
# Tam dogrulama (tsc + vitest) ag erisimi ve npm install gerektirir; bu yuzden
# burada CALISTIRILMAZ. Opt-in: npm run verify:agentic
# Burada yalnizca ucuz olan iki sey kontrol edilir: script'in varligi ve
# template pin'inin CopilotKit'in bagimliligiyla ayni major/exact olmasi.
if [ -f "scripts/verify-agentic.mjs" ]; then
  pass "scripts/verify-agentic.mjs mevcut"
  # Anahtar hic yoksa node -p 'undefined' STRING'i basar ve eski case yanlis
  # PASS veriyordu; devDependencies'e tasinirsa da yanlis FAIL. Iki sozluk
  # birlesik okunur, yokluk bos dizeye dusurulur.
  AGUI_PIN=$(node -p "(p=>({...p.dependencies,...p.devDependencies})['@ag-ui/client'] ?? '')(JSON.parse(require('fs').readFileSync('templates/agentic-chat/package.json','utf8')))" 2>/dev/null || echo "")
  case "$AGUI_PIN" in
    ""|undefined|*[\^~]*)
      fail "templates/agentic-chat: @ag-ui/client pin'i sabit degil ('$AGUI_PIN') — mistakes.md #71" ;;
    *)
      pass "@ag-ui/client tam surume sabitlenmis ($AGUI_PIN)" ;;
  esac
else
  fail "scripts/verify-agentic.mjs EKSIK"
fi

# Figur kiti (anatomy): kurulum + dogrulama betikleri ve sabit commit.
# Tam dogrulama ag + iki npm install ister; opt-in: npm run verify:anatomy
if [ -f "scripts/add-figure-kit.mjs" ] && [ -f "scripts/verify-anatomy.mjs" ]; then
  pass "scripts/add-figure-kit.mjs + verify-anatomy.mjs mevcut"
else
  fail "figur kiti betikleri EKSIK (scripts/add-figure-kit.mjs, verify-anatomy.mjs)"
fi
if grep -qE '^ANATOMY_REF="[0-9a-f]{40}"' machine/bootstrap.sh; then
  pass "anatomy tam commit'e sabitlenmis (bootstrap.sh ANATOMY_REF)"
else
  fail "machine/bootstrap.sh: ANATOMY_REF 40 haneli sha degil — verify:anatomy kaynagi belirsiz"
fi

# Yerel Node major'i .nvmrc ile ayni mi? Farkliysa bir sonraki npm install
# CI'in reddedecegi bir kilit yazabilir.
if [ -f ".nvmrc" ] && command -v node >/dev/null 2>&1; then
  NVMRC_MAJOR=$(tr -d 'v \t\n' < .nvmrc | cut -d. -f1)
  NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
  if [ "$NVMRC_MAJOR" = "$NODE_MAJOR" ]; then
    pass "Node $NODE_MAJOR .nvmrc ile ayni"
  else
    warn "Node $NODE_MAJOR calisiyor, .nvmrc Node $NVMRC_MAJOR istiyor — kilit uyusmazligi riski"
  fi
fi

# ─── 9. Design Token Violations ──────────────────────────────────────────────
header "Design Token Kontrolu (UI Paketi + Snippet'ler)"

# v3: renk YALNIZCA token sinifindan (bg-surface, text-strong, border-line).
# Tema `data-theme` ile dondugu icin `dark:` varyanti da artik bir ihlal —
# eskiden bu satirlar `grep -v dark:` ile eleniyordu.
TOKEN_DIRS=()
for d in packages/@ahmet/ui/src snippets; do [ -d "$d" ] && TOKEN_DIRS+=("$d"); done
if [ ${#TOKEN_DIRS[@]} -gt 0 ]; then
  PALETTE='(bg|text|border|ring|from|via|to|fill|stroke|outline|shadow|placeholder)-(white|black|gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(-[0-9]+|/|\b)'
  VIOLATIONS=$(grep -rnE "$PALETTE|\bdark:|['\"]#[0-9a-fA-F]{3,8}['\"]|rgba?\([0-9]" "${TOKEN_DIRS[@]}" \
    --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v '\.test\.\|\.spec\.' || true)
  if [ -n "$VIOLATIONS" ]; then
    warn "Olasi design token ihlali (sabit renk / dark: varyanti):"
    echo "$VIOLATIONS" | head -8 | sed 's/^/     /'
  else
    pass "Sabit renk ve dark: varyanti yok — renkler token'dan"
  fi
fi

# ─── 10. CI Workflow ─────────────────────────────────────────────────────────
header "CI/CD"

if [ -f ".github/workflows/ci.yml" ]; then
  pass "CI workflow mevcut"
  if grep -q "tsc --noEmit\|typecheck\|type-check" ".github/workflows/ci.yml" 2>/dev/null; then
    pass "TypeScript kontrolu CI'da var"
  else
    warn "TypeScript kontrolu CI'da yok"
  fi
  if grep -q "eslint\|lint" ".github/workflows/ci.yml" 2>/dev/null; then
    pass "Lint kontrolu CI'da var"
  else
    warn "Lint kontrolu CI'da yok"
  fi
else
  fail "CI workflow bulunamadi"
fi

# ─── 11. Essential Files ─────────────────────────────────────────────────────
header "Temel Dosyalar"

for f in "CLAUDE.md" "CONTRIBUTING.md" "CHANGELOG.md" ".editorconfig" ".prettierrc"; do
  if [ -f "$f" ]; then
    pass "$f mevcut"
  else
    warn "$f eksik"
  fi
done

# ─── 12. Tasarim Denetimi ────────────────────────────────────────────────────
header "Tasarim Denetimi"

# Imza degradesi tek token'dan mi geliyor?
STRAY_GRADIENT=$(grep -rnE 'from-(indigo|violet|purple|fuchsia|cyan|sky|blue)-[0-9]+ (via-[a-z]+-[0-9]+ )?to-[a-z]+-[0-9]+' \
  templates packages --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next 2>/dev/null || true)
if [ -n "$STRAY_GRADIENT" ]; then
  warn "Elle yazilmis degrade — tekrar ediyorsa token'a tasi ('bg-signature'):"
  echo "$STRAY_GRADIENT" | head -5 | sed 's/^/     /'
else
  pass "Renk degradeleri token'dan geliyor"
fi

# Degrade metin fallback'i — kirpma desteklenmezse metin gorunmez olur.
# Degradenin kendisi yasak DEGIL; fallback'siz olani hatadir.
GRADIENT_TEXT=$(grep -rlE 'bg-clip-text|background-clip:\s*text' \
  templates packages --include="*.tsx" --include="*.css" --exclude-dir=node_modules --exclude-dir=.next 2>/dev/null || true)
if [ -n "$GRADIENT_TEXT" ]; then
  UNGUARDED=""
  while IFS= read -r f; do
    grep -q '@supports' "$f" 2>/dev/null || UNGUARDED="$UNGUARDED$f\n"
  done <<< "$GRADIENT_TEXT"
  if [ -n "$UNGUARDED" ]; then
    warn "Fallback'siz degrade metin (@supports + solid color eksik):"
    printf "%b" "$UNGUARDED" | head -5 | sed 's/^/     /'
  else
    pass "Degrade metinlerin hepsi @supports korumali"
  fi
else
  pass "Degrade metin kullanilmiyor"
fi

# Violet/purple — marka paletinde yok. Yasak degil, gozlem: gorunuyorsa
# ya palete eklenmeli ya sizintidir (bkz. rules/design-tokens.md)
VIOLET_LEAK=$(grep -rnE '(bg|from|via|to|text|border)-(violet|purple|fuchsia)-[0-9]+' \
  templates packages --include="*.tsx" --include="*.css" --exclude-dir=node_modules --exclude-dir=.next 2>/dev/null || true)
if [ -n "$VIOLET_LEAK" ]; then
  warn "Palet disi violet/purple — token'a ekle veya kaldir:"
  echo "$VIOLET_LEAK" | head -5 | sed 's/^/     /'
else
  pass "Palet disi renk yok"
fi

# ─── 13. Tech Stack Uyumu ─────────────────────────────────────────────────────
header "Tech Stack Uyumu (motion)"

# framer-motion -> motion: ekosistem `motion/react` import eder. Eski paket
# ayni API'yi tasir ama ayri bir kopya kurar; LazyMotion baglami iki kopya
# arasinda paylasilmaz ve `m.*` bilesenleri sessizce animasyonsuz kalir.
FM_IMPORTS=$(grep -rnE "from ['\"]framer-motion['\"]" packages snippets templates \
  --include='*.ts' --include='*.tsx' --exclude-dir=node_modules --exclude-dir=dist 2>/dev/null || true)
if [ -n "$FM_IMPORTS" ]; then
  warn "framer-motion importu — 'motion/react' kullan:"
  echo "$FM_IMPORTS" | head -5 | sed 's/^/     /'
else
  pass "Animasyon importlari motion/react'ten"
fi

# ─── 14. Orkestrasyon Butunlugu ──────────────────────────────────────────────
header "Orkestrasyon Butunlugu"

# Kayitli subagent sarmalayicilari: beklenen liste + her biri rol dosyasini
# MUTLAK yolla okumali (kopya = iki kaynak, biri bayatlar)
WRAPPERS=("strategist" "gate" "deploy" "design-reviewer" "content-editor" "frontend" "backend" "qa" "researcher")
for w in "${WRAPPERS[@]}"; do
  WF=".claude/agents/${w}.md"
  if [ ! -f "$WF" ]; then
    fail "$WF EKSIK (kayitli subagent sarmalayicisi)"
  elif grep -qs '~/dev-starter/agents/' "$WF"; then
    pass "$w sarmalayicisi rol dosyasina mutlak yolla bagli"
  else
    warn "$WF rol dosyasini ~/dev-starter/agents/ yolundan okumuyor"
  fi
done

# Sarmalayici <-> AGENT_PROTOCOL senkronu: protokol kayitli subagent olarak
# ne ilan ediyorsa dosyasi olmali, dosyasi olan ilan edilmis olmali
for w in "${WRAPPERS[@]}"; do
  if ! grep -qs "\`${w}\`" agents/AGENT_PROTOCOL.md; then
    warn "AGENT_PROTOCOL.md kayitli subagent '${w}'i anmiyor — liste bayatlamis olabilir"
  fi
done
for f in .claude/agents/*.md; do
  base=$(basename "$f" .md)
  case " ${WRAPPERS[*]} " in
    *" $base "*) : ;;
    *) warn "Listelenmemis sarmalayici: $base — health-check + AGENT_PROTOCOL guncellenmeli" ;;
  esac
done

# Komutlar: beklenen liste CLAUDE.md tablosu + bootstrap symlink'leriyle ayni evren
COMMANDS=("kickoff" "roadmap" "new-project" "plan" "story" "gate" "fix" "research" "status" "retro" "evolve" "theme" "snippet" "check" "review-ui" "reference" "deploy" "release" "agentic")
for c in "${COMMANDS[@]}"; do
  if [ -f ".claude/commands/${c}.md" ]; then
    pass "/$c komutu mevcut"
  else
    fail "/.claude/commands/${c}.md EKSIK"
  fi
done
for f in .claude/commands/*.md; do
  base=$(basename "$f" .md)
  case " ${COMMANDS[*]} " in
    *" $base "*) : ;;
    *) warn "Listelenmemis komut: /$base — health-check + CLAUDE.md tablosu guncellenmeli" ;;
  esac
done

# ─── 15. Bilgi Tabani Butunlugu ──────────────────────────────────────────────
header "Bilgi Tabani Butunlugu"

# mistakes.md numaralari: tekrar yok (capraz referans agi tek anahtara dayanir)
# Boru zinciri bos sonucla exit 1 doner; korumasiz birakmak set -e altinda
# script'i OZETSIZ olduruyordu — bosluk acik bir FAIL'dir, olum degil.
NUMS=$(grep -oE '^### [0-9]+\.' knowledge/mistakes.md 2>/dev/null | grep -oE '[0-9]+' || true)
if [ -z "$NUMS" ]; then
  fail "mistakes.md basliklari ayristirilamadi ('### N.' bicimi bekleniyor)"
else
  DUP=$(echo "$NUMS" | sort -n | uniq -d)
  if [ -z "$DUP" ]; then
    pass "mistakes.md kayit numaralari benzersiz ($(echo "$NUMS" | wc -l | tr -d ' ') kayit)"
  else
    fail "mistakes.md'de TEKRARLANAN numara: $(echo "$DUP" | tr '\n' ' ')"
  fi
  # Indeks tablosu en yeni kaydi anmali. Grep capali: '16' araniyorsa
  # 'next16' etiketi yanlis PASS vermesin.
  MAXNUM=$(echo "$NUMS" | sort -n | tail -1)
  if sed -n '/^## İndeks/,/^---/p' knowledge/mistakes.md | grep -qE "(^|[^0-9])${MAXNUM}([^0-9]|$)"; then
    pass "mistakes.md indeksi en yeni kaydi (#$MAXNUM) kapsiyor"
  else
    warn "mistakes.md indeksi #$MAXNUM'u kapsamiyor — indeks satirini guncelle"
  fi
fi

# Satir tavanlari (rules/self-improvement.md): sismis bilgi context butcesini yer
check_cap() {
  local file="$1" cap="$2" lines
  [ -f "$file" ] || return 0
  lines=$(wc -l < "$file")
  if [ "$lines" -gt "$cap" ]; then
    warn "$file $lines satir (tavan $cap) — katmanla: knowledge/archive/ + indeks satiri"
  else
    pass "$file $lines satir (tavan $cap)"
  fi
}
check_cap knowledge/mistakes.md 2200
check_cap knowledge/patterns.md 1600
check_cap CLAUDE.md 520

# README istatistik gorselleri rehber ve kayit SAYISINI basar: yeni bir
# rehber ya da mistakes kaydi ekleyip `readme:assets`i unutan commit CI'da
# verify:readme'de kirilir. Bu kontrol yokken health-check "temiz" diyor,
# CI kirmiziya dusuyordu (iki kez: #97 ve #101 kayitlarinda).
README_OUT=$(npm run -s verify:readme 2>&1 || true)
if echo "$README_OUT" | grep -q "güncel"; then
  pass "README gorselleri sayilarla guncel (verify:readme)"
elif echo "$README_OUT" | grep -q "bayat"; then
  fail "README gorselleri bayat — 'npm run readme:assets' calistirip commit'le"
else
  warn "README gorselleri denetlenemedi (Node tip ayiklama gerekir) — 'npm run verify:readme'"
fi

# ─── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  SONUC: $PASS basarili, $WARN uyari, $FAIL hata"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $FAIL -gt 0 ]; then
  echo "  Durum: FAILED"
  exit 1
elif [ $WARN -gt 0 ]; then
  echo "  Durum: PASSED_WITH_WARNINGS"
  exit 0
else
  echo "  Durum: PASSED"
  exit 0
fi
