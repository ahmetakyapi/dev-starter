#!/usr/bin/env bash
# Quality Scan — commit öncesi temel kalite kontrolleri
# PreToolUse:Bash hook olarak çalışır
#
# Hardcoded değer, debug kodu ve güvenlik taraması

set -euo pipefail

# shellcheck source=lib/hook-input.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/hook-input.sh"

# Sadece git commit komutlarını yakala
hook_is_git_commit || exit 0

WARNINGS=0
ERRORS=0

# Staged dosyaları al
STAGED=$(git diff --cached --name-only --diff-filter=ACMR 2>/dev/null || true)
if [ -z "$STAGED" ]; then
  exit 0
fi

# 1. Hardcoded hex renk kontrolü (tsx/ts dosyalarında)
# Test dosyaları token DEĞERLERİNİ doğrular — hex barındırmaları beklenir.
# Diğer kontroller zaten test dosyalarını dışlıyor; bu satır o tutarlılığı kurar.
HEX_HITS=$(echo "$STAGED" | grep -E '\.(tsx?|css)$' | xargs grep -ln '#[0-9a-fA-F]\{3,8\}' 2>/dev/null | grep -v 'globals.css\|tailwind\|theme\|\.config\.\|\.test\.\|\.spec\.' || true)
if [ -n "$HEX_HITS" ]; then
  echo "⚠️  DESIGN TOKEN: Hardcoded hex renk bulundu:"
  echo "$HEX_HITS" | sed 's/^/   /'
  WARNINGS=$((WARNINGS + 1))
fi

# 2. console.log kontrolü
LOG_HITS=$(echo "$STAGED" | grep -E '\.(tsx?|jsx?)$' | xargs grep -ln 'console\.\(log\|debug\|warn\)' 2>/dev/null | grep -v '\.test\.\|\.spec\.\|\.config\.' || true)
if [ -n "$LOG_HITS" ]; then
  echo "⚠️  DEBUG: console.log/debug/warn bulundu:"
  echo "$LOG_HITS" | sed 's/^/   /'
  WARNINGS=$((WARNINGS + 1))
fi

# 3. Güvenlik: Hardcoded secret kontrolü
SECRET_HITS=$(echo "$STAGED" | xargs grep -lniE '(password|secret|api_key|apikey|token)\s*[:=]\s*["\x27][^"\x27]{8,}' 2>/dev/null | grep -v '\.example\|\.template\|\.test\.\|\.spec\.\|\.md$' || true)
if [ -n "$SECRET_HITS" ]; then
  echo "❌ SECURITY: Olası hardcoded secret bulundu:"
  echo "$SECRET_HITS" | sed 's/^/   /'
  ERRORS=$((ERRORS + 1))
fi

# 4. .env dosyası commit edilmeye çalışılıyor mu?
ENV_HITS=$(echo "$STAGED" | grep -E '^\.env$|^\.env\.local$|^\.env\.production$' || true)
if [ -n "$ENV_HITS" ]; then
  echo "❌ SECURITY: .env dosyası commit edilmeye çalışılıyor!"
  echo "$ENV_HITS" | sed 's/^/   /'
  ERRORS=$((ERRORS + 1))
fi

# 5. @ts-ignore / any kontrolü
TS_IGNORE=$(echo "$STAGED" | grep -E '\.tsx?$' | xargs grep -ln '@ts-ignore\|@ts-expect-error\|: any\b' 2>/dev/null | grep -v '\.test\.\|\.spec\.\|\.d\.ts$' || true)
if [ -n "$TS_IGNORE" ]; then
  echo "⚠️  TYPESCRIPT: @ts-ignore veya 'any' type bulundu:"
  echo "$TS_IGNORE" | sed 's/^/   /'
  WARNINGS=$((WARNINGS + 1))
fi

# 6. Impeccable — AI-slop ve tasarım anti-pattern taraması (staged UI dosyaları)
UI_STAGED=$(echo "$STAGED" | grep -E '\.(tsx?|jsx?|css|html)$' || true)
if [ -n "$UI_STAGED" ]; then
  if [ -x "node_modules/.bin/impeccable" ]; then
    set +e
    SLOP_OUT=$(echo "$UI_STAGED" | xargs node_modules/.bin/impeccable detect 2>/dev/null)
    SLOP_CODE=$?
    set -e
    if [ $SLOP_CODE -ne 0 ] && [ -n "$SLOP_OUT" ]; then
      echo "⚠️  IMPECCABLE: Tasarım anti-pattern bulundu:"
      echo "$SLOP_OUT" | head -20 | sed 's/^/   /'
      echo "   Detay: npm run design:detect"
      WARNINGS=$((WARNINGS + 1))
    fi
  else
    echo "ℹ️  impeccable bulunamadı — 'npm install' sonrası tasarım taraması devreye girer"
  fi
fi

# 7. Lockfile tutarlılığı — package.json/package-lock.json stage'lendiyse
# Kilit manifest'le senkron değilse CI'ın İLK adımı (`npm ci`) patlar ve
# hiçbir kontrol çalışmaz. Yerelde `npm install` çalıştığı için commit anında
# hiçbir belirti yoktur; bu yüzden uyarı değil HATA. Bkz. mistakes.md #57
LOCK_TOUCHED=$(echo "$STAGED" | grep -E '(^|/)(package\.json|package-lock\.json)$' || true)
if [ -n "$LOCK_TOUCHED" ]; then
  REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo '.')
  if [ -f "$REPO_ROOT/scripts/verify-lockfile.mjs" ]; then
    set +e
    LOCK_OUT=$( (cd "$REPO_ROOT" && node scripts/verify-lockfile.mjs) 2>&1 )
    LOCK_CODE=$?
    set -e
    if [ $LOCK_CODE -ne 0 ]; then
      echo "$LOCK_OUT" | sed 's/^/   /'
      ERRORS=$((ERRORS + 1))
    fi
  fi
fi

# Sonuç
if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "❌ Quality scan FAILED — $ERRORS hata, $WARNINGS uyarı"
  echo "   Hataları düzeltin veya bypass: git commit --no-verify"
  exit 2
fi

if [ $WARNINGS -gt 0 ]; then
  echo ""
  echo "⚠️  Quality scan: $WARNINGS uyarı (commit devam ediyor)"
fi

exit 0
