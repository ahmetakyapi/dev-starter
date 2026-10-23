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

echo "▸ anatomy (açıklayıcı figür skill'i, wheresryan22/anatomy, MIT) @ ${ANATOMY_REF:0:7}"
# İzometrik SVG figür, WebGL ve 3D kiti; motion-film'in `reference/aciklayici-figur.md`si
# ne zaman bunu kullanacağını söylüyor. Ağ hatası kurulumu DURDURMAZ: figür
# skill'i isteğe bağlı, eklentiler ve sonraki adımlar yine kurulur.
ANATOMY_DIR="$CLAUDE_DIR/skills/anatomy"
anatomy_checkout() {
  git -C "$ANATOMY_DIR" fetch --quiet origin "$ANATOMY_REF" 2>/dev/null \
    || git -C "$ANATOMY_DIR" fetch --quiet origin
  git -C "$ANATOMY_DIR" -c advice.detachedHead=false checkout --quiet "$ANATOMY_REF"
}
if [[ -d "$ANATOMY_DIR/.git" ]]; then
  if [[ -n "$(git -C "$ANATOMY_DIR" status --porcelain 2>/dev/null)" ]]; then
    echo "  ~/.claude/skills/anatomy içinde yerel değişiklik var; dokunulmadı"
  elif [[ "$(git -C "$ANATOMY_DIR" rev-parse HEAD 2>/dev/null)" == "$ANATOMY_REF" ]]; then
    echo "  = anatomy zaten ${ANATOMY_REF:0:7}"
  else
    run anatomy_checkout || echo "  ⚠️  anatomy güncellenemedi (ağ?); eski sürüm yerinde kaldı"
  fi
elif [[ ! -e "$ANATOMY_DIR" ]]; then
  if run git clone --quiet https://github.com/wheresryan22/anatomy "$ANATOMY_DIR"; then
    # Pin'e oturtulamayan taze klon SKILL OLARAK BIRAKILMAZ: HEAD içeriği
    # denetlenmemiştir ve her oturumda talimat olarak okunur. Pin'in tüm
    # amacı buydu; checkout düşerse klon silinir, kurulum yapılmamış sayılır.
    run anatomy_checkout || {
      echo "  ⚠️  ${ANATOMY_REF:0:7} bulunamadı; anatomy KURULMADI (pin'siz içerik bağlanmaz)"
      run rm -rf "$ANATOMY_DIR"
    }
  else
    echo "  ⚠️  anatomy klonlanamadı (ağ?); sonra tekrar çalıştır"
  fi
else
  echo "  ~/.claude/skills/anatomy git deposu değil; dokunulmadı"
fi

echo "▸ Eklentiler"
for p in "${BUILTIN_PLUGINS[@]}"; do
  run claude plugin enable "$p"
done

echo
echo "Tamam. Kalan elle adımlar:"
echo "  1. claude → /login (claude.ai eklentileri ve skill'leri girişle gelir)"
echo "  2. gh auth login  ·  vercel login"
echo "  3. bash $REPO/scripts/health-check.sh"
