import React from "react";
import { AbsoluteFill } from "remotion";
import { FONT } from "../kit/lib";
import brand from "./brand.json";
// 4:3 起点：共享本期主题与素材，独立重排，不能裁切或整体缩放 16:9 封面。
export const CoverFourThree: React.FC = () => (
 <AbsoluteFill style={{background:"linear-gradient(125deg,#FBFCFF,#DCE5FA 50%,#F4F7FD)",fontFamily:FONT,color:"#24354F",padding:72}}>
  <div style={{fontSize:36,fontWeight:700,color:"#647FA5"}}>{brand.kicker}</div>
  <div style={{marginTop:130,fontSize:132,fontWeight:900,lineHeight:1.2}}>视频标题</div>
  <div style={{marginTop:60,fontSize:48,fontWeight:700,color:"#647FA5"}}>共享本期主视觉，按 4:3 重新安排</div>
 </AbsoluteFill>
);
