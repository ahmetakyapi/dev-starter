#!/usr/bin/env bash
# Session Brief — oturum başında ROUTEMAP özetini bağlama basar
# SessionStart hook olarak çalışır; stdout oturum bağlamına eklenir.
#
# NEDEN VAR: rules/routemap-discipline.md her oturumun ROUTEMAP okuyarak
# başlamasını ister. Bu kural yıllarca öğüt olarak kaldı — oturumların bir
# kısmı ROUTEMAP'i hiç açmadan işe daldı. Bu hook ritüeli fiziksel yapar:
# proje durumu, aktif story ve sıradaki iş önerisi oturum açılırken bağlamda.
#
# ROUTEMAP'i olmayan dizinlerde (ör. dev-starter'ın kendisi) sessizce çıkar.

set -euo pipefail

ROUTEMAP=""
for f in docs/ROUTEMAP.md ROUTEMAP.md; do
  if [ -f "$f" ]; then
    ROUTEMAP="$f"
    break
  fi
done
[ -z "$ROUTEMAP" ] && exit 0

echo "📍 Session Brief — $ROUTEMAP (tek gerçek kaynak, önce tamamını oku):"

# Proje adı ve genel durum
grep -E '^\*\*(Proje|Durum)\*\*' "$ROUTEMAP" | head -2 | sed 's/^/   /' || true

# Aktif işler: IN_PROGRESS / IN_REVIEW / BLOCKED satırları
ACTIVE=$(grep -E '^\|.*\|[[:space:]]*(IN_PROGRESS|IN_REVIEW|BLOCKED)[[:space:]]*\|' "$ROUTEMAP" || true)
if [ -n "$ACTIVE" ]; then
  echo "   Aktif işler:"
  echo "$ACTIVE" | head -5 | sed 's/^/     /'
  BLOCKED=$(echo "$ACTIVE" | grep -c 'BLOCKED' || true)
  [ "${BLOCKED:-0}" -gt 0 ] && echo "   ⚠️  $BLOCKED iş BLOCKED — önce blokajı çöz ya da kullanıcıya sor."
else
  echo "   Aktif iş yok. Sıradaki story'yi öncelik sırasına göre öner (NOT_STARTED satırları)."
fi

echo "   Kaldığın yeri ve sıradaki en değerli işi kullanıcıya TEK cümleyle öner; onay almadan büyük işe başlama."
exit 0
