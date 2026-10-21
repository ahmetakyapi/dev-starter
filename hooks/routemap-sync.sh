#!/usr/bin/env bash
# ROUTEMAP Sync — Edit/Write sonrası ROUTEMAP güncelliğini ve tutarlılığını kontrol eder
# PostToolUse:Edit|Write hook olarak çalışır

set -euo pipefail

# shellcheck source=lib/routemap.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/routemap.sh"

# Hook Claude'un o anki dizininde koşar ve her `cd`yi izler; alt klasörde
# ROUTEMAP bulunamayıp kontrol sessizce atlanıyordu — proje köküne sabitlen
# (worktree'de worktree'nin ROUTEMAP'i: lib → routemap_project_root).
cd "$(routemap_project_root)" 2>/dev/null || exit 0

ROUTEMAP=$(routemap_find) || exit 0

# 1. İçerik değişmezi: DONE story'nin Gate'i PASSED olmalı
# (rules/routemap-discipline.md: "Gate PASSED olmadan story DONE yapılamaz")
#
# PostToolUse'ta exit 0 + stdout YALNIZ transcript'te görünür — model görmez.
# Değişmez ihlali modele ulaşmalı: {"decision":"block","reason":...} JSON'u
# basılır (Claude gerekçeyi görür ve düzeltir) — jq yoksa python3 kurar;
# ikisi de yoksa düz metin (en azından transcript'te iz kalır).
BROKEN=$(routemap_done_without_gate "$ROUTEMAP")
if [ -n "$BROKEN" ]; then
  REASON="ROUTEMAP tutarsız ($ROUTEMAP): DONE ama Gate PASSED değil:
$(echo "$BROKEN" | awk -F'\t' '{ printf "- %s  gate=%s\n", $1, ($3 == "" ? "—" : $3) }')
Ya Gate'i çalıştır (/gate) ya durumu IN_REVIEW'a çek."
  if command -v jq >/dev/null 2>&1; then
    jq -n --arg reason "$REASON" '{"decision": "block", "reason": $reason}'
  elif command -v python3 >/dev/null 2>&1; then
    REASON="$REASON" python3 -c 'import json, os; print(json.dumps({"decision": "block", "reason": os.environ["REASON"]}))'
  else
    echo "⚠️  $REASON"
  fi
  exit 0
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
