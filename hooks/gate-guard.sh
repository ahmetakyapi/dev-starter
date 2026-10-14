#!/usr/bin/env bash
# Gate Guard — commit öncesi Gate Agent geçişini kontrol eder
# PreToolUse:Bash hook olarak çalışır
#
# Aktif story (IN_PROGRESS | IN_REVIEW) Gate'den geçmemişse commit'i bloklar.
# Gate kolonunu başlıktan bulur (knowledge/mistakes.md #99: konumdan okumak
# resmi şablonda Assign kolonuna düşüyordu). Yalnızca doküman değiştiren
# commit'ler Gate istemez (rules/dev-cycle.md → Pipeline Kısayolları).

set -euo pipefail

# shellcheck source=lib/hook-input.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/hook-input.sh"
# shellcheck source=lib/routemap.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/routemap.sh"

# Sadece git commit komutlarını yakala
hook_is_git_commit || exit 0

# ROUTEMAP yoksa uyarı ver ama bloklamadan devam et
ROUTEMAP=$(routemap_find) || {
  echo "⚠️  ROUTEMAP bulunamadı. Gate kontrolü atlanıyor."
  exit 0
}

# Aktif story var mı?
ACTIVE=$(routemap_active_stories "$ROUTEMAP")
[ -z "$ACTIVE" ] && exit 0

# Yalnız doküman değişen commit Gate istemez (dev-cycle.md: docs → Pass 1-2).
# Staged liste boşsa (ör. commit -a) muafiyet uygulanmaz, tam kontrol çalışır.
STAGED=$(git diff --cached --name-only 2>/dev/null || true)
if [ -n "$STAGED" ] && ! echo "$STAGED" | grep -qvE '\.(md|txt)$'; then
  echo "ℹ️  Yalnız doküman değişiyor — Gate kontrolü uygulanmadı ($ROUTEMAP)."
  exit 0
fi

# Her aktif story Gate'den geçmiş olmalı
FAILED_ROWS=$(echo "$ACTIVE" | awk -F'\t' '$3 != "PASSED" && $3 != "PASSED_WITH_WARNINGS"')
if [ -n "$FAILED_ROWS" ]; then
  echo "❌ GATE GUARD: Commit bloklandı!"
  echo "   Gate'den geçmemiş aktif story var ($ROUTEMAP):"
  echo "$FAILED_ROWS" | awk -F'\t' '{ printf "   - %s  durum=%s  gate=%s\n", $1, $2, ($3 == "" ? "—" : $3) }'
  echo ""
  echo "   Yol: /gate çalıştır → sonuç ROUTEMAP'teki Gate kolonuna işlenir →"
  echo "   PASSED ise commit açılır. Yalnız doküman değişen commit'ler muaf."
  exit 2
fi

exit 0
