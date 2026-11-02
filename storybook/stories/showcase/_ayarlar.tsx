"use client";

import { useState } from "react";
import { Bell, House, Settings, Shield, SlidersHorizontal } from "lucide-react";
import { BannerAlert } from "@/components/ui/banner-alert";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Checkbox } from "@/components/ui/checkbox";
import { ColorPicker } from "@/components/ui/color-picker";
import { Divider } from "@/components/ui/divider";
import { InputOTP } from "@/components/ui/input-otp";
import { Kbd, KbdCombo } from "@/components/ui/kbd";
import { NumberField } from "@/components/ui/number-field";
import { PaletteSwitcher } from "@/components/ui/palette-switcher";
import { RadioGroup } from "@/components/ui/radio-group";
import { Select } from "@/components/ui/select";
import { SettingsDialog, SettingsRow, SettingsSection, type SettingsTab } from "@/components/ui/settings-dialog";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { TagInput } from "@/components/ui/tag-input";
import { Textarea } from "@/components/ui/textarea";
import { ME, TAG_COLORS, TAG_SUGGESTIONS, TICKETS, WORKSPACE } from "./_data";
import { PageBar, Well, WellTitle, href, useApp } from "./_ui";

const LANGS = [
  { value: "tr", label: "Türkçe" },
  { value: "en", label: "İngilizce" },
  { value: "de", label: "Almanca" },
];
const ZONES = [
  { value: "ist", label: "İstanbul (GMT+3)" },
  { value: "ber", label: "Berlin (GMT+1)" },
  { value: "lon", label: "Londra (GMT+0)" },
];

const QUICK: readonly SettingsTab[] = [
  {
    value: "genel",
    label: "Genel",
    icon: <SlidersHorizontal />,
    content: (
      <SettingsSection title="Bölge" description="Tarih, saat ve tutarlar bu ayarlara göre yazılır.">
        <SettingsRow label="Dil" hint="Arayüz metinleri">
          <Select label="Dil" hideLabel defaultValue="tr" items={LANGS} />
        </SettingsRow>
        <SettingsRow label="Saat Dilimi">
          <Select label="Saat Dilimi" hideLabel defaultValue="ist" items={ZONES} />
        </SettingsRow>
      </SettingsSection>
    ),
  },
  {
    value: "bildirim",
    label: "Bildirimler",
    icon: <Bell />,
    content: (
      <SettingsSection title="Anında Bildirim" description="Bu cihazda geçerli.">
        <Switch label="Acil Talep Geldiğinde" hint="Öncelik Acil olan her yeni talep." defaultChecked />
        <Switch label="Sipariş Geciktiğinde" hint="Kargo teslim tarihini geçince." defaultChecked />
        <Switch label="Asistan İşi Bitirdiğinde" hint="Uzun planlar tamamlanınca." />
      </SettingsSection>
    ),
  },
  {
    value: "gizlilik",
    label: "Gizlilik",
    icon: <Shield />,
    content: (
      <SettingsSection title="Veri" description="Asistanın neyi gördüğünü belirler.">
        <Switch label="Asistan Sipariş Tutarlarını Görsün" hint="Kapatırsan özetlerde tutar yerine adet yazılır." defaultChecked />
        <Switch label="Sohbet Geçmişini Sakla" hint="Kapatırsan sohbetler 30 gün sonra silinir." defaultChecked />
      </SettingsSection>
    ),
  },
];

const SHORTCUTS: readonly { keys: readonly string[]; label: string; spoken: string }[] = [
  { keys: ["⌘", "K"], label: "Komut paletini aç", spoken: "Command K" },
  { keys: ["⌘", "B"], label: "Kenar çubuğunu daralt", spoken: "Command B" },
  { keys: ["↑", "↓"], label: "Komut paletinde gezin", spoken: "Yukarı Aşağı" },
  { keys: ["Esc"], label: "Açık pencereyi kapat", spoken: "Escape" },
  { keys: ["⇧", "↵"], label: "Asistanda yeni satır", spoken: "Shift Enter" },
];

