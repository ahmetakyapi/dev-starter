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

# Verilen metin bir git commit çağrısı mı?
# - Çok satırlı komut normalize edilir: satır sonu ters bölüler silinir,
#   yeni satırlar boşluğa çevrilir ("git \<newline>commit" kaçışı kapanır).
# - "commit" tam sözcük okunur: "git show --stat commit-abc" ya da
#   "git commit-graph" commit sayılmaz (yanlış blok üretiyordu).
# Desen tabanlı algılama tamamen kapatılamaz (alias, $g commit gibi yollar
# kalır); bu bilinen ve kabul edilmiş bir sınırdır.
hook_text_is_git_commit() {
  printf '%s' "$1" | sed 's/\\$//' | tr '\n' ' ' \
    | grep -qE 'git[[:space:]]+([^|;&]*[[:space:]])?commit([^a-zA-Z-]|$)'
}

# Bu payload bir git commit çağrısı mı? (stdin'i BİR kez okur; komut metni
# ayrıca gerekiyorsa önce CMD_TEXT=$(hook_command) yakala ve
# hook_text_is_git_commit kullan — ikinci okuma boş döner.)
hook_is_git_commit() {
  hook_text_is_git_commit "$(hook_command)"
}
