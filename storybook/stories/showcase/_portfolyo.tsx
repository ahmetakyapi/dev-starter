"use client";

import { Archive, AtSign, BarChart3, CodeXml, FolderLock, Inbox, MailPlus, PenLine, Search, Users } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { AppWindow } from "@/components/ui/app-window";
import { Badge } from "@/components/ui/badge";
import { ApprovalCard } from "@/components/ui/approval-card";
import { DemoFrame } from "@/components/ui/demo-frame";
import { PhaseChecklist, type PhaseGroup } from "@/components/ui/phase-checklist";
import { StatusPicker, type Status } from "@/components/ui/status-icon";
import { ToolPolicyList, defaultToolPolicies, type PolicyGroup, type ToolPolicy } from "@/components/ui/tool-policy-list";
import { GlideLink } from "@/components/ui/glide-link";
import { Heatmap } from "@/components/ui/heatmap";
import { LikeButton } from "@/components/ui/like-button";
import { MediaLightbox, useLightbox, type LightboxItem } from "@/components/ui/media-lightbox";
import { NoteCard, NoteList, NoteMedia } from "@/components/ui/note-card";
import { ProfileIntro } from "@/components/ui/profile-intro";
import { RulerToc } from "@/components/ui/ruler-toc";
import { ScrollFocus } from "@/components/ui/scroll-focus";
import { ScrollHideBar } from "@/components/ui/scroll-hide-bar";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ShotCard } from "@/components/ui/shot-card";
import { ShotGrid, ShotGridToolbar, useShotGrid } from "@/components/ui/shot-grid";
import { Sparkline } from "@/components/ui/sparkline";
import { Switch } from "@/components/ui/switch";
import { Tabs } from "@/components/ui/tabs";
import { SCENES } from "../_lib/sahneler";

/**
 * Portfolyo: Pusula'nın tasarım liderinin kişisel sayfası (kurgu kişi).
 * Sakin Akış dilinin örnek sayfası (`knowledge/design-directions.md` →
 * `sakin-akis`): dar sütun, gri tonlar, hiyerarşi tonla, hareket işlevsel.
 * Açılış `profile-intro`, altında sekmeler: Akış (çalışmalar, `shot-grid` +
 * `shot-card` + `scroll-focus`, büyütme `media-lightbox`), Notlar
 * (`note-card`), Vakalar (doğrulanabilir sayı + katkı takvimi), Lab
 * (`demo-frame` içinde canlı bileşenler). Süzgeç çubuğu aşağı kaydırınca
 * saklanır (`scroll-hide-bar`); sol kenarda `ruler-toc`.
 *
 * Çalışma kartlarının içinde ekran görüntüsü YOK: her sahne katalog
 * bileşenleriyle çizilmiş Pusula ekranı, palet ve temayla döner.
 */

/* ── Sahneler ─────────────────────────────────────────────────────────── */

function InboxScene() {
  return (
    <AppWindow title="Pusula · Gelen Kutusu" icon={<Inbox className="size-3.5" />} className="w-full max-w-md">
      <ul className="grid gap-1 p-2.5 text-small">
        {[
          ["PS-212", "Fatura adresi güncellenmiyor", "warning", "Bekliyor"],
          ["PS-213", "Ekip daveti ulaşmadı", "success", "Çözüldü"],
          ["PS-214", "Ödeme iki kez çekildi", "danger", "Acil"],
        ].map(([id, title, tone, label]) => (
          <li key={id} className="flex items-center gap-2 rounded-md px-2 py-1.5 odd:bg-surface">
            <span className="font-mono text-micro text-soft">{id}</span>
            <span className="min-w-0 flex-1 truncate text-strong">{title}</span>
            <Badge tone={tone as "warning" | "success" | "danger"}>{label}</Badge>
          </li>
        ))}
      </ul>
    </AppWindow>
  );
}

function PulseScene() {
  return (
    <div className="grid w-full max-w-sm gap-3 rounded-xl bg-overlay p-4 shadow-raised ring-1 ring-line">
      <span className="flex items-center gap-2 text-small text-muted">
        <BarChart3 aria-hidden className="size-3.5" /> Haftalık Çözüm Süresi
      </span>
      <span className="text-title leading-none font-medium text-strong tabular-nums">
        3,4 <span className="text-small text-muted">saat</span>
      </span>
      <Sparkline values={[6.1, 5.4, 5.8, 4.9, 4.4, 3.9, 3.4]} title="Son yedi hafta çözüm süresi" width={280} height={40} className="w-full" />
    </div>
  );
}

