"use client";

import { FileText, FileWarning, UploadCloud } from "lucide-react";
import { useId, useRef, useState, type DragEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Dosya bırakma alanı. Sürükle-bırak bir KISAYOL; asıl yol tıklayınca
 * açılan dosya seçici. Alan bir `<label>`, içindeki giriş görünmez ama
 * erişilebilir: klavyeyle Tab gelir, Enter/Space seçiciyi açar, ekran
 * okuyucu etiketi ve kabul edilen türleri okur.
 *
 * İZİN LİSTESİ (`accept`): yalnızca listedeki MIME türleri kabul edilir.
 * `image/*` gibi joker kabul edilir ama SVG'yi KAPSAMAZ (açıkça yazılmalı).
 * Uzantı (`.pdf`) değil MIME yaz: uzantıyı yerel seçici anlar, buradaki
 * denetim anlamaz; seçicinin sunduğu dosya listede reddedilmiş görünürdü.
 * SVG VARSAYILAN OLARAK REDDEDİLİR: SVG bir görsel değil bir belge; içinde
 * script taşıyabilir ve aynı kökenden sunulursa saklı XSS olur. Gerçekten
 * gerekiyorsa listeye bilerek ekle ve sunucuda temizle (ya da ayrı bir
 * kökenden, `Content-Disposition: attachment` ile sun).
 *
 * FORM GÖNDERİMİ (`name`): giriş, ekranda kabul edilen listeyle eşitlenir.
 * Sürükle-bırak girişi kendiliğinden doldurmaz, seçicinin reddedilen
 * dosyası da girişte kalırdı; form ekranın söylediğini göndermezdi.
 *
 * ÜST SINIR TAŞIYICIYLA EŞLEŞMELİ: sunucu eylemi gövdesi varsayılan 1 MB
 * (`next.config` → `experimental.serverActions.bodySizeLimit`), Vercel
 * istek gövdesi 4,5 MB, nginx `client_max_body_size` varsayılanı 1 MB.
 * `maxBytes`ı bu sınırların altında tut; yoksa burada kabul edilen dosya
 * gönderimde belirsiz bir hatayla düşer. Daha büyük dosya imzalı URL ile
 * doğrudan depoya gider.
 *
 * İSTEMCİ DENETİMİ BİR KOLAYLIK, GÜVENLİK DEĞİL. Tarayıcının bildirdiği tür
 * dosya uzantısından tahmin; değiştirilebilir. Sunucu dosyayı yeniden
 * doğrulamalı: boyut, sihirli baytlar (dosyanın ilk baytları), uzantı.
 *
 * GÖRÜNÜŞ ("board" dili, 2026-11): gri kuyu, kesikli kıl çizgisi (burada
 * kesik kenar anlamlı: "buraya bırak"), ikon beyaz bir karoda. Dosya
 * üstüne gelince alan vurgu yıkamasına döner, karo hafifçe yükselir.
 * Kabul edilen dosyalar beyaz karo satırlar (ad + boyut), reddedilenler
 * tehlike yıkamasında, nedeniyle.
 *
 * Reddedilen dosyalar sessizce düşmez: nedeniyle listelenir ve canlı bölge
 * okur.
 */

/** Varsayılan izin listesi: yaygın görseller ve PDF. SVG bilerek YOK. */
const DEFAULT_ACCEPT = ["image/png", "image/jpeg", "image/webp", "application/pdf"] as const;
/** Varsayılan üst sınır: 5 MB. Taşıyıcının sınırı daha düşük olabilir (yukarıdaki not). */
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

export type RejectedFile = { file: File; reason: "type" | "size" };

type FileDropzoneProps = {
  label?: ReactNode;
  hint?: ReactNode;
  accept?: readonly string[];
  maxBytes?: number;
  multiple?: boolean;
  name?: string;
  onFiles?: (accepted: File[], rejected: RejectedFile[]) => void;
  messages?: { type?: string; size?: string };
  className?: string;
};

const formatBytes = (bytes: number) =>
  new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 }).format(bytes / (1024 * 1024)) + " MB";

