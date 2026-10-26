#!/usr/bin/env bash
# AI Slop Taramasi — arayuzu "sablondan cikmis" gosteren kaliplari koddan bulur
#
# Kullanim:
#   bash ~/dev-starter/scripts/slop-scan.sh                 # bulundugun dizin
#   bash ~/dev-starter/scripts/slop-scan.sh app components  # birden cok yol
#   bash ~/dev-starter/scripts/slop-scan.sh --quiet .       # yalniz bulgular + sonuc
#
# Iki seviye:
#   YUKSEK — kimlik ya da kalite kurali ihlali; duzelt ya da gerekcesini yaz
#   UYARI  — cogu zaman slop, bazen kasitli; bak, karar ver
#
# Kasitli bir satiri susturmak icin ayni satira `slop-ok` yaz ve NEDENINI ekle:
#   <a href="#ust"> ... // slop-ok: sayfa basina donus capasi
# Gerekcesiz `slop-ok` gate'te bulgu sayilir (rules/design-tokens.md).
#
# Test dosyalari (*.test.*, *.spec.*, __tests__) ve .d.ts taranmaz.
# Kurallarin kaynagi: rules/design-tokens.md → AI-Slop Yasaklari;
# icerik kurallari: guides/05-components.md § 7. Davranis testi:
# scripts/test-slop-scan.sh.
#
# Cikis kodu: YUKSEK bulgu varsa 1, yoksa 0. Dizin yoksa 2.

set -uo pipefail

QUIET=0
PATHS=()
for arg in "$@"; do
  case "$arg" in
    --quiet|-q) QUIET=1 ;;
    -h|--help) sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) PATHS+=("${arg%/}") ;;
  esac
