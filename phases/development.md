# Development Phase

**Story'lerin uygulandığı faz — orkestrasyon playbook'u.**

> Planning'in (P1→P6) çıktısı story'lerdir; bu faz onları çalışan, Gate'den
> geçmiş, commit'lenmiş koda çevirir. Tek story'nin iç akışı
> `rules/dev-cycle.md`dedir; bu dosya **fazın kendisini** yönetir: story
> seçimi, işin boyu, subagent'lara dağıtım, dalga (wave) yürütme ve faz çıkışı.

---

## Giriş Kriteri

- P6 Dev Readiness Check ✅ (yeni projede) ya da ROUTEMAP'te onaylı story var
- `docs/ROUTEMAP.md` güncel; aktif faz Development

Session başında `hooks/session-brief.sh` ROUTEMAP özetini bağlama basar;
kaldığın yer ve sıradaki iş oradan okunur.

---

## İşin Boyu — Süreç İşe Göre Ölçeklenir

Her talep önce boyuna göre sınıflanır (BA rolü ilk mesajda beyan eder):

| Boy | Tanım | Süreç |
|-----|-------|-------|
| **KÜÇÜK** | Tek dosya / kozmetik / config | Story yok. Doğrudan Develop → Self-Check → Gate (hafif) → Commit. Rapor `docs/gate/adhoc-<YYYY-MM-DD>-<konu>.md`; aktif story yoksa hook kontrol etmez (sorumluluk ana oturumda). Başka bir story IN_PROGRESS ise önce onu BLOCKED yap ya da işini bitir |
| **ORTA** | Tek story, tek alan | `rules/dev-cycle.md` tam pipeline; ana oturum rolleri yürütür, gerekirse tek subagent |
| **BÜYÜK** | Çok story / çok alan / yeni modül | Bu dosyadaki dalga planı; iş kayıtlı subagent'lara dağıtılır |

Belirsiz fikir Development'a girmez — `/kickoff` ya da Planning'e (P1) döner.

---

## Story Seçimi

1. ROUTEMAP Story Takibi tablosundan **NOT_STARTED** satırları al
2. Sırala: bağımlılığı çözülmüş olanlar → öncelik (HIGH → LOW) → küçük iş önce
3. BLOCKED story'lerin blokajını her seçimde yeniden değerlendir
4. Seçileni kullanıcıya tek cümleyle öner; onayla **IN_PROGRESS** yap

Aynı anda en fazla **iki** story IN_PROGRESS olur; ikincisi yalnız birincisiyle
dosya kesişimi yoksa açılır (merge çatışması davetiyesi).

---

## Dalga (Wave) Yürütme — Subagent'lara Dağıtım

Büyük işte ana oturum **orkestratördür** (BA rolü): işi böler, kayıtlı
subagent'lara dağıtır, sonuçları birleştirir. Dağıtım kuralları
`agents/AGENT_PROTOCOL.md → Orkestrasyon` bölümündedir (Görev Tanımı, efor
ölçekleme, referansla aktarım). Özet akış:

```text
Wave 1 (paralel, bağımsız alanlar):
  → backend subagent:  schema + API + testleri   (Görev Tanımı ile)
  → uiux rolü:         ekran/tasarım kararları    (ana oturum)
  → qa subagent:       story'nin test planı + failing testler

Wave 2 (Wave 1 çıktıları girince):
  → frontend subagent: UI + API entegrasyonu (BE'nin sözleşmesine karşı)

Wave 3:
  → gate subagent:     6+1 adım → rapor gövdesini döndürür (Write yetkisi bilinçli yok)
  → ana oturum:        raporu docs/gate/<story>.md'ye yazar, sonucu ROUTEMAP'e işler, commit
```

- **Paralel dosya çakışması riski varsa** önce Görev Tanımı'nın `sinir:`
  alanıyla dosya sahipliğini ayır (çoğu dalgada yeter); ayrılamıyorsa
  subagent `isolation: worktree` ile açılır — sıra aşağıda "Worktree ile
  Paralel Çalışma".
- **Subagent commit atmaz**, ROUTEMAP'e ve `docs/gate/`e yazmaz: commit,
  Gate kaydı ve durum geçişi ana oturumundur.
- **Dalga arası kontrol**: build + typecheck; çakışma varsa önce çöz, sonra
  yeni dalga.
- Subagent çıktısı dosyaya yazılır (aşağıdaki adresler); ana oturuma yalnız
  yol + üç satır özet döner (`rules/context-curation.md → Referansla Aktar`).

### Worktree ile Paralel Çalışma

