import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Birbirine bağlı düğmeler: "Önceki / Bugün / Sonraki", "Kopyala | ⌄" gibi.
 * Grup bir `role="group"` ve ADI var (`aria-label`); ekran okuyucu düğmeleri
 * neyin parçası olduğunu bilerek okur.
 *
 * Seçim taşıyorsa (biri seçili) bu değil `segmented-control.tsx`: orada
 * seçili durum `aria-checked` ile söylenir. Bu bileşen yalnızca görsel
 * birleşim; içindeki her düğme kendi işini yapar.
 *
 * Kenarlar komşusuyla üst üste biner (`-ml-px`), iç köşeler düzleşir. Odak
 * halkası komşunun altında kalmasın diye odaklı düğme öne alınır (`z-10`).
 * Çocuklar şablonun `Button`ı (`variant="secondary"`) ya da `IconButton`.
 */

type ButtonGroupProps = ComponentProps<"div"> & {
  "aria-label": string;
  orientation?: "horizontal" | "vertical";
};

export function ButtonGroup({ orientation = "horizontal", className, ...props }: ButtonGroupProps) {
  return (
    <div
      role="group"
      className={cn(
        "inline-flex isolate [&>*]:relative [&>*:focus-visible]:z-10 [&>*:hover]:z-[1]",
        orientation === "horizontal"
          ? "flex-row [&>*:not(:first-child)]:-ml-px [&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none"
          : "flex-col [&>*:not(:first-child)]:-mt-px [&>*:not(:first-child)]:rounded-t-none [&>*:not(:last-child)]:rounded-b-none",
        className,
      )}
      {...props}
    />
  );
}
