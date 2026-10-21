import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AgentFeed } from "@/components/feed/agent-feed";
import { EmptyState } from "@/components/ui/EmptyState";
import { env } from "@/lib/env";
import { currentFeedUser, getFeed } from "@/lib/feed";
import { demoFeed } from "@/lib/feed-demo";
import { feedClock } from "@/lib/feed-rules";
import {
  dismissDemoFeedItem,
  dismissFeedItem,
  runDemoFeedAction,
  runFeedAction,
  undismissDemoFeedItem,
  undismissFeedItem,
  undoDemoFeedAction,
  undoFeedAction,
} from "./actions";

/*
 * AI akışı: ajan hazırlar, kullanıcı karar verir (knowledge/patterns.md → AI Feed).
 *
 * DEMO MODU yalnız geliştirmede: veritabanı ya da oturum yokken sayfa örnek
 * öğelerle açılır ve aksiyonlar hiçbir şeye dokunmaz. Üretimde demo yok;
 * oturumsuz istek girişe gider. Oturum VAR ama akışa bağlı `users` satırı
 * (ya da DATABASE_URL) yoksa girişe yollamak döngüdür: kullanıcı yeniden
 * girer, buraya döner, yine yollanır. O durumda açıklayan boş durum çizilir.
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
    if (env.NODE_ENV === "production") {
      const session = env.AUTH_SECRET ? await auth() : null;
      if (!session?.user) redirect("/api/auth/signin?callbackUrl=/akis");
      // E-posta loglanmaz (kişisel veri): durumu ve çareyi söylemek yeter.
      console.warn("akis: oturum var ama users satırı ya da DATABASE_URL yok (auth.ts → callbacks.signIn upsert'i)");
      return (
        <main id="icerik" className="app-bg min-h-dvh">
          <div className="mx-auto w-full max-w-2xl px-4 py-10">
            <EmptyState
              titleAs="h1"
              title="Akışın Henüz Bağlı Değil"
              hint="Hesabın henüz akışa bağlanmadı. Bağlanınca hazırlanan işler burada görünür."
            />
          </div>
        </main>
      );
    }
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
          undismissAction={undismissDemoFeedItem}
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
        undismissAction={undismissFeedItem}
      />
    </main>
  );
}
