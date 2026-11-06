import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect, useState } from "react";
import { Reasoning } from "@/components/ui/reasoning";
import { StreamText } from "@/components/ui/stream-text";
import { Button } from "@/components/ui/Button";
import { Frame } from "../_lib/Frame";

const THOUGHT =
  "Kullanıcı perşembe için 30 dakikalık bir görüşme istiyor. Selin'in takviminde 10:00, 13:30 ve 16:00 boş. 13:30 öğle arasına yakın, 16:00 ise haftalık stok toplantısının hemen ardından. En rahat aralık 10:00 görünüyor; yine de üçünü önerip seçimi kullanıcıya bırakmalıyım.";
const ANSWER =
  "Perşembe Selin'in üç boş aralığı var: 10:00, 13:30 ve 16:00. Sabah 10:00 en sakin olanı; istersen davetiyi hemen gönderebilirim.";

const meta = {
  title: "Bileşenler/Yapay Zekâ/Düşünce Bloğu",
  id: "reasoning",
  component: Reasoning,
  tags: ["autodocs", "yeni"],
  parameters: {
    docs: {
      description: {
        component:
          "Modelin yanıttan önceki akıl yürütmesi. Akarken açık ve canlı (“Düşünüyor · 4 sn”), bitince kendiliğinden tek satıra iner (“6 sn düşündü”). Kullanıcı elle açıp kapattıysa onun kararı kalır. Yanıt `stream-text` ile yalnız yeni sözcükleri belirterek akar.",
      },
    },
  },
  args: { streaming: false, durationSec: 6, children: THOUGHT },
} satisfies Meta<typeof Reasoning>;

export default meta;
type Story = StoryObj<typeof meta>;

function Live() {
  const [run, setRun] = useState(0);
  const [phase, setPhase] = useState<"think" | "answer" | "done">("think");
  const [thought, setThought] = useState("");
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    setPhase("think");
    setThought("");
    setAnswer("");
    const tw = THOUGHT.split(" ");
    const aw = ANSWER.split(" ");
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      if (i <= tw.length) setThought(tw.slice(0, i).join(" "));
      else if (i - tw.length <= aw.length) {
        setPhase("answer");
        setAnswer(aw.slice(0, i - tw.length).join(" "));
      } else {
        setPhase("done");
        window.clearInterval(id);
      }
    }, 90);
    return () => window.clearInterval(id);
  }, [run]);

  return (
    <Frame width="md">
      <div className="grid gap-3 rounded-xl bg-overlay p-5 shadow-raised">
        <Reasoning key={run} streaming={phase === "think"}>
          {thought}
        </Reasoning>
        {answer ? <StreamText text={answer} streaming={phase === "answer"} className="text-read text-strong" /> : null}
        <Button variant="secondary" size="sm" className="justify-self-start" onClick={() => setRun((n) => n + 1)} disabled={phase !== "done"}>
          Yeniden Oynat
        </Button>
      </div>
    </Frame>
  );
}

export const Default: Story = { name: "Varsayılan", render: () => <Live /> };

export const Finished: Story = {
  name: "Geçmiş Mesaj",
  render: (args) => (
    <Frame width="md">
      <Reasoning {...args} />
    </Frame>
  ),
};
