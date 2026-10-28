#!/usr/bin/env node
// 生成 README 的动效一览：每组 12 格（3 列 × 4 行），各输出一张带 CSS 动画的 SVG
// 用法：node docs/showcase/build.mjs
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SANS, MONO, SERIF } from "./lib.mjs";
import { explain, orchestrate, dev } from "./tiles-components.mjs";
import { styles, deckCss } from "./tiles-styles.mjs";

const OUT = dirname(fileURLToPath(import.meta.url));
const W = 360, H = 200, TOP = 40, GAP = 12, COLS = 3;

const groups = [
  ["1-components", "讲解组件", explain],
  ["2-orchestration", "编排与转场", orchestrate],
  ["3-styles-01-12", "风格 01–12", styles.slice(0, 12)],
  ["4-styles-13-24", "风格 13–24", styles.slice(12, 24)],
  ["5-styles-25-30-dev", "风格 25–30 与开发实录组件", [...styles.slice(24), ...dev]],
];

const base = `text{font-family:${SANS}}.m{font-family:${MONO}}.se{font-family:${SERIF}}
.lb{font-size:16px;font-weight:700;letter-spacing:.02em}.en{font-family:${MONO};font-size:11.5px;opacity:.62}
.c{transform-box:fill-box;transform-origin:center}`;

const tile = (t, i, gid) => {
  const id = `${gid}${String.fromCharCode(97 + i)}`;
  const x = (i % COLS) * (W + GAP), y = Math.floor(i / COLS) * (H + GAP);
  const [body, css] = t.draw(id);
  return {
    css,
    svg: `<svg x="${x}" y="${y}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<clipPath id="${id}R"><rect width="${W}" height="${H}" rx="14"/></clipPath>
<g clip-path="url(#${id}R)"><rect width="${W}" height="${H}" fill="${t.bg}"/>
<svg y="${TOP}" width="${W}" height="${H - TOP}" viewBox="${t.vb || `0 0 ${W} ${H - TOP}`}">${body}</svg></g>
<text x="16" y="27" class="lb" fill="${t.fg}">${t.name}</text><text x="${W - 16}" y="27" class="en" fill="${t.fg}" text-anchor="end">${t.en}</text>
</svg>`,
  };
};

groups.forEach(([file, title, tiles], g) => {
  if (tiles.length !== 12) throw new Error(`${title} 有 ${tiles.length} 格，应为 12 格`);
  const rows = Math.ceil(tiles.length / COLS);
  const TW = COLS * W + (COLS - 1) * GAP, TH = rows * H + (rows - 1) * GAP;
  const parts = tiles.map((t, i) => tile(t, i, `g${g + 1}`));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${TH}" viewBox="0 0 ${TW} ${TH}" role="img" aria-label="SayShow 动效一览：${title}">
<title>SayShow 动效一览：${title}</title>
<style>${base}${deckCss}${parts.map((p) => p.css).join("")}</style>
${parts.map((p) => p.svg).join("\n")}
</svg>
`;
  writeFileSync(join(OUT, `${file}.svg`), svg);
  console.log(`${file}.svg  ${(svg.length / 1024).toFixed(1)} KB`);
});
