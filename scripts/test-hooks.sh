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

# Hook'lar önce CLAUDE_PROJECT_DIR'a sabitlenir; kabukta dışa aktarılmış bir
# değer testleri sandbox yerine o dizine gönderirdi. Gereken testler onu
# kendisi verir.
unset CLAUDE_PROJECT_DIR

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
PW_NAME='password'
printf 'const %s = "%s"\n' "$PW_NAME" 'hunter2hunter2' > leak2.ts
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
# Sandbox'ta scripts/ YOK — gerçek şablon projelerinde de yok. Hook gerçek
# verifier'ı kendi ağacından bulmalı; eskiden test onu sandbox'a kopyalıyordu
# ve kontrolün şablon projelerinde hiç çalışmadığı bu yüzden görünmedi.
# ─────────────────────────────────────────────────────────────
echo "quality-scan.sh — kilit tutarlılığı"

mkdir -p "$SANDBOX/lock" && cd "$SANDBOX/lock" || exit 1
git init -q . 2>/dev/null
git config user.email t@t.t && git config user.name t

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

# (k2) workspace manifest'ine eklenip kilide yazılmayan bağımlılık → bloklamalı
# (doğrulayıcı eskiden yalnız kök manifest'e bakıyordu: ✅ deyip npm ci'da
# "Missing: … from lock file" ile düşüyordu)
mkdir -p packages/a
printf '{ "name": "fixture", "version": "1.0.0", "workspaces": ["packages/*"] }\n' > package.json
printf '{ "name": "a", "version": "1.0.0", "dependencies": { "left-pad": "^1.3.0" } }\n' > packages/a/package.json
cat > package-lock.json <<'EOF'
{
  "name": "fixture",
  "lockfileVersion": 3,
  "packages": {
    "": { "name": "fixture", "version": "1.0.0", "workspaces": ["packages/*"] },
    "node_modules/a": { "resolved": "packages/a", "link": true },
    "packages/a": { "name": "a", "version": "1.0.0" }
  }
}
EOF
git add package.json package-lock.json packages/a/package.json
OUT=$(payload "git commit -m 'chore: deps'" | bash "$HOOKS/quality-scan.sh" 2>&1)
CODE=$?
if [ $CODE -eq 2 ] && printf '%s' "$OUT" | grep -q 'left-pad'; then
  ok "workspace'teki kilitsiz bağımlılık → bloklanır (exit 2)"
else
  no "workspace manifest'i de kilitle karşılaştırılmalı" "exit 2 + left-pad" "exit $CODE"
fi
git rm -q --cached packages/a/package.json && rm -rf packages

# (l) kilit dosyasına dokunulmayan commit → kontrol hiç çalışmamalı
# Çalışma ağacına stage'lenmemiş SENKRONSUZ kilit yazılır: kontrol yanlışlıkla
# koşarsa exit 2 verir. Tutarlı kilitle "atlandı" ile "koştu ve geçti" ayırt
# edilemiyordu (doğrulayıcı yalnız hatada çıktı basar).
git rm -q --cached package.json package-lock.json
printf '{ "name": "fixture", "version": "1.0.0", "devDependencies": { "vitest": "^3.2.7" } }\n' > package.json
printf '{ "name": "fixture", "lockfileVersion": 3, "packages": { "": { "name": "fixture", "version": "1.0.0", "devDependencies": {} } } }\n' > package-lock.json
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

# (m) @ag-ui/* sabit sürüm → uyarı VERMEMELİ (exit kodu da temiz:
# yalnız çıktı yokluğuna bakmak, bloklayan bir regresyonu yeşil geçirir)
printf '{"dependencies":{"@ag-ui/client":"0.0.57"}}
' > package.json
git add package.json
OUT=$(payload "git commit -m 'chore: x'" | bash "$HOOKS/quality-scan.sh" 2>&1)
CODE=$?
if [ $CODE -eq 0 ] && ! printf '%s' "$OUT" | grep -q 'AGENTIC.*@ag-ui'; then
  ok "@ag-ui/* sabit sürüm → uyarı yok (exit 0)"
else
  no "sabit sürüm → uyarmamalı" "exit 0 + AGENTIC uyarısı YOK" "exit $CODE, çıktı: $(printf '%s' "$OUT" | head -3)"
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
# ─────────────────────────────────────────────────────────────
# gate-guard.sh — RESMİ şablon düzeniyle (mistakes.md #99)
#
# Eski fixture 4 kolonluydu; resmi ROUTEMAP.template.md 7 kolon ve hook
# Gate yerine Assign kolonunu okuyordu. Bu testler ŞABLONUN BİREBİR
# düzenini kullanır — fixture formatı şablondan saparsa bu sınıf hata
# yine görünmez olur.
# ─────────────────────────────────────────────────────────────
echo "gate-guard.sh — resmi şablon düzeni"

mkdir -p "$SANDBOX/gate7/docs"
cd "$SANDBOX/gate7" || exit 1

# (q) 7 kolon + PASSED + Assign dolu → geçmeli (eski kod Assign'ı okuyup bloklardı)
cat > docs/ROUTEMAP.md <<'EOF'
## Faz Durumu

| Faz | Durum | Başlangıç | Bitiş |
|-----|-------|-----------|-------|
| Development | IN_PROGRESS | 2026-10-01 | |

## Story Takibi

