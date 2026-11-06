"use client";

import { ArrowRight, Bell, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AnimatedIcon } from "@/components/ui/animated-icon";
import { BookCover } from "@/components/ui/book-cover";
import { BorderBeam } from "@/components/ui/border-beam";
import { Dial } from "@/components/ui/dial";
import { ExpandableCard } from "@/components/ui/expandable-card";
import { HalftoneImage } from "@/components/ui/halftone-image";
import { MarkAnnotate } from "@/components/ui/mark-annotate";
import { MorphIcon } from "@/components/ui/morph-icon";
import { PatternBackground } from "@/components/ui/pattern-bg";
import { PixelLoader } from "@/components/ui/pixel-loader";
import { Reasoning } from "@/components/ui/reasoning";
import { ScrambleText } from "@/components/ui/scramble-text";
import { SlotText } from "@/components/ui/slot-text";
import { StreamText } from "@/components/ui/stream-text";
import { Terminal } from "@/components/ui/terminal";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { ThinkingOrb } from "@/components/ui/thinking-orb";
import { ToolCall } from "@/components/ui/tool-call";
import { Cell, CellGrid } from "./_ui";

/* Hareket ve Doku + Yapay Zekâ grupları (secki.dev turu, 2026-11-06). Her
   kuyu kendi bileşeninin gerçek kullanımı; kahve dükkânı verisi diğer
   gruplarla ortak dilde. */

const BEANS = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
<defs>
<radialGradient id="bg" cx="0.75" cy="0.15" r="1"><stop offset="0" stop-color="white"/><stop offset="1" stop-color="dimgray"/></radialGradient>
<radialGradient id="s" cx="0.34" cy="0.3" r="0.75"><stop offset="0" stop-color="white"/><stop offset="0.45" stop-color="silver"/><stop offset="1" stop-color="black"/></radialGradient>
<radialGradient id="s2" cx="0.3" cy="0.28" r="0.8"><stop offset="0" stop-color="white"/><stop offset="1" stop-color="black"/></radialGradient>
<filter id="b"><feGaussianBlur stdDeviation="14"/></filter>
</defs>
<rect width="640" height="480" fill="url(#bg)"/>
<ellipse cx="300" cy="420" rx="190" ry="34" fill="black" opacity="0.55" filter="url(#b)"/>
<circle cx="290" cy="250" r="165" fill="url(#s)"/>
<ellipse cx="515" cy="410" rx="70" ry="14" fill="black" opacity="0.5" filter="url(#b)"/>
<circle cx="510" cy="355" r="58" fill="url(#s2)"/>
</svg>`)}`;

function StatusSlot() {
  const states = ["Kavruluyor", "Dinleniyor", "Paketlendi"] as const;
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setI((n) => (n + 1) % states.length), 2000);
    return () => window.clearInterval(id);
  }, [states.length]);
  return (
    <p className="text-center text-title font-semibold text-strong">
      Parti 214: <SlotText text={states[i]} className="text-primary-ink" />
    </p>
  );
}

function MenuToggle() {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      aria-label={open ? "Menüyü Kapat" : "Menüyü Aç"}
      aria-expanded={open}
      className="grid size-12 place-items-center rounded-xl bg-overlay text-strong shadow-raised"
    >
      <MorphIcon icon={open ? "close" : "menu"} size={22} />
    </button>
  );
}

