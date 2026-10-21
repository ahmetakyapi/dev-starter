#!/usr/bin/env bash
# Quality Scan — commit öncesi temel kalite kontrolleri
# PreToolUse:Bash hook olarak çalışır
#
# Hardcoded değer, debug kodu ve güvenlik taraması

set -euo pipefail

# Tüm insan-okur çıktı stderr'e: PreToolUse hook'u exit 2 verdiğinde Claude
# yalnız STDERR'i görür — gerekçe stdout'ta kalırsa blok sebepsiz görünür
# ("No stderr output"). Gerçek stdout fd 3'te saklanır: exit 0'da ne stderr
# ne düz stdout modele ulaşır, uyarı özeti oraya JSON (additionalContext)
# olarak yazılır — yoksa TDD/.only/format uyarılarını kimse görmüyordu.
exec 3>&1 1>&2

# shellcheck source=lib/hook-input.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/hook-input.sh"

# Ekosistem kökü (hook'un kendi ağacı) proje köküne cd'den ÖNCE çözülür:
# hook göreli yolla da çağrılabilir (`bash hooks/quality-scan.sh`).
ECOSYSTEM_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

# Komut metnini BİR KEZ yakala: hook_command stdin'i komut ikamesinde
# (subshell) okur, önbellek ana kabuğa taşınmaz — ikinci çağrı boş döner.
# Aşağıdaki kontroller (#9, #10) da bu metni kullanır.
CMD_TEXT=$(hook_command)

# Sadece git commit komutlarını yakala (normalize + tam sözcük: lib)
hook_text_is_git_commit "$CMD_TEXT" || exit 0

# Hook Claude'un o anki dizininde koşar ve her `cd`yi izler. git diff
# yolları repo KÖKÜNE göredir; alt klasörden grep hepsini "yok" bulup
# (2>/dev/null) içerik taramalarını sessizce boşaltıyordu — köke sabitlen.
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" 2>/dev/null || exit 0

WARNINGS=0
ERRORS=0
WARN_TEXT=""

# Uyarı: başlık (+ isteğe bağlı ayrıntı) hem stderr'e hem modele gidecek
# özete yazılır (sondaki additionalContext JSON'u).
warn() {
  echo "$1"
  WARN_TEXT+="$1"$'\n'
  if [ -n "${2:-}" ]; then
    echo "$2"
    WARN_TEXT+="$2"$'\n'
  fi
  WARNINGS=$((WARNINGS + 1))
}

# Staged dosyaları al. `git commit -a` / pathspec dosyaları commit ANINDA
# stage'ler; hook commit'ten ÖNCE koştuğu için index o an eksik olabilir ve
# boş liste denetimden kaçışa dönüşür. Komutta -a/--all/--include görülürse
# çalışma ağacındaki izlenen değişiklikler de listeye katılır.
# core.quotePath=false: ASCII dışı adlar ("ayarlar/şifreler.ts") varsayılanda
# sekizli kaçışlı ve tırnaklı gelir; grep o adı açamaz, tarama boş döner.
STAGED=$(git -c core.quotePath=false diff --cached --name-only --diff-filter=ACMR 2>/dev/null || true)
# Üç işaretten biri varsa (bayrak, zincirde `git add`, pathspec — lib) ya da
# index boşsa, çalışma ağacındaki değişmiş + İZLENMEYEN dosyalar da taranır:
# `git add x && git commit` zinciri ve `git commit dosya.ts` hook'tan SONRA
# stage'ler; untracked .env/sır yalnız `git diff HEAD`le görünmüyordu.
# Silinen dosyalar listelenmez (--diff-filter=d): `rm .env && git commit -a`
# .env'i SIZDIRMIYOR, kaldırıyor — `ls-files -m` onu da sayıp bloklıyordu.
if hook_commit_touches_worktree "$CMD_TEXT" || [ -z "$STAGED" ]; then
  WORKTREE=$( { git -c core.quotePath=false diff --name-only --diff-filter=d; git -c core.quotePath=false ls-files -o --exclude-standard; } 2>/dev/null || true)
  STAGED=$(printf '%s\n%s\n' "$STAGED" "$WORKTREE" | grep -v '^$' | sort -u || true)
