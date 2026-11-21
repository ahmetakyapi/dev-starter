"use client";

import { Headset } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageBody, PageHead, type PageProps } from "./_ui";

/** İskelet sayfa: motor (`_store.ts`) hazır, ekran Wave 2'de doldurulur. */
export function CagriPage(_props: PageProps) {
  return (
    <>
      <PageHead title="Çağrı Merkezi" description="Arıza, fatura ve bilgi çağrıları: ortak arıza adayları ve SLA takibi." />
      <PageBody>
        <EmptyState icon={<Headset />} title="Bu ekran hazırlanıyor" hint="Veri ve eylemler tek depoda hazır; arayüz bir sonraki adımda bağlanır." />
      </PageBody>
    </>
  );
}
