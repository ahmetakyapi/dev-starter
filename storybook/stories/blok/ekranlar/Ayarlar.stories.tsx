import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Bell, Bot, Palette, ShieldAlert, UserRound } from "lucide-react";
import { useState, type ReactNode } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { AppShell } from "@/components/ui/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { PaletteSwitcher } from "@/components/ui/palette-switcher";
import { RadioGroup } from "@/components/ui/radio-group";
import { Select } from "@/components/ui/select";
import { SettingsRow } from "@/components/ui/settings-dialog";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_THEME, PALETTE } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Screen } from "../../_lib/Frame";
import { BRAND, ContentBar, MODELS, NAV, ROUTES, ShellCommands, SignOutButton, USER } from "../_shared";
import { LANGUAGES, TIMEZONES } from "../settings-data";

const SECTIONS = [
  { id: "profil", label: "Profil", icon: <UserRound /> },
  { id: "gorunum", label: "Görünüm", icon: <Palette /> },
  { id: "asistan", label: "Asistan", icon: <Bot /> },
  { id: "bildirimler", label: "Bildirimler", icon: <Bell /> },
  { id: "hesap", label: "Hesap", icon: <ShieldAlert /> },
] as const;

/** Bölüm: solda başlık + açıklama, sağda satırlar; bölümler arasında kıl çizgisi. */
function Section({ id, title, description, children }: { id: string; title: string; description: string; children: ReactNode }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-baslik`}
      className="grid scroll-mt-6 grid-cols-1 gap-4 border-t border-line-soft py-8 first:border-t-0 first:pt-0 md:grid-cols-[13rem_1fr] md:gap-10"
    >
      <div>
        <h2 id={`${id}-baslik`} className="text-base font-semibold text-strong">
          {title}
        </h2>
        <p className="mt-1 text-small text-pretty text-muted">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function SettingsPage() {
  const [active, setActive] = useState<string>(SECTIONS[0].id);
  return (
    <Screen>
      <AppShell brand={BRAND} groups={NAV} current={ROUTES.ayarlar} user={USER} userAction={<SignOutButton />} className="h-dvh min-h-0">
        <div className="flex h-full flex-col">
          <ContentBar title="Ayarlar" meta="Değişiklikler Anında Uygulanır" />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[11rem_1fr] lg:gap-12 lg:py-10">
              <nav aria-label="Ayar bölümleri" className="lg:sticky lg:top-0 lg:self-start">
                <ul className="flex gap-0.5 overflow-x-auto rounded-lg bg-surface p-1 [scrollbar-width:none] lg:flex-col">
                  {SECTIONS.map((section) => {
                    const current = section.id === active;
                    return (
                      <li key={section.id} className="shrink-0">
                        <a
                          href={`#${section.id}`}
                          onClick={() => setActive(section.id)}
                          aria-current={current ? "true" : undefined}
                          className={cn(
                            "flex min-h-11 items-center gap-2.5 rounded-md px-3 text-base whitespace-nowrap transition-[background-color,color,box-shadow] duration-150 pointer-fine:min-h-9 [&_svg]:size-4 [&_svg]:shrink-0",
                            current
                              ? "bg-overlay font-medium text-strong shadow-raised ring-1 ring-line"
                              : "text-body hover:bg-surface-raised hover:text-strong",
                          )}
                        >
                          <span aria-hidden className={current ? "text-strong" : "text-muted"}>
                            {section.icon}
                          </span>
                          {section.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="min-w-0">
                <Section id="profil" title="Profil" description="Ekip arkadaşların ve ajanlar seni bu adla görür.">
                  <form onSubmit={(event) => event.preventDefault()} className="grid gap-5">
                    <div className="flex flex-wrap items-center gap-4">
                      <Avatar name={USER.name} size="lg" />
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" size="sm">
                          Fotoğraf Yükle
                        </Button>
                        <Button variant="ghost" size="sm">
                          Kaldır
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Ad Soyad" name="ad" defaultValue={USER.name} autoComplete="name" />
                      <Field label="Unvan" name="unvan" defaultValue="Destek Ekibi Lideri" autoComplete="organization-title" />
                      <Field
                        label="E-Posta"
                        name="eposta"
                        type="email"
                        defaultValue="ahmet@pusula.app"
                        autoComplete="email"
                        hint="Değiştirirsen yeni adrese doğrulama bağlantısı gider."
                        className="sm:col-span-2"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" variant="brand">
                        Profili Kaydet
                      </Button>
                    </div>
                  </form>
                </Section>

                <Section id="gorunum" title="Görünüm" description="Bu cihazda geçerli; renk paleti ekranı hemen değiştirir.">
                  <div className="divide-y divide-line-soft">
                    <div className="grid grid-cols-1 gap-3 py-3">
                      <div>
                        <p className="text-base font-medium text-strong">Renk Paleti</p>
                        <p className="mt-0.5 text-small text-muted">Eylemler ve vurgular bu renge döner; sağdaki düğme açık/koyu temayı değiştirir.</p>
                      </div>
                      <PaletteSwitcher initialPalette={PALETTE} initialTheme={DEFAULT_THEME} floating={false} className="w-fit max-w-full shadow-raised" />
                    </div>
                    <div className="py-4">
                      <RadioGroup
                        name="yogunluk"
                        legend="Yoğunluk"
                        orientation="horizontal"
                        defaultValue="rahat"
                        options={[
                          { value: "rahat", label: "Rahat", hint: "Satırlar arası geniş" },
                          { value: "siki", label: "Sıkı", hint: "Ekrana daha çok satır sığar" },
                        ]}
                      />
                    </div>
                    <div className="py-4">
                      <Slider
                        label="Yazı Boyutu"
                        hint="Sohbet ve tablo metinleri, piksel"
                        defaultValue={16}
                        min={14}
                        max={20}
                        step={1}
                        marks={[14, 16, 18, 20]}
                        showMarkLabels
                      />
                    </div>
                    <Switch label="Hareketi Azalt" hint="Geçiş animasyonlarını kapatır." />
                  </div>
                </Section>

                <Section id="asistan" title="Asistan" description="Ajanların nasıl çalışacağını ve ne zaman sana soracağını belirler.">
                  <div className="divide-y divide-line-soft">
                    <SettingsRow label="Varsayılan Model" hint="Yeni sohbetler bu modelle başlar.">
                      <Select label="Varsayılan Model" hideLabel defaultValue={MODELS[0]} items={MODELS.map((m) => ({ value: m, label: m }))} />
                    </SettingsRow>
                    <SettingsRow label="Yanıt Dili">
                      <Select label="Yanıt Dili" hideLabel defaultValue="tr" items={LANGUAGES} />
                    </SettingsRow>
                    <div className="py-4">
                      <Slider
                        label="Yanıt Uzunluğu"
                        hint="1 kısa ve maddeli, 5 ayrıntılı ve kaynaklı."
                        defaultValue={3}
                        min={1}
                        max={5}
                        marks={[1, 2, 3, 4, 5]}
                        showMarkLabels
                      />
                    </div>
                    <div className="py-4">
                      <RadioGroup
                        name="onay"
                        legend="Onay İste"
                        defaultValue="geri-alinamaz"
                        options={[
                          { value: "her", label: "Her İşlemde", hint: "Ajan her araç çağrısından önce sorar." },
                          { value: "geri-alinamaz", label: "Yalnız Geri Alınamayan İşlemlerde", hint: "E-posta gönderme, silme, ödeme." },
                          { value: "hic", label: "Hiçbir Zaman", hint: "Önerilmez; yalnız deneme çalışma alanında." },
                        ]}
                      />
                    </div>
                  </div>
                </Section>

                <Section id="bildirimler" title="Bildirimler" description="Hangi olayda, hangi kanaldan haber verelim?">
                  <div className="divide-y divide-line-soft">
                    <Switch label="Ajan İşi Bitirdiğinde" hint="Uzun süren planlar tamamlanınca." defaultChecked />
                    <Switch label="Onay Beklendiğinde" hint="Ajan bir işlem için iznini istediğinde." defaultChecked />
                    <Switch label="Bana Talep Atandığında" defaultChecked />
                    <SettingsRow label="E-Posta Özeti" hint="Okunmamış talepler ve ajan raporları.">
                      <Select
                        label="E-Posta Özeti"
                        hideLabel
                        defaultValue="haftalik"
                        items={[
                          { value: "gunluk", label: "Her Gün 09.00" },
                          { value: "haftalik", label: "Pazartesi 09.00" },
                          { value: "kapali", label: "Gönderme" },
                        ]}
                      />
                    </SettingsRow>
                    <SettingsRow label="Saat Dilimi">
                      <Select label="Saat Dilimi" hideLabel defaultValue="ist" items={TIMEZONES} />
                    </SettingsRow>
                  </div>
                </Section>

                <Section id="hesap" title="Hesap" description="Geri alınamayan işlemler. Önce verini indirmeni öneririz.">
                  <div className="divide-y divide-line-soft">
                    <SettingsRow label="Verini İndir" hint="Sohbetler, raporlar ve ayarlar; ZIP olarak e-postana gelir.">
                      <Button variant="secondary" size="sm">
                        İndirme Bağlantısı İste
                      </Button>
                    </SettingsRow>
                    <SettingsRow label="Hesabı Sil" hint="Çalışma alanından çıkarılırsın; sohbetlerin 30 gün sonra silinir.">
                      <Button variant="danger" size="sm">
                        Hesabı Sil
                      </Button>
                    </SettingsRow>
                  </div>
                </Section>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
      <ShellCommands />
    </Screen>
  );
}