fi
if [ -z "$STAGED" ]; then
  exit 0
fi

# Dosya listesini xargs'a HEP NUL ayraçlı ver: boşluklu/`-` ile başlayan
# adlar varsayılan xargs'ta bölünür ya da seçenek sanılır ve 2>/dev/null
# hatayı yutar — güvenlik taraması sessizce boş döner.
staged0() { printf '%s\n' "$STAGED" | grep -E "$1" | tr '\n' '\0'; }

# 1. Hardcoded hex renk kontrolü (tsx/ts dosyalarında)
# Test dosyaları token DEĞERLERİNİ doğrular — hex barındırmaları beklenir.
# Diğer kontroller zaten test dosyalarını dışlıyor; bu satır o tutarlılığı kurar.
# Yorumdaki kayıt atfı (`mistakes.md #100`) üç haneli olunca hex'e benzer;
# atıf eşleşme başına (-o) ayıklanır, aynı satırdaki gerçek renk kalır.
HEX_HITS=$(staged0 '\.(tsx?|css)$' | xargs -0 grep -HoE -e '(mistakes(\.md)?[[:space:]]+)?#[0-9a-fA-F]{3,8}' -- 2>/dev/null | grep -vE ':mistakes' | cut -d: -f1 | sort -u | grep -vE 'globals\.css|tailwind|theme|\.config\.|\.test\.|\.spec\.' || true)
if [ -n "$HEX_HITS" ]; then
  warn "⚠️  DESIGN TOKEN: Hardcoded hex renk bulundu:" "$(echo "$HEX_HITS" | sed 's/^/   /')"
fi

# 2. console.log kontrolü
LOG_HITS=$(staged0 '\.(tsx?|jsx?)$' | xargs -0 grep -lnE -e 'console\.(log|debug|warn)' -- 2>/dev/null | grep -vE '\.test\.|\.spec\.|\.config\.' || true)
if [ -n "$LOG_HITS" ]; then
  warn "⚠️  DEBUG: console.log/debug/warn bulundu:" "$(echo "$LOG_HITS" | sed 's/^/   /')"
fi

# 3. Güvenlik: Hardcoded secret kontrolü
# Desen bir değişkende ve apostrof GERÇEK: ERE köşeli parantezinde \x27
# hex kaçışı DEĞİL üç ayrı karakterdir (x,2,7) — eski desen tek tırnaklı
# secret'ları hiç yakalamıyordu. \s de GNU'ya özgü; [[:space:]] iki tarafta da çalışır.
# Değer boşluksuz ve kapanan tırnaklı olmalı: arayüz metni ("En az 8 karakter
# olmalı") sır değildir. YALNIZ `token` anahtarındaki küçük harfli kebab değer
# (token: "surface-raised") tasarım token adıdır — şablonun kendi token sayfası
# her commit'te bloklanıyordu; password/secret anahtarında kebab değer
# ("my-secret-pass") yine sırdır. Ayıklama EŞLEŞME başına (-o) ve büyük/küçük harf duyarlı:
# satır başına olsaydı aynı satırdaki gerçek sır da düşerdi. Tarayıcının test
# paketi sahte sır taşımak zorunda (aşağıdaki SEC_EXCL ile aynı gerekçe).
# -a şart: GNU grep -o ikili sayılan dosyada (NUL baytlı dev.db) eşleşmeyi
# basmaz, yalnız stderr'e "binary file matches" yazar ve dosya taramadan kaçar.
SECRET_RE="(password|secret|api_key|apikey|token)[[:space:]]*[:=][[:space:]]*[\"'][^\"'[:space:]]{8,}[\"']"
SECRET_SAFE=":[Tt]oken[[:space:]]*[:=][[:space:]]*[\"'][a-z]+(-[a-z0-9]+)+[\"']\$"
SECRET_HITS=$(staged0 '.' | xargs -0 grep -aHoiE -e "$SECRET_RE" -- 2>/dev/null | grep -vE "$SECRET_SAFE" | cut -d: -f1 | sort -u | grep -vE '\.example|\.template|\.test\.|\.spec\.|\.md$|(^|/)scripts/test-hooks\.sh$' || true)
if [ -n "$SECRET_HITS" ]; then
  echo "❌ SECURITY: Olası hardcoded secret bulundu:"
  echo "$SECRET_HITS" | sed 's/^/   /'
  ERRORS=$((ERRORS + 1))