export function HareketGroup() {
  return (
    <CellGrid>
      <Cell file="border-beam" name="Işık Kenarı" note="Çalışan kartın çerçevesinde dolaşan ışık; iş bitince söner." span={2}>
        <BorderBeam className="rounded-xl bg-overlay p-4 shadow-raised">
          <p className="text-micro text-muted">İçe aktarma</p>
          <TextShimmer className="mt-1 text-small">Ekim siparişleri okunuyor…</TextShimmer>
        </BorderBeam>
      </Cell>
      <Cell file="slot-text" name="Kayan Metin" note="Değişen harf yuvarlanır, değişmeyen yerinde kalır." span={2}>
        <StatusSlot />
      </Cell>
      <Cell file="scramble-text" name="Çözülen Metin" note="Kısa display metninde bir kez; eşit enli yazıyla kımıldamaz." span={2}>
        <p className="text-center">
          <ScrambleText text="TERAZİ BAĞLANDI" className="font-mono text-title font-semibold text-strong" />
        </p>
      </Cell>
      <Cell file="animated-icon" name="Canlı İkon" note="Üzerine gelince ikon anlamına uygun hareket eder." span={2}>
        <div className="flex flex-wrap justify-center gap-2">
          <Button size="sm" className="group">
            Siparişe Geç <AnimatedIcon icon={ArrowRight} motion="nudge" size={16} />
          </Button>
          <Button size="sm" variant="secondary" className="group">
            <AnimatedIcon icon={Bell} motion="ring" size={16} /> Hatırlat
          </Button>
          <Button size="sm" variant="secondary" className="group">
            <AnimatedIcon icon={RefreshCw} motion="spin" size={16} /> Yenile
          </Button>
        </div>
      </Cell>
      <Cell file="morph-icon" name="Biçim Değiştiren İkon" note="Aynı düğmenin iki hali arasında çizgiler yeniden dizilir." span={2}>
        <div className="grid justify-items-center">
          <MenuToggle />
        </div>
      </Cell>
      <Cell file="pixel-loader" name="Piksel Yükleyici" note="Nokta matrisinde sarmal; kart düzeyinde bekleme." span={2}>
        <div className="grid justify-items-center gap-3">
          <PixelLoader pattern="spiral" grid={5} dot={6} glow label="Etiket basılıyor" />
          <span className="text-small text-muted">Etiket basılıyor</span>
        </div>
      </Cell>
      <Cell file="terminal" name="Terminal" note="Kurulum akışı harf harf yazılır; bitince yeniden oynatılır." span={3} align="stretch">
        <Terminal
          title="~/kahve-dukkani"
          lines={[
            { kind: "command", text: "npm run seed -- --sube kadikoy" },
            { kind: "output", text: "38 ürün, 214 sipariş, 12 abone eklendi" },
            { kind: "output", text: "✓ Tohum verisi hazır", tone: "success" },
          ]}
        />
      </Cell>
      <Cell file="dial" name="Döner Düğme" note="270° kadran; sürükle, oklar ya da odaktayken tekerlek." span={3}>
        <div className="flex flex-wrap justify-center gap-6">
          <Dial label="Öğütme" min={1} max={40} defaultValue={18} size={116} />
          <Dial label="Su" min={85} max={96} defaultValue={93} unit="°C" size={116} />
        </div>
      </Cell>
      <Cell file="book-cover" name="Kitap Kapağı" note="Rehber ve e-kitap; üzerine gelince okura döner." span={2} size="lg">
        <div className="flex justify-center gap-6">
          <BookCover title="Demleme Rehberi" subtitle="V60, Chemex, moka" author="Kıyı Kavurma" mark="01" width={132} />
          <BookCover tone="ink" title="Toptan Katalog" subtitle="Kasım 2026" author="Kıyı Kavurma" mark="02" width={132} />
        </div>
      </Cell>
      <Cell file="pattern-bg" name="Desen Zemin" note="Token renginde desen, solma ve ışık; paletle döner." span={2} size="lg" className="relative isolate overflow-hidden">
        <PatternBackground pattern="grid" fade="center" glow="horizon-bottom" size={22} intensity={0.5} />
        <p className="text-center text-title font-semibold text-strong">Yeni sezon çekirdekleri</p>
      </Cell>
      <Cell file="halftone-image" name="Yarım Ton Görsel" note="Fotoğraf markanın tek rengine iner; imleç çevresi koyulaşır." span={2} size="lg" className="p-0">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl">
          <HalftoneImage src={BEANS} alt="Işık alan iki küre" cell={7} className="text-primary" />
        </div>
      </Cell>
      <Cell file="mark-annotate" name="Elle İşaretleme" note="Kalemle çizilmiş vurgu; sayfada en çok iki-üç tane." span={3}>
        <p className="text-center text-title leading-snug font-semibold text-strong">
          Siparişler <MarkAnnotate type="underline">saat 14:00'e</MarkAnnotate> kadar{" "}
          <MarkAnnotate type="circle" delay={400}>
            aynı gün
          </MarkAnnotate>{" "}
          kargoda.
        </p>
      </Cell>
      <Cell file="expandable-card" name="Genişleyen Kart" note="Kart yerinden pencereye büyür; görsel ve başlık akar." span={3}>
        <div className="mx-auto grid max-w-sm grid-cols-2 gap-3">
          <ExpandableCard
            title="Kıyı Harmanı"
            summary="1 kg · 640 ₺"
            media={
              <span className="relative isolate block size-full">
                <PatternBackground pattern="dots" glow="corner" size={12} tone="primary" intensity={0.55} />
              </span>
            }
          >
            Brezilya Cerrado ve Etiyopya Sidamo. Fındık, sütlü çikolata, hafif portakal kabuğu. Kavrumdan sonra 5-21 gün arası en iyi dönemi.
          </ExpandableCard>
          <ExpandableCard
            title="Yirgacheffe"
            summary="250 g · 420 ₺"
            media={
              <span className="relative isolate block size-full">
                <PatternBackground pattern="rings" glow="bloom" size={14} tone="primary" intensity={0.45} />
              </span>
            }
          >
            Yıkanmış işlem, 1.900-2.200 m. Bergamot, yasemin, limon. V60 için 94 °C su, üç dakikada bitir.
          </ExpandableCard>
        </div>
      </Cell>
    </CellGrid>
  );
}

