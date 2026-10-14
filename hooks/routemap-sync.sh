#!/usr/bin/env bash
# ROUTEMAP Sync — Edit/Write sonrası ROUTEMAP güncelliğini ve tutarlılığını kontrol eder
# PostToolUse:Edit|Write hook olarak çalışır

set -euo pipefail

# shellcheck source=lib/routemap.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/routemap.sh"

ROUTEMAP=$(routemap_find) || exit 0

# 1. İçerik değişmezi: DONE story'nin Gate'i PASSED olmalı
# (rules/routemap-discipline.md: "Gate PASSED olmadan story DONE yapılamaz")
BROKEN=$(routemap_done_without_gate "$ROUTEMAP")
if [ -n "$BROKEN" ]; then
  echo "⚠️  ROUTEMAP tutarsız: DONE ama Gate PASSED değil:"
  echo "$BROKEN" | awk -F'\t' '{ printf "   - %s  gate=%s\n", $1, ($3 == "" ? "—" : $3) }'
  echo "   Ya Gate'i çalıştır (/gate) ya durumu IN_REVIEW'a çek."
fi

# 2. Tazelik: 30 dakikadan uzun süredir güncellenmemişse hatırlat
if command -v stat &>/dev/null; then
  ROUTEMAP_AGE=$(stat -c %Y "$ROUTEMAP" 2>/dev/null || stat -f %m "$ROUTEMAP" 2>/dev/null || echo 0)
  NOW=$(date +%s)
  DIFF=$((NOW - ROUTEMAP_AGE))

  if [ $DIFF -gt 1800 ]; then
    echo "💡 ROUTEMAP hatırlatma: Son güncellemeden 30+ dakika geçti."
    echo "   Aktif story durumunu güncellemeyi unutmayın."
  fi
fi

exit 0
