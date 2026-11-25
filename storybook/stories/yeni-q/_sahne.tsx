import { LayoutDashboard } from "lucide-react";
import { AppWindow } from "@/components/ui/app-window";
import { Badge } from "@/components/ui/badge";
import { BarList } from "@/components/ui/bar-list";
import { Sparkline } from "@/components/ui/sparkline";
import { Stat } from "@/components/ui/stat";

/**
 * Sergi turunun ortak ürün sahnesi: paspartunun üstüne konan gerçek bir
 * pencere (Kıyı Kahve kurgusu; sayılar ÖRNEK). Ekran görüntüsü değil,
 * katalogdaki bileşenler: palet ve temayla döner.
 */
export function DemoWindow({ compact = false }: { compact?: boolean }) {
  return (
    <AppWindow title="Kıyı Kahve · Pano" icon={<LayoutDashboard className="size-3.5" />} focused>
      <div className="grid gap-4 p-4 sm:p-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-surface p-3">
            <Stat label="Haftalık Ciro" value="₺84.120" change={6.4} changeLabel="geçen hafta" />
          </div>
          <div className="rounded-lg bg-surface p-3">
            <Stat label="Sipariş" value="412" change={3.1} changeLabel="geçen hafta" />
          </div>
          <div className="grid content-between rounded-lg bg-surface p-3">
            <span className="flex items-center justify-between text-small text-muted">
              Son 7 Gün <Badge tone="success">Canlı</Badge>
            </span>
            <Sparkline values={[12, 18, 14, 22, 19, 28, 31]} title="Son 7 gün sipariş" width={160} height={36} />
          </div>
        </div>
        {compact ? null : (
          <BarList
            title="Çok Satanlar"
            items={[
              { label: "Filtre Kahve · Etiyopya", value: 184 },
              { label: "Soğuk Demleme", value: 132 },
              { label: "Kakule Latte", value: 96 },
              { label: "Türk Kahvesi", value: 71 },
            ]}
          />
        )}
      </div>
    </AppWindow>
  );
}
