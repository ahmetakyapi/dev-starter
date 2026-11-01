"use client";

import { m, useMotionValueEvent, useScroll } from "motion/react";
import { useRef, useState } from "react";
import { FlowScene } from "@/components/demos/FlowScene";
import { steps } from "@/lib/content";

/*
 * Kaydırmaya bağlı yapışkan sahne. Solda adımlar normal akışta kayar, sağda
 * ürün parçası yapışkan durur ve okunan adımın durumuna geçer.
 *
 * Etkin adım `useScroll` ilerlemesinden (liste ekranın ortasından geçerken
 * 0 → 1); durum YALNIZCA eşik geçilince değişir, her karede çizim yok.
 * İlerleme çizgisi `scaleY` (dönüşüm), yerleşim değil.
 *
 * Üç düzen CSS'te seçilir (app/landing.css → "Nasıl çalışır"), çünkü sunucu
 * ekran genişliğini ve hareket tercihini bilemez; karar ilk karede doğru,
 * hidrasyondan sonra yerleşim zıplamaz:
 *  - geniş ekran + hareket serbest: yapışkan sahne, adımlar uzun aralıklı.
 *  - telefon ya da hareketi azaltan okuyucu: düz liste, her adımın altında
 *    kendi durumu durağan. Yapışkan panel hiç görünmez.
 */
export function HowItWorksStage() {
  const list = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: list, offset: ["start 60%", "end 60%"] });
  const [active, setActive] = useState(0);
  const total = steps.items.length;

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    setActive(Math.min(total - 1, Math.max(0, Math.floor(value * total))));
  });

  const current = steps.items[active];

  return (
    <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:gap-12">
      <div className="how-list relative">
        <span aria-hidden className="how-rail absolute top-0 bottom-0 left-0 w-px bg-line-strong">
          <m.span className="absolute inset-0 origin-top bg-primary" style={{ scaleY: scrollYProgress }} />
        </span>
        <ol ref={list} className="space-y-12">
          {steps.items.map((step, index) => (
            <li key={step.title} data-active={index === active} className="how-step">
              <div className="how-step-text">
                <h3 className="step-title font-semibold">{step.title}</h3>
                <p className="mt-3 max-w-md text-read text-soft lg:text-lead">{step.body}</p>
              </div>
              <div aria-hidden className="how-inline-scene">
                <FlowScene title={steps.sceneTitle} scene={step.scene} step={index} total={total} />
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div aria-hidden className="how-sticky lg:col-span-7">
        <div className="sticky top-[calc(50dvh-10rem)]">
          <FlowScene title={steps.sceneTitle} scene={current.scene} step={active} total={total} animated />
        </div>
      </div>
    </div>
  );
}
