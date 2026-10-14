# Self-Improvement — Sürekli Öğrenme Kuralları

**Kural**: Ekosistem her işten ders çıkarır; ama ajan, bilgi ve kural
dosyalarını **onaysız değiştiremez**. Modelin öz-değerlendirmesi yanlıdır —
otomatik "gece dersi çıkarma" cazip ve yanlış. Ajan taslak üretir, insan seçer.

---

## Öğrenme Kanalları

| Kanal | Tetik | Araç |
|-------|-------|------|
| Compound mikro-adımı | Her story DONE olunca | `rules/dev-cycle.md → 8` (üç soru) |
| Retro | Oturum/faz/iş bitince, istek üzerine | `/retro` |
| Bugfix kaydı | Her fix'te | `/fix` adım 6; `hooks/quality-scan.sh` testsiz fix'te hatırlatır |
| Release bilgi toplama | Yayın sonrası | `phases/release-maintenance.md` → Knowledge Capture |
| Ekosistem gelişimi | Periyodik / istek üzerine | `/evolve` (sağlık + tazelik + dış tarama) |
| Araştırma | Bilinmeyen alan açılınca | `/research` → `docs/research/` |

## Onay İlkesi

- Ajan `knowledge/`, `rules/`, `guides/`, `CLAUDE.md` ve `machine/CLAUDE.md`
  için **taslak önerir**; kullanıcı onaylamadan yazmaz. Tek istisna:
  kullanıcının o anda açıkça istediği güncelleme.
- Her taslak kanıt taşır: hangi olay/commit/çıktı bu dersi doğurdu.
- Koşu başına en fazla 1-2 damıtılmış ders — her pürüz ders değildir;
  dosyaları şişirmek öğrenme değil gürültüdür.

## Terfi Merdiveni

```text
1 kez yaşanan hata        → knowledge/mistakes.md kaydı (+ guides'a önleyici adım)
Aynı ders 3. kez          → rules/ dosyası (ya da mevcut kurala madde)
Kural sık çiğneniyor      → hooks/ davranış kontrolü (script + settings.json + test)
3. kez elle yazılan parça → snippets/ (+ katalog kaydı)
```

Merdivenin her basamağı `CLAUDE.md → Bu Dosyaları Güncelleme` prosedürünü izler.

## Çelişki ve Bayatlama

- Yeni ders mevcut `patterns.md`/`guides/` içeriğiyle çelişiyorsa eski kayıt
  **silinmez**, işaretlenir: `**Durum**: bayat (yerine: #N / guides/X § Y)`.
  Sessiz çift kaynak, bu deponun en pahalı hata sınıfıdır.
- `decisions.md`de değişen karar "Değişti (tarih)" alt başlığıyla eklenir;
  eskisi tarihçedir.
- Tazelik denetimi `/evolve`un işidir: mistakes indeks uyumu, 60+ günlük
  denetim/radar, patterns ↔ mistakes çelişkisi.

## Boy Tavanları

Bilgi dosyası büyümesi context bütçesini yer. `scripts/health-check.sh` uyarır:

| Dosya | Tavan (satır) |
|-------|---------------|
| `knowledge/mistakes.md` | 2200 |
| `knowledge/patterns.md` | 1600 |
| `CLAUDE.md` (kök) | 520 |

Tavana yaklaşınca çözüm silmek değil **katmanlamak**: eski stack kayıtları
`knowledge/archive/`e taşınır, yerinde indeksten tek satır kalır.