| ID | Başlık | Faz | Öncelik | Durum | Gate | Assign |
|----|--------|-----|---------|-------|------|--------|
| STORY-001 | Giriş ekranı | 1 | HIGH | IN_PROGRESS | PASSED | FE |
EOF
payload "git commit -m 'feat: x'" | bash "$HOOKS/gate-guard.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 0 ] && ok "7 kolon, Gate PASSED, Assign dolu → geçer (Assign'ı Gate sanmaz)" || no "7 kolonlu şablonda PASSED geçmeli" 0 "$CODE"

# (r) 7 kolon + IN_REVIEW + FAILED → bloklamalı
cat > docs/ROUTEMAP.md <<'EOF'
| ID | Başlık | Faz | Öncelik | Durum | Gate | Assign |
|----|--------|-----|---------|-------|------|--------|
| STORY-002 | Panel | 1 | HIGH | IN_REVIEW | FAILED | BE |
EOF
payload "git commit -m 'feat: x'" | bash "$HOOKS/gate-guard.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "IN_REVIEW + FAILED → bloklanır (exit 2)" || no "IN_REVIEW + FAILED bloklanmalı" 2 "$CODE"

# (s) Faz tablosunda IN_PROGRESS var ama story tablosunda aktif yok → geçmeli
cat > docs/ROUTEMAP.md <<'EOF'
## Faz Durumu

| Faz | Durum | Başlangıç | Bitiş |
|-----|-------|-----------|-------|
| Development | IN_PROGRESS | 2026-10-01 | |

## Story Takibi

| ID | Başlık | Faz | Öncelik | Durum | Gate | Assign |
|----|--------|-----|---------|-------|------|--------|
| STORY-001 | Giriş ekranı | 1 | HIGH | DONE | PASSED | FE |
EOF
payload "git commit -m 'feat: x'" | bash "$HOOKS/gate-guard.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 0 ] && ok "faz satırındaki IN_PROGRESS story sanılmaz → geçer" || no "faz tablosu yanlış pozitif vermemeli" 0 "$CODE"

# (t) Yalnız doküman staged + Gate geçilmemiş → muafiyetle geçmeli
mkdir -p "$SANDBOX/gatedoc/docs" && cd "$SANDBOX/gatedoc" || exit 1
git init -q . 2>/dev/null
git config user.email t@t.t && git config user.name t
cat > docs/ROUTEMAP.md <<'EOF'
| ID | Başlık | Faz | Öncelik | Durum | Gate | Assign |
|----|--------|-----|---------|-------|------|--------|
| STORY-001 | Giriş ekranı | 1 | HIGH | IN_PROGRESS | — | FE |
EOF
echo "# notlar" > README.md
git add README.md
payload "git commit -m 'docs: notlar'" | bash "$HOOKS/gate-guard.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 0 ] && ok "yalnız .md staged → Gate istemez (docs muafiyeti)" || no "doc-only commit muaf olmalı" 0 "$CODE"

# (u) Kod da staged → muafiyet yok, bloklamalı
echo "export const x = 1" > util.ts
git add util.ts
payload "git commit -m 'feat: x'" | bash "$HOOKS/gate-guard.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "kod staged + Gate yok → bloklanır" || no "kodlu commit bloklanmalı" 2 "$CODE"
git rm -q --cached util.ts && rm -f util.ts

# (u2) 1 .md staged + commit -a → muafiyet UYGULANMAZ, bloklamalı
# (-a kodu commit anında stage'ler; "1 doküman göster, kodu -a ile geçir" açığı)
git add README.md
payload "git commit -am 'docs: x'" | bash "$HOOKS/gate-guard.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok ".md staged ama -a var → muafiyet yok, bloklanır" || no "-a'lı commit muaf olmamalı" 2 "$CODE"

# (u3) commit OLMAYAN ama 'commit' sözcüğü geçen komut → dokunmamalı
payload "git show --stat commit-abc" | bash "$HOOKS/gate-guard.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 0 ] && ok "git show ... commit-abc → commit sanılmaz (exit 0)" || no "show komutu bloklanmamalı" 0 "$CODE"

# (u4) Satır sonu ters bölüyle bölünmüş commit → yine yakalanmalı
# (payload() çok satırlı girdiyi JSON'a çeviremez; JSON elle kurulur:
#  komut metni = `git \` + yeni satır + `commit -m "feat: x"`.
#  Önce index temizlenir — u2'den kalan .md docs muafiyetini tetiklemesin.)
git rm -q --cached README.md 2>/dev/null || true
printf '%s' '{"tool_name":"Bash","tool_input":{"command":"git \\\ncommit -m \"feat: x\""}}' | bash "$HOOKS/gate-guard.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "çok satırlı 'git \\<newline>commit' → yakalanır, bloklanır" || no "çok satırlı commit yakalanmalı" 2 "$CODE"

# (u5) 'git commit' yalnızca METİN olarak geçen komut → dokunmamalı
# (grep/echo/sed içindeki anma commit değildir; eski desen bloklardı)
payload "grep -rn \"git commit\" docs/" | bash "$HOOKS/gate-guard.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 0 ] && ok "metin içinde 'git commit' → commit sanılmaz (exit 0)" || no "grep komutu bloklanmamalı" 0 "$CODE"

# (u6) Zincirde gerçek commit (cd x && git commit) → yakalanmalı
payload "cd . && git commit -m 'feat: x'" | bash "$HOOKS/gate-guard.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "zincirdeki gerçek commit → yakalanır, bloklanır" || no "zincirli commit yakalanmalı" 2 "$CODE"

# (u7) Çok komutlu satırlar (git add↵git commit) → yakalanmalı
printf '%s' '{"tool_name":"Bash","tool_input":{"command":"git add .\ngit commit -m \"feat: x\""}}' | bash "$HOOKS/gate-guard.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "yeni satırla ayrılmış commit → yakalanır, bloklanır" || no "çok komutlu commit yakalanmalı" 2 "$CODE"

# (u8) CRLF kaydedilmiş ROUTEMAP → Gate kontrolü yine çalışmalı
mkdir -p "$SANDBOX/gatecrlf/docs" && cd "$SANDBOX/gatecrlf" || exit 1
printf '| ID | Başlık | Faz | Öncelik | Durum | Gate | Assign |\r\n|----|--------|-----|---------|-------|------|--------|\r\n| STORY-001 | Giriş | 1 | HIGH | IN_PROGRESS | FAILED | FE |\r\n' > docs/ROUTEMAP.md
payload "git commit -m 'feat: x'" | bash "$HOOKS/gate-guard.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "CRLF'li ROUTEMAP → tablo tanınır, bloklanır" || no "CRLF kontrolü kapatmamalı" 2 "$CODE"

# (u10) Pathspec'li commit, yalnız .md staged → muafiyet YOK, bloklamalı
# ("1 .md stage'le, kodu `git commit code.ts` ile geçir" açığı)
cd "$SANDBOX/gatedoc" || exit 1
git add README.md 2>/dev/null
payload "git commit -m 'docs: x' code.ts" | bash "$HOOKS/gate-guard.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "pathspec'li commit → muafiyet yok, bloklanır" || no "pathspec muafiyeti delmemeli" 2 "$CODE"

# (u11) Zincirde `git add` + yalnız .md staged → muafiyet YOK, bloklamalı
payload "git add -A && git commit -m 'docs: x'" | bash "$HOOKS/gate-guard.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "add && commit zinciri → muafiyet yok, bloklanır" || no "add zinciri muafiyeti delmemeli" 2 "$CODE"
git rm -q --cached README.md 2>/dev/null || true

# (u12) Heredoc GÖVDESİNDE 'git commit' geçen doküman yazımı → dokunmamalı
# (yanlış alarm commit'i değil, Bash çağrısının kendisini blokluyordu)
printf '%s' '{"tool_name":"Bash","tool_input":{"command":"cat > docs/kurulum.md <<'"'"'EOF'"'"'\nAdım: git commit -m mesaj\nEOF"}}' | bash "$HOOKS/gate-guard.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 0 ] && ok "heredoc gövdesindeki 'git commit' → commit sanılmaz" || no "heredoc yanlış bloklanmamalı" 0 "$CODE"

# (u13) Tırnaklı/boşluklu env ataması önekli commit → yakalanmalı
payload "GIT_AUTHOR_NAME=\"Ahmet Akyapı\" git commit -m 'feat: x'" | bash "$HOOKS/gate-guard.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "tırnaklı env önekli commit → yakalanır, bloklanır" || no "env önekli commit yakalanmalı" 2 "$CODE"

# (u14) Çift tırnak içindeki apostrof + sonra tek tırnak → commit yine görülmeli
# (iki ayrı geçişli tırnak silme "Ahmet'in"in apostrofunu sonraki tek tırnakla
# eşleyip aradaki `git commit`i de siliyordu; iki hook da exit 0 veriyordu)
payload "echo \"Ahmet'in\" ; git commit -m 'feat: x'" | bash "$HOOKS/gate-guard.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "\"Ahmet'in\" + tek tırnaklı mesaj → commit yakalanır" || no "apostrof commit'i gizlememeli" 2 "$CODE"

# (u15) Aynı açık Claude'un standart heredoc commit'inde (<<'EOF')
printf '%s' '{"tool_name":"Bash","tool_input":{"command":"git add \"src/Ahmet'"'"'in.ts\" && git commit -m \"$(cat <<'"'"'EOF'"'"'\nfeat: giriş ekranı\nEOF\n)\""}}' | bash "$HOOKS/gate-guard.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "apostroflu yol + <<'EOF' heredoc commit → yakalanır" || no "heredoc commit apostrofla kaçmamalı" 2 "$CODE"

# (u16) if/then içindeki commit → yakalanmalı (önek listesi yalnız VAR= ve
# `command` tanıyordu; then/do/{/!/time/env/exec ve /usr/bin/git kaçıyordu)
payload "if ! git diff --cached --quiet; then git commit -m 'feat: x'; fi" | bash "$HOOKS/gate-guard.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "if ...; then git commit → yakalanır" || no "then önekli commit yakalanmalı" 2 "$CODE"

# (u17) <<- heredoc'u sekmeli sonlandırıcıyla kapanır, sonraki commit görülmeli
printf '%s' '{"tool_name":"Bash","tool_input":{"command":"cat <<-EOF > notlar.txt\n\tgövde\n\tEOF\ngit commit -m \"feat: x\""}}' | bash "$HOOKS/gate-guard.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "<<- heredoc sonrası commit → yakalanır" || no "<<- heredoc commit'i yutmamalı" 2 "$CODE"

# (u18) Tırnaklı pathspec (Next route grubu) + yalnız .md staged → muafiyet YOK
# (tırnaklı bölge silinince pathspec görünmez oluyordu; `git commit <yol>`
# çalışma ağacındaki hâli commit'ler)
git add README.md
payload "git commit -m 'docs: notlar' 'app/(panel)/page.tsx'" | bash "$HOOKS/gate-guard.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "tırnaklı pathspec ('app/(panel)/...') → muafiyet yok, bloklanır" || no "tırnaklı pathspec muafiyeti delmemeli" 2 "$CODE"

# (u19) Yalnız .md staged + heredoc mesajı → muafiyet KALMALI (mesaj, -m'nin
# değeri; pathspec sayılırsa her doküman commit'i Gate ister)
printf '%s' '{"tool_name":"Bash","tool_input":{"command":"git commit -m \"$(cat <<'"'"'EOF'"'"'\ndocs: notlar\nEOF\n)\""}}' | bash "$HOOKS/gate-guard.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 0 ] && ok ".md + heredoc mesajı → docs muafiyeti sürer (exit 0)" || no "-m değeri pathspec sayılmamalı" 0 "$CODE"
git rm -q --cached README.md 2>/dev/null || true

# (u19b) ASCII dışı adlı doküman → muafiyet yine uygulanmalı (core.quotePath
# varsayılanı adı "notlar/\303\266neriler.md" diye tırnaklı verir; .md ile bitmez)
mkdir -p notlar && echo "# öneri" > 'notlar/öneriler.md' && git add 'notlar/öneriler.md'
payload "git commit -m 'docs: öneriler'" | bash "$HOOKS/gate-guard.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 0 ] && ok "Türkçe adlı .md → docs muafiyeti uygulanır" || no "ASCII dışı .md muaf olmalı" 0 "$CODE"
git rm -q --cached 'notlar/öneriler.md' && rm -rf notlar

# (u20) Alt klasörden commit → ROUTEMAP proje kökünde bulunmalı
# (hook Claude'un o anki dizininde koşar; `cd src` sonrası Gate atlanıyordu.
#  docs/ seçilmez: oradan göreli ROUTEMAP.md yine bulunur, açık görünmez.)
mkdir -p "$SANDBOX/gatedoc/src"
OUT=$( (cd "$SANDBOX/gatedoc/src" && payload "git commit -m 'feat: x'" | bash "$HOOKS/gate-guard.sh") 2>&1 )
CODE=$?
[ $CODE -eq 2 ] && ok "alt klasörden commit → git köküne sabitlenir, bloklanır" || no "alt klasör Gate'i atlatmamalı" 2 "exit $CODE, çıktı: $(printf '%s' "$OUT" | head -2)"

# (u21) git dışı dizinden, CLAUDE_PROJECT_DIR verili → proje köküne sabitlenir
( cd "$SANDBOX" && payload "git commit -m 'feat: x'" | CLAUDE_PROJECT_DIR="$SANDBOX/gatedoc" bash "$HOOKS/gate-guard.sh" ) >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "CLAUDE_PROJECT_DIR → ROUTEMAP proje kökünden okunur" || no "CLAUDE_PROJECT_DIR'a sabitlenmeli" 2 "$CODE"

# (u21b) Worktree'de commit → worktree'nin ROUTEMAP'i ve index'i okunmalı.
# CLAUDE_PROJECT_DIR oturumun başladığı kökte SABİT kalır (EnterWorktree, alt
# ajan `isolation: worktree`); ona gitmek ana checkout'un ROUTEMAP'ini okuyup
# worktree'deki Gate'siz story'yi geçiriyordu.
mkdir -p "$SANDBOX/wtana/docs" && cd "$SANDBOX/wtana" || exit 1
git init -q . 2>/dev/null
git config user.email t@t.t && git config user.name t
cat > docs/ROUTEMAP.md <<'EOF'
| ID | Başlık | Faz | Öncelik | Durum | Gate | Assign |
|----|--------|-----|---------|-------|------|--------|
| STORY-001 | Giriş ekranı | 1 | HIGH | DONE | PASSED | FE |
EOF
git add -A && git commit -qm "docs: routemap" >/dev/null 2>&1
git worktree add -q -b panel "$SANDBOX/wtpanel" >/dev/null 2>&1
cd "$SANDBOX/wtpanel" || exit 1
printf '| STORY-002 | Panel | 1 | HIGH | IN_PROGRESS | FAILED | FE |\n' >> docs/ROUTEMAP.md
echo "export const x = 1" > panel.ts && git add -A
payload "git commit -m 'feat: panel'" | CLAUDE_PROJECT_DIR="$SANDBOX/wtana" bash "$HOOKS/gate-guard.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "worktree'de commit → worktree'nin ROUTEMAP'i okunur, bloklanır" || no "worktree Gate'i ana checkout'tan okumamalı" 2 "$CODE"

# (u21c) Monorepo alt projesi: ROUTEMAP git kökünde değil alt projede
# → o anki dizinden yukarı çıkılıp en yakın ROUTEMAP bulunmalı (git köküne
# gitmek ROUTEMAP'i kaçırır, Gate atlanır)
mkdir -p "$SANDBOX/mono/apps/web/docs" "$SANDBOX/mono/apps/web/src" && cd "$SANDBOX/mono" || exit 1
git init -q . 2>/dev/null
git config user.email t@t.t && git config user.name t
cat > apps/web/docs/ROUTEMAP.md <<'EOF'
| ID | Başlık | Faz | Öncelik | Durum | Gate | Assign |
|----|--------|-----|---------|-------|------|--------|
| STORY-001 | Giriş ekranı | 1 | HIGH | IN_PROGRESS | FAILED | FE |
EOF
echo "export const x = 1" > apps/web/src/x.ts && git add -A
( cd apps/web/src && payload "git commit -m 'feat: x'" | CLAUDE_PROJECT_DIR="$SANDBOX/mono/apps/web" bash "$HOOKS/gate-guard.sh" ) >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "monorepo alt projesi → en yakın ROUTEMAP okunur" || no "alt proje ROUTEMAP'i kaçmamalı" 2 "$CODE"
# (u21d) Oturum monorepo KÖKÜNDE başladı (CLAUDE_PROJECT_DIR=kök), Claude
# `cd apps/web` yaptı → alt projenin ROUTEMAP'i yine okunmalı
( cd apps/web && payload "git commit -m 'feat: x'" | CLAUDE_PROJECT_DIR="$SANDBOX/mono" bash "$HOOKS/gate-guard.sh" ) >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "oturum kökte, cwd alt projede → alt projenin ROUTEMAP'i okunur" || no "kökte başlayan oturum alt proje Gate'ini atlamamalı" 2 "$CODE"
cd "$SANDBOX/gatedoc" || exit 1

# (u9) Gate kolonu eklenmiş FAZ tablosu (ID yok) → story sanılmamalı
cat > docs/ROUTEMAP.md <<'EOF'
| Faz | Durum | Gate | Bitiş |
|-----|-------|------|-------|
| Development | IN_PROGRESS | — | |
EOF
payload "git commit -m 'feat: x'" | bash "$HOOKS/gate-guard.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 0 ] && ok "ID'siz Gate'li faz tablosu → story sanılmaz (exit 0)" || no "faz tablosu bloklamamalı" 0 "$CODE"

# (u22) Büyük staged liste (>64 KB ad) + başta kod dosyası → muafiyet YOK
# `echo | grep -q` erken çıkınca echo SIGPIPE alıyor, pipefail + `!` bunu
# "hepsi doküman" diye okuyup kodlu commit'i muaf tutuyordu.
mkdir -p "$SANDBOX/gatebig/docs" && cd "$SANDBOX/gatebig" || exit 1
git init -q . 2>/dev/null
git config user.email t@t.t && git config user.name t
cat > docs/ROUTEMAP.md <<'EOF'
| ID | Başlık | Faz | Öncelik | Durum | Gate | Assign |
|----|--------|-----|---------|-------|------|--------|
| STORY-001 | Giriş ekranı | 1 | HIGH | IN_PROGRESS | — | FE |
EOF
echo "export const x = 1" > app.ts
LONG=$(printf 'n%.0s' $(seq 200))
i=0
while [ $i -lt 450 ]; do echo "# $i" > "docs/$LONG-$i.md"; i=$((i + 1)); done
git add app.ts docs
payload "git commit -m 'docs: toplu'" | bash "$HOOKS/gate-guard.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "büyük liste + kod dosyası → SIGPIPE muafiyet açmaz, bloklanır" || no "büyük listede muafiyet olmamalı" 2 "$CODE"

echo
# ─────────────────────────────────────────────────────────────
# quality-scan.sh — güvenlik ve TDD kontrolleri (yeni desenler)
# ─────────────────────────────────────────────────────────────
echo "quality-scan.sh — genişletilmiş güvenlik + TDD"

mkdir -p "$SANDBOX/sec" && cd "$SANDBOX/sec" || exit 1
git init -q . 2>/dev/null
git config user.email t@t.t && git config user.name t

# (v) AWS access key → bloklamalı
printf 'const key = "AKIAIOSFODNN7EXAMPLE"\n' > aws.ts
git add aws.ts
payload "git commit -m 'feat: x'" | bash "$HOOKS/quality-scan.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "AWS access key → bloklanır (exit 2)" || no "AKIA deseni bloklanmalı" 2 "$CODE"
git rm -q --cached aws.ts && rm -f aws.ts

# (w) İç içe .env dosyası → bloklamalı
mkdir -p config && printf 'DB=prod\n' > config/.env.production
git add -f config/.env.production
payload "git commit -m 'chore: x'" | bash "$HOOKS/quality-scan.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "config/.env.production → bloklanır" || no "iç içe .env bloklanmalı" 2 "$CODE"
git rm -q --cached config/.env.production && rm -rf config

# (x) .env.example → geçmeli
printf 'DB=\n' > .env.example
git add .env.example
payload "git commit -m 'chore: x'" | bash "$HOOKS/quality-scan.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 0 ] && ok ".env.example → geçer (değer taşımaz)" || no ".env.example geçmeli" 0 "$CODE"
git rm -q --cached .env.example && rm -f .env.example

# (y) fix commit'i, kod var test yok → uyarmalı (bloklamadan)
printf 'export const fix = 1\n' > bug.ts
git add bug.ts
OUT=$(payload "git commit -m 'fix: hata giderildi'" | bash "$HOOKS/quality-scan.sh" 2>&1)
CODE=$?
if [ $CODE -eq 0 ] && printf '%s' "$OUT" | grep -q 'BUGFIX'; then
  ok "fix + test yok → uyarır, bloklamaz"
else
  no "fix testsiz → uyarmalı" "exit 0 + BUGFIX uyarısı" "exit $CODE, çıktı: $(printf '%s' "$OUT" | head -3)"
fi

# (y1) Aynı uyarı MODELE ulaşmalı: exit 0'da stderr ve düz stdout Claude'a
# gitmez; uyarılar stdout'ta hookSpecificOutput.additionalContext JSON'u olur.
OUT=$(payload "git commit -m 'fix: hata giderildi'" | bash "$HOOKS/quality-scan.sh" 2>/dev/null)
CODE=$?
CTX=$(printf '%s' "$OUT" | python3 -c 'import json,sys; print(json.load(sys.stdin)["hookSpecificOutput"]["additionalContext"])' 2>/dev/null \
  || printf '%s' "$OUT" | jq -r '.hookSpecificOutput.additionalContext' 2>/dev/null || true)
if [ $CODE -eq 0 ] && printf '%s' "$CTX" | grep -q 'BUGFIX'; then
  ok "uyarı stdout'ta JSON additionalContext → modele ulaşır"
else
  no "uyarı modele JSON ile ulaşmalı" "exit 0 + additionalContext içinde BUGFIX" "exit $CODE, stdout: $(printf '%s' "$OUT" | head -3)"
fi

# (y2) fix commit'i test değişikliğiyle → BUGFIX uyarısı olmamalı (exit 0 da)
printf 'test("bug", () => {})\n' > bug.test.ts
git add bug.test.ts
OUT=$(payload "git commit -m 'fix: hata giderildi'" | bash "$HOOKS/quality-scan.sh" 2>&1)
CODE=$?
if [ $CODE -eq 0 ] && ! printf '%s' "$OUT" | grep -q 'BUGFIX'; then
  ok "fix + test birlikte → BUGFIX uyarısı yok (exit 0)"
else
  no "fix+test uyarmamalı" "exit 0 + BUGFIX uyarısı YOK" "exit $CODE, çıktı: $(printf '%s' "$OUT" | head -3)"
fi
git rm -q --cached bug.ts bug.test.ts && rm -f bug.ts bug.test.ts

# (z) test dosyasına .only eklenmesi → uyarmalı
printf 'it.only("tek", () => {})\n' > odak.test.ts
git add odak.test.ts
OUT=$(payload "git commit -m 'test: odak'" | bash "$HOOKS/quality-scan.sh" 2>&1)
CODE=$?
if [ $CODE -eq 0 ] && printf '%s' "$OUT" | grep -q 'TEST'; then
  ok ".only eklenmesi → uyarır"
else
  no ".only → uyarmalı" "exit 0 + TEST uyarısı" "exit $CODE, çıktı: $(printf '%s' "$OUT" | head -3)"
fi
git rm -q --cached odak.test.ts && rm -f odak.test.ts

# (v2) TEK tırnaklı secret → bloklamalı (eski desen [\"\x27] apostrofu
# sınıfa hiç almıyordu — ERE'de \x27 üç ayrı karakterdir; mistakes.md #99 sınıfı)
printf "const %s = '%s'\n" "$PW_NAME" 'cokgizlisifre123' > tek.ts
git add tek.ts
payload "git commit -m 'feat: x'" | bash "$HOOKS/quality-scan.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "tek tırnaklı secret → bloklanır" || no "tek tırnaklı secret bloklanmalı" 2 "$CODE"
git rm -q --cached tek.ts && rm -f tek.ts

# (v3) Boşluklu dosya adındaki secret → bloklamalı (NUL'suz xargs adı bölüyordu)
printf 'const %s = "%s"\n' "$KEY_NAME" 'gizlideger12345' > "gizli anahtar.ts"
git add "gizli anahtar.ts"
payload "git commit -m 'feat: x'" | bash "$HOOKS/quality-scan.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "boşluklu dosya adındaki secret → bloklanır" || no "boşluklu addaki secret bloklanmalı" 2 "$CODE"
git rm -q --cached "gizli anahtar.ts" && rm -f "gizli anahtar.ts"

# (v3b) .md dosyasındaki SERT sır (AKIA) → bloklamalı (README sızıntısı da sızıntı)
printf '# Notlar\nAKIAIOSFODNN7EXAMPLE\n' > sir-notu.md
git add sir-notu.md
payload "git commit -m 'docs: x'" | bash "$HOOKS/quality-scan.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok ".md içindeki AWS anahtarı → bloklanır" || no ".md'deki sert sır bloklanmalı" 2 "$CODE"
git rm -q --cached sir-notu.md && rm -f sir-notu.md

# (v3c) .md içindeki örnek DSN (user:pass@) → geçmeli (doküman örneği meşru)
printf '# Kurulum\npostgres://user:pass@localhost/db\n' > kurulum.md
git add kurulum.md
payload "git commit -m 'docs: x'" | bash "$HOOKS/quality-scan.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 0 ] && ok ".md'deki örnek DSN → geçer" || no ".md DSN örneği bloklanmamalı" 0 "$CODE"
git rm -q --cached kurulum.md && rm -f kurulum.md

# (v4) commit -a: stage'LENMEMİŞ secret → bloklamalı (index boş diye kaçmaz)
printf 'temiz\n' > izli.ts && git add izli.ts && git commit -qm "chore: taban" >/dev/null 2>&1
printf 'const key = "AKIAIOSFODNN7EXAMPLE"\n' > izli.ts
payload "git commit -am 'feat: x'" | bash "$HOOKS/quality-scan.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "commit -a + stage'lenmemiş secret → bloklanır" || no "-a ile secret kaçmamalı" 2 "$CODE"
git checkout -q -- izli.ts

# (v5) İZLENMEYEN .env + `git add -A && git commit` zinciri → bloklamalı
# (hook add'den önce koşar; untracked dosya diff HEAD'de de görünmüyordu)
printf 'DATABASE_URL=postgres://u:gercekparola@db/x\n' > .env
OUT=$(payload "git add -A && git commit -m 'feat: x'" | bash "$HOOKS/quality-scan.sh" 2>&1)
CODE=$?
if [ $CODE -eq 2 ] && printf '%s' "$OUT" | grep -q '\.env'; then
  ok "untracked .env + add&&commit zinciri → bloklanır"
else
  no "add zincirindeki .env kaçmamalı" "exit 2 + .env" "exit $CODE, çıktı: $(printf '%s' "$OUT" | head -3)"
fi
rm -f .env

# (v6) İzlenen ama STAGE'LENMEMİŞ sır + pathspec'li commit → bloklamalı
printf 'const key = "AKIAIOSFODNN7EXAMPLE"\n' > izli.ts
payload "git commit -m 'feat: x' izli.ts" | bash "$HOOKS/quality-scan.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "pathspec'li commit'teki sır → bloklanır" || no "pathspec'li sır kaçmamalı" 2 "$CODE"
git checkout -q -- izli.ts

# (z2) Düzensiz commit mesajı → uyarmalı
printf 'export const a = 1\n' > duz.ts
git add duz.ts
OUT=$(payload "git commit -m 'duzeltmeler yapildi'" | bash "$HOOKS/quality-scan.sh" 2>&1)
CODE=$?
if [ $CODE -eq 0 ] && printf '%s' "$OUT" | grep -q 'COMMIT'; then
  ok "format dışı mesaj → uyarır"
else
  no "format dışı mesaj uyarmalı" "exit 0 + COMMIT uyarısı" "exit $CODE, çıktı: $(printf '%s' "$OUT" | head -3)"
fi
git rm -q --cached duz.ts && rm -f duz.ts

# (v7) Alt klasörden commit → staged yollar repo köküne göre taranmalı
# (git diff kök-göreli ad verir; alt klasörden grep hepsini "yok" bulup
# içerik taramasını sessizce boşaltıyordu)
mkdir -p alt && printf 'const key = "AKIAIOSFODNN7EXAMPLE"\n' > kok.ts
git add kok.ts
( cd alt && payload "git commit -m 'feat: x'" | bash "$HOOKS/quality-scan.sh" ) >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "alt klasörden commit'teki sır → bloklanır" || no "alt klasör taramayı boşaltmamalı" 2 "$CODE"
git rm -q --cached kok.ts && rm -rf kok.ts alt

# (v7b) Yorumdaki kayıt atfı (mistakes.md #100) → hex uyarısı VERMEMELİ;
# aynı dosyadaki gerçek hex renk → uyarı vermeli (bloklamaz, exit 0)
printf '// bkz. mistakes.md #100\nexport const x = 1\n' > atif.ts
git add atif.ts
OUT=$(payload "git commit -m 'feat: x'" | bash "$HOOKS/quality-scan.sh" 2>&1)
if ! printf '%s' "$OUT" | grep -q 'DESIGN TOKEN'; then ok "mistakes.md #100 atfı → hex sanılmaz"; else no "kayıt atfı hex uyarısı vermemeli" "uyarı yok" "DESIGN TOKEN"; fi
printf '// bkz. mistakes.md #100\nexport const c = "#a4720f"\n' > atif.ts
git add atif.ts
OUT=$(payload "git commit -m 'feat: x'" | bash "$HOOKS/quality-scan.sh" 2>&1)
if printf '%s' "$OUT" | grep -q 'DESIGN TOKEN'; then ok "atıf + gerçek hex aynı dosyada → uyarır"; else no "gerçek hex uyarısı kaçmamalı" "DESIGN TOKEN" "uyarı yok"; fi
git rm -q --cached atif.ts && rm -f atif.ts

# (v8) Tasarım token satırı (token: "surface-raised") → geçmeli
# (şablonun kendi token sayfası her commit'te "hardcoded secret" diye bloklanıyordu)
printf '{ token: "surface-raised", className: "bg-surface-raised" },\n' > tokenlar.tsx
git add tokenlar.tsx
payload "git commit -m 'feat: x'" | bash "$HOOKS/quality-scan.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 0 ] && ok "token: \"surface-raised\" → sır sanılmaz (exit 0)" || no "kebab token adı bloklanmamalı" 0 "$CODE"

# (v9) Boşluklu arayüz metni (password: "En az 8 karakter olmalı") → geçmeli
printf '{ %s: "%s" }\n' "$PW_NAME" 'En az 8 karakter olmalı' > mesajlar.ts
git add mesajlar.ts
payload "git commit -m 'feat: x'" | bash "$HOOKS/quality-scan.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 0 ] && ok "boşluklu arayüz metni → sır sanılmaz (exit 0)" || no "arayüz metni bloklanmamalı" 0 "$CODE"
git rm -q --cached mesajlar.ts && rm -f mesajlar.ts

# (v10) Aynı satırda kebab token + gerçek sır → bloklamalı (ayıklama satır
# değil eşleşme başına; satırı toptan düşürmek gerçek sırrı da kaçırırdı)
printf '{ token: "surface-raised", %s: "%s" },\n' "$PW_NAME" 'Xyz12345678' > tokenlar.tsx
git add tokenlar.tsx
payload "git commit -m 'feat: x'" | bash "$HOOKS/quality-scan.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "kebab token + gerçek sır aynı satırda → bloklanır" || no "satırdaki gerçek sır kaçmamalı" 2 "$CODE"
git rm -q --cached tokenlar.tsx && rm -f tokenlar.tsx

# (v10b) Parola anahtarında kebab değer → bloklamalı (kebab muafiyeti yalnız
# token anahtarı için; "my-secret-pass" tasarım token adı değil, paroladır)
printf '{ %s: "%s" }\n' "$PW_NAME" 'my-secret-pass' > ayar.ts
git add ayar.ts
payload "git commit -m 'feat: x'" | bash "$HOOKS/quality-scan.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "parola anahtarında kebab değer → bloklanır" || no "kebab parola kaçmamalı" 2 "$CODE"
git rm -q --cached ayar.ts && rm -f ayar.ts

# (v11) Tırnaklı pathspec'teki route grubu + yalnız .md staged → taranmalı
mkdir -p 'app/(panel)' && printf 'export const x = 1\n' > 'app/(panel)/page.tsx'
git add 'app/(panel)/page.tsx' && git commit -qm "chore: panel" >/dev/null 2>&1
printf 'const key = "AKIAIOSFODNN7EXAMPLE"\n' > 'app/(panel)/page.tsx'
printf '# notlar\n' > NOTLAR.md && git add NOTLAR.md
payload "git commit -m 'docs: notlar' 'app/(panel)/page.tsx'" | bash "$HOOKS/quality-scan.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "tırnaklı route grubu pathspec'indeki sır → bloklanır" || no "tırnaklı pathspec taramadan kaçmamalı" 2 "$CODE"
git checkout -q -- 'app/(panel)/page.tsx'
git rm -q --cached NOTLAR.md && rm -f NOTLAR.md

# (v12) ASCII dışı dosya adındaki sır → bloklamalı (core.quotePath varsayılanı
# adı "ayarlar/\305\237ifreler.ts" diye tırnaklı verir, grep açamıyordu)
mkdir -p ayarlar && printf 'const key = "AKIAIOSFODNN7EXAMPLE"\n' > 'ayarlar/şifreler.ts'
git add 'ayarlar/şifreler.ts'
payload "git commit -m 'feat: x'" | bash "$HOOKS/quality-scan.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "Türkçe dosya adındaki sır → bloklanır" || no "ASCII dışı ad taramadan kaçmamalı" 2 "$CODE"
git rm -q --cached 'ayarlar/şifreler.ts' && rm -rf ayarlar

# (v13) Sağlayıcı önekli anahtar, anahtar adı ve tırnak olmadan → bloklamalı
# (YAML'da `GH_TOKEN: ghp_...`). Fixture çalışma zamanında birleştirilir:
# düz yazılsa GitHub'ın push korumasına da takılırdı.
mkdir -p .github/workflows
printf 'env:\n  GH_TOKEN: %s%s\n' 'ghp_' "$(printf 'A%.0s' $(seq 36))" > .github/workflows/sync.yml
git add .github/workflows/sync.yml
payload "git commit -m 'ci: x'" | bash "$HOOKS/quality-scan.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "tırnaksız GitHub token'ı (YAML) → bloklanır" || no "sağlayıcı öneki yakalanmalı" 2 "$CODE"
git rm -q --cached .github/workflows/sync.yml && rm -rf .github

# (v13b) re_ önekli sıradan tanımlayıcı Resend anahtarı sanılmamalı; gerçek
# biçimli anahtar (8 + 24) yine bloklanmalı. Fixture çalışma zamanında birleşir.
printf 'const re_validateEmail_formatAddressString = 1\n' > kimlik.ts
git add kimlik.ts
payload "git commit -m 'feat: x'" | bash "$HOOKS/quality-scan.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 0 ] && ok "re_ önekli değişken adı → bloklanmaz" || no "re_ tanımlayıcısı sır sayılmamalı" 0 "$CODE"
printf 'new Resend("%s%s_%s")\n' 're_' 'Ab12Cd34' "$(printf 'x%.0s' $(seq 24))" > kimlik.ts
git add kimlik.ts
payload "git commit -m 'feat: x'" | bash "$HOOKS/quality-scan.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "Resend anahtarı → bloklanır" || no "Resend öneki yakalanmalı" 2 "$CODE"
git rm -q --cached kimlik.ts && rm -f kimlik.ts

# (v13c) NUL baytlı (ikili sayılan) dosyadaki sır → bloklamalı (grep -a)
printf 'SQLite format 3\000\000\nconst password = "hunter2hunter2"\n' > dev.db
git add dev.db
payload "git commit -m 'feat: x'" | bash "$HOOKS/quality-scan.sh" >/dev/null 2>&1
CODE=$?
[ $CODE -eq 2 ] && ok "ikili dosyadaki sır → bloklanır" || no "ikili dosya sır taramasından kaçmamalı" 2 "$CODE"
git rm -q --cached dev.db && rm -f dev.db

# (v14) İzlenen .env'i SİLEN `commit -a` → geçmeli (.env sızmıyor, gidiyor)
printf 'DB=x\n' > .env && git add -f .env && git commit -qm "chore: kaza" >/dev/null 2>&1
rm -f .env
OUT=$(payload "git commit -am 'chore: .env kaldırıldı'" | bash "$HOOKS/quality-scan.sh" 2>&1)
CODE=$?
[ $CODE -eq 0 ] && ok "silinen .env + commit -a → bloklanmaz (exit 0)" || no ".env'i kaldıran commit bloklanmamalı" 0 "exit $CODE, çıktı: $(printf '%s' "$OUT" | head -2)"
git rm -q --cached .env 2>/dev/null; git commit -qm "chore: .env yok" >/dev/null 2>&1

# (v15) Ekosistemin KENDİ hook dosyaları kendi taramasından geçmeli
# (yorumdaki örnek DSN ve test paketinin sahte sırları hook bakımını
# bloklayan her commit'i durduruyordu — mistakes.md #45 sınıfı)
mkdir -p "$SANDBOX/self" && cd "$SANDBOX/self" || exit 1
git init -q . 2>/dev/null
git config user.email t@t.t && git config user.name t
mkdir -p hooks/lib scripts .claude
cp "$REPO_ROOT"/hooks/*.sh hooks/ && cp "$REPO_ROOT"/hooks/lib/*.sh hooks/lib/
cp "$REPO_ROOT/scripts/test-hooks.sh" scripts/ && cp "$REPO_ROOT/.claude/settings.json" .claude/
git add -A
OUT=$(payload "git commit -m 'test(hooks): x'" | bash "$HOOKS/quality-scan.sh" 2>&1)
CODE=$?
if [ $CODE -eq 0 ] && ! printf '%s' "$OUT" | grep -q 'SECURITY'; then
  ok "hooks/ + test-hooks.sh kendi taramasından geçer"
else
  no "hook dosyaları kendilerini bloklamamalı" "exit 0, SECURITY yok" "exit $CODE, çıktı: $(printf '%s' "$OUT" | head -4)"
fi

echo
# ─────────────────────────────────────────────────────────────
# routemap-sync.sh — içerik değişmezi
# ─────────────────────────────────────────────────────────────
echo "routemap-sync.sh — içerik değişmezi"

mkdir -p "$SANDBOX/sync2/docs" && cd "$SANDBOX/sync2" || exit 1
cat > docs/ROUTEMAP.md <<'EOF'
| ID | Başlık | Faz | Öncelik | Durum | Gate | Assign |
|----|--------|-----|---------|-------|------|--------|
| STORY-001 | Giriş | 1 | HIGH | DONE | — | FE |
EOF
OUT=$(printf '{"tool_name":"Edit","tool_input":{"file_path":"docs/ROUTEMAP.md"}}' | bash "$HOOKS/routemap-sync.sh" 2>&1)
CODE=$?
if [ $CODE -eq 0 ] && printf '%s' "$OUT" | grep -q 'tutarsız'; then
  ok "DONE + Gate boş → tutarsızlık uyarısı"
else
  no "DONE+Gate'siz uyarmalı" "exit 0 + tutarsız uyarısı" "exit $CODE, çıktı: $(printf '%s' "$OUT" | head -3)"
fi

# (sync-alt) Alt klasördeki düzenleme → ROUTEMAP proje kökünde bulunmalı
mkdir -p "$SANDBOX/sync2/src"
OUT=$( (cd "$SANDBOX/sync2/src" && printf '{"tool_name":"Edit","tool_input":{"file_path":"x.md"}}' | CLAUDE_PROJECT_DIR="$SANDBOX/sync2" bash "$HOOKS/routemap-sync.sh") 2>&1 )
CODE=$?
if [ $CODE -eq 0 ] && printf '%s' "$OUT" | grep -q 'STORY-001'; then
  ok "alt klasörden düzenleme → değişmez yine denetlenir"
else
  no "alt klasör değişmezi atlatmamalı" "exit 0 + STORY-001 ihlali" "exit $CODE, çıktı: $(printf '%s' "$OUT" | head -3)"
fi

# (sync-wt) Worktree'deki düzenleme → worktree'nin ROUTEMAP'i denetlenmeli
# (CLAUDE_PROJECT_DIR ana checkout'ta kalır; u21b'nin worktree'si)
printf '| STORY-003 | Rapor | 1 | HIGH | DONE | — | FE |\n' >> "$SANDBOX/wtpanel/docs/ROUTEMAP.md"
OUT=$( (cd "$SANDBOX/wtpanel" && printf '{"tool_name":"Edit","tool_input":{"file_path":"docs/ROUTEMAP.md"}}' | CLAUDE_PROJECT_DIR="$SANDBOX/wtana" bash "$HOOKS/routemap-sync.sh") 2>&1 )
CODE=$?
if [ $CODE -eq 0 ] && printf '%s' "$OUT" | grep -q 'STORY-003'; then
  ok "worktree'de düzenleme → worktree'nin ROUTEMAP'i denetlenir"
else
  no "worktree değişmezi ana checkout'tan okunmamalı" "exit 0 + STORY-003 ihlali" "exit $CODE, çıktı: $(printf '%s' "$OUT" | head -3)"
fi

# (nojq) jq yokken JSON python3 ile kurulmalı — düz metin modele ulaşmaz.
# PATH'te jq olmayan bir araç dizini kurulur; bash mutlak yolla çağrılır.
if command -v python3 >/dev/null 2>&1; then
  mkdir -p "$SANDBOX/nojq"
  for t in dirname git awk sed grep tr sort cut head xargs stat date cat python3; do
    TP=$(command -v "$t" 2>/dev/null) && ln -s "$TP" "$SANDBOX/nojq/$t"
  done
  OUT=$(printf '{"tool_name":"Edit","tool_input":{"file_path":"x.md"}}' | PATH="$SANDBOX/nojq" "$BASH" "$HOOKS/routemap-sync.sh" 2>/dev/null)
  if printf '%s' "$OUT" | python3 -c 'import json,sys; d=json.load(sys.stdin); sys.exit(0 if d["decision"] == "block" and "tutarsız" in d["reason"] else 1)' 2>/dev/null; then
    ok "jq yok → routemap-sync JSON'u python3 ile basar"
  else
    no "jq'suz değişmez JSON olmalı" "decision=block JSON" "$(printf '%s' "$OUT" | head -2)"
  fi
  OUT=$(cd "$SANDBOX/sec" && printf 'export const b = 1\n' > hata.ts && git add hata.ts \
    && payload "git commit -m 'fix: x'" | PATH="$SANDBOX/nojq" "$BASH" "$HOOKS/quality-scan.sh" 2>/dev/null)
  if printf '%s' "$OUT" | python3 -c 'import json,sys; sys.exit(0 if "BUGFIX" in json.load(sys.stdin)["hookSpecificOutput"]["additionalContext"] else 1)' 2>/dev/null; then
    ok "jq yok → quality-scan uyarı JSON'unu python3 ile basar"
  else
    no "jq'suz uyarı JSON olmalı" "additionalContext JSON" "$(printf '%s' "$OUT" | head -2)"
  fi
  (cd "$SANDBOX/sec" && git rm -q --cached hata.ts && rm -f hata.ts)
else
  echo "  ⏭️  python3 yok — jq'suz JSON yolu test edilmedi"
fi

echo
# ─────────────────────────────────────────────────────────────
# session-brief.sh — SessionStart: ROUTEMAP özeti bağlama girer
# ─────────────────────────────────────────────────────────────
echo "session-brief.sh"

# (n) ROUTEMAP + aktif story → özet basmalı (exit 0)
mkdir -p "$SANDBOX/brief/docs" && cd "$SANDBOX/brief" || exit 1
cat > docs/ROUTEMAP.md <<'EOF'
**Proje**: test-projesi
**Durum**: DEVELOPMENT

| ID | Başlık | Faz | Öncelik | Durum | Gate |
|----|--------|-----|---------|-------|------|
| STORY-001 | Giriş ekranı | 1 | HIGH | IN_PROGRESS | — |
EOF
OUT=$(printf '{"hook_event_name":"SessionStart","source":"startup"}' | bash "$HOOKS/session-brief.sh" 2>&1)
CODE=$?
if [ $CODE -eq 0 ] && printf '%s' "$OUT" | grep -q 'STORY-001'; then
  ok "ROUTEMAP + aktif story → özet basar (exit 0)"
else
  no "aktif story özette olmalı" "exit 0 + STORY-001" "exit $CODE, çıktı: $(printf '%s' "$OUT" | head -3)"
fi

# (o) Aktif story yoksa → sıradaki işi önermeli
cat > docs/ROUTEMAP.md <<'EOF'
**Proje**: test-projesi
**Durum**: PLANNING

| ID | Başlık | Faz | Öncelik | Durum | Gate |
|----|--------|-----|---------|-------|------|
| STORY-001 | Giriş ekranı | 1 | HIGH | NOT_STARTED | — |
EOF
OUT=$(printf '{"hook_event_name":"SessionStart","source":"resume"}' | bash "$HOOKS/session-brief.sh" 2>&1)
CODE=$?
if [ $CODE -eq 0 ] && printf '%s' "$OUT" | grep -q 'Aktif iş yok'; then
  ok "aktif story yok → sıradaki işi önerir"
else
  no "sıradaki iş önerisi olmalı" "exit 0 + 'Aktif iş yok'" "exit $CODE, çıktı: $(printf '%s' "$OUT" | head -3)"
fi

# (o2) resume'da oturum alt klasördeyse → ROUTEMAP proje kökünden okunmalı
mkdir -p "$SANDBOX/brief/src"
OUT=$( (cd "$SANDBOX/brief/src" && printf '{"hook_event_name":"SessionStart","source":"resume"}' | CLAUDE_PROJECT_DIR="$SANDBOX/brief" bash "$HOOKS/session-brief.sh") 2>&1 )
CODE=$?
if [ $CODE -eq 0 ] && printf '%s' "$OUT" | grep -q 'Aktif iş yok'; then
  ok "alt klasörde oturum → özet yine basılır"
else
  no "alt klasörde özet susmamalı" "exit 0 + 'Aktif iş yok'" "exit $CODE, çıktı: $(printf '%s' "$OUT" | head -3)"
fi

# (p) ROUTEMAP yoksa → sessiz no-op (exit 0, çıktı yok)
mkdir -p "$SANDBOX/brief-bos" && cd "$SANDBOX/brief-bos" || exit 1
OUT=$(printf '{"hook_event_name":"SessionStart","source":"startup"}' | bash "$HOOKS/session-brief.sh" 2>&1)
CODE=$?
if [ $CODE -eq 0 ] && [ -z "$OUT" ]; then
  ok "ROUTEMAP yok → sessiz geçer (exit 0, çıktı yok)"
else
  no "ROUTEMAP'siz dizinde susmalı" "exit 0, çıktı boş" "exit $CODE, çıktı: $(printf '%s' "$OUT" | head -3)"
fi

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAIL -gt 0 ]; then
  echo "  SONUC: $PASS geçti, $FAIL BAŞARISIZ"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
fi
echo "  SONUC: $PASS davranış testi geçti"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
