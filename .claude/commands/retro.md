---
description: Retrospektif — oturum/iş bitiminde sinyalleri toplar (düzeltmeler, sürtünme, yeni desenler), kanıtıyla sunar ve ONAYLA bilgi tabanına işler (mistakes/patterns/decisions + guides adımı). Sürekli öğrenme döngüsünün komutu.
argument-hint: "[kapsam — boşsa bu oturum; 'story STORY-NNN' ya da 'faz' olabilir]"
---

# /retro — Dersleri Bilgi Tabanına İşle

Kapsam: **$ARGUMENTS** (boşsa bu oturum).

Kuralların kaynağı: `~/dev-starter/rules/self-improvement.md` — agent taslak
önerir, **onaysız yazamaz**; koşu başına en fazla 1-2 damıtılmış ders.

1. **Sinyal topla** (kanıtla):
   - Bu oturumda kullanıcının düzelttiği/geri çevirdiği işler
   - İki kez denenen şeyler (Gate FIX döngüleri, GATE-LOG kayıtları)
   - `git log` + diff: fix commit'leri, geri alınan değişiklikler
   - Kendini kanıtlamış yeni desen/karar (üçüncü kez elle yazılan şey snippet'liktir)
2. **Sınıfla** — her bulgu için hedef dosyayı belirle:
   | Bulgu | Hedef |
   |-------|-------|
   | Bir kez yaşanmış, tekrarlanabilir hata | `~/dev-starter/knowledge/mistakes.md` (sıradaki numara + kategori + indeks satırı) |
   | Hatayı önleyecek adım | ilgili `~/dev-starter/guides/` dosyasına ✅/❌ örnekli adım |
   | Kendini kanıtlamış desen | `~/dev-starter/knowledge/patterns.md` |
   | Değişen karar | `~/dev-starter/knowledge/decisions.md` ("Değişti (tarih)" başlığıyla, eskisi silinmez) |
   | Proje bitti | `~/dev-starter/knowledge/themes/<proje>.md` (DESIGN.template ile) |
3. **Taslakları sun**: her biri için dosya + eklenecek metin + kanıt satırı.
   Kullanıcı seçer; seçilenleri yaz, seçilmeyeni bırak.
4. **Terfi kontrolü**: aynı ders mistakes.md'de 3. kez mi? → `rules/` dosyası
   öner. Kural sık mı çiğneniyor? → `hooks/` davranış kontrolü öner
   (`~/dev-starter/CLAUDE.md → Bu Dosyaları Güncelleme` prosedürleriyle).
5. Çelişki taraması: yeni ders mevcut patterns/guides ile çelişiyorsa eski
   kaydı "bayat → #N" işaretle (sessiz çift kaynak bırakma).

Çıktı: işlenen kayıtların listesi (dosya + başlık) ya da "kayda değer ders yok".
