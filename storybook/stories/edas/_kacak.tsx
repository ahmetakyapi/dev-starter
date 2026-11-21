"use client";

import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageBody, PageHead, type PageProps } from "./_ui";

/** İskelet sayfa: motor (`_store.ts`) hazır, ekran Wave 2'de doldurulur. */
export function KacakPage(_props: PageProps) {
  return (
    <>
      <PageHead title="Kaçak Vakaları" description="Şüpheli okumadan vakaya, tutanağa ve kaçak bedeline: saha kontrolü, itiraz ve tahsilat." />
      <PageBody>
        <EmptyState icon={<ShieldAlert />} title="Bu ekran hazırlanıyor" hint="Veri ve eylemler tek depoda hazır; arayüz bir sonraki adımda bağlanır." />
      </PageBody>
    </>
  );
}
