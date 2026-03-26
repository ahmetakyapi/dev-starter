#!/usr/bin/env bash
# Quality Scan — commit öncesi temel kalite kontrolleri
# PreToolUse:Bash hook olarak çalışır
#
# Hardcoded değer, debug kodu ve güvenlik taraması

set -euo pipefail

# Sadece git commit komutlarını yakala
TOOL_INPUT="${TOOL_INPUT:-}"
if ! echo "$TOOL_INPUT" | grep -qE 'git\s+commit'; then
  exit 0
fi

WARNINGS=0
ERRORS=0

# Staged dosyaları al
STAGED=$(git diff --cached --name-only --diff-filter=ACMR 2>/dev/null || true)
if [ -z "$STAGED" ]; then
  exit 0
fi

# 1. Hardcoded hex renk kontrolü (tsx/ts dosyalarında)
HEX_HITS=$(echo "$STAGED" | grep -E '\.(tsx?|css)$' | xargs grep -ln '#[0-9a-fA-F]\{3,8\}' 2>/dev/null | grep -v 'globals.css\|tailwind\|theme\|\.config\.' || true)
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
