import React from "react";
import { AbsoluteFill } from "remotion";
import { FONT } from "../kit/lib";
import brand from "./brand.json";
// 横版封面起点：与竖版同主题、配色和主视觉，按 16:9 独立排版。
export const CoverLandscape: React.FC = () => (
 <AbsoluteFill style={{background:"linear-gradient(125deg,#FBFCFF,#DCE5FA 50%,#F4F7FD)",fontFamily:FONT,color:"#24354F",padding:90}}>
  <div style={{fontSize:36,fontWeight:700,color:"#647FA5"}}>{brand.kicker}</div>
  <div style={{marginTop:150,fontSize:140,fontWeight:900,lineHeight:1.2}}>视频标题</div>
  <div style={{marginTop:50,fontSize:44,color:"#647FA5"}}>按内容添加本期主视觉</div>
 </AbsoluteFill>
);
