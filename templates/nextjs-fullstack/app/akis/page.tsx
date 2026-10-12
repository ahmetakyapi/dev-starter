import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AgentFeed } from "@/components/feed/agent-feed";
import { env } from "@/lib/env";
import { currentFeedUser, getFeed } from "@/lib/feed";
import { demoFeed } from "@/lib/feed-demo";
import { feedClock } from "@/lib/feed-rules";
import {
  dismissDemoFeedItem,
  dismissFeedItem,
  runDemoFeedAction,
  runFeedAction,
  undoDemoFeedAction,
  undoFeedAction,
} from "./actions";

/*
 * AI akışı: ajan hazırlar, kullanıcı karar verir (knowledge/patterns.md → AI Feed).
 *
 * DEMO MODU yalnız geliştirmede: veritabanı ya da oturum yokken sayfa örnek
 * öğelerle açılır ve aksiyonlar hiçbir şeye dokunmaz. Üretimde demo yok;
 * oturumsuz istek girişe gider.
 *
 * `proxy.ts`e eklenmedi, bilerek: proxy oturumsuz isteği yönlendirir ve
 * geliştirmedeki demoyu kapatırdı. Asıl kapı zaten bu sayfadaki oturum
 * kontrolü; üretimde demo olmadığından açık kalan bir şey yok.
 */

export const metadata: Metadata = {
  title: "Akış",
  robots: { index: false, follow: false },
};

export default async function FeedPage() {
  const now = new Date();
  const { hour, dateLabel } = feedClock(now);
  const user = env.DATABASE_URL ? await currentFeedUser() : null;

  if (!user) {
    if (env.NODE_ENV === "production") redirect("/api/auth/signin?callbackUrl=/akis");
    return (
      <main id="icerik" className="app-bg min-h-dvh">
        <p className="mx-auto w-full max-w-2xl px-4 pt-6 text-small text-muted">
          Demo verisi. Akış; DATABASE_URL tanımlı, oturum açık ve bu e-postayla bir users satırı varken gerçek
          öğelere geçer. Aksiyonlar şu an hiçbir şeye dokunmaz.
        </p>
        <AgentFeed
          name="Deniz"
          dateLabel={dateLabel}
          hour={hour}
          initialItems={demoFeed(now)}
          runAction={runDemoFeedAction}
          undoAction={undoDemoFeedAction}
          dismissAction={dismissDemoFeedItem}
        />
      </main>
    );
  }

  const items = await getFeed(user.id, now);

  return (
    <main id="icerik" className="app-bg min-h-dvh">
      <AgentFeed
        name={user.firstName}
        dateLabel={dateLabel}
        hour={hour}
        initialItems={items}
        runAction={runFeedAction}
        undoAction={undoFeedAction}
        dismissAction={dismissFeedItem}
      />
    </main>
  );
}
