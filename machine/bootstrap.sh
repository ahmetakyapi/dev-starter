#!/usr/bin/env bash
# Yeni bir makinede Claude Code ortamını kurar. Tekrar çalıştırmak güvenli:
# zaten doğru bağlı olanı atlar, üzerine yazacağı her şeyi önce yedekler.
#
#   bash ~/dev-starter/machine/bootstrap.sh            # uygula
#   bash ~/dev-starter/machine/bootstrap.sh --dry-run  # yalnızca ne yapacağını yaz
#
# Kapsam dışı (bilinçli):
# - ~/.claude/settings.json izin listesi: makineye özgü yollar taşıyor ve depo
#   herkese açık. Yeni makinede izinler ilk oturumlarda yeniden birikir.
# - claude.ai'den eşitlenen eklenti/skill'ler (finance, data, design-dna,
#   scroll-craft ...): aynı hesapla giriş yapınca kendiliğinden gelirler.
set -euo pipefail

DRY=0
[[ "${1:-}" == "--dry-run" ]] && DRY=1

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/.." && pwd)"
CLAUDE_DIR="$HOME/.claude"
BACKUP="$CLAUDE_DIR/backups/bootstrap-$(date +%Y%m%d-%H%M%S)"

# taste-skill paketinden gerçekten kullanılanlar. Paketin geri kalanı (gpt-taste
# GSAP dayatıyor, v1 eski sürüm, stitch/image-to-code/brutalist hiç çağrılmadı)
# 3 Ekim 2026 denetiminde kaldırıldı; tam paket yerine bu liste kurulur.
TASTE_SKILLS=(design-taste-frontend redesign-existing-projects high-end-visual-design minimalist-ui brandkit imagegen-frontend-web imagegen-frontend-mobile)

# anatomy (açıklayıcı figür skill'i) SABİT bir commit'e kurulur: depo neredeyse
# her gün değişiyor ve figür kiti şablonlara kopyalanıyor. Bu commit
# `npm run verify:anatomy` ile iki şablonda derlenip lint/test'ten geçti.
# Yükseltme: yeni SHA'yı yaz, önce verify:anatomy, sonra commit. Tek kaynak
# burası; verify script'i SHA'yı bu satırdan okur.
ANATOMY_REF="689dcf966e63d92be10a5d593c6e19e10acd4422"

# cinecode (sarpstar/cinecode, MIT) — kodla film: senaryo, kare, ses, MP4.
# Depo sık değişiyor ve skill her araç çağrısında koşan bir koruma kancası
# (PreToolUse/Stop, scripts/guard.py) taşıyor; bu yüzden anatomy gibi SABİT
# commit. Bu commit 7 Kasım 2026'da okundu: kanca yalnız skill yüklüyken
# koşar, ağa çıkan araçlar (asset_search, tts) anahtar ve onay ister.
# Yükseltme: yeni SHA, aradaki commit'lere ve hook.cjs/guard.py farkına bak,
# sonra commit. health-check bu satırı denetler.
CINECODE_REF="67f9807112b97ae253d4a5f0eccaccc46c3b2633"

# Builtin eklentiler: pazar yeri gerekmez, yalnızca etkinleştirilir.
BUILTIN_PLUGINS=("cc-plugin-you-should-know@builtin")

run() {
  if (( DRY )); then echo "  [dry] $*"; else "$@"; fi
}

# Hedefi kaynağa symlink'ler. Hedef zaten o kaynağa bağlıysa dokunmaz;
# başka bir şeyse yedekler. Yedek $HOME'a göre göreli yolu KORUR: commands/
# ve agents/ aynı adları taşıyor (gate.md, deploy.md); düz bir yedek dizininde
# ikincisi birincinin yedeğini sessizce eziyordu.
link() {
  local src="$1" dst="$2"
  if [[ -L "$dst" && "$(readlink "$dst")" == "$src" ]]; then
    echo "  = $dst"
    return
  fi
  if [[ -e "$dst" || -L "$dst" ]]; then
    local rel="${dst#"$HOME"/}"
    run mkdir -p "$BACKUP/$(dirname "$rel")"
    run mv "$dst" "$BACKUP/$rel"
    echo "  ~ yedeklendi: $dst → $BACKUP/$rel"
  fi
  run mkdir -p "$(dirname "$dst")"
  run ln -s "$src" "$dst"
  echo "  + $dst → $src"
}

echo "▸ Ön koşullar"
for bin in node npm git claude; do
  if command -v "$bin" >/dev/null 2>&1; then
    echo "  ✓ $bin"
  else
    echo "  ✗ $bin bulunamadı"
    [[ "$bin" == "claude" ]] && echo "    curl -fsSL https://claude.ai/install.sh | bash"
    exit 1
  fi
done
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if (( NODE_MAJOR < 20 )); then
  echo "  ✗ Node $NODE_MAJOR — Next 16 en az 20.9 istiyor (.nvmrc: $(cat "$REPO/.nvmrc"))"
  exit 1
fi

echo "▸ ~/dev-starter bağlantısı"
[[ "$REPO" != "$HOME/dev-starter" ]] && link "$REPO" "$HOME/dev-starter"

