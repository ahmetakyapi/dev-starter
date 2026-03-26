# Screens — [Proje Adı]

## Route Haritası

| Route | Sayfa | Auth | Layout |
|-------|-------|------|--------|
| / | Landing | Hayır | Public |
| /login | Giriş | Hayır | Auth |
| /register | Kayıt | Hayır | Auth |
| /dashboard | Dashboard | Evet | App |

## Ekran Detayları

### Landing (/)
**Layout**: Public (Header + Footer)
**Bileşenler**:
- Hero section (başlık + CTA)
- Features grid
- How it works
- Testimonials
- Footer CTA

### Dashboard (/dashboard)
**Layout**: App (Header + Sidebar)
**Bileşenler**:
- Stats overview (kartlar)
- Ana içerik alanı
- Quick actions

## Paylaşılan Bileşenler

| Bileşen | Kullanım Yeri | Props |
|---------|--------------|-------|
| Header | Tüm sayfalar | theme toggle, auth state |
| Footer | Public layout | links |
| Sidebar | App layout | nav items, collapse |

## Design Tokens

**Tema**: [tema adı veya `knowledge/themes/[proje].md` referans]

| Token | Değer | Kullanım |
|-------|-------|----------|
| --color-primary | | Ana renk |
| --color-background | | Arka plan |
| --color-foreground | | Metin rengi |
| --color-card | | Kart arka planı |
| --color-border | | Kenarlık rengi |
| --radius | | Border radius |
