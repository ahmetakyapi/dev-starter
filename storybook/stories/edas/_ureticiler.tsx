"use client";

import { Sun } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageBody, PageHead, type PageProps } from "./_ui";

/** İskelet sayfa: motor (`_store.ts`) hazır, ekran Wave 2'de doldurulur. */
export function UreticilerPage(_props: PageProps) {
  return (
    <>
      <PageHead title="Üreticiler" description="Net ölçüm ve lisanssız üretim: çift yönlü sayaç, dönemsel mahsup ve devreden alacak." />
      <PageBody>
        <EmptyState icon={<Sun />} title="Bu ekran hazırlanıyor" hint="Veri ve eylemler tek depoda hazır; arayüz bir sonraki adımda bağlanır." />
      </PageBody>
    </>
  );
}
