"use client";

import { ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageBody, PageHead, type PageProps } from "./_ui";

/** İskelet sayfa: motor (`_store.ts`) hazır, ekran Wave 2'de doldurulur. */
export function BasvurularPage(_props: PageProps) {
  return (
    <>
      <PageHead title="Başvurular" description="Yeni bağlantı, güç artırımı ve devir başvuruları: evrak, keşif, bağlantı bedeli, montaj ve enerjilendirme." />
      <PageBody>
        <EmptyState icon={<ClipboardList />} title="Bu ekran hazırlanıyor" hint="Veri ve eylemler tek depoda hazır; arayüz bir sonraki adımda bağlanır." />
      </PageBody>
    </>
  );
}
