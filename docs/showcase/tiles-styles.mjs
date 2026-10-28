// 风格库 30 种风格的小样（编号与 references/style-library.md 一致）
// 每格只演示该风格的视觉要点；三维、着色器类风格这里用平面示意，成片按风格库里的实现方式制作
import { INK, SUB, CORAL, BLUE, PURPLE, GREEN, GOLD, PINK, K, anim, OUT, BOUNCE, pop, fade, show, draw, drawn, rand, typeChars, caretStops, SERIF } from "./lib.mjs";

const DECK = "0 -2 362 156"; // 10.23 分享页小样原坐标（362×132，内容在 y 10…142）

// 10.23 分享页小样共用的关键帧
export const deckCss = [
  "@keyframes d-pop{0%,6%{transform:scale(0);opacity:0}14%{transform:scale(1.14)}20%,62%{transform:scale(1);opacity:1}72%,100%{transform:scale(.55);opacity:0}}",
  "@keyframes d-badge{0%,62%{transform:scale(0);opacity:0}70%{transform:scale(1.18)}76%,92%{transform:scale(1);opacity:1}100%{transform:scale(1);opacity:0}}",
  "@keyframes d-rise{0%,8%{transform:translateY(34px);opacity:0}24%,70%{transform:translateY(0);opacity:1}86%,100%{transform:translateY(34px);opacity:0}}",
  "@keyframes d-bar{0%,8%{transform:scaleY(.04)}30%,72%{transform:scaleY(1)}90%,100%{transform:scaleY(.04)}}",
  "@keyframes d-draw{0%,6%{stroke-dashoffset:var(--L)}46%,74%{stroke-dashoffset:0}92%,100%{stroke-dashoffset:var(--L)}}",
  "@keyframes d-slam{0%,6%{transform:scale(1.6);opacity:0}16%{transform:scale(.94);opacity:1}24%,66%{transform:scale(1);opacity:1}76%,100%{transform:scale(.7);opacity:0}}",
  "@keyframes d-slide{0%,10%{transform:translateX(-46px);opacity:0}26%,68%{transform:translateX(0);opacity:1}84%,100%{transform:translateX(46px);opacity:0}}",
  "@keyframes d-spin{to{transform:rotate(360deg)}}",
  "@keyframes d-spinr{to{transform:rotate(-360deg)}}",
  "@keyframes d-beat{0%,100%{transform:rotate(0)}25%{transform:rotate(90deg)}50%{transform:rotate(180deg)}75%{transform:rotate(270deg)}}",
  "@keyframes d-scan{0%{transform:translateY(-20%)}100%{transform:translateY(120%)}}",
  "@keyframes d-blink{0%,49%{opacity:1}50%,100%{opacity:0}}",
  "@keyframes d-swgrid{to{transform:translateY(10px)}}",
].join("");

// 在多边形边上均匀取 n 个点（形变用，起点都在正上方附近）
const sample = (pts, n) => {
  const seg = pts.map((p, i) => [p, pts[(i + 1) % pts.length]]);
  const len = seg.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]));
  const total = len.reduce((s, x) => s + x, 0);
  const out = [];
  for (let k = 0; k < n; k++) {
    let d = (total * k) / n, i = 0;
    while (d > len[i]) d -= len[i++];
    const [a, b] = seg[i], t = d / len[i];
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return out.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
};
const circlePts = (cx, cy, r, n) => Array.from({ length: n }, (_, k) => [cx + r * Math.sin((k / n) * 2 * Math.PI), cy - r * Math.cos((k / n) * 2 * Math.PI)]);
const burst = (cx, cy, r1, r2, n) => Array.from({ length: n * 2 }, (_, k) => { const a = (k / (n * 2)) * 2 * Math.PI, r = k % 2 ? r2 : r1; return `${(cx + r * Math.sin(a)).toFixed(1)},${(cy - r * Math.cos(a)).toFixed(1)}`; }).join(" ");

