import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Sayfa Bulunamadı" };

export default function NotFound() {
  return (
    <main id="icerik" className="mx-auto grid min-h-dvh max-w-xl place-items-center px-4 py-16">
      <EmptyState
        className="w-full"
        icon={<SearchX aria-hidden />}
        title="Sayfa Bulunamadı"
        hint="Aradığın adres taşınmış ya da hiç var olmamış olabilir."
        action={<ButtonLink href="/">Ana Sayfaya Dön</ButtonLink>}
      />
    </main>
  );
}
