import { AgentPlan } from "@/components/ui/agent-plan";
import type { ChatMessage } from "@/components/ui/chat-thread";
import { PLAN, PLAN_LABELS } from "./_shared";

/** Asistanın plan taşıyan mesajı: kısa açıklama + ajan planı. */
export function PlanMessage({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="grid gap-3">
      <p>
        Geçen çeyrekte <strong>1.284 destek talebi</strong> var. Önce yinelenenleri ayıklayıp konulara göre grupluyorum,
        sonra en sık üç sorunu örnekleriyle çıkaracağım.
      </p>
      <AgentPlan steps={PLAN} activeIndex={activeIndex} stepLabels={PLAN_LABELS} />
    </div>
  );
}

export const FIRST_QUESTION = "Geçen çeyreğin destek taleplerini özetle ve en sık üç sorunu çıkar.";

export const CONVERSATION: ChatMessage[] = [
  { id: "u1", role: "user", content: FIRST_QUESTION },
  { id: "a1", role: "assistant", content: <PlanMessage activeIndex={3} /> },
];

/** Uzun yanıt: başlık, sıralı liste, sayılar; balonsuz gövde metni gibi okunur. */
export function LongAnswer() {
  return (
    <div className="grid gap-4">
      <p>
        Özet hazır. Temmuz–Eylül arasında <strong>1.284 talep</strong> geldi; yinelenenler çıkınca{" "}
        <strong>1.102 tekil talep</strong> kaldı. En sık üç sorun toplamın yarısından fazlası:
      </p>
      <ol className="grid list-decimal gap-3 pl-5 marker:font-semibold marker:text-strong">
        <li>
          <strong>Kargo gecikmesi (%24, 264 talep).</strong> Çoğu Eylül'ün ikinci haftasında, aktarma merkezindeki
          yoğunlukla aynı günlerde. Örnek: “Siparişim 6 gündür aynı şubede bekliyor.”
        </li>
        <li>
          <strong>İade süresinin uzunluğu (%17, 187 talep).</strong> Para iadesi ortalama 9 gün sürüyor; talep
          edenlerin üçte biri ikinci kez yazmış. Örnek: “İadem onaylandı ama hesabıma geçmedi.”
        </li>
        <li>
          <strong>Şifre sıfırlama e-postası (%12, 132 talep).</strong> E-posta istenmeyen kutusuna düşüyor; iki
          sağlayıcıda yoğun. Örnek: “Sıfırlama bağlantısı hiç gelmedi.”
        </li>
      </ol>
      <p>
        Önerim: kargo gecikmesi için şubede bekleyen siparişlere otomatik bilgilendirme, iade için durum sayfası. İkisi
        birlikte talebin yaklaşık <strong>%35</strong>'ini daha gelmeden karşılar.
      </p>
      <p className="text-small text-muted">Kaynak: Destek kayıtları, 1 Temmuz – 30 Eylül 2026.</p>
    </div>
  );
}
