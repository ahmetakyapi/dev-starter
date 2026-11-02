import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Avatar, AvatarGroup } from "@/components/ui/avatar";
import { Cell, Frame, Gallery } from "../_lib/Frame";
import { TEAM } from "./_data";

const meta = {
  title: "Bileşenler/Seçim/Avatar",
  id: "components-selection-avatar",
  component: Avatar,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Görsel, yüklenemezse baş harfler; kırık görsel ikonu hiç çıkmaz, sayfa zıplamaz. Baş harf zemini addan türeyen bir grafik pasteli (aynı ad hep aynı renk). `AvatarGroup` üst üste biner, fazlası \"+N\" hapında; okunan adı \"Ekip: Ayşe, Mert ve 3 kişi daha\".",
      },
    },
  },
  args: { name: "Ayşe Demir", size: "md", src: null },
  argTypes: { size: { control: "inline-radio", options: ["sm", "md", "lg"] } },
  decorators: [
    (Story, { parameters }) =>
      parameters.bare ? (
        <Story />
      ) : (
      <Frame width="sm">
        <div className="flex justify-center">
          <Story />
        </div>
      </Frame>
    ),
  ],
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Varsayılan" };

export const Large: Story = { name: "Büyük", args: { size: "lg", name: "Zeynep Öztürk" } };

export const LowercaseName: Story = { name: "Küçük Harfli Ad", args: { name: "ilker şahin" } };

export const SingleWordName: Story = { name: "Tek Kelimelik Ad", args: { name: "Acar" } };

export const Group: Story = {
  name: "Grup",
  render: () => <AvatarGroup people={TEAM} max={4} label="Ekip" />,
};

export const SmallGroup: Story = {
  name: "Grup, Fazlasız",
  render: () => <AvatarGroup people={TEAM.slice(0, 3)} size="sm" label="Katılımcılar" />,
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  parameters: { bare: true },
  render: () => (
    <Gallery cols={3}>
      <Cell label="sm · md · lg">
        <div className="flex items-center gap-3">
          <Avatar name="Ece Koç" size="sm" />
          <Avatar name="Mert Aydın" />
          <Avatar name="Ayşe Demir" size="lg" />
        </div>
      </Cell>
      <Cell label="Addan türeyen pastel">
        <div className="flex flex-wrap justify-center gap-2">
          {TEAM.map((person) => (
            <Avatar key={person.name} name={person.name} />
          ))}
        </div>
      </Cell>
      <Cell label="Grup: sm, md, lg">
        <div className="grid justify-items-center gap-3">
          <AvatarGroup people={TEAM} size="sm" max={5} label="Ekip, küçük" />
          <AvatarGroup people={TEAM} max={4} label="Ekip, orta" />
          <AvatarGroup people={TEAM} size="lg" max={3} label="Ekip, büyük" />
        </div>
      </Cell>
    </Gallery>
  ),
};
