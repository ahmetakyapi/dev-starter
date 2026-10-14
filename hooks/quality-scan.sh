#!/usr/bin/env bash
# Quality Scan — commit öncesi temel kalite kontrolleri
# PreToolUse:Bash hook olarak çalışır
#
# Hardcoded değer, debug kodu ve güvenlik taraması

set -euo pipefail

# Tüm çıktı stderr'e: PreToolUse hook'u exit 2 verdiğinde Claude yalnız
# STDERR'i görür — gerekçe stdout'ta kalırsa blok sebepsiz görünür
# ("No stderr output"). Exit 0'daki uyarılar için davranış değişmez
# (stdout da zaten yalnız transcript'te görünüyordu).
exec 1>&2

# shellcheck source=lib/hook-input.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/hook-input.sh"

# Komut metnini BİR KEZ yakala: hook_command stdin'i komut ikamesinde
# (subshell) okur, önbellek ana kabuğa taşınmaz — ikinci çağrı boş döner.
# Aşağıdaki kontroller (#9, #10) da bu metni kullanır.
CMD_TEXT=$(hook_command)

# Sadece git commit komutlarını yakala
printf '%s' "$CMD_TEXT" | grep -qE 'git[[:space:]]+([^|;&]*[[:space:]])?commit' || exit 0

WARNINGS=0
ERRORS=0

# Staged dosyaları al
STAGED=$(git diff --cached --name-only --diff-filter=ACMR 2>/dev/null || true)
if [ -z "$STAGED" ]; then
  exit 0
fi

# 1. Hardcoded hex renk kontrolü (tsx/ts dosyalarında)
# Test dosyaları token DEĞERLERİNİ doğrular — hex barındırmaları beklenir.
# Diğer kontroller zaten test dosyalarını dışlıyor; bu satır o tutarlılığı kurar.
HEX_HITS=$(echo "$STAGED" | grep -E '\.(tsx?|css)$' | xargs grep -ln '#[0-9a-fA-F]\{3,8\}' 2>/dev/null | grep -v 'globals.css\|tailwind\|theme\|\.config\.\|\.test\.\|\.spec\.' || true)
if [ -n "$HEX_HITS" ]; then
  echo "⚠️  DESIGN TOKEN: Hardcoded hex renk bulundu:"
  echo "$HEX_HITS" | sed 's/^/   /'
  WARNINGS=$((WARNINGS + 1))
fi

# 2. console.log kontrolü
LOG_HITS=$(echo "$STAGED" | grep -E '\.(tsx?|jsx?)$' | xargs grep -ln 'console\.\(log\|debug\|warn\)' 2>/dev/null | grep -v '\.test\.\|\.spec\.\|\.config\.' || true)
if [ -n "$LOG_HITS" ]; then
  echo "⚠️  DEBUG: console.log/debug/warn bulundu:"
  echo "$LOG_HITS" | sed 's/^/   /'
  WARNINGS=$((WARNINGS + 1))
fi

# 3. Güvenlik: Hardcoded secret kontrolü
SECRET_HITS=$(echo "$STAGED" | xargs grep -lniE '(password|secret|api_key|apikey|token)\s*[:=]\s*["\x27][^"\x27]{8,}' 2>/dev/null | grep -v '\.example\|\.template\|\.test\.\|\.spec\.\|\.md$' || true)
if [ -n "$SECRET_HITS" ]; then
  echo "❌ SECURITY: Olası hardcoded secret bulundu:"
  echo "$SECRET_HITS" | sed 's/^/   /'
  ERRORS=$((ERRORS + 1))
fi

# 3b. Güvenlik: bilinen sır biçimleri (anahtar deseninden bağımsız)
# AWS access key, PEM özel anahtar, iki parçalı JWT, URL içinde kullanıcı:parola.
# Bunlar "password=..." kalıbına girmeden sızar; ayrı desenle taranır.
# scripts/test-hooks.sh hariç: tarayıcının kendi test paketi, fixture olarak
# sahte sır taşımak zorunda (AKIA...EXAMPLE).
KNOWN_SECRETS=$(echo "$STAGED" | grep -vE '\.(md|example|template|lock)$|\.test\.|\.spec\.|package-lock\.json|(^|/)scripts/test-hooks\.sh$' \
  | xargs grep -lnE 'AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY|eyJ[A-Za-z0-9_-]{10,}\.eyJ|[a-z][a-z0-9+.-]*://[^/@[:space:]"]+:[^@[:space:]"]+@' 2>/dev/null || true)