export function AyarlarPage() {
  const { notify } = useApp();
  const [signature, setSignature] = useState(`${ME.name}\n${ME.role} · ${WORKSPACE.name}\n0258 *** 41 07`);
  const [twoStep, setTwoStep] = useState(true);
  const [verified, setVerified] = useState(false);
  const [otpError, setOtpError] = useState<string | undefined>();
  const [tags, setTags] = useState<string[]>(["Kargo", "Fatura", "Teklif", "İade"]);
  const [tagColor, setTagColor] = useState<string>(TAG_COLORS[0].value);
  const usedTags = new Set(TICKETS.flatMap((t) => t.tags));

  return (
    <div className="flex min-h-full flex-col">
      <PageBar
        above={
          <Breadcrumb
            className="mb-1"
            items={[
              { label: "Pusula", href: href("pano"), icon: <House /> },
              { label: "Ayarlar", href: href("ayarlar"), icon: <Settings /> },
              { label: "Çalışma Alanı" },
            ]}
          />
        }
        title="Ayarlar"
        description={`${WORKSPACE.name} · ${WORKSPACE.plan} · değişiklikler anında kaydedilir`}
        actions={<SettingsDialog tabs={QUICK} triggerLabel="Hızlı Ayarlar" description="Bu cihazdaki Pusula tercihleri." />}
      />

      <div className="grid grid-cols-1 gap-4 p-4 sm:p-6 lg:grid-cols-2">
        <Well labelledBy="ayar-profil">
          <WellTitle id="ayar-profil" hint="Yanıtlarının altında müşteriye görünür.">
            Profil
          </WellTitle>
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select label="Dil" defaultValue="tr" items={LANGS} />
              <Select label="Saat Dilimi" defaultValue="ist" items={ZONES} />
            </div>
            <Textarea
              label="E-posta İmzası"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              maxLength={160}
              minRows={3}
              hint="Talep yanıtlarının sonuna eklenir."
            />
          </div>
          <Divider label="Mesai Dışı" align="start" tone="soft" className="my-3" />
          <div className="grid grid-cols-1 divide-y divide-line-soft">
            <Switch label="Otomatik Yanıt" hint="18.00–09.00 arası gelen taleplere sabah dönüleceği yazılır." defaultChecked />
            <Switch label="Acil Talepte Beni Ara" hint="Mesai dışında yalnızca Acil öncelikte." />
          </div>
        </Well>

        <Well labelledBy="ayar-bildirim">
          <WellTitle id="ayar-bildirim" hint="Ne zaman ve nereden haber verelim?">
            Bildirimler
          </WellTitle>
          <div className="grid grid-cols-1 divide-y divide-line-soft">
            <Switch label="Acil Talepler" hint="Öncelik Acil olan her yeni talep." defaultChecked />
            <Switch label="Geciken Siparişler" hint="Kargo teslim tarihini geçince." defaultChecked />
            <Switch label="Haftalık Özet" hint="Pazartesi 09.00, ekibin tamamına." />
          </div>
          <Divider label="Kanallar" align="start" tone="soft" className="my-3" />
          <div className="grid grid-cols-1">
            <Checkbox label="Uygulama İçi" hint="Üst çubuktaki zil." defaultChecked />
            <Checkbox label="E-posta" hint={ME.email} defaultChecked />
            <Checkbox label="SMS" hint="Yalnızca acil talepler için." />
          </div>
        </Well>

        <Well labelledBy="ayar-gorunum">
          <WellTitle id="ayar-gorunum" hint="Seçim bu tarayıcıda saklanır.">
            Görünüm
          </WellTitle>
          <div className="grid grid-cols-1 gap-5">
            <div className="grid grid-cols-1 gap-2">
              <p className="text-small font-semibold text-strong">Renk Paleti ve Tema</p>
              <PaletteSwitcher initialPalette="signature" initialTheme={null} floating={false} className="justify-self-start" />
            </div>
            <RadioGroup
              name="yogunluk"
              legend="Tablo Yoğunluğu"
              defaultValue="rahat"
              options={[
                { value: "rahat", label: "Rahat", hint: "Sayfada 8 talep" },
                { value: "sik", label: "Sık", hint: "Sayfada 14 talep" },
              ]}
            />
          </div>
        </Well>

        <Well labelledBy="ayar-satis">
          <WellTitle id="ayar-satis" hint="Teklif ve sipariş formlarında uygulanır.">
            Satış Kuralları
          </WellTitle>
          <div className="grid grid-cols-1 gap-6">
            <Slider label="Temsilcinin Verebileceği En Yüksek İndirim" defaultValue={0.12} min={0} max={0.3} step={0.01} format={{ style: "percent" }} marks={[0, 0.1, 0.2, 0.3]} showMarkLabels />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <NumberField label="En Az Sipariş" defaultValue={2500} min={0} step={250} format={{ style: "currency", currency: "TRY", maximumFractionDigits: 0 }} hint="Altında sipariş açılamaz." />
              <NumberField label="Teslim Süresi" defaultValue={4} min={1} max={21} hint="İş günü; aşınca sipariş Gecikti olur." />
            </div>
          </div>
        </Well>

        <Well labelledBy="ayar-guvenlik">
          <WellTitle id="ayar-guvenlik" hint="Hesaba yeni bir cihazdan girerken SMS kodu sorulur.">
            Güvenlik
          </WellTitle>
          <div className="grid grid-cols-1 gap-4">
            <Switch
              label="İki Adımlı Doğrulama"
              hint="0532 *** ** 47 numarasına kod gönderilir."
              checked={twoStep}
              onChange={(e) => {
                setTwoStep(e.target.checked);
                setVerified(false);
                setOtpError(undefined);
              }}
            />
            {twoStep ? (
              verified ? (
                <BannerAlert tone="success" title="İki adımlı doğrulama açık" description="Yeni cihazlarda giriş yaparken SMS kodu sorulacak." announce />
              ) : (
                <div className="grid grid-cols-1 gap-3 rounded-lg bg-overlay p-4 shadow-raised">
                  <InputOTP
                    label="Doğrulama Kodu"
                    hint="Telefonuna gelen 6 haneli kodu yaz."
                    error={otpError}
                    onValueChange={() => setOtpError(undefined)}
                    onComplete={(code) => {
                      if (code === "000000") {
                        setOtpError("Kod hatalı, yeniden dene.");
                        return;
                      }
                      setVerified(true);
                      notify({ tone: "success", title: "İki adımlı doğrulama açıldı" });
                    }}
                  />
                </div>
              )
            ) : null}
            <p className="text-small text-muted">Ekipte {WORKSPACE.seats.used} kişiden 4'ü iki adımlı doğrulamayı açtı.</p>
          </div>
        </Well>

        <section aria-labelledby="ayar-kisayol" className="flex h-full flex-col rounded-xl bg-surface p-4 sm:p-5">
          <WellTitle id="ayar-kisayol" hint="Mac'te ⌘, Windows ve Linux'ta Ctrl.">
            Klavye Kısayolları
          </WellTitle>
          <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-1">
            {SHORTCUTS.map((s) => (
              <li key={s.label} className="flex items-center justify-between gap-3 border-b border-line-soft py-2.5 text-base text-body">
                {s.label}
                {s.keys.length > 1 ? <KbdCombo keys={s.keys} label={s.spoken} /> : <Kbd label={s.spoken}>{s.keys[0]}</Kbd>}
              </li>
            ))}
          </ul>
        </section>

        <Well labelledBy="ayar-etiket" className="lg:col-span-2">
          <WellTitle id="ayar-etiket" hint={`Gelen kutusunda ${usedTags.size} etiket kullanılıyor.`}>
            Talep Etiketleri
          </WellTitle>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_auto]">
            <TagInput
              label="Hızlı Etiketler"
              value={tags}
              onValueChange={setTags}
              suggestions={TAG_SUGGESTIONS}
              maxTags={8}
              hint="Talep ekranında tek dokunuşla eklenir. En fazla 8."
            />
            <div className="rounded-lg bg-overlay p-3 shadow-raised md:row-span-2 md:w-64">
              <ColorPicker label="Etiket Rengi" value={tagColor} onValueChange={setTagColor} presets={TAG_COLORS} />
            </div>
            <section aria-labelledby="ayar-etiket-kullanim" className="grid content-start gap-2">
              <h3 id="ayar-etiket-kullanim" className="text-small font-semibold text-strong">
                Son 8 Günde Kullanım
              </h3>
              <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {tags.map((tag) => {
                  const count = TICKETS.filter((t) => t.tags.includes(tag)).length;
                  return (
                    <li key={tag} className="flex items-center gap-2.5 rounded-lg bg-overlay px-3 py-2.5 shadow-raised">
                      {/* token-ok: nokta rengi kullanıcının seçtiği etiket rengi (veri) */}
                      <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: tagColor }} />
                      <span className="min-w-0 flex-1 truncate text-base text-strong">{tag}</span>
                      <span className="text-small text-muted tabular-nums">{count ? `${count} talep` : "Henüz yok"}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </Well>
      </div>
    </div>
  );
}
