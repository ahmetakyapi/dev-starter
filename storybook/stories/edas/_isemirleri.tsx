"use client";

import { Wrench } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageBody, PageHead, type PageProps } from "./_ui";

/** İskelet sayfa: motor (`_store.ts`) hazır, ekran Wave 2'de doldurulur. */
export function IsEmirleriPage(_props: PageProps) {
  return (
    <>
      <PageHead title="İş Emirleri" description="Kesme, bağlama, sayaç değişimi, keşif ve onarım: tek durum makinesi." />
      <PageBody>
        <EmptyState icon={<Wrench />} title="Bu ekran hazırlanıyor" hint="Veri ve eylemler tek depoda hazır; arayüz bir sonraki adımda bağlanır." />
      </PageBody>
    </>
  );
}
