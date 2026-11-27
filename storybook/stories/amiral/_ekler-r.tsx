"use client";

import { Archive, AtSign, Coffee, MailPlus, PackageCheck, PenLine, Search } from "lucide-react";
import { useState } from "react";
import { ApprovalCard, ApprovalStrip } from "@/components/ui/approval-card";
import { DemoFrame } from "@/components/ui/demo-frame";
import { PhaseChecklist } from "@/components/ui/phase-checklist";
import { StatusIcon, StatusPicker, STATUSES, STATUS_LABEL, type Status } from "@/components/ui/status-icon";
import { ToolPolicyList, defaultToolPolicies, type PolicyGroup, type ToolPolicy } from "@/components/ui/tool-policy-list";
import { GlideLink } from "@/components/ui/glide-link";
import { LikeButton } from "@/components/ui/like-button";
import { MediaLightbox, useLightbox } from "@/components/ui/media-lightbox";
import { NoteCard } from "@/components/ui/note-card";
import { ProfileIntro } from "@/components/ui/profile-intro";
import { RulerToc } from "@/components/ui/ruler-toc";
import { ScrollFocus } from "@/components/ui/scroll-focus";
import { ScrollHideBar } from "@/components/ui/scroll-hide-bar";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ShotCard } from "@/components/ui/shot-card";
import { ShotGrid, ShotGridToolbar, useShotGrid } from "@/components/ui/shot-grid";
import { BRAND, CAFES } from "./_data";
import { Cell } from "./_ui";

/**
 * Sakin Akış turunun kuyuları (27 Kasım 2026): kişisel/ekip sayfası dili.
 * Kıyı Kahve kurgusu; tasarımcısı Ece Doğan (kurgu kişi). Sahneler
 * katalog bileşenleriyle çizilmiş küçük ekranlar, ekran görüntüsü yok.
 */

function CafeScene({ index = 0 }: { index?: number }) {
  const cafe = CAFES[index % CAFES.length];
  return (
    <div className="grid w-full max-w-[15rem] gap-1.5 rounded-xl bg-overlay p-3 shadow-raised ring-1 ring-line">
      <span className="flex items-center gap-2 text-small text-muted">
        <Coffee aria-hidden className="size-3.5" /> {BRAND.name}
      </span>
      <span className="truncate text-body font-medium text-strong">{cafe.label}</span>
      <span className="h-1.5 w-2/3 rounded-full bg-surface" />
      <span className="h-1.5 w-1/2 rounded-full bg-surface" />
    </div>
  );
}

const SHOTS = [
  { id: "s1", title: "Şube Kartı", ratio: 16 / 10, tags: { kind: "urun" } },
  { id: "s2", title: "Kavrum Notu", ratio: 1, tags: { kind: "icerik" } },
  { id: "s3", title: "Sipariş Özeti", ratio: 4 / 3, tags: { kind: "urun" } },
  { id: "s4", title: "Menü Kartı", ratio: 3 / 4, tags: { kind: "icerik" } },
];

function GridWell() {
  const grid = useShotGrid({
    items: SHOTS,
    filters: [{ key: "kind", label: "Tür", options: [{ value: "urun", label: "Ürün" }, { value: "icerik", label: "İçerik" }] }],
    defaultView: "masonry",
    storageKey: null,
  });
  return (
    <div className="grid w-full gap-3">
      <div className="flex justify-center">
        <div className="rounded-full bg-overlay p-1 ring-1 ring-line">
          <ShotGridToolbar grid={grid} />
        </div>
      </div>
      <ShotGrid
        grid={grid}
        columns={2}
        renderItem={(s, { view, index }) => (
          <ShotCard title={s.title} ratio={view === "masonry" ? s.ratio : 16 / 10} titleAs="h4">
            <CafeScene index={index} />
          </ShotCard>
        )}
      />
    </div>
  );
}

function LightboxWell() {
  const items = SHOTS.slice(0, 3).map((s, i) => ({ id: s.id, title: s.title, description: `${BRAND.name} · ${CAFES[i].label}`, node: <CafeScene index={i} /> }));
  const box = useLightbox(items.length);
  return (
    <>
      <div className="flex gap-2">
        {items.map((it, i) => (
          <button
            key={it.id}
            type="button"
            onClick={() => box.show(i)}
            className="rounded-xl bg-overlay px-3 py-2 text-small text-strong shadow-raised ring-1 ring-line"
          >
            {it.title}
          </button>
        ))}
      </div>
      <MediaLightbox items={items} {...box.props} />
    </>
  );
}

