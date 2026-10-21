#!/usr/bin/env bash
# Ortak yardımcı — Claude Code hook girdisini okur.
#
# Claude Code hook'a girdiyi STDIN'den JSON olarak verir:
#   {"tool_name":"Bash","tool_input":{"command":"git commit -m ..."}}
#
# TOOL_INPUT diye bir environment variable YOKTUR. gate-guard.sh ve
# quality-scan.sh 5 ay boyunca o değişkeni okudu, hep boş buldu ve sessizce
# exit 0 verdi — yani hiçbir commit hiç denetlenmedi. health-check ise
# dosyaların var olduğunu görüp ✅ dedi. Bkz. knowledge/mistakes.md #52
#
# Kullanım:
#   source "$(dirname "${BASH_SOURCE[0]}")/lib/hook-input.sh"
#   CMD=$(hook_command)      # tool_input.command, yoksa boş

# stdin'deki JSON payload'ı bir kez oku ve sakla.
hook_payload() {
  if [ -z "${_HOOK_PAYLOAD+x}" ]; then
    _HOOK_PAYLOAD=$(cat 2>/dev/null || true)
  fi
  printf '%s' "$_HOOK_PAYLOAD"
}

# payload'dan tool_input.command'ı çıkar.
# jq varsa onu, yoksa python3'ü kullanır; ikisi de yoksa boş döner
# (sessiz no-op'a düşmemek için stderr'e uyarı basar).
hook_command() {
  local payload
  payload=$(hook_payload)
  [ -n "$payload" ] || return 0

  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$payload" | jq -r '.tool_input.command // empty' 2>/dev/null || true
  elif command -v python3 >/dev/null 2>&1; then
    printf '%s' "$payload" | python3 -c 'import json,sys
try:
    sys.stdout.write(json.load(sys.stdin).get("tool_input", {}).get("command", "") or "")
except Exception:
    pass' 2>/dev/null || true
  else
    echo "⚠️  hook: jq veya python3 yok — komut ayrıştırılamadı, kontrol atlandı" >&2
  fi
}

