import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState, type FormEvent } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { BannerAlert } from "@/components/ui/banner-alert";
import { Button } from "@/components/ui/Button";
import { DateCalendar, type DateRange } from "@/components/ui/date-calendar";
import { Divider } from "@/components/ui/divider";
import { InputOTP } from "@/components/ui/input-otp";
import { NumberField } from "@/components/ui/number-field";
import { Slider } from "@/components/ui/slider";
import { TagInput } from "@/components/ui/tag-input";
import { Textarea } from "@/components/ui/textarea";
import { TimeField } from "@/components/ui/time-field";
import { Frame } from "../_lib/Frame";
import { settle } from "./_a11y";
import { NOV, STAY_TAGS, TRY, dayLabel } from "./_data";

/* Dolu geceler: 20–21 Kasım hafta sonu kongresi. Sabit tarih, görüntü her gün aynı. */
const BOOKED = new Set([20, 21]);
const isBooked = (date: Date) => date.getMonth() === 10 && BOOKED.has(date.getDate());
const stay = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long" });
const money = new Intl.NumberFormat("tr-TR", TRY);

type Result = { tone: "success"; title: string; description: string } | { tone: "danger"; title: string; description: string };

function nights(range: DateRange | null) {
  if (!range?.end) return 0;
  return Math.round((range.end.getTime() - range.start.getTime()) / 86_400_000);
}

function ReservationForm({ initial }: { initial?: { range: DateRange; tags: string[] } }) {
  const [range, setRange] = useState<DateRange | null>(initial?.range ?? null);
  const [guests, setGuests] = useState<number | null>(2);
  const [arrival, setArrival] = useState<string | null>("15:00");
  const [budget, setBudget] = useState<number | number[]>([2500, 5500]);
  const [tags, setTags] = useState<string[]>(initial?.tags ?? ["Sessiz Oda"]);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const count = nights(range);
  const [low, high] = Array.isArray(budget) ? budget : [budget, budget];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!range?.end) {
      setResult({ tone: "danger", title: "Çıkış Tarihi Eksik", description: "Takvimde giriş ve çıkış gününü seçin." });
      return;
    }
    if (code.length < 6) {
      setResult({ tone: "danger", title: "Doğrulama Kodu Eksik", description: "Telefonunuza gelen 6 haneli kodu girin." });
      return;
    }
    setResult({
      tone: "success",
      title: "Rezervasyon Talebiniz Alındı",
      description: `${stay.formatRange(range.start, range.end)}, ${count} gece, ${guests ?? 1} misafir, giriş ${arrival ?? "belirtilmedi"}. Otel 2 saat içinde onaylayacak.`,
    });
  }

  return (
    <form onSubmit={submit} noValidate aria-labelledby="rez-baslik" className="grid gap-6">
      <header className="grid gap-1">
        <p className="text-small font-semibold text-muted">Kaş · Limanağzı Butik Otel</p>
        <h2 id="rez-baslik" className="text-title font-semibold text-strong">
          Rezervasyon Talebi
        </h2>
        <p className="text-base text-body">Tarihleri seçin, tercihlerinizi yazın; otel müsaitliği onaylayınca ödeme bağlantısı gelir.</p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <section aria-labelledby="rez-tarih" className="grid gap-3">
          <h3 id="rez-tarih" className="text-small font-semibold text-strong">
            Konaklama Tarihleri
          </h3>
          <div className="rounded-lg bg-overlay p-3 shadow-raised">
            <DateCalendar
              mode="range"
              label="Konaklama"
              value={range}
              onValueChange={setRange}
              defaultMonth={NOV(1)}
              min={NOV(4)}
              isDateDisabled={isBooked}
            />
          </div>
          <p className="text-small text-muted" aria-live="polite">
            {range?.end
              ? `${stay.formatRange(range.start, range.end)} · ${count} gece`
              : range
                ? `Giriş ${stay.format(range.start)}; çıkış gününü seçin`
                : "Üstü çizili geceler dolu."}
          </p>
        </section>

        <div className="grid gap-5 rounded-lg bg-overlay p-5 shadow-raised">
          {/* `[&>div]:min-w-0`: number-field kökü dar kolonda taşıyor (snippet hatası, raporlandı). */}
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <NumberField label="Misafir Sayısı" value={guests} onValueChange={setGuests} min={1} max={6} hint="Bebekler sayılmaz." name="misafir" className="[&>div]:min-w-0" />
            <TimeField label="Tahmini Giriş Saati" value={arrival} onValueChange={setArrival} minuteStep={15} hint="Resepsiyon 24 saat açık." name="giris-saati" />
          </div>

          <Slider
            label="Gecelik Bütçe"
            value={budget}
            onValueChange={setBudget}
            min={1000}
            max={9000}
            step={250}
            minStepsBetweenValues={2}
            marks={[1000, 3000, 5000, 7000, 9000]}
            showMarkLabels
            format={TRY}
            thumbLabels={["En Düşük Bütçe", "En Yüksek Bütçe"]}
            hint={count ? `${count} gece için ${money.format(low * count)} – ${money.format(high * count)}` : "Oda önerileri bu aralığa göre sıralanır."}
            name="butce"
          />

          <Divider tone="soft" decorative />

          <TagInput
            label="Oda Tercihleri"
            value={tags}
            onValueChange={setTags}
            suggestions={STAY_TAGS}
            maxTags={5}
            hint="Listede olmayanı da yazabilirsiniz; en fazla 5 tercih."
            name="tercih"
          />

          <Textarea
            label="Otele Not"
            maxLength={280}
            minRows={3}
            placeholder="Kutlama, alerji, geç giriş gibi bilgiler"
            name="not"
          />

          <Divider label="Telefon Doğrulama" align="start" tone="soft" />

          <InputOTP
            label="Doğrulama Kodu"
            value={code}
            onValueChange={setCode}
            hint="0532 *** ** 47 numarasına gönderdik."
            name="kod"
          />

          {result ? (
            <BannerAlert announce tone={result.tone} title={result.title} description={result.description} onDismiss={() => setResult(null)} />
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button type="reset" variant="ghost" onClick={() => setResult(null)}>
              Vazgeç
            </Button>
            <Button type="submit" variant="brand">
              Talebi Gönder
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

const meta = {
  title: "Bileşenler/Form Girişleri/Örnek Form",
  id: "example-form",
  component: ReservationForm,
  tags: ["autodocs"],
  // Geçişler otursun, a11y denetimi yarım renk yakalamasın (bkz. _a11y.ts).
  afterEach: settle,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Form girişlerinin birlikte nasıl durduğunu gösteren gerçekçi bir rezervasyon formu: tarih aralığı, misafir sayısı, saat, bütçe kaydırıcısı, etiketler, not ve telefon doğrulaması. Hepsi aynı etiket, yardım ve hata düzeninde; gönderimde sonuç Uyarı Satırı olarak duyurulur.",
      },
    },
  },
  render: (args) => (
    <Frame width="xl">
      <ReservationForm {...args} />
    </Frame>
  ),
} satisfies Meta<typeof ReservationForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Varsayılan",
};

