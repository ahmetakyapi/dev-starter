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
#   cd "$(routemap_project_root)" 2>/dev/null || exit 0
#   ROUTEMAP=$(routemap_find) || exit 0
#   routemap_active_stories "$ROUTEMAP"   # ID<TAB>DURUM<TAB>GATE satırları
#   routemap_done_without_gate "$ROUTEMAP"

# ROUTEMAP dosyasını bul: stdout'a yolu basar; yoksa 1 döner.
# -r da aranır: okunamayan dosya awk'ı fatal düşürür ve set -e altında hook
# exit 2 ile ölür — PreToolUse'ta bu, her commit'in sebepsiz BLOKlanmasıdır.
routemap_find() {
  local f
  for f in docs/ROUTEMAP.md ROUTEMAP.md; do
    if [ -f "$f" ] && [ -r "$f" ]; then
      printf '%s' "$f"
      return 0
    fi
  done
  return 1
}

# Hook'un sabitleneceği proje kökünü basar (routemap_find bu dizinde aranır).
# Hook Claude'un O ANKİ dizininde koşar ve bu dizin her `cd`yi ve worktree'ye
# girişi izler; CLAUDE_PROJECT_DIR ise oturumun başladığı kökte SABİT kalır.
# Bu yüzden o anki dizinden git köküne doğru yukarı çıkılır ve ROUTEMAP'i
# taşıyan EN YAKIN dizin seçilir: worktree'de ROUTEMAP ve index worktree'nindir
# (CLAUDE_PROJECT_DIR ana checkout'un ROUTEMAP'ini okuyup Gate'siz story'yi
# geçirirdi); monorepoda oturum kökte başlasa da `cd apps/web` sonrası o alt
# projenin ROUTEMAP'i okunur. Hiçbirinde yoksa git kökü. Git dışında
# CLAUDE_PROJECT_DIR, o da yoksa o anki dizin.
routemap_project_root() {
  local here top dir
  here=$(pwd -P)
  top=$(git rev-parse --show-toplevel 2>/dev/null) || {
    printf '%s' "${CLAUDE_PROJECT_DIR:-$here}"
    return 0
  }
  # macOS'ta /var → /private/var: karşılaştırma iki tarafta da gerçek yolla.
  top=$(cd "$top" 2>/dev/null && pwd -P) || top=$here
  dir=$here
  while :; do
    if (cd "$dir" && routemap_find >/dev/null); then
      printf '%s' "$dir"
      return 0
    fi
    case "$dir" in "$top"|/) break ;; esac
    dir=$(dirname "$dir")
  done
  printf '%s' "$top"
}

# Story tablosunu (başlığında hem Durum hem Gate olan tabloyu) satır satır
# gezer, her veri satırı için "ID<TAB>DURUM<TAB>GATE" basar.
routemap_story_rows() {
  awk -F'|' '
    function trim(s) { gsub(/^[ \t\r]+|[ \t\r]+$/, "", s); return s }
    # CRLF kaydedilmiş dosyada son hücre "Gate\r" olur ve tablo hiç
    # tanınmazdı — satır başında \r temizlenir, trim de \r kırpar.
    { sub(/\r$/, "") }
    /^\|/ {
      # Başlık satırı: ID + Durum + Gate kolonlarını BİRLİKTE taşıyan tablo.
      # ID şartı bilinçli: Gate kolonu eklenmiş bir Faz tablosu (ID yok)
      # story tablosu sanılıp tüm commit`leri bloklayabiliyordu.
      if (!intable) {
        dc = 0; gc = 0; idc = 0
        for (i = 1; i <= NF; i++) {
          h = trim($i)
          if (h == "Durum") dc = i
          if (h == "Gate")  gc = i
          if (h == "ID")    idc = i
        }
        if (dc && gc && idc) intable = 1
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
