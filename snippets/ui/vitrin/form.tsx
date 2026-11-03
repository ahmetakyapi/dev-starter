"use client";

/* token-ok-file: renk burada kullanıcı VERİSİ (seçilen değer, hazır renk), sistem rengi değil. */

import { useState, type ReactNode } from "react";
import { ColorPicker } from "@/components/ui/color-picker";
import { DateCalendar, type DateRange } from "@/components/ui/date-calendar";
import { DatePicker } from "@/components/ui/date-picker";
import { InputOTP } from "@/components/ui/input-otp";
import { NumberField } from "@/components/ui/number-field";
import { Slider } from "@/components/ui/slider";
import { TagInput } from "@/components/ui/tag-input";
import { Textarea } from "@/components/ui/textarea";
import { TimeField } from "@/components/ui/time-field";

/* Vitrin: her bileşen büyük yuvarlak bir kuyuda, altında adı ve tek cümle. */
function Showcase({
  name,
  summary,
  children,
  wide = false,
}: {
  name: string;
  summary: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <figure className={wide ? "flex h-full flex-col md:col-span-2" : "flex h-full flex-col"}>
      <div className="grid min-h-64 flex-1 place-items-center rounded-2xl bg-surface edge-lit p-5 sm:p-8">{children}</div>
      <figcaption className="mt-3 px-1">
        <p className="text-base font-semibold text-strong">{name}</p>
        <p className="mt-0.5 text-base text-muted">{summary}</p>
      </figcaption>
    </figure>
  );
}

const PRICE = { style: "currency", currency: "TRY", maximumFractionDigits: 0 } as const;

const COLORS = [
  { value: "#a3e635", label: "Fıstık Yeşili" },
  { value: "#3b82f6", label: "Gök Mavisi" },
  { value: "#c084fc", label: "Leylak" },
  { value: "#f472b6", label: "Gül Kurusu" },
  { value: "#facc15", label: "Hardal" },
  { value: "#34d399", label: "Nane" },
  { value: "#0a0a0a", label: "Kömür" },
];

const SKILLS = [
  "Figma",
  "React",
  "Kullanıcı Araştırması",
  "Tasarım Sistemi",
  "Prototipleme",
  "Erişilebilirlik",
  "Hareket Tasarımı",
  "TypeScript",
];

// Vitrin sabit bir aya bakar: ekran görüntüsü her gün aynı çıksın.
const NOV = (d: number) => new Date(2026, 10, d);
const isSunday = (date: Date) => date.getDay() === 0;

