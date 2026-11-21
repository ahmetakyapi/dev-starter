/**
 * Kuzeyova'nın ŞEMATİK bölge haritası: stilize poligonlar, gerçek coğrafya
 * değil (sınır dosyası ya da harita sağlayıcısı yok). Altı bölge komşu kenarları
 * paylaşır; `RegionMap` bu yolları kullanır. Kimlikler `_data.ts` `REGIONS` ile aynı.
 */
export const MAP_VIEWBOX = "0 0 420 300";

export const MAP_SHAPES: readonly { id: string; path: string; at: readonly [number, number] }[] = [
  { id: "yayla", path: "M12 14 L150 8 L190 56 L172 120 L96 138 L22 104 Z", at: [92, 72] },
  { id: "ova", path: "M150 8 L330 14 L352 76 L296 122 L232 134 L172 120 L190 56 Z", at: [262, 68] },
  { id: "vadi", path: "M22 104 L96 138 L172 120 L190 170 L150 232 L60 214 L8 170 Z", at: [92, 178] },
  { id: "merkez", path: "M172 120 L232 134 L262 190 L230 250 L150 232 L190 170 Z", at: [212, 188] },
  { id: "sanayi", path: "M232 134 L296 122 L352 76 L410 130 L404 214 L330 250 L262 190 Z", at: [338, 156] },
  { id: "kiyi", path: "M8 170 L60 214 L150 232 L230 250 L330 250 L404 214 L396 284 L250 292 L110 290 L24 262 Z", at: [210, 272] },
];