export const Filled: Story = {
  name: "Doldurulmuş",
  args: {
    initial: { range: { start: NOV(12), end: NOV(16) }, tags: ["Deniz Manzarası", "Sessiz Oda", "Vejetaryen Kahvaltı"] },
  },
};

export const Interaction: Story = {
  name: "Etkileşim: Uçtan Uca Doldurma",
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Takvimde oklarla 12–16 Kasım aralığını seç", async () => {
      await userEvent.click(canvas.getByRole("button", { name: dayLabel.format(NOV(12)) }));
      await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
      await expect(canvas.getByRole("button", { name: dayLabel.format(NOV(15)) })).toHaveFocus();
      await userEvent.keyboard("{ArrowRight}{Enter}");
      await expect(canvas.getByText(/16 Kasım · 4 gece/)).toBeInTheDocument();
    });

    await step("Misafir sayısını artır", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Artır" }));
      await expect(canvas.getByRole("textbox", { name: "Misafir Sayısı" })).toHaveValue("3");
    });

    await step("Etiket ekle", async () => {
      const tags = canvas.getByRole("combobox", { name: "Oda Tercihleri" });
      await userEvent.type(tags, "Balkon{Enter}");
      await expect(canvas.getByRole("button", { name: "Balkon etiketini kaldır" })).toBeInTheDocument();
    });

    await step("Doğrulama kodunu yapıştır", async () => {
      await userEvent.click(canvas.getByRole("textbox", { name: "Doğrulama Kodu" }));
      await userEvent.paste("482 913");
      await waitFor(() => {
        const boxes = [
          canvas.getByRole("textbox", { name: "Doğrulama Kodu" }),
          ...canvas.getAllByRole("textbox", { name: /^Hane \d \/ 6$/ }),
        ];
        return expect(boxes.map((box) => (box as HTMLInputElement).value).join("")).toBe("482913");
      });
    });

    await step("Gönder ve onayı gör", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Talebi Gönder" }));
      await expect(await canvas.findByText("Rezervasyon Talebiniz Alındı")).toBeInTheDocument();
    });
  },
};

export const IncompleteSubmit: Story = {
  name: "Eksik Gönderim",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Talebi Gönder" }));
    await expect(await canvas.findByRole("alert")).toHaveTextContent("Çıkış Tarihi Eksik");
  },
};
