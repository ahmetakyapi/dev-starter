---
description: Ekosistemin kendi gelişim turu — health-check + canlı proje denetimi + bilgi tazeliği + web taraması ("benzer araçlar ne ekledi"). Öncelikli iyileştirme listesi üretir; onaylananları uygular. dev-starter'ın kendisini geliştirir.
argument-hint: "[odak — boşsa tam tur: altyapı | bilgi | rakip]"
---

# /evolve — Ekosistem Kendini Geliştirir

Odak: **$ARGUMENTS** (boşsa üç eksen de). Bu komut `~/dev-starter` deposunda
çalışır; proje deposundaysa önce oraya geçmeyi öner.

1. **Altyapı sağlığı** (komutlarla):
   - `bash ~/dev-starter/scripts/health-check.sh` — hata ve uyarıları listele
   - `bash ~/dev-starter/scripts/test-hooks.sh` — davranış testleri
   - `cd ~/dev-starter && npm test` — paket sözleşmesi
2. **Bilgi tazeliği**:
   - `knowledge/mistakes.md`: indeks ↔ kayıt uyumu; son kayıtların ilgili
     `guides/` adımı var mı (`CLAUDE.md → Bu Dosyaları Güncelleme`)
   - `knowledge/tech-radar.md` ve `live-projects-audit.md`: son gözden geçirme
     60+ gün eskiyse yeniden denetim öner (`scripts/audit-project.sh`)
   - `patterns.md` ↔ `mistakes.md` çelişkisi: yeni kayıtların düzelttiği şeyi
     hâlâ öğreten desen var mı
3. **Dış tarama** (`researcher` alt ajanı): Claude Code ekosistemi ve benzer
   starter/orkestrasyon projelerinde (spec-kit, BMAD, agent-os, claude-flow
   vb.) son dönemde öne çıkan desenler; her bulgu kaynaklı ve "dev-starter'a
   uyarlanırsa ne kazandırır" cümlesiyle. Çıktı:
   `~/dev-starter/docs/research/evolve-<tarih>.md` (dizin yoksa oluştur).
4. **Öncelikli liste**: bulguları etki × çaba ile sırala, en çok 7 madde.
   Kullanıcıya sun; her maddenin "yapılırsa hangi dosyalar değişir" satırı olsun.
5. **Onaylananları uygula** — ekosistem prosedürleriyle: yeni hook → script +
   settings.json + test-hooks testi; yeni komut → `.claude/commands/` +
   CLAUDE.md tablosu; kural → `rules/` + AGENT_PROTOCOL referansı. Sonunda
   health-check yeniden koş, CHANGELOG'a işle.

Kural: `rules/self-improvement.md` — onaysız hiçbir kural/bilgi dosyası
değişmez; her uygulanan madde CHANGELOG'da bir satırdır.
