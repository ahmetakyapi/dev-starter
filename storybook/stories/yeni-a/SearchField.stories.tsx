import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { HighlightMatch, SearchField, matchesTr } from "@/components/ui/search-field";
import { Cell, Frame, Gallery } from "../_lib/Frame";
import { DISABLED_CONTRAST_EXEMPT, settle } from "./_settle";

const CITIES = [
  "İstanbul",
  "İzmir",
  "Iğdır",
  "Isparta",
  "Ağrı",
  "Çanakkale",
  "Çankırı",
  "Şanlıurfa",
  "Eskişehir",
  "Kırşehir",
  "Muğla",
  "Düzce",
  "Gümüşhane",
  "Kütahya",
  "Diyarbakır",
  "Ankara",
] as const;

/** Gerçek arama gibi: yazma durunca "sunucuya" gider, 450 ms sonra sonuç gelir. */
function CityFilter(props: Partial<ComponentProps<typeof SearchField>>) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  const results = CITIES.filter((city) => matchesTr(city, query, { fold: true }));

  return (
    <div className="grid gap-3">
      <SearchField
        label="İl Ara"
        placeholder="İl adı yaz; cankaya, igdir de olur"
        loading={loading}
        resultCount={results.length}
        onSearch={(next) => {
          setLoading(true);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => {
            setQuery(next);
            setLoading(false);
          }, 450);
        }}
        {...props}
      />
      <ul aria-label="Sonuçlar" className="grid max-h-64 gap-1 overflow-y-auto rounded-lg bg-surface-sunken p-1">
        {results.length ? (
          results.map((city) => (
            <li key={city} className="rounded-md bg-overlay px-3 py-2 text-small text-body shadow-raised">
              <HighlightMatch text={city} query={query} fold />
            </li>
          ))
        ) : (
          <li className="px-3 py-6 text-center text-small text-muted">“{query}” için il bulunamadı.</li>
        )}
      </ul>
    </div>
  );
}

const meta = {
  title: "Bileşenler/Form Girişleri/Arama Alanı",
  id: "search-field",
  component: SearchField,
  tags: ["autodocs"],
  afterEach: settle,
  parameters: {
    docs: {
      description: {
        component:
          "Liste süzme ve site araması: yazdıkça gecikmeli `onSearch` (250 ms, Enter'da hemen), istek sürerken dönen gösterge, temizle, sayfa geneli kısayol (\"/\" ya da ⌘K). Türkçe harf kuralları için `normalizeTr` / `matchesTr` / `HighlightMatch` dışa aktarılır: \"izmir\" İzmir'i, `fold` ile \"cankiri\" Çankırı'yı bulur. Seçim yaptırılacaksa combobox, komut için komut paleti.",
      },
    },
  },
  args: {
    label: "İl Ara",
    placeholder: "Ara",
    shortcut: "/",
    size: "md",
    loading: false,
    disabled: false,
    debounce: 250,
  },
  argTypes: {
    shortcut: { control: "inline-radio", options: ["/", "mod+k", null] },
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
  render: (args) => (
    <Frame width="sm">
      <CityFilter {...args} />
    </Frame>
  ),
} satisfies Meta<typeof SearchField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("searchbox", { name: "İl Ara" });
    // "/" kısayolu alanı odaklar.
    await userEvent.click(canvasElement);
    await userEvent.keyboard("/");
    await expect(field).toHaveFocus();
    // Türkçe kurallar: "izmir" İzmir'i, aksansız "cankiri" Çankırı'yı bulur.
    await userEvent.type(field, "izmir");
    const list = canvas.getByRole("list", { name: "Sonuçlar" });
    await waitFor(() => expect(within(list).getAllByRole("listitem")).toHaveLength(1), { timeout: 2000 });
    await expect(list).toHaveTextContent("İzmir");
    await userEvent.keyboard("{Escape}");
    await expect(field).toHaveValue("");
    await userEvent.type(field, "cankiri");
    await waitFor(() => expect(list).toHaveTextContent("Çankırı"), { timeout: 2000 });
  },
};

export const Loading: Story = {
  name: "Yükleniyor",
  args: { loading: true, defaultValue: "kır" },
  render: (args) => (
    <Frame width="sm">
      <SearchField {...args} />
    </Frame>
  ),
};

export const CommandShortcut: Story = {
  name: "⌘K Kısayolu",
  args: { shortcut: "mod+k", label: "Belgelerde Ara", placeholder: "Belgelerde ara" },
  render: (args) => (
    <Frame width="sm">
      <SearchField {...args} />
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole("searchbox", { name: "Belgelerde Ara" });
    await expect(field).toHaveAttribute("aria-keyshortcuts", "Meta+K Control+K");
    await userEvent.keyboard("{Control>}k{/Control}");
    await expect(field).toHaveFocus();
  },
};

export const NoResults: Story = {
  name: "Sonuç Yok",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("searchbox", { name: "İl Ara" }), "Paris{Enter}");
    await waitFor(() => expect(canvas.getByText(/için il bulunamadı/)).toBeInTheDocument(), { timeout: 2000 });
    await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent("Sonuç bulunamadı"));
  },
};

export const Disabled: Story = {
  name: "Devre Dışı",
  args: { disabled: true, placeholder: "Arama bakımda" },
  parameters: DISABLED_CONTRAST_EXEMPT,
  render: (args) => (
    <Frame width="sm">
      <div data-a11y-disabled>
        <SearchField {...args} />
      </div>
    </Frame>
  ),
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { layout: "padded", ...DISABLED_CONTRAST_EXEMPT },
  render: () => (
    <Gallery cols={3}>
      <Cell label="Boş, “/” ipucu">
        <SearchField label="Müşteri Ara" placeholder="Müşteri ara" className="w-full" />
      </Cell>
      <Cell label="⌘K ipucu">
        <SearchField label="Belgelerde Ara" placeholder="Belgelerde ara" shortcut="mod+k" className="w-full" />
      </Cell>
      <Cell label="Dolu, temizle düğmesi">
        <SearchField label="Sipariş Ara" defaultValue="Kadıköy" className="w-full" />
      </Cell>
      <Cell label="Yükleniyor">
        <SearchField label="Ürün Ara" defaultValue="zeytinyağı" loading className="w-full" />
      </Cell>
      <Cell label="Küçük, kısayolsuz">
        <SearchField label="Tabloda Ara" placeholder="Tabloda ara" size="sm" shortcut={null} className="w-full" />
      </Cell>
      <Cell label="Devre dışı">
        <div data-a11y-disabled className="w-full">
          <SearchField label="Arşivde Ara" placeholder="Arama bakımda" disabled />
        </div>
      </Cell>
    </Gallery>
  ),
};
