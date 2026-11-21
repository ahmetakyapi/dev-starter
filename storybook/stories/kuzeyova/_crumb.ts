import { SUPPLIERS } from "./_data";
import { findCustomer } from "./_data-musteri";
import { effectiveMeters } from "./_ops";
import { getStock } from "./_store";
import type { Page, Params } from "./_ui";

/**
 * Ekmek kırıntısının DETAY halkası: yönlendirmedeki `params.id`'den (ya da
 * `meter`/`application` gibi derin bağlantı parametrelerinden) depodan çözülür;
 * sayfa dosyaları `crumb` vermek zorunda değil. Bulunamazsa kimliğin kendisi.
 */
export function detailCrumb(page: Page, params: Params): string | undefined {
  const id = params.id ?? (page === "rawdata" ? params.meter : undefined);
  if (!id) return undefined;
  try {
    switch (page) {
      case "customers":
        return findCustomer(id)?.name ?? id;
      case "meters":
      case "rawdata":
        return effectiveMeters().find((m) => m.id === id)?.serial ?? id;
      case "stock":
        return getStock().find((s) => s.id === id)?.serial ?? id;
      case "suppliers":
        return SUPPLIERS.find((s) => s.id === id)?.name ?? id;
      default:
        return id;
    }
  } catch {
    return id;
  }
}
