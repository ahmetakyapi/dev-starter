"use client";

import { Smartphone } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageBody, PageHead, type PageProps } from "./_ui";

/** İskelet sayfa: motor (`_store.ts`) hazır, ekran Wave 2'de doldurulur. */
export function SahaPage(_props: PageProps) {
  return (
    <>
      <PageHead title="Saha Okuma" description="Okuma turu, durak durak endeks girişi ve fotoğraf: telefon öncelikli saha ekranı." />
      <PageBody>
        <EmptyState icon={<Smartphone />} title="Bu ekran hazırlanıyor" hint="Veri ve eylemler tek depoda hazır; arayüz bir sonraki adımda bağlanır." />
      </PageBody>
    </>
  );
}