function SettingsScene() {
  return (
    <div className="grid w-full max-w-xs gap-2 rounded-xl bg-overlay p-3 shadow-raised ring-1 ring-line">
      {["Yeni talep bildirimi", "Haftalık özet e-postası", "Mesai dışı sessiz"].map((label, i) => (
        <div key={label} className="rounded-md bg-surface px-2.5 py-1.5 text-small">
          <Switch label={label} defaultChecked={i !== 1} />
        </div>
      ))}
    </div>
  );
}

type Work = {
  id: string;
  title: string;
  description: string;
  meta: readonly string[];
  ratio: number;
  likes: number;
  tags: { project: string; kind: string };
  scene: () => ReactNode;
  fit?: number;
  tone?: "surface" | "page";
};

const WORKS: readonly Work[] = [
  ...SCENES.map((sc, i) => ({
    id: sc.id,
    title: sc.title,
    description: sc.description,
    meta: ["2026", sc.meta[1]],
    ratio: sc.ratio,
    likes: [48, 22, 15, 31][i],
    tags: { project: "pusula", kind: ["urun", "ai", "urun", "pano"][i] },
    scene: sc.render,
    fit: sc.fit,
    tone: sc.tone,
  })),
  { id: "ayarlar", title: "Bildirim Ayarları", description: "Anında etki eden anahtarlar, kaydet butonu yok.", meta: ["2025", "Ürün"], ratio: 3 / 4, likes: 9, tags: { project: "rota", kind: "urun" }, scene: SettingsScene },
  { id: "nabiz", title: "Çözüm Nabzı", description: "Ekibin haftası tek sayı ve yedi noktalık eğri.", meta: ["2025", "Pano"], ratio: 5 / 4, likes: 5, tags: { project: "rota", kind: "pano" }, scene: PulseScene },
];

const FILTERS = [
  { key: "project", label: "Proje", options: [{ value: "pusula", label: "Pusula" }, { value: "rota", label: "Rota" }] },
  { key: "kind", label: "Tür", options: [{ value: "urun", label: "Ürün" }, { value: "pano", label: "Pano" }, { value: "ai", label: "Yapay Zeka" }] },
] as const;

const LINKS = [
  { label: "@denizaydin sosyal ağda", href: "https://ornek.com/denizaydin", icon: AtSign, motion: "bounce" as const },
  { label: "Kod Deposu", href: "https://ornek.com/kod", icon: CodeXml, motion: "spin" as const },
  { label: "Yazılar", href: "#notlar", icon: PenLine, motion: "wiggle" as const },
];

/* Katkı takvimi: deterministik örnek veri (rastgele değil; her açılışta aynı). */
const CONTRIB = Array.from({ length: 26 * 7 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 4, 31) + i * 86_400_000);
  const weekday = d.getUTCDay();
  const v = weekday === 0 || weekday === 6 ? (i % 5 === 0 ? 1 : 0) : ((i * 7) % 11) % 6;
  return { date: d.toISOString().slice(0, 10), value: v };
});

/* ── Sekmeler ─────────────────────────────────────────────────────────── */

function Feed() {
  const grid = useShotGrid({ items: WORKS, filters: FILTERS, storageKey: null });
  const items: LightboxItem[] = useMemo(
    () => grid.visible.map((w) => ({ id: w.id, title: w.title, description: w.description, node: <w.scene /> })),
    [grid.visible],
  );
  const box = useLightbox(items.length);
  return (
    <div className="grid gap-6">
      <ScrollHideBar>
        <div className="rounded-full bg-overlay p-1 shadow-floating ring-1 ring-line">
          <ShotGridToolbar grid={grid} />
        </div>
      </ScrollHideBar>
      <ShotGrid
        grid={grid}
        columns={2}
        renderItem={(w, { view, index }) => {
          const Scene = w.scene;
          return (
            <ScrollFocus>
              <ShotCard
                title={w.title}
                description={w.description}
                meta={w.meta}
                ratio={view === "masonry" ? w.ratio : w.fit ? 1.41 : 16 / 10}
                fit={w.fit}
                tone={w.tone}
                titleAs="h3"
                onOpen={() => box.show(index)}
                actions={<LikeButton count={w.likes} />}
              >
                <Scene />
              </ShotCard>
            </ScrollFocus>
          );
        }}
      />
      <MediaLightbox items={items} {...box.props} />
    </div>
  );
}

const NOW = new Date("2026-11-27T10:00:00+03:00");

