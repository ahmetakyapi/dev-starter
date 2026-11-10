import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ComponentType } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Faq } from "@/components/sections/Faq";
import { Features } from "@/components/sections/Features";
import { FinalCta } from "@/components/sections/FinalCta";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Logos } from "@/components/sections/Logos";
import { Pricing } from "@/components/sections/Pricing";
import { Testimonials } from "@/components/sections/Testimonials";
import { faq, logos, nav, pricing, testimonials } from "@/lib/content";
import { DEFAULT_THEME } from "@/lib/theme";

/** Bölümü sayfa zemininde, kendi landmark'ının içinde çizer. */
function Section({ of: Of }: { of: ComponentType }) {
  return (
    <div className="min-h-dvh bg-page text-body">
      <main>
        <Of />
      </main>
    </div>
  );
}

const meta = {
  title: "Ekranlar/Açılış Sayfası/Bölümler",
  id: "landing-sections",
  component: Section,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Ana sayfanın bölümleri tek tek. Hepsi metnini `lib/content.ts`ten okur; düzen değişmeden metin değişir. Hareket görünüme girince oynar, hareketi azaltan okuyucuda içerik doğrudan görünür.",
      },
    },
  },
  args: { of: Features },
} satisfies Meta<typeof Section>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Header: Story = {
  name: "Üst Bilgi",
  render: () => (
    <div className="min-h-[60dvh] bg-page text-body">
      <SiteHeader initialTheme={DEFAULT_THEME} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Geniş ekranda düğme display:none: erişilebilir adı boş hesaplanır, rolle
    // bulunamaz. Telefonda menü düğmesi, geniş ekranda satır içi gezinme.
    const toggle = canvasElement.querySelector<HTMLButtonElement>('button[aria-label="Menüyü aç"]');
    await expect(toggle).not.toBeNull();
    if (!toggle || getComputedStyle(toggle).display === "none") {
      await expect(canvas.getByRole("navigation", { name: "Ana menü" })).toBeVisible();
      return;
    }
    await userEvent.click(toggle);
    const menu = await canvas.findByRole("navigation", { name: "Mobil menü" });
    // Menü açılış hareketi bitince görünür (opaklık 0'dan).
    await waitFor(() => expect(within(menu).getByRole("link", { name: nav.links[0].label })).toBeVisible());
    await expect(canvas.getByRole("button", { name: "Menüyü kapat" })).toHaveAttribute("aria-expanded", "true");
  },
};

export const LogosSection: Story = {
  name: "Logolar",
  args: { of: Logos },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText(logos.pause);
    // Hareketi azaltan okuyucuda şerit zaten durgun, denetim gizli (`motion-reduce:hidden`).
    if (getComputedStyle(label).display === "none") {
      await expect(label).not.toBeVisible();
      return;
    }
    await userEvent.click(label);
    await expect(canvas.getByRole("checkbox", { name: logos.pause })).toBeChecked();
  },
};

export const FeaturesSection: Story = { name: "Özellikler", args: { of: Features } };

export const HowItWorksSection: Story = { name: "Nasıl Çalışır", args: { of: HowItWorks } };

export const TestimonialsSection: Story = {
  name: "Görüşler",
  args: { of: Testimonials },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [first, second] = testimonials.items;
    const tab = canvas.getByRole("tab", { name: new RegExp(second.name) });
    await userEvent.click(tab);
    await expect(tab).toHaveAttribute("aria-selected", "true");
    await waitFor(() => expect(canvas.getByText(`“${second.quote}”`)).toBeInTheDocument());
    // Ok tuşu bir sonraki kişiye, Home ilkine.
    await userEvent.keyboard("{Home}");
    await expect(canvas.getByRole("tab", { name: new RegExp(first.name) })).toHaveFocus();
  },
};

export const PricingSection: Story = { name: "Fiyatlar", args: { of: Pricing } };

export const PricingYearly: Story = {
  name: "Fiyatlar Yıllık",
  args: { of: Pricing },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const team = pricing.plans[1];
    await expect(canvas.getByText(team.price.monthly)).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("radio", { name: pricing.billing.yearly }));
    await expect(canvas.getByRole("radio", { name: pricing.billing.yearly })).toBeChecked();
    await waitFor(() => expect(canvas.getByText(team.price.yearly)).toBeInTheDocument());
    await expect(canvas.getByText(`/ ${team.period.yearly}`)).toBeInTheDocument();
  },
};

export const FaqSection: Story = { name: "SSS", args: { of: Faq } };

export const FaqOpen: Story = {
  name: "SSS Açık Yanıt",
  args: { of: Faq },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [item] = faq.items;
    const summary = canvas.getByText(item.question);
    await userEvent.click(summary);
    await expect(summary.closest("details")).toHaveAttribute("open");
    // Yanıt kısa bir belirmeyle gelir (.faq-answer): geçiş bitene kadar bekle.
    await waitFor(() => expect(canvas.getByText(item.answer)).toBeVisible());
  },
};

export const FinalCtaSection: Story = { name: "Kapanış", args: { of: FinalCta } };

export const Footer: Story = {
  name: "Alt Bilgi",
  render: () => (
    <div className="bg-page text-body">
      <SiteFooter />
    </div>
  ),
};