done
[ ${#PATHS[@]} -eq 0 ] && PATHS=(.)
for p in "${PATHS[@]}"; do
  [ -e "$p" ] || { echo "❌ Yol bulunamadi: $p" >&2; exit 2; }
done

HIGH=0
WARNS=0

# Taranacak dosya listesi bir kez cikarilir; her kontrol ayni listeyi okur.
# Budanan dizinler audit-project.sh ile ayni.
FILES=$(find "${PATHS[@]}" \( -name node_modules -o -name .next -o -name dist -o -name build \
    -o -name .git -o -name coverage -o -name .turbo -o -name out -o -name __tests__ \) -prune \
    -o -type f \( -name '*.tsx' -o -name '*.jsx' -o -name '*.ts' -o -name '*.css' -o -name '*.mdx' -o -name '*.html' \) \
    ! -name '*.test.*' ! -name '*.spec.*' ! -name '*.d.ts' -print 2>/dev/null | sort)

if [ -z "$FILES" ]; then
  [ $QUIET -eq 0 ] && echo "  ℹ️  Taranacak dosya yok (${PATHS[*]})"
  exit 0
fi

# grep sarmalayici: dosya listesi uzerinde -nE, `slop-ok` satirlari dusulur.
# xargs bos girdide grep'i stdin'e dusurur; liste bos degil, yukarida bakildi.
scan() {
  local flags="$1" pattern="$2" globs="${3:-}"
  local list="$FILES"
  if [ -n "$globs" ]; then
    list=$(printf '%s\n' "$FILES" | grep -E "$globs" || true)
    [ -z "$list" ] && return 0
  fi
  printf '%s\n' "$list" | tr '\n' '\0' | xargs -0 grep -H $flags -- "$pattern" 2>/dev/null | grep -v 'slop-ok' || true
}

# Yorum satirlarini duser: icerik kontrolleri (dolgu sozcugu, yer tutucu, emoji,
# sayi, mesaj) arayuz metnini arar, kodun kendi aciklamasini degil. Acilis
# Zili'nin "✓ var, ✗ yok" diye yazilmis 30 yorum satiri boyle bulgu sayiliyordu.
nocomment() { grep -vE '^[^:]+:[0-9]+:[[:space:]]*(//|\*|/\*|\{/\*)' || true; }

# $1 seviye (YUKSEK|UYARI), $2 baslik, $3 neden ve dogrusu, $4 bulgular
report() {
  local level="$1" title="$2" why="$3" out="$4" count limit=4
  if [ -z "$out" ]; then
    [ $QUIET -eq 0 ] && echo "  ✅ $title"
    return 0
  fi
  count=$(printf '%s\n' "$out" | wc -l | tr -d ' ')
  if [ "$level" = "YUKSEK" ]; then
    HIGH=$((HIGH + count)); echo "  ❌ [YUKSEK] $title — $count adet"
  else
    WARNS=$((WARNS + count)); echo "  ⚠️  [UYARI] $title — $count adet"
  fi
  echo "       → $why"
  printf '%s\n' "$out" | head -$limit | cut -c1-180 | sed 's/^\.\///; s/^/         /'
  [ "$count" -gt $limit ] && echo "         … +$((count - limit)) tane daha"
  return 0
}

CODE='\.(tsx|jsx|mdx|html)$'
SCRIPT='\.(tsx|jsx|ts|mdx|html)$'

[ $QUIET -eq 0 ] && echo "━━ AI slop taramasi: ${PATHS[*]} ($(printf '%s\n' "$FILES" | wc -l | tr -d ' ') dosya)"

# ─── YUKSEK ──────────────────────────────────────────────────────────────────

# 1. Kartin tek kenarinda renkli serit. `rounded` ayni satirda: kose yuvarlak
#    bir yuzey, tek kenari kalin. Alinti cizgisi (yuvarlaksiz `border-l-2`)
#    tipografik bir ogedir, yakalanmaz. Alt kenar sayilmaz: tus kapagi
#    (kbd) ve sekme cizgisi `border-b-2` ile kasitli cizilir. `prose-*:`
#    varyantlari ayri ogelere gider (alinti cizgisi + kod kutusu), sayilmaz.
report YUKSEK "Tek tarafli vurgu seridi (kart)" \
  "Kenarlik dort yanda ya da hic. Vurguyu ton farki, kunye ya da ikon tasisin" \
  "$(scan -nE '(rounded[^"'"'"'`]*[[:space:]"'"'"'`]border-(l|r|s|e|t)-([2-9]|\[)|(^|[[:space:]"'"'"'`])border-(l|r|s|e|t)-([2-9]|\[)[^"'"'"'`]*[[:space:]"'"'"'`]rounded)' "$CODE")"

# 2. Olu baglanti: href="#" hicbir yere gitmez, klavyede sayfa basina ziplar.
report YUKSEK "Olu baglanti (href=\"#\" ya da bos)" \
  "Ya gercek adres ver ya da <button disabled>. Sayfa ici capa #kimlik tasir" \
  "$(scan -nE 'href=(\{)?["'"'"'`](#)?["'"'"'`]' "$CODE")"

# 3. Tarayicinin kendi diyaloglari: tasarim disi, odak tuzagi, mobilde kaba.
report YUKSEK "window.alert / confirm / prompt" \
  "Satir ici hata ya da snippets/confirm.tsx, snippets/toast.tsx" \
  "$(scan -nE '(^|[^.a-zA-Z_])(window\.)?(alert|confirm|prompt)\(["'"'"'`]' "$SCRIPT")"

# 4. Her ozelligi animasyona sokan gecis: width/height da animasyona girer.
report YUKSEK "transition-all / transition: all" \
  "Yalniz degisen ozelligi yaz: transition-[transform,opacity] ya da transition-colors" \
  "$(scan -nE '(\btransition-all\b|transition:[[:space:]]*all\b)')"

# 5. 900 agirlik: slop basliginin imzasi. 800 sayilmaz: Acilis Zili (ekosistemin
#    gorsel referansi) 800'u siki harf araligiyla 120 yerde bilerek kullanir.
report YUKSEK "Asiri kalin yazi (font-black / 900)" \
  "Ust sinir 800 ve siki tracking; cogu baslikta font-bold yeter" \
  "$(scan -nE '(\bfont-black\b|font-weight:[[:space:]]*900|fontWeight:[[:space:]]*["'"'"']?900)')"

# 6. Yer tutucu metin: yayina sizan sablon.
report YUKSEK "Yer tutucu metin (Lorem, John Doe, Acme...)" \
  "Urunun sesinde gercek taslak yaz; ad ve marka urunun bolgesine ve sektorune uysun" \
  "$(scan -niE '(lorem ipsum|dolor sit amet|\bjohn doe\b|\bjane doe\b|\bacme (corp|inc)\b|your (headline|title|text) here|başlık buraya|metin buraya|açıklama buraya)' "$SCRIPT" | nocomment)"

# 7. Pazarlama dolgusu: urunun ne yaptigini soylemeyen sozcukler. Ingilizce
#    sozcuk tanimlayici olamaz: once/sonra `-`, `.`, `_`, `?`, `:` olmaz
#    (iso-kit'in `seamless?: boolean`i, `data-seamless`). "Oyunun kurallari"
#    yalniz "degistir"le kalip: oyun yazisinda duz anlamiyla gecer.
report YUKSEK "Pazarlama dolgusu sozcukleri" \
  "Urunun ne yaptigini duz yaz: 'Haftalik raporu 4 saatten 15 dakikaya indirir'" \
  "$(scan -niE '(devrim (yarat|niteli)|bir üst seviyeye|gücünü (keşfe|kullan|açığa)|potansiyelini (açığa|ortaya)|zahmetsiz|sorunsuz deneyim|çığır açan|dünya standartlarında|son teknoloji ürün|oyunun kurallarını değiştir|(^|[^-._$[:alnum:]])(revolutioni[sz]e|supercharge|cutting[- ]edge|next level|harness the power|world[- ]class|effortless(ly)?|seamless(ly)?|game[- ]chang|unlock (your|the) (potential|power)|elevate your)([^-_?:[:alnum:]]|$))' "$SCRIPT" | nocomment)"

# 8. Gokkusagi degrade: kimlik kurali 5 — degrade tek renk ailesi icinde.
RAINBOW=$(printf '%s\n' "$FILES" | grep -E "$SCRIPT" | tr '\n' '\0' \
  | xargs -0 perl -ne 'next if /slop-ok/; while (/\bfrom-([a-z]+)-\d+\s+(?:via-([a-z]+)-\d+\s+)?to-([a-z]+)-\d+/g) { my %f = map { $_ => 1 } grep { defined } ($1, $2, $3); if (keys %f > 1) { print "$ARGV:$.:$_"; last } } close ARGV if eof' 2>/dev/null || true)
report YUKSEK "Gokkusagi degrade (birden cok renk ailesi)" \
  "Degrade tek ailede: koyudan aciga ayni ton, token'dan (--brand-gradient)" "$RAINBOW"

# 9. Emoji ikon: platformdan platforma farkli cizilir, ikon kitinin yerini tutmaz.
#    Yalniz emoji gorunumlu karakterler: U+1F300-1FAFF, ⭐ ✅ ❌ ✨ ⚡ ❤ ve FE0F
#    secicisi alan her karakter. ★ ✓ ✗ ✎ gibi metin isaretleri tipografidir
#    (puan yildizi, onay isareti), sayilmaz. Yorum satiri sayilmaz.
#    Satir elle cozulur, -CSD degil: UTF-8 olmayan tek dosya perl'u dusurmesin
#    (audit-project.sh § 5 ile ayni gerekce).
EMOJI=$(printf '%s\n' "$FILES" | grep -E "$CODE" | tr '\n' '\0' \
  | xargs -0 perl -CSA -ne 'my $l = $_; next if $l =~ /slop-ok/; next if $l =~ m{^\s*(//|\*|/\*|\{/\*)}; print "$ARGV:$.:$l" if utf8::decode($l) && $l =~ /(?<![\w-])(?:[\x{1F300}-\x{1FAFF}\x{2B50}\x{2705}\x{274C}\x{2728}\x{26A1}\x{2764}]|.\x{FE0F})/; close ARGV if eof' 2>/dev/null || true)
report YUKSEK "JSX icinde emoji ikon" "lucide-react ikonu, boyut ve renk token'dan" "$EMOJI"

# ─── UYARI ───────────────────────────────────────────────────────────────────

# 10. Kisitsiz kaydirma dinleyicisi: her karede calisir, mobilde kasar.
SCROLL_FILES=$(scan -lE "addEventListener\([\"']scroll" "$SCRIPT")
SCROLL_RAW=""
if [ -n "$SCROLL_FILES" ]; then
  SCROLL_RAW=$(printf '%s\n' "$SCROLL_FILES" | tr '\n' '\0' | xargs -0 grep -L 'requestAnimationFrame\|passive' 2>/dev/null || true)
fi
report UYARI "Kaydirma dinleyicisi (rAF ya da passive yok)" \
  "useScroll / useInView / IntersectionObserver; elle dinleyicide { passive: true } + rAF" "$SCROLL_RAW"

# 11. Nesneyi sifirdan buyutmek: yalniz cizgi ve cubuk 0'dan cizilir.
#     Yalniz JS hareket nesnesi (`initial={{ scale: 0 }}`) ya da `scale(0)`.
#     CSS'in `scale: 0 1`i scaleX(0)'dir: cizgi cizer (Acilis Zili, blog.css);
#     Tailwind `scale-0` ve CSS `scale:0` gostergeleri (radyo noktasi) durum
#     degisimidir, giris koreografisi degil. Ikisi de sayilmaz.
report UYARI "Nesne scale(0)'dan buyuyor" \
  "Nesne 0.82-0.9'dan gelsin; scaleX/scaleY(0) yalniz cizgi ve cubuk icin" \
  "$(scan -nE '(\bscale:[[:space:]]*0[[:space:]]*[,}]|\bscale\(0\))' "$SCRIPT")"

# 12. Keyfi punto: rol adli olcek disi.
report UYARI "Keyfi punto (text-[Npx])" \
  "Rol adli olcek: text-small, text-read, text-title... (guides/02 § 3)" \
  "$(scan -noE 'text-\[[0-9.]+(px|rem|em)\]' "$SCRIPT")"

# 13. Sevimli unlem ve sozde samimiyet: sistem mesaji sakin ve somut olur.
report UYARI "Sevimli sistem mesaji (Oops, Harika!, Tebrikler!)" \
  "Ne oldu + ne yapmali: 'Dosya 20 MB'tan buyuk. Daha kucuk bir dosya sec.'" \
  "$(scan -niE '["'"'"'`>[:space:]](oops|whoops|hay aksi|eyvah|woohoo|yay!|harika!|süper!|tebrikler!|mükemmel!)' "$SCRIPT" | nocomment)"

# 14. Supheli yuvarlak sayi: uydurma kesinlik kokar (guides/08 § 5).
#     CSS'in '100%'u sayilmaz; yuzde yalniz yaninda bir sozcuk varsa
#     ("%100 memnuniyet", "99% uptime") ya da Turkce on ek bicimindeyse.
report UYARI "Supheli yuvarlak sayi (10.000+, %100, 1M+, 10x)" \
  "Gercek veri yoksa kaldir; varsa oldugu gibi yaz (2.418, %38) ve tarihini ver" \
  "$(scan -nE '(["'"'"'`>[:space:]](%(99|100)\b|[1-9]0{1,2}[.,]000\+|[1-9][0-9]?[KkMmBb]\+|10[xX]\b|[1-9]0+\+)|\b(99|100)% [[:alpha:]])' "$SCRIPT" | nocomment)"

# 15. Material ikonlari: lucide ile ayni ekranda iki farkli cizgi dili.
report UYARI "Material ikon kiti" \
  "Ekosistemin ikon kiti lucide-react; tek kit, tek cizgi kalinligi" \
  "$(scan -nE "(@mui/icons-material|material-symbols|material-icons|@material-design-icons)" "$SCRIPT")"

# ─── Sonuc ───────────────────────────────────────────────────────────────────
echo "  ── SONUC: $HIGH yuksek, $WARNS uyari"
[ $HIGH -gt 0 ] && exit 1
exit 0