function HideBarWell() {
  const [view, setView] = useState<"akis" | "izgara">("akis");
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  return (
    <div ref={setBox} className="relative h-56 w-full overflow-y-auto rounded-xl bg-page ring-1 ring-line">
      <div className="grid gap-2 p-3 pb-16">
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i} className="h-8 rounded-md bg-surface" />
        ))}
      </div>
      <ScrollHideBar position="absolute" scrollContainer={box} className="sticky">
        <div className="rounded-full bg-overlay p-1 shadow-floating ring-1 ring-line">
          <SegmentedControl
            aria-label="Görünüm"
            size="sm"
            value={view}
            onValueChange={setView}
            options={[
              { value: "akis", label: "Akış" },
              { value: "izgara", label: "Izgara" },
            ]}
          />
        </div>
      </ScrollHideBar>
    </div>
  );
}

/* ── Tanıtım ──────────────────────────────────────────────────────────── */
export function TanitimR() {
  return (
    <>
      <Cell file="profile-intro" name="Profil Açılışı" note="Avatar, ad, tazelik satırı, koyu hap eylem, anlamına göre oynayan ikonlar." span={3} size="lg" align="start">
        <ProfileIntro
          name="Ece Doğan"
          titleAs="h2"
          updated="2026-11-22"
          cta={{ label: "Görüşme Planla", href: "#gorusme" }}
          links={[
            { label: "Sosyal Ağ", href: "https://ornek.com/ece", icon: AtSign, motion: "bounce" },
            { label: "Yazılar", href: "#yazilar", icon: PenLine, motion: "wiggle" },
          ]}
          email="ece@ornek.com"
        >
          <p>{BRAND.city}&rsquo;de {BRAND.name}&rsquo;nin ürün ve marka tasarımını yapıyorum.</p>
        </ProfileIntro>
      </Cell>
      <Cell file="glide-link" name="Kayan Alt Çizgi" note="Logo duvarı yerine düz metin müşteri listesi; çizgi soldan süpürülür." span={3} align="start">
        <p className="max-w-sm text-body text-strong">
          Birlikte çalıştıklarım: <GlideLink href="#a">{CAFES[0].label}</GlideLink>, <GlideLink href="#b">{CAFES[1].label}</GlideLink>,{" "}
          <GlideLink href="#c">{CAFES[2].label}</GlideLink>.
        </p>
      </Cell>
      <Cell file="shot-card" name="Çalışma Kartı" note="Gri kuyuda sahne ya da sessiz video; künye altta, eylem yuvası." span={2} align="stretch">
        <ShotCard title="Şube Kartı" description="Şubenin günü tek kartta." meta={["2026", "Ürün"]} titleAs="h4" actions={<LikeButton count={24} />}>
          <CafeScene />
        </ShotCard>
      </Cell>
      <Cell file="scroll-focus" name="Kaydırınca Netleşme" note="Kart görünüme yükselirken buğudan netleşir; desteksiz tarayıcıda düz." span={2} align="stretch">
        <ScrollFocus>
          <ShotCard title="Kavrum Notu" titleAs="h4">
            <CafeScene index={1} />
          </ShotCard>
        </ScrollFocus>
      </Cell>
      <Cell file="like-button" name="Beğeni" note="Kalp pop, yuvarlanan sayaç, iyimser güncelleme." span={2}>
        <LikeButton count={219} />
      </Cell>
      <Cell file="shot-grid" name="Çalışma Izgarası" note="Akış ↔ Masonry, süzgeç, karıştır; sayfa yerinde kalır." span={4} size="lg" align="stretch">
        <GridWell />
      </Cell>
      <Cell file="media-lightbox" name="Medya Büyütme" note="Yerel dialog; önceki/sonraki, ← →, Esc; kart yükselerek açılır." span={2}>
        <LightboxWell />
      </Cell>
      <Cell file="note-card" name="Not Kartı" note="Kısa not: yazar, göreli zaman, metin, eylem satırı." span={3} align="stretch">
        <NoteCard author={{ name: "Ece Doğan", handle: "ecedogan" }} time="2026-11-26T09:00:00+03:00" now={new Date("2026-11-27T09:00:00+03:00")} likes={12} replies={1}>
          <p>Menü kartında fiyatı en sona aldık; okuma sırası kahveden başlıyor.</p>
        </NoteCard>
      </Cell>
      <Cell file="demo-frame" name="Lab Çerçevesi" note="Noktalı sahnede canlı bileşen, altında kalın + soluk künye." span={3} align="stretch">
        <DemoFrame title="Yumuşak geçiş." description="Seçim kayarak yer değiştirir." size="sm">
          <LikeButton count={8} />
        </DemoFrame>
      </Cell>
      <Cell file="scroll-hide-bar" name="Saklanan Çubuk" note="Aşağı kaydırınca çekilir, yukarı kaydırınca döner; odaktayken kalır." span={3} align="stretch">
        <HideBarWell />
      </Cell>
      <Cell file="ruler-toc" name="Cetvel İçindekiler" note="Çizgiler imleç altında çan eğrisiyle uzar; okunan bölüm uzun." span={3}>
        <RulerToc
          placement="inline"
          label="Kuyudaki Bölümler"
          sections={[
            { id: "b-profile-intro", label: "Profil Açılışı" },
            { id: "b-shot-card", label: "Çalışma Kartı" },
            { id: "b-shot-grid", label: "Çalışma Izgarası" },
            { id: "b-note-card", label: "Not Kartı" },
          ]}
        />
      </Cell>
    </>
  );
}

