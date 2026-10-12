import React from "react";
import { Kicker, Note, Stage, TitleDrop, beats, capAt, fadeIn, mix, section, sp, useLocal } from "../kit/lib";
import { CountUp, FocusRing } from "../kit/ui";

// 示例场景：演示锚点驱动（beats）、字幕起点（capAt）、固定层（chrome）与焦点框。新视频按内容重写，不要照搬版式。
const blue = "#3E6FE0";
const s = section("intro");
export const INTRO_DUR = s.endFrame - s.startFrame;
export const INTRO_IRIS: [number, number] = [1300, 560];

export const Intro: React.FC = () => {
  const f = useLocal();
  const b = beats("intro");
  const cards = [
    { key: "旁白", n: 1 },
    { key: "动画", n: 2 },
    { key: "配乐", n: 3 },
  ];
  return (
    <Stage id="intro" bg="#EAF0FB" dur={INTRO_DUR}
      chrome={
        <>
          <Kicker f={f} start={0} color={blue}>示例 · 模板自检</Kicker>
          <TitleDrop f={f} start={4} text="一条视频的三层" accent={["三层", blue]} />
          <FocusRing f={f} color={blue} targets={cards.map((c, i) => [b(c.key), 140 + i * 560, 330, 520, 360] as [number, number, number, number, number])} />
          <Note f={f} start={capAt("intro", "示例")}>模板示例画面，新视频请替换</Note>
        </>
      }
    >
      {cards.map((c, i) => {
        const p = sp(f, b(c.key));
        return (
          <div key={c.key} style={{ position: "absolute", left: 140 + i * 560, top: 330, width: 520, height: 360, borderRadius: 30, background: "#fff", boxShadow: "0 24px 50px rgba(30,40,70,.12)", opacity: fadeIn(f, b(c.key) - 2, 6), translate: `0 ${mix(p, 200, 0)}px`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <div style={{ fontSize: 120, fontWeight: 900, color: blue }}><CountUp f={f} start={b(c.key)} to={c.n} dur={12} /></div>
            <div style={{ fontSize: 48, fontWeight: 900 }}>{c.key}</div>
          </div>
        );
      })}
    </Stage>
  );
};
