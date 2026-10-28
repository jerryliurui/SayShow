// 讲解组件、编排与转场、开发实录组件：每格演示一个 src/kit 组件或 references 里的一种手法
// 内容区坐标 360×156
import { INK, SUB, LINE, CREAM, CORAL, BLUE, PURPLE, GREEN, GOLD, PINK, K, anim, OUT, BOUNCE, pop, fade, show, draw, drawn, esc, typeChars, caretStops } from "./lib.mjs";

const card = (x, y, w, h, r = 12, fill = "#fff") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${LINE}" stroke-width="1.5"/>`;
const bar = (x, y, w, c = "#DCD6CB", h = 7) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${c}"/>`;
const tick = (cx, cy, s = 1) => `M${cx - 6 * s},${cy + 0.5 * s} l${4.5 * s},${4.5 * s} l${8.5 * s},-${9.5 * s}`;

// ---------- 第一组：讲解组件（src/kit/ui.tsx、lib.tsx） ----------
export const explain = [
  {
    name: "焦点框", en: "FocusRing", bg: CREAM, fg: INK,
    draw: (id) => {
      let b = "";
      [34, 136, 238].forEach((x, i) => {
        b += card(x, 34, 88, 88, 14) + `<rect x="${x + 14}" y="48" width="26" height="26" rx="8" fill="${[CORAL, BLUE, GOLD][i]}"/>` + bar(x + 14, 86, 58) + bar(x + 14, 100, 38, "#E8E3DA");
      });
      b += `<g style="${anim(id + "m", 4.5, BOUNCE)}">
        <rect x="26" y="26" width="104" height="104" rx="20" fill="none" stroke="${CORAL}" stroke-opacity=".16" stroke-width="12"/>
        <rect x="26" y="26" width="104" height="104" rx="20" fill="none" stroke="${CORAL}" stroke-width="4"/></g>`;
      const at = (x) => `transform:translateX(${x}px)`;
      return [b, K(id + "m", [[0, at(0)], [22, at(0)], [34, at(102)], [56, at(102)], [68, at(204)], [88, at(204)], [100, at(0)]])];
    },
  },
  {
    name: "飞行标签", en: "Flyer", bg: CREAM, fg: INK,
    draw: (id) => {
      const path = "M72,70 Q180,-34 288,70";
      const b = `${card(22, 70, 100, 52)}<text x="72" y="102" font-size="16" font-weight="700" fill="${INK}" text-anchor="middle">稿件</text>
        <g class="c" style="${anim(id + "r", 4)}">${card(238, 70, 100, 52)}<text x="288" y="102" font-size="16" font-weight="700" fill="${INK}" text-anchor="middle">时间线</text></g>
        <path d="${path}" fill="none" stroke="${PURPLE}" stroke-opacity=".25" stroke-width="2" stroke-dasharray="4 6"/>
        <g opacity="0"><rect x="-32" y="-14" width="64" height="28" rx="14" fill="${PURPLE}"/><text y="5" font-size="13" font-weight="700" fill="#fff" text-anchor="middle" class="m">[[词]]</text>
          <animateMotion dur="4s" repeatCount="indefinite" path="${path}" keyPoints="0;0;1;1" keyTimes="0;.18;.58;1" calcMode="spline" keySplines="0 0 1 1;.3 .1 .25 1;0 0 1 1"/>
          <animate attributeName="opacity" dur="4s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;.1;.18;.82;.9;1"/></g>
        <g style="${anim(id + "n", 4)}"><text x="288" y="140" font-size="12" fill="${SUB}" text-anchor="middle">第 128 帧开始动</text></g>`;
      return [b, K(id + "r", [[0, "transform:scale(1)"], [57, "transform:scale(1)"], [62, "transform:scale(1.08)"], [70, "transform:scale(1)"], [100, "transform:scale(1)"]]) + fade(id + "n", 60, 83)];
    },
  },
  {
    name: "逐字打出", en: "Typed", bg: "#1E2129", fg: "#E6E9EF",
    draw: (id) => {
      const s = [..."说什么，就演什么。"], cw = 30, x0 = 45;
      const t = typeChars(id, s, { dur: 4.5, x: x0, y: 90, cw, a: 10, b: 55, hide: 90, size: 30, fill: "#F3F4F7", weight: 700 });
      const b = `<text x="${x0}" y="44" font-size="13" class="m" fill="#7A8396">$ say-show</text>${t.body}
        <g style="${anim(id + "k", 4.5, "linear")}"><rect x="${x0}" y="64" width="3" height="34" fill="${GOLD}" style="${anim(id + "bl", 0.8, "steps(1,end)")}"/></g>`;
      return [b, t.css + K(id + "k", caretStops(s.length, 10, 55, cw)) + K(id + "bl", [[0, "opacity:1"], [50, "opacity:0"], [100, "opacity:0"]])];
    },
  },
  {
    name: "跟读变色", en: "ReadAlong", bg: CREAM, fg: INK,
    draw: (id) => {
      const s = [..."按旁白的节奏一个字一个字亮起"], cw = 22, x0 = 26;
      let b = s.map((c, i) => `<text x="${x0 + i * cw}" y="108" font-size="22" font-weight="700" fill="#BCC2CD">${c}</text>`).join("");
      const t = typeChars(id, s, { dur: 5, x: x0, y: 108, cw, a: 12, b: 72, hide: 92, size: 22, fill: INK, weight: 700 });
      let css = t.css;
      [0.45, 0.8, 0.55, 1, 0.7, 0.35, 0.9, 0.6, 0.4, 0.75, 0.5].forEach((h, i) => {
        b += `<rect x="${126 + i * 10}" y="${48 - 16 * h}" width="5" height="${32 * h}" rx="2.5" fill="${PURPLE}" class="c" style="${anim(id + "w", 0.6 + (i % 3) * 0.17, "ease-in-out", -i * 0.09)}"/>`;
      });
      css += K(id + "w", [[0, "transform:scaleY(.35)"], [50, "transform:scaleY(1)"], [100, "transform:scaleY(.35)"]]);
      return [b + t.body, css];
    },
  },
  {
    name: "数字滚动", en: "CountUp", bg: CREAM, fg: INK,
    draw: (id) => {
      const digits = [8, 1, 9, 2], cw = 36, x0 = 180 - (digits.length * cw) / 2 - 14, lh = 62;
      let cols = "", css = "";
      digits.forEach((d, i) => {
        let col = "";
        for (let k = 0; k < 20; k++) col += `<text x="${x0 + cw / 2 + i * cw}" y="${92 + k * lh}" font-size="54" font-weight="800" fill="${INK}" text-anchor="middle" class="m">${k % 10}</text>`;
        cols += `<g style="${anim(id + "d" + i, 4, "cubic-bezier(.2,.8,.2,1)")}">${col}</g>`;
        const y = `transform:translateY(-${(10 + d) * lh}px)`;
        css += K(id + "d" + i, [[0, "transform:translateY(0)"], [8, "transform:translateY(0)"], [44 + i * 6, y], [100, y]]);
      });
      const b = `<clipPath id="${id}c"><rect x="0" y="40" width="360" height="66"/></clipPath>
        <g style="${anim(id + "o", 4)}"><g clip-path="url(#${id}c)">${cols}</g>
        <text x="${x0 + digits.length * cw + 8}" y="92" font-size="24" font-weight="700" fill="${SUB}">维</text>
        <text x="180" y="132" font-size="13" fill="${SUB}" text-anchor="middle">换值时滚动到目标数字</text></g>`;
      return [b, css + K(id + "o", [[0, "opacity:0"], [4, "opacity:1"], [88, "opacity:1"], [96, "opacity:0"], [100, "opacity:0"]])];
    },
  },
  {
    name: "描框", en: "DrawBox", bg: CREAM, fg: INK,
    draw: (id) => {
      const d = "M96,46 H264 Q280,46 280,62 V94 Q280,110 264,110 H96 Q80,110 80,94 V62 Q80,46 96,46";
      const b = `<rect x="80" y="46" width="200" height="64" rx="16" fill="${CORAL}" style="${anim(id + "f", 4)}"/>
        <text x="180" y="89" font-size="30" font-weight="800" fill="${INK}" text-anchor="middle">关键结论</text>
        <path d="${d}" pathLength="100" fill="none" stroke="${CORAL}" stroke-width="4.5" stroke-linecap="round" style="${drawn(id + "p", 4)}"/>`;
      return [b, draw(id + "p", 12, 40, 86) + K(id + "f", [[0, "opacity:0"], [40, "opacity:0"], [48, "opacity:.1"], [86, "opacity:.1"], [91, "opacity:0"], [100, "opacity:0"]])];
    },
  },
  {
    name: "对勾", en: "Check", bg: CREAM, fg: INK,
    draw: (id) => {
      let b = "", css = "";
      ["写好旁白稿", "克隆声音配音", "逐字对齐字幕"].forEach((t, i) => {
        const y = 36 + i * 40, a = 12 + i * 20;
        b += `<circle cx="96" cy="${y}" r="13" fill="none" stroke="#D3CEC4" stroke-width="2"/>
          <text x="122" y="${y + 7}" font-size="19" font-weight="700" fill="#B4B9C4">${t}</text>
          <text x="122" y="${y + 7}" font-size="19" font-weight="700" fill="${INK}" style="${anim(id + "x" + i, 5)}">${t}</text>
          <circle cx="96" cy="${y}" r="13" fill="${GREEN}" class="c" style="${anim(id + "c" + i, 5, "ease-out")}"/>
          <path d="${tick(96, y, 0.95)}" pathLength="100" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" style="${drawn(id + "k" + i, 5)}"/>`;
        css += pop(id + "c" + i, a, 86, 0.2) + draw(id + "k" + i, a + 3, a + 8, 86) + fade(id + "x" + i, a + 2, 86);
      });
      return [b, css];
    },
  },
  {
    name: "标题逐字下落", en: "TitleDrop", bg: CREAM, fg: INK,
    draw: (id) => {
      const s = [..."说什么就演什么"], cw = 44, x0 = 180 - (s.length * cw) / 2;
      let b = "", css = "";
      s.forEach((c, i) => {
        const a = 8 + i * 1.7, n = id + "d" + i;
        b += `<text x="${x0 + cw / 2 + i * cw}" y="96" font-size="42" font-weight="900" fill="${c === "演" ? CORAL : INK}" text-anchor="middle" class="c" style="${anim(n, 4, "ease-out")}">${c}</text>`;
        css += K(n, [[0, "opacity:0;transform:translateY(-46px) scale(1.25)"], [a, "opacity:0;transform:translateY(-46px) scale(1.25)"], [a + 7, "opacity:1;transform:translateY(5px) scale(.97)"], [a + 11, "opacity:1;transform:translateY(0) scale(1)"], [84, "opacity:1;transform:translateY(0) scale(1)"], [92, "opacity:0;transform:translateY(0) scale(1)"], [100, "opacity:0;transform:translateY(0) scale(1)"]]);
      });
      return [b + `<text x="180" y="132" font-size="12" fill="${SUB}" text-anchor="middle">相邻字错开约 2 帧</text>`, css];
    },
  },
  {
    name: "胶囊标签", en: "Kicker", bg: "#F3F1EC", fg: INK,
    draw: (id) => {
      const b = `<g style="${anim(id + "k", 4.5, OUT)}"><rect x="28" y="22" width="206" height="40" rx="20" fill="#fff" filter="url(#${id}s)"/>
          <circle cx="50" cy="42" r="6" fill="${PURPLE}"/><text x="64" y="48" font-size="16" font-weight="700" fill="${INK}">第 2 章 · 配音与对齐</text></g>
        <g style="${anim(id + "t", 4.5, OUT)}"><text x="30" y="108" font-size="30" font-weight="900" fill="${INK}">让画面跟上旁白</text>
          ${bar(32, 124, 180, "#DDD8CE")}${bar(32, 138, 120, "#E6E2DA")}</g>
        <filter id="${id}s" x="-20%" y="-40%" width="140%" height="200%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#1E283C" flood-opacity=".1"/></filter>`;
      return [b, fade(id + "k", 6, 86, "transform:translateX(-40px)", "transform:translateX(0)", 10) + fade(id + "t", 26, 86, "transform:translateY(14px)", "transform:translateY(0)", 10)];
    },
  },
  {
    name: "窗口卡片", en: "Win", bg: "#EEF1F6", fg: INK,
    draw: (id) => {
      const b = `<g style="transform-origin:180px 80px;${anim(id + "w", 4.5, BOUNCE)}">
          <rect x="50" y="16" width="260" height="126" rx="14" fill="#fff" filter="url(#${id}s)"/>
          <line x1="50" y1="42" x2="310" y2="42" stroke="#EEF0F4" stroke-width="2"/>
          <circle cx="66" cy="29" r="4.5" fill="#FF6159"/><circle cx="80" cy="29" r="4.5" fill="#FFBD2E"/><circle cx="94" cy="29" r="4.5" fill="#28C941"/>
          <text x="108" y="33" font-size="12" font-weight="700" fill="${SUB}" class="m">scenes.tsx</text>
          <rect x="68" y="60" width="38" height="38" rx="11" fill="${BLUE}"/><path d="M78,79 l6,6 l12,-13" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          ${[[64, 160, INK], [84, 120, "#C9CED8"], [112, 170, "#DDE1E8"]].map(([y, w, c], i) => `<rect x="120" y="${y}" width="${w}" height="9" rx="4.5" fill="${c}" style="transform-box:fill-box;transform-origin:0 50%;${anim(id + "l" + i, 4.5, OUT)}"/>`).join("")}
        </g><filter id="${id}s" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#1E2846" flood-opacity=".13"/></filter>`;
      let css = K(id + "w", [[0, "opacity:0;transform:scale(.86)"], [4, "opacity:0;transform:scale(.86)"], [14, "opacity:1;transform:scale(1)"], [86, "opacity:1;transform:scale(1)"], [94, "opacity:0;transform:scale(.96)"], [100, "opacity:0;transform:scale(.86)"]]);
      [26, 36, 46].forEach((a, i) => (css += K(id + "l" + i, [[0, "transform:scaleX(0)"], [a, "transform:scaleX(0)"], [a + 10, "transform:scaleX(1)"], [100, "transform:scaleX(1)"]])));
      return [b, css];
    },
  },
  {
    name: "按句加注释", en: "Note", bg: CREAM, fg: INK,
    draw: (id) => {
      let bars = "";
      [44, 62, 30, 74, 52].forEach((h, i) => (bars += `<rect x="${42 + i * 30}" y="${122 - h}" width="18" height="${h}" rx="3" fill="${i === 3 ? CORAL : "#A9B8D6"}"/>`));
      const b = `${card(20, 18, 190, 120, 10)}<line x1="34" y1="122" x2="196" y2="122" stroke="#D5D9E0" stroke-width="1.5"/>${bars}
        <path d="M141,46 L230,40" pathLength="100" fill="none" stroke="${INK}" stroke-width="1.5" style="${drawn(id + "p1", 5)}"/>
        <g style="${anim(id + "n1", 5)}"><rect x="230" y="26" width="108" height="28" rx="8" fill="${INK}"/><text x="284" y="45" font-size="13" font-weight="700" fill="#fff" text-anchor="middle">这一步最慢</text></g>
        <path d="M196,128 L230,112" pathLength="100" fill="none" stroke="${SUB}" stroke-width="1.5" stroke-dasharray="3 3" style="${anim(id + "n2", 5)}"/>
        <g style="${anim(id + "n2", 5)}"><rect x="230" y="98" width="108" height="28" rx="8" fill="#fff" stroke="${LINE}" stroke-width="1.5"/><text x="284" y="117" font-size="13" fill="${SUB}" text-anchor="middle">数据为示意</text></g>`;
      return [b, draw(id + "p1", 14, 22, 86) + fade(id + "n1", 20, 86, "transform:translateX(-8px)", "transform:translateX(0)") + fade(id + "n2", 46, 86, "transform:translateX(-8px)", "transform:translateX(0)")];
    },
  },
  {
    name: "字幕硬切", en: "Captions", bg: "#EDEFF3", fg: INK,
    draw: (id) => {
      const lines = ["说什么，就演什么", "字幕跟着词一帧硬切", "首尾相接，不留空档"];
      let b = `<line x1="30" y1="40" x2="330" y2="40" stroke="#C7CCD6" stroke-width="2"/>`, css = "";
      [[30, 130], [130, 236], [236, 330]].forEach(([a, z], i) => (b += `<rect x="${a + 2}" y="30" width="${z - a - 4}" height="20" rx="4" fill="${[BLUE, PURPLE, CORAL][i]}" opacity=".18"/>`));
      b += `<g style="${anim(id + "h", 6, "linear")}"><line x1="30" y1="22" x2="30" y2="58" stroke="${CORAL}" stroke-width="2.5"/><circle cx="30" cy="22" r="4" fill="${CORAL}"/></g>
        <rect x="40" y="92" width="280" height="40" fill="${INK}"/>`;
      lines.forEach((t, i) => {
        const a = (100 * i) / 3, z = (100 * (i + 1)) / 3;
        b += `<text x="180" y="118" font-size="17" font-weight="700" fill="#fff" text-anchor="middle" style="${anim(id + "s" + i, 6, "linear")}">${t}</text>`;
        css += i === 0 ? K(id + "s0", [[0, "opacity:1"], [z - 0.01, "opacity:1"], [z, "opacity:0"], [100, "opacity:0"]]) : show(id + "s" + i, a, i === 2 ? 100.01 : z);
      });
      return [b, css + K(id + "h", [[0, "transform:translateX(0)"], [100, "transform:translateX(300px)"]])];
    },
  },
];