`isolation: worktree` wrapper frontmatter'ında YOKTUR; orkestratör çağrı
başına seçer. Ne zaman: AYNI dalgadaki iki subagent aynı dosyalara yazacaksa
ve `sinir:` ile ayrılamıyorsa. Bilinmesi gerekenler (Claude Code belgesi,
10 Kasım 2026'da doğrulandı):

- Worktree **varsayılan daldan** (commit'lenmiş hâlden) açılır, ana ağacın
  commit'lenmemiş değişikliklerini GÖRMEZ. Bu yüzden önceki dalganın
  çıktısına bağımlı iş (ör. Wave 2 `frontend`, Wave 1 `backend`
  commit'lenmeden) worktree'de yapılmaz.
- Worktree'ye `.env.local` ve `node_modules` gelmez: ortam ya da kurulum
  isteyen doğrulamayı (build, test) ana oturum birleştirmeden SONRA çalıştırır;
  subagent teslimde "worktree'de çalıştırılamadı" diye yazar.
- Hook'lar worktree'de de koşar ve worktree'nin kendi ROUTEMAP'ini okur
  (`hooks/lib/routemap.sh`). Subagent commit atmadığı için Gate orada sorulmaz.

Sıra (commit tek yerde, ana ağaçta atılır; Gate birleşmiş hâli denetler):

```bash
# 1. Subagent worktree'de yazar, commit ATMAZ; teslimde worktree yolunu döndürür.
# 2. Ana oturum farkı ana ağaca alır (yeni ve ikili dosyalar dahil):
git -C <worktree> add -A
git -C <worktree> diff --cached --binary HEAD | git apply --3way
#    çakışma varsa ÖNCE çöz; sonra bir sonraki worktree'nin farkı
# 3. Ana ağaçta: npm run build && npm run typecheck   (dalga arası kontrol)
# 4. /gate <story>  → PASSED → commit (ana ağaçta) → push
# 5. Temizlik: git worktree remove --force <worktree> && git branch -D <dal>
```

Gate'i worktree'de çalıştırma: kapsam izi (`hooks/lib/gate-hash.sh`) commit
anında ana ağaçta yeniden hesaplanır ve tutmaz.

### Çıktı Adresleri

| Üretici | Adres |
|---------|-------|
| Gate raporu | `docs/gate/<story>.md` |
| Araştırma | `docs/research/<konu>.md` |
| Tasarım denetimi | `docs/review/<tarih>-<kapsam>.md` |
| Story notları / GATE-LOG | story dosyasının altına bölüm |
| Kod | doğrudan dosyalar; teslim mesajında değişen dosya listesi |

---

## Gate Döngüsü ve Eskalasyon

```text
Gate FAILED → rapor yapılandırılmış (hangi pass, kanıt, beklenen düzeltme)
    ↓
İlgili subagent/rol düzeltir (GATE-LOG'u okuyarak; aynı kök nedene ikinci kez düşmek bulgudur)
    ↓
ROUTEMAP Gate kolonu: FIX_1 → FIX_2 → hâlâ FAILED ise ESCALATED
    ↓
ESCALATED: ana oturum durur, kullanıcıya seçenekli özet sunar
```

Gate **PASSED**'i ROUTEMAP'e **ana oturum** işler (gate subagent'ının Write
yetkisi yok — bu bilinçli: denetleyen, denetlediği kaydı değiştirmez).
`hooks/gate-guard.sh` commit'i bu kayda göre açar.

---

## Faz İçi Ritüeller

- **Story bitince** (DONE): `rules/dev-cycle.md → 8. Compound` — üç soru:
  mistakes'lik hata, patterns'lik desen, decisions'lık karar çıktı mı?
  Çıktıysa taslağı kullanıcı onayına sun (`rules/self-improvement.md`).
- **Bilinmeyen alan açılınca**: `/research <konu>` — benzer ürünler bu sorunu
  nasıl çözmüş; çıktı `docs/research/` + karar önerisi.
- **Büyük görsel değişiklik sonrası**: design-reviewer subagent'ı ekrandan ölçer.

---

## Çıkış Kriteri

- Fazdaki tüm story'ler **DONE** ve Gate kolonları **PASSED**
  (`hooks/routemap-sync.sh` tutarsızlığı yakalar)
- `bash ~/dev-starter/scripts/audit-project.sh .` temiz ya da bulgular bilinçli-kayıtlı
- ROUTEMAP: Development → DONE, E2E & Polish → IN_PROGRESS
- Sırada: `phases/e2e-polish.md` (E0: Seed Data'dan başlar)
