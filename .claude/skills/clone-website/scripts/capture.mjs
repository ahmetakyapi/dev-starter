#!/usr/bin/env node
// Phase 1 reconnaissance in one command.
//
//   node capture.mjs <url> <outDir> [--widths 1440,768,390]
//
// Writes to <outDir>:
//   shots/<width>-full.png      deterministic full-page screenshot (animations at end state)
//   shots/<width>-live-NN.png   viewport-by-viewport screenshots WITHOUT freezing (motion reference)
//   dom.html                    rendered DOM after hydration + lazy loading
//   tokens.json                 every CSS custom property (with selector), @font-face (family,
//                               weight, style, src URLs), @keyframes (verbatim cssText), media
//                               query breakpoints, root font-size, page background
//   tech.json                   framework / library fingerprints (Next, Tailwind, Webflow, Framer,
//                               GSAP + ScrollTrigger list, Lenis, Lottie, Swiper, video, canvas)
//   sections.json               top-level page topology per width (tag, id, classes, bbox,
//                               first heading, background color/image, z-index)
//   assets.json                 images (currentSrc, largest srcset candidate, natural size),
//                               CSS backgrounds incl. ::before/::after, videos (+poster, sources),
//                               inline SVG count, fonts, favicons, og:image
//   fixed.json                  position:fixed/sticky elements and their styles at scroll 0 vs 600
//                               (the diff is the scroll behavior spec)
//   text.json                   visible text in document order (verbatim, with tag + section index)
import { writeFileSync } from "node:fs";
import { args, BANDS_FN, ensureDir, loadPlaywright, openPage, settle, widthsOf } from "./_browser.mjs";

const { pos, opt } = args();
const [url, outDir] = pos;
if (!url || !outDir) {
  console.error("usage: node capture.mjs <url> <outDir> [--widths 1440,768,390]");
  process.exit(2);
}
const widths = widthsOf(opt);
ensureDir(`${outDir}/shots`);
const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const save = (name, data) => writeFileSync(`${outDir}/${name}`, typeof data === "string" ? data : JSON.stringify(data, null, 2));

const report = { url, widths, errors: {} };
const sectionsByWidth = {};
let first = true;

