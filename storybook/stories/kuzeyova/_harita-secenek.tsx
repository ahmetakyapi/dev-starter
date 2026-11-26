"use client";

import { useState } from "react";
import { CURRENT_PERIOD, SUBSTATIONS, regionLoss } from "./_data";
import { CartoMap, type CartoLook, type CartoMarker, type CartoRegion } from "./_harita-carto";
import { fmtPct } from "./_kit";
import { openOutages } from "./_selectors";

/** Harita seçenekleri: aynı veri, üç görünüm. Sahibi seçer, seçilen Pano ve Arıza ekranına gider. */
export function MapOptions() {
  const [selected, setSelected] = useState<string | null>(null);
  const losses = regionLoss(CURRENT_PERIOD);
  const down = new Set(openOutages().map((o) => o.substationId));
  const regions: CartoRegion[] = losses.map((l) => {
    const over = l.lossPct > l.region.lossTarget;
    return { id: l.region.id, label: l.region.name, value: `Kayıp ${fmtPct(l.lossPct)}`, note: `hedef %${l.region.lossTarget}`, tone: over ? "danger" : "success" };
  });
  const markers: CartoMarker[] = SUBSTATIONS.map((s) => ({ id: s.id, regionId: s.regionId, label: `${s.name}: ${down.has(s.id) ? "arızalı" : "çalışıyor"}`, tone: down.has(s.id) ? "danger" : "success" }));
  const looks: { look: CartoLook; name: string; note: string }[] = [
    { look: "topo", name: "A · Topoğrafik", note: "Kağıt zemin, arazi kabartması, kesik idari sınırlar, beyaz yollar." },
    { look: "gece", name: "B · Gece Uydu", note: "Koyu zemin, ışıklı yollar ve trafolar; iki temada da koyu." },
    { look: "kroki", name: "C · Sade Kroki", note: "Kabartmasız, düz pastel; kalın beyaz sınırlar, en sakin olanı." },
  ];
  return (
    <div className="grid gap-6 bg-page p-6 lg:grid-cols-3">
      {looks.map((l) => (
        <figure key={l.look} className="grid content-start gap-3">
          <CartoMap title={`Bölge haritası, ${l.name}`} look={l.look} regions={regions} markers={markers} selectedId={selected} onSelect={(id) => setSelected((c) => (c === id ? null : id))} className="ring-1 ring-line" />
          <figcaption className="grid gap-0.5 px-1">
            <span className="text-base font-semibold text-strong">{l.name}</span>
            <span className="text-small text-muted">{l.note}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