function Notes() {
  return (
    <NoteList label="Notlar">
      <NoteCard author={{ name: "Deniz Aydın", handle: "denizaydin" }} time="2026-11-26T22:00:00+03:00" now={NOW} likes={31} replies={2}>
        <p>Durum değişimi kayınca arayüz daha sakin hissettiriyor.</p>
        <p>Sekme, anahtar, menü, akordeon: bir şeyi hareket ettir, gerisi onu izlesin.</p>
      </NoteCard>
      <NoteCard
        author={{ name: "Deniz Aydın", handle: "denizaydin" }}
        time="2026-11-20T09:30:00+03:00"
        now={NOW}
        likes={220}
        replies={14}
        reposts={6}
        media={
          <NoteMedia label="Kenar çubuğu kayma kaydını oynat">
            <InboxScene />
          </NoteMedia>
        }
      >
        <p>Kenar çubuğu yerinde dursun, içerik üstünden kaysın. İkisi birden oynayınca göz nereye bakacağını bilemiyor.</p>
      </NoteCard>
      <NoteCard author={{ name: "Deniz Aydın", handle: "denizaydin" }} time="2026-11-12T14:10:00+03:00" now={NOW} likes={6}>
        <p>Asistan kullanıcıya &ldquo;ne yapıyorsun&rdquo; diye sormamalı; sabah ne olduğunu kendisi anlatmalı.</p>
      </NoteCard>
    </NoteList>
  );
}

function Cases() {
  return (
    <div className="grid gap-6">
      <article className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-2xl p-4 ring-1 ring-line">
        <span aria-hidden className="grid size-10 place-items-center rounded-xl bg-primary-wash text-primary-ink">
          <Inbox className="size-5" />
        </span>
        <div className="grid gap-1">
          <h3 className="text-body font-medium text-strong">Pusula Destek</h3>
          <p className="text-small text-muted">Yardım masasının ürün yüzeyini tasarlayıp kodlamak</p>
          <p className="text-micro text-soft tabular-nums">212 PR · 640 commit</p>
        </div>
      </article>
      <Heatmap data={CONTRIB} title="Son Altı Ay Katkı" end="2026-11-27" levels={[1, 3, 5]} />
    </div>
  );
}

const ONBOARDING: PhaseGroup[] = [
  {
    id: "once",
    title: "İlk Günden Önce",
    items: [
      { id: "laptop", title: "Dizüstü bilgisayarı gönder", kind: "form", state: "ready" },
      { id: "bordro", title: "Bordro ve yan haklar kaydı", kind: "flow", state: "locked", waitingOn: { label: "Dizüstü bilgisayarı gönder" } },
    ],
  },
  {
    id: "ilk-gun",
    title: "İlk Gün",
    items: [
      { id: "rehber", title: "Rehberle tanış", kind: "scheduled", state: "locked", unlocksAt: "2026-11-28" },
      { id: "kanallar", title: "Ekip kanallarına katıl", kind: "manual", state: "locked", waitingOn: { label: "Rehberle tanış" } },
    ],
  },
];

const AGENT_TOOLS: PolicyGroup[] = [
  {
    id: "read",
    label: "Okuyan Araçlar",
    kind: "read",
    tools: [
      { id: "search", name: "Talep Ara", description: "Başlık ve içerikte arar.", icon: <Search /> },
      { id: "customers", name: "Müşteri Bilgisi", description: "Geçmiş talepler ve plan.", icon: <Users /> },
    ],
  },
  {
    id: "write",
    label: "Yazan ve Silen Araçlar",
    kind: "write",
    tools: [
      { id: "reply", name: "Yanıt Gönder", description: "Müşteriye e-posta gönderir.", icon: <MailPlus /> },
      { id: "archive", name: "Arşivle", description: "Çözülen talebi arşive taşır.", icon: <Archive /> },
    ],
  },
];

function StatusLab() {
  const [status, setStatus] = useState<Status>("progress");
  return <StatusPicker value={status} onValueChange={setStatus} label="Talep durumu" />;
}

function AgentLab() {
  const [policy, setPolicy] = useState<Record<string, ToolPolicy>>(() => defaultToolPolicies(AGENT_TOOLS));
  return (
    <div className="grid w-full max-w-md gap-4">
      <ApprovalCard
        icon={<FolderLock />}
        title="Ece Doğan'a Muhasebe klasörüne erişim verilsin mi?"
        description={<p>Ece klasördeki faturaları görebilecek ve yeni dosya yükleyebilecek.</p>}
        people={[{ name: "Ece Doğan" }]}
        note={false}
      />
      <div className="rounded-2xl bg-overlay p-4 shadow-raised ring-1 ring-line">
        <ToolPolicyList groups={AGENT_TOOLS} value={policy} onValueChange={setPolicy} />
      </div>
    </div>
  );
}

