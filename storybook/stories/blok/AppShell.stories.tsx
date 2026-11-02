import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import Link from "next/link";
import { AppShell } from "@/components/ui/app-shell";
import { Stat, StatGrid } from "@/components/ui/stat";
import { Cell, Gallery } from "../_lib/Frame";
import { BRAND, ContentBar, NAV, ROUTES, ShellCommands, SignOutButton, USER } from "./_shared";

const ACTIVITY = [
  { who: "Planlama Ajanı", what: "Destek talepleri özetini bitirdi", when: "12 dk önce" },
  { who: "Mert Aksoy", what: "Fatura iadesi talebini sana atadı", when: "40 dk önce" },
  { who: "Rapor Ajanı", what: "Ekim memnuniyet raporunu paylaşıma hazırladı", when: "2 sa önce" },
  { who: "Zeynep Kaya", what: "Kargo gecikmesi şablonunu güncelledi", when: "Dün 17:05" },
];

function PanoContent({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-h-full flex-col">
      <ContentBar title="Pano" meta="Pazartesi, 2 Kasım" />
      <div className="grid gap-8 p-4 sm:p-6">
        <StatGrid>
          <Stat label="Açık Talep" value="148" change={-6.2} changeLabel="Geçen Haftaya Göre" positiveIsGood={false} />
          <Stat label="İlk Yanıt Süresi" value="18" unit="dk" change={-12.4} changeLabel="Geçen Haftaya Göre" positiveIsGood={false} />
          {compact ? null : <Stat label="Memnuniyet" value="4,6" unit="/ 5" change={2.1} changeLabel="Geçen Aya Göre" />}
          {compact ? null : <Stat label="Ajan Çözümü" value="%37" change={8.5} changeLabel="Geçen Aya Göre" />}
        </StatGrid>
        <section aria-labelledby="pano-son" className="grid gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="pano-son" className="text-small font-semibold text-muted">
              Son Etkinlik
            </h2>
            <Link href={ROUTES.raporlar} className="text-small font-medium text-primary-ink underline-offset-4 hover:underline">
              Bütün Etkinlik
            </Link>
          </div>
          <ul className="divide-y divide-line-soft rounded-xl bg-surface px-4">
            {ACTIVITY.slice(0, compact ? 2 : 4).map((item) => (
              <li key={item.what} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 py-3 text-base">
                <span className="font-medium text-strong">{item.who}</span>
                <span className="text-body">{item.what}</span>
                <span className="ml-auto text-small text-muted">{item.when}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

const meta = {
  title: "Bloklar/Uygulama Kabuğu",
  id: "blocks-app-shell",
  component: AppShell,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Oturum açılmış her ekranın iskeleti: gri kuyuda kenar çubuğu, içerik beyaz karoda. Masaüstünde ⌘B ya da düğmeyle ikon sütununa daralır; telefonda (< lg) üst çubuk ve alttan açılan çekmece. Tanıtım sayfası için değil; orada üst gezinme çubuğu kullan.",
      },
    },
  },
  args: {
    brand: BRAND,
    groups: NAV,
    current: ROUTES.pano,
    user: USER,
    userAction: <SignOutButton />,
    defaultCollapsed: false,
    searchLabel: "Ara",
    contentAs: "main",
    children: <PanoContent />,
  },
  argTypes: {
    brand: { control: false },
    groups: { control: false },
    userAction: { control: false },
    children: { control: false },
    current: { control: "select", options: Object.values(ROUTES) },
  },
  decorators: [
    (Story) => (
      <>
        <Story />
        <ShellCommands />
      </>
    ),
  ],
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Masaüstü düğmesi telefonda gizli: yalnızca görünürse tıklanır. */
function visible(el: Element | null): el is HTMLElement {
  return !!el && (el as HTMLElement).offsetParent !== null;
}

export const Open: Story = {
  name: "Açık",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const current = canvas.queryAllByRole("link", { name: "Pano" }).find(visible);
    if (current) await expect(current).toHaveAttribute("aria-current", "page");
  },
};

export const Collapsed: Story = {
  name: "Daraltılmış",
  args: { defaultCollapsed: true },
  play: async ({ canvasElement }) => {
    const toggle = canvasElement.querySelector("aside button[aria-expanded]");
    if (!visible(toggle)) return;
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    // ⌘B iki kez: önce açılır, sonra yeniden daralır (hikâye daraltılmış kalır).
    await userEvent.keyboard("{Control>}b{/Control}");
    await waitFor(() => expect(toggle).toHaveAttribute("aria-expanded", "true"));
    await userEvent.keyboard("{Control>}b{/Control}");
    await waitFor(() => expect(toggle).toHaveAttribute("aria-expanded", "false"));
  },
};

export const MobileMenuOpen: Story = {
  name: "Telefonda Menü Açık",
  parameters: {
    docs: { description: { story: "Telefonda menü düğmesi gezinmeyi alttan açılan çekmecede açar. Masaüstü genişliğinde kenar çubuğu zaten görünür." } },
  },
  play: async ({ canvasElement }) => {
    const opener = canvasElement.querySelector('button[aria-label="Gezinmeyi Aç"]');
    if (!visible(opener)) return;
    await userEvent.click(opener);
    const sheet = await within(canvasElement).findByRole("dialog");
    await expect(within(sheet).getByRole("link", { name: /Gelen Kutusu/ })).toBeVisible();
  },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: {
    layout: "padded",
    docs: { description: { story: "İkinci kabuk yalnız görüntü (`inert`): bir sayfada iki kabuk yer işaretlerini yineler. Etkileşimli daraltma Daraltılmış hikâyesinde." } },
  },
  render: (args) => (
    <Gallery cols={2}>
      <Cell label="Açık · Pano etkin" className="block p-2">
        <AppShell {...args} contentAs="div" className="h-[30rem] min-h-0 rounded-xl">
          <PanoContent compact />
        </AppShell>
      </Cell>
      <Cell label="Daraltılmış · Gelen Kutusu etkin" className="block p-2">
        {/* Sayfada iki kabuk olunca "Kenar Çubuğu" / "Ana Gezinme" yer işaretleri
            yinelenir; ikinci kopya yalnız görüntü olsun diye `inert`. */}
        <div inert className="contents">
          <AppShell {...args} current={ROUTES.gelen} defaultCollapsed contentAs="div" className="h-[30rem] min-h-0 rounded-xl">
            <PanoContent compact />
          </AppShell>
        </div>
      </Cell>
    </Gallery>
  ),
};
