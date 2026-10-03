"use client";

import { ChevronRight } from "lucide-react";
import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Ağaç görünümü: WAI-ARIA "tree" kalıbı (klasör gezgini, kategori ağacı,
 * belge içindekiler). Başsız kütüphanelerin hiçbirinde sağlam bir ağaç
 * yok; kalıp burada elle ve tam yazıldı.
 *
 * ROLLER: `role="tree"` > `role="treeitem"` (aria-level, aria-setsize,
 * aria-posinset, aria-selected; çocuklu öğede aria-expanded) > alt liste
 * `role="group"`.
 *
 * GEZİCİ TABINDEX: ağaç Tab sırasına TEK durak olarak girer (seçili ya da
 * ilk öğe); içeride ok tuşları gezer. Yirmi öğelik bir ağaçta yirmi Tab
 * basmak zorunda kalınmaz.
 *
 * KLAVYE HARİTASI (guides/10 aynı tabloyu taşır):
 *   ↓ / ↑        görünen bir sonraki / önceki öğe
 *   →            kapalıysa aç; açıksa ilk çocuğa git
 *   ←            açıksa kapat; kapalıysa ebeveyne git
 *   Home / End   ilk / son görünen öğe
 *   Enter, Space seç (çocuklu öğede ayrıca aç/kapa)
 *   *            aynı düzeydeki bütün kardeşleri aç
 *   harf yazmak  o harflerle başlayan sonraki görünen öğe (Türkçe küçük harf)
 *
 * Etiketi düz metin olmayan öğelerde yazarak arama için `textValue` ver.
 */

export type TreeNode = {
  id: string;
  label: ReactNode;
  /** Yazarak arama metni; `label` düz metinse gerekmez. */
  textValue?: string;
  icon?: ReactNode;
  children?: readonly TreeNode[];
};

type Visible = { node: TreeNode; level: number; parent: string | null; posinset: number; setsize: number };

/** Yazarak aramada harflerin birleştiği süre. */
const TYPEAHEAD_MS = 500;

const fold = (value: string) => value.toLocaleLowerCase("tr-TR");

function flatten(nodes: readonly TreeNode[], expanded: ReadonlySet<string>, level = 1, parent: string | null = null): Visible[] {
  return nodes.flatMap((node, index) => {
    const self: Visible = { node, level, parent, posinset: index + 1, setsize: nodes.length };
    const open = node.children?.length && expanded.has(node.id);
    return open ? [self, ...flatten(node.children!, expanded, level + 1, node.id)] : [self];
  });
}

type TreeViewProps = {
  nodes: readonly TreeNode[];
  /** Ağacın adı: "Proje Dosyaları". */
  "aria-label": string;
  defaultExpanded?: readonly string[];
  /** Kontrollü seçim. Verilmezse ağaç kendi tutar. */
  selectedId?: string | null;
  onSelect?: (node: TreeNode) => void;
  className?: string;
};

