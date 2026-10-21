"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { useMotionPreference } from "@/hooks/useMotionPreference";

/**
 * Hero'nun parçacık sahnesi için kapı. Sahne (three + R3F, ~230 KB) yalnızca
 * gerçekten oynayacaksa indirilir:
 *
 *  - hareket serbest (`prefers-reduced-motion` yok),
 *  - hassas işaretçi VE en az 768 piksel genişlik,
 *  - tarayıcı boşa çıkınca: paketin değerlendirilmesi masaüstünde bile uzun
 *    bir görev; hidrasyondan hemen sonraki ilk tıklamanın (hero düğmesi, tema)
 *    önüne düşmesin. Süs katmanı birkaç yüz milisaniye geç gelse kayıp yok.
 *
 * Telefonda ve hareketi azaltanda paket hiç inmez; altta duran `.hero-glow`
 * CSS ışıması tek görünen olur. Sunucu çiziminde de o var: sahne gelince
 * üstüne biner, gelmezse sayfa eksik görünmez.
 *
 * `ssr: false` bir istemci bileşeninin içinde olmak zorunda (Next 16), bu
 * yüzden kapı da istemcide.
 */
const ParticleField = dynamic(() => import("./ParticleField"), { ssr: false, loading: () => null });

const QUERY = "(pointer: fine) and (min-width: 768px)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/*
 * Süs katmanı KAPALI kapanır: WebGL bağlamı açılamazsa (donanım hızlandırma
 * kapalı, kara listedeki GPU, Lockdown Mode, uzak masaüstü) three kurucuda
 * fırlatır, R3F hatayı çizimde yeniden atar; sınır yoksa `app/error.tsx`
 * bütün sayfayı değiştirir ve "Tekrar Dene" aynı hatayı üretir. Eski
 * dağıtımın parçası inmezse (ChunkLoadError) de aynı yol. Burada yalnızca
 * sahne düşer, `.hero-glow` kalır.
 */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/* Safari'de `requestIdleCallback` yok; orada sabit bir gecikme. */
function useIdle(): boolean {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setIdle(true), { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => setIdle(true), 1500);
    return () => window.clearTimeout(id);
  }, []);
  return idle;
}

export function SceneLayer() {
  const capable = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
  const reduce = useMotionPreference();
  const idle = useIdle();
  if (!capable || reduce || !idle) return null;
  return (
    <SceneBoundary>
      <ParticleField />
    </SceneBoundary>
  );
}
