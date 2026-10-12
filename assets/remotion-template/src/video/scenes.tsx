import React from "react";
import { Outro } from "../kit/Outro";
import { INTRO_IRIS, Intro } from "./Intro";

// 本条视频的场景清单：id 与旁白稿的段落 id 一一对应。
// origin：上一段最后讲到的位置（圆形转场从这里展开）；ring：新段的强调色。
export const BACKGROUND = "#EAF0FB";
export const scenes: { id: string; C: React.FC; origin?: [number, number]; ring: string }[] = [
  { id: "intro", C: Intro, ring: "#3E6FE0" },
  { id: "outro", C: () => <Outro />, origin: INTRO_IRIS, ring: "#F0436B" },
];
