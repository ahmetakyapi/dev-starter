#!/usr/bin/env bash
# Gate kapsamının parmak izi: çalışma ağacının HEAD'e göre farkı (staged +
# unstaged + izlenmeyen yeni dosyalar), `docs/` HARİÇ (Gate raporu ve ROUTEMAP
# Gate'ten SONRA yazılır, izi bozmasın).
#
# /gate raporun sonuna `Kapsam: <iz>` yazar; gate-guard commit anında izi
# yeniden hesaplar. Farklıysa Gate'ten sonra kod değişmiştir → commit bloklanır
# (PASSED bir kere alınıp sonra her şeyi geçirmesin).
#
# Taşınabilir: sha1sum/shasum yerine `git hash-object` (macOS + Linux aynı).
# Kullanım: bash hooks/lib/gate-hash.sh   (ya da source edip gate_hash)

gate_hash() {
  local root
  root=$(git rev-parse --show-toplevel 2>/dev/null) || return 1
  git -C "$root" rev-parse --verify -q HEAD >/dev/null || return 1
  {
    git -C "$root" -c core.quotePath=false diff HEAD --binary -- . ':(exclude)docs' 2>/dev/null
    git -C "$root" -c core.quotePath=false ls-files --others --exclude-standard -- . ':(exclude)docs' 2>/dev/null |
      while IFS= read -r f; do
        printf '%s ' "$f"
        git -C "$root" hash-object -- "$f" 2>/dev/null
      done
  } | git hash-object --stdin
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  gate_hash
fi
