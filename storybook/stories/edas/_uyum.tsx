"use client";

import { ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageBody, PageHead, type PageProps } from "./_ui";

/** İskelet sayfa: motor (`_store.ts`) hazır, ekran Wave 2'de doldurulur. */
export function UyumPage(_props: PageProps) {
  return (
    <>
      <PageHead title="Uyum Merkezi" description="KVKK rızaları ve veri talepleri, rol ve yetki matrisi, iki göz onayları, denetim izi." />
      <PageBody>
        <EmptyState icon={<ShieldCheck />} title="Bu ekran hazırlanıyor" hint="Veri ve eylemler tek depoda hazır; arayüz bir sonraki adımda bağlanır." />
      </PageBody>
    </>
  );
}
