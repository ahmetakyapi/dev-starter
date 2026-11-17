"use client";

import { useCallback, useRef } from "react";

/**
 * Dağılarak çıkış: ONAYLANMIŞ bir kaldırmada (sessize alınan bildirim,
 * arşivlenen satır, "Hepsini Temizle") öğe tanecik tanecik dağılır, sonra
 * DOM'dan çıkar. Amaç süs değil: kaldırmanın gerçekten olduğunu ve öğenin
 * nereye gittiğini (hiçbir yere) gözle söylemek; düz kaybolma "silindi mi,
 * yeniden mi yüklendi?" sorusu bırakır.
 *
 * NE ZAMAN DEĞİL: geri alınabilir gizleme (o zaman `toast` + Geri Al ile
 * normal kaybolma yeter), sayfa geçişi, sıradan liste süzme. Ekranda aynı
 * anda birden fazla öğeyi dağıtma ("Hepsini Temizle" bile satır satır,
 * aralıklı).
 *
 * NASIL: kaynak (dissolve.rselmi.com, 2026-11) her bileşeni kanvasa elle
 * yeniden çiziyordu; bu genellenemez. Burada GERÇEK öğeye bir SVG filtresi
 * uygulanır: `feTurbulence` gürültüsü alfa maskesine çevrilir ve eşik
 * (`feFuncA` kesişimi) zamanla kayar; gürültüde açık pikseller önce gider,
 * öğe kumlu biçimde erir. Yanında hafif yukarı kayma ve sonda solma. Her
 * çağrı kendi filtresini kurar ve bitince siler (aynı anda iki öğe olabilir).
 * Kod alınmadı, yöntem bizim.
 *
 * Hareketi azaltan kullanıcıda filtre yok: 150 ms solma. Filtreyi
 * desteklemeyen tarayıcıda da (eski Safari) sonuç aynıdır: öğe solar.
 * Erişilebilirlik: görsel bir eşlik; kaldırma sonucunu çağıran canlı
 * bölgede / bildirimde söyler, odağı sıradaki öğeye taşır.
 *
 * Örnek:
 *   const [ref, dissolve] = useDissolve<HTMLLIElement>();
 *   <li ref={ref}>…</li>
 *   await dissolve(); remove(item.id);
 *   // ya da elde öğe varsa: await dissolveOut(element)
 */

const SVG_NS = "http://www.w3.org/2000/svg";
let counter = 0;

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Öğeyi dağıtır; bittiğinde çözülür. Öğe görünmez kalır, DOM'dan çıkarmak çağıranın işi. */
export function dissolveOut(el: HTMLElement, { duration = 720 }: { duration?: number } = {}): Promise<void> {
  if (reduced()) {
    return el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, fill: "forwards" }).finished.then(() => undefined);
  }
  const id = `ui-dissolve-${++counter}`;
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.position = "absolute";
  // Gürültü sıklığı öğe boyuyla ölçeklenir: küçük öğede tane çok ince görünmesin.
  const freq = Math.min(0.9, Math.max(0.35, 140 / Math.max(el.offsetWidth, 1)));
  svg.innerHTML = `<filter id="${id}" x="-10%" y="-20%" width="120%" height="140%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="${counter % 97}" result="noise"/>
    <feColorMatrix in="noise" type="luminanceToAlpha" result="lum"/>
    <feComponentTransfer in="lum" result="mask"><feFuncA type="linear" slope="16" intercept="1"/></feComponentTransfer>
    <feComposite in="SourceGraphic" in2="mask" operator="in"/>
  </filter>`;
  document.body.appendChild(svg);
  const funcA = svg.querySelector("feFuncA")!;
  const prevFilter = el.style.filter;
  el.style.filter = `url(#${id})`;
  el.style.willChange = "filter, transform";

  return new Promise((resolve) => {
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const e = t * t; // içe doğru hızlanır: başta tutar, sonra hızla dağılır
      // Kesişim +1'den (hepsi görünür) -16'ya (hepsi gitti) kayar.
      funcA.setAttribute("intercept", String(1 - e * 17));
      el.style.transform = `translateY(${-6 * e}px)`;
      el.style.opacity = String(t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1);
      if (t < 1) requestAnimationFrame(step);
      else {
        el.style.filter = prevFilter;
        el.style.willChange = "";
        el.style.opacity = "0";
        svg.remove();
        resolve();
      }
    };
    requestAnimationFrame(step);
  });
}

/** Ref + dağıtma çağrısı. Ref bağlı değilse anında çözülür (kaldırma yine olur). */
export function useDissolve<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const run = useCallback((options?: { duration?: number }) => (ref.current ? dissolveOut(ref.current, options) : Promise.resolve()), []);
  return [ref, run] as const;
}
