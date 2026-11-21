"use client";

import { Network } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageBody, PageHead, type PageProps } from "./_ui";

/** İskelet sayfa: motor (`_store.ts`) hazır, ekran Wave 2'de doldurulur. */
export function SebekePage(_props: PageProps) {
  return (
    <>
      <PageHead title="Şebeke ve Trafo" description="Trafo merkezi, fider ve dağıtım trafosu yükü: doluluk, alarm ve etkilenen aboneler." />
      <PageBody>
        <EmptyState icon={<Network />} title="Bu ekran hazırlanıyor" hint="Veri ve eylemler tek depoda hazır; arayüz bir sonraki adımda bağlanır." />
      </PageBody>
    </>
  );
}
