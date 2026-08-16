#!/usr/bin/env bash
# Hook Davranış Testi
#
# NEDEN VAR: gate-guard.sh ve quality-scan.sh 5 ay boyunca no-op çalıştı.
# Girdiyi TOOL_INPUT environment variable'ından okuyorlardı; Claude Code ise
# STDIN'den JSON veriyor. Her commit sessizce geçti. health-check.sh bu süre
# boyunca "✅ hooks/gate-guard.sh mevcut" deyip 0 hata raporladı —
# çünkü dosyanın VARLIĞINI test ediyordu, DAVRANIŞINI değil.
#
# Bu script davranışı test eder: gerçek Claude Code payload'ı verir ve
# hook'un doğru exit kodunu döndürdüğünü doğrular.
# Bkz. knowledge/mistakes.md #52
#
# Kullanım: bash scripts/test-hooks.sh

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOKS="$REPO_ROOT/hooks"

PASS=0
FAIL=0

ok() {
  echo "  ✅ $1"
  PASS=$((PASS + 1))
}
no() {
  echo "  ❌ $1"
  echo "     beklenen: $2 / alınan: $3"
  FAIL=$((FAIL + 1))
}

# Claude Code'un PreToolUse:Bash hook'una gönderdiği gerçek payload biçimi
payload() {
  printf '{"tool_name":"Bash","tool_input":{"command":%s}}' "$(printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/^/"/; s/$/"/')"
}

SANDBOX=$(mktemp -d)
trap 'rm -rf "$SANDBOX"' EXIT

echo "━━━ hook davranış testi ━━━"
echo

# ─────────────────────────────────────────────────────────────
# gate-guard.sh
# ─────────────────────────────────────────────────────────────
echo "gate-guard.sh"

mkdir -p "$SANDBOX/gate/docs"
cd "$SANDBOX/gate" || exit 1

# (a) Gate PASSED → geçmeli
cat > docs/ROUTEMAP.md <<'EOF'
| ID | Story | Durum | Gate |
|----|-------|-------|------|
| S-01 | Login | IN_PROGRESS | PASSED |
EOF
payload "git commit -m 'feat: x'" | bash "$HOOKS/gate-guard.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 0 ] && ok "Gate PASSED → commit geçer (exit 0)" || no "Gate PASSED → commit geçmeli" 0 "$CODE"

# (b) Gate FAILED → bloklamalı
cat > docs/ROUTEMAP.md <<'EOF'
| ID | Story | Durum | Gate |
|----|-------|-------|------|
| S-01 | Login | IN_PROGRESS | FAILED |
EOF
payload "git commit -m 'feat: x'" | bash "$HOOKS/gate-guard.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "Gate FAILED → commit bloklanır (exit 2)" || no "Gate FAILED → bloklanmalı" 2 "$CODE"

# (c) git commit olmayan komut → dokunmamalı
cat > docs/ROUTEMAP.md <<'EOF'
| ID | Story | Durum | Gate |
|----|-------|-------|------|
| S-01 | Login | IN_PROGRESS | FAILED |
EOF
OUT=$(payload "npm run build" | bash "$HOOKS/gate-guard.sh" 2>&1)
CODE=$?
if [ $CODE -eq 0 ] && [ -z "$OUT" ]; then
  ok "commit dışı komut → sessizce geçer"
else
  no "commit dışı komut → sessiz geçmeli" "exit 0 + boş çıktı" "exit $CODE, çıktı: $OUT"
fi

# (d) ROUTEMAP yoksa uyarır ama bloklamaz
mkdir -p "$SANDBOX/gate-noroutemap" && cd "$SANDBOX/gate-noroutemap" || exit 1
payload "git commit -m x" | bash "$HOOKS/gate-guard.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 0 ] && ok "ROUTEMAP yok → uyarır, bloklamaz" || no "ROUTEMAP yok → bloklamamalı" 0 "$CODE"

echo

# ─────────────────────────────────────────────────────────────
# quality-scan.sh
# ─────────────────────────────────────────────────────────────
echo "quality-scan.sh"

mkdir -p "$SANDBOX/quality" && cd "$SANDBOX/quality" || exit 1
git init -q . 2>/dev/null
git config user.email t@t.t && git config user.name t

# (e) staged secret → hata verip bloklamalı
# Fixture ÇALIŞMA ZAMANINDA birleştirilir. Düz yazılsaydı bu dosyanın kendisi
# quality-scan'in secret desenine takılırdı — tarayıcıyı test eden dosya,
# tarayıcıyı tetiklememeli. Yazılan dosya yine gerçek deseni içerir.
KEY_NAME='api_key'
printf 'const %s = "%s"\n' "$KEY_NAME" 'SUPERSECRETVALUE123456' > leak.ts
git add leak.ts
OUT=$(payload "git commit -m 'feat: x'" | bash "$HOOKS/quality-scan.sh" 2>&1)
CODE=$?
if [ $CODE -eq 2 ] && printf '%s' "$OUT" | grep -q 'SECURITY'; then
  ok "staged secret → bloklanır (exit 2)"
else
  no "staged secret → bloklanmalı" "exit 2 + SECURITY" "exit $CODE, çıktı: $(printf '%s' "$OUT" | head -2)"
fi

# (f) staged .env → bloklamalı
rm -f leak.ts && git rm -q --cached leak.ts 2>/dev/null
printf 'DATABASE_URL=postgres://x\n' > .env
git add -f .env
OUT=$(payload "git commit -m 'feat: x'" | bash "$HOOKS/quality-scan.sh" 2>&1)
CODE=$?
if [ $CODE -eq 2 ] && printf '%s' "$OUT" | grep -q '\.env'; then
  ok ".env commit denemesi → bloklanır (exit 2)"
else
  no ".env → bloklanmalı" "exit 2" "exit $CODE, çıktı: $(printf '%s' "$OUT" | head -2)"
fi

# (g) temiz staged içerik → geçmeli
rm -f .env && git rm -q --cached .env 2>/dev/null
printf 'export const sum = (a: number, b: number) => a + b\n' > clean.ts
git add clean.ts
payload "git commit -m 'feat: x'" | bash "$HOOKS/quality-scan.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 0 ] && ok "temiz içerik → geçer (exit 0)" || no "temiz içerik → geçmeli" 0 "$CODE"

# (h) commit dışı komut → dokunmamalı (secret staged olsa bile)
printf 'const password = "hunter2hunter2"\n' > leak2.ts
git add leak2.ts
OUT=$(payload "ls -la" | bash "$HOOKS/quality-scan.sh" 2>&1)
CODE=$?
if [ $CODE -eq 0 ] && [ -z "$OUT" ]; then
  ok "commit dışı komut → sessizce geçer"
else
  no "commit dışı komut → sessiz geçmeli" "exit 0 + boş" "exit $CODE, çıktı: $OUT"
fi

echo

# ─────────────────────────────────────────────────────────────
# routemap-sync.sh
# ─────────────────────────────────────────────────────────────
echo "routemap-sync.sh"

mkdir -p "$SANDBOX/sync" && cd "$SANDBOX/sync" || exit 1
printf '{"tool_name":"Edit","tool_input":{"file_path":"app/page.tsx"}}' | bash "$HOOKS/routemap-sync.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 0 ] && ok "PostToolUse payload → hata vermeden çalışır" || no "routemap-sync çalışmalı" 0 "$CODE"

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAIL -gt 0 ]; then
  echo "  SONUC: $PASS geçti, $FAIL BAŞARISIZ"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
fi
echo "  SONUC: $PASS davranış testi geçti"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