export default function Vitrin() {
  const [range, setRange] = useState<DateRange | null>({ start: NOV(12), end: NOV(18) });
  const [note, setNote] = useState(
    "Kapı kodu 4512, üçüncü kat. Zil çalışmıyor, gelince telefonla arayın; akşam altıdan sonra evdeyiz ve paket kapının önüne bırakılabilir.",
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="mb-10 max-w-2xl">
        <p className="text-small font-semibold text-muted">dev-starter · board dili</p>
        <h1 className="mt-1 text-display font-bold tracking-tight">Form Bileşenleri</h1>
        <p className="mt-3 text-read text-body">
          Kaydırıcıdan takvime dokuz giriş: hepsi aynı etiket, yardım ve hata düzeninde, klavyeyle tam kullanılır.
        </p>
      </header>

      <div className="grid gap-x-6 gap-y-10 md:grid-cols-2">
        <Showcase name="Kaydırıcı" summary="Tek değer ya da iki tutamaklı aralık; sürüklerken değer balonu.">
          <div className="grid w-full max-w-sm gap-8">
            <Slider label="Bildirim Sesi" defaultValue={0.64} format={{ style: "percent" }} min={0} max={1} step={0.01} />
            <Slider
              label="Gecelik Fiyat"
              defaultValue={[1500, 4500]}
              min={0}
              max={8000}
              step={250}
              minStepsBetweenValues={2}
              marks={[0, 2000, 4000, 6000, 8000]}
              showMarkLabels
              format={PRICE}
              thumbLabels={["En Düşük Fiyat", "En Yüksek Fiyat"]}
            />
          </div>
        </Showcase>

        <Showcase name="Sayı Alanı" summary="Eksi ve artı karolu sayı alanı; basılı tutunca hızlanır.">
          <div className="grid w-full max-w-xs gap-6">
            <NumberField label="Misafir Sayısı" defaultValue={2} min={1} max={12} hint="Bebekler sayılmaz." />
            <NumberField
              label="Aylık Bütçe"
              defaultValue={12500}
              min={0}
              step={500}
              format={{ style: "currency", currency: "TRY", maximumFractionDigits: 0 }}
            />
          </div>
        </Showcase>

        <Showcase name="Doğrulama Kodu" summary="Altı haneli kod; yapıştırınca dağılır, yazdıkça ilerler.">
          <div className="grid gap-8">
            <InputOTP label="Doğrulama Kodu" defaultValue="4829" hint="0532 *** ** 47 numarasına gönderdik." />
            <InputOTP label="Yedek Kod" defaultValue="719305" error="Kod süresi doldu, yenisini iste." />
          </div>
        </Showcase>

        <Showcase name="Metin Alanı" summary="İçeriğe göre büyür; sınıra yaklaşınca sayaç renk ve sesle uyarır.">
          <Textarea
            label="Teslimat Notu"
            maxLength={140}
            minRows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            hint="Kurye yalnızca bu notu görür."
            className="w-full max-w-sm"
          />
        </Showcase>

        <Showcase name="Etiket Girişi" summary="Enter ya da virgülle çip ekle, Backspace ile geri al; öneriler isteğe bağlı.">
          <TagInput
            label="Beceriler"
            defaultValue={["Figma", "Tasarım Sistemi", "React"]}
            suggestions={SKILLS}
            maxTags={8}
            hint="En fazla 8 beceri; listede olmayanı da yazabilirsin."
            className="w-full max-w-sm"
          />
        </Showcase>

        <Showcase name="Renk Seçici" summary="Doygunluk alanı, ton şeridi, hex ve hazır renkler; alan oklarla gezilir.">
          <div className="w-full max-w-xs rounded-lg bg-overlay p-4 shadow-raised">
            <ColorPicker label="Etiket Rengi" defaultValue="#3b82f6" presets={COLORS} />
          </div>
        </Showcase>

        <Showcase
          name="Takvim"
          summary="Pazartesi başlayan ay; aralık uçları dolgulu, arası şeritte. Pazar günleri kapalı."
          wide
        >
          <div className="flex w-full flex-wrap items-start justify-center gap-6">
            <div className="w-full max-w-[22rem] rounded-lg bg-overlay p-3 shadow-raised">
              <DateCalendar
                mode="range"
                label="Konaklama"
                value={range}
                onValueChange={setRange}
                defaultMonth={NOV(1)}
                isDateDisabled={isSunday}
              />
            </div>
            <div className="w-full max-w-[22rem] rounded-lg bg-overlay p-3 shadow-raised">
              <DateCalendar label="Randevu Günü" defaultValue={NOV(5)} defaultMonth={NOV(1)} min={NOV(3)} />
            </div>
          </div>
        </Showcase>

        <Showcase name="Tarih Seçici" summary="Alan + açılır takvim; tek gün ya da aralık.">
          <div className="grid w-full max-w-xs gap-6">
            <DatePicker label="Teslim Tarihi" defaultValue={NOV(21)} defaultMonth={NOV(1)} name="teslim" />
            <DatePicker
              mode="range"
              label="Rapor Dönemi"
              placeholder="Başlangıç – Bitiş"
              defaultMonth={NOV(1)}
              hint="Aralığın iki ucunu seç."
            />
          </div>
        </Showcase>

        <Showcase name="Saat Alanı" summary="SS:DD segmentleri; oklarla artır, rakamla yaz.">
          <div className="grid w-full max-w-xs gap-6">
            <TimeField label="Randevu Saati" defaultValue="14:30" minuteStep={5} />
            <TimeField label="Mesai Bitişi" hint="24 saat düzeninde." />
          </div>
        </Showcase>
      </div>
    </main>
  );
}
