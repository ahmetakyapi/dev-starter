#!/usr/bin/env bash
# Gate Guard — commit öncesi Gate Agent geçişini kontrol eder
# PreToolUse:Bash hook olarak çalışır
#
# ROUTEMAP'te GATE: PASSED yoksa commit'i bloklar

set -euo pipefail

# Sadece git commit komutlarını yakala
TOOL_INPUT="${TOOL_INPUT:-}"
if ! echo "$TOOL_INPUT" | grep -qE 'git\s+commit'; then
  exit 0
fi

# ROUTEMAP var mı?
ROUTEMAP=""
for f in docs/ROUTEMAP.md ROUTEMAP.md; do
  if [ -f "$f" ]; then
    ROUTEMAP="$f"
    break
  fi
done

# ROUTEMAP yoksa uyarı ver ama bloklamadan devam et
if [ -z "$ROUTEMAP" ]; then
  echo "⚠️  ROUTEMAP bulunamadı. Gate kontrolü atlanıyor."
  exit 0
fi

# Aktif story'nin Gate durumunu kontrol et
CURRENT_STORY=$(grep -E '^\|.*\|\s*IN_PROGRESS\s*\|' "$ROUTEMAP" | head -1 || true)

if [ -n "$CURRENT_STORY" ]; then
  GATE_STATUS=$(echo "$CURRENT_STORY" | awk -F'|' '{print $NF}' | tr -d ' ')
  if [ "$GATE_STATUS" != "PASSED" ] && [ "$GATE_STATUS" != "PASSED_WITH_WARNINGS" ]; then
    echo "❌ GATE GUARD: Commit bloklandı!"
    echo "   Aktif story Gate'den geçmemiş."
    echo "   Önce Gate Agent çalıştırın."
    echo ""
    echo "   Bypass: Eğer Gate gereksizse (docs, config), şu komutu kullanın:"
    echo "   git commit -m 'chore: ...' --no-verify"
    exit 2
  fi
fi

exit 0
