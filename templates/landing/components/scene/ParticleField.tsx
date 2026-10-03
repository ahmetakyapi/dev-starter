"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { CanvasTexture, Color, type Points } from "three";

/**
 * Yavaş dönen parçacık bulutu (R3F 9). Yalnızca `SceneLayer` üzerinden,
 * `dynamic(..., { ssr: false })` ile yüklenir.
 *
 * RENK TOKEN'DAN: `--primary` hesaplanmış stilden okunur ve `<html
 * data-theme>` değişince yeniden okunur; tema düğmesine basınca sahne de
 * döner, palet değişince ayrıca bir şey yazmak gerekmez.
 *
 * KONUMLAR TOHUMLU: her yüklemede aynı bulut. `Math.random()` her hidrasyonda
 * farklı bir kare verirdi ve ekran görüntüsü karşılaştırması anlamsızlaşırdı.
 *
 * GÖRÜNMEZKEN DURUR: hero ekrandan çıkınca ya da sekme arka plandayken
 * `frameloop="never"`; aşağıda okuyan birinin GPU'su boşuna çalışmaz.
 */

const COUNT = 900;
const SPREAD = 18;
const SEED = 20261003;
const SPIN = { y: 0.025, x: 0.008 } as const;

/** mulberry32: küçük, hızlı, tohumlu sözde rastgele üreteç. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Nokta dokusu: varsayılan `pointsMaterial` kare çizer. Beyaz bir daire
   alfa maskesi olarak kullanılır; rengi yine malzemenin `color`ı verir. */
const DOT_SIZE = 64;

function dotTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = DOT_SIZE;
  canvas.height = DOT_SIZE;
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = "#fff";
    context.beginPath();
    context.arc(DOT_SIZE / 2, DOT_SIZE / 2, DOT_SIZE / 2 - 1, 0, Math.PI * 2);
    context.fill();
  }
  return new CanvasTexture(canvas);
}

function readPrimary(): string {
  return getComputedStyle(document.documentElement).getPropertyValue("--primary").trim() || "currentColor";
}

function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-palette"] });
  return () => observer.disconnect();
}

function Cloud({ color }: { color: string }) {
  const ref = useRef<Points>(null);
  const positions = useMemo(() => {
    const random = seeded(SEED);
    const out = new Float32Array(COUNT * 3);
    for (let i = 0; i < out.length; i += 1) out[i] = (random() - 0.5) * SPREAD;
    return out;
  }, []);
  const tint = useMemo(() => new Color(color), [color]);
  const dot = useMemo(() => dotTexture(), []);
  useEffect(() => () => dot.dispose(), [dot]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * SPIN.y;
    ref.current.rotation.x += delta * SPIN.x;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color={tint} alphaMap={dot} alphaTest={0.01} transparent opacity={0.6} sizeAttenuation depthWrite={false} />
    </points>
  );
}

export default function ParticleField() {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const color = useSyncExternalStore(subscribeTheme, readPrimary, () => "currentColor");

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    let inView = true;
    const update = () => setVisible(inView && document.visibilityState === "visible");
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? false;
      update();
    });
    observer.observe(node);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  return (
    <div ref={host} aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
      >
        <Cloud color={color} />
      </Canvas>
    </div>
  );
}