function Lab() {
  const [range, setRange] = useState<"gun" | "hafta" | "ay">("gun");
  const bars = { gun: [3, 5, 4, 7, 6, 8, 5], hafta: [6, 4, 7, 5, 8, 6, 9], ay: [8, 7, 9, 6, 7, 5, 6] }[range];
  return (
    <div className="grid gap-12">
      <DemoFrame title="Yumuşak durum değişimi." description="Sekme, anahtar ve menü yeni durumuna atlamaz, kayar." href="#lab">
        <div className="grid w-56 justify-items-center gap-4 rounded-2xl bg-overlay p-4 shadow-raised ring-1 ring-line">
          <SegmentedControl
            aria-label="Dönem"
            size="sm"
            value={range}
            onValueChange={setRange}
            options={[
              { value: "gun", label: "Gün" },
              { value: "hafta", label: "Hafta" },
              { value: "ay", label: "Ay" },
            ]}
          />
          <div aria-hidden className="flex h-16 w-full items-end justify-between gap-1">
            {bars.map((h, i) => (
              <span key={i} className="w-full rounded-sm bg-surface transition-[height] duration-300 ease-(--ease-brand)" style={{ height: `${h * 10}%` }} />
            ))}
          </div>
        </div>
      </DemoFrame>
      <DemoFrame title="Sırayla açılan işler." description="Biten iş sıradakini açar, aşama bitince katlanır; tanıtımda kendiliğinden ilerler." size="lg">
        <div className="w-full max-w-md rounded-2xl bg-overlay p-3 shadow-raised ring-1 ring-line">
          <PhaseChecklist label="Ece Doğan işe başlıyor" groups={ONBOARDING} autoplay />
        </div>
      </DemoFrame>
      <DemoFrame title="Şekliyle durum." description="Renk ikinci işaret; ikon şekli durumu söyler." size="sm">
        <StatusLab />
      </DemoFrame>
      <DemoFrame title="Kararı insana bırak." description="Ajan etkili eylemden önce durur; araç başına izin politikası." size="lg">
        <AgentLab />
      </DemoFrame>
      <DemoFrame title="Hemen etki eden ayar." description="Kaydet butonu yok; anahtar değişince sonuç orada." size="sm">
        <SettingsScene />
      </DemoFrame>
    </div>
  );
}

const SECTIONS = [
  { id: "hos-geldin", label: "Hoş geldin" },
  { id: "calismalar", label: "Çalışmalar" },
];

export function PortfolyoPage() {
  return (
    <div className="min-h-dvh bg-page text-body">
      <RulerToc sections={SECTIONS} label="Bu Sayfada" />
      <main className="mx-auto grid max-w-3xl gap-16 px-5 pt-14 pb-28 sm:pt-20">
        <section id="hos-geldin" aria-label="Hoş geldin" className="mx-auto w-full max-w-[34rem]">
          <ProfileIntro
            name="Deniz Aydın"
            updated="2026-11-22"
            cta={{ label: "Görüşme Planla", href: "#gorusme" }}
            links={LINKS}
            email="deniz@ornek.com"
            avatar={<span className="grid size-full place-items-center bg-primary-wash text-title font-medium text-primary-ink">DA</span>}
          >
            <p>
              İzmir&rsquo;de doğdum, büyüdüm; şu an <GlideLink href="#pusula">Pusula</GlideLink>&rsquo;da tasarım liderliği yapıyorum.
            </p>
            <p>Ürünleri ve siteleri hem tasarlıyor hem kuruyorum: bazen sıfırdan, bazen ekip büyümeye hazır olduğunda.</p>
            <p>
              Birlikte çalıştıklarım: <GlideLink href="#kiyi">Kıyı Kahve</GlideLink>, <GlideLink href="#rota">Rota Lojistik</GlideLink>,{" "}
              <GlideLink href="#liman">Liman Fırın</GlideLink>.
            </p>
          </ProfileIntro>
        </section>
        <section id="calismalar" aria-label="Çalışmalar" className="grid gap-8">
          <Tabs
            aria-label="Bölümler"
            className="mx-auto"
            items={[
              { value: "akis", label: "Akış", panel: <Feed /> },
              { value: "notlar", label: "Notlar", panel: <div className="mx-auto max-w-[34rem]"><Notes /></div> },
              { value: "vakalar", label: "Vakalar", panel: <div className="mx-auto max-w-[34rem]"><Cases /></div> },
              { value: "lab", label: "Lab", panel: <div className="mx-auto max-w-[36rem]"><Lab /></div> },
            ]}
          />
        </section>
      </main>
    </div>
  );
}
