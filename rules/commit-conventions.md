# Commit Conventions

**Kural**: Tüm commit'ler Conventional Commits standardını takip eder.

---

## Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Type'lar

| Type | Ne Zaman | Örnek |
|------|----------|-------|
| `feat` | Yeni özellik | `feat(auth): add Google OAuth provider` |
| `fix` | Bug düzeltme | `fix(api): handle null response in user endpoint` |
| `refactor` | Davranış değiştirmeyen kod değişikliği | `refactor(ui): extract card component from dashboard` |
| `style` | Görsel/CSS değişikliği (davranış değişmez) | `style(landing): update hero gradient colors` |
| `perf` | Performans iyileştirmesi | `perf(db): add index on users.email column` |
| `test` | Test ekleme/düzeltme | `test(auth): add session expiry edge case` |
| `docs` | Dokümantasyon | `docs: update README with deploy instructions` |
| `chore` | Build, config, dependency | `chore: upgrade next to 15.1.0` |
| `ci` | CI/CD değişikliği | `ci: add lighthouse check to PR workflow` |

### Scope (opsiyonel ama önerilen)

Değişikliğin etkilediği alan:

- `auth`, `api`, `db`, `ui`, `landing`, `dashboard`
- Paket adı: `theme`, `ui-kit`
- Genel: scope yazma

### Description Kuralları

- Küçük harfle başla
- Nokta ile bitirme
- Imperative mood: "add" (not "added", not "adds")
- Max 72 karakter
- Türkçe değil, İngilizce

---

## Breaking Changes

```
feat(api)!: change user endpoint response format

BREAKING CHANGE: /api/users now returns { data: User[] } instead of User[]
```

- `!` type'dan sonra ekle
- Footer'da `BREAKING CHANGE:` ile detay ver
- Production sonrası breaking change = BA Agent onayı gerektirir

---

## Commit Gruplandırma

Tek commit = tek mantıksal değişiklik.

**Doğru:**
```
feat(auth): add login page with email/password form
feat(auth): add server action for credential validation
feat(auth): add protected route middleware
```

**Yanlış:**
```
feat: add auth (login sayfası, validation, middleware, session, redirect hepsi tek commit'te)
```

---

## Commit Öncesi Kontrol Listesi

1. Sadece ilgili dosyalar stage'de mi? (`git diff --staged` kontrol)
2. `console.log` / debug kodu kaldırıldı mı?
3. Testler geçiyor mu?
4. Type check temiz mi? (`tsc --noEmit`)
5. Commit mesajı format'a uygun mu?

---

## Özel Durumlar

### Merge commit
```
Merge branch 'feature/auth' into main
```

### Revert
```
revert: feat(auth): add Google OAuth provider

This reverts commit abc1234.
Reason: OAuth callback URL misconfiguration in production.
```

### WIP (sadece feature branch'te)
```
wip: auth flow in progress
```
WIP commit'ler main'e merge edilmez — squash veya amend ile temizle.
