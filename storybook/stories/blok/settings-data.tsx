import { Bell, Palette, Shield, SlidersHorizontal } from "lucide-react";
import { RadioGroup } from "@/components/ui/radio-group";
import { Select } from "@/components/ui/select";
import { SettingsRow, SettingsSection, type SettingsTab } from "@/components/ui/settings-dialog";
import { Switch } from "@/components/ui/switch";

/** Ayarlar penceresinin dört sekmesi (Ayarlar ekranı aynı satırları sayfada kullanır). */
export const LANGUAGES = [
  { value: "tr", label: "Türkçe" },
  { value: "en", label: "İngilizce" },
  { value: "de", label: "Almanca" },
];

export const TIMEZONES = [
  { value: "ist", label: "İstanbul (GMT+3)" },
  { value: "lon", label: "Londra (GMT+0)" },
  { value: "ber", label: "Berlin (GMT+1)" },
];

export const FONT_SIZES = [
  { value: "kucuk", label: "Küçük" },
  { value: "orta", label: "Orta" },
  { value: "buyuk", label: "Büyük" },
];

export const SETTINGS_TABS: readonly SettingsTab[] = [
  {
    value: "genel",
    label: "Genel",
    icon: <SlidersHorizontal />,
    content: (
      <>
        <SettingsSection title="Bölge" description="Tarih, saat ve sayılar bu ayarlara göre yazılır.">
          <SettingsRow label="Dil" hint="Arayüz metinleri">
            <Select label="Dil" hideLabel defaultValue="tr" items={LANGUAGES} />
          </SettingsRow>
          <SettingsRow label="Saat Dilimi">
            <Select label="Saat Dilimi" hideLabel defaultValue="ist" items={TIMEZONES} />
          </SettingsRow>
        </SettingsSection>
        <SettingsSection title="Başlangıç">
          <Switch label="Son Açık Sohbetle Başla" hint="Uygulama açılınca kaldığın sohbete döner." defaultChecked />
        </SettingsSection>
      </>
    ),
  },
  {
    value: "gorunum",
    label: "Görünüm",
    icon: <Palette />,
    content: (
      <>
        <SettingsSection title="Görünüm" description="Bu cihazda geçerli.">
          <Switch label="Sıkı Düzen" hint="Satırlar arasındaki boşluğu azaltır." />
          <Switch label="Hareketi Azalt" hint="Geçiş animasyonlarını kapatır." />
          <SettingsRow label="Yazı Boyutu">
            <Select label="Yazı Boyutu" hideLabel defaultValue="orta" items={FONT_SIZES} />
          </SettingsRow>
        </SettingsSection>
        <SettingsSection title="Kenar Çubuğu">
          <RadioGroup
            name="kenar-cubugu"
            legend="Açılışta kenar çubuğu"
            hideLegend
            defaultValue="acik"
            options={[
              { value: "acik", label: "Açık", hint: "Gezinme etiketleriyle görünür." },
              { value: "dar", label: "Daraltılmış", hint: "Yalnız ikonlar; ⌘B ile açılır." },
            ]}
          />
        </SettingsSection>
      </>
    ),
  },
  {
    value: "bildirimler",
    label: "Bildirimler",
    icon: <Bell />,
    content: (
      <SettingsSection title="Bildirimler" description="Hangi olayda haber verelim?">
        <Switch label="Ajan İşi Bitirdiğinde" hint="Uzun süren planlar tamamlanınca." defaultChecked />
        <Switch label="Onay Beklendiğinde" hint="Ajan bir işlem için iznini istediğinde." defaultChecked />
        <Switch label="Haftalık E-posta Özeti" hint="Pazartesi sabahı, 09.00." />
      </SettingsSection>
    ),
  },
  {
    value: "gizlilik",
    label: "Gizlilik",
    icon: <Shield />,
    content: (
      <SettingsSection title="Veri" description="Sohbetlerin nasıl saklandığını belirler.">
        <Switch label="Sohbet Geçmişini Sakla" hint="Kapatırsan sohbetler 30 gün sonra silinir." defaultChecked />
        <Switch label="Model Eğitimine Katkı" hint="Adı ve e-postası çıkarılmış örnekler kullanılır." />
      </SettingsSection>
    ),
  },
];