if [ -n "$KNOWN_SECRETS" ]; then
  echo "❌ SECURITY: Bilinen sır biçimi bulundu (AWS/PEM/JWT/URL kimlik bilgisi):"
  echo "$KNOWN_SECRETS" | sed 's/^/   /'
  ERRORS=$((ERRORS + 1))
fi

# 4. .env dosyası commit edilmeye çalışılıyor mu?
# Kök dizinle sınırlı değil: config/.env.production da sızdırır. İzinli olanlar
# yalnız .env.example ve .env.template (değer taşımazlar).
ENV_HITS=$(echo "$STAGED" | grep -E '(^|/)\.env(\.[A-Za-z0-9._-]+)?$' | grep -vE '\.env\.(example|template)$' || true)
if [ -n "$ENV_HITS" ]; then
  echo "❌ SECURITY: .env dosyası commit edilmeye çalışılıyor!"
  echo "$ENV_HITS" | sed 's/^/   /'
  ERRORS=$((ERRORS + 1))
fi

# 5. @ts-ignore / any kontrolü
TS_IGNORE=$(echo "$STAGED" | grep -E '\.tsx?$' | xargs grep -ln '@ts-ignore\|@ts-expect-error\|: any\b' 2>/dev/null | grep -v '\.test\.\|\.spec\.\|\.d\.ts$' || true)
if [ -n "$TS_IGNORE" ]; then
  echo "⚠️  TYPESCRIPT: @ts-ignore veya 'any' type bulundu:"
  echo "$TS_IGNORE" | sed 's/^/   /'
  WARNINGS=$((WARNINGS + 1))
fi

# 6. Lockfile tutarlılığı — package.json/package-lock.json stage'lendiyse
# Kilit manifest'le senkron değilse CI'ın İLK adımı (`npm ci`) patlar ve
# hiçbir kontrol çalışmaz. Yerelde `npm install` çalıştığı için commit anında
# hiçbir belirti yoktur; bu yüzden uyarı değil HATA. Bkz. mistakes.md #57
LOCK_TOUCHED=$(echo "$STAGED" | grep -E '(^|/)(package\.json|package-lock\.json)$' || true)
if [ -n "$LOCK_TOUCHED" ]; then
  REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo '.')
  if [ -f "$REPO_ROOT/scripts/verify-lockfile.mjs" ]; then
    set +e
    LOCK_OUT=$( (cd "$REPO_ROOT" && node scripts/verify-lockfile.mjs) 2>&1 )
    LOCK_CODE=$?
    set -e
    if [ $LOCK_CODE -ne 0 ]; then
      echo "$LOCK_OUT" | sed 's/^/   /'
      ERRORS=$((ERRORS + 1))
    fi
  fi
fi

# 7. Agentic: tool sonucu doğrulanmadan cast ediliyor mu?
# Tel üzerinde tool sonucu STRING'dir; JSON.parse -> unknown döner.
# Doğrudan cast etmek temenniden ibarettir. -> knowledge/mistakes.md #58
AGENTIC_FILES=$(echo "$STAGED" | grep -E '\.tsx?$' | xargs grep -ln 'useRenderTool\|useFrontendTool\|useHumanInTheLoop\|toolCall' 2>/dev/null || true)
if [ -n "$AGENTIC_FILES" ]; then
  UNSAFE_PARSE=$(echo "$AGENTIC_FILES" | xargs grep -ln 'JSON\.parse(.*) as ' 2>/dev/null | grep -v '\.test\.\|\.spec\.' || true)
  if [ -n "$UNSAFE_PARSE" ]; then
    echo "⚠️  AGENTIC: Tool sonucu doğrulanmadan cast ediliyor:"
    echo "$UNSAFE_PARSE" | sed 's/^/   /'
    echo "   JSON.parse unknown döner. Alanları kontrol et → mistakes.md #58"
    WARNINGS=$((WARNINGS + 1))
  fi
fi

