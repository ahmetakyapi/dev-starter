# 11 · VPS'e Deploy, Ortam Değişkenleri, E-posta ve Web Push

Varsayılan barındırma Vercel (`08-quality-and-ship.md § 7–8`; zamanlanmış iş
de orada: Vercel Cron). Uzun süren iş, WebSocket sunucusu, kalıcı disk ya da
tek sunucuda tam kontrol gerekince VPS
(`knowledge/tech-radar.md → Barındırma`). Bu rehber Açılış Zili'nde
(aciliszili.com, Ekim 2026) çalışan düzeni anlatır; dosya yolları o depoya
(`ahmetakyapi/acilis-zili`, herkese açık) aittir ve kopyalanabilir.

Uzun hikâyeler `knowledge/mistakes.md #100–101`te, kopyalanabilir desenler
`knowledge/patterns.md → GitHub Secrets → Sunucu Ortamı` ve
`→ Markalı İşlem E-postası`nda.

---

## 1. Deploy Akışı: Push → Doğrula → SSH → Sürüm Dizini

```text
main'e push → Actions "verify" (build + typecheck + lint, runner'da)
            → Actions "deploy" (needs: verify) → SSH → sunucuda deploy/update.sh
            → releases/<zaman>-<sha> klonla + derle → `current` bağını çevir
            → servisi yeniden başlat → sağlık kontrolü → geçmezse eski sürüme dön
```

- **Sunucu doğrulanan commit'i derler, dal ucunu değil.** Deploy işi
  `${{ github.sha }}`yı betiğe geçer, betik tam o SHA'yı çeker
  (`git fetch --depth 1 origin <sha> && git checkout FETCH_HEAD`). Dal ucunu
  klonlamak yarış açar: push X'in deploy'u koşarken gelen push Y ortak
  `concurrency` grubunda bekler, ama X'in klonu dal ucunda Y'yi bulur ve Y
  kendi verify'ı koşmadan canlıya çıkar. (Açılış Zili'nin `update.sh`'ı şu
  an dal ucunu klonluyor — bu madde oradaki açığı da anlatır.)