// ---------- 第二组：编排与转场（references/motion-sync.md、src/kit/Main.tsx） ----------
export const orchestrate = [
  {
    name: "占位→点亮", en: "Placeholder", bg: CREAM, fg: INK,
    draw: (id) => {
      let b = "", css = "";
      ["稿件", "配音", "对齐", "动画"].forEach((t, i) => {
        const x = 22 + i * 82, a = 14 + i * 18, c = [BLUE, PURPLE, GREEN, CORAL][i];
        b += `<rect x="${x}" y="36" width="70" height="84" rx="12" fill="none" stroke="#B9BFCA" stroke-width="2" stroke-dasharray="6 5"/>
          <g class="c" style="${anim(id + "p" + i, 6, "ease-out")}"><rect x="${x}" y="36" width="70" height="84" rx="12" fill="${c}"/>
          <text x="${x + 35}" y="85" font-size="17" font-weight="800" fill="#fff" text-anchor="middle">${t}</text></g>`;
        css += pop(id + "p" + i, a, 88, 0.85);
      });
      return [b, css];
    },
  },
  {
    name: "对象移动重排", en: "Reflow", bg: CREAM, fg: INK,
    draw: (id) => {
      // 同一组对象跨句移动、让位、重排，不删掉重画
      const P = { scatter: [[70, 46], [270, 116], [176, 100]], row: [[90, 80], [180, 80], [270, 80]], swap: [[270, 80], [90, 80], [180, 80]] };
      const shapes = [`<circle r="22" fill="${CORAL}"/>`, `<rect x="-21" y="-21" width="42" height="42" rx="8" fill="${BLUE}"/>`, `<path d="M0,-24 L23,18 L-23,18 Z" fill="${GOLD}"/>`];
      let b = "", css = "";
      const tr = ([x, y]) => `transform:translate(${x}px,${y}px)`;
      shapes.forEach((s, i) => {
        b += `<g style="${anim(id + "s" + i, 7, BOUNCE)}">${s}</g>`;
        css += K(id + "s" + i, [[0, tr(P.scatter[i])], [14, tr(P.scatter[i])], [26, tr(P.row[i])], [54, tr(P.row[i])], [66, tr(P.swap[i])], [86, tr(P.swap[i])], [100, tr(P.scatter[i])]]);
      });
      ["M118,80 H150", "M208,80 H240"].forEach((d, i) => (b += `<path d="${d}" pathLength="100" stroke="${SUB}" stroke-width="2.5" stroke-linecap="round" fill="none" style="${drawn(id + "a" + i, 7)}"/>`));
      b += `<g style="${anim(id + "t", 7)}"><text x="180" y="138" font-size="13" fill="${SUB}" text-anchor="middle">同一组对象移动、让位、重排</text></g>`;
      return [b, css + draw(id + "a0", 30, 36, 82) + draw(id + "a1", 34, 40, 82) + fade(id + "t", 28, 86)];
    },
  },
  {
    name: "主角逐层换形态", en: "Protagonist", bg: "#101521", fg: "#E8ECF4",
    draw: (id) => {
      const states = [
        `<text y="20" font-size="56" font-weight="800" fill="${CORAL}" text-anchor="middle">A</text>`,
        `<text y="18" font-size="46" font-weight="800" fill="${CORAL}" text-anchor="middle" class="m">65</text>`,
        `<text y="9" font-size="21" font-weight="700" fill="${CORAL}" text-anchor="middle" class="m">0100 0001</text>`,
        [0.4, 0.9, 0.2, 0.7, 1, 0.5, 0.8, 0.3].map((h, i) => `<rect x="${-42 + i * 11}" y="${8 - 34 * h}" width="7" height="${34 * h}" rx="2" fill="${CORAL}"/>`).join(""),
      ];
      const labels = ["字母", "码位", "字节", "向量"];
      let b = `<line x1="60" y1="128" x2="300" y2="128" stroke="#2C3446" stroke-width="2"/>`, css = "";
      states.forEach((s, i) => {
        const a = i * 25, z = a + 25, n = id + "s" + i;
        b += `<circle cx="${60 + i * 80}" cy="128" r="5" fill="#2C3446"/><g transform="translate(180,62)"><g class="c" style="${anim(n, 7, OUT)}">${s}</g></g>
          <text x="180" y="110" font-size="13" fill="#8C97AB" text-anchor="middle" style="${anim(n + "l", 7, "linear")}">${labels[i]}</text>`;
        css += K(n, [[0, `opacity:${i ? 0 : 1};transform:scale(${i ? 0.5 : 1})`], ...(i ? [[a, "opacity:0;transform:scale(.5)"], [a + 5, "opacity:1;transform:scale(1)"]] : []), [z - 3, "opacity:1;transform:scale(1)"], [z, "opacity:0;transform:scale(1.4)"], [100, "opacity:0;transform:scale(1.4)"]]);
        css += i ? show(n + "l", a + 2, z) : K(n + "l", [[0, "opacity:1"], [z - 0.01, "opacity:1"], [z, "opacity:0"], [100, "opacity:0"]]);
      });
      b += `<g style="${anim(id + "m", 7, "ease-in-out")}"><circle cx="60" cy="128" r="6" fill="${CORAL}"/></g><text x="236" y="34" font-size="12" class="m" fill="${CORAL}">#4821</text>`;
      const at = (x) => `transform:translateX(${x}px)`;
      css += K(id + "m", [[0, at(0)], [20, at(0)], [25, at(80)], [45, at(80)], [50, at(160)], [70, at(160)], [75, at(240)], [95, at(240)], [100, at(0)]]);
      return [b, css];
    },
  },
  {
    name: "数据脉冲", en: "Pulse", bg: "#0F1420", fg: "#E8ECF4",
    draw: (id) => {
      const node = (x, t) => `<rect x="${x}" y="30" width="62" height="96" rx="12" fill="#1B2232" stroke="#2C3650" stroke-width="1.5"/><text x="${x + 31}" y="84" font-size="14" font-weight="700" fill="#C9D2E3" text-anchor="middle">${t}</text>`;
      const lane = (y, w, c, n, dur, delay, dir) => {
        const tail = dir > 0 ? `<rect x="-70" y="${-w}" width="70" height="${w * 2}" rx="${w}" fill="url(#${id}g${n})"/>` : `<rect x="0" y="${-w}" width="70" height="${w * 2}" rx="${w}" fill="url(#${id}g${n})"/>`;
        return `<line x1="84" y1="${y}" x2="276" y2="${y}" stroke="${c}" stroke-opacity=".18" stroke-width="${w * 2}" stroke-linecap="round"/>
          <linearGradient id="${id}g${n}" x1="${dir > 0 ? 0 : 1}" x2="${dir > 0 ? 1 : 0}"><stop offset="0" stop-color="${c}" stop-opacity="0"/><stop offset="1" stop-color="${c}"/></linearGradient>
          <g transform="translate(0,${y})"><g style="${anim(id + "m" + n, dur, "cubic-bezier(.45,0,.55,1)", delay)}">${tail}<circle r="${w + 2.5}" fill="#fff"/><circle r="${w + 6}" fill="${c}" opacity=".3"/></g></g>`;
      };
      const b = node(16, "手机") + node(282, "服务器") + lane(62, 3.5, CORAL, 0, 1.8, 0, 1) + lane(98, 1.8, "#5BC0EB", 1, 1.8, 0.9, -1) +
        `<text x="180" y="140" font-size="11" fill="#7F8BA3" text-anchor="middle">亮头＋渐隐尾巴，分车道、单向</text>`;
      const go = (n, x0, x1) => K(id + "m" + n, [[0, `transform:translateX(${x0}px);opacity:0`], [10, `transform:translateX(${x0 + 10 * Math.sign(x1 - x0)}px);opacity:1`], [85, `transform:translateX(${x1}px);opacity:1`], [100, `transform:translateX(${x1}px);opacity:0`]]);
      return [b, go(0, 84, 276) + go(1, 276, 84)];
    },
  },
  {
    name: "定位仪表", en: "ScaleBar · TimeMeter", bg: "#0E1220", fg: "#E8ECF4",
    draw: (id) => {
      const scales = ["10 cm", "34 km", "12 μm"], times = ["+0 ms", "+9 ms", "+19 ms"];
      let b = `<line x1="20" y1="22" x2="80" y2="22" stroke="#fff" stroke-width="2"/><line x1="20" y1="17" x2="20" y2="27" stroke="#fff" stroke-width="2"/><line x1="80" y1="17" x2="80" y2="27" stroke="#fff" stroke-width="2"/>
        <rect x="246" y="10" width="96" height="26" rx="6" fill="#1B2232" stroke="#2C3650"/>`, css = "";
      const scene = [
        `<rect x="160" y="52" width="40" height="72" rx="8" fill="none" stroke="#8C97AB" stroke-width="2.5"/><circle cx="180" cy="114" r="3" fill="#8C97AB"/>`,
        `<circle cx="180" cy="88" r="38" fill="none" stroke="#8C97AB" stroke-width="2.5"/><path d="M142,88 H218 M180,50 C200,70 200,106 180,126 M180,50 C160,70 160,106 180,126" fill="none" stroke="#8C97AB" stroke-width="1.6"/>`,
        `<rect x="148" y="56" width="64" height="64" rx="6" fill="none" stroke="#8C97AB" stroke-width="2.5"/>${[0, 1, 2, 3].map((k) => `<path d="M${156 + k * 16},48 v8 M${156 + k * 16},120 v8 M140,${64 + k * 16} h8 M212,${64 + k * 16} h8" stroke="#8C97AB" stroke-width="2"/>`).join("")}<rect x="166" y="74" width="28" height="28" rx="3" fill="${CORAL}" opacity=".8"/>`,
      ];
      scales.forEach((s, i) => {
        const a = (100 * i) / 3, z = (100 * (i + 1)) / 3;
        b += `<text x="88" y="27" font-size="13" font-weight="700" class="m" fill="#fff" style="${anim(id + "a" + i, 6, "linear")}">${s}</text>
          <text x="294" y="28" font-size="13" font-weight="700" class="m" fill="${GOLD}" text-anchor="middle" style="${anim(id + "a" + i, 6, "linear")}">${times[i]}</text>
          <g style="${anim(id + "c" + i, 6)}">${scene[i]}</g>`;
        css += i === 0 ? K(id + "a0", [[0, "opacity:1"], [z - 0.01, "opacity:1"], [z, "opacity:0"], [100, "opacity:0"]]) : show(id + "a" + i, a, i === 2 ? 100.01 : z);
        css += K(id + "c" + i, [[0, `opacity:${i ? 0 : 1}`], ...(i ? [[a, "opacity:0"], [a + 5, "opacity:1"]] : []), [z - 5, "opacity:1"], [z - 0.5, "opacity:0"], [100, "opacity:0"]]);
      });
      b += `<text x="180" y="146" font-size="11" fill="#7F8BA3" text-anchor="middle">仪表钉在固定层，只换数字</text>`;
      return [b, css];
    },
  },
  {
    name: "固定层不动", en: "Stage chrome", bg: CREAM, fg: INK,
    draw: (id) => {
      let b = `<rect x="18" y="8" width="7" height="28" rx="3.5" fill="${BLUE}"/><text x="34" y="30" font-size="20" font-weight="900" fill="${INK}">标题位置全程不动</text>
        <line x1="18" y1="140" x2="342" y2="140" stroke="#E2DDD3"/><text x="18" y="153" font-size="11" fill="${SUB}">页脚 · 来源说明</text><text x="342" y="153" font-size="11" fill="${SUB}" text-anchor="end">3 / 7</text>`, css = "";
      const pages = [
        [44, 66, 50, 82].map((h, i) => `<rect x="${70 + i * 58}" y="${128 - h}" width="34" height="${h}" rx="4" fill="${i === 3 ? CORAL : "#A9B8D6"}"/>`).join(""),
        `<circle cx="180" cy="86" r="34" fill="none" stroke="#E2E6EE" stroke-width="14"/><circle cx="180" cy="86" r="34" fill="none" stroke="${BLUE}" stroke-width="14" stroke-dasharray="150 214" transform="rotate(-90 180 86)"/><text x="180" y="92" font-size="16" font-weight="800" fill="${INK}" text-anchor="middle">70%</text>`,
        [0, 1, 2].map((k) => `<circle cx="96" cy="${62 + k * 26}" r="6" fill="${GREEN}"/>${bar(112, 58 + k * 26, [150, 120, 170][k], "#D6D1C7", 8)}`).join(""),
      ];
      pages.forEach((p, i) => {
        const a = (100 * i) / 3, z = a + 100 / 3;
        b += `<g style="${anim(id + "p" + i, 7.5, "ease-in-out")}">${p}</g>`;
        // 先淡出旧内容，再淡入新内容，不叠化
        css += K(id + "p" + i, [[0, `opacity:${i ? 0 : 1}`], ...(i ? [[a, "opacity:0"], [a + 4, "opacity:1"]] : []), [z - 4, "opacity:1"], [z, "opacity:0"], [100, "opacity:0"]]);
      });
      return [b, css];
    },
  },
  {
    name: "背景柔光漂浮", en: "Ambient", bg: "#F6F3FC", fg: INK,
    draw: (id) => {
      const blobs = [[80, 50, 46, "#B9A8FF", 6], [290, 110, 52, "#FFC2D4", 7.5], [210, 30, 34, "#A8E6DA", 5.5], [40, 130, 30, "#FFD9A0", 6.5]];
      let b = `<filter id="${id}b" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="16"/></filter>`, css = "";
      blobs.forEach(([x, y, r, c, d], i) => {
        b += `<g style="${anim(id + "f" + i, d, "ease-in-out", 0, "alternate")}"><circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity=".8" filter="url(#${id}b)"/></g>`;
        const dx = [26, -30, 22, 18][i], dy = [14, -12, 18, -16][i];
        css += K(id + "f" + i, [[0, "transform:translate(0,0)"], [100, `transform:translate(${dx}px,${dy}px)`]]);
      });
      b += `${card(98, 40, 164, 78, 14)}<text x="180" y="76" font-size="16" font-weight="800" fill="${INK}" text-anchor="middle">主体停住供阅读</text><text x="180" y="98" font-size="12" fill="${SUB}" text-anchor="middle">背景很轻地漂</text>`;
      return [b, css];
    },
  },
  {
    name: "圆形转场", en: "Iris", bg: CREAM, fg: INK,
    draw: (id) => {
      const spl = "0 0 1 1;.55 0 .25 1;0 0 1 1;0 0 1 1;0 0 1 1";
      const b = `${card(30, 20, 300, 116, 14)}${bar(52, 42, 140, INK, 10)}${bar(52, 64, 200)}${bar(52, 80, 160, "#E8E3DA")}
        <circle cx="262" cy="108" r="13" fill="${CORAL}"/><circle cx="262" cy="108" r="20" fill="none" stroke="${CORAL}" stroke-opacity=".35" stroke-width="2"/>
        <clipPath id="${id}c"><circle cx="262" cy="108" r="0"><animate attributeName="r" dur="4.5s" repeatCount="indefinite" values="0;0;380;380;0;0" keyTimes="0;.32;.48;.9;.9001;1" calcMode="spline" keySplines="${spl}"/></circle></clipPath>
        <g clip-path="url(#${id}c)" style="${anim(id + "o", 4.5, "linear")}"><rect width="360" height="156" fill="#1C2230"/>
          <text x="40" y="66" font-size="26" font-weight="900" fill="#fff">新的一段</text>${bar(42, 84, 180, "#3A4459", 9)}${bar(42, 102, 120, "#323B4E", 9)}
          <circle cx="292" cy="70" r="26" fill="${CORAL}" opacity=".9"/></g>
        <circle cx="262" cy="108" r="0" fill="none" stroke="${CORAL}" stroke-width="7"><animate attributeName="r" dur="4.5s" repeatCount="indefinite" values="0;0;380;380;0;0" keyTimes="0;.32;.48;.9;.9001;1" calcMode="spline" keySplines="${spl}"/>
          <animate attributeName="opacity" dur="4.5s" repeatCount="indefinite" values="0;0;1;0;0" keyTimes="0;.32;.34;.48;1"/></circle>`;
      return [b, K(id + "o", [[0, "opacity:1"], [86, "opacity:1"], [90, "opacity:0"], [100, "opacity:0"]])];
    },
  },
  {
    name: "推进换场", en: "ZoomThrough", bg: "#131824", fg: "#E8ECF4",
    draw: (id) => {
      let racks = "";
      [102, 140, 178, 216, 254].forEach((x, i) => {
        racks += `<rect x="${x - 14}" y="66" width="28" height="40" rx="2" fill="${i === 3 ? "#26314A" : "#1F2738"}" stroke="${i === 3 ? "#5D6B8C" : "#2E3850"}" stroke-width="1"/>`;
        for (let k = 0; k < 5; k++) racks += `<rect x="${x - 10}" y="${70 + k * 7}" width="20" height="4" rx="1" fill="#2F3B55"/>`;
      });
      let leds = "";
      for (let k = 0; k < 5; k++) leds += `<circle cx="${223}" cy="${72 + k * 7}" r=".9" fill="${k === 2 ? CORAL : "#4ADE80"}" style="${anim(id + "led", 0.8 + k * 0.13, "steps(1,end)")}"/>`;
      const b = `<g style="transform-origin:216px 86px;${anim(id + "z", 6, "cubic-bezier(.65,0,.35,1)")}">
          <path d="M60,106 H300" stroke="#2E3850" stroke-width="2"/>${racks}<g style="${anim(id + "l", 6)}">${leds}</g>
          <rect x="198" y="60" width="36" height="52" rx="4" fill="none" stroke="${CORAL}" stroke-width="1.6" style="${anim(id + "f", 6)}"/></g>
        <g style="${anim(id + "t1", 6, "linear")}"><text x="18" y="24" font-size="13" font-weight="700" fill="#8C97AB">机房</text></g>
        <g style="${anim(id + "t2", 6)}"><rect x="8" y="8" width="176" height="42" rx="8" fill="#131824" opacity=".88"/><text x="18" y="24" font-size="13" font-weight="700" fill="#fff">第 4 号机柜</text><text x="18" y="42" font-size="11" fill="${CORAL}">推近后它就是新场景的主体</text></g>`;
      const s = (k) => `transform:scale(${k})`;
      return [b, K(id + "z", [[0, s(1)], [30, s(1)], [52, s(3.4)], [88, s(3.4)], [96, s(1)], [100, s(1)]]) + fade(id + "f", 12, 40) + fade(id + "l", 50, 86) + K(id + "t1", [[0, "opacity:1"], [36, "opacity:1"], [40, "opacity:0"], [94, "opacity:0"], [98, "opacity:1"], [100, "opacity:1"]]) + fade(id + "t2", 52, 84)];
    },
  },
  {
    name: "整页滑入", en: "Slide", bg: "#EEF1F6", fg: INK,
    draw: (id) => {
      const page = (c, t) => `${card(24, 14, 312, 128, 14)}<rect x="24" y="14" width="312" height="34" rx="14" fill="${c}"/><rect x="24" y="34" width="312" height="14" fill="${c}"/>
        <text x="42" y="37" font-size="15" font-weight="800" fill="#fff">${t}</text>${bar(42, 66, 220)}${bar(42, 84, 180, "#E8E3DA")}${bar(42, 102, 240, "#E8E3DA")}`;
      const x = (v, o = 1) => `transform:translateX(${v}px);opacity:${o}`;
      const b = `<g style="${anim(id + "a", 4, "cubic-bezier(.4,0,.2,1)")}">${page(BLUE, "第一页")}</g><g style="${anim(id + "b", 4, "cubic-bezier(.4,0,.2,1)")}">${page(CORAL, "第二页")}</g>`;
      // 6～8 帧的快速整页切换
      return [b, K(id + "a", [[0, x(0)], [40, x(0)], [46, x(-380)], [47, x(-380, 0)], [89, x(380, 0)], [90, x(380)], [96, x(0)], [100, x(0)]]) +
        K(id + "b", [[0, x(380, 0)], [39, x(380, 0)], [40, x(380)], [46, x(0)], [90, x(0)], [96, x(-380)], [97, x(-380, 0)], [100, x(380, 0)]])];
    },
  },
  {
    name: "翻页", en: "Flip", bg: "#EEF1F6", fg: INK,
    draw: (id) => {
      const page = (c, t) => `${card(70, 14, 220, 128, 12)}<rect x="88" y="32" width="70" height="70" rx="10" fill="${c}"/><text x="174" y="56" font-size="18" font-weight="900" fill="${INK}">${t}</text>${bar(174, 70, 96)}${bar(174, 86, 70, "#E8E3DA")}${bar(88, 118, 180, "#E8E3DA")}`;
      const b = `<g style="transform-origin:180px 78px;${anim(id + "a", 4, "ease-in")}">${page(BLUE, "上一页")}</g><g style="transform-origin:180px 78px;${anim(id + "b", 4, "ease-out")}">${page(GREEN, "下一页")}</g>`;
      const s = (k, o = 1) => `transform:scaleX(${k});opacity:${o}`;
      return [b, K(id + "a", [[0, s(1)], [40, s(1)], [44, s(0)], [44.1, s(0, 0)], [92, s(0, 0)], [92.1, s(0)], [96, s(1)], [100, s(1)]]) +
        K(id + "b", [[0, s(0, 0)], [44, s(0, 0)], [44.1, s(0)], [48, s(1)], [88, s(1)], [92, s(0)], [92.1, s(0, 0)], [100, s(0, 0)]])];
    },
  },
  {
    name: "路线回顾", en: "RouteRecap", bg: "#0F1420", fg: "#E8ECF4",
    draw: (id) => {
      const st = [[36, 116, "键盘"], [104, 54, "路由"], [176, 104, "机房"], [248, 48, "GPU"], [322, 100, "屏幕"]];
      const d = "M36,116 C64,116 76,54 104,54 S150,104 176,104 S220,48 248,48 S300,100 322,100";
      let b = `<path d="${d}" pathLength="100" fill="none" stroke="#3A4560" stroke-width="2.5" stroke-dasharray="100" style="${anim(id + "p", 6, "ease-in-out")}"/>`, css = draw(id + "p", 4, 34, 90);
      st.forEach(([x, y, t], i) => {
        const a = 42 + i * 7;
        b += `<circle cx="${x}" cy="${y}" r="9" fill="#1B2232" stroke="#3A4560" stroke-width="2"/><circle cx="${x}" cy="${y}" r="9" fill="${CORAL}" style="${anim(id + "s" + i, 6)}"/>
          <text x="${x}" y="${y + (i % 2 ? -16 : 26)}" font-size="12" fill="#B5BED0" text-anchor="middle">${t}</text>`;
        css += fade(id + "s" + i, a, 88, "transform:none", "transform:none", 2);
      });
      b += `<g opacity="0"><circle r="6" fill="#fff"/><circle r="11" fill="${CORAL}" opacity=".35"/>
        <animateMotion dur="6s" repeatCount="indefinite" path="${d}" keyPoints="0;0;1;1" keyTimes="0;.4;.72;1" calcMode="linear"/>
        <animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;.38;.41;.86;.9;1"/></g>`;
      return [b, css];
    },
  },
];

