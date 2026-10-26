#!/usr/bin/env bash
# Project Standards Audit — bir projeyi ekosistem standartlarina karsi denetler
#
# Kullanim:
#   bash scripts/audit-project.sh ~/Desktop/Projects/acilis-zili
#   bash scripts/audit-project.sh ~/Desktop/Projects/*/     # toplu
#
# Neyi kontrol eder (rules/design-tokens.md):
#   1. Degrade metin  — bg-clip-text
#   2. Elle yazilmis renk degradesi — tek imza token'i disi
#   3. violet/purple/fuchsia sizintisi
#   4. width/height animasyonu — layout thrash
#   5. Emoji ikon
#   6. ESLint yapilandirmasi (flat config, `next lint` yok)
#   7. Isik modu kontrasti — dark: esi olmayan acik metin
#   8. Tech stack uyumu — Tailwind v4, Next 16 proxy.ts, motion/react
#   9. Mobil ust kenar (iOS saydam baslik, dokunmatik spotlight)
#  10. Ekosistem disiplini — hook kaydi, ROUTEMAP, test altyapisi
#  11. AI slop — scripts/slop-scan.sh (tek tarafli serit, olu baglanti,
#      dolgu sozcugu, yer tutucu, transition-all, gokkusagi degrade...)
#
# Cikis kodu: bulgu varsa 1, temizse 0

set -uo pipefail

TARGET="${1:-.}"
TARGET="${TARGET%/}"

if [ ! -d "$TARGET" ]; then
  echo "❌ Dizin bulunamadi: $TARGET" >&2
  exit 2
fi

NAME=$(basename "$TARGET")
EXCLUDES=(--exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist
          --exclude-dir=build --exclude-dir=.git --exclude-dir=coverage
          --exclude-dir=.turbo --exclude-dir=out)
INCLUDES=(--include=*.tsx --include=*.ts --include=*.jsx --include=*.css)

FINDINGS=0
section() { echo ""; echo "  ── $1"; }
hit()  { FINDINGS=$((FINDINGS + 1)); echo "     ⚠️  $1"; }
ok()   { echo "     ✅ $1"; }

