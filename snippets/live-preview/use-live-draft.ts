"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { createDraftSession } from "./draft-session";
import type { PreviewStatus, SitePreviewHandle } from "./site-preview";

// Yazmayı bırakınca taslağın gönderilmesi için beklenen süre (her tuşta istek yok)
const DRAFT_DELAY_MS = 320;

export type DraftResult = { ok: boolean; message?: string };

type Options = {
  /** Taslağı yazan Server Action: auth + zod + oturum denetimi onda (README § 3) */
  save: (formData: FormData) => Promise<DraftResult>;
  /**
   * Görünüm şeridi: yazı tipi, punto, satır aralığı, renk gibi CSS değişkenleri. Sunucuya
   * gitmeden önizlemeye anında uygulanır (ör. { "--font-display-face": "var(--font-opt-newsreader)" }).
   * Kalıcı olması için aynı seçim `fields` içinde de taşınır (preset adı gibi).
   */
  vars?: Record<`--${string}`, string>;
  /** Birkaç form tek önizlemeyi paylaşıyorsa ortak oturum ve önizleme */
  shared?: { session: string; preview: RefObject<SitePreviewHandle | null> };
};

/*
 * Düzenleyici formunun önizleme taslağı. İki şerit:
 *   içerik  alanlar değişince (DRAFT_DELAY_MS sonra) bu oturumun taslağı yazılır, önizleme
 *           sayfayı tam yüklemeden yeniden çizer (router.refresh, kaydırma yerinde kalır)
 *   görünüm vars değişince önizlemeye anında CSS değişkeni olarak gider, istek yok
 * Durum alanların kendisinden çıkar: gönderilen son hâlle aynı mı (güncel), kaydedilenle aynı mı
 * (yayında), son gönderim reddedildi mi (hatalı).
 */
export function useLiveDraft(key: string, fields: Record<string, string | null>, { save, vars, shared }: Options) {
  const [ownSession] = useState(createDraftSession);
  const session = shared?.session ?? ownSession;
  const snapshot = JSON.stringify(fields);
  const [pushed, setPushed] = useState(snapshot);
  const [saved, setSaved] = useState(snapshot);
  const [failed, setFailed] = useState<string | null>(null);
  const ownPreview = useRef<SitePreviewHandle>(null);
  const preview = shared?.preview ?? ownPreview;
  const latest = useRef({ snapshot, fields });
  const seq = useRef(0);
  const varsJson = JSON.stringify(vars ?? {});

  useEffect(() => {
    latest.current = { snapshot, fields };
  });

  // Görünüm şeridi: beklemeden
  useEffect(() => {
    preview.current?.vars(JSON.parse(varsJson) as Record<string, string>);
  }, [varsJson, preview]);

  // İçerik şeridi: yazmayı bırakınca, sıradan çıkmış yanıtlar yok sayılır
  useEffect(() => {
    if (snapshot === pushed) return;
    const timer = window.setTimeout(async () => {
      const { snapshot: sent, fields: values } = latest.current;
      const mine = ++seq.current;
      const formData = new FormData();
      formData.set("key", key);
      formData.set("session", session);
      for (const [name, value] of Object.entries(values)) formData.set(name, value ?? "");
      try {
        const result = await save(formData);
        if (mine !== seq.current) return;
        if (!result.ok) {
          setFailed(sent);
          return;
        }
        setPushed(sent);
        setFailed(null);
        preview.current?.refresh();
      } catch {
        if (mine === seq.current) setFailed(sent);
      }
    }, DRAFT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [snapshot, pushed, key, session, save, preview]);

  /** Kayıt yayına girdi: önizleme yayındaki hâle döner. (React Compiler kendisi ezberler.) */
  const markSaved = () => {
    setSaved(latest.current.snapshot);
    preview.current?.refresh();
  };

  const status: PreviewStatus = failed === snapshot ? "invalid" : snapshot !== pushed ? "saving" : snapshot !== saved ? "draft" : "live";
  return { session, preview, status, markSaved };
}