const meta = {
  title: "Ekranlar/Uygulama/Ayarlar",
  id: "settings-page",
  component: SettingsPage,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Uygulama kabuğu içinde ayarlar SAYFASI (pencere değil): solda bölüm gezinmesi (telefonda üstte yatay), sağda başlıklı bölümler; anahtar, seçim, radyo ve kaydırıcı satırları. Profil formu Kaydet ister, diğer satırlar anında uygulanır; renk paleti ekranı hemen değiştirir.",
      },
      story: { inline: false, height: "52rem" },
    },
  },
} satisfies Meta<typeof SettingsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: "Varsayılan" };

export const Interaction: Story = {
  name: "Etkileşim",
  parameters: { docs: { description: { story: "Anahtar, radyo ve palet satırı tıklanır; palet `<html data-palette>`ı değiştirir." } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ask = canvas.getByRole("radio", { name: /Her İşlemde/ });
    await userEvent.click(ask);
    await expect(ask).toBeChecked();
    const assigned = canvas.getByRole("switch", { name: /Bana Talep Atandığında/ });
    await userEvent.click(assigned);
    await expect(assigned).not.toBeChecked();
    await userEvent.click(canvas.getByRole("radio", { name: "Yeşim" }));
    await waitFor(() => expect(document.documentElement.dataset.palette).toBe("jade"));
  },
};
