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
    if [ -x "hooks/${hook}.sh" ] 2>/dev/null || true; then
      pass "$hook.sh mevcut"
    else
      warn "$hook.sh mevcut ama calistirilabilir degil (chmod +x gerekli)"
    fi
  else
    fail "$hook.sh EKSIK"
  fi
done

# Claude Code hook entegrasyonu
if [ -f ".claude/settings.local.json" ]; then
  if grep -q "gate-guard" ".claude/settings.local.json" 2>/dev/null; then
    pass "Hook'lar Claude Code'a bagli"
  else
    warn "settings.local.json var ama hook'lar baglanmamis"
  fi
else
  warn ".claude/settings.local.json yok — hook'lar calismayacak"
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
  warn "Token disi renk degradesi bulundu — 'bg-signature' kullan:"
  echo "$STRAY_GRADIENT" | head -5 | sed 's/^/     /'
else
  pass "Renk degradeleri tek imza token'indan geliyor"
fi

# Violet/purple sizintisi — marka paletinde yok, en taninir AI tell'i
VIOLET_LEAK=$(grep -rnE '(bg|from|via|to|text|border)-(violet|purple|fuchsia)-[0-9]+' \
  templates packages --include="*.tsx" --include="*.css" 2>/dev/null || true)
if [ -n "$VIOLET_LEAK" ]; then
  warn "Marka disi violet/purple kullanimi:"
  echo "$VIOLET_LEAK" | head -5 | sed 's/^/     /'
else
  pass "Violet/purple sizintisi yok"
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