/** Tam MIME ya da `tür/*` joker. Joker SVG'yi kapsamaz: SVG yalnızca adıyla girer. */
const allowed = (accept: readonly string[], type: string) =>
  accept.some(
    (entry) =>
      entry === type || (entry.endsWith("/*") && type.startsWith(entry.slice(0, -1)) && type !== "image/svg+xml"),
  );

/** Liste anahtarı: farklı klasörlerden aynı adlı iki dosya çakışmasın. */
const fileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

export function FileDropzone({
  label = "Dosya Yükle",
  hint,
  accept = DEFAULT_ACCEPT,
  maxBytes = DEFAULT_MAX_BYTES,
  multiple = false,
  name,
  onFiles,
  messages = {},
  className,
}: FileDropzoneProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState<RejectedFile[]>([]);
  const [accepted, setAccepted] = useState<File[]>([]);
  const typeMessage = messages.type ?? "Bu dosya türü kabul edilmiyor";
  const sizeMessage = messages.size ?? `Dosya ${formatBytes(maxBytes)} sınırını aşıyor`;

  function handle(list: FileList | null) {
    const files = Array.from(list ?? []).slice(0, multiple ? undefined : 1);
    const ok: File[] = [];
    const bad: RejectedFile[] = [];
    for (const file of files) {
      if (!allowed(accept, file.type)) bad.push({ file, reason: "type" });
      else if (file.size > maxBytes) bad.push({ file, reason: "size" });
      else ok.push(file);
    }
    // Form ekranda kabul edilen ne ise onu göndersin: bırakılan dosya girişe
    // yazılır, reddedilen girişten çıkar. Atama `change` tetiklemez, döngü yok.
    if (input.current) {
      const transfer = new DataTransfer();
      for (const file of ok) transfer.items.add(file);
      input.current.files = transfer.files;
    }
    setAccepted(ok);
    setRejected(bad);
    onFiles?.(ok, bad);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    handle(event.dataTransfer.files);
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <label
        htmlFor={id}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "group/drop flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-9 text-center transition-colors",
          "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-line-focus has-[:focus-visible]:outline-solid",
          dragging ? "border-primary bg-primary-wash" : "border-line-strong bg-surface hover:border-primary-soft",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "mb-1 grid size-12 place-items-center rounded-lg bg-overlay text-strong shadow-raised transition-[translate,box-shadow] duration-200 group-hover/drop:-translate-y-0.5",
            dragging && "-translate-y-1 text-primary-ink shadow-floating",
          )}
        >
          <UploadCloud className="size-5" strokeWidth={1.75} />
        </span>
        <span className="text-base font-semibold text-strong">{label}</span>
        <span className="text-small text-muted">
          {hint ?? `Sürükleyip bırak ya da seçmek için tıkla. En fazla ${formatBytes(maxBytes)}.`}
        </span>
        <input
          ref={input}
          id={id}
          type="file"
          name={name}
          multiple={multiple}
          accept={accept.join(",")}
          onChange={(event) => handle(event.target.files)}
          className="sr-only"
        />
      </label>
      <div role="status" aria-live="polite" className="grid gap-1.5">
        {accepted.map((file) => (
          <p key={fileKey(file)} className="flex items-center gap-2.5 rounded-lg border border-line bg-overlay px-3 py-2 text-small text-strong shadow-raised">
            <FileText aria-hidden className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
            <span className="min-w-0 flex-1 truncate font-medium">{file.name}</span>
            <span className="shrink-0 text-muted tabular-nums">{formatBytes(file.size)}</span>
          </p>
        ))}
        {rejected.map(({ file, reason }) => (
          <p key={fileKey(file)} className="flex items-start gap-2 rounded-lg bg-danger-wash px-3 py-2 text-small text-danger">
            <FileWarning aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
            <span className="min-w-0">
              <span className="font-semibold">{file.name}</span>: {reason === "type" ? typeMessage : sizeMessage}.
            </span>
          </p>
        ))}
      </div>
    </div>
  );
}