// ---------- 开发实录组件与片尾（src/kit/dev.tsx、Outro.tsx） ----------
const XC = { bg: "#1F1F24", num: "#6C7086", kw: "#FC5FA3", type: "#D0A8FF", decl: "#5DD8FF", str: "#FC6A5D", fn: "#67B7A4", txt: "#E6E6EA" };
const codeLine = (x, y, toks, cw) => {
  let s = "", i = 0;
  toks.forEach(([t, c]) => { s += `<text x="${(x + i * cw).toFixed(1)}" y="${y}" font-size="13" fill="${c}" class="m" xml:space="preserve">${esc(t)}</text>`; i += t.length; });
  return s;
};
// 逐字打出一行带颜色的代码
const typeTokens = (id, toks, o) => {
  const chars = [], colors = [];
  toks.forEach(([t, c]) => [...t].forEach((ch) => { chars.push(ch); colors.push(c); }));
  return typeChars(id, chars, { ...o, size: 13, cls: "m", colors });
};

export const dev = [
  {
    name: "代码编辑器", en: "CodeEditor", bg: "#2A2A30", fg: "#E6E6EA",
    draw: (id) => {
      const cw = 7.8, x0 = 50, ly = (k) => 28 + k * 20;
      const L = [
        [["struct", XC.kw], [" ", XC.txt], ["Card", XC.decl], [": ", XC.txt], ["View", XC.type], [" {", XC.txt]],
        [["    ", XC.txt], ["var", XC.kw], [" body: ", XC.txt], ["some", XC.kw], [" ", XC.txt], ["View", XC.type], [" {", XC.txt]],
        [["        ", XC.txt], ["Text", XC.type], ["(", XC.txt], ['"SayShow"', XC.str], [")", XC.txt]],
      ];
      const ins = [["            ", XC.txt], [".font", XC.fn], ["(.", XC.txt], ["title", XC.fn], [")", XC.txt]];
      const t = typeTokens(id, ins, { dur: 6, x: x0, y: ly(3), cw, a: 24, b: 50, hide: 92 });
      const num = (k, n) => `<text x="36" y="${ly(k)}" font-size="13" fill="${XC.num}" text-anchor="end" class="m">${n}</text>`;
      const b = `<rect x="12" y="8" width="336" height="140" rx="10" fill="${XC.bg}"/>
        <rect x="12" y="${ly(3) - 14}" width="336" height="20" fill="#fff" opacity=".07" style="${anim(id + "h", 6)}"/><rect x="12" y="${ly(3) - 14}" width="3" height="20" fill="${CORAL}" style="${anim(id + "h", 6)}"/>
        ${L.map((l, k) => num(k, k + 1) + codeLine(x0, ly(k), l, cw)).join("")}
        <g style="${anim(id + "n1", 6, "linear")}">${num(3, 4)}${num(4, 5)}</g><g style="${anim(id + "n2", 6, "linear")}">${num(3, 4)}${num(4, 5)}${num(5, 6)}</g>
        <g style="${anim(id + "mv", 6, OUT)}">${codeLine(x0, ly(3), [["    }", XC.txt]], cw)}${codeLine(x0, ly(4), [["}", XC.txt]], cw)}</g>
        ${t.body}<g style="${anim(id + "k", 6, "linear")}"><rect x="${x0 + 12 * cw}" y="${ly(3) - 12}" width="2" height="16" fill="#fff" style="${anim(id + "bl", 0.8, "steps(1,end)")}"/></g>`;
      const mv = (y) => `transform:translateY(${y}px)`;
      return [b, t.css + fade(id + "h", 56, 86) + K(id + "n1", [[0, "opacity:1"], [19.99, "opacity:1"], [20, "opacity:0"], [93.99, "opacity:0"], [94, "opacity:1"], [100, "opacity:1"]]) +
        show(id + "n2", 20, 94) + K(id + "mv", [[0, mv(0)], [14, mv(0)], [20, mv(20)], [92, mv(20)], [96, mv(0)], [100, mv(0)]]) +
        K(id + "k", caretStops(ins.reduce((s, [x]) => s + x.length, 0) - 12, 24 + (26 * 12) / 25, 50, cw, 92)) + K(id + "bl", [[0, "opacity:1"], [50, "opacity:0"], [100, "opacity:0"]])];
    },
  },
  {
    name: "快捷键键帽", en: "KeyCaps", bg: "#2A2D35", fg: "#E6E9EF",
    draw: (id) => {
      let bg = "";
      for (let k = 0; k < 6; k++) bg += bar(24, 14 + k * 22, [120, 200, 90, 160, 220, 130][k], "#3A3F4B", 8);
      let keys = "", css = "";
      ["⌘", "⇧", "O"].forEach((c, i) => {
        const x = 104 + i * 54, a = 18 + i * 6;
        keys += `<rect x="${x}" y="44" width="44" height="46" rx="9" fill="#AEB4C2"/><g style="${anim(id + "k" + i, 4.5, "ease-out")}"><rect x="${x}" y="40" width="44" height="44" rx="9" fill="#fff"/>
          <text x="${x + 22}" y="70" font-size="22" font-weight="700" fill="${INK}" text-anchor="middle" class="m">${c}</text></g>`;
        const u = "transform:translateY(0)", d = "transform:translateY(4px)";
        css += K(id + "k" + i, [[0, u], [a, u], [a + 2, d], [a + 7, d], [a + 9, u], [100, u]]);
      });
      const b = `${bg}<rect width="360" height="156" fill="#2A2D35" opacity=".55"/><g style="${anim(id + "g", 4.5)}">${keys}
        <g style="${anim(id + "l", 4.5, OUT)}"><rect x="125" y="104" width="110" height="30" rx="8" fill="${PURPLE}"/><text x="180" y="124" font-size="14" font-weight="700" fill="#fff" text-anchor="middle">快速打开</text></g></g>`;
      return [b, css + fade(id + "g", 6, 86) + fade(id + "l", 40, 86, "transform:translateY(6px)", "transform:translateY(0)")];
    },
  },
  {
    name: "录屏推近", en: "ScreenClip", bg: "#E9ECF1", fg: INK,
    draw: (id) => {
      let ui = `<rect x="20" y="8" width="320" height="140" fill="#F7F8FA"/><rect x="20" y="8" width="70" height="140" fill="#E6E9EF"/><rect x="90" y="8" width="250" height="22" fill="#FFFFFF"/>
        <rect x="300" y="13" width="34" height="13" rx="4" fill="${BLUE}"/><text x="317" y="23" font-size="8" font-weight="700" fill="#fff" text-anchor="middle">导出</text>`;
      for (let k = 0; k < 6; k++) ui += bar(28, 18 + k * 14, [46, 38, 50, 32, 44, 36][k], k === 1 ? "#B9C6E6" : "#D3D8E1", 6);
      for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) ui += `<rect x="${100 + c * 80}" y="${40 + r * 52}" width="70" height="44" rx="6" fill="${["#DCE4F5", "#F5E1DA", "#DDF0E6"][(r + c) % 3]}"/>`;
      const b = `<clipPath id="${id}c"><rect x="20" y="8" width="320" height="140" rx="12"/></clipPath>
        <g clip-path="url(#${id}c)"><g style="transform-origin:0 0;${anim(id + "z", 6, "cubic-bezier(.45,0,.2,1)")}">${ui}</g></g>
        <rect x="20" y="8" width="320" height="140" rx="12" fill="none" stroke="#C9CED8" stroke-width="1.5"/>
        <g style="${anim(id + "r", 6, OUT)}"><rect x="236" y="14" width="98" height="44" rx="12" fill="none" stroke="${CORAL}" stroke-width="3.5"/></g>
        <g style="${anim(id + "s", 6)}"><rect x="30" y="118" width="70" height="22" rx="11" fill="${INK}"/><text x="65" y="133" font-size="11" font-weight="700" fill="#fff" text-anchor="middle">4× 快进</text></g>`;
      const z = "transform:translate(-476px,-11.2px) scale(2.4)", o = "transform:translate(0,0) scale(1)";
      return [b, K(id + "z", [[0, o], [30, o], [46, z], [86, z], [95, o], [100, o]]) + fade(id + "r", 50, 84, "transform:scale(1.15)", "transform:scale(1)") + fade(id + "s", 4, 22)];
    },
  },
  {
    name: "iPhone 外框", en: "PhoneFrame", bg: "#EEF0F5", fg: INK,
    draw: (id) => {
      const h = 130, w = h * (1179 / 2556), x = 180 - w / 2, y = 13;
      let list = "";
      for (let k = 0; k < 10; k++) list += `<rect x="${x + 5}" y="${y + 22 + k * 22}" width="${w - 10}" height="17" rx="4" fill="${["#DCE4F5", "#F5E1DA", "#DDF0E6", "#EFE6FA"][k % 4]}"/>`;
      const b = `<rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" rx="${h * 0.075}" fill="#111" stroke="#3A3A3F" stroke-width="1.5"/>
        <clipPath id="${id}s"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h * 0.062}"/></clipPath>
        <g clip-path="url(#${id}s)"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff"/><g style="${anim(id + "sc", 6, "cubic-bezier(.3,0,.2,1)")}">${list}</g>
          <rect x="${x}" y="${y}" width="${w}" height="16" fill="#fff"/><text x="${x + 7}" y="${y + 11}" font-size="6" font-weight="700" fill="${INK}">9:41</text></g>
        <rect x="${180 - w * 0.15}" y="${y + h * 0.012}" width="${w * 0.3}" height="${h * 0.037}" rx="2.4" fill="#000"/>
        <path d="M${x + w + 8},60 H246" stroke="${SUB}" stroke-width="1.2"/><text x="250" y="64" font-size="12" fill="${SUB}">模拟器录屏</text>
        <path d="M${x - 8},100 H112" stroke="${SUB}" stroke-width="1.2"/><text x="108" y="104" font-size="12" fill="${SUB}" text-anchor="end">灵动岛外框</text>`;
      const t = (v) => `transform:translateY(${v}px)`;
      return [b, K(id + "sc", [[0, t(0)], [20, t(0)], [34, t(-66)], [56, t(-66)], [70, t(-132)], [90, t(-132)], [98, t(0)], [100, t(0)]])];
    },
  },
  {
    name: "章节标签", en: "ChapterTag", bg: "#1B2233", fg: "#E8ECF4",
    draw: (id) => {
      let bg = `<rect width="360" height="156" fill="url(#${id}g)"/><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2B3A55"/><stop offset="1" stop-color="#151B28"/></linearGradient>`;
      for (let k = 0; k < 6; k++) bg += bar(24, 14 + k * 22, [120, 200, 90, 160, 220, 130][k], "#34425E", 8);
      const b = `${bg}<g style="${anim(id + "t", 4.5, BOUNCE)}"><rect x="96" y="40" width="168" height="44" fill="#14161C" fill-opacity=".6" stroke="#fff" stroke-width="2.5"/>
        <text x="180" y="70" font-size="22" font-weight="700" fill="#fff" text-anchor="middle" letter-spacing="1">1.显式动画</text>
        <text x="180" y="104" font-size="12" font-weight="700" fill="#fff" fill-opacity=".85" text-anchor="middle" letter-spacing=".5">Explicit Animation</text></g>`;
      return [b, fade(id + "t", 10, 86, "transform:translateX(40px)", "transform:translateX(0)", 10)];
    },
  },
  {
    name: "一键三连片尾", en: "Outro", bg: "#FFF6EB", fg: INK,
    draw: (id) => {
      const heart = "M12 21s-7.5-4.6-9.6-9.2C.9 8.5 3 5 6.4 5c2 0 3.4 1.1 4.1 2.3h3C14.2 6.1 15.6 5 17.6 5 21 5 23.1 8.5 21.6 11.8 19.5 16.4 12 21 12 21z";
      const star = "M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z";
      const icon = (k, c, m) => k === 2 ? `<circle cx="12" cy="12" r="10" fill="${c}"/><path d="M12 7v10M7 12h10" stroke="${m}" stroke-width="2.6" stroke-linecap="round"/>` : `<path d="${k ? star : heart}" fill="${c}"/>`;
      let btns = "", css = "";
      [["点赞", PINK], ["收藏", GOLD], ["关注", BLUE]].forEach(([t, c], i) => {
        const x = 150 + i * 70, a = 40 + i * 4;
        btns += `<rect x="${x}" y="64" width="62" height="32" rx="16" fill="#fff" stroke="#EADFCF"/><g transform="translate(${x + 8},71) scale(.75)">${icon(i, "#C3C9D4", "#fff")}</g><text x="${x + 31}" y="85" font-size="12" font-weight="700" fill="#8C95A6">${t}</text>
          <g class="c" style="${anim(id + "b" + i, 5, BOUNCE)}"><rect x="${x}" y="64" width="62" height="32" rx="16" fill="${c}"/><g transform="translate(${x + 8},71) scale(.75)">${icon(i, "#fff", c)}</g><text x="${x + 31}" y="85" font-size="12" font-weight="700" fill="#fff">${t}</text></g>`;
        for (let k = 0; k < 6; k++) {
          const ang = (k / 6) * Math.PI * 2, n = `${id}p${i}`;
          btns += `<g transform="translate(${x + 31},80)"><circle r="2.6" fill="${c}" style="--x:${(Math.cos(ang) * 30).toFixed(1)}px;--y:${(Math.sin(ang) * 26).toFixed(1)}px;${anim(n, 5, "ease-out")}"/></g>`;
        }
        css += pop(id + "b" + i, a, 88, 0.7) + K(`${id}p${i}`, [[0, "opacity:0;transform:translate(0,0)"], [a, "opacity:0;transform:translate(0,0)"], [a + 1, "opacity:1;transform:translate(0,0)"], [a + 9, "opacity:0;transform:translate(var(--x),var(--y))"], [100, "opacity:0;transform:translate(var(--x),var(--y))"]]);
      });
      const b = `<g class="c" style="${anim(id + "av", 5)}"><circle cx="78" cy="80" r="47" fill="#fff" filter="url(#${id}s)"/><circle cx="78" cy="80" r="42" fill="url(#${id}g)"/>
          <circle cx="78" cy="70" r="14" fill="#fff" opacity=".92"/><path d="M52,112 C56,92 100,92 104,112 Z" fill="#fff" opacity=".92"/></g>
        <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFC9A3"/><stop offset="1" stop-color="#8FB3FF"/></linearGradient>
        <filter id="${id}s" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#5A3A10" flood-opacity=".14"/></filter>
        <g style="${anim(id + "t", 5)}"><text x="150" y="48" font-size="20" font-weight="900" fill="${INK}">觉得有用就一键三连</text></g>${btns}
        <g style="${anim(id + "y", 5, OUT)}"><text x="150" y="132" font-size="22" font-weight="900" fill="${INK}">下一期<tspan fill="${PINK}">见</tspan></text></g>
        <rect width="360" height="156" fill="#FFF6EB" style="${anim(id + "e", 5)}"/>`;
      return [b, css + K(id + "av", [[0, "transform:scale(0)"], [4, "transform:scale(1.12)"], [8, "transform:scale(.95)"], [12, "transform:scale(1)"], [100, "transform:scale(1)"]]) + fade(id + "t", 12, 100 - 5.01) +
        fade(id + "y", 60, 100 - 5.01, "transform:translateY(-16px)", "transform:translateY(0)") + K(id + "e", [[0, "opacity:0"], [90, "opacity:0"], [98, "opacity:1"], [100, "opacity:1"]])];
    },
  },
];
