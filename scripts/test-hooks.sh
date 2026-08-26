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
# quality-scan.sh — lockfile kontrolü (mistakes.md #57)
#
# Sandbox gerçek verifier'ı kullanır; kopya mantık test edilirse test
# geçerken üretimdeki script bozuk kalabilir.
# ─────────────────────────────────────────────────────────────
echo "quality-scan.sh — kilit tutarlılığı"

mkdir -p "$SANDBOX/lock/scripts" && cd "$SANDBOX/lock" || exit 1
git init -q . 2>/dev/null
git config user.email t@t.t && git config user.name t
cp "$REPO_ROOT/scripts/verify-lockfile.mjs" scripts/verify-lockfile.mjs

# (i) kırık kilit stage'lendi → bloklamalı
#     puppeteer kilitte var, devtools-protocol bağımlılığı yok — CI'ı düşüren
#     bozulmanın birebir aynısı.
cat > package.json <<'EOF'
{ "name": "fixture", "version": "1.0.0", "devDependencies": { "puppeteer": "^25.7.0" } }
EOF
cat > package-lock.json <<'EOF'
{
  "name": "fixture",
  "lockfileVersion": 3,
  "packages": {
    "": { "name": "fixture", "version": "1.0.0", "devDependencies": { "puppeteer": "^25.7.0" } },
    "node_modules/puppeteer": {
      "version": "25.7.0",
      "dev": true,
      "dependencies": { "devtools-protocol": "0.0.1666840" }
    }
  }
}
EOF
git add package.json package-lock.json
OUT=$(payload "git commit -m 'chore: deps'" | bash "$HOOKS/quality-scan.sh" 2>&1)
CODE=$?
if [ $CODE -eq 2 ] && printf '%s' "$OUT" | grep -q 'devtools-protocol'; then
  ok "kırık kilit → commit bloklanır (exit 2)"
else
  no "kırık kilit → bloklanmalı" "exit 2 + eksik paket adı" "exit $CODE, çıktı: $(printf '%s' "$OUT" | head -3)"
fi

# (j) package.json'a eklenip kilide yazılmayan bağımlılık → bloklamalı
cat > package.json <<'EOF'
{ "name": "fixture", "version": "1.0.0", "devDependencies": { "vitest": "^3.2.7" } }
EOF
cat > package-lock.json <<'EOF'
{
  "name": "fixture",
  "lockfileVersion": 3,
  "packages": {
    "": { "name": "fixture", "version": "1.0.0", "devDependencies": {} }
  }
}
EOF
git add package.json package-lock.json
OUT=$(payload "git commit -m 'chore: deps'" | bash "$HOOKS/quality-scan.sh" 2>&1)
CODE=$?
if [ $CODE -eq 2 ] && printf '%s' "$OUT" | grep -q 'vitest'; then
  ok "kilide yazılmayan bağımlılık → bloklanır (exit 2)"
else
  no "senkron olmayan manifest → bloklanmalı" "exit 2 + vitest" "exit $CODE, çıktı: $(printf '%s' "$OUT" | head -3)"
fi

# (k) tutarlı kilit → geçmeli (yanlış alarm commit'i durdurur, en pahalı hata)
cat > package.json <<'EOF'
{ "name": "fixture", "version": "1.0.0", "devDependencies": { "puppeteer": "^25.7.0" } }
EOF
cat > package-lock.json <<'EOF'
{
  "name": "fixture",
  "lockfileVersion": 3,
  "packages": {
    "": { "name": "fixture", "version": "1.0.0", "devDependencies": { "puppeteer": "^25.7.0" } },
    "node_modules/puppeteer": {
      "version": "25.7.0",
      "dev": true,
      "dependencies": { "devtools-protocol": "0.0.1666840" }
    },
    "node_modules/devtools-protocol": { "version": "0.0.1666840", "dev": true }
  }
}
EOF
git add package.json package-lock.json
OUT=$(payload "git commit -m 'chore: deps'" | bash "$HOOKS/quality-scan.sh" 2>&1)
CODE=$?
[ $CODE -eq 0 ] && ok "tutarlı kilit → geçer (exit 0)" || no "tutarlı kilit → geçmeli" 0 "exit $CODE, çıktı: $(printf '%s' "$OUT" | head -3)"