export function TreeView({ nodes, defaultExpanded = [], selectedId, onSelect, className, ...props }: TreeViewProps) {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set(defaultExpanded));
  const [ownSelected, setOwnSelected] = useState<string | null>(null);
  const selected = selectedId !== undefined ? selectedId : ownSelected;
  const visible = useMemo(() => flatten(nodes, expanded), [nodes, expanded]);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  // Odak sırası: odaklanmış > seçili (görünüyorsa) > ilk öğe.
  const tabStop =
    (focusedId && visible.some((v) => v.node.id === focusedId) && focusedId) ||
    (selected && visible.some((v) => v.node.id === selected) && selected) ||
    visible[0]?.node.id;
  const items = useRef(new Map<string, HTMLLIElement>());
  const typed = useRef({ text: "", at: 0 });

  function focus(id: string | undefined) {
    if (!id) return;
    setFocusedId(id);
    items.current.get(id)?.focus();
  }

  function toggle(id: string, open?: boolean) {
    setExpanded((current) => {
      const next = new Set(current);
      const shouldOpen = open ?? !next.has(id);
      if (shouldOpen) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function select(node: TreeNode) {
    setOwnSelected(node.id);
    onSelect?.(node);
  }

  function onKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const index = visible.findIndex((v) => v.node.id === tabStop);
    const current = visible[index];
    if (!current) return;
    const { node } = current;
    const hasChildren = Boolean(node.children?.length);
    const isOpen = expanded.has(node.id);
    let handled = true;

    switch (event.key) {
      case "ArrowDown":
        focus(visible[index + 1]?.node.id);
        break;
      case "ArrowUp":
        focus(visible[index - 1]?.node.id);
        break;
      case "ArrowRight":
        if (hasChildren && !isOpen) toggle(node.id, true);
        else if (hasChildren) focus(visible[index + 1]?.node.id);
        break;
      case "ArrowLeft":
        if (hasChildren && isOpen) toggle(node.id, false);
        else focus(current.parent ?? undefined);
        break;
      case "Home":
        focus(visible[0]?.node.id);
        break;
      case "End":
        focus(visible.at(-1)?.node.id);
        break;
      case "Enter":
      case " ":
        select(node);
        if (hasChildren) toggle(node.id);
        break;
      case "*": {
        const siblings = visible.filter((v) => v.parent === current.parent && v.node.children?.length);
        setExpanded((prev) => new Set([...prev, ...siblings.map((v) => v.node.id)]));
        break;
      }
      default:
        handled = false;
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          handled = true;
          // Olayın kendi zaman damgası: `Date.now()` çizim içinde saf olmayan çağrı sayılıyor.
          const now = event.timeStamp;
          const text = now - typed.current.at < TYPEAHEAD_MS ? typed.current.text + event.key : event.key;
          typed.current = { text, at: now };
          const query = fold(text);
          // Aynı harfe tekrar basmak sıradaki eşleşmeye geçer: aramaya bir sonrakinden başla.
          const ordered = [...visible.slice(index + (text.length === 1 ? 1 : 0)), ...visible.slice(0, index)];
          const match = ordered.find((v) => {
            const label = v.node.textValue ?? (typeof v.node.label === "string" ? v.node.label : "");
            return fold(label).startsWith(query);
          });
          focus(match?.node.id);
        }
    }

    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function renderLevel(list: readonly TreeNode[], level: number): ReactNode {
    return list.map((node, index) => {
      const hasChildren = Boolean(node.children?.length);
      const isOpen = hasChildren && expanded.has(node.id);
      const isSelected = selected === node.id;
      return (
        <li
          key={node.id}
          ref={(element) => {
            if (element) items.current.set(node.id, element);
            else items.current.delete(node.id);
          }}
          role="treeitem"
          aria-level={level}
          aria-setsize={list.length}
          aria-posinset={index + 1}
          aria-expanded={hasChildren ? isOpen : undefined}
          aria-selected={isSelected}
          tabIndex={node.id === tabStop ? 0 : -1}
          onFocus={(event) => {
            if (event.target === event.currentTarget) setFocusedId(node.id);
          }}
          className="group/item outline-none"
        >
          <div
            onClick={(event) => {
              event.stopPropagation();
              focus(node.id);
              select(node);
              if (hasChildren) toggle(node.id);
            }}
            style={{ paddingLeft: `${(level - 1) * 1.25 + 0.5}rem` }}
            className={cn(
              "flex min-h-11 cursor-pointer items-center gap-2 rounded-md pr-2.5 text-base transition-colors select-none pointer-fine:min-h-9",
              "group-focus-visible/item:outline-2 group-focus-visible/item:outline-offset-[-2px] group-focus-visible/item:outline-line-focus group-focus-visible/item:outline-solid",
              isSelected ? "bg-primary-wash font-medium text-strong" : "text-body hover:bg-surface hover:text-strong",
            )}
          >
            <span aria-hidden className="grid size-4 shrink-0 place-items-center text-muted">
              {hasChildren ? (
                <ChevronRight className={cn("size-4 transition-transform", isOpen && "rotate-90")} strokeWidth={1.75} />
              ) : null}
            </span>
            {node.icon ? (
              <span aria-hidden className={cn("shrink-0 [&_svg]:size-4", isSelected ? "text-primary-ink" : "text-muted")}>
                {node.icon}
              </span>
            ) : null}
            <span className="min-w-0 truncate">{node.label}</span>
          </div>
          {isOpen ? (
            <ul role="group" className="space-y-px">
              {renderLevel(node.children!, level + 1)}
            </ul>
          ) : null}
        </li>
      );
    });
  }

  return (
    <ul role="tree" aria-label={props["aria-label"]} onKeyDown={onKeyDown} className={cn("space-y-px", className)}>
      {renderLevel(nodes, 1)}
    </ul>
  );
}
