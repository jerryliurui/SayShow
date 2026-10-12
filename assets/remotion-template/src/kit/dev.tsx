import React from "react";
import { OffthreadVideo, interpolate, spring, staticFile } from "remotion";
import { FPS, clamp, fadeIn, fadeOut, mix, sp } from "./lib";

// 开发实录风格（风格库 #29）的组件：代码编辑器、快捷键键帽、录屏片段（带推近）、设备外框、章节标签。
// 画面里的代码由排版生成时，要与实际编译运行的代码一致，并在 Note 里写明"代码排版演示"；真实 Xcode 界面只来自录屏。

export const MONO = '"SF Mono", Menlo, monospace';

// ---------- Swift 语法着色（Xcode 默认深色主题的近似配色） ----------
const C = {
  bg: "#1F1F24", gutter: "#747478", plain: "rgba(255,255,255,.86)", keyword: "#FC5FA3", string: "#FC6A5D",
  number: "#D0BF69", comment: "#6C7986", type: "#5DD8FF", attr: "#FD8F3F", call: "#67B7A4", line: "#2A2B31",
};
const KEYWORDS = new Set("struct class enum protocol extension func var let some any return if else guard for in while switch case default import static private public internal fileprivate true false nil self Self init try await async throws inout where".split(" "));

type Tok = { t: string; c: string };
export const highlightSwift = (src: string): Tok[][] =>
  src.split("\n").map((line) => {
    const out: Tok[] = [];
    const re = /(\/\/.*$)|("(?:[^"\\]|\\.)*")|(@\w+)|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]\w*\b)|(\s+)|(.)/g;
    let m: RegExpExecArray | null;
    let prevDot = false;
    while ((m = re.exec(line))) {
      const [s] = m;
      let c = C.plain;
      if (m[1]) c = C.comment;
      else if (m[2]) c = C.string;
      else if (m[3]) c = C.attr;
      else if (m[4]) c = C.number;
      else if (m[5]) c = KEYWORDS.has(s) ? C.keyword : /^[A-Z]/.test(s) ? C.type : prevDot ? C.call : C.plain;
      out.push({ t: s, c });
      if (!m[6]) prevDot = s === ".";
    }
    return out;
  });

// 插入：在最终代码的 at 处，长度 len 的一段，在 [from, to] 帧内逐字打出；其余代码一直可见
export type Insert = { at: number; len: number; from: number; to: number };

export const CodeEditor: React.FC<{
  f: number;
  code: string;
  inserts?: Insert[];
  focus?: { lines: [number, number]; from: number; to?: number }[];   // 高亮行带（1 起算）
  fontSize?: number;
  firstLine?: number;
  style?: React.CSSProperties;
}> = ({ f, code, inserts = [], focus = [], fontSize = 30, firstLine = 1, style }) => {
  // 计算每个字符此刻是否可见，以及光标位置
  const hidden = new Array(code.length).fill(false);
  let cursor = -1;
  for (const ins of inserts) {
    const shown = Math.round(interpolate(f, [ins.from, ins.to], [0, ins.len], clamp));
    for (let i = ins.at + shown; i < ins.at + ins.len; i++) hidden[i] = true;
    if (f >= ins.from - 6 && f <= ins.to + 20) cursor = ins.at + shown;
  }
  const lines = highlightSwift(code);
  const lh = fontSize * 1.5;
  let idx = 0;
  let shownLine = firstLine - 1;   // 行号按当前可见的行重新编号，和 Xcode 一致
  return (
    <div style={{ position: "absolute", background: C.bg, borderRadius: 18, overflow: "hidden", fontFamily: MONO, fontSize, lineHeight: `${lh}px`, padding: "24px 0", ...style }}>
      {lines.map((toks, li) => {
        const lineStart = idx;
        // 整行都还没打出来的行不占位（插入的新行逐行"长出来"）
        const lineLen = toks.reduce((a, t) => a + t.t.length, 0);
        const span = hidden.slice(lineStart, Math.min(code.length, lineStart + lineLen + 1));   // 含行尾换行符
        const allHidden = span.length > 0 && span.every(Boolean);
        if (!allHidden) shownLine += 1;
        const n = shownLine;
        const band = focus.find((x) => n >= x.lines[0] && n <= x.lines[1] && f >= x.from && (x.to === undefined || f < x.to));
        let col = lineStart;
        const row = (
          <div key={li} style={{ display: allHidden ? "none" : "flex", background: band ? "rgba(93,216,255,.14)" : undefined, boxShadow: band ? "inset 4px 0 0 #5DD8FF" : undefined }}>
            <span style={{ width: fontSize * 2.6, textAlign: "right", paddingRight: fontSize * 0.9, color: C.gutter, flexShrink: 0 }}>{n}</span>
            <span style={{ whiteSpace: "pre" }}>
              {toks.map((tk, ti) => {
                const s = col; col += tk.t.length;
                const vis = [...tk.t].map((ch, k) => (hidden[s + k] ? "" : ch)).join("");
                const caretHere = cursor >= s && cursor < col;
                if (!caretHere) return <span key={ti} style={{ color: tk.c }}>{vis}</span>;
                const k = cursor - s;
                return (
                  <span key={ti} style={{ color: tk.c }}>{vis.slice(0, k)}<Caret f={f} />{vis.slice(k)}</span>
                );
              })}
              {cursor === col && <Caret f={f} />}
            </span>
          </div>
        );
        idx = lineStart + lineLen + 1;   // 加上换行符
        return row;
      })}
    </div>
  );
};
const Caret: React.FC<{ f: number }> = ({ f }) => (
  <span style={{ display: "inline-block", width: 3, height: "1.1em", marginBottom: "-0.18em", background: "#fff", opacity: Math.floor(f / 15) % 2 ? 0.25 : 1 }} />
);