/* ── Veri: durum dili ve aşamalı işler ───────────────────────────────── */
function StatusWell() {
  const [status, setStatus] = useState<Status>("todo");
  return (
    <div className="grid justify-items-center gap-4">
      <ul className="flex flex-wrap justify-center gap-3 text-small text-muted">
        {STATUSES.map((s) => (
          <li key={s} className="flex items-center gap-1.5">
            <StatusIcon status={s} /> {STATUS_LABEL[s]}
          </li>
        ))}
      </ul>
      <StatusPicker value={status} onValueChange={setStatus} label="Sipariş durumu" />
    </div>
  );
}

export function VeriR() {
  return (
    <>
      <Cell file="status-icon" name="Durum İkonu" note="Şekil durumu söyler, renk ikinci işaret; gri hap seçici." span={3}>
        <StatusWell />
      </Cell>
      <Cell file="phase-checklist" name="Aşamalı Kontrol Listesi" note="Biten iş sıradakini açar; aşama bitince katlanır." span={3} size="lg" align="stretch">
        <PhaseChecklist
          label={`${BRAND.name} yeni şube açılışı`}
          groups={[
            {
              id: "hazirlik",
              title: "Hazırlık",
              items: [
                { id: "makine", title: "Espresso makinesini kur", kind: "manual", state: "ready" },
                { id: "stok", title: "İlk stok siparişi", kind: "form", state: "locked", waitingOn: { label: "Espresso makinesini kur" } },
              ],
            },
            {
              id: "acilis",
              title: "Açılış",
              items: [{ id: "tadim", title: "Açılış tadımı", kind: "scheduled", state: "locked", unlocksAt: "2026-12-05" }],
            },
          ]}
        />
      </Cell>
    </>
  );
}

/* ── Ajan: insan onayı ve araç politikası ─────────────────────────────── */
const TOOLS: PolicyGroup[] = [
  { id: "read", label: "Okuyan Araçlar", kind: "read", tools: [{ id: "search", name: "Sipariş Ara", description: "Şube siparişlerinde arar.", icon: <Search /> }] },
  {
    id: "write",
    label: "Yazan ve Silen Araçlar",
    kind: "write",
    tools: [
      { id: "mail", name: "Şubeye Yaz", description: "Şube sorumlusuna e-posta gönderir.", icon: <MailPlus /> },
      { id: "archive", name: "Siparişi Kapat", description: "Teslim edilen siparişi arşivler.", icon: <Archive /> },
    ],
  },
];

function PolicyWell() {
  const [value, setValue] = useState<Record<string, ToolPolicy>>(() => defaultToolPolicies(TOOLS));
  return <ToolPolicyList groups={TOOLS} value={value} onValueChange={setValue} />;
}

export function AjanR() {
  return (
    <>
      <Cell file="approval-card" name="Onay Kartı" note="Ajan etkili eylemden önce durur; karar insanda, denetim günlüğünde." span={3} size="lg" align="stretch">
        <div className="grid gap-3">
          <ApprovalCard
            icon={<PackageCheck />}
            title={`${CAFES[0].label} şubesine 24 kg iade onaylansın mı?`}
            description={<p>Tutar şubenin bakiyesine eklenecek; kargo firmasına iade kaydı açılacak.</p>}
            people={[{ name: "Selin Başaran" }]}
            note={false}
          />
          <ApprovalStrip person={{ name: "Kerem Arıkan" }} />
        </div>
      </Cell>
      <Cell file="tool-policy-list" name="Araç Politikası" note="Araç başına İzin Ver, Sor, Otomatik; yazan araçta uyarı." span={3} align="stretch">
        <PolicyWell />
      </Cell>
    </>
  );
}