export const styles = [
  // ---------- 一、商业动态图形 ----------
  {
    name: "01 扁平 MG", en: "Flat Motion", bg: "#FDF3E3", fg: "#8A5A12", vb: DECK,
    draw: () => {
      let g = "";
      [["#f0a93b", 46], ["#e4683c", 150], ["#3f8fd8", 254]].forEach(([c, x], i) => (g += `<rect class="c" x="${x}" y="52" width="62" height="48" rx="11" fill="${c}" style="animation:d-pop 4s ${i * 0.16}s infinite"/>`));
      g += `<g class="c" style="animation:d-badge 4s infinite"><circle cx="181" cy="76" r="27" fill="#2f7d55"/><path d="M169,77 l8,8 l16,-18" stroke="#fff" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;
      return [g, ""];
    },
  },
  {
    name: "02 Logo 形变", en: "Logo Morph", bg: "#111318", fg: "#E6E9EF",
    draw: (id) => {
      const n = 36, cx = 120, cy = 78;
      const shapes = [
        sample(circlePts(cx, cy, 4, 12), n),
        sample([[cx - 60, cy - 3], [cx + 60, cy - 3], [cx + 60, cy + 3], [cx - 60, cy + 3]].map(([x, y]) => [x, y]), n),
        sample([[cx, cy - 32], [cx + 32, cy - 32], [cx + 32, cy + 32], [cx - 32, cy + 32], [cx - 32, cy - 32]], n),
        sample([[cx, cy - 36], [cx + 36, cy + 28], [cx - 36, cy + 28]], n),
        sample(circlePts(cx, cy, 34, 72), n),
      ];
      const vals = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 0].map((k) => shapes[k]).join(";");
      const kt = "0;.06;.16;.24;.34;.42;.52;.6;.7;.9;1";
      const cols = ["#fff", "#fff", "#5BC0EB", "#5BC0EB", "#F2A33A", "#F2A33A", "#E8603C", "#E8603C", "#7457E0", "#7457E0", "#fff"].join(";");
      const b = `<polygon points="${shapes[0]}" fill="#fff"><animate attributeName="points" dur="6s" repeatCount="indefinite" values="${vals}" keyTimes="${kt}" calcMode="spline" keySplines="${Array(10).fill(".6 0 .2 1").join(";")}"/>
          <animate attributeName="fill" dur="6s" repeatCount="indefinite" values="${cols}" keyTimes="${kt}"/></polygon>
        <clipPath id="${id}c"><rect x="160" y="0" width="200" height="156"/></clipPath>
        <g clip-path="url(#${id}c)"><g style="${anim(id + "t", 6, OUT)}"><text x="168" y="90" font-size="34" font-weight="900" fill="#fff" letter-spacing="-.5">SayShow</text></g></g>`;
      return [b, fade(id + "t", 72, 90, "transform:translateX(-110px)", "transform:translateX(0)", 8)];
    },
  },
  {
    name: "03 等轴 2.5D", en: "Isometric", bg: "#0F1B26", fg: "#8FC4EE", vb: DECK,
    draw: () => {
      let g = "", k = 0;
      for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
        const cx = 150 + (c - r) * 46, cy = 52 + (c + r) * 22, h = 20;
        g += `<g class="c" style="animation:d-rise 4s ${(k++) * 0.1}s infinite">
          <polygon points="${cx - 26},${cy} ${cx},${cy + 13} ${cx},${cy + 13 + h} ${cx - 26},${cy + h}" fill="#2f6fa8"/>
          <polygon points="${cx + 26},${cy} ${cx},${cy + 13} ${cx},${cy + 13 + h} ${cx + 26},${cy + h}" fill="#24557f"/>
          <polygon points="${cx},${cy - 13} ${cx + 26},${cy} ${cx},${cy + 13} ${cx - 26},${cy}" fill="#4f9ad6"/></g>`;
      }
      return [g, ""];
    },
  },
  {
    name: "04 数据新闻", en: "Data Story", bg: "#F7F9FC", fg: "#44546A", vb: DECK,
    draw: () => {
      let g = `<line x1="40" y1="118" x2="326" y2="118" stroke="#cbd5e1" stroke-width="2"/>`;
      [38, 66, 52, 92, 74].forEach((h, i) => (g += `<rect x="${58 + i * 54}" y="${118 - h}" width="34" height="${h}" rx="4" fill="${i === 3 ? "#e4683c" : "#3f8fd8"}" style="transform-box:fill-box;transform-origin:bottom;animation:d-bar 4s ${i * 0.1}s infinite"/>`));
      g += `<path d="M75,78 L129,50 L183,66 L237,28 L291,46" stroke="#f0a93b" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="--L:300;stroke-dasharray:300;animation:d-draw 4s .3s infinite"/>`;
      return [g, ""];
    },
  },
  {
    name: "05 产品界面演示", en: "Product UI", bg: "#E9EDF4", fg: INK,
    draw: (id) => {
      const panel = (dark) => {
        const bg = dark ? "#1C2230" : "#fff", tx = dark ? "#F2F4F8" : INK, ln = dark ? "#2C3446" : "#EEF0F4";
        return `<rect x="96" y="12" width="168" height="132" rx="16" fill="${bg}" ${dark ? "" : 'stroke="#DDE1E8"'}/>
          <text x="114" y="38" font-size="15" font-weight="800" fill="${tx}">设置</text>
          ${["通知", "声音", "深色模式"].map((t, k) => `<text x="114" y="${68 + k * 28}" font-size="13" fill="${tx}">${t}</text><line x1="114" y1="${76 + k * 28}" x2="246" y2="${76 + k * 28}" stroke="${ln}"/>`).join("")}
          <rect x="214" y="57" width="32" height="18" rx="9" fill="${GREEN}"/><circle cx="237" cy="66" r="7" fill="#fff"/>
          <rect x="214" y="85" width="32" height="18" rx="9" fill="${dark ? "#3A4459" : "#D5D9E0"}"/><circle cx="223" cy="94" r="7" fill="#fff"/>
          <rect x="214" y="113" width="32" height="18" rx="9" fill="${dark ? GREEN : "#D5D9E0"}"/><circle cx="${dark ? 237 : 223}" cy="122" r="7" fill="#fff"/>`;
      };
      const spl = "0 0 1 1;.5 0 .25 1;0 0 1 1;0 0 1 1;0 0 1 1";
      const b = `${panel(false)}
        <g style="${anim(id + "on", 5)}"><rect x="214" y="113" width="32" height="18" rx="9" fill="${GREEN}"/></g>
        <g style="${anim(id + "kn", 5, OUT)}"><circle cx="223" cy="122" r="7" fill="#fff"/></g>
        <clipPath id="${id}c"><circle cx="230" cy="122" r="0"><animate attributeName="r" dur="5s" repeatCount="indefinite" values="0;0;220;220;0;0" keyTimes="0;.46;.62;.92;.9201;1" calcMode="spline" keySplines="${spl}"/></circle></clipPath>
        <g clip-path="url(#${id}c)" style="${anim(id + "dk", 5, "linear")}"><rect width="360" height="156" fill="#0F131C"/>${panel(true)}</g>
        <g class="c" style="${anim(id + "rp", 5, "ease-out")}"><circle cx="232" cy="124" r="16" fill="none" stroke="${BLUE}" stroke-width="2"/></g>
        <g style="${anim(id + "cu", 5, "cubic-bezier(.45,0,.2,1)")}"><path d="M0,0 L0,18 L5,13.5 L8.5,21.5 L11.5,20 L8,12.5 L14.5,12.5 Z" fill="${INK}" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/></g>
        <g style="${anim(id + "nt", 5, OUT)}"><rect x="118" y="4" width="124" height="26" rx="13" fill="#fff" stroke="#DDE1E8"/><text x="180" y="21" font-size="11.5" font-weight="700" fill="${INK}" text-anchor="middle">已切换到深色模式</text></g>`;
      const at = (x, y, o = 1) => `transform:translate(${x}px,${y}px);opacity:${o}`;
      return [b, K(id + "cu", [[0, at(320, 150, 0)], [8, at(320, 150)], [32, at(232, 124)], [86, at(232, 124)], [92, at(232, 124, 0)], [100, at(320, 150, 0)]]) +
        K(id + "rp", [[0, "opacity:0;transform:scale(.2)"], [36, "opacity:0;transform:scale(.2)"], [37, "opacity:1;transform:scale(.3)"], [46, "opacity:0;transform:scale(1.2)"], [100, "opacity:0;transform:scale(1.2)"]]) +
        fade(id + "on", 38, 88, "transform:none", "transform:none", 3) + K(id + "kn", [[0, "transform:translateX(0)"], [38, "transform:translateX(0)"], [43, "transform:translateX(14px)"], [92, "transform:translateX(14px)"], [97, "transform:translateX(0)"], [100, "transform:translateX(0)"]]) +
        K(id + "dk", [[0, "opacity:1"], [88, "opacity:1"], [92, "opacity:0"], [100, "opacity:0"]]) + fade(id + "nt", 66, 84, "transform:translateY(-24px)", "transform:translateY(0)")];
    },
  },
  {
    name: "06 电商促销", en: "Promo", bg: "#FFF0EA", fg: "#B5352A",
    draw: (id) => {
      const b = `<g style="${anim(id + "sh", 4, "steps(1,end)")}">
          <text x="34" y="46" font-size="16" fill="#9A8E89">原价 ¥199</text>
          <path d="M30,41 H118" pathLength="100" stroke="#D93B2B" stroke-width="2.5" stroke-linecap="round" style="${drawn(id + "st", 4)}"/>
          <text x="30" y="122" font-size="66" font-weight="900" fill="#E53935" class="c" style="${anim(id + "sl", 4, "ease-out")}">¥99</text></g>
        <g style="${anim(id + "cp", 4, BOUNCE)}"><rect x="218" y="24" width="112" height="50" rx="8" fill="${GOLD}"/><line x1="262" y1="28" x2="262" y2="70" stroke="#fff" stroke-dasharray="3 3" stroke-width="1.5"/>
          <text x="240" y="55" font-size="17" font-weight="900" fill="#fff" text-anchor="middle">券</text><text x="296" y="57" font-size="20" font-weight="900" fill="#fff" text-anchor="middle">¥20</text></g>
        <g class="c" style="${anim(id + "bt", 0.9, "ease-in-out", 0, "alternate")}"><rect x="214" y="94" width="120" height="36" rx="18" fill="#E53935"/><text x="274" y="118" font-size="15" font-weight="800" fill="#fff" text-anchor="middle">立即抢</text></g>`;
      const sh = (x) => `transform:translateX(${x}px)`;
      return [b, draw(id + "st", 10, 18, 86) + K(id + "sl", [[0, "opacity:0;transform:scale(1.8)"], [22, "opacity:0;transform:scale(1.8)"], [28, "opacity:1;transform:scale(.92)"], [32, "opacity:1;transform:scale(1)"], [86, "opacity:1;transform:scale(1)"], [92, "opacity:0;transform:scale(1)"], [100, "opacity:0;transform:scale(1)"]]) +
        K(id + "sh", [[0, sh(0)], [28, sh(-4)], [30, sh(4)], [32, sh(-3)], [34, sh(2)], [36, sh(0)], [100, sh(0)]]) +
        fade(id + "cp", 42, 86, "transform:translate(150px,-10px) rotate(14deg)", "transform:translate(0,0) rotate(0)", 10) + K(id + "bt", [[0, "transform:scale(1)"], [100, "transform:scale(1.07)"]])];
    },
  },
  {
    name: "07 综艺花字", en: "Variety Text", bg: "#7FD1F2", fg: "#123A5A",
    draw: (id) => {
      const t = (attrs) => `<text x="180" y="104" font-size="66" font-weight="900" text-anchor="middle" ${attrs}>绝了！</text>`;
      let b = `<g class="c" style="${anim(id + "w", 4, BOUNCE)}">${t('fill="#1B1B1B" stroke="#1B1B1B" stroke-width="18" stroke-linejoin="round"')}${t('fill="#fff" stroke="#fff" stroke-width="9" stroke-linejoin="round"')}${t('fill="#FFD23F"')}</g>`;
      let css = K(id + "w", [[0, "opacity:0;transform:scale(.2) rotate(-14deg)"], [6, "opacity:0;transform:scale(.2) rotate(-14deg)"], [16, "opacity:1;transform:scale(1.15) rotate(5deg)"], [22, "opacity:1;transform:scale(1) rotate(-3deg)"], [86, "opacity:1;transform:scale(1) rotate(-3deg)"], [94, "opacity:0;transform:scale(1.3) rotate(-3deg)"], [100, "opacity:0"]]);
      [[52, 40, PINK, 20], [312, 112, "#FFB200", 26], [304, 30, "#fff", 13], [46, 124, "#7457E0", 16]].forEach(([x, y, c, r], i) => {
        b += `<polygon class="c" points="${burst(x, y, r, r * 0.45, 7)}" fill="${c}" stroke="#1B1B1B" stroke-width="2" style="${anim(id + "s" + i, 4, BOUNCE)}"/>`;
        css += pop(id + "s" + i, 20 + i * 6, 86, 0);
      });
      b += `<g class="c" style="${anim(id + "q", 4, BOUNCE)}"><path d="M232,22 h66 a10,10 0 0 1 10,10 v18 a10,10 0 0 1 -10,10 h-40 l-12,10 l2,-10 h-16 a10,10 0 0 1 -10,-10 v-18 a10,10 0 0 1 10,-10z" fill="#fff" stroke="#1B1B1B" stroke-width="2.5"/>
        <text x="265" y="47" font-size="15" font-weight="900" fill="#1B1B1B" text-anchor="middle">哈哈哈</text></g>`;
      return [b, css + pop(id + "q", 40, 86, 0)];
    },
  },
  {
    name: "08 白板手绘", en: "Whiteboard", bg: "#FFFDF6", fg: "#6B7280", vb: DECK,
    draw: () => [`<path d="M70,112 L70,62 L132,30 L194,62 L194,112 Z" stroke="#2b3a47" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="--L:330;stroke-dasharray:330;animation:d-draw 4s infinite"/>
      <path d="M214,74 L286,74 M268,60 L288,74 L268,88" stroke="#c0392b" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="--L:150;stroke-dasharray:150;animation:d-draw 4s .9s infinite"/>
      <circle cx="132" cy="80" r="21" stroke="#c0392b" stroke-width="3" fill="none" style="--L:135;stroke-dasharray:135;animation:d-draw 4s 1.4s infinite"/>`, ""],
  },
  {
    name: "09 动态排版", en: "Kinetic Type", bg: "#F2F3F5", fg: "#7A838D", vb: DECK,
    draw: () => {
      let g = `<text class="c" x="181" y="96" text-anchor="middle" font-size="76" font-weight="800" fill="#111" style="animation:d-slam 4s infinite">动</text>`;
      ["纯代码", "零素材", "可复用"].forEach((t, i) => (g += `<text class="c" x="22" y="${54 + i * 34}" font-size="15" font-weight="700" fill="#e4683c" style="animation:d-slide 4s ${0.15 + i * 0.12}s infinite">${t}</text>`));
      return [g, ""];
    },
  },

  // ---------- 二、三维渲染（平面示意） ----------
  {
    name: "10 3D 产品渲染", en: "3D Product", bg: "#0D0F14", fg: "#C9D0DC",
    draw: (id) => {
      // 示意物体用一只通用圆柱音箱，不模仿任何真实产品外形
      let mesh = "";
      for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) mesh += `<circle cx="${128 + c * 8 + (r % 2) * 4}" cy="${44 + r * 8}" r="1.4" fill="#2B303B" opacity=".35"/>`;
      const body = `<rect x="118" y="30" width="68" height="80" rx="10" fill="url(#${id}m)"/><ellipse cx="152" cy="31" rx="34" ry="7" fill="#E9ECF1"/>${mesh}
        <rect x="118" y="96" width="68" height="4" fill="#7DE3F4" opacity=".85"/>`;
      const b = `<radialGradient id="${id}bg" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#2A2F3A"/><stop offset="1" stop-color="#0D0F14"/></radialGradient>
        <linearGradient id="${id}m" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6E7686"/><stop offset=".35" stop-color="#DDE1E8"/><stop offset=".6" stop-color="#B7BECB"/><stop offset="1" stop-color="#5E6676"/></linearGradient>
        <linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <mask id="${id}k"><rect x="100" y="110" width="110" height="46" fill="url(#${id}f)"/></mask>
        <clipPath id="${id}c"><rect x="118" y="30" width="68" height="80" rx="10"/></clipPath>
        <rect width="360" height="156" fill="url(#${id}bg)"/><polygon points="120,0 184,0 230,156 74,156" fill="#fff" opacity=".04"/>
        <ellipse cx="152" cy="114" rx="74" ry="12" fill="#1A1E28"/><ellipse cx="152" cy="114" rx="74" ry="12" fill="none" stroke="#3A4152" stroke-width="1.5" stroke-dasharray="6 8" style="${anim(id + "tt", 4, "linear")}"/>
        <g mask="url(#${id}k)"><g transform="translate(0,220) scale(1,-1)">${body}</g></g>${body}
        <g clip-path="url(#${id}c)"><g style="${anim(id + "sp", 3.2, "ease-in-out")}"><rect x="126" y="20" width="12" height="100" fill="#fff" opacity=".45"/></g></g>
        <rect x="118" y="30" width="68" height="80" rx="10" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1"/>
        <path d="M182,46 L222,30 H330" pathLength="100" fill="none" stroke="#C9D0DC" stroke-width="1" style="${drawn(id + "l1", 6)}"/>
        <text x="228" y="24" font-size="11.5" fill="#E6E9EF" style="${anim(id + "a1", 6)}">铝合金外壳</text>
        <path d="M186,98 L226,118 H330" pathLength="100" fill="none" stroke="#C9D0DC" stroke-width="1" style="${drawn(id + "l2", 6)}"/>
        <text x="232" y="112" font-size="11.5" fill="#E6E9EF" style="${anim(id + "a2", 6)}">环形灯带</text>`;
      return [b, K(id + "tt", [[0, "stroke-dashoffset:0"], [100, "stroke-dashoffset:-56"]]) + K(id + "sp", [[0, "transform:translateX(-30px)"], [100, "transform:translateX(70px)"]]) +
        draw(id + "l1", 20, 34, 86) + fade(id + "a1", 32, 86) + draw(id + "l2", 44, 58, 86) + fade(id + "a2", 56, 86)];
    },
  },
  {
    name: "11 3D 粘土风", en: "Clay", bg: "#FCE9DC", fg: "#9A5A3C",
    draw: (id) => {
      const blobs = [[90, `<circle cx="0" cy="-22" r="22" fill="url(#${id}g0)"/>`, "#FF8FAB"], [180, `<rect x="-21" y="-42" width="42" height="42" rx="13" fill="url(#${id}g1)"/>`, "#5CC8B8"], [270, `<circle cx="0" cy="-18" r="18" fill="url(#${id}g2)"/>`, "#FFC94D"]];
      let b = `<rect x="0" y="128" width="360" height="28" fill="#F6D8C4"/>`, css = "";
      blobs.forEach(([x, s, c], i) => {
        b += `<radialGradient id="${id}g${i}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".25" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity=".85"/></radialGradient>
          <g transform="translate(${x},128)"><ellipse rx="26" ry="5" fill="#C98E6B" opacity=".35" class="c" style="${anim(id + "sh", 3, "ease-in", i * 0.18)}"/>
          <g style="transform-origin:0 0;${anim(id + "b", 3, "ease-in", i * 0.18)}">${s}</g></g>`;
      });
      const T = (y, sx, sy, o = 1) => `opacity:${o};transform:translateY(${y}px) scale(${sx},${sy})`;
      css += K(id + "b", [[0, T(-130, 0.9, 1.1, 0)], [6, T(-130, 0.9, 1.1)], [30, T(0, 1.28, 0.7)], [40, T(-28, 0.92, 1.1)], [52, T(0, 1.1, 0.9)], [60, T(0, 1, 1)], [86, T(0, 1, 1)], [94, T(0, 1, 1, 0)], [100, T(-130, 0.9, 1.1, 0)]]);
      css += K(id + "sh", [[0, "opacity:0;transform:scale(.3)"], [30, "opacity:1;transform:scale(1.15)"], [40, "opacity:.6;transform:scale(.8)"], [52, "opacity:1;transform:scale(1.05)"], [60, "opacity:1;transform:scale(1)"], [86, "opacity:1;transform:scale(1)"], [94, "opacity:0;transform:scale(1)"], [100, "opacity:0;transform:scale(.3)"]]);
      return [b, css];
    },
  },
  {
    name: "12 抽象 3D 形体", en: "Abstract 3D", bg: "#0E0B1A", fg: "#CFC6F5",
    draw: (id) => {
      const b = `<linearGradient id="${id}t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF9AD5"/><stop offset=".5" stop-color="#7DE3F4"/><stop offset="1" stop-color="#8B6CFF"/></linearGradient>
        <radialGradient id="${id}s" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#F7C8F0"/><stop offset="1" stop-color="#6D4BD8"/></radialGradient>
        <g style="transform-origin:180px 78px;${anim(id + "r", 8, "linear")}"><g style="transform-origin:180px 78px;${anim(id + "y", 3, "ease-in-out", 0, "alternate")}">
          <circle cx="180" cy="78" r="50" fill="none" stroke="url(#${id}t)" stroke-width="18"/><circle cx="180" cy="78" r="50" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2" stroke-dasharray="40 274"/></g></g>
        <g style="${anim(id + "o", 4, "ease-in-out", 0, "alternate")}"><circle cx="180" cy="78" r="17" fill="url(#${id}s)"/></g>`;
      return [b, K(id + "r", [[0, "transform:rotate(0)"], [100, "transform:rotate(360deg)"]]) + K(id + "y", [[0, "transform:scaleY(1)"], [100, "transform:scaleY(.3)"]]) +
        K(id + "o", [[0, "transform:translate(-86px,10px) scale(.8)"], [50, "transform:translate(0,-8px) scale(1.25)"], [100, "transform:translate(86px,10px) scale(.8)"]])];
    },
  },
  {
    name: "13 低多边形", en: "Low Poly", bg: "#F7C6A3", fg: "#6A3B2A",
    draw: (id) => {
      const R = rand(13);
      const layer = (base, hmin, hmax, top, low, step) => {
        const n = Math.round(360 / step), ridge = [], mid = [];
        for (let i = 0; i <= n; i++) {
          const h = i === n ? ridge[0][1] : base - hmin - R() * (hmax - hmin);
          ridge.push([i * step, h]);
          mid.push([i * step, i === n ? mid[0][1] : (h + base) / 2 + (R() - 0.5) * 8]);
        }
        const mixc = (a, b, t) => "#" + [0, 2, 4].map((k) => Math.round(parseInt(a.slice(1 + k, 3 + k), 16) * (1 - t) + parseInt(b.slice(1 + k, 3 + k), 16) * t).toString(16).padStart(2, "0")).join("");
        let tri = "";
        const face = (pts, y) => `<polygon points="${pts.map(([x, yy]) => `${x.toFixed(1)},${yy.toFixed(1)}`).join(" ")}" fill="${mixc(top, low, Math.min(1, Math.max(0, (y - (base - hmax)) / hmax + (R() - 0.5) * 0.15)))}"/>`;
        for (let i = 0; i < n; i++) {
          const [p, q, m, mm] = [ridge[i], ridge[i + 1], mid[i], mid[i + 1]];
          tri += face([p, q, m], (p[1] + q[1] + m[1]) / 3) + face([q, mm, m], (q[1] + mm[1] + m[1]) / 3) + face([m, mm, [mm[0], base + 2], [m[0], base + 2]], (m[1] + base) / 2);
        }
        return tri;
      };
      const far = layer(118, 26, 62, "#C9D6E8", "#7E93B5", 30), near = layer(158, 18, 52, "#7FB685", "#2F5D4A", 36);
      const b = `<linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F9B98F"/><stop offset="1" stop-color="#FCE3C8"/></linearGradient>
        <linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FCE8D6" stop-opacity="0"/><stop offset="1" stop-color="#FCE8D6" stop-opacity=".85"/></linearGradient>
        <rect width="360" height="156" fill="url(#${id}s)"/><circle cx="270" cy="44" r="18" fill="#FFF1D6"/>
        <g style="${anim(id + "a", 16, "linear")}"><g>${far}</g><g transform="translate(360,0)">${far}</g></g>
        <rect y="70" width="360" height="56" fill="url(#${id}f)"/>
        <g style="${anim(id + "b", 7, "linear")}"><g>${near}</g><g transform="translate(360,0)">${near}</g></g>`;
      return [b, K(id + "a", [[0, "transform:translateX(0)"], [100, "transform:translateX(-360px)"]]) + K(id + "b", [[0, "transform:translateX(0)"], [100, "transform:translateX(-360px)"]])];
    },
  },
  {
    name: "14 星际空间", en: "Space", bg: "#05060D", fg: "#B9C3FF",
    draw: (id) => {
      const R = rand(14);
      let stars = "", warp = "", css = "";
      for (let i = 0; i < 46; i++) stars += `<circle cx="${(R() * 360).toFixed(1)}" cy="${(R() * 156).toFixed(1)}" r="${(0.4 + R() * 1.1).toFixed(2)}" fill="#fff" style="${anim(id + "tw", 1.5 + R() * 2.5, "ease-in-out", -R() * 3, "alternate")}"/>`;
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2 + R() * 0.2, r1 = 8 + R() * 10, r2 = r1 + 14 + R() * 14;
        warp += `<line x1="${(110 + Math.cos(a) * r1).toFixed(1)}" y1="${(78 + Math.sin(a) * r1).toFixed(1)}" x2="${(110 + Math.cos(a) * r2).toFixed(1)}" y2="${(78 + Math.sin(a) * r2).toFixed(1)}" stroke="#CFE0FF" stroke-width="1.4" stroke-linecap="round"/>`;
      }
      css += K(id + "tw", [[0, "opacity:.25"], [100, "opacity:1"]]) + K(id + "w", [[0, "opacity:0;transform:scale(1)"], [55, "opacity:0;transform:scale(1)"], [62, "opacity:1;transform:scale(1.4)"], [80, "opacity:0;transform:scale(7)"], [100, "opacity:0;transform:scale(7)"]]);
      const b = `<linearGradient id="${id}p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3C98B"/><stop offset=".2" stop-color="#D98A55"/><stop offset=".35" stop-color="#F0C6A0"/><stop offset=".55" stop-color="#B5673F"/><stop offset=".7" stop-color="#E9B07A"/><stop offset="1" stop-color="#8A4A2E"/></linearGradient>
        <radialGradient id="${id}d" cx=".3" cy=".3" r=".9"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient>
        <clipPath id="${id}f"><rect x="150" y="78" width="200" height="60"/></clipPath>
        ${stars}<g transform="rotate(-18 250 78)">
          <ellipse cx="250" cy="78" rx="64" ry="13" fill="none" stroke="#E9D8B4" stroke-opacity=".55" stroke-width="5"/>
          <circle cx="250" cy="78" r="36" fill="url(#${id}p)"/><circle cx="250" cy="78" r="36" fill="url(#${id}d)"/>
          <g clip-path="url(#${id}f)"><ellipse cx="250" cy="78" rx="64" ry="13" fill="none" stroke="#F4E6C8" stroke-width="5"/></g></g>
        <g style="transform-origin:110px 78px;${anim(id + "w", 4, "ease-in")}">${warp}</g>`;
      return [b, css];
    },
  },
  {
    name: "15 弥散玻璃", en: "Glass", bg: "#EEF0FB", fg: "#3B3F73",
    draw: (id) => {
      const blobs = (f) => [[96, 44, 50, "#7B6CF6"], [262, 112, 48, "#FF8FB1"], [212, 30, 34, "#4FD1C5"]].map(([x, y, r, c], i) => `<g style="${anim(id + "m" + i, 4 + i * 1.3, "ease-in-out", 0, "alternate")}"><circle cx="${x}" cy="${y}" r="${r}" fill="${c}" filter="url(#${f})"/></g>`).join("");
      const b = `<filter id="${id}b" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="14"/></filter>
        <filter id="${id}B" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="26"/></filter>
        <clipPath id="${id}c"><rect x="92" y="34" width="176" height="90" rx="18"/></clipPath>
        ${blobs(id + "b")}<g clip-path="url(#${id}c)">${blobs(id + "B")}<rect x="92" y="34" width="176" height="90" fill="#fff" opacity=".42"/></g>
        <rect x="92" y="34" width="176" height="90" rx="18" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="1.5"/>
        <text x="112" y="70" font-size="17" font-weight="800" fill="#2A2D55">毛玻璃卡片</text><rect x="112" y="84" width="120" height="7" rx="3.5" fill="#2A2D55" opacity=".25"/><rect x="112" y="98" width="84" height="7" rx="3.5" fill="#2A2D55" opacity=".18"/>`;
      return [b, [[40, 30], [-46, -22], [-30, 34]].map(([x, y], i) => K(id + "m" + i, [[0, "transform:translate(0,0)"], [100, `transform:translate(${x}px,${y}px)`]])).join("")];
    },
  },
  {
    name: "16 液态金属", en: "Liquid Metal", bg: "#0B0D12", fg: "#C9D0DC",
    draw: (id) => {
      const blob = (r, n, cx = 180, cy = 80) => `<g style="${anim(id + n, 5, "ease-in-out")}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id}g)"/></g>`;
      const hl = (r, n, cx = 180, cy = 80) => `<g style="${anim(id + n, 5, "ease-in-out")}"><ellipse cx="${cx - r * 0.35}" cy="${cy - r * 0.45}" rx="${r * 0.38}" ry="${r * 0.2}" fill="#fff" opacity=".7" transform="rotate(-25 ${cx - r * 0.35} ${cy - r * 0.45})"/></g>`;
      const b = `<linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F5F7FA"/><stop offset=".35" stop-color="#8E97A8"/><stop offset=".55" stop-color="#E2E6EE"/><stop offset=".8" stop-color="#5B6475"/><stop offset="1" stop-color="#C9B8F0"/></linearGradient>
        <filter id="${id}f" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="7"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 24 -11"/></filter>
        <g filter="url(#${id}f)">${blob(32, "c")}${blob(18, "l")}${blob(16, "r")}${blob(10, "u")}</g>${hl(32, "c")}${hl(18, "l")}${hl(16, "r")}`;
      const t = (x, y, s = 1) => `transform:translate(${x}px,${y}px) scale(${s})`;
      return [b, K(id + "c", [[0, t(0, 0)], [50, t(0, 0, 0.9)], [100, t(0, 0)]]) + K(id + "l", [[0, t(0, 0)], [20, t(0, 0)], [50, t(-86, 6)], [80, t(0, 0)], [100, t(0, 0)]]) +
        K(id + "r", [[0, t(0, 0)], [26, t(0, 0)], [56, t(84, -8)], [84, t(0, 0)], [100, t(0, 0)]]) + K(id + "u", [[0, t(0, 0)], [32, t(0, 0)], [60, t(10, -52)], [88, t(0, 0)], [100, t(0, 0)]])];
    },
  },
  {
    name: "17 复古 Synthwave", en: "Synthwave", bg: "#1A0B3D", fg: "#5EF0DA", vb: DECK,
    draw: (id) => {
      let g = `<linearGradient id="${id}sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd36e"/><stop offset=".55" stop-color="#ff7a3d"/><stop offset="1" stop-color="#ff2e88"/></linearGradient>
        <clipPath id="${id}clip"><rect x="0" y="73" width="362" height="69"/></clipPath><circle cx="181" cy="57" r="29" fill="url(#${id}sun)"/>`;
      for (let i = 0; i < 4; i++) g += `<rect x="149" y="${54 + i * 7.5}" width="64" height="${2.4 + i * 0.6}" fill="#1a0b3d"/>`;
      g += `<line x1="0" y1="73" x2="362" y2="73" stroke="#ff2e88" stroke-width="2"/><g clip-path="url(#${id}clip)">`;
      for (let i = -6; i <= 6; i++) g += `<line x1="181" y1="73" x2="${181 + i * 82}" y2="142" stroke="#2de2e6" stroke-width="1" opacity=".7"/>`;
      g += `<g style="animation:d-swgrid 2.4s linear infinite">`;
      for (let i = 0; i < 9; i++) g += `<line x1="0" y1="${75 + i * 10}" x2="362" y2="${75 + i * 10}" stroke="#2de2e6" stroke-width="1" opacity=".55"/>`;
      return [g + "</g></g>", ""];
    },
  },
  {
    name: "18 故障艺术", en: "Glitch", bg: "#0A0A0A", fg: "#F2F2F2",
    draw: (id) => {
      const txt = (fill, extra = "") => `<text x="180" y="108" font-size="42" font-weight="900" fill="${fill}" text-anchor="middle" class="m" ${extra}>NO SIGNAL</text>`;
      const bars = ["#FFFFFF", "#F5E642", "#3EE6E6", "#3DDC5A", "#E64CE6", "#E63946", "#2F49E6"].map((c, i) => `<rect x="${i * 51.4}" y="0" width="51.5" height="40" fill="${c}"/>`).join("");
      const jit = (n, seq) => K(n, seq.map(([p, x, y = 0]) => [p, `transform:translate(${x}px,${y}px)`]));
      const b = `<g style="${anim(id + "cb", 3, "steps(1,end)")}" opacity=".85">${bars}</g>
        <g style="mix-blend-mode:screen">
          <g style="${anim(id + "r", 3, "steps(1,end)")}">${txt("#FF1F4B")}</g><g style="${anim(id + "b", 3, "steps(1,end)")}">${txt("#00E5FF")}</g></g>
        ${txt("#fff", 'opacity=".9"')}
        <clipPath id="${id}s1"><rect x="0" y="80" width="360" height="9"/></clipPath><clipPath id="${id}s2"><rect x="0" y="97" width="360" height="7"/></clipPath>
        <g clip-path="url(#${id}s1)"><g style="${anim(id + "x1", 3, "steps(1,end)")}"><rect x="-40" y="80" width="440" height="9" fill="#0A0A0A"/>${txt("#fff")}</g></g>
        <g clip-path="url(#${id}s2)"><g style="${anim(id + "x2", 3, "steps(1,end)")}"><rect x="-40" y="97" width="440" height="7" fill="#0A0A0A"/>${txt("#3EE6E6")}</g></g>
        <rect y="0" width="360" height="156" fill="url(#${id}sl)" opacity=".35"/><pattern id="${id}sl" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000"/></pattern>`;
      return [b, jit(id + "cb", [[0, 0], [30, -14], [33, 9], [36, 0], [70, 18], [72, 0], [100, 0]]) + jit(id + "r", [[0, -2], [30, -9, 1], [33, 6], [36, -2], [70, -12], [72, 4], [74, -2], [100, -2]]) +
        jit(id + "b", [[0, 2], [30, 8, -1], [33, -6], [36, 2], [70, 11], [72, -5], [74, 2], [100, 2]]) + jit(id + "x1", [[0, 0], [30, 22], [34, -14], [36, 0], [70, -26], [73, 0], [100, 0]]) + jit(id + "x2", [[0, 0], [31, -18], [35, 0], [71, 30], [74, 0], [100, 0]])];
    },
  },
  {
    name: "19 科幻 HUD", en: "Sci-fi HUD", bg: "#071314", fg: "#5EF0DA", vb: DECK,
    draw: () => [`<g style="transform-origin:181px 76px;animation:d-spin 9s linear infinite"><circle cx="181" cy="76" r="54" stroke="#33e0c8" stroke-width="1.6" fill="none" stroke-dasharray="20 10" opacity=".85"/></g>
      <g style="transform-origin:181px 76px;animation:d-spinr 6s linear infinite"><circle cx="181" cy="76" r="40" stroke="#33e0c8" stroke-width="1.2" fill="none" stroke-dasharray="5 8" opacity=".6"/></g>
      <circle cx="181" cy="76" r="24" stroke="#33e0c8" stroke-width="1.4" fill="none" opacity=".9"/>
      <g style="transform-origin:181px 76px;animation:d-spin 2.6s linear infinite"><path d="M181,76 L181,22 A54,54 0 0,1 227,49 Z" fill="#33e0c8" opacity=".22"/></g>
      <line x1="181" y1="10" x2="181" y2="142" stroke="#33e0c8" stroke-width=".8" opacity=".35"/><line x1="60" y1="76" x2="302" y2="76" stroke="#33e0c8" stroke-width=".8" opacity=".35"/>
      <rect x="258" y="106" width="78" height="30" fill="none" stroke="#33e0c8" stroke-width="1" opacity=".6"/><text x="266" y="126" font-size="13" fill="#33e0c8" class="m" opacity=".9">TRACKING</text>`, ""],
  },
  {
    name: "20 粒子成形", en: "Particles", bg: "#0B0F1E", fg: "#A9C7FF",
    draw: (id) => {
      const A = [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"], I = ["###", ".#.", ".#.", ".#.", ".#.", ".#.", "###"];
      const R = rand(20), cell = 12, x0 = 180 - (10 * cell) / 2 + cell / 2, y0 = 78 - (7 * cell) / 2 + cell / 2;
      let b = "";
      const dots = [];
      A.forEach((row, r) => [...row].forEach((c, k) => c === "#" && dots.push([k, r])));
      I.forEach((row, r) => [...row].forEach((c, k) => c === "#" && dots.push([k + 7, r])));
      const col = (k) => { const t = k / 9; return `rgb(${Math.round(79 + (167 - 79) * t)},${Math.round(209 + (139 - 209) * t)},${Math.round(255 + (250 - 255) * t)})`; };
      dots.forEach(([k, r]) => {
        const dx = (R() - 0.5) * 300, dy = (R() - 0.5) * 150, ex = (R() - 0.5) * 360, ey = (R() - 0.5) * 180;
        b += `<circle cx="${x0 + k * cell}" cy="${y0 + r * cell}" r="4" fill="${col(k)}" style="--dx:${dx.toFixed(0)}px;--dy:${dy.toFixed(0)}px;--ex:${ex.toFixed(0)}px;--ey:${ey.toFixed(0)}px;${anim(id + "p", 6, "cubic-bezier(.6,0,.2,1)", -(R() * 0.25).toFixed(2))}"/>`;
      });
      for (let i = 0; i < 26; i++) b += `<circle cx="${(R() * 360).toFixed(0)}" cy="${(R() * 156).toFixed(0)}" r="1.4" fill="#6E86C9" style="${anim(id + "a", 3 + R() * 3, "ease-in-out", -R() * 3, "alternate")}"/>`;
      return [b, K(id + "p", [[0, "transform:translate(var(--dx),var(--dy));opacity:.3"], [12, "transform:translate(var(--dx),var(--dy));opacity:.3"], [42, "transform:translate(0,0);opacity:1"], [72, "transform:translate(0,0);opacity:1"], [90, "transform:translate(var(--ex),var(--ey));opacity:0"], [100, "transform:translate(var(--dx),var(--dy));opacity:0"]]) +
        K(id + "a", [[0, "transform:translate(0,0);opacity:.3"], [100, "transform:translate(14px,-10px);opacity:.9"]])];
    },
  },
  {
    name: "21 包豪斯几何", en: "Bauhaus", bg: "#F2EBDD", fg: "#1A1A1A",
    draw: (id) => {
      const C = ["#D93B2B", "#F2B705", "#1F4E9C", "#1A1A1A"], s = 46, x0 = 42, y0 = 9;
      const R = rand(21);
      let b = "";
      for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) {
        const x = x0 + c * s, y = y0 + r * s, cx = x + s / 2, cy = y + s / 2, bgc = (r + c) % 3 === 0 ? C[(r + c) % 4] : "none", fc = C[(r * 2 + c + 1) % 4];
        const kind = Math.floor(R() * 4);
        const shape = [`<path d="M${x},${y} L${x + s},${y} A${s},${s} 0 0 1 ${x},${y + s} Z" fill="${fc}"/>`, `<path d="M${x},${cy} A${s / 2},${s / 2} 0 0 1 ${x + s},${cy} Z" fill="${fc}"/>`, `<circle cx="${cx}" cy="${cy}" r="${s * 0.36}" fill="${fc}"/>`, `<path d="M${x + 4},${y + s - 4} L${cx},${y + 4} L${x + s - 4},${y + s - 4} Z" fill="${fc}"/>`][kind];
        b += `${bgc !== "none" ? `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${bgc}" opacity=".9"/>` : ""}<g style="transform-origin:${cx}px ${cy}px;${anim("d-beat", R() > 0.5 ? 4 : 2, "cubic-bezier(.7,0,.3,1)", 0, R() > 0.5 ? "reverse" : "")}">${shape}</g>`;
      }
      return [`<rect x="${x0}" y="${y0}" width="${s * 6}" height="${s * 3}" fill="none" stroke="#1A1A1A" stroke-width="2"/>` + b, ""];
    },
  },

  // ---------- 四、艺术与复古 ----------
  {
    name: "22 水墨山水", en: "Ink Wash", bg: "#F1EADB", fg: "#3A3A36",
    draw: (id) => {
      const R = rand(22);
      const ridge = (base, amp, step) => { let d = `M-10,156 L-10,${base}`; for (let x = 0; x <= 380; x += step) d += ` Q${x - step / 2},${(base - amp * R()).toFixed(1)} ${x},${(base - amp * 0.4 * R()).toFixed(1)}`; return d + " L380,156 Z"; };
      const lay = [[ridge(78, 50, 70), "#A9AFA9", 0], [ridge(104, 44, 56), "#6D7671", 8], [ridge(128, 34, 46), "#2E3533", 16]];
      let b = `<filter id="${id}p"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 .45 0 0 0 0 .4 0 0 0 0 .3 0 0 0 .18 0"/></filter>
        <rect width="360" height="156" filter="url(#${id}p)"/><filter id="${id}m" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="7"/></filter>`, css = "";
      lay.forEach(([d, c, a], i) => {
        b += `<linearGradient id="${id}g${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient><path d="${d}" fill="url(#${id}g${i})" style="${anim(id + "l" + i, 8)}"/>`;
        css += fade(id + "l" + i, a, 90, "transform:translateY(6px)", "transform:translateY(0)", 14);
        if (i === 1) b += `<g style="${anim(id + "mi", 8, "ease-in-out", 0, "alternate")}"><ellipse cx="160" cy="106" rx="120" ry="9" fill="#F7F2E6" opacity=".85" filter="url(#${id}m)"/></g>`;
      });
      b += `<g style="${anim(id + "bt", 8, "linear")}"><path d="M0,0 Q14,6 28,0 L24,4 Q14,8 4,4 Z" fill="#2E3533"/><line x1="16" y1="1" x2="20" y2="-10" stroke="#2E3533" stroke-width="1.2"/></g>
        <text x="332" y="32" font-size="19" fill="#2E3533" class="se">山</text><text x="332" y="56" font-size="19" fill="#2E3533" class="se">水</text>
        <g class="c" style="${anim(id + "se", 8, "ease-out")}"><rect x="323" y="66" width="20" height="20" rx="2" fill="#B8352B"/><text x="333" y="81" font-size="13" fill="#F6E9DC" text-anchor="middle" class="se">说</text></g>`;
      css += K(id + "mi", [[0, "transform:translateX(-30px)"], [100, "transform:translateX(40px)"]]) + K(id + "bt", [[0, "transform:translate(30px,140px)"], [100, "transform:translate(250px,140px)"]]) +
        K(id + "se", [[0, "opacity:0;transform:scale(1.6)"], [40, "opacity:0;transform:scale(1.6)"], [44, "opacity:1;transform:scale(.94)"], [48, "opacity:1;transform:scale(1)"], [90, "opacity:1;transform:scale(1)"], [96, "opacity:0;transform:scale(1)"], [100, "opacity:0;transform:scale(1)"]]);
      return [b, css];
    },
  },
  {
    name: "23 层叠剪纸", en: "Paper Cut", bg: "#FDE7C8", fg: "#2B6E68",
    draw: (id) => {
      const wave = (base, amp, len, ph) => { let d = `M-30,156 L-30,${base}`; for (let x = -30; x <= 400; x += 10) d += ` L${x},${(base + amp * Math.sin(((x + ph) / len) * 2 * Math.PI)).toFixed(1)}`; return d + " L400,156 Z"; };
      const cols = ["#BFE6DF", "#8ED2C6", "#5CB8AB", "#3A9A90", "#25756F"];
      let b = `<filter id="${id}d" x="-10%" y="-30%" width="120%" height="160%"><feDropShadow dx="0" dy="-3" stdDeviation="3" flood-color="#1D4B47" flood-opacity=".3"/></filter><circle cx="270" cy="40" r="20" fill="#F7A35C"/>`, css = "";
      cols.forEach((c, i) => {
        b += `<g style="${anim(id + "w" + i, 3 + i * 0.6, "ease-in-out", -i * 0.4, "alternate")}"><path d="${wave(64 + i * 18, 5 + i, 120 + i * 30, i * 40)}" fill="${c}" filter="url(#${id}d)"/></g>`;
        if (i === 2) b += `<g style="${anim(id + "w2", 3 + 2 * 0.6, "ease-in-out", -0.8, "alternate")}"><g style="transform-origin:150px 100px;${anim(id + "bo", 2.2, "ease-in-out", 0, "alternate")}"><path d="M130,96 L170,96 L162,104 L138,104 Z" fill="#fff"/><path d="M150,96 L150,76 L164,94 Z" fill="#fff"/></g></g>`;
        css += K(id + "w" + i, [[0, "transform:translate(-6px,2px)"], [100, `transform:translate(6px,-3px)`]]);
      });
      return [b, css + K(id + "bo", [[0, "transform:rotate(-7deg)"], [100, "transform:rotate(7deg)"]])];
    },
  },
  {
    name: "24 一笔线条", en: "One Line", bg: "#0B1630", fg: "#FFD58A",
    draw: (id) => {
      const d = "M8,112 H28 V78 H44 V58 H56 V78 H70 V46 H86 V112 H104 Q134,64 164,112 Q194,64 224,112 H240 V86 H256 V66 H270 V112 H292 L304,72 A16,16 0 1,1 304.1,72.2 L330,112 H352";
      let win = "", css = "";
      [[32, 84], [48, 66], [48, 80], [74, 54], [74, 70], [78, 90], [244, 92], [260, 74], [260, 90]].forEach(([x, y], i) => {
        win += `<rect x="${x}" y="${y}" width="5" height="6" fill="#FFD58A" style="${anim(id + "w" + i, 7)}"/>`;
        css += fade(id + "w" + i, 58 + i * 1.2, 88, "transform:none", "transform:none", 2);
      });
      const b = `<filter id="${id}g" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <g filter="url(#${id}g)"><path d="${d}" pathLength="100" fill="none" stroke="#FFD58A" stroke-width="2.2" stroke-linejoin="round" style="${drawn(id + "p", 7)}"/>${win}</g>
        <g style="${anim(id + "r", 7)}" opacity=".22"><g transform="translate(0,224) scale(1,-1)"><path d="${d}" fill="none" stroke="#FFD58A" stroke-width="2"/></g></g>`;
      return [b, css + draw(id + "p", 2, 56, 88) + fade(id + "r", 64, 88)];
    },
  },
  {
    name: "25 默片胶片", en: "Silent Film", bg: "#2A2117", fg: "#F3E3C2",
    draw: (id) => {
      const C = 2 * Math.PI * 26;
      let nums = "", css = "";
      ["3", "2", "1"].forEach((n, i) => {
        nums += `<text x="180" y="100" font-size="64" font-weight="700" fill="#2A2117" text-anchor="middle" class="se" style="${anim(id + "n" + i, 3, "linear")}">${n}</text>`;
        css += i === 0 ? K(id + "n0", [[0, "opacity:1"], [33.32, "opacity:1"], [33.33, "opacity:0"], [100, "opacity:0"]]) : show(id + "n" + i, (100 * i) / 3, i === 2 ? 100.01 : (100 * (i + 1)) / 3);
      });
      const b = `<radialGradient id="${id}v" cx=".5" cy=".5" r=".7"><stop offset=".45" stop-color="#D8C49A"/><stop offset="1" stop-color="#6E5A3A"/></radialGradient>
        <filter id="${id}n"><feTurbulence type="fractalNoise" baseFrequency=".95" numOctaves="1" seed="7"/><feColorMatrix values="0 0 0 0 .2 0 0 0 0 .15 0 0 0 0 .1 0 0 0 .9 0"/></filter>
        <rect width="360" height="156" fill="url(#${id}v)"/>
        <circle cx="180" cy="78" r="26" fill="none" stroke="#2A2117" stroke-opacity=".28" stroke-width="52" stroke-dasharray="${C.toFixed(1)}" transform="rotate(-90 180 78)" style="${anim(id + "sw", 1, "linear")}"/>
        <circle cx="180" cy="78" r="56" fill="none" stroke="#2A2117" stroke-width="2.5"/><circle cx="180" cy="78" r="46" fill="none" stroke="#2A2117" stroke-width="1.2"/>
        <line x1="70" y1="78" x2="290" y2="78" stroke="#2A2117" stroke-width="1"/><line x1="180" y1="6" x2="180" y2="150" stroke="#2A2117" stroke-width="1"/>${nums}
        <rect width="360" height="156" filter="url(#${id}n)" style="${anim(id + "gr", 0.3, "steps(1,end)")}"/>
        <g style="${anim(id + "sc", 0.9, "steps(1,end)")}"><line x1="96" y1="0" x2="98" y2="156" stroke="#F3E3C2" stroke-width="1" opacity=".6"/><line x1="262" y1="20" x2="261" y2="120" stroke="#2A2117" stroke-width=".8" opacity=".5"/></g>
        <rect width="360" height="156" fill="#FFF6E0" style="${anim(id + "fl", 0.24, "steps(1,end)")}"/>`;
      return [b, css + K(id + "sw", [[0, `stroke-dashoffset:${C.toFixed(1)}`], [100, "stroke-dashoffset:0"]]) + K(id + "gr", [[0, "opacity:.12"], [33, "opacity:.2"], [66, "opacity:.15"], [100, "opacity:.15"]]) +
        K(id + "sc", [[0, "transform:translateX(0)"], [30, "transform:translateX(64px)"], [60, "transform:translateX(-40px)"], [100, "transform:translateX(-40px)"]]) + K(id + "fl", [[0, "opacity:0"], [50, "opacity:.06"], [100, "opacity:.06"]])];
    },
  },
  {
    name: "26 像素游戏", en: "Pixel Game", bg: "#6EC6FF", fg: "#0E2A47",
    draw: (id) => {
      const px = 3, sprite = ["..####..", ".######.", ".#.##.#.", ".######.", "..####..", ".######.", "#.####.#", "..#..#.."];
      let hero = "";
      sprite.forEach((row, r) => [...row].forEach((c, k) => c === "#" && (hero += `<rect x="${k * px}" y="${r * px}" width="${px}" height="${px}" fill="${r === 2 && (k === 2 || k === 5) ? "#fff" : CORAL}"/>`)));
      sprite.forEach((row, r) => r === 2 && [2, 5].forEach((k) => (hero += `<rect x="${k * px}" y="${r * px}" width="${px}" height="${px}" fill="#fff"/>`)));
      let ground = "";
      for (let i = 0; i < 17; i++) ground += `<rect x="${i * 24}" y="124" width="24" height="8" fill="#4CB050"/><rect x="${i * 24}" y="132" width="24" height="24" fill="${i % 2 ? "#B5652B" : "#9C5424"}"/><rect x="${i * 24 + 4}" y="138" width="6" height="6" fill="#7A3E17"/>`;
      const cloud = (x, y) => `<rect x="${x}" y="${y}" width="36" height="9" fill="#fff"/><rect x="${x + 9}" y="${y - 9}" width="18" height="9" fill="#fff"/>`;
      const b = `<g shape-rendering="crispEdges"><g style="${anim(id + "cl", 9, "linear")}">${cloud(60, 34)}${cloud(220, 22)}${cloud(420, 30)}</g>
        <g style="${anim(id + "gd", 0.5, "linear")}">${ground}</g>
        <g transform="translate(91,52)"><g class="c" style="${anim(id + "co", 4, "steps(1,end)")}"><g style="transform-box:fill-box;transform-origin:center;${anim(id + "sp", 0.6, "linear")}"><rect x="0" y="0" width="12" height="15" fill="#FFD23F"/><rect x="3" y="3" width="3" height="9" fill="#F2A33A"/></g></g></g>
        <g transform="translate(85,100)"><g style="${anim(id + "j", 4)}">${hero}</g></g>
        <rect x="236" y="10" width="112" height="22" fill="#0E2A47"/>
        <text x="244" y="26" font-size="13" font-weight="700" fill="#fff" class="m" style="${anim(id + "s0", 4, "linear")}">SCORE 0040</text>
        <text x="244" y="26" font-size="13" font-weight="700" fill="#FFD23F" class="m" style="${anim(id + "s1", 4, "linear")}">SCORE 0050</text>
        <g style="${anim(id + "pl", 4)}"><text x="112" y="44" font-size="11" font-weight="700" fill="#fff" class="m">+10</text></g></g>`;
      return [b, K(id + "cl", [[0, "transform:translateX(0)"], [100, "transform:translateX(-200px)"]]) + K(id + "gd", [[0, "transform:translateX(0)"], [100, "transform:translateX(-24px)"]]) +
        K(id + "j", [[0, "transform:translateY(0)"], [40, "transform:translateY(0);animation-timing-function:ease-out"], [52, "transform:translateY(-44px);animation-timing-function:ease-in"], [64, "transform:translateY(0)"], [100, "transform:translateY(0)"]]) +
        K(id + "co", [[0, "opacity:1"], [51, "opacity:1"], [52, "opacity:0"], [100, "opacity:0"]]) + K(id + "sp", [[0, "transform:scaleX(1)"], [50, "transform:scaleX(.15)"], [100, "transform:scaleX(1)"]]) +
        K(id + "s0", [[0, "opacity:1"], [51.99, "opacity:1"], [52, "opacity:0"], [100, "opacity:0"]]) + show(id + "s1", 52, 100.01) + fade(id + "pl", 52, 64, "transform:translateY(0)", "transform:translateY(-12px)", 4)];
    },
  },
  {
    name: "27 工程蓝图", en: "Blueprint", bg: "#0A2A4A", fg: "#9FD4FF", vb: DECK,
    draw: () => {
      let g = "";
      for (let x = 0; x <= 362; x += 22) g += `<line x1="${x}" y1="0" x2="${x}" y2="152" stroke="#8fd0ff" stroke-width=".5" opacity=".22"/>`;
      for (let y = 0; y <= 152; y += 22) g += `<line x1="0" y1="${y}" x2="362" y2="${y}" stroke="#8fd0ff" stroke-width=".5" opacity=".22"/>`;
      const gear = (cx, cy, R, n, dir, dur) => {
        let t = `<g style="transform-origin:${cx}px ${cy}px;animation:d-${dir} ${dur}s linear infinite"><circle cx="${cx}" cy="${cy}" r="${R}" stroke="#cfe9ff" stroke-width="2" fill="none"/><circle cx="${cx}" cy="${cy}" r="${R * 0.32}" stroke="#cfe9ff" stroke-width="1.6" fill="none"/>`;
        for (let i = 0; i < n; i++) t += `<rect x="${cx - 3.5}" y="${cy - R - 8}" width="7" height="9" fill="#cfe9ff" transform="rotate(${(i * 360) / n} ${cx} ${cy})"/>`;
        return t + "</g>";
      };
      g += gear(128, 76, 36, 12, "spin", 7) + gear(222, 76, 27, 9, "spinr", 5.25);
      g += `<path d="M300,118 L344,118 M300,113 L300,123 M344,113 L344,123" stroke="#cfe9ff" stroke-width="1.4"/><text x="300" y="108" font-size="11" fill="#cfe9ff" class="m" opacity=".9">44.0</text>`;
      return [g, ""];
    },
  },
  {
    name: "28 字符渲染", en: "ASCII", bg: "#05140C", fg: "#5EF08A", vb: DECK,
    draw: (id) => {
      const cmd = [..."$ remotion render ... 240/240 frames"], cw = 7.8;
      const t = typeChars(id, cmd, { dur: 4, x: 18, y: 58, cw, a: 10, b: 45, hide: 90, size: 13, fill: "#5EF08A", cls: "m" });
      let g = t.body;
      ["@@@@#####****+++===---...", "###****+++===---...,,,:::", "****+++===---...,,,:::;;;"].forEach((r, i) => (g += `<text x="18" y="${82 + i * 20}" font-size="13" class="m" fill="#2fbf6a" opacity="${0.85 - i * 0.18}" textLength="${r.length * cw}">${r}</text>`));
      g += `<rect x="0" y="0" width="362" height="16" fill="#5ef08a" opacity=".07" style="animation:d-scan 3s linear infinite"/><rect x="331" y="72" width="8" height="14" fill="#5ef08a" style="animation:d-blink 1s steps(1,end) infinite"/>`;
      return [g, t.css];
    },
  },

  // ---------- 五、我们自己的风格 ----------
  {
    name: "29 开发实录", en: "Dev Demo", bg: "#E9ECF2", fg: INK,
    draw: (id) => {
      const cw = 7.2, kw = "#FC5FA3", ty = "#D0A8FF", st = "#FC6A5D", fn = "#67B7A4", tx = "#E6E6EA";
      const line = (y, toks) => { let s = "", i = 0; toks.forEach(([t, c]) => { s += `<text x="${(38 + i * cw).toFixed(1)}" y="${y}" font-size="12" fill="${c}" class="m" xml:space="preserve">${t}</text>`; i += t.length; }); return s; };
      const ins = [["    ", tx], [".bold", fn], ["()", tx]], chars = [], colors = [];
      ins.forEach(([t, c]) => [...t].forEach((ch) => { chars.push(ch); colors.push(c); }));
      const t = typeChars(id, chars, { dur: 6, x: 38, y: 82, cw, a: 12, b: 36, hide: 92, size: 12, cls: "m", colors });
      const b = `<rect x="12" y="12" width="196" height="132" rx="10" fill="#1F1F24"/>${[1, 2, 3, 4].map((n) => `<text x="28" y="${42 + (n - 1) * 20}" font-size="12" fill="#6C7086" text-anchor="end" class="m">${n}</text>`).join("")}
        ${line(42, [["VStack", ty], [" {", tx]])}${line(62, [["  ", tx], ["Text", ty], ["(", tx], ['"Hi"', st], [")", tx]])}${t.body}${line(102, [["}", tx]])}
        <g style="${anim(id + "kc", 6)}"><rect x="120" y="108" width="34" height="26" rx="6" fill="#fff"/><text x="137" y="126" font-size="14" font-weight="700" fill="${INK}" text-anchor="middle" class="m">⌘R</text>
          <rect x="158" y="110" width="40" height="22" rx="6" fill="${PURPLE}"/><text x="178" y="125" font-size="12" font-weight="700" fill="#fff" text-anchor="middle">运行</text></g>
        <rect x="246" y="8" width="60" height="126" rx="12" fill="#111"/><rect x="249" y="11" width="54" height="120" rx="10" fill="#fff"/><rect x="266" y="14" width="20" height="5" rx="2.5" fill="#000"/>
        <text x="276" y="76" font-size="13" fill="${INK}" text-anchor="middle" style="${anim(id + "r0", 6, "linear")}">Hi</text>
        <text x="276" y="76" font-size="14" font-weight="900" fill="${INK}" text-anchor="middle" class="c" style="${anim(id + "r1", 6, BOUNCE)}">Hi</text>
        <text x="276" y="149" font-size="10" fill="${SUB}" text-anchor="middle">模拟器实录</text>`;
      return [b, t.css + fade(id + "kc", 40, 86) + K(id + "r0", [[0, "opacity:1"], [49.99, "opacity:1"], [50, "opacity:0"], [93.99, "opacity:0"], [94, "opacity:1"], [100, "opacity:1"]]) + pop(id + "r1", 48, 88, 0.6)];
    },
  },
  {
    name: "30 旅程式讲解", en: "Journey", bg: "#0E1220", fg: "#E8ECF4",
    draw: (id) => {
      const st = [[40, 112, "键盘"], [112, 112, "路由器"], [184, 112, "机房"], [256, 112, "GPU"], [320, 112, "屏幕"]];
      const times = ["+0 ms", "+3 ms", "+9 ms", "+14 ms", "+19 ms"];
      let b = `<line x1="40" y1="112" x2="320" y2="112" stroke="#2C3446" stroke-width="2" stroke-dasharray="4 5"/>
        <text x="16" y="24" font-size="11" class="m" fill="#8C97AB">实时 → 慢放约 10⁴ 倍</text><rect x="262" y="10" width="86" height="24" rx="6" fill="#1B2232" stroke="#2C3650"/>`, css = "";
      st.forEach(([x, y, t], i) => {
        const a = 4 + i * 18;
        b += `<rect x="${x - 16}" y="${y - 16}" width="32" height="32" rx="8" fill="#1B2232" stroke="#3A4560" stroke-width="1.5"/><text x="${x}" y="${y + 32}" font-size="11" fill="#8C97AB" text-anchor="middle">${t}</text>
          <text x="305" y="27" font-size="12" font-weight="700" class="m" fill="${GOLD}" text-anchor="middle" style="${anim(id + "t" + i, 7, "linear")}">${times[i]}</text>`;
        css += i === 0 ? K(id + "t0", [[0, "opacity:1"], [a + 13.99, "opacity:1"], [a + 14, "opacity:0"], [100, "opacity:0"]]) : show(id + "t" + i, a - 4, i === 4 ? 100.01 : a + 14);
      });
      b += `<g style="${anim(id + "m", 7, "cubic-bezier(.5,0,.3,1)")}"><circle cx="40" cy="72" r="13" fill="${CORAL}"/><text x="40" y="76" font-size="9" font-weight="800" fill="#fff" text-anchor="middle" class="m">4821</text>
        <path d="M40,86 V95" stroke="${CORAL}" stroke-width="2"/></g><text x="16" y="44" font-size="11" fill="${CORAL}">主角 #4821 独占强调色</text>`;
      const at = (x) => `transform:translateX(${x}px)`;
      const stops = [[0, at(0)]];
      st.forEach(([x], i) => { if (i) stops.push([i * 18 - 4, at(st[i - 1][0] - 40)], [i * 18, at(x - 40)]); });
      stops.push([90, at(280)], [96, at(0)], [100, at(0)]);
      return [b, css + K(id + "m", stops)];
    },
  },
];