# (l) kilit dosyasına dokunulmayan commit → kontrol hiç çalışmamalı
git rm -q --cached package.json package-lock.json
printf 'export const x = 1\n' > other.ts
git add other.ts
OUT=$(payload "git commit -m 'feat: x'" | bash "$HOOKS/quality-scan.sh" 2>&1)
CODE=$?
if [ $CODE -eq 0 ] && ! printf '%s' "$OUT" | grep -q 'kilit\|lock'; then
  ok "kilide dokunulmadı → kontrol atlanır"
else
  no "kilit dışı commit → kontrol çalışmamalı" "exit 0 + kilit mesajı yok" "exit $CODE, çıktı: $(printf '%s' "$OUT" | head -3)"
fi

echo

# ─────────────────────────────────────────────────────────────
# quality-scan.sh — agentic kontrolleri (mistakes.md #58, #71)
# ─────────────────────────────────────────────────────────────
echo "quality-scan.sh — agentic kontrolleri"

mkdir -p "$SANDBOX/agentic" && cd "$SANDBOX/agentic" || exit 1
git init -q . 2>/dev/null
git config user.email t@t.t && git config user.name t

# (j) tool sonucu doğrulanmadan cast → uyarı vermeli (bloklamamalı)
cat > card.tsx <<'EOF'
import { useRenderTool } from '@copilotkit/react-core/v2'
export function Card({ result }: { result: string }) {
  const data = JSON.parse(result) as { ok: boolean }
  return <p>{String(data.ok)}</p>
}
EOF
git add card.tsx
OUT=$(payload "git commit -m 'feat: x'" | bash "$HOOKS/quality-scan.sh" 2>&1)
CODE=$?
if [ $CODE -eq 0 ] && printf '%s' "$OUT" | grep -q 'AGENTIC.*cast'; then
  ok "doğrulanmamış tool sonucu → uyarır, bloklamaz (exit 0)"
else
  no "doğrulanmamış cast → uyarmalı" "exit 0 + AGENTIC uyarısı" "exit $CODE, çıktı: $(printf '%s' "$OUT" | head -3)"
fi

# (k) güvenli parse → uyarı VERMEMELİ (yanlış pozitif kontrolü)
rm -f card.tsx && git rm -q --cached card.tsx 2>/dev/null
cat > safe.tsx <<'EOF'
import { useRenderTool } from '@copilotkit/react-core/v2'
export function parseResult(raw: string) {
  let parsed: unknown
  try { parsed = JSON.parse(raw) } catch { return undefined }
  const c = parsed as { ok?: unknown } | null
  return typeof c?.ok === 'boolean' ? { ok: c.ok } : undefined
}
EOF
git add safe.tsx
OUT=$(payload "git commit -m 'feat: x'" | bash "$HOOKS/quality-scan.sh" 2>&1)
CODE=$?
if [ $CODE -eq 0 ] && ! printf '%s' "$OUT" | grep -q 'AGENTIC.*cast'; then
  ok "güvenli parse → uyarı yok (yanlış pozitif yok)"
else
  no "güvenli parse → uyarmamalı" "exit 0, AGENTIC uyarısı YOK" "exit $CODE, çıktı: $(printf '%s' "$OUT" | head -3)"
fi

# (l) @ag-ui/* aralıkla yazılmış → uyarı vermeli
rm -f safe.tsx && git rm -q --cached safe.tsx 2>/dev/null
printf '{"dependencies":{"@ag-ui/client":"^0.0.57"}}
' > package.json
git add package.json
OUT=$(payload "git commit -m 'chore: x'" | bash "$HOOKS/quality-scan.sh" 2>&1)
CODE=$?
if printf '%s' "$OUT" | grep -q 'AGENTIC.*@ag-ui'; then
  ok "@ag-ui/* aralık sürümü → uyarır"
else
  no "@ag-ui aralık → uyarmalı" "AGENTIC @ag-ui uyarısı" "exit $CODE, çıktı: $(printf '%s' "$OUT" | head -3)"
fi

# (m) @ag-ui/* sabit sürüm → uyarı VERMEMELİ
printf '{"dependencies":{"@ag-ui/client":"0.0.57"}}
' > package.json
git add package.json
OUT=$(payload "git commit -m 'chore: x'" | bash "$HOOKS/quality-scan.sh" 2>&1)
if ! printf '%s' "$OUT" | grep -q 'AGENTIC.*@ag-ui'; then
  ok "@ag-ui/* sabit sürüm → uyarı yok"
else
  no "sabit sürüm → uyarmamalı" "AGENTIC @ag-ui uyarısı YOK" "çıktı: $(printf '%s' "$OUT" | head -3)"
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