# grep sonucunu say + ilk N ornegi goster
report() {
  local label="$1" out="$2" limit="${3:-3}" count
  if [ -z "$out" ]; then ok "$label — temiz"; return; fi
  count=$(printf '%s\n' "$out" | wc -l | tr -d ' ')
  hit "$label — $count adet"
  printf '%s\n' "$out" | head -"$limit" | sed "s|$TARGET/||" | sed 's/^/          /'
  [ "$count" -gt "$limit" ] && echo "          … +$((count - limit)) tane daha"
  return 0
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  $NAME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─── 1. Degrade metin ────────────────────────────────────────────────────────
section "Degrade metin (AI tell)"
report "bg-clip-text / background-clip:text" \
  "$(grep -rn "${EXCLUDES[@]}" "${INCLUDES[@]}" -E 'bg-clip-text|background-clip:\s*text' "$TARGET" 2>/dev/null)"

# ─── 2. Elle yazilmis renk degradesi ─────────────────────────────────────────
section "Elle yazilmis renk degradesi"
report "from-X (via-Y) to-Z — token disi" \
  "$(grep -rn "${EXCLUDES[@]}" "${INCLUDES[@]}" -E 'from-[a-z]+-[0-9]+ +(via-[a-z]+-[0-9]+ +)?to-[a-z]+-[0-9]+' "$TARGET" 2>/dev/null)" 4

# ─── 3. Violet/purple sizintisi ──────────────────────────────────────────────
section "Marka disi renk (violet/purple/fuchsia)"
report "violet/purple/fuchsia" \
  "$(grep -rn "${EXCLUDES[@]}" "${INCLUDES[@]}" -E '(bg|from|via|to|text|border|ring|shadow)-(violet|purple|fuchsia)-[0-9]+' "$TARGET" 2>/dev/null)" 4

# ─── 4. Layout animasyonu ────────────────────────────────────────────────────
section "Layout property animasyonu"
report "transition: width/height" \
  "$(grep -rn "${EXCLUDES[@]}" "${INCLUDES[@]}" -E "transition:[^;\"']*(width|height)|transition-\[[^]]*(width|height)" "$TARGET" 2>/dev/null)"

# ─── 5. Emoji ikon ───────────────────────────────────────────────────────────
section "Emoji ikon"
# grep -P macOS'ta (BSD grep) yok, GNU'da da UTF-8 olmayan yerelde \x{...}
# hatasi verir; ikisi de 2>/dev/null ile yutulup "temiz" gorunuyordu. perl
# macOS'ta hazir gelir. Budanan dizinler EXCLUDES'un aynisi. Satir elle
# cozulur (-CSD degil): UTF-8 olmayan tek dosyada -CSD perl'u fatal dusurur ve
# xargs grubundaki sonraki dosyalar hic taranmadan rapor "temiz" cikar.
EMOJI_HITS=$(find "$TARGET" -mindepth 1 \( -name node_modules -o -name .next -o -name dist -o -name build \
    -o -name .git -o -name coverage -o -name .turbo -o -name out \) -prune \
    -o \( -name '*.tsx' -o -name '*.jsx' \) -type f -print0 2>/dev/null \
  | xargs -0 perl -CSA -ne 'my $l = $_; print "$ARGV:$.:$l" if utf8::decode($l) && $l =~ /(?<![\w-])[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}\x{2B00}-\x{2BFF}]/; close ARGV if eof' 2>/dev/null)
report "JSX icinde emoji" "$EMOJI_HITS" 4

# ─── 6. ESLint yapilandirmasi ────────────────────────────────────────────────
section "ESLint yapilandirmasi"
if [ -f "$TARGET/package.json" ] && grep -q '"lint"' "$TARGET/package.json" 2>/dev/null; then
  # Her deseni ayri dene: `ls a* b*` eslesmeyen desen yuzunden non-zero doner
  # ve mevcut config'i gormezden gelir
  # ESLint 9 yalnizca flat config okur: eslint.config.{mjs,js,ts,cjs}.
  # .eslintrc.* tek basina varsa sessizce yok sayilir — config YOK gibi.
  ESLINT_CFG=""
  for pattern in "$TARGET"/eslint.config.*; do
    [ -f "$pattern" ] && { ESLINT_CFG=$(basename "$pattern"); break; }
  done
  LEGACY_CFG=""
  for pattern in "$TARGET"/.eslintrc "$TARGET"/.eslintrc.*; do
    [ -f "$pattern" ] && { LEGACY_CFG=$(basename "$pattern"); break; }
  done
  if [ -n "$ESLINT_CFG" ]; then
    ok "lint script'i + flat config mevcut ($ESLINT_CFG)"
  elif [ -n "$LEGACY_CFG" ]; then
    hit "yalnizca $LEGACY_CFG var — ESLint 9 okumaz, eslint.config.mjs'e tasi"
  else
    hit "lint script'i var ama ESLint config YOK"
  fi
  # Next 16'da `next lint` komutu kaldirildi
  if grep -qE '"lint"[[:space:]]*:[[:space:]]*"next lint' "$TARGET/package.json"; then
    hit "\"lint\": \"next lint\" — Next 16'da yok, \"eslint\" kullan"
  fi
else
  echo "     ℹ️  lint script'i yok"
fi

# ─── 7. Isik modu kontrasti ──────────────────────────────────────────────────
section "Isik modu kontrasti"
# Olcut: tema DEGISTIRICISI var mi — `darkMode: 'class'` tek basina yetmez,
# dark-only projeler de onu tanimliyor. Tek temali bir projede `text-white`
# dogru kullanimdir; oralarda bu kontrol saf gurultu uretiyordu
# (karalama'da 108, onepiece-hub'da 53 sahte bulgu).
if grep -rqE "setTheme|toggleTheme|useTheme\(\)" \
     "$TARGET" "${EXCLUDES[@]}" --include=*.tsx --include=*.ts 2>/dev/null; then
  # Acik metin rengi + isik modunda karsiligi yok => gorunmez olabilir.
  #
  # Iki yanlis pozitif kaynagi elenir, yoksa sayi kullanilamaz sisiyor:
  #   1. className icinde HERHANGI bir `dark:` varyanti  -> eleman tema-bilincli
  #      (`dark:text-` filtresi `dark:hover:text-white`i kaciriyordu)
  #   2. className icinde `bg-` var -> eleman kendi zeminini boyuyor
  #      (primary buton uzerinde `text-white` DOGRU kullanimdir)
  #
  # Kalanlar yine de kesin ihlal degil; zemini ebeveynden alan adaylar.
  # Manuel dogrulama gerektirir.
  report "acik metin — isik modu adayi (manuel dogrulama gerekir)" \
    "$(grep -rn "${EXCLUDES[@]}" --include=*.tsx --include=*.jsx \
       -E 'className="[^"]*\btext-(white|slate-100|slate-200)\b[^"]*"' "$TARGET" 2>/dev/null \
       | grep -v 'dark:' | grep -vE 'className="[^"]*\bbg-' || true)" 4
else
  echo "     ℹ️  tema sistemi saptanmadi, atlandi"
fi

# ─── 8. Tech stack uyumu ──────────────────────────────────────────────────────
section "Tech stack uyumu (Tailwind v4, Next 16, motion)"
if [ -f "$TARGET/package.json" ] && grep -q '"tailwindcss"' "$TARGET/package.json"; then
  # Tailwind v4: `@import "tailwindcss"` + @tailwindcss/postcss. v3'un
  # `@tailwind` direktifi v4'te hicbir utility uretmez — build yine yesildir.
  V3_DIRECTIVE=$(grep -rln "${EXCLUDES[@]}" --include=*.css -E '^[[:space:]]*@tailwind ' "$TARGET" 2>/dev/null || true)
  if [ -n "$V3_DIRECTIVE" ]; then
    report "v3 @tailwind direktifi (v4'te '@import \"tailwindcss\";')" "$V3_DIRECTIVE"
  elif grep -rqsE "${EXCLUDES[@]}" --include=*.css "@import ['\"]tailwindcss['\"]" "$TARGET"; then
    if grep -qs '@tailwindcss/postcss' "$TARGET"/postcss.config.* 2>/dev/null; then
      ok "Tailwind v4 (@import + @tailwindcss/postcss)"
    else
      hit "@import \"tailwindcss\" var ama postcss.config'te @tailwindcss/postcss yok"
    fi
  fi
fi
for mw in middleware.ts middleware.js src/middleware.ts src/middleware.js; do
  if [ -f "$TARGET/$mw" ]; then
    hit "$mw — Next 16'da proxy.ts (export function proxy) olmali"
  fi
done
report "framer-motion importu ('motion/react' kullan)" \
  "$(grep -rn "${EXCLUDES[@]}" --include=*.ts --include=*.tsx -E "from ['\"]framer-motion['\"]" "$TARGET" 2>/dev/null)" 3

# ─── 9. Mobil üst kenar (iOS 26 Safari "buğulu üst") ─────────────────────────
# Derinay, 3 Ekim 2026: sayfanın üstü telefonda buğulu görünüyordu. İki
# sebep: (1) sabit/yapışkan başlık en üstte SAYDAM başlıyordu; iOS 26 Safari
# saydam üst katmanda durum çubuğunun altına kendi bulanık kenar efektini
# uyguluyor. (2) Fareyi izleyen spotlight kaba imleçte de dinliyordu; iOS
# dokunuşta mousemove gönderdiği için ışık dokunulan yerde takılı kalıyordu.
section "Mobil ust kenar (saydam sabit baslik, dokunmatikte spotlight)"
# Başlığın sınıfı çoğu zaman bir sonraki satırdaki koşulda; dosyanın tamamı
# değil, `top-0` satırı ve onu izleyen 3 satır aranır (dosya düzeyinde arama
# sekme noktası gibi küçük öğelerdeki bg-transparent'ı da yakalıyordu).
TOP_TRANSPARENT=$(grep -rn -A3 "${EXCLUDES[@]}" --include=*.tsx -E "(fixed|sticky)[^\"'\`]*top-0" "$TARGET" 2>/dev/null \
  | grep -E "(^|[\"'\` ])bg-transparent([\"'\` ]|$)" \
  | grep -vE "(sm|md|lg|xl):bg-transparent" \
  | sed -E 's/^([^:]+)[-:][0-9]+[-:].*/\1/' | sed "s#^$TARGET/##" | sort -u || true)
report "Sabit/yapışkan başlık telefonda saydam başlıyor (telefonda opak zemin ver, saydamlık md: ile)" "$TOP_TRANSPARENT"
# xargs boş girdiyle grep'i stdin'e düşürür ve "(standard input)" sahte
# bulgusu üretir; önce liste boş mu diye bak (GNU -r bayrağı BSD'de yok).
SPOT_FILES=$(grep -rln "${EXCLUDES[@]}" --include=*.ts --include=*.tsx "addEventListener('mousemove'" "$TARGET" 2>/dev/null || true)
SPOT_ANY=""
if [ -n "$SPOT_FILES" ]; then
  SPOT_ANY=$(printf '%s\n' "$SPOT_FILES" | xargs grep -L "pointer: fine\|pointer:fine" 2>/dev/null || true)
fi
report "mousemove dinleyicisi ince imleç kontrolü olmadan ((hover: hover) and (pointer: fine))" "$SPOT_ANY"

# ─── 10. Ekosistem disiplini ─────────────────────────────────────────────────
# Tasarim kurallari kadar surec kurallari da denetlenir: hook'suz proje
# kurallari yalniz kagitta tasir (bkz. mistakes.md #99 cevresi).
section "Ekosistem disiplini (hook, ROUTEMAP, test altyapisi)"

# Dort hook da aranir: yalniz gate-guard'a bakmak, sir ve kilit taramasini
# yapan quality-scan'in kaydi dusmus projeyi temiz gosteriyordu.
HOOK_MISSING=""
for h in gate-guard quality-scan routemap-sync session-brief; do
  grep -qs "hooks/$h\.sh" "$TARGET/.claude/settings.json" || HOOK_MISSING="$HOOK_MISSING $h"
done
if [ -z "$HOOK_MISSING" ]; then
  ok "Claude Code hook'lari kayitli (.claude/settings.json)"
elif [ "$HOOK_MISSING" = " gate-guard quality-scan routemap-sync session-brief" ]; then
  hit "Hook kaydi yok — gate-guard/quality-scan bu projede calismiyor (sablon .claude/settings.json'u kopyala)"
else
  hit "Eksik hook kaydi:$HOOK_MISSING — sablonun .claude/settings.json'uyla karsilastir"
fi

if [ -f "$TARGET/docs/ROUTEMAP.md" ] || [ -f "$TARGET/ROUTEMAP.md" ]; then
  RM="$TARGET/docs/ROUTEMAP.md"; [ -f "$RM" ] || RM="$TARGET/ROUTEMAP.md"
  if grep -qs '| *Gate *|' "$RM"; then
    ok "ROUTEMAP mevcut ve Gate kolonu ayristirabilir"
  else
    hit "ROUTEMAP var ama story tablosunda Gate kolonu yok — gate-guard calisamaz (sablon: templates/docs/ROUTEMAP.template.md)"
  fi
else
  hit "docs/ROUTEMAP.md yok — durum takibi ve session resume calismaz"
fi

for script in test typecheck lint; do
  if grep -qs "\"$script\"" "$TARGET/package.json"; then
    ok "package.json '$script' script'i var"
  else
    hit "package.json '$script' script'i yok — /check ve Gate bu adimi kosamaz"
  fi
done

# ─── 11. AI slop ─────────────────────────────────────────────────────────────
# Kurallarin tek kaynagi slop-scan.sh; burada yalniz cagrilir ve ozetlenir.
section "AI slop (scripts/slop-scan.sh)"
SLOP_OUT=$(bash "$(dirname "$0")/slop-scan.sh" --quiet "$TARGET" 2>&1)
SLOP_SUM=$(printf '%s\n' "$SLOP_OUT" | grep 'SONUC' | sed 's/.*SONUC: //')
if printf '%s' "$SLOP_SUM" | grep -q '^0 yuksek, 0 uyari'; then
  ok "AI slop taramasi — temiz"
else
  hit "AI slop taramasi — $SLOP_SUM"
  printf '%s\n' "$SLOP_OUT" | grep -E '❌|⚠️' | sed 's/^ */          /'
fi

echo ""
echo "  ─────────────────────────────────────────────"
if [ $FINDINGS -eq 0 ]; then
  echo "  SONUC: $NAME — standartlari karsiliyor ✅"
  echo "  ─────────────────────────────────────────────"
  exit 0
fi
echo "  SONUC: $NAME — $FINDINGS kategoride bulgu"
echo "  ─────────────────────────────────────────────"
exit 1
