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

# Sadece git commit komutlarını yakala (komut metni BİR kez okunur; stdin
# ikinci okumada boş döner — bkz. lib/hook-input.sh)
CMD_TEXT=$(hook_command)
hook_text_is_git_commit "$CMD_TEXT" || exit 0

# ROUTEMAP yoksa/okunamıyorsa uyarı ver ama bloklamadan devam et
ROUTEMAP=$(routemap_find) || {
  echo "⚠️  ROUTEMAP bulunamadı. Gate kontrolü atlanıyor."
  exit 0
}

# Aktif story var mı? Ayrıştırma beklenmedik biçimde düşerse commit'i sebepsiz
# bloklamak yerine uyarıyla geç (fail-open; sır taraması quality-scan'de ayrı).
ACTIVE=$(routemap_active_stories "$ROUTEMAP" 2>/dev/null) || {
  echo "⚠️  ROUTEMAP ayrıştırılamadı — Gate kontrolü atlandı." >&2
  exit 0
}
[ -z "$ACTIVE" ] && exit 0

# Yalnız doküman değişen commit Gate istemez (dev-cycle.md: docs → Pass 1-2).
# İki durumda muafiyet UYGULANMAZ: staged liste boşsa ve komutta -a/--all/
# --include ya da pathspec görünüyorsa — bunlar dosyaları commit ANINDA
# stage'ler, hook'un gördüğü index o an eksiktir (1 .md stage'leyip
# `commit -a` ile kod geçirme açığı).
STAGED=$(git diff --cached --name-only 2>/dev/null || true)
COMMITS_WORKTREE=$(printf '%s' "$CMD_TEXT" | grep -qE '(^|[[:space:]])(-[a-zA-Z]*a[a-zA-Z]*|--all|--include)([[:space:]=]|$)' && echo yes || true)
if [ -n "$STAGED" ] && [ -z "$COMMITS_WORKTREE" ] && ! echo "$STAGED" | grep -qvE '\.(md|txt)$'; then
  echo "ℹ️  Yalnız doküman değişiyor — Gate kontrolü uygulanmadı ($ROUTEMAP)."
  exit 0
fi

# Her aktif story Gate'den geçmiş olmalı.
# Gerekçe STDERR'e: exit 2'de Claude yalnız stderr'i görür; stdout'ta kalan
# blok sebebi "No stderr output" diye kaybolur.
FAILED_ROWS=$(echo "$ACTIVE" | awk -F'\t' '$3 != "PASSED" && $3 != "PASSED_WITH_WARNINGS"')
if [ -n "$FAILED_ROWS" ]; then
  {
    echo "❌ GATE GUARD: Commit bloklandı!"
    echo "   Gate'den geçmemiş aktif story var ($ROUTEMAP):"
    echo "$FAILED_ROWS" | awk -F'\t' '{ printf "   - %s  durum=%s  gate=%s\n", $1, $2, ($3 == "" ? "—" : $3) }'
    echo ""
    echo "   Yol: /gate çalıştır → sonuç ROUTEMAP'teki Gate kolonuna işlenir →"
    echo "   PASSED ise commit açılır. Yalnız doküman değişen commit'ler muaf."
  } >&2
  exit 2
fi

exit 0
