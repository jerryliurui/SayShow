// 动效一览的公共部分：配色、字体、关键帧小工具
// 每一格是一段纯 SVG/CSS 循环动画，不含脚本，GitHub README 里用 <img> 引用即可播放

export const INK = "#15181E", SUB = "#6B7385", LINE = "#E7E2D9", CREAM = "#FBF7F0";
export const CORAL = "#E8603C", BLUE = "#3E6FE0", PURPLE = "#7457E0", GREEN = "#2F9E6A", GOLD = "#F2A33A", PINK = "#F0436B";

export const SANS = `-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Noto Sans CJK SC","Microsoft YaHei",sans-serif`;
export const MONO = `ui-monospace,"SF Mono",Menlo,Consolas,"Liberation Mono",monospace`;
export const SERIF = `"Songti SC","STSong","Noto Serif CJK SC","SimSun",serif`;

// 关键帧：stops 为 [百分比, css] 列表
export const K = (name, stops) => `@keyframes ${name}{${stops.map(([p, c]) => `${+p.toFixed(3)}%{${c}}`).join("")}}`;

// 循环动画的 style 片段
export const anim = (name, dur, fn = "ease", delay = 0, extra = "") =>
  `animation:${name} ${dur}s ${fn} ${delay}s infinite ${extra}`;

export const OUT = "cubic-bezier(.22,1,.36,1)"; // 快起慢停，与模板 ease 一致
export const BOUNCE = "cubic-bezier(.34,1.45,.64,1)"; // 带一点回弹

// 在 a% 弹入（略放大再回落）、b% 淡出
export const pop = (n, a, b, s0 = 0.6) =>
  K(n, [
    [0, `opacity:0;transform:scale(${s0})`],
    [a, `opacity:0;transform:scale(${s0})`],
    [a + 4, "opacity:1;transform:scale(1.1)"],
    [a + 8, "opacity:1;transform:scale(1)"],
    [b, "opacity:1;transform:scale(1)"],
    [b + 5, "opacity:0;transform:scale(1)"],
    [100, "opacity:0;transform:scale(1)"],
  ]);

// 在 a% 淡入（可带起始位移）、b% 淡出
export const fade = (n, a, b, from = "transform:none", to = "transform:none", d = 6) =>
  K(n, [
    [0, `opacity:0;${from}`],
    [a, `opacity:0;${from}`],
    [a + d, `opacity:1;${to}`],
    [b, `opacity:1;${to}`],
    [b + 5, `opacity:0;${to}`],
    [100, `opacity:0;${to}`],
  ]);

// 只在 [a, b) 区间显示，前后硬切（字幕、逐字、数字换值）
export const show = (n, a, b) =>
  K(n, [
    [0, `opacity:${a <= 0 ? 1 : 0}`],
    ...(a > 0 ? [[a - 0.01, "opacity:0"], [a, "opacity:1"]] : []),
    [b - 0.01, "opacity:1"],
    [b, "opacity:0"],
    [100, "opacity:0"],
  ]);

// 描线：pathLength=100 的路径在 a%→b% 画完，c% 起淡出
export const draw = (n, a, b, c = 88) =>
  K(n, [
    [0, "stroke-dashoffset:100;opacity:1"],
    [a, "stroke-dashoffset:100;opacity:1"],
    [b, "stroke-dashoffset:0;opacity:1"],
    [c, "stroke-dashoffset:0;opacity:1"],
    [c + 5, "stroke-dashoffset:0;opacity:0"],
    [100, "stroke-dashoffset:100;opacity:0"],
  ]);
export const drawn = (name, dur) => `stroke-dasharray:100;stroke-dashoffset:100;${anim(name, dur, "ease-in-out")}`;

// 固定种子的随机数，保证每次生成结果一致
export const rand = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// 逐字出现：chars 每个字单独定位，从 a% 到 b% 依次出现，hide% 消失
export const typeChars = (id, chars, { dur, x, y, cw, a, b, hide = 90, size, fill, cls = "", weight = 400, colors }) => {
  let body = "", css = "";
  const n = chars.length;
  chars.forEach((ch, i) => {
    if (ch === " ") return;
    const t = a + ((b - a) * i) / n;
    css += show(`${id}t${i}`, t, hide);
    body += `<text x="${(x + i * cw).toFixed(1)}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${colors ? colors[i] : fill}" class="${cls}" style="${anim(`${id}t${i}`, dur, "linear")}">${esc(ch)}</text>`;
  });
  return { body, css, at: (i) => a + ((b - a) * i) / n };
};

// 光标跟着逐字出现右移
export const caretStops = (n, a, b, cw, hide = 90) => {
  const stops = [[0, "transform:translateX(0);opacity:0"], [Math.max(0, a - 6), "transform:translateX(0);opacity:1"]];
  for (let i = 0; i < n; i++) {
    const t = a + ((b - a) * i) / n;
    stops.push([t, `transform:translateX(${i * cw}px);opacity:1`], [t + 0.01, `transform:translateX(${(i + 1) * cw}px);opacity:1`]);
  }
  stops.push([hide - 0.01, `transform:translateX(${n * cw}px);opacity:1`], [hide, `transform:translateX(0);opacity:0`], [100, "transform:translateX(0);opacity:0"]);
  return stops;
};