- **Kod sunucuya kopyalanmaz**, sunucu kendi `git clone`unu yapar. Derleme
  canlı dizinde yapılmaz: dakikalar süren build sırasında çalışan sürümün
  parça dosyaları altından çekilir (sayfa açılır, script'ler 404).
- **`current` bağı atomik çevrilir**: `ln -sfn yeni current.tmp && mv -T current.tmp current`.
  Sağlık kontrolü geçmezse bağ önceki sürüme döner, betik sıfırdan farklı çıkar.
- **Canlıya çıkmamış sürüm dizini silinir** (trap); yoksa budama sağlam
  sürümü silip bozuğu tutabilir.
- Duman testi ayrı iş akışı, kapı değil.
- Örnek: `deploy/update.sh`, `.github/workflows/deploy.yml`.

## 2. Actions Hijyeni

- `permissions: contents: read` ve `actions/checkout` için
  `persist-credentials: false`: hiçbir adım token'la push yapmıyorsa token
  `.git/config`e yazılmasın (ardından koşan `npm ci` postinstall'ları görür).
- **Sürümleri sabitle**: `actions/checkout@v5`, `actions/setup-node@v5`
  (Node 24 çalışma zamanı; v4'ün Node 20'si kullanımdan kalktı) ve
  `runs-on: ubuntu-24.04` — `ubuntu-latest` sessizce ana sürüm atlar
  (19 Ekim 2026'da 26'ya geçti). Yükseltme bilinçli bir commit olsun.
- **SSH host anahtarını sabitle**: `VPS_HOST_KEY` repo değişkeni (bir kez
  `ssh-keyscan <host>` çıktısı) `~/.ssh/known_hosts`a yazılır,
  `StrictHostKeyChecking=yes`. Tanımsızken `accept-new` her koşumda "her
  anahtarı kabul et" demektir.
- Sunucuya dokunan bütün iş akışları aynı `concurrency` grubunda
  (`deploy-vps`, `cancel-in-progress: false`): env yazımı ile yayın aynı
  anda servisi yeniden başlatmasın.

## 3. Ortam Değişkenleri: Tek Dosya, Tek Yazma Yolu

Sunucuda tek dosya: `/etc/<uygulama>.env` (`root:<uygulama> 0640`), hem
systemd `EnvironmentFile` hem bash okur — bash'te `set -a; . /etc/<uygulama>.env;
set +a`: `set -a` olmadan düz `source` yalnız kabuk değişkeni kurar, değerler
`npm run build`e geçmez ve derleme anı bayrağı sessizce varsayılana düşer
(#100'ün kardeşi). İkisinin ortak paydası
**tırnak içinde, `$` `` ` `` `\` `"` içermeyen** değer.

**Elle düzenleme yerine GitHub'dan senkron** (`deploy/sync-app-env.sh` +
`deploy/set-app-env.py`):

- Değerler GitHub'da; deploy derlemeden hemen önce izin listesindeki
  anahtarları sunucu dosyasına yazar.
- **Tanımsız secret sunucudaki değere dokunmaz** → elle konmuş anahtarlarla
  çakışmaz, geçiş anahtar anahtar yapılır.
- Değer komut satırından değil **şifreli stdin'den JSON** olarak gider;
  loga düşmez. İzin listesi + anahtar başına biçim denetimi; biri
  geçmezse dosyaya hiç dokunulmaz (hepsi ya da hiçbiri), satır sonu
  (değişken enjeksiyonu) reddedilir.
- Deploy beklemeden aktarmak için `workflow_dispatch`lı ayrı iş akışı
  ("Sync App Env") — yazar ve servisi yeniden başlatır.

**Secrets mi Variables mı:**

| Tür | Ne | Örnek |
|-----|----|-------|
| Secrets | Gizli; okunamaz, logda `***` | `RESEND_API_KEY`, `VAPID_PRIVATE_KEY`, `VPS_SSH_KEY` |
| Variables | Gizli değil; okunur | `SITE_INDEXABLE`, `VPS_HOST`, `VPS_HOST_KEY` |

İş akışında `secrets.X` ile `vars.X` ayrı ad alanı: değişkeni yanlış sekmeye
koymak "tanımsız" demektir ve senkron sessizce hiçbir şey yapmaz.

**Çalışma anı mı derleme anı mı** — değiştirince ne gerekir:

| Okunduğu an | Örnek | Değişince |
|-------------|-------|-----------|
| Çalışma anı (`process.env` istek içinde) | `RESEND_API_KEY`, `EMAIL_FROM`, `VAPID_*` | servisi yeniden başlat (Sync App Env) |
| Derleme anı (statik rota, `NEXT_PUBLIC_*`, modül seviyesinde okunan bayrak) | `SITE_INDEXABLE` (robots.txt statik), `NEXT_PUBLIC_SITE_URL` | **yeniden deploy** |

**Dışarıdan doğrula.** "Anahtarı koydum, servisi yeniden başlattım" yetmez
(#101): özelliğin dışarıdan görünen bir işareti olsun (e-posta yoksa
`/sifremi-unuttum` 404, varsa 200) ve deploy sonrası `curl` ile bak.
Değeri ekrana basmadan servisin gördüğü **adları** listelemek:

```bash
sudo cat /proc/$(systemctl show -p MainPID --value <servis>)/environ \
  | tr '\0' '\n' | grep -oE '^(RESEND_API_KEY|EMAIL_FROM|VAPID_[A-Z_]+)='
```

## 4. Arama Motoruna Açık mı?

`SITE_INDEXABLE=false` ikinci kopya (staging) için doğru, asıl alan adında
**sitenin tamamını** Google'dan çeker: `robots.txt` `Disallow: /`, her
sayfada `noindex` (#100). Derlemede okunur.

- Değer GitHub **Variables**'ta (`SITE_INDEXABLE=true`), deploy yazar.
- Her deploy sonrası: `curl -s https://<alan>/robots.txt` → `Allow: /` +
  `Sitemap:` satırı; ana sayfada `<meta name="robots" content="index, follow">`.
- Kişisel sayfalar (`/ayarlar`, `/admin`, taslaklar) ayrıca `noindex` +
  `NOINDEX_PATHS`; Search Console'da "noindex nedeniyle hariç" listesinde
  yalnız onlar görünmeli.

**Search Console kurulumu** (bir kez):

1. Mülk türü **Alan adı** (Domain) → Google bir TXT kaydı verir.
2. DNS sağlayıcısında (Açılış Zili: Squarespace) `@` için **yeni** TXT
   kaydı. MX, SPF, DKIM, DMARC ve e-posta servisinin kayıtlarına dokunma.
   Doğrulama TXT'si silinirse mülk doğrulaması düşer.
3. Site haritası: `https://<alan>/sitemap.xml`.
4. URL denetimi → "Dizine eklenmeyi iste". Google `robots.txt`yi **24 saate
   kadar önbellekte** tutar: site yeni açıldıysa canlı test bir gün
   "engellendi" der, site haritası "Getirilemedi" kalır — bekle, tekrarla.
5. Bing Webmaster → "Google Search Console'dan içe aktar" (yalnız ilgili mülk).

## 5. İşlem E-postası (Resend)

- **SDK yok**: tek `fetch` POST'u (`lib/email.ts`); servis değişirse yalnız
  o dosya değişir. Anahtar yoksa özellik **hiç basılmaz** (bağlantı yok,
  sayfa 404) — gönderilemeyen bir formu göstermek tıklamayı yutar.
- **Alan adını Resend'de doğrula** (SPF + DKIM kayıtları). Anahtar yalnız
  gönderme yetkili ve o alan adıyla sınırlı.
- **DMARC katıysa** (`p=reject; adkim=s`) gönderen adres **tam olarak**
  `@<alan>` olmalı; alt alan ya da başka alan reddedilir.
- **Gönderen adres yanıt almaz** (`bildirim@`): yönlendirmesi olmayan kutuya
  yanıt geri döner. Postanın dibine "yanıt almayan adres, lütfen yanıtlama"
  satırı. Sitenin iletişim adresi ayrı (`hello@`, yönlendirmeli) ve tek
  sabit (`CONTACT_EMAIL`); KVKK başvuru kanalı orası.
- **Hesap varlığını sızdırma**: her adrese aynı yanıt; token yazımı ve
  gönderim `after()` ile yanıttan **sonra** (yanıt süresi de eşit olsun).
  Hız sınırı hem IP hem adres başına.
- **Metin söz vermez**: posta yalnız kodun gerçekten yaptığını söyler. Şifre
  değişince JWT oturumları düşmüyorsa "tüm cihazlarda çıkış yapıldı" yazılmaz.
- **Test**: canlı formu kendi adresinle gönder → gelen kutusu + Resend →
  Logs ("Delivered"; "Rejected" ise DMARC/DKIM). Site her adrese aynı
  yanıtı verdiği için teslimi dışarıdan göremezsin.

**HTML şablonu** — web değil, istemcilerin en dar ortak paydası
(`lib/email-layout.ts`; desen `patterns.md → Markalı İşlem E-postası`):

- Düzen tablo, stil satır içi; `<style>` yalnız ilerleme (Apple Mail koyu
  tema renkleri, düğme ışığı, `prefers-reduced-motion`).
- **Animasyon GIF**: Gmail CSS animasyonunu ve SVG'yi siler, GIF'i oynatır.
  GIF betikle üretilir (`scripts/build-email-assets.mjs`, sharp
  `join: { animated: true }`), elle değil. 1,4 sn vuruş + uzun duraklama.
- GIF zemini **düz renk** ve etrafındaki bant aynı renk (saydam GIF kenarı
  tırtıklar). Gmail web ve Android koyu bandı çevirmez, açık kartı kendisi
  koyulaştırır; **Gmail iOS tam ters çevirir**: koyu bant açılır, GIF
  çevrilmez ve bant içinde dikdörtgen olarak görünür. Testte iOS Gmail'e de
  bak; uyuşmazlığı ya kabul edip yaz ya da GIF kenarını bantla eritecek
  biçimde üret.
- "Kurşun geçirmez" düğme: dolgulu `<a>`, arka plan `bgcolor` + degrade.
- Gizli önizleme satırı (preheader) + düz metin sürümü aynı sırada.
- Görseller mutlak adresle (bağlantının `origin`inden).
- Tarayıcıda 390 pikselde açık/koyu ekran görüntüsüyle kontrol et.

## 6. Web Push (VAPID)

- Anahtar üret: `npx web-push generate-vapid-keys`. `VAPID_PUBLIC_KEY`,
  `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:`) çalışma anında okunur.
- **Anahtar değişirse bütün abonelikler düşer** — yenileme gerekiyorsa
  abone yokken yap; GitHub'a sunucudakiyle birebir aynı değeri koy.
- Service worker yalnız bildirim taşır, `fetch` önbelleği yok (bayat veri).
- iOS'ta yalnız ana ekrana eklenmiş PWA'da (16.4+); Mac Chrome'da sistem
  bildirim izni de gerekir.
- Ayarlar'da "Deneme Bildirimi Gönder" düğmesi: kurulumun tek tık testi.
- **Kutu + push tek giriş noktası** (`notifyUser`): bildirim satırı
  kullanıcının dilinde kutuya yazılır, sonra push gider. Push kapalı
  cihazda kayıt yine kalır; ikisi asla ayrı düşmez.

---

## Kontrol Listesi

- [ ] Deploy: verify → SSH → **doğrulanan SHA** → sürüm dizini → atomik bağ → sağlık → geri dönüş
- [ ] Actions: `contents: read`, `persist-credentials: false`, sabit sürümler, host key, ortak `concurrency`
- [ ] Sırlar GitHub Secrets'ta, bayraklar Variables'ta; sunucuya izin listeli senkronla
- [ ] Derleme anı değişkeni değişti → yeniden deploy; çalışma anı → yeniden başlat
- [ ] Deploy sonrası `robots.txt` ve `meta robots` dışarıdan kontrol
- [ ] Search Console: alan adı mülkü (DNS TXT), site haritası, URL denetimi
- [ ] E-posta: alan adı doğrulu, gönderen `@<alan>`, "yanıtlama" notu, iletişim adresi ayrı
- [ ] E-posta özelliği anahtarsızken görünmüyor; varken canlı formla test edildi
- [ ] Push: VAPID üç değişken, deneme bildirimi geldi
