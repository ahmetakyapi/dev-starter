#!/usr/bin/env bash
# slop-scan.sh davranis testi — her kural kirli ornegi yakaliyor, temiz
# ornegi rahat birakiyor mu. Desen gevserse ya da fazla daralirsa burada kirilir.
#
# Kullanim: bash scripts/test-slop-scan.sh   (npm run verify:slop)

set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCAN="$ROOT/scripts/slop-scan.sh"
SANDBOX=$(mktemp -d)
trap 'rm -rf "$SANDBOX"' EXIT

PASS=0
FAIL=0
ok() { PASS=$((PASS + 1)); echo "  ✅ $1"; }
no() { FAIL=$((FAIL + 1)); echo "  ❌ $1"; echo "     beklenen: $2"; echo "     gelen:    $3"; }

# ─── Kirli ornek: her kural icin bir satir ───────────────────────────────────
mkdir -p "$SANDBOX/kirli"
cat > "$SANDBOX/kirli/Kart.tsx" <<'EOF'
export function Kart() {
  return (
    <div className="rounded-xl border-l-4 border-primary bg-surface p-6 transition-all">
      <h2 className="font-black text-[22px]">Lorem ipsum dolor sit amet</h2>
      <p>İş akışını bir üst seviyeye taşıyın ve ekibinizin gücünü keşfedin.</p>
      <p>Supercharge your workflow with seamless sync.</p>
      <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400">Yeni</span>
      <span>🚀</span>
      <strong>"10.000+"</strong>
      <a href="#">Daha Fazla</a>
      <button onClick={() => alert("Kaydedildi")}>Kaydet</button>
    </div>
  );
}
EOF
cat > "$SANDBOX/kirli/hareket.ts" <<'EOF'
import { Home } from "@mui/icons-material";
export const pop = { initial: { scale: 0 }, animate: { scale: 1 } };
export const mesaj = "Oops, bir şey ters gitti";
window.addEventListener("scroll", () => document.body.classList.toggle("k"));
EOF

OUT=$(bash "$SCAN" "$SANDBOX/kirli" 2>&1)
CODE=$?
if [ $CODE -eq 1 ]; then ok "kirli dizin → exit 1"; else no "kirli dizin exit kodu" "1" "$CODE"; fi

expect() {
  if printf '%s' "$OUT" | grep -qF -- "$1"; then ok "yakalandi: $1"; else no "yakalanmadi: $1" "raporda '$1'" "$(printf '%s' "$OUT" | grep -E '❌|⚠️' | head -20)"; fi
}
expect "[YUKSEK] Tek tarafli vurgu seridi"
expect "[YUKSEK] Olu baglanti"
expect "[YUKSEK] window.alert"
expect "[YUKSEK] transition-all"
expect "[YUKSEK] Asiri kalin yazi"
expect "[YUKSEK] Yer tutucu metin"
expect "[YUKSEK] Pazarlama dolgusu sozcukleri — 2 adet"
expect "[YUKSEK] Gokkusagi degrade"
expect "[YUKSEK] JSX icinde emoji ikon"
expect "[UYARI] Kaydirma dinleyicisi"
expect "[UYARI] Nesne scale(0)"
expect "[UYARI] Keyfi punto"
expect "[UYARI] Sevimli sistem mesaji"
expect "[UYARI] Supheli yuvarlak sayi"
expect "[UYARI] Material ikon kiti"

# ─── Temiz ornek: benzer gorunen ama dogru kullanimlar ───────────────────────
mkdir -p "$SANDBOX/temiz"
cat > "$SANDBOX/temiz/Temiz.tsx" <<'EOF'
export function Temiz() {
  return (
    <section className="rounded-xl border border-line bg-surface p-6 transition-[transform,opacity]">
      {/* Alinti cizgisi yuvarlaksiz: tipografik oge, kart degil */}
      <figure className="border-l-2 border-primary pl-6">
        <blockquote>Üç ayrı araçtan bire indik.</blockquote>
      </figure>
      <kbd className="rounded-md border border-line border-b-2">K</kbd>
      <h2 className="font-bold text-title">Dağınık İşleri Tek Akışta Topla</h2>
      <p className="bg-brand">2.418 Aktif Ekip · %38 Daha Kısa Teslim</p>
      <span className="bg-gradient-to-r from-blue-700 to-blue-400">Tek aile</span>
      <a href="#ozellikler">Özellikler</a>
      <span className="scale-0 peer-checked:scale-100">radyo noktasi</span>
      <span className="badge">Yayında</span>
      <a href="#">Başa Dön</a>{/* slop-ok: kasitli; test susturmayi dogrular */}
    </section>
  );
}
EOF
cat > "$SANDBOX/temiz/hareket.ts" <<'EOF'
export const bar = { initial: { scaleX: 0 }, animate: { scaleX: 1 } };
export const pop = { initial: { scale: 0.86, opacity: 0 }, animate: { scale: 1, opacity: 1 } };
export const parlama = ["0%", "100%"];
export const hata = "Dosya 20 MB'tan büyük. Daha küçük bir dosya seç.";
window.addEventListener("scroll", () => requestAnimationFrame(() => {}), { passive: true });
EOF
# Test dosyasi taranmaz: kirli icerik tasisa bile
cat > "$SANDBOX/temiz/Kart.test.tsx" <<'EOF'
it("alert", () => { expect(render(<a href="#">x</a>)).toBeTruthy(); alert("x"); });
EOF

OUT=$(bash "$SCAN" "$SANDBOX/temiz" 2>&1)
CODE=$?
if [ $CODE -eq 0 ] && printf '%s' "$OUT" | grep -q 'SONUC: 0 yuksek, 0 uyari'; then
  ok "temiz dizin → 0 yuksek, 0 uyari, exit 0 (slop-ok ve test dosyasi haric)"
else
  no "temiz dizinde bulgu olmamali" "exit 0, 0 yuksek, 0 uyari" "exit $CODE: $(printf '%s' "$OUT" | grep -E '❌|⚠️|SONUC' -A2 | head -20)"
fi

# ─── Yol yoksa exit 2 ────────────────────────────────────────────────────────
bash "$SCAN" "$SANDBOX/yok" >/dev/null 2>&1
CODE=$?
if [ $CODE -eq 2 ]; then ok "olmayan yol → exit 2"; else no "olmayan yol exit kodu" "2" "$CODE"; fi

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAIL -gt 0 ]; then
  echo "  SONUC: $PASS geçti, $FAIL BAŞARISIZ"
  exit 1
fi
echo "  SONUC: $PASS slop-scan testi geçti"
