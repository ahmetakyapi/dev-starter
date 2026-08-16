#!/usr/bin/env bash
# ROUTEMAP Sync — Edit/Write sonrası ROUTEMAP güncelliğini kontrol eder
# PostToolUse:Edit|Write hook olarak çalışır

set -euo pipefail

# ROUTEMAP var mı?
ROUTEMAP=""
for f in docs/ROUTEMAP.md ROUTEMAP.md; do
  if [ -f "$f" ]; then
    ROUTEMAP="$f"
    break
  fi
done

[ -z "$ROUTEMAP" ] && exit 0

# Son güncelleme zamanını kontrol et (dosya modify time)
if command -v stat &>/dev/null; then
  ROUTEMAP_AGE=$(stat -c %Y "$ROUTEMAP" 2>/dev/null || stat -f %m "$ROUTEMAP" 2>/dev/null || echo 0)
  NOW=$(date +%s)
  DIFF=$((NOW - ROUTEMAP_AGE))

  # 30 dakikadan uzun süredir güncellenmemişse hatırlat
  if [ $DIFF -gt 1800 ]; then
    echo "💡 ROUTEMAP hatırlatma: Son güncellemeden 30+ dakika geçti."
    echo "   Aktif story durumunu güncellemeyi unutmayın."
  fi
fi

exit 0