fi

# 3b. Güvenlik: bilinen sır biçimleri (anahtar deseninden bağımsız)
# İki katman: SERT sırlar (AWS anahtarı, PEM, iki parçalı JWT ve yığının kendi
# sağlayıcılarının önekli anahtarları — Anthropic, GitHub, npm, Resend, Stripe,
# Slack) .md DAHİL her yerde aranır — README'ye yapıştırılan anahtar da
# sızıntıdır; önekler anahtar adından ve tırnaktan bağımsızdır (YAML'daki
# tırnaksız GH_TOKEN, `new Resend(...)`). URL içindeki kullanıcı:parola ise
# dokümanlarda örnek DSN olarak meşrudur (şema + kullanıcı adı + parola + @
# biçimli bağlantı dizesi); o desen .md dışında taranır. Örnek burada düz
# yazılmaz: yazılırsa tarayıcı kendi yorumunu sır sanar (mistakes.md #45).
# Muafiyetler dar: yalnız bilinen kilit DOSYA ADLARI (uzantı bazlı .lock
# muafiyeti secrets.lock gibi gerçek sırları kaçırıyordu), örnek/şablon
# dosyaları, test dosyaları ve tarayıcının kendi test paketi
# (fixture olarak sahte sır taşımak zorunda).
# Resend deseni gerçek anahtar boyuna (8 + 24) ve sağ sınıra sabit: re_ öneki
# genel bir değişken adı önekidir (re_validateEmail_formatAddress) ve uzunluğu
# serbest desen sıradan tanımlayıcıyı sır sayıp commit'i bloklardı.
SEC_EXCL='\.(example|template)$|\.test\.|\.spec\.|(^|/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$|(^|/)scripts/test-hooks\.sh$'
HARD_HITS=$(printf '%s\n' "$STAGED" | grep -vE "$SEC_EXCL" \
  | grep . | tr '\n' '\0' | xargs -0 grep -lnE -e 'AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY|eyJ[A-Za-z0-9_-]{10,}\.eyJ|(^|[^A-Za-z0-9_])(sk-ant-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{40,}|npm_[A-Za-z0-9]{36}|re_[A-Za-z0-9]{8}_[A-Za-z0-9]{24}([^A-Za-z0-9_]|$)|sk_live_[A-Za-z0-9]{20,}|xox[abprs]-[A-Za-z0-9-]{10,})' -- 2>/dev/null || true)
URL_HITS=$(printf '%s\n' "$STAGED" | grep -vE "$SEC_EXCL|\.md$" \
  | grep . | tr '\n' '\0' | xargs -0 grep -lnE -e '[a-z][a-z0-9+.-]*://[^/@[:space:]"]+:[^@[:space:]"]+@' -- 2>/dev/null || true)
KNOWN_SECRETS=$(printf '%s\n%s\n' "$HARD_HITS" "$URL_HITS" | grep . | sort -u || true)
if [ -n "$KNOWN_SECRETS" ]; then
  echo "❌ SECURITY: Bilinen sır biçimi bulundu (AWS/PEM/JWT, sağlayıcı anahtarı ya da URL kimlik bilgisi):"
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
TS_IGNORE=$(staged0 '\.tsx?$' | xargs -0 grep -lnE -e '@ts-ignore|@ts-expect-error|: any([^a-zA-Z_]|$)' -- 2>/dev/null | grep -vE '\.test\.|\.spec\.|\.d\.ts$' || true)
if [ -n "$TS_IGNORE" ]; then
  warn "⚠️  TYPESCRIPT: @ts-ignore veya 'any' type bulundu:" "$(echo "$TS_IGNORE" | sed 's/^/   /')"
