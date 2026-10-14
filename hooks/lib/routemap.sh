#!/usr/bin/env bash
# Ortak yardımcı — ROUTEMAP markdown tablolarını ayrıştırır.
#
# NEDEN VAR: gate-guard.sh Gate durumunu KONUMDAN okuyordu ($(NF-1), yani son
# dolu kolon). Resmi şablonun story tablosu 7 kolon:
#   | ID | Başlık | Faz | Öncelik | Durum | Gate | Assign |
# ve son dolu kolon Assign'dır — hook Gate yerine Assign'ı okuyordu. Davranış
# testi bunu göremedi çünkü test fixture'ı 4 kolonlu FARKLI bir düzendeydi.
# Kolonlar artık BAŞLIK satırından ada göre bulunur; story tablosu "Durum" ve
# "Gate" kolonlarını birlikte taşıyan tablo olarak tanınır (Faz Durumu
# tablosundaki IN_PROGRESS satırları karışmaz). Bkz. knowledge/mistakes.md #99
#
# Kullanım:
#   source "$(dirname "${BASH_SOURCE[0]}")/lib/routemap.sh"
#   ROUTEMAP=$(routemap_find) || exit 0
#   routemap_active_stories "$ROUTEMAP"   # ID<TAB>DURUM<TAB>GATE satırları
#   routemap_done_without_gate "$ROUTEMAP"

# ROUTEMAP dosyasını bul: stdout'a yolu basar; yoksa 1 döner.
routemap_find() {
  local f
  for f in docs/ROUTEMAP.md ROUTEMAP.md; do
    if [ -f "$f" ]; then
      printf '%s' "$f"
      return 0
    fi
  done
  return 1
}

# Story tablosunu (başlığında hem Durum hem Gate olan tabloyu) satır satır
# gezer, her veri satırı için "ID<TAB>DURUM<TAB>GATE" basar.
routemap_story_rows() {
  awk -F'|' '
    function trim(s) { gsub(/^[ \t]+|[ \t]+$/, "", s); return s }
    /^\|/ {
      # Başlık satırı: Durum ve Gate kolonlarını birlikte taşıyan tablo
      if (!intable) {
        dc = 0; gc = 0; idc = 0
        for (i = 1; i <= NF; i++) {
          h = trim($i)
          if (h == "Durum") dc = i
          if (h == "Gate")  gc = i
          if (h == "ID")    idc = i
        }
        if (dc && gc) { intable = 1; if (!idc) idc = 2 }
        next
      }
      # Ayraç satırı: |----|----|
      if ($0 ~ /^\|[ \t:|-]+$/) next
      durum = trim($dc); gate = trim($gc); id = trim($idc)
      if (durum != "") print id "\t" durum "\t" gate
      next
    }
    # Tablo olmayan satır tabloyu kapatır
    { if (intable) intable = 0 }
  ' "$1"
}

# Aktif story'ler (IN_PROGRESS | IN_REVIEW): "ID<TAB>DURUM<TAB>GATE"
routemap_active_stories() {
  routemap_story_rows "$1" | awk -F'\t' '$2 == "IN_PROGRESS" || $2 == "IN_REVIEW"'
}

# Tutarsızlık: DONE ama Gate PASSED/PASSED_WITH_WARNINGS değil.
# rules/routemap-discipline.md: "Gate PASSED olmadan story DONE yapılamaz."
routemap_done_without_gate() {
  routemap_story_rows "$1" | awk -F'\t' '
    $2 == "DONE" && $3 != "PASSED" && $3 != "PASSED_WITH_WARNINGS"
  '
}
