#!/usr/bin/env bash
# Project Standards Audit — bir projeyi ekosistem standartlarina karsi denetler
#
# Kullanim:
#   bash scripts/audit-project.sh ~/Desktop/Projects/acilis-zili
#   bash scripts/audit-project.sh ~/Desktop/Projects/*/     # toplu
#
# Neyi kontrol eder (rules/design-tokens.md):
#   1. Impeccable detector (59 anti-pattern kurali)
#   2. Degrade metin  — bg-clip-text
#   3. Elle yazilmis renk degradesi — tek imza token'i disi
#   4. violet/purple/fuchsia sizintisi
#   5. width/height animasyonu — layout thrash
#   6. Emoji ikon
#   7. ESLint yapilandirmasi (lint script'i varsa)
#   8. Isik modu kontrasti — dark: esi olmayan acik metin
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

# ─── 1. Impeccable detector ──────────────────────────────────────────────────
section "Impeccable detector"
SCAN_DIRS=()
for d in app src components lib pages; do
  [ -d "$TARGET/$d" ] && SCAN_DIRS+=("$TARGET/$d")
done
# Monorepo: kokte konvansiyonel dizin yoksa bir kat asagi bak. Yoksa detector
# hicbir sey taramazken grep'ler tum agaci tariyor ve rapor tutarsiz cikiyor
# (keskealsaydim: Go backend + frontend/src icinde Next.js).
if [ ${#SCAN_DIRS[@]} -eq 0 ]; then
  for sub in frontend web client apps/*; do
    for d in app src components; do
      [ -d "$TARGET/$sub/$d" ] && SCAN_DIRS+=("$TARGET/$sub/$d")
    done
  done
fi
if [ ${#SCAN_DIRS[@]} -eq 0 ]; then
  echo "     ℹ️  taranacak kaynak dizini yok"
else
  # Yerel binary varsa onu kullan — npx her cagrida indirme denemesi yapiyor
  REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
  if [ -x "$REPO_ROOT/node_modules/.bin/impeccable" ]; then
    IMP=("$REPO_ROOT/node_modules/.bin/impeccable")
  elif command -v impeccable >/dev/null 2>&1; then
    IMP=(impeccable)
  else
    IMP=(npx -y impeccable@latest)
  fi
  # --json zorunlu: insan-okunur cikti stderr'e gidiyor, stdout bos kaliyor
  # ve tarama sessizce "temiz" gorunuyor
  DETECT_JSON=$("${IMP[@]}" detect --json "${SCAN_DIRS[@]}" 2>/dev/null)
  SUMMARY=$(printf '%s' "$DETECT_JSON" | node -e "
    let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{
      let arr=[];try{arr=Object.values(JSON.parse(s||'{}'))}catch{}
      if(!arr.length){console.log('CLEAN');return}
      const by={};arr.forEach(f=>{const k=f.antipattern+' ['+f.category+']';by[k]=(by[k]||0)+1});
      console.log('TOTAL:'+arr.length);
      Object.entries(by).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log(v+'x  '+k));
      arr.slice(0,3).forEach(f=>console.log('@ '+f.file.split('/').slice(-2).join('/')+':'+f.line));
    })" 2>/dev/null)
  if [ "$SUMMARY" = "CLEAN" ] || [ -z "$SUMMARY" ]; then
    ok "0 bulgu"
  else
    hit "$(printf '%s' "$SUMMARY" | head -1 | sed 's/TOTAL:/bulgu: /')"
    printf '%s\n' "$SUMMARY" | tail -n +2 | sed 's/^/          /'
  fi
fi

# ─── 2. Degrade metin ────────────────────────────────────────────────────────
section "Degrade metin (AI tell)"
report "bg-clip-text / background-clip:text" \
  "$(grep -rn "${EXCLUDES[@]}" "${INCLUDES[@]}" -E 'bg-clip-text|background-clip:\s*text' "$TARGET" 2>/dev/null)"

# ─── 3. Elle yazilmis renk degradesi ─────────────────────────────────────────
section "Elle yazilmis renk degradesi"
report "from-X (via-Y) to-Z — token disi" \
  "$(grep -rn "${EXCLUDES[@]}" "${INCLUDES[@]}" -E 'from-[a-z]+-[0-9]+ +(via-[a-z]+-[0-9]+ +)?to-[a-z]+-[0-9]+' "$TARGET" 2>/dev/null)" 4

# ─── 4. Violet/purple sizintisi ──────────────────────────────────────────────
section "Marka disi renk (violet/purple/fuchsia)"
report "violet/purple/fuchsia" \
  "$(grep -rn "${EXCLUDES[@]}" "${INCLUDES[@]}" -E '(bg|from|via|to|text|border|ring|shadow)-(violet|purple|fuchsia)-[0-9]+' "$TARGET" 2>/dev/null)" 4

# ─── 5. Layout animasyonu ────────────────────────────────────────────────────
section "Layout property animasyonu"
report "transition: width/height" \
  "$(grep -rn "${EXCLUDES[@]}" "${INCLUDES[@]}" -E "transition:[^;\"']*(width|height)|transition-\[[^]]*(width|height)" "$TARGET" 2>/dev/null)"

# ─── 6. Emoji ikon ───────────────────────────────────────────────────────────
section "Emoji ikon"
report "JSX icinde emoji" \
  "$(grep -rnP "${EXCLUDES[@]}" --include=*.tsx --include=*.jsx \
     '(?<![\w-])[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}\x{2B00}-\x{2BFF}]' "$TARGET" 2>/dev/null)" 4

# ─── 7. ESLint yapilandirmasi ────────────────────────────────────────────────
section "ESLint yapilandirmasi"
if [ -f "$TARGET/package.json" ] && grep -q '"lint"' "$TARGET/package.json" 2>/dev/null; then
  # Her deseni ayri dene: `ls a* b*` eslesmeyen desen yuzunden non-zero doner
  # ve mevcut config'i gormezden gelir
  ESLINT_CFG=""
  for pattern in "$TARGET"/.eslintrc "$TARGET"/.eslintrc.* "$TARGET"/eslint.config.*; do
    [ -f "$pattern" ] && { ESLINT_CFG=$(basename "$pattern"); break; }
  done
  if [ -n "$ESLINT_CFG" ]; then
    ok "lint script'i + config mevcut ($ESLINT_CFG)"
  else
    hit "lint script'i var ama ESLint config YOK — 'next lint' sihirbaza duser"
  fi
else
  echo "     ℹ️  lint script'i yok"
fi

# ─── 8. Isik modu kontrasti ──────────────────────────────────────────────────
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