echo "▸ Global CLAUDE.md"
link "$HERE/CLAUDE.md" "$CLAUDE_DIR/CLAUDE.md"

echo "▸ Komutlar (tek kaynak: .claude/commands)"
for f in "$REPO"/.claude/commands/*.md; do
  link "$f" "$CLAUDE_DIR/commands/$(basename "$f")"
done

echo "▸ Subagent'lar (tek kaynak: .claude/agents)"
for f in "$REPO"/.claude/agents/*.md; do
  link "$f" "$CLAUDE_DIR/agents/$(basename "$f")"
done

echo "▸ Depoda taşınan skill'ler"
for d in "$HERE"/skills/*/; do
  d="${d%/}"
  link "$d" "$CLAUDE_DIR/skills/$(basename "$d")"
done

echo "▸ taste-skill"
# `-s` virgüllü listeyi tek ad sanıyor ("No matching skills"); adlar ayrı argüman.
# CLI sürümü SABİT: `npx -y skills` her koşuda en günceli indirip ÇALIŞTIRIR —
# kurulan skill'ler her oturumda talimat olarak okunduğundan bu bir tedarik
# zinciri kontrolüdür. Yükseltme: sürümü bilerek değiştir, kurulumu gözden geçir.
# (Kaynak depo Leonxlnx/taste-skill hâlâ HEAD'den gelir; skills CLI'ı ref
# pin'i desteklemiyor. Kalıcı çözüm anatomy gibi vendor'lamak — tech-radar.)
SKILLS_CLI_VERSION="1.7.2"
run npx -y "skills@${SKILLS_CLI_VERSION}" add Leonxlnx/taste-skill -g -a claude-code -s "${TASTE_SKILLS[@]}" -y

# Dış depodan sabit commit'e kurulan skill. Pin'in amacı tedarik zinciri:
# skill her oturumda talimat olarak okunur, HEAD içeriği denetlenmemiştir.
#   pinned_skill <ad> <depo-url> <40 haneli sha>
# Yerel değişiklik varsa dokunmaz; ağ hatası kurulumu DURDURMAZ (skill'ler
# isteğe bağlı, sonraki adımlar yine kurulur); pin'e oturtulamayan taze klon
# silinir, kurulum yapılmamış sayılır.
pinned_skill() {
  local name="$1" url="$2" ref="$3"
  local dir="$CLAUDE_DIR/skills/$name"
  _pin_checkout() {
    git -C "$dir" fetch --quiet origin "$ref" 2>/dev/null \
      || git -C "$dir" fetch --quiet origin
    git -C "$dir" -c advice.detachedHead=false checkout --quiet "$ref"
  }
  if [[ -d "$dir/.git" ]]; then
    if [[ -n "$(git -C "$dir" status --porcelain 2>/dev/null)" ]]; then
      echo "  ~/.claude/skills/$name içinde yerel değişiklik var; dokunulmadı"
    elif [[ "$(git -C "$dir" rev-parse HEAD 2>/dev/null)" == "$ref" ]]; then
      echo "  = $name zaten ${ref:0:7}"
    else
      run _pin_checkout || echo "  ⚠️  $name güncellenemedi (ağ?); eski sürüm yerinde kaldı"
    fi
  elif [[ ! -e "$dir" ]]; then
    if run git clone --quiet "$url" "$dir"; then
      run _pin_checkout || {
        echo "  ⚠️  ${ref:0:7} bulunamadı; $name KURULMADI (pin'siz içerik bağlanmaz)"
        run rm -rf "$dir"
      }
    else
      echo "  ⚠️  $name klonlanamadı (ağ?); sonra tekrar çalıştır"
    fi
  else
    echo "  ~/.claude/skills/$name git deposu değil; dokunulmadı"
  fi
}

echo "▸ anatomy (açıklayıcı figür skill'i, wheresryan22/anatomy, MIT) @ ${ANATOMY_REF:0:7}"
# İzometrik SVG figür, WebGL ve 3D kiti; motion-film'in `reference/aciklayici-figur.md`si
# ne zaman bunu kullanacağını söylüyor.
pinned_skill anatomy https://github.com/wheresryan22/anatomy "$ANATOMY_REF"

echo "▸ cinecode (kodla film stüdyosu, sarpstar/cinecode, MIT) @ ${CINECODE_REF:0:7}"
# MP4 olarak çıkan her film (kısa film, tanıtım, reklam, müzik videosu) bunun
# Hızlı/Film modlarıyla yapılır; motion-film § 1b iş bölümünü söylüyor.
# Kitin kendi "cinecode'u güncelle" (git pull) komutu sabit commit'te çalışmaz,
# bilerek: yükseltme CINECODE_REF'i değiştirip bootstrap'i yeniden koşmaktır.
pinned_skill cinecode https://github.com/sarpstar/cinecode "$CINECODE_REF"

echo "▸ Eklentiler"
for p in "${BUILTIN_PLUGINS[@]}"; do
  run claude plugin enable "$p"
done

echo
echo "Tamam. Kalan elle adımlar:"
echo "  1. claude → /login (claude.ai eklentileri ve skill'leri girişle gelir)"
echo "  2. gh auth login  ·  vercel login"
echo "  3. bash $REPO/scripts/health-check.sh"
