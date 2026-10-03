import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { env } from "./env";
import * as schema from "./schema";

/**
 * Bağlantı TEMBEL kurulur. DATABASE_URL yokken uygulama yine açılır ve
 * build geçer; hata yalnızca sorgu atıldığı anda, o sorguyu yapan yerde
 * doğar. Modül yüklenirken fırlatmak veriye hiç dokunmayan sayfaları da
 * çökertirdi.
 *
 * Sürücü `neon-http`: Vercel'in sunucusuz fonksiyonlarında `pg` havuzu
 * bağlantı sızdırır. İşlem (transaction) gerekiyorsa `neon-serverless`
 * (WebSocket) sürücüsüne geç; HTTP sürücüsü yalnızca toplu sorgu destekler.
 */

type Database = NeonHttpDatabase<typeof schema>;

let instance: Database | null = null;

function connect(): Database {
  const url = env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL tanımlı değil. .env.local dosyasına Neon bağlantı adresini ekle.");
  }
  return drizzle(neon(url), { schema });
}

export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    instance ??= connect();
    return Reflect.get(instance, prop, instance);
  },
});

export { schema };
