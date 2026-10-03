"use client";

/**
 * Son çare: kök layout çöktüğünde devreye girer ve onun YERİNE geçer.
 *
 * Kendi `<html>` ve `<body>`sini basmak zorunda; globals.css'in yüklendiğine
 * güvenilemez. Renkler bu yüzden satır içi ve tema çerezi okunamadığı için
 * işletim sistemi tercihine (`prefers-color-scheme`) bakılır. Token
 * tekrarı bilinçli bir istisna; değerler globals.css'teki `signature` paletiyle aynı.
 */

const STYLES = `
:root{color-scheme:light dark;--bg:#f7f9fb;--fg:#101c2b;--soft:#54677c;--btn:#0d74c4;--on:#fff}
@media (prefers-color-scheme:dark){:root{--bg:#070d16;--fg:#eaf1f8;--soft:#94a7ba;--btn:#35b8ff;--on:#06121f}}
body{margin:0;min-height:100dvh;display:grid;place-items:center;background:var(--bg);color:var(--fg);font:16px/1.6 system-ui,sans-serif;padding:1rem}
main{max-width:28rem;text-align:center}
h1{font-size:1.5rem;margin:0 0 .75rem}
p{color:var(--soft);margin:0}
button{margin-top:1.5rem;min-height:44px;padding:0 1.25rem;border:0;border-radius:.75rem;background:var(--btn);color:var(--on);font:600 .875rem system-ui,sans-serif;cursor:pointer}
code{display:block;margin-top:1.5rem;font-size:.75rem;color:var(--soft)}
`;

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="tr">
      <head>
        <title>Bir Şeyler Ters Gitti</title>
        <style>{STYLES}</style>
      </head>
      <body>
        <main>
          <h1>Uygulama Şu An Açılamıyor</h1>
          <p>Beklenmedik bir hata oluştu. Tekrar dene; sorun sürerse birazdan yeniden bak.</p>
          <button type="button" onClick={() => retry()}>
            Tekrar Dene
          </button>
          {error.digest ? <code>Hata Kimliği {error.digest}</code> : null}
        </main>
      </body>
    </html>
  );
}
