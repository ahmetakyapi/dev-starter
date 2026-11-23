# Kaynak

- Depo: https://github.com/gokayfem/reference-to-game (MIT, gokayfem)
- Alınan commit: `6a00e491f578bbfcbdba45f0c7bddf4693016e61` (2026-11-22)
- Alınan: yalnız `skills/reference-to-game/` (SKILL.md, references/, scripts/, assets/runtime/) olduğu gibi,
  değiştirilmeden. Örnek oyunlar (~190 MB), galeri, değerlendirmeler ve adaptörler alınmadı.
  Kod ve belgeler MIT; örnek sanat ve üretilmiş varlıklar MIT dışı, bu yüzden depoya girmedi.

## Ne zaman kullanılır

Bir görselden, videodan, çizimden ya da yazılı fikirden OYNANABİLİR oyun/prototip yapılırken; görsel
kimliği (stil, renk, malzeme, kamera, arayüz) korumak asıl şartsa. Sıradan web arayüzü için değil
(oradaki yol `/reference`, `/theme`, `/clone-website`). Varsayılan çıktı Three.js + TypeScript + Vite;
ekosistemin Next şablonuyla karışmaz, ayrı bir proje klasöründe çalışır.

## Kurulum notu

`bash machine/bootstrap.sh` skill'i `~/.claude/skills/reference-to-game`e bağlar. CLI için Python 3.10+;
görsel araçlar Pillow, ses/video denetimi `ffmpeg` ve `ffprobe` ister
(`pip install -r scripts/requirements.txt`). fal ile varlık üretimi isteğe bağlı ve `FAL_KEY`
ister; anahtar yalnız ortam değişkeninde durur, depoya yazılmaz.

## Yükseltme

Upstream'i `git clone`layıp `skills/reference-to-game/`i buraya kopyala, yukarıdaki SHA'yı güncelle,
`bash scripts/health-check.sh` temiz olmalı. Yerel değişiklik yapma; gerekirse upstream'e öner.
