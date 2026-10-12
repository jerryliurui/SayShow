import React from "react";
import { spring } from "remotion";
import { FPS, fadeIn, fadeOut, mix, sub } from "./lib";

export const MONO = '"SF Mono", Menlo, monospace';

const stroke = {
  fill: "none",
  stroke: "#fff",
  strokeWidth: 2.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
const shapes: Record<string, React.ReactNode> = {
  grid: (<><rect x="5" y="5" width="6" height="6" rx="1.5" {...stroke} /><rect x="13" y="5" width="6" height="6" rx="1.5" {...stroke} /><rect x="5" y="13" width="14" height="6" rx="1.5" {...stroke} /></>),
  photo: (<><rect x="4" y="6" width="16" height="12" rx="2" {...stroke} /><circle cx="9" cy="10" r="1.6" {...stroke} /><path d="M5 17l5-4 3 2 3-3 3 3" {...stroke} /></>),
  phone: (<><rect x="7" y="3.5" width="10" height="17" rx="2.4" {...stroke} /><path d="M11 17.5h2" {...stroke} /></>),
  tool: (<path d="M14.5 5.5a4 4 0 0 0 4.6 5.4l-7.6 7.6a2 2 0 0 1-2.8-2.8l7.6-7.6" {...stroke} />),
  scan: (<><circle cx="11" cy="11" r="5.5" {...stroke} /><path d="M15.2 15.2L19.5 19.5" {...stroke} /></>),
  edit: (<path d="M5 19l1-4 9.5-9.5a2 2 0 0 1 3 3L9 18z" {...stroke} />),
  play: (<path d="M9 6.5l8 5.5-8 5.5z" {...stroke} />),
  term: (<><rect x="3.5" y="5" width="17" height="14" rx="2.5" {...stroke} /><path d="M7 10l3 2-3 2M12 15h5" {...stroke} /></>),
  resize: (<><rect x="4" y="6" width="16" height="12" rx="2" {...stroke} /><path d="M9 12h6M9 12l2-2M9 12l2 2M15 12l-2-2M15 12l-2 2" {...stroke} /></>),
  mirror: (<><rect x="3" y="6" width="11" height="12" rx="2" {...stroke} /><rect x="15" y="8" width="6" height="10" rx="1.6" {...stroke} /></>),
  fold: (<><rect x="4" y="5" width="7" height="14" rx="1.8" {...stroke} /><rect x="13" y="5" width="7" height="14" rx="1.8" {...stroke} /></>),
  upload: (<><path d="M12 16V6M8 10l4-4 4 4" {...stroke} /><path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" {...stroke} /></>),
  globe: (<><circle cx="12" cy="12" r="8" {...stroke} /><path d="M4 12h16M12 4c2.5 2.5 2.5 13.5 0 16M12 4c-2.5 2.5-2.5 13.5 0 16" {...stroke} /></>),
  note: (<><rect x="5" y="4" width="14" height="16" rx="2" {...stroke} /><path d="M8.5 9h7M8.5 12.5h7M8.5 16h4" {...stroke} /></>),
  check: (<path d="M6 12.5l4 4 8-9" {...stroke} />),
};

export const Icon: React.FC<{ kind: string; color: string; size?: number }> = ({
  kind,
  color,
  size = 40,
}) => (
  <div
    style={{
      width: size * 1.6,
      height: size * 1.6,
      borderRadius: size * 0.42,
      background: color,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <svg width={size} height={size} viewBox="0 0 24 24">
      {shapes[kind]}
    </svg>
  </div>
);

// 带红黄绿按钮的窗口外框
export const Win: React.FC<{
  title?: string;
  dark?: boolean;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ title, dark, style, children }) => (
  <div
    style={{
      position: "absolute",
      borderRadius: 26,
      background: dark ? "#1C2230" : "#fff",
      boxShadow: "0 28px 60px rgba(30,40,70,.14)",
      overflow: "hidden",
      ...style,
    }}
  >
    <div
      style={{
        height: 58,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 24px",
        borderBottom: dark ? "2px solid #2B3344" : "2px solid #EEF0F4",
      }}
    >
      {["#FF6159", "#FFBD2E", "#28C941"].map((c) => (
        <span key={c} style={{ width: 15, height: 15, borderRadius: 8, background: c }} />
      ))}
      {title ? (
        <span style={{ marginLeft: 14, fontSize: 24, fontWeight: 700, color: dark ? "#8C97AB" : sub }}>
          {title}
        </span>
      ) : null}
    </div>
    {children}
  </div>
);

export const Check: React.FC<{ p: number; color: string; size?: number; style?: React.CSSProperties }> = ({
  p,
  color,
  size = 44,
  style,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      background: color,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      scale: String(p),
      opacity: Math.min(1, p * 2),
      ...style,
    }}
  >
    <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24">
      <path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

// 焦点框：按旁白顺序在讲到的元素之间移动（每个目标 [起始帧, x, y, w, h]），引导视线，代替随机位移
export const FocusRing: React.FC<{
  f: number;
  targets: [number, number, number, number, number][];
  color: string;
  until?: number;
  radius?: number;
}> = ({ f, targets, color, until = 1e9, radius = 22 }) => {
  if (!targets.length || f < targets[0][0] - 2) return null;
  let [, x, y, w, h] = targets[0];
  targets.forEach((t, i) => {
    if (i === 0) return;
    const p = spring({ frame: f - t[0], fps: FPS, config: { damping: 20, stiffness: 150 } });
    x = mix(p, x, t[1]); y = mix(p, y, t[2]); w = mix(p, w, t[3]); h = mix(p, h, t[4]);
  });
  const op = fadeIn(f, targets[0][0], 6) * fadeOut(f, until, 8);
  return (
    <div style={{ position: "absolute", left: x - 10, top: y - 10, width: w + 20, height: h + 20, borderRadius: radius, border: `5px solid ${color}`, boxShadow: `0 0 0 8px ${color}22`, opacity: op, pointerEvents: "none", zIndex: 20 }} />
  );
};

// 沿路径飞行的小标签：表现数据或状态从一处流向另一处（“背后的机制”）
export const Flyer: React.FC<{
  f: number;
  start: number;
  from: [number, number];
  to: [number, number];
  dur?: number;
  arc?: number;
  children: React.ReactNode;
  stay?: boolean;
}> = ({ f, start, from, to, dur = 22, arc = -120, children, stay = true }) => {
  if (f < start) return null;
  const t = Math.min(1, (f - start) / dur);
  const e = 1 - Math.pow(1 - t, 3);
  const x = mix(e, from[0], to[0]);
  const y = mix(e, from[1], to[1]) + arc * 4 * e * (1 - e);
  const op = stay ? fadeIn(f, start, 4) : fadeIn(f, start, 4) * fadeOut(f, start + dur + 6, 6);
  return <div style={{ position: "absolute", left: x, top: y, translate: "-50% -50%", opacity: op, zIndex: 25 }}>{children}</div>;
};

// 逐字打出：在 [start, start+dur] 内按字符显示，未显示部分保留占位宽度，避免排版跳动
export const Typed: React.FC<{ f: number; start: number; dur: number; text: string; style?: React.CSSProperties }> = ({ f, start, dur, text, style }) => {
  const n = Math.round(Math.max(0, Math.min(1, (f - start) / dur)) * text.length);
  return (
    <span style={style}>
      {text.slice(0, n)}
      <span style={{ opacity: 0 }}>{text.slice(n)}</span>
    </span>
  );
};

// 跟读：文字先为浅灰，随朗读进度从左到右变深（start—end 为对应字幕的起止帧）
export const ReadAlong: React.FC<{ f: number; start: number; end: number; text: string; dim?: string }> = ({ f, start, end, text, dim = "#A7AEBB" }) => {
  const n = Math.max(0, Math.min(1, (f - start) / Math.max(1, end - start))) * text.length;
  return (
    <>
      {[...text].map((c, i) => (
        <span key={i} style={{ color: i < n ? undefined : dim, transition: "none" }}>{c}</span>
      ))}
    </>
  );
};

// 数字滚动：讲到时从 0 滚到目标值
export const CountUp: React.FC<{ f: number; start: number; to: number; dur?: number }> = ({ f, start, to, dur = 24 }) => {
  const t = Math.max(0, Math.min(1, (f - start) / dur));
  const e = 1 - Math.pow(1 - t, 3);
  return <>{f < start ? to : Math.round(to * e)}</>;
};

// 框线一笔画出：讲到时沿边框描出
export const DrawBox: React.FC<{ f: number; start: number; w: number; h: number; color: string; r?: number; dur?: number; width?: number; fill?: string }> = ({ f, start, w, h, color, r = 14, dur = 22, width = 5, fill }) => {
  const per = 2 * (w + h);
  const t = Math.max(0, Math.min(1, (f - start) / dur));
  const e = 1 - Math.pow(1 - t, 2);
  return (
    <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <rect x={0} y={0} width={w} height={h} rx={r} fill={fill ?? "none"} fillOpacity={e} stroke={color} strokeWidth={width} strokeDasharray={per} strokeDashoffset={per * (1 - e)} />
    </svg>
  );
};