for (const width of widths) {
  // 1. Live pass (no freeze): what the visitor actually sees, frame by frame.
  {
    const { context, page } = await openPage(browser, url, width);
    await settle(page, { freeze: false });
    const H = await page.evaluate(() => document.documentElement.scrollHeight);
    const vh = page.viewportSize().height;
    let i = 0;
    for (let y = 0; y < H && i < 40; y += vh) {
      await page.evaluate((yy) => scrollTo(0, yy), y);
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${outDir}/shots/${width}-live-${String(i++).padStart(2, "0")}.png` });
    }
    await context.close();
  }

  // 2. Deterministic pass: frozen end states, used for extraction and diffing.
  const { context, page, errors } = await openPage(browser, url, width);
  await settle(page, { freeze: true });
  await page.screenshot({ path: `${outDir}/shots/${width}-full.png`, fullPage: true });

  sectionsByWidth[width] = await page.evaluate(BANDS_FN);

  // Fixed / sticky elements: styles at scroll 0 vs 600. The diff is the behavior.
  const fixedAt = async (y) => {
    await page.evaluate((yy) => scrollTo(0, yy), y);
    await page.waitForTimeout(500);
    return page.evaluate(() => {
      const keys = ["position", "top", "left", "right", "width", "height", "margin", "padding", "borderRadius", "backgroundColor", "boxShadow", "backdropFilter", "transform", "opacity", "color", "gap"];
      // Fixed/sticky elements AND their descendants (the visible pill of a
      // fixed header is usually a child; the header itself never changes).
      const roots = [...document.querySelectorAll("body *")].filter((el) => ["fixed", "sticky"].includes(getComputedStyle(el).position)).slice(0, 12);
      return roots
        .flatMap((el) => [el, ...[...el.querySelectorAll("*")].slice(0, 10)])
        .slice(0, 80)
        .map((el) => {
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return {
            path: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : "") + (typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\s+/).slice(0, 4).join(".") : ""),
            className: typeof el.className === "string" ? el.className : null,
            bbox: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
            styles: Object.fromEntries(keys.map((k) => [k, cs[k]])),
          };
        });
    });
  };
  const atTop = await fixedAt(0);
  const afterScroll = await fixedAt(600);
  // Only what CHANGES between the two scroll positions: that is the behavior spec.
  const changes = atTop.map((el, i) => {
    const after = afterScroll[i];
    if (!after) return null;
    const diff = Object.fromEntries(Object.entries(el.styles).filter(([k, v]) => after.styles[k] !== v).map(([k, v]) => [k, { top: v, scrolled: after.styles[k] }]));
    const cls = el.className !== after.className ? { top: el.className, scrolled: after.className } : null;
    return Object.keys(diff).length || cls ? { path: el.path, styles: diff, className: cls } : null;
  }).filter(Boolean);
  const fixed = { changes, atTop, afterScroll };
  save(`fixed-${width}.json`, fixed);
  await page.evaluate(() => scrollTo(0, 0));

  if (first) {
    first = false;
    save("dom.html", await page.content());

    save(
      "tokens.json",
      await page.evaluate(() => {
        const vars = {};
        const fontFaces = [];
        const keyframes = {};
        const media = new Set();
        const walk = (rules, ctx = "") => {
          for (const rule of rules) {
            if (rule instanceof CSSStyleRule) {
              for (const prop of rule.style) {
                if (prop.startsWith("--")) {
                  (vars[prop] ||= []).push({ selector: (ctx ? ctx + " " : "") + rule.selectorText, value: rule.style.getPropertyValue(prop).trim() });
                }
              }
            } else if (rule instanceof CSSFontFaceRule) {
              fontFaces.push({
                family: rule.style.getPropertyValue("font-family").replace(/["']/g, ""),
                weight: rule.style.getPropertyValue("font-weight"),
                style: rule.style.getPropertyValue("font-style"),
                display: rule.style.getPropertyValue("font-display"),
                unicodeRange: rule.style.getPropertyValue("unicode-range"),
                src: [...rule.style.getPropertyValue("src").matchAll(/url\(["']?([^"')]+)["']?\)/g)].map((m) => new URL(m[1], rule.parentStyleSheet?.href || location.href).href),
              });
            } else if (rule instanceof CSSKeyframesRule) {
              keyframes[rule.name] = rule.cssText;
            } else if (rule instanceof CSSMediaRule) {
              media.add(rule.conditionText || rule.media.mediaText);
              walk(rule.cssRules, `@media ${rule.conditionText || rule.media.mediaText}`);
            } else if (rule.cssRules) {
              walk(rule.cssRules, ctx);
            }
          }
        };
        const blocked = [];
        for (const sheet of document.styleSheets) {
          try {
            walk(sheet.cssRules);
          } catch {
            blocked.push(sheet.href);
          }
        }
        const breakpoints = [...new Set([...media].flatMap((m) => [...m.matchAll(/(min|max)-width:\s*([\d.]+)(px|rem|em)/g)].map((x) => `${x[1]}:${x[2]}${x[3]}`)))].sort();
        const html = getComputedStyle(document.documentElement);
        const body = getComputedStyle(document.body);
        return {
          rootFontSize: html.fontSize,
          page: { background: body.backgroundColor, color: body.color, fontFamily: body.fontFamily, lineHeight: body.lineHeight },
          usedFontFamilies: [...new Set([...document.querySelectorAll("body *")].map((el) => getComputedStyle(el).fontFamily))].slice(0, 30),
          fontFaces,
          breakpoints,
          mediaQueries: [...media],
          keyframes,
          customProperties: vars,
          crossOriginSheetsNotRead: blocked,
        };
      }),
    );

    save(
      "tech.json",
      await page.evaluate(() => {
        const w = window;
        const has = (sel) => !!document.querySelector(sel);
        const classes = [...document.querySelectorAll("[class]")].slice(0, 400).map((el) => (typeof el.className === "string" ? el.className : "")).join(" ");
        return {
          next: !!w.__NEXT_DATA__ || has("script[src*='/_next/']"),
          nuxt: !!w.__NUXT__,
          astro: has("astro-island"),
          webflow: has("html[data-wf-site]"),
          framer: has("[data-framer-name], [data-framer-component-type]"),
          wordpress: has("link[href*='wp-content']"),
          tailwindLikely: /\b(?:flex|grid|px-\d|py-\d|text-(?:sm|lg|xl)|rounded-(?:md|lg|xl|full)|bg-\w+-\d{2,3})\b/.test(classes),
          gsap: !!w.gsap,
          scrollTrigger: w.ScrollTrigger?.getAll ? w.ScrollTrigger.getAll().map((t) => ({ trigger: t.trigger?.className || t.trigger?.id || null, start: t.start, end: t.end, pin: !!t.pin, scrub: t.vars?.scrub ?? null })) : null,
          lenis: has("html.lenis, .lenis"),
          locomotive: has("[data-scroll-container]"),
          lottie: has("lottie-player, dotlottie-player, [data-animation-path]") || !!w.lottie || !!w.bodymovin,
          swiper: has(".swiper"),
          threeOrCanvas: [...document.querySelectorAll("canvas")].map((c) => ({ w: c.width, h: c.height })),
          videos: document.querySelectorAll("video").length,
          scrollTimeline: [...document.styleSheets].some((s) => {
            try {
              return [...s.cssRules].some((r) => /animation-timeline|view-timeline|scroll-timeline/.test(r.cssText));
            } catch {
              return false;
            }
          }),
          viewTransitions: typeof document.startViewTransition === "function",
          webAnimations: document.getAnimations().map((a) => ({
            name: a.animationName || a.id || a.constructor.name,
            target: a.effect?.target?.tagName?.toLowerCase(),
            duration: a.effect?.getTiming?.().duration,
            easing: a.effect?.getTiming?.().easing,
            iterations: a.effect?.getTiming?.().iterations,
          })).slice(0, 60),
        };
      }),
    );

    save(
      "assets.json",
      await page.evaluate(() => {
        const abs = (u) => {
          try {
            return new URL(u, location.href).href;
          } catch {
            return null;
          }
        };
        const largest = (img) => {
          const set = img.getAttribute("srcset") || img.closest("picture")?.querySelector("source")?.getAttribute("srcset");
          if (!set) return null;
          const c = set.split(",").map((s) => s.trim().split(/\s+/)).map(([u, d]) => ({ u: abs(u), n: parseFloat(d) || 1 }));
          return c.sort((a, b) => b.n - a.n)[0]?.u || null;
        };
        const images = [...document.images].map((img) => {
          const r = img.getBoundingClientRect();
          return {
            src: img.currentSrc || abs(img.src),
            largest: largest(img),
            alt: img.alt,
            natural: { w: img.naturalWidth, h: img.naturalHeight },
            bbox: { x: Math.round(r.left), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) },
            objectFit: getComputedStyle(img).objectFit,
            position: getComputedStyle(img).position,
            loading: img.loading,
          };
        });
        const backgrounds = [];
        for (const el of document.querySelectorAll("body, body *")) {
          for (const pseudo of [null, "::before", "::after"]) {
            const bg = getComputedStyle(el, pseudo).backgroundImage;
            if (bg && bg !== "none" && bg.includes("url(")) {
              for (const m of bg.matchAll(/url\(["']?([^"')]+)["']?\)/g)) backgrounds.push({ url: abs(m[1]), pseudo, element: el.tagName.toLowerCase() + (el.id ? `#${el.id}` : "") });
            }
          }
        }
        const videos = [...document.querySelectorAll("video")].map((v) => ({
          src: v.currentSrc || abs(v.getAttribute("src")),
          sources: [...v.querySelectorAll("source")].map((s) => ({ src: abs(s.getAttribute("src")), type: s.type })),
          poster: v.poster ? abs(v.poster) : null,
          autoplay: v.autoplay,
          muted: v.muted,
          loop: v.loop,
          playsInline: v.playsInline,
        }));
        const icons = [...document.querySelectorAll("link[rel*='icon'], link[rel='apple-touch-icon'], link[rel='manifest']")].map((l) => ({ rel: l.rel, href: abs(l.getAttribute("href")) }));
        const meta = Object.fromEntries([...document.querySelectorAll("meta[property^='og:'], meta[name^='twitter:'], meta[name='description'], meta[name='theme-color']")].map((m) => [m.getAttribute("property") || m.getAttribute("name"), m.content]));
        return {
          images,
          backgrounds,
          videos,
          inlineSvgCount: document.querySelectorAll("svg").length,
          svgSprites: [...document.querySelectorAll("use[href], use[xlink\\:href]")].map((u) => u.getAttribute("href") || u.getAttribute("xlink:href")).slice(0, 50),
          icons,
          meta,
          title: document.title,
          lang: document.documentElement.lang,
        };
      }),
    );

    save(
      "text.json",
      await page.evaluate(() => {
        const out = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const n = walker.currentNode;
          const t = n.textContent.replace(/\s+/g, " ").trim();
          const el = n.parentElement;
          if (!t || !el || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(el.tagName)) continue;
          const cs = getComputedStyle(el);
          if (cs.display === "none" || cs.visibility === "hidden") continue;
          out.push({ tag: el.tagName.toLowerCase(), text: t });
        }
        return out;
      }),
    );
  }
  report.errors[width] = errors;
  await context.close();
}

save("sections.json", sectionsByWidth);
save("capture-report.json", report);
await browser.close();

console.log(`captured ${url} → ${outDir}`);
console.log(`  widths: ${widths.join(", ")}  sections@${widths[0]}: ${sectionsByWidth[widths[0]].length}`);
console.log(`  page errors: ${Object.values(report.errors).flat().length}`);
console.log("  next: read tech.json → tokens.json → sections.json → assets.json, then run download-assets.mjs");
