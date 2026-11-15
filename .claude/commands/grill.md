---
description: Kodlamadan önce planı sorguya çeker — karar ağacını çıkarır, her turda yalnız ön koşulu çözülmüş kararları önerilen cevaplarıyla sorar, kodda bulunabilecek bilgiyi kendisi arar, kararı kullanıcıya bırakır. "Bu değişiklik neyi kırar" sorusunu VALIDATE'ten önce cevaplar. /story ve /plan öncesinde, ya da "planı sorgula", "beni sorguya çek", "emin değilim" dendiğinde kullan.
argument-hint: "[plan, story id ya da değişiklik tarifi — boşsa konuşmadaki son plan]"
---

# /grill — Planı Sorguya Çek

Konu: **$ARGUMENTS** (boşsa konuşmadaki son plan; o da yoksa kullanıcıdan
bir cümlelik tarif iste).

Amaç kod yazmak değil, **ortak anlayış**: plan kafada değil kâğıtta, gizli
bağımlılıklar (sıra, yan etki, unutulmuş çağrı) kodlamadan önce görünür.
Fikir kaynağı Matt Pocock'un `grilling` skill'i (MIT,
`~/dev-starter/knowledge/references.md` → § 4); metin ve akış bizim.

## Temel Kural

- **Bilgi sorusu kullanıcıya sorulmaz.** "Bu fonksiyon nerede çağrılıyor",
  "şu tablo hangi alanları taşıyor", "bu entegrasyon neye bağımlı" koddan,
  belgeden ya da `git log`dan bulunur. Grep/Read ile kendin ara; alan genişse
  `Explore` subagent'ına ver (yol + üç satır özet döner).
- **Karar sorusu kullanıcıya sorulur**, ama çıplak değil: her sorunun altında
  kendi önerin ve tek cümle gerekçesi durur. Kullanıcı "tamam" diyebilmeli.
- Kod değiştirme. Bu komut yalnız okur, sorar ve yazıya döker.

## Akış

1. **Bağlamı topla**: Plan/story metnini oku. Projedeyse `docs/ROUTEMAP.md`,
   ilgili `docs/stories/STORY-*.md`, `docs/ARCHITECTURE.md`; dokunulacak
   dosyaları ve **onları çağıran yerleri** bul (çağrı zinciri, middleware,
   hook, cron, webhook). Bilinen hata sınıfı mı:
   `~/dev-starter/knowledge/mistakes.md` indeksi.
2. **Karar ağacını çıkar**: Planı kararlara böl; her kararın ön koşulunu
   yaz (B, A'ya bağlıysa A önce). Koddan cevaplanan düğümleri **bulgu**
   olarak işaretle, soru listesine koyma. Ağacı kısa liste halinde göster.
3. **Tur tur sor** — her turda yalnız **sınırdaki** kararlar (ön koşulları
   çözülmüş olanlar), en çok 4 soru (`AskUserQuestion`, önerin ilk seçenek ve
   "(Önerilen)"). Kullanıcı tek soru istediyse ya da `CLAUDE.md`de öyle
   yazıyorsa her turda bir soru. Soru biçimi:

   ```text
   ❓ 3. Yeni ödeme çağrısı fonksiyonun başında mı sonunda mı?
      Bulgu: stok düşümü (lib/stock.ts:42) aynı fonksiyonda; webhook onu
      ödeme onayından ÖNCE bekliyor.
   ➡  Önerim: başında — sonda olursa webhook düşülmemiş stokla yarışır.
   ```

4. **Her cevaptan sonra ağacı güncelle**: cevap yeni dal açtıysa ekle, bir
   dalı geçersiz kıldıysa kapat; açılan bilgi sorusunu yine kendin araştır.
5. **Bitir**: Açık karar kalmayınca ya da kullanıcı "anlaştık" deyince dur.
   Erken bitirme isteği her zaman geçerli; kalan açıkları listele.

## Kayıt

Kararlar havada kalmaz:

- Story varsa kararları story dosyasının **Teknik Notlar**ına (yoksa sonuna
  "Sorgu Kararları" başlığıyla) işle; plan güncellenir, sonra
  `~/dev-starter/rules/dev-cycle.md` → 2. VALIDATE.
- Story yoksa kararları sohbet içinde özetle; kullanıcı isterse
  `docs/decisions/` ya da ilgili belgeye yaz.
- Mimari etkili karar (yeni bağımlılık, şema, yetki) → `docs/ARCHITECTURE.md`
  için taslak öner; ekosistem kararıysa `knowledge/decisions.md` taslağı
  (onaysız yazma — `~/dev-starter/rules/self-improvement.md`).

## Ne Zaman Değil

KÜÇÜK iş (typo, tek satır config, kopya düzeltmesi) sorguya değmez —
`dev-cycle.md` kısayolu. Komut kendiliğinden her işte koşmaz; `/story` ve
`/plan` onu ORTA/BÜYÜK işte VALIDATE'ten önce **önerir**.

Çıktı: karar ağacı (bulgular işaretli), alınan kararlar ve gerekçeleri,
açık kalanlar, güncellenen dosya(lar).
