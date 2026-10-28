import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/NotoSansSC";
import timeline from "../video/timeline.json";
import fontSubsets from "../video/fontSubsets.json";

// 只加载片中用到的字符分片；改动画面或稿件文字后运行 node scripts/font-subsets.cjs
const { fontFamily } = loadFont("normal", {
  weights: ["500", "700", "900"],
  subsets: fontSubsets as never,
});
export const FONT = `${fontFamily}, "PingFang SC", sans-serif`;
export const T = timeline;
export const FPS = T.fps;
// 每个场景提前 PRE 帧挂载，供上一场景的圆形转场揭开
export const PRE = 10;
export const ink = "#15181E",
  sub = "#5B6475",
  line = "#E3E6EC";
export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
export const section = (id: string) => {
  const s = T.sections.find((x) => x.id === id);
  if (!s) throw new Error(`时间线里没有段落 ${id}`);
  return s;
};
export const useLocal = () => useCurrentFrame() - PRE;

// 锚点词开始出声前 lead 帧，作为画面动作的起点（场景内局部帧）
export const beats = (id: string) => {
  const s = section(id);
  const anchors = T.anchors as Record<string, number>;
  return (name: string, lead = 4) => {
    const v = anchors[`${id}.${name}`];
    if (v === undefined) throw new Error(`缺少锚点 ${id}.${name}`);
    return v - s.startFrame - lead;
  };
};
// 场景内第一条以 text 开头的字幕起点
export const capAt = (id: string, text: string, lead = 4) => {
  const s = section(id);
  const c = T.captions.find(
    (x) => x.text.startsWith(text) && x.startFrame >= s.startFrame,
  );
  if (!c) throw new Error(`缺少字幕 ${text}`);
  return c.startFrame - s.startFrame - lead;
};

export const sp = (
  f: number,
  start: number,
  config: Partial<{ damping: number; stiffness: number; mass: number }> = {},
) =>
  spring({
    frame: f - start,
    fps: FPS,
    config: { damping: 16, stiffness: 120, mass: 0.9, ...config },
  });
export const mix = (p: number, a: number, b: number) => a + (b - a) * p;
export const fadeIn = (f: number, start: number, dur = 8) =>
  interpolate(f, [start, start + dur], [0, 1], clamp);
export const fadeOut = (f: number, start: number, dur = 8) =>
  interpolate(f, [start, start + dur], [1, 0], clamp);
export const ease = Easing.bezier(0.22, 1, 0.36, 1);

// 背景：底色、缓慢漂浮的柔光圆点
const dots = [
  [0.08, 0.2, 120],
  [0.9, 0.16, 90],
  [0.83, 0.82, 150],
  [0.13, 0.86, 80],
  [0.55, 0.08, 60],
  [0.66, 0.9, 70],
  [0.36, 0.55, 46],
];
// 背景、内容层与固定层。内容停留时完全静止（用户 2026-10-10：随机小位移会让人失焦），
// 运动只来自跟随旁白新增的内容；chrome（标签、标题、页脚说明）单独一层
export const Stage: React.FC<{
  id: string;
  bg: string;
  dur: number;
  chrome?: React.ReactNode;
  children: React.ReactNode;
}> = ({ bg, chrome, children }) => {
  const f = useLocal();
  return (
    <AbsoluteFill style={{ background: bg, fontFamily: FONT, color: ink }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 42%, rgba(255,255,255,.55), rgba(255,255,255,0) 62%)",
        }}
      />
      {dots.map(([dx, dy, r], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: dx * 1920 + Math.sin((f + i * 40) / 70) * 26 - r,
            top: dy * 1080 + Math.cos((f + i * 55) / 85) * 18 - r,
            width: r * 2,
            height: r * 2,
            borderRadius: r,
            background: "rgba(255,255,255,.55)",
            filter: "blur(1px)",
          }}
        />
      ))}
      <AbsoluteFill>{children}</AbsoluteFill>
      {chrome}
    </AbsoluteFill>
  );
};

export const Kicker: React.FC<{
  f: number;
  start: number;
  color: string;
  children: React.ReactNode;
  out?: number;
}> = ({ f, start, color, children, out = 1e9 }) => {
  const p = sp(f, start);
  return (
    <div
      style={{
        position: "absolute",
        left: 140,
        top: 58,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 26px 12px 20px",
        background: "#fff",
        borderRadius: 40,
        boxShadow: "0 6px 18px rgba(30,40,60,.08)",
        fontSize: 28,
        fontWeight: 700,
        opacity: p * fadeOut(f, out),
        translate: `${mix(p, -40, 0)}px 0`,
      }}
    >
      <span
        style={{ width: 14, height: 14, borderRadius: 7, background: color }}
      />
      {children}
    </div>
  );
};

// 标题逐字下落：每个字错开 2 帧
export const TitleDrop: React.FC<{
  f: number;
  start: number;
  text: string;
  size?: number;
  left?: number;
  top?: number;
  out?: number;
  accent?: [string, string];
}> = ({ f, start, text, size = 88, left = 140, top = 128, out = 1e9, accent }) => (
  <div
    style={{
      position: "absolute",
      left,
      top,
      fontSize: size,
      fontWeight: 900,
      letterSpacing: -1,
      whiteSpace: "nowrap",
      opacity: fadeOut(f, out, 6),
    }}
  >
    {[...text].map((c, i) => {
      const p = sp(f, start + i * 2, { damping: 13, stiffness: 190 });
      const hit = accent && text.indexOf(accent[0]) <= i && i < text.indexOf(accent[0]) + accent[0].length;
      return (
        <span
          key={i}
          style={{
            display: "inline-block",
            opacity: Math.min(1, p * 1.4),
            translate: `0 ${mix(p, -46, 0)}px`,
            scale: String(mix(p, 1.25, 1)),
            color: hit ? accent![1] : undefined,
            whiteSpace: "pre",
          }}
        >
          {c}
        </span>
      );
    })}
  </div>
);

export const Tag: React.FC<{
  children: React.ReactNode;
  color: string;
  style?: React.CSSProperties;
}> = ({ children, color, style }) => (
  <div
    style={{
      position: "absolute",
      padding: "8px 18px",
      borderRadius: 12,
      background: color,
      color: "#fff",
      fontSize: 26,
      fontWeight: 700,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </div>
);

// 示意／来源说明，固定在左下角字幕上方
export const Note: React.FC<{ f: number; start: number; children: string }> = ({
  f,
  start,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      left: 140,
      top: 902,
      fontSize: 22,
      fontWeight: 500,
      color: sub,
      opacity: fadeIn(f, start, 10) * 0.9,
    }}
  >
    {children}
  </div>
);

// 字幕：按旁白词时间硬切、首尾相接，深色直角单行
export const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const c = T.captions.find((x) => x.startFrame <= f && f < x.endFrame);
  if (!c) return null;
  return (
    <div
      data-audit="caption"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 952,
        display: "flex",
        justifyContent: "center",
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          background: "#1B1F27",
          color: "#fff",
          fontSize: 44,
          fontWeight: 700,
          lineHeight: "76px",
          padding: "0 40px",
          letterSpacing: 1,
        }}
      >
        {c.text}
      </div>
    </div>
  );
};