fi

# 6. Lockfile tutarlılığı — package.json/package-lock.json stage'lendiyse
# Kilit manifest'le senkron değilse CI'ın İLK adımı (`npm ci`) patlar ve
# hiçbir kontrol çalışmaz. Yerelde `npm install` çalıştığı için commit anında
# hiçbir belirti yoktur; bu yüzden uyarı değil HATA. Bkz. mistakes.md #57
# Doğrulayıcı hook'un KENDİ ağacından alınır: şablon projelerinde scripts/
# yok ve kontrol orada sessizce atlanıyordu (CI yine `npm ci` koşar). Kilidi
# olmayan (pnpm/yarn) proje atlanır — doğrulayıcı kilitsiz projede hata verir.
LOCK_TOUCHED=$(echo "$STAGED" | grep -E '(^|/)(package\.json|package-lock\.json)$' || true)
if [ -n "$LOCK_TOUCHED" ]; then
  REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo '.')
  VERIFIER="$ECOSYSTEM_ROOT/scripts/verify-lockfile.mjs"
  [ -f "$VERIFIER" ] || VERIFIER="$REPO_ROOT/scripts/verify-lockfile.mjs"
  # node yoksa (GUI'den açılan istemcinin dar PATH'i) `node` 127 döner ve bu
  # kilit hatası sanılıp commit sebepsiz bloklanırdı; kontrol edilemeyen kilit
  # uyarıdır, CI yine `npm ci` koşar.
  if [ -f "$VERIFIER" ] && [ -f "$REPO_ROOT/package-lock.json" ] && ! command -v node >/dev/null 2>&1; then
    warn "⚠️  LOCK: node bulunamadı — kilit doğrulaması atlandı"
  elif [ -f "$VERIFIER" ] && [ -f "$REPO_ROOT/package-lock.json" ]; then
    set +e
    LOCK_OUT=$( (cd "$REPO_ROOT" && node "$VERIFIER") 2>&1 )
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
AGENTIC_FILES=$(staged0 '\.tsx?$' | xargs -0 grep -lnE -e 'useRenderTool|useFrontendTool|useHumanInTheLoop|toolCall' -- 2>/dev/null || true)
if [ -n "$AGENTIC_FILES" ]; then
  UNSAFE_PARSE=$(printf '%s\n' "$AGENTIC_FILES" | grep . | tr '\n' '\0' | xargs -0 grep -ln -e 'JSON\.parse(.*) as ' -- 2>/dev/null | grep -vE '\.test\.|\.spec\.' || true)
  if [ -n "$UNSAFE_PARSE" ]; then
    warn "⚠️  AGENTIC: Tool sonucu doğrulanmadan cast ediliyor:" "$(echo "$UNSAFE_PARSE" | sed 's/^/   /')
   JSON.parse unknown döner. Alanları kontrol et → mistakes.md #58"
  fi
fi

# 8. Agentic: @ag-ui/client sürümü sabitlenmiş mi?
# CopilotKit bu paketi TAM sürüme sabitler. Aralık (^/~) yazmak ikinci bir
# kopya yaratır ve HttpAgent tipi AbstractAgent'a atanamaz. -> mistakes.md #71
AGUI_PKG=$(echo "$STAGED" | grep -E '(^|/)package\.json$' || true)
if [ -n "$AGUI_PKG" ]; then
  LOOSE_AGUI=$(printf '%s\n' "$AGUI_PKG" | grep . | tr '\n' '\0' | xargs -0 grep -ln -e '"@ag-ui/[a-z]*": *"[\^~]' -- 2>/dev/null || true)
  if [ -n "$LOOSE_AGUI" ]; then
    warn "⚠️  AGENTIC: @ag-ui/* sürümü aralıkla yazılmış (^ veya ~):" "$(echo "$LOOSE_AGUI" | sed 's/^/   /')
   CopilotKit tam sürüme sabitler; aralık çift kopya üretir → mistakes.md #71"
  fi