# 8. Agentic: @ag-ui/client sürümü sabitlenmiş mi?
# CopilotKit bu paketi TAM sürüme sabitler. Aralık (^/~) yazmak ikinci bir
# kopya yaratır ve HttpAgent tipi AbstractAgent'a atanamaz. -> mistakes.md #71
AGUI_PKG=$(echo "$STAGED" | grep -E '(^|/)package\.json$' || true)
if [ -n "$AGUI_PKG" ]; then
  LOOSE_AGUI=$(echo "$AGUI_PKG" | xargs grep -ln '"@ag-ui/[a-z]*": *"[\^~]' 2>/dev/null || true)
  if [ -n "$LOOSE_AGUI" ]; then
    echo "⚠️  AGENTIC: @ag-ui/* sürümü aralıkla yazılmış (^ veya ~):"
    echo "$LOOSE_AGUI" | sed 's/^/   /'
    echo "   CopilotKit tam sürüme sabitler; aralık çift kopya üretir → mistakes.md #71"
    WARNINGS=$((WARNINGS + 1))
  fi
fi

# 9. Commit mesajı conventional format'ta mı? (rules/commit-conventions.md)
# Mesaj komut metninden çıkarılır; heredoc/karmaşık tırnaklamada ayrıştırma
# garantisi yok, bu yüzden yalnız UYARI: desen komutun hiçbir yerinde yoksa.
if printf '%s' "$CMD_TEXT" | grep -qE '(^|[[:space:]])(-m|--message)([[:space:]]|=)'; then
  if ! printf '%s' "$CMD_TEXT" | grep -qE '(feat|fix|hotfix|refactor|style|perf|test|docs|chore|ci)(\([a-z0-9_.-]+\))?: |Merge |Revert '; then
    echo "⚠️  COMMIT: Mesaj conventional format'a uymuyor görünüyor:"
    echo "   beklenen: <tip>(<scope>): <açıklama> — rules/commit-conventions.md"
    WARNINGS=$((WARNINGS + 1))
  fi
fi

# 10. fix commit'inde test değişikliği var mı? (rules/bugfix-protocol.md: TDD —
# önce failing test). Kod değişen ama test dosyası içermeyen fix → uyarı.
if printf '%s' "$CMD_TEXT" | grep -qE '(fix|hotfix)(\([a-z0-9_.-]+\))?:'; then
  FIX_CODE=$(echo "$STAGED" | grep -E '\.(tsx?|jsx?)$' | grep -vE '\.test\.|\.spec\.|(^|/)tests?/' || true)
  FIX_TESTS=$(echo "$STAGED" | grep -E '\.test\.|\.spec\.|(^|/)tests?/' || true)
  if [ -n "$FIX_CODE" ] && [ -z "$FIX_TESTS" ]; then
    echo "⚠️  BUGFIX: fix commit'inde test değişikliği yok (rules/bugfix-protocol.md)."
    echo "   Önce failing test, sonra düzeltme. Test yazılamıyorsa gerekçesi commit gövdesine."
    echo "   Kalıcı ders varsa: ~/dev-starter/knowledge/mistakes.md (/retro ile)."
    WARNINGS=$((WARNINGS + 1))
  fi
fi

# 11. Test zayıflatma: diff'e .only/.skip/xit/xdescribe EKLENMESİ.
# .only kalan test suite'in tamamını sessizce devre dışı bırakır; .skip yeşili
# yalandan üretir. Meşru kullanım olabilir → uyarı, blok değil.
TEST_FILES=$(echo "$STAGED" | grep -E '\.test\.|\.spec\.|(^|/)tests?/' || true)
if [ -n "$TEST_FILES" ]; then
  WEAKENED=$(echo "$TEST_FILES" | tr '\n' '\0' | xargs -0 git diff --cached -U0 -- 2>/dev/null \
    | grep -E '^\+.*(\.(only|skip)\(|\b(xit|xdescribe|xtest)\()' || true)
  if [ -n "$WEAKENED" ]; then
    echo "⚠️  TEST: diff test atlatan çağrı ekliyor (.only/.skip/xit):"
    echo "$WEAKENED" | head -5 | sed 's/^/   /'
    WARNINGS=$((WARNINGS + 1))
  fi
fi

# Sonuç
if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "❌ Quality scan FAILED — $ERRORS hata, $WARNINGS uyarı"
  echo "   Hataları düzeltin veya bypass: git commit --no-verify"
  exit 2
fi

if [ $WARNINGS -gt 0 ]; then
  echo ""
  echo "⚠️  Quality scan: $WARNINGS uyarı (commit devam ediyor)"
fi

exit 0
