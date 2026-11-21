#!/usr/bin/env bash
# CI'in (.github/workflows/ci.yml) yerelde kosabilen adimlari, AYNI komutlar ve
# AYNI sirayla. main'e gondermeden once bu temiz olmali (mistakes.md #123:
# yereldeki "secilmis" kontroller gecti, CI'daki slop taramasi ve health-check
# kirildi). Ag isteyen verify:agentic ve verify:anatomy disarida (opt-in).
#
#   npm run ci:local            # Quality Checks + Ecosystem Health + Storybook tip/adres
#   npm run ci:local -- --build # + Storybook derlemesi (yavas)
#   npm run ci:local -- --tests # + hikaye testleri: play + a11y, gercek Chromium (yavas, ~3 dk)
set -uo pipefail
cd "$(dirname "$0")/.."

FAILED=()
LOG=$(mktemp)
trap 'rm -f "$LOG"' EXIT
# Basarili adim tek satir; kirilan adimin kaydinin son 40 satiri basilir.
step() {
  local name="$1"; shift
  if "$@" >"$LOG" 2>&1; then echo "  ✓ $name"; else echo "  ✗ $name"; tail -40 "$LOG" | sed 's/^/      /'; FAILED+=("$name"); fi
}

# Quality Checks
step "verify:lock"        npm run -s verify:lock
step "lint"               npm run -s lint -- --max-warnings 0
step "typecheck"          npm run -s typecheck
step "unit tests"         npm test --silent
step "build theme"        npm run -s build --workspace=packages/@ahmet/theme
step "build ui"           npm run -s build --workspace=packages/@ahmet/ui
step "verify:exports"     npm run -s verify:exports
step "verify:readme"      npm run -s verify:readme
step "verify:registry"    npm run -s verify:registry
step "verify:kit"         npm run -s verify:kit
step "hook tests"         bash scripts/test-hooks.sh
step "slop-scan tests"    bash scripts/test-slop-scan.sh
step "slop-scan (CI dizinleri)" bash scripts/slop-scan.sh --quiet templates snippets packages/@ahmet/ui/src storybook/stories
# Ecosystem Health: exit kodu da sonuc da bakilir
step "health-check"       bash -c 'out=$(bash scripts/health-check.sh 2>&1); code=$?; echo "$out" | grep -E "SONUC|❌" | tail -5; [ $code -eq 0 ]'
# Storybook Build
step "storybook typecheck" bash -c 'cd storybook && npm run -s typecheck'
step "storybook check:ids" bash -c 'cd storybook && npm run -s check:ids'
if [[ " $* " == *" --build "* ]]; then
  step "storybook build"   bash -c 'cd storybook && npm run -s build >/dev/null'
fi

if [[ " $* " == *" --tests "* ]]; then
  # Onceden kurulu Chromium varsa (bulut oturumu) yolunu ver; yoksa Playwright kendi tarayicisini kullanir.
  [ -z "${SB_CHROMIUM:-}" ] && [ -x /opt/pw-browsers/chromium ] && export SB_CHROMIUM=/opt/pw-browsers/chromium
  step "storybook tests"   bash -c 'cd storybook && npm run -s test:stories'
fi

printf '\n'
if [ ${#FAILED[@]} -eq 0 ]; then echo "✅ ci:local temiz"; exit 0; fi
printf '❌ ci:local: %s adim kirik: %s\n' "${#FAILED[@]}" "$(IFS=,; echo "${FAILED[*]}")"
exit 1
