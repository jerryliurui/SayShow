import React from "react";
import { AbsoluteFill } from "remotion";
import { FONT } from "../kit/lib";
import brand from "./brand.json";

// 竖版封面起点：每条视频按内容重新设计；同系列封面层级与配色遵循项目 AGENTS.md。
export const Cover: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(125deg,#FBFCFF,#DCE5FA 50%,#F4F7FD)", fontFamily: FONT, color: "#24354F", padding: 70 }}>
    <div style={{ fontSize: 30, fontWeight: 700, color: "#647FA5", borderBottom: "2px solid #CCD7E8", paddingBottom: 22 }}>{brand.kicker}</div>
    <div style={{ marginTop: 120, fontSize: 120, fontWeight: 900, lineHeight: 1.15, letterSpacing: -3 }}>视频标题</div>
    <div style={{ marginTop: 40, fontSize: 44, fontWeight: 700, color: "#647FA5" }}>横版动画讲解 · 旁白与同步字幕</div>
  </AbsoluteFill>
);