// ---------- 快捷键键帽：依次按下，下方标注作用 ----------
export const KeyCaps: React.FC<{ f: number; at: number; keys: string[]; label?: string; x: number; y: number; dur?: number; color?: string }> = ({ f, at, keys, label, x, y, dur = 60, color = "#7457E0" }) => {
  if (f < at - 2 || f > at + dur + 10) return null;
  const op = fadeIn(f, at, 5) * fadeOut(f, at + dur, 8);
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: op, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10, zIndex: 30 }}>
      <div style={{ display: "flex", gap: 10 }}>
        {keys.map((k, i) => {
          const press = spring({ frame: f - at - i * 4, fps: FPS, config: { damping: 12, stiffness: 260 } });
          const down = f >= at + i * 4 && f < at + i * 4 + 8;
          return (
            <span key={i} style={{ minWidth: 64, height: 64, padding: "0 14px", boxSizing: "border-box", borderRadius: 14, background: "#fff", color: "#15181E", fontFamily: MONO, fontSize: 34, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: down ? "0 2px 0 #B9BECB" : "0 6px 0 #B9BECB, 0 10px 24px rgba(0,0,0,.3)", translate: `0 ${down ? 4 : 0}px`, scale: String(mix(press, 0.6, 1)) }}>{k}</span>
          );
        })}
      </div>
      {label && <div style={{ padding: "8px 18px", borderRadius: 10, background: color, color: "#fff", fontSize: 28, fontWeight: 700, opacity: fadeIn(f, at + keys.length * 4, 6) }}>{label}</div>}
    </div>
  );
};

// ---------- 录屏片段：放 public/ 下的真实录屏，可变速、按锚点推近到某个区域 ----------
// zooms：[起始帧, 中心 x, 中心 y, 放大倍数]，坐标为录屏原始像素；相邻两档之间用 spring 过渡
export const ScreenClip: React.FC<{
  f: number; src: string; srcW: number; srcH: number; w: number; h: number;
  startFrom?: number; rate?: number; zooms?: [number, number, number, number][]; style?: React.CSSProperties;
}> = ({ f, src, srcW, srcH, w, h, startFrom = 0, rate = 1, zooms = [], style }) => {
  const base = Math.min(w / srcW, h / srcH);
  let cx = srcW / 2, cy = srcH / 2, s = 1;
  zooms.forEach((z) => {
    const p = spring({ frame: f - z[0], fps: FPS, config: { damping: 22, stiffness: 90 } });
    cx = mix(p, cx, z[1]); cy = mix(p, cy, z[2]); s = mix(p, s, z[3]);
  });
  const k = base * s;
  // 推近后不露出录屏边缘
  const left = Math.min(0, Math.max(w - srcW * k, w / 2 - cx * k));
  const top = Math.min(0, Math.max(h - srcH * k, h / 2 - cy * k));
  return (
    <div style={{ position: "absolute", width: w, height: h, overflow: "hidden", borderRadius: 16, background: "#000", ...style }}>
      <div style={{ position: "absolute", left: s === 1 ? (w - srcW * k) / 2 : left, top: s === 1 ? (h - srcH * k) / 2 : top, width: srcW * k, height: srcH * k }}>
        <OffthreadVideo src={staticFile(src)} startFrom={Math.round(startFrom * FPS)} playbackRate={rate} muted style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
};

// ---------- 设备外框：通用 iPhone（灵动岛）。外形不同的机型（如折叠屏）用模拟器或真机的真实边框，不用这个 ----------
export const PhoneFrame: React.FC<{ x: number; y: number; h: number; island?: boolean; children: React.ReactNode }> = ({ x, y, h, island = true, children }) => {
  const w = h * (1179 / 2556);
  const bezel = h * 0.018;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w + bezel * 2, height: h + bezel * 2, borderRadius: h * 0.075, background: "#111", boxShadow: "0 0 0 3px #3A3A3F, 0 30px 60px rgba(0,0,0,.35)", padding: bezel, boxSizing: "border-box" }}>
      <div style={{ position: "relative", width: w, height: h, borderRadius: h * 0.062, overflow: "hidden", background: "#000" }}>
        {children}
        {island && <div style={{ position: "absolute", left: "50%", top: h * 0.012, width: w * 0.3, height: h * 0.037, translate: "-50% 0", borderRadius: 999, background: "#000" }} />}
      </div>
    </div>
  );
};

// ---------- 章节标签：编号＋中文标题＋英文副标题的描边框（沿用用户旧视频的样式） ----------
export const ChapterTag: React.FC<{ f: number; at: number; no: string; title: string; en?: string; x?: number; y?: number; out?: number }> = ({ f, at, no, title, en, x = 1380, y = 840, out = 1e9 }) => {
  const p = sp(f, at, { damping: 16, stiffness: 140 });
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: Math.min(1, p * 1.5) * fadeOut(f, out, 8), translate: `${mix(p, 60, 0)}px 0`, textAlign: "center", zIndex: 30 }}>
      <div style={{ padding: "6px 22px", border: "3px solid #fff", background: "rgba(20,22,28,.55)", color: "#fff", fontSize: 46, fontWeight: 700, letterSpacing: 2 }}>{no}.{title}</div>
      {en && <div style={{ marginTop: 6, color: "rgba(255,255,255,.85)", fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>{en}</div>}
    </div>
  );
};
