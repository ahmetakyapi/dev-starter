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

# Builtin eklentiler: pazar yeri gerekmez, yalnızca etkinleştirilir.
BUILTIN_PLUGINS=("cc-plugin-you-should-know@builtin")

run() {
  if (( DRY )); then echo "  [dry] $*"; else "$@"; fi
}

# Hedefi kaynağa symlink'ler. Hedef zaten o kaynağa bağlıysa dokunmaz;
# başka bir şeyse yedekler.
link() {
  local src="$1" dst="$2"
  if [[ -L "$dst" && "$(readlink "$dst")" == "$src" ]]; then
    echo "  = $dst"
    return
  fi
  if [[ -e "$dst" || -L "$dst" ]]; then
    run mkdir -p "$BACKUP"
    run mv "$dst" "$BACKUP/"
    echo "  ~ yedeklendi: $dst → $BACKUP/"
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

echo "▸ Alt ajanlar (tek kaynak: .claude/agents)"
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
run npx -y skills add Leonxlnx/taste-skill -g -a claude-code -s "${TASTE_SKILLS[@]}" -y

echo "▸ Eklentiler"
for p in "${BUILTIN_PLUGINS[@]}"; do
  run claude plugin enable "$p"
done

echo
echo "Tamam. Kalan elle adımlar:"
echo "  1. claude → /login (claude.ai eklentileri ve skill'leri girişle gelir)"
echo "  2. gh auth login  ·  vercel login"
echo "  3. bash $REPO/scripts/health-check.sh"
