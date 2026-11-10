#!/usr/bin/env bash
# git pre-commit köprüsü — Claude Code DIŞINDAKİ commit'ler için
#
# NEDEN VAR: gate-guard ve quality-scan PreToolUse hook'udur; yalnız Claude'un
# Bash aracı `git commit` çalıştırınca tetiklenir. Terminalden atılan commit
# (insan, Codex, Cursor, Copilot) Gate'i ve sır taramasını hiç görmüyordu.
# Bu köprü AYNI iki script'i git'in kendi pre-commit kancasından koşturur:
# tek kaynak, kopya yok. Claude Code içinde iki yol da koşar (zararsız:
# aynı sonuç, ~50 ms); kanca commit ANINDAKİ gerçek index'i görür.
#
# Kurulum (proje kökünde, klon başına bir kez — .git/hooks versiyonlanmaz):
#   bash ~/dev-starter/hooks/git-pre-commit.sh --install
# Kaldırma: rm "$(git rev-parse --git-path hooks)/pre-commit"
#
# Sınırlar: commit mesajı pre-commit aşamasında bilinmez (biçim ve fix/TDD
# uyarıları yalnız Claude Code yolunda); `git commit --no-verify` kancayı
# atlar — bu yol disiplin içindir, güvenlik sınırı değil. Engelleme: iki
# script'ten biri exit 2 verirse kanca exit 1 döner ve commit oluşmaz.

set -uo pipefail

SELF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MARK="dev-starter: git-pre-commit"

if [ "${1:-}" = "--install" ]; then
  HOOK_DIR=$(git rev-parse --git-path hooks 2>/dev/null) || {
    echo "git deposu değil — proje kökünde çalıştır" >&2
    exit 1
  }
  TARGET="$HOOK_DIR/pre-commit"
  if [ -e "$TARGET" ] && ! grep -qs "$MARK" "$TARGET"; then
    {
      echo "❌ $TARGET zaten var ve dev-starter'a ait değil; ezilmedi."
      echo "   Kendi kancana şu satırı ekle:"
      echo "   bash \"\${DEV_STARTER_HOME:-\$HOME/dev-starter}/hooks/git-pre-commit.sh\" || exit 1"
    } >&2
    exit 1
  fi
  mkdir -p "$HOOK_DIR"
  cat > "$TARGET" <<'SHIM'
#!/bin/sh
# dev-starter: git-pre-commit (kurulum: bash ~/dev-starter/hooks/git-pre-commit.sh --install)
H="${DEV_STARTER_HOME:-$HOME/dev-starter}/hooks/git-pre-commit.sh"
if [ -f "$H" ]; then
  exec bash "$H"
fi
echo "⚠️  dev-starter bulunamadı ($H): Gate kontrolü ve sır taraması bu commit'te ATLANDI." >&2
exit 0
SHIM
  chmod +x "$TARGET"
  echo "✅ $TARGET kuruldu — terminalden atılan commit'ler de Gate + sır taramasından geçer."
  exit 0
fi

# Claude Code'un PreToolUse:Bash payload'ının aynısı; mesaj bilinmediği için
# yalın `git commit` (bayraksız: index, kancanın gördüğü gerçek index'tir).
PAYLOAD='{"tool_name":"Bash","tool_input":{"command":"git commit"}}'
RC=0

run_hook() {
  local name="$1" code
  shift
  printf '%s' "$PAYLOAD" | bash "$SELF_DIR/$name.sh" "$@"
  code=$?
  if [ "$code" -eq 2 ]; then
    RC=1
  elif [ "$code" -ne 0 ]; then
    echo "⚠️  $name.sh beklenmedik biçimde çıktı (exit $code) — kontrol atlandı." >&2
  fi
}

# gate-guard bilgi satırlarını stdout'a yazar → stderr'e al (git ikisini de
# gösterir ama sıra karışmasın). quality-scan'in stdout'u (fd 3) yalnız
# Claude'a giden JSON özetidir; insan çıktısı zaten stderr'de.
run_hook gate-guard 1>&2
run_hook quality-scan >/dev/null

exit $RC
