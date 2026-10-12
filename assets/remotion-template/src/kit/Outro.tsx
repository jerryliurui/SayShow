import React from "react";
import { Img, interpolate, staticFile } from "remotion";
import { Kicker, Stage, T, TitleDrop, clamp, fadeIn, mix, section, sp, sub, useLocal } from "./lib";
import brand from "../video/brand.json";

// 通用收尾：圆形头像一缩一放弹入，"我是…"，讲到"一键三连"时三个按钮依次点亮，"下一期见"，最后淡出。
// 旁白里的锚点词来自 brand.json（name / cta / bye），与 profile.json 的片尾稿一致。
const blue = "#3E6FE0", pink = "#F0436B", gold = "#F2A33A";

const Heart: React.FC<{ fill: string; size: number; mark?: string }> = ({ fill, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.5 3 5 6.4 5c2 0 3.4 1.1 4.1 2.3h3C14.2 6.1 15.6 5 17.6 5 21 5 23.1 8.5 21.6 11.8 19.5 16.4 12 21 12 21z" fill={fill} /></svg>
);
const Star: React.FC<{ fill: string; size: number; mark?: string }> = ({ fill, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z" fill={fill} /></svg>
);
const Plus: React.FC<{ fill: string; size: number; mark?: string }> = ({ fill, size, mark = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill={fill} /><path d="M12 7v10M7 12h10" stroke={mark} strokeWidth="2.6" strokeLinecap="round" /></svg>
);

export const Outro: React.FC<{ id?: string }> = ({ id = "outro" }) => {
  const f = useLocal();
  const s = section(id);
  const dur = s.endFrame - s.startFrame;
  const anchors = T.anchors as Record<string, number>;
  // 锚点缺失时按段内比例兜底，保证没有对应口播也能出画面
  const at = (word: string, frac: number) => (anchors[`${id}.${word}`] ?? s.startFrame + (s.voiceEndFrame - s.startFrame) * frac) - s.startFrame - 4;
  const nameAt = at(brand.name, 0.25), triple = at(brand.cta, 0.75), bye = at(brand.bye, 0.9);
  const pop = sp(f, 2, { damping: 9, stiffness: 140 });
  const bump = interpolate(f, [triple, triple + 6, triple + 18], [0, 1, 0], clamp);
  const fadeEnd = interpolate(f, [dur - 30, dur], [0, 1], clamp);
  const buttons = [
    { label: "点赞", color: pink, Icon: Heart },
    { label: "收藏", color: gold, Icon: Star },
    { label: "关注", color: blue, Icon: Plus },
  ];
  return (
    <Stage id={id} bg="#FFF6EB" dur={dur}
      chrome={
        <>
          <Kicker f={f} start={0} color={blue}>{brand.kicker}</Kicker>
          <TitleDrop f={f} start={nameAt + 4} text={`我是${brand.name}`} size={104} left={900} top={250} accent={[brand.name, blue]} />
          <div style={{ position: "absolute", left: 904, top: 392, fontSize: 36, fontWeight: 700, color: sub, opacity: fadeIn(f, nameAt + 14, 10), translate: `0 ${mix(sp(f, nameAt + 14), 30, 0)}px` }}>{brand.sub}</div>
          <TitleDrop f={f} start={bye + 2} text={brand.bye} size={96} left={900} top={700} accent={[brand.bye, pink]} />
          <div style={{ position: "absolute", inset: 0, background: "#FFF6EB", opacity: fadeEnd }} />
        </>
      }
    >
      <div style={{ position: "absolute", left: 560, top: 525, width: 440, height: 440, translate: "-50% -50%", borderRadius: "50%", overflow: "hidden", border: "10px solid #fff", boxShadow: "0 30px 60px rgba(120,80,30,.18)", opacity: fadeIn(f, 2, 6), scale: String(mix(pop, 0.4, 1) * (1 + 0.08 * bump)) }}>
        <Img src={staticFile(brand.avatar)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ position: "absolute", left: 900, top: 500, display: "flex", gap: 30 }}>
        {buttons.map((x, i) => {
          const t = triple + i * 5;
          const ghost = sp(f, nameAt + 20 + i * 4);
          const on = sp(f, t, { damping: 9, stiffness: 220 });
          const lit = f >= t;
          return (
            <div key={x.label} style={{ position: "relative", width: 240, height: 120, borderRadius: 60, background: lit ? x.color : "#fff", color: lit ? "#fff" : "#8C95A6", boxShadow: lit ? `0 18px 36px ${x.color}55` : "0 10px 24px rgba(120,80,30,.1)", display: "flex", alignItems: "center", justifyContent: "center", gap: 16, fontSize: 42, fontWeight: 900, opacity: ghost, translate: `0 ${mix(ghost, 120, 0)}px`, scale: String(lit ? mix(on, 0.7, 1) : 1) }}>
              <x.Icon fill={lit ? "#fff" : "#C3C9D4"} size={48} mark={lit ? x.color : "#fff"} />
              {x.label}
              {lit && [0, 1, 2, 3, 4, 5].map((k) => {
                const a = (k / 6) * Math.PI * 2;
                const d = interpolate(f, [t, t + 16], [0, 110], clamp);
                return <span key={k} style={{ position: "absolute", left: 120 + Math.cos(a) * d - 7, top: 60 + Math.sin(a) * d - 7, width: 14, height: 14, borderRadius: 7, background: x.color, opacity: interpolate(f, [t + 6, t + 18], [1, 0], clamp) }} />;
              })}
            </div>
          );
        })}
      </div>
    </Stage>
  );
};