fi

# 9. Commit mesajı conventional format'ta mı? (rules/commit-conventions.md)
# Mesaj komut metninden çıkarılır; heredoc/karmaşık tırnaklamada ayrıştırma
# garantisi yok, bu yüzden yalnız UYARI: desen komutun hiçbir yerinde yoksa.
# (Komut grep'e here-string ile: `grep -q` erken çıkınca boru SIGPIPE alır.)
if grep -qE '(^|[[:space:]])(-m|--message)([[:space:]]|=)' <<<"$CMD_TEXT"; then
  if ! grep -qE '(feat|fix|hotfix|refactor|style|perf|test|docs|chore|ci)(\([a-z0-9_.-]+\))?: |Merge |Revert ' <<<"$CMD_TEXT"; then
    warn "⚠️  COMMIT: Mesaj conventional format'a uymuyor görünüyor:" \
      "   beklenen: <tip>(<scope>): <açıklama> — rules/commit-conventions.md"
  fi
fi

# 10. fix commit'inde test değişikliği var mı? (rules/bugfix-protocol.md: TDD —
# önce failing test). Kod değişen ama test dosyası içermeyen fix → uyarı.
if grep -qE '(fix|hotfix)(\([a-z0-9_.-]+\))?:' <<<"$CMD_TEXT"; then
  FIX_CODE=$(echo "$STAGED" | grep -E '\.(tsx?|jsx?)$' | grep -vE '\.test\.|\.spec\.|(^|/)tests?/' || true)
  FIX_TESTS=$(echo "$STAGED" | grep -E '\.test\.|\.spec\.|(^|/)tests?/' || true)
  if [ -n "$FIX_CODE" ] && [ -z "$FIX_TESTS" ]; then
    warn "⚠️  BUGFIX: fix commit'inde test değişikliği yok (rules/bugfix-protocol.md)." \
      "   Önce failing test, sonra düzeltme. Test yazılamıyorsa gerekçesi commit gövdesine.
   Kalıcı ders varsa: ~/dev-starter/knowledge/mistakes.md (/retro ile)."
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
    warn "⚠️  TEST: diff test atlatan çağrı ekliyor (.only/.skip/xit):" "$(echo "$WEAKENED" | head -5 | sed 's/^/   /')"
  fi
fi

# Sonuç
if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "❌ Quality scan FAILED — $ERRORS hata, $WARNINGS uyarı"
  echo "   Hataları düzeltin ya da ilgili dosyayı stage dışına alın"
  echo "   (git restore --staged <dosya>). --no-verify bu hook'u ATLATMAZ."
  exit 2
fi

if [ $WARNINGS -gt 0 ]; then
  echo ""
  echo "⚠️  Quality scan: $WARNINGS uyarı (commit devam ediyor)"
  # Özet modele: hookSpecificOutput.additionalContext, gerçek stdout'a (fd 3).
  # jq yoksa python3; ikisi de yoksa uyarılar yalnız transcript'te kalır.
  MSG="quality-scan uyarıları (commit engellenmedi; meşruysa yok say, değilse düzelt):"$'\n'"$WARN_TEXT"
  if command -v jq >/dev/null 2>&1; then
    jq -n --arg m "$MSG" '{hookSpecificOutput: {hookEventName: "PreToolUse", additionalContext: $m}}' >&3 || true
  elif command -v python3 >/dev/null 2>&1; then
    MSG="$MSG" python3 -c 'import json, os; print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse", "additionalContext": os.environ["MSG"]}}))' >&3 || true
  fi
fi

exit 0