const THOUGHT =
  "Ekimde 1 kg paketlerin payı arttı; kasımda abonelik yenilemeleri 12'sinde toplanıyor. Kavurmayı 10'una çekersek paketler dinlenmiş gider.";

export function AjanGroup() {
  return (
    <CellGrid>
      <Cell file="thinking-orb" name="Düşünme Küresi" note="Bekliyor, düşünüyor, konuşuyor; renk paletle döner." span={2}>
        <div className="flex items-center justify-center gap-5">
          <ThinkingOrb state="idle" size={44} />
          <ThinkingOrb state="thinking" size={88} label="Asistan düşünüyor" />
          <ThinkingOrb state="speaking" level={0.5} size={44} />
        </div>
      </Cell>
      <Cell file="tool-call" name="Araç Çağrısı" note="Ne yaptı, durumu, süresi; açınca girdi ve çıktı." span={4} align="stretch">
        <div className="grid gap-2">
          <ToolCall name="roast.schedule" label="Kavurma Takvimi" status="running" input={{ ay: "2026-11" }} />
          <ToolCall
            name="orders.forecast"
            label="Abonelik Tahmini"
            status="success"
            durationMs={1260}
            input={{ ay: "2026-11" }}
            output={{ yenileme: 214, tepe_gün: "12 Kasım" }}
          />
        </div>
      </Cell>
      <Cell file="reasoning" name="Düşünce Bloğu" note="Akarken açık, bitince “6 sn düşündü” satırına iner." span={3} align="stretch">
        <Reasoning streaming={false} durationSec={6}>
          {THOUGHT}
        </Reasoning>
      </Cell>
      <Cell file="stream-text" name="Akan Metin" note="Yalnız yeni gelen sözcük belirir; önceki metin kıpırdamaz." span={3} align="stretch">
        <StreamText text="Kavurmayı 10 Kasım'a çekmeyi öneririm: 214 yenilemenin çoğu 12'sinde, paketler iki gün dinlenmiş gider." className="text-base text-strong" />
      </Cell>
    </CellGrid>
  );
}
