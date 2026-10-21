import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel, PanelHeader } from "@/components/ui/Panel";

/* Her sayfa kendi başlığını verir; vermezse sekmede ana sayfayla aynı adı taşır. */
export const metadata: Metadata = { title: "Hesap" };

/**
 * Korunan rotanın İSKELETİ — asıl kapı burası. `proxy.ts` yalnızca çerezin
 * VARLIĞINA bakar (imza doğrulamaz, ucuz ön eleme); sahte bir çerez oradan
 * geçer ve onu BU satırdaki `await auth()` durdurur. Bu desen olmadan
 * `/hesap` sahte çerezle açılır — korunan her yeni sayfa aynı iki satırla
 * başlar.
 */
export default async function HesapPage() {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin?callbackUrl=/hesap");

  return (
    <main id="icerik" className="mx-auto w-full max-w-3xl px-4 py-10">
      <PageHeader
        title="Hesap"
        description="Oturumun sunucuda doğrulandı; bu sayfa korunan rotaların şablonu."
      />
      <Panel className="mt-10">
        <PanelHeader title="Oturum" />
        <dl className="mt-3 grid gap-2 text-read text-body">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Ad</dt>
            <dd>{session.user.name ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">E-posta</dt>
            <dd>{session.user.email ?? "—"}</dd>
          </div>
        </dl>
        <form
          className="mt-5"
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <Button type="submit" variant="primary">
            Çıkış Yap
          </Button>
        </form>
      </Panel>
    </main>
  );
}