# Komut metnini commit algılama için normalize eder:
# 1) HEREDOC GÖVDELERİ ATILIR — `cat > doc.md <<'EOF'` gövdesinde ya da
#    gh pr --body içinde satır başında geçen "git commit" masum metindir;
#    atılmazsa her satır başı komut çapasına dönüşüp yanlış blok üretiyordu.
# 2) Satır devamı (sonu ters bölü) bir sonraki satırla BİRLEŞİR
#    ("git \<newline>commit" kaçışı kapanır).
# 3) Düz yeni satır kabuğun gördüğü gibi komut AYRACI (;) olur —
#    "git add .<newline>git commit" yakalanmaya devam eder.
# 4) TIRNAKLI BÖLGELER SİLİNİR — `grep "git commit"` gibi metin anmaları
#    kaybolur, `VAR="Ahmet Akyapı" git commit` gibi tırnaklı/boşluklu env
#    atamaları da sadeleşip önek olarak tanınır. İki tırnak türü TEK geçişte
#    silinir, en soldaki açılış tırnağı kazanır: ayrı geçişte çift tırnak
#    içindeki apostrof ("Ahmet'in") sonraki tek tırnakla (<<'EOF') eşleşip
#    aradaki `git commit`i de siliyordu — iki hook da commit'i hiç görmüyordu.
#    İsteğe bağlı 2. argüman tırnaklı bölgenin yerine yazılır: pathspec
#    tespiti tırnaklı yolu (`'app/(panel)/page.tsx'`) kaybetmesin diye.
# <<- heredoc'unun sonlandırıcısı sekmeyle girintili olabilir; tam satır
# eşitliği onu hiç kapatmıyor, ardından gelen her satırı (commit dahil) atıyordu.
hook_normalize_command() {
  printf '%s' "$1" \
    | awk -v SQ="'" '
        BEGIN { tagre = "<<-?[ \t]*[\"" SQ "]?[A-Za-z_][A-Za-z_0-9]*" }
        intag != "" { l = $0; if (dash) sub(/^\t+/, "", l); if (l == intag) intag = ""; next }
        {
          if (match($0, tagre)) {
            t = substr($0, RSTART, RLENGTH)
            dash = (t ~ /^<<-/)
            sub(/<<-?[ \t]*/, "", t); gsub("[\"" SQ "]", "", t)
            intag = t
          }
          if (sub(/\\$/, "")) printf "%s ", $0; else print
        }
      ' \
    | tr '\n' ';' \
    | sed -E "s/'[^']*'|\"[^\"]*\"/${2:-}/g"
}

# Komut başı: ayraç (satır başı, ; & | ( `) + sıfır ya da daha çok önek —
# env ataması (VAR=değer), command/env/exec/time/nice, if/elif/while/until/
# then/do/else, `!` ve `{` — ve isteğe bağlı yol (/usr/bin/git). Önek listesi
# dar tutulursa `if ! git diff --cached --quiet; then git commit ...; fi`
# gibi sıradan kabuk biçimleri iki hook'tan da kaçıyordu.
_HOOK_GIT_AT_CMD='(^|[;&|(`]|&&|\|\|)[[:space:]]*(((command|env|exec|time|nice|if|elif|while|until|then|do|else|!|[{])[[:space:]]+)|[A-Za-z_][A-Za-z_0-9]*=[^[:space:]]*[[:space:]]+)*([^[:space:];&|]*/)?git[[:space:]]+'

# Verilen metin bir git commit çağrısı mı?
# - "git" komut BAŞINDA aranır (_HOOK_GIT_AT_CMD).
# - "commit" tam sözcük okunur: "git show --stat commit-abc" ya da
#   "git commit-graph" commit sayılmaz (yanlış blok üretiyordu).
# Desen tabanlı algılama tamamen kapatılamaz (alias, $g commit, script'e
# yazıp çalıştırma kalır); bu bilinen ve kabul edilmiş bir sınırdır.
# grep'e here-string verilir, boru değil: `grep -q` erken çıkınca yazan
# taraf SIGPIPE alır ve pipefail altında sonuç tersine dönebilir.
hook_text_is_git_commit() {
  grep -qE "${_HOOK_GIT_AT_CMD}([^|;&]*[[:space:]])?commit([^a-zA-Z-]|\$)" <<<"$(hook_normalize_command "$1")"
}

# Commit, hook anındaki index'in DIŞINA taşacak mı? Üç işaret:
# (1) -a/-i türevi ya da --all/--include/--only/--pathspec-from-file bayrağı
#     (dosyaları commit anında stage'ler), (2) aynı komut zincirinde
#     `git add` (hook add'den önce koşar, index'i commit'ten önce
#     dolduramaz), (3) commit'e pozisyonel pathspec verilmesi
#     (`git commit dosya.ts -m ...`). Pathspec tespiti yaklaşıktır ve
#     şüphede GENİŞ tarar — yanlış pozitifin maliyeti fazladan tarama,
#     yanlış negatifin maliyeti kaçan sırdır. Tırnaklı bölge burada silinmez,
#     Q olur: Next yolları (`'app/(panel)/page.tsx'`, `"app/[id]/..."`)
#     tırnaksız yazılamaz ve silinince pathspec görünmez oluyordu. Değer alan
#     seçeneklerin değeri (-m Q, -F msg.txt, --author Q) pathspec sayılmaz.
hook_commit_touches_worktree() {
  local norm rest
  norm=$(hook_normalize_command "$1" Q)
  grep -qE '(^|[[:space:]])(-[a-zA-Z]*[ai][a-zA-Z]*|--all|--include|--only|--pathspec-from-file)([[:space:]=]|$)' <<<"$norm" && return 0
  grep -qE "${_HOOK_GIT_AT_CMD}add([^a-zA-Z-]|\$)" <<<"$norm" && return 0
  rest=$(grep -oE 'git[[:space:]]+([^|;&]*[[:space:]])?commit[^;|&]*' <<<"$norm" \
    | sed -E 's/^.*commit([^a-zA-Z-]|$)/ /; s/(^|[[:space:]])(-[a-zA-Z]*[mFCct]|--(message|file|author|date|template|trailer|reuse-message|reedit-message|fixup|squash|cleanup))[[:space:]]+[^[:space:]]+/ /g' \
    | tr ' ' '\n' | grep -vE '^$|^-' || true)
  [ -n "$rest" ]
}

# Bu payload bir git commit çağrısı mı? (stdin'i BİR kez okur; komut metni
# ayrıca gerekiyorsa önce CMD_TEXT=$(hook_command) yakala ve
# hook_text_is_git_commit kullan — ikinci okuma boş döner.)
hook_is_git_commit() {
  hook_text_is_git_commit "$(hook_command)"
}
