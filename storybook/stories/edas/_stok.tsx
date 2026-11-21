"use client";

import { Boxes } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageBody, PageHead, type PageProps } from "./_ui";

/** İskelet sayfa: motor (`_store.ts`) hazır, ekran Wave 2'de doldurulur. */
export function StokPage(_props: PageProps) {
  return (
    <>
      <PageHead title="Sayaç Stok" description="Depo envanteri, tahsis, muayene ve söküm: sayaçların yaşam döngüsü." />
      <PageBody>
        <EmptyState icon={<Boxes />} title="Bu ekran hazırlanıyor" hint="Veri ve eylemler tek depoda hazır; arayüz bir sonraki adımda bağlanır." />
      </PageBody>
    </>
  );
}
