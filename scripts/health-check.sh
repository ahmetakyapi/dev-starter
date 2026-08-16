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
#  12. Impeccable tasarim anti-pattern taramasi

set -euo pipefail

PASS=0
WARN=0
FAIL=0

pass()  { PASS=$((PASS + 1)); echo "  ✅ $1"; }
warn()  { WARN=$((WARN + 1)); echo "  ⚠️  $1"; }
fail()  { FAIL=$((FAIL + 1)); echo "  ❌ $1"; }
header() { echo ""; echo "━━━ $1 ━━━"; }

# ─── 1. Agent Files ──────────────────────────────────────────────────────────
header "Agent Dosyalari"

AGENTS=("AGENT_PROTOCOL" "business-analyst-agent" "uiux-agent" "frontend-agent" "backend-agent" "gate-agent" "deploy-agent")
for agent in "${AGENTS[@]}"; do
  if [ -f "agents/${agent}.md" ]; then
    pass "$agent.md mevcut"
  else
    fail "$agent.md EKSIK"
  fi
done

# ─── 2. Rule Files ───────────────────────────────────────────────────────────
header "Kural Dosyalari"

RULES=("immutable-architecture" "design-tokens" "commit-conventions" "bugfix-protocol" "dev-cycle" "routemap-discipline" "context-curation")
for rule in "${RULES[@]}"; do
  if [ -f "rules/${rule}.md" ]; then
    pass "$rule.md mevcut"
  else
    fail "$rule.md EKSIK"
  fi
done

# ─── 3. Phase Files ──────────────────────────────────────────────────────────
header "Faz Dosyalari"

PHASES=("planning" "e2e-polish" "release-maintenance")
for phase in "${PHASES[@]}"; do
  if [ -f "phases/${phase}.md" ]; then
    pass "$phase.md mevcut"
  else
    fail "$phase.md EKSIK"
  fi
done

# ─── 4. Hook Files ───────────────────────────────────────────────────────────
header "Hook Dosyalari"

HOOKS=("gate-guard" "quality-scan" "routemap-sync")
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

# ─── 5. Snippet Files ────────────────────────────────────────────────────────
header "Snippet Dosyalari"

SNIPPETS=("animated-number" "infinite-scroll" "og-image" "search-bar" "modal" "drawer" "form" "skeleton" "toast" "confirm")
for snippet in "${SNIPPETS[@]}"; do
  if [ -f "snippets/${snippet}.tsx" ]; then
    pass "$snippet.tsx mevcut"
  else
    fail "$snippet.tsx EKSIK"
  fi
done

# ─── 6. Template Files ───────────────────────────────────────────────────────
header "Template Dosyalari"

TEMPLATES=("docs/ROUTEMAP.template" "docs/PRODUCT.template" "docs/ARCHITECTURE.template" "docs/SCREENS.template")
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

  # Lint script'i varsa ESLint config'i de gelmeli — yoksa 'next lint'
  # interaktif kurulum sihirbazina duser (mistakes.md #49)
  if grep -q '"lint"' "templates/${tpl_dir}/package.json" 2>/dev/null; then
    if [ -f "templates/${tpl_dir}/.eslintrc.json" ] || [ -f "templates/${tpl_dir}/eslint.config.js" ]; then
      pass "templates/$tpl_dir/ ESLint yapilandirmasi mevcut"
    else
      warn "templates/$tpl_dir/ lint script'i var ama ESLint config yok"
    fi
  fi

  # @tailwind direktifi kullanan bir template'te postcss.config ZORUNLU.
  # Yoksa Tailwind hicbir utility uretmez ve build + tsc + lint UCU DE yesil
  # verir — bu sinif hata ancak yapisal bir invaryantla yakalanir.
  # nextjs-fullstack'te tam olarak bu oldu (mistakes.md #28, #53)
  if grep -rqs '@tailwind' "templates/${tpl_dir}/app/globals.css"; then
    if ls "templates/${tpl_dir}"/postcss.config.* >/dev/null 2>&1; then
      pass "templates/$tpl_dir/ postcss yapilandirmasi mevcut (Tailwind derlenir)"
    else
      fail "templates/$tpl_dir/ @tailwind kullaniyor ama postcss.config YOK — hicbir stil derlenmez"
    fi
  fi
done

# ─── 7. Knowledge Base ───────────────────────────────────────────────────────
header "Knowledge Base"

for kb in "mistakes" "patterns"; do
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
header "Design Token Kontrolu (UI Paketi)"

if [ -d "packages/@ahmet/ui/src" ]; then
  VIOLATIONS=$(grep -rnE 'bg-(white|black|gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]' packages/@ahmet/ui/src/ 2>/dev/null | grep -v '\.test\.\|\.spec\.' | grep -v 'dark:' || true)
  if [ -n "$VIOLATIONS" ]; then
    warn "Olasi design token ihlali:"
    echo "$VIOLATIONS" | head -5 | sed 's/^/     /'
  else
    pass "Hardcoded Tailwind renk sinifi bulunamadi"
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

# ─── 12. Impeccable — Tasarim Anti-Pattern Taramasi ──────────────────────────
header "Impeccable Tasarim Denetimi"

if [ -f ".impeccable/config.json" ]; then
  pass ".impeccable/config.json mevcut"
else
  warn ".impeccable/config.json eksik — detector proje ayarlarini okuyamaz"
fi

# Imza degradesi tek token'dan mi geliyor?
STRAY_GRADIENT=$(grep -rnE 'from-(indigo|violet|purple|fuchsia|cyan|sky|blue)-[0-9]+ (via-[a-z]+-[0-9]+ )?to-[a-z]+-[0-9]+' \
  templates packages --include="*.tsx" 2>/dev/null || true)
if [ -n "$STRAY_GRADIENT" ]; then
  warn "Elle yazilmis degrade — tekrar ediyorsa token'a tasi ('bg-signature'):"
  echo "$STRAY_GRADIENT" | head -5 | sed 's/^/     /'
else
  pass "Renk degradeleri token'dan geliyor"
fi

# Degrade metin fallback'i — kirpma desteklenmezse metin gorunmez olur.
# Degradenin kendisi yasak DEGIL; fallback'siz olani hatadir.
GRADIENT_TEXT=$(grep -rlE 'bg-clip-text|background-clip:\s*text' \
  templates packages --include="*.tsx" --include="*.css" 2>/dev/null || true)
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
  templates packages --include="*.tsx" --include="*.css" 2>/dev/null || true)
if [ -n "$VIOLET_LEAK" ]; then
  warn "Palet disi violet/purple — token'a ekle veya kaldir:"
  echo "$VIOLET_LEAK" | head -5 | sed 's/^/     /'
else
  pass "Palet disi renk yok"
fi

# Detector'i calistir (impeccable kuruluysa)
if [ -x "node_modules/.bin/impeccable" ]; then
  set +e
  DETECT_OUT=$(node_modules/.bin/impeccable detect packages templates snippets 2>/dev/null)
  DETECT_CODE=$?
  set -e
  if [ $DETECT_CODE -eq 0 ]; then
    pass "Impeccable detector temiz (0 bulgu)"
  else
    warn "Impeccable detector bulgu raporladi:"
    echo "$DETECT_OUT" | head -10 | sed 's/^/     /'
  fi
else
  warn "impeccable kurulu degil — 'npm install' ile detector aktiflesir"
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
