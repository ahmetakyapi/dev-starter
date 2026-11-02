import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { TaskList } from "@/components/ui/task-list";
import { Gallery } from "../_lib/Frame";
import { GrafikHucre, Sahne } from "../grafik/_sahne";
import { BUGUN, GOREVLER } from "./_veri";

const meta = {
  title: "Bileşenler/Verimlilik/Görev Listesi",
  id: "task-list",
  component: TaskList,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Tek kişinin ya da küçük ekibin yapılacakları: onay kutusu, öncelik, son tarih (geciken \"Gecikti\" diye yazılır), açılır alt görevler, tamamlananları gizle ve satır içi ekleme (yaz, Enter). İş kolonlar arasında akıyorsa kanban panosu. Kısmen biten görevin kutusu belirsiz çizgi gösterir.",
      },
    },
  },
  args: {
    title: "Bu Haftanın İşleri",
    defaultTasks: GOREVLER,
    today: BUGUN,
    defaultHideCompleted: false,
    onChange: fn(),
  },
  argTypes: {
    defaultTasks: { control: "object" },
  },
  render: (args) => (
    <Sahne width="md">
      <TaskList {...args} />
    </Sahne>
  ),
} satisfies Meta<typeof TaskList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const live = canvasElement.querySelector("[aria-live]")!;
    // Satır içi ekleme
    const giris = canvas.getByLabelText("Yeni görev");
    await userEvent.type(giris, "Yayın notlarını yaz{Enter}");
    await expect(canvas.getByText("Yayın notlarını yaz")).toBeInTheDocument();
    await expect(live).toHaveTextContent("Yayın notlarını yaz eklendi");
    await expect(giris).toHaveValue("");
    // İşaretle: başlık etiket, tıklayınca kutu değişir
    await userEvent.click(canvas.getByText("Sprint gözden geçirme sunumunu hazırla"));
    await expect(canvas.getByRole("checkbox", { name: "Sprint gözden geçirme sunumunu hazırla" })).toBeChecked();
    await expect(live).toHaveTextContent("tamamlandı");
    // Alt görevleri aç
    const ac = canvas.getByRole("button", { name: "Alt görevler, 2 / 3 tamamlandı" });
    await userEvent.click(ac);
    await expect(ac).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(canvas.getByRole("checkbox", { name: "Kapak yazısını yaz" }));
    // Son alt görev bitince üst görev de tamamlanır
    await expect(canvas.getByRole("checkbox", { name: "Kuzey Lojistik teklifini gönder" })).toBeChecked();
    await expect(args.onChange).toHaveBeenCalled();
  },
};

export const HideCompleted: Story = {
  name: "Tamamlananlar Gizli",
  args: { defaultHideCompleted: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText("Ekim faturalarını muhasebeye ilet")).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Tamamlananları Gizle" }));
    await expect(canvas.getByText("Ekim faturalarını muhasebeye ilet")).toBeInTheDocument();
  },
};

export const Empty: Story = {
  name: "Boş",
  args: { defaultTasks: [] },
};

export const AllDone: Story = {
  name: "Hepsi Tamam, Gizli",
  args: {
    defaultHideCompleted: true,
    defaultTasks: GOREVLER.map((t) => ({ ...t, done: true, subtasks: t.subtasks?.map((s) => ({ ...s, done: true })) })),
  },
};

export const LongTitles: Story = {
  name: "Uzun Başlıklar",
  args: {
    defaultTasks: [
      {
        id: "u1",
        title: "Kurumsal müşteriler için tek oturum açma yapılandırmasının adım adım belgesini hazırla ve destek ekibiyle gözden geçir",
        done: false,
        priority: "high",
        due: "2026-10-30",
        subtasks: [
          { id: "u1a", title: "Kimlik sağlayıcı ekran görüntülerini güncelle", done: true },
          { id: "u1b", title: "Sık karşılaşılan hata kodlarının açıklamalarını ekle", done: false },
        ],
      },
      { id: "u2", title: "Çeyrek sonu raporundaki dönüşüm oranı tablosunu finans ekibinin yeni tanımına göre yeniden hesapla", done: true, priority: "medium", due: "2026-11-02" },
      ...GOREVLER.slice(0, 2),
    ],
  },
};

export const Mobile: Story = {
  name: "Telefon Genişliği",
  globals: { viewport: { value: "mobile2", isRotated: false } },
};

export const AllVariants: Story = {
  name: "Bütün Varyantlar",
  render: () => (
    <Gallery cols={2}>
      <GrafikHucre label="Öncelik, gecikme, alt görev">
        <TaskList title="Bu Haftanın İşleri" defaultTasks={GOREVLER} today={BUGUN} />
      </GrafikHucre>
      <GrafikHucre label="Tamamlananlar gizli">
        <TaskList title="Açık İşler" defaultTasks={GOREVLER} today={BUGUN} defaultHideCompleted />
      </GrafikHucre>
      <GrafikHucre label="Öncelik ve tarih yok">
        <TaskList
          title="Alışveriş Öncesi Kontrol"
          today={BUGUN}
          defaultTasks={[
            { id: "a1", title: "Ödeme sayfası metinlerini oku", done: true },
            { id: "a2", title: "Kargo ücretini kontrol et", done: false },
            { id: "a3", title: "İndirim kodunu dene", done: false },
          ]}
        />
      </GrafikHucre>
      <GrafikHucre label="Boş">
        <TaskList title="Yeni Proje" defaultTasks={[]} today={BUGUN} />
      </GrafikHucre>
    </Gallery>
  ),
};
