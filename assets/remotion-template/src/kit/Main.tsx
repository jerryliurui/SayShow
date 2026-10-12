import React from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { Captions, PRE, T, clamp, section } from "./lib";
import { scenes, BACKGROUND } from "../video/scenes";

// 圆形转场帧数，中点约落在新段第一个字
const IRIS = 14;

// 从上一段最后讲到的位置（origin）展开新场景，ring 为新段强调色
const Iris: React.FC<{ origin?: [number, number]; ring: string; children: React.ReactNode }> = ({ origin, ring, children }) => {
  const f = useCurrentFrame();
  if (!origin) return <>{children}</>;
  const r = interpolate(f, [PRE - IRIS / 2, PRE + IRIS / 2], [0, 2300], { ...clamp, easing: Easing.bezier(0.55, 0, 0.25, 1) });
  const ringOp = interpolate(r, [0, 120, 1400, 2300], [0, 1, 0.6, 0], clamp);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `circle(${r}px at ${origin[0]}px ${origin[1]}px)` }}>{children}</AbsoluteFill>
      <div style={{ position: "absolute", left: origin[0] - r, top: origin[1] - r, width: r * 2, height: r * 2, borderRadius: "50%", border: `14px solid ${ring}`, boxSizing: "border-box", opacity: ringOp }} />
    </AbsoluteFill>
  );
};

// 整条视频：按时间线段落挂载场景，叠加旁白、配乐与字幕
export const Main: React.FC = () => {
  const t = T as typeof T & { voice?: string | null; music?: string | null };
  return (
    <AbsoluteFill style={{ background: BACKGROUND }}>
      {scenes.map(({ id, C, origin, ring }, i) => {
        const s = section(id);
        const from = i === 0 ? 0 : s.startFrame - PRE;
        const next = scenes[i + 1] ? section(scenes[i + 1].id).startFrame + PRE : T.durationInFrames;
        return (
          <Sequence key={id} name={s.title} from={from} durationInFrames={next - from} premountFor={30}>
            <Iris origin={origin} ring={ring}>
              <C />
            </Iris>
          </Sequence>
        );
      })}
      {t.voice ? <Audio src={staticFile(t.voice)} /> : null}
      {t.music ? <Audio src={staticFile(t.music)} /> : null}
      <Captions />
    </AbsoluteFill>
  );
};
