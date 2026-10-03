"use client";

import { RotateCw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";

/**
 * Segment hata sınırı.
 *
 * `retry` (Next 16.3'te kararlı) `reset`ten farklıdır: segmenti sunucudan
 * YENİDEN İSTER ve sonra çizer. Eski kalıp `startTransition(() => {
 * router.refresh(); reset(); })` aynı işi elle yapıyordu; yalnızca `reset()`
 * ağa çıkmaz ve sunucuda doğan hata aynı yükle anında geri gelir.
 *
 * Hata MESAJI gösterilmez: sunucu hatası dosya yolu, sorgu ya da sağlayıcı
 * yanıtı taşıyabilir. Kullanıcının iletebileceği tek şey `digest`; aynı
 * kimlik `instrumentation.ts` kaydında da var.
 */
export default function ErrorBoundary({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main id="icerik" className="mx-auto grid min-h-dvh max-w-xl place-items-center px-4 py-16">
      <Panel className="w-full text-center">
        <h1 className="text-heading font-bold">Bir Şeyler Ters Gitti</h1>
        <p className="mt-3 text-read text-soft">
          Bu ekran yüklenemedi. Çoğu zaman geçici bir sorundur; tekrar denemek genellikle yeter.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => retry()}>
            <RotateCw aria-hidden />
            Tekrar Dene
          </Button>
          <ButtonLink href="/" variant="ghost">
            Ana Sayfaya Dön
          </ButtonLink>
        </div>
        {error.digest ? (
          <p className="mt-6 font-mono text-small text-muted">Hata Kimliği {error.digest}</p>
        ) : null}
      </Panel>
    </main>
  );
}
