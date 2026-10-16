import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { FONT } from "../kit/lib";
import brand from "./brand.json";
// 单张横版母图：所有关键内容在中央 1440×1080 内，左右 240px 仅作背景延伸。
export const CoverLandscape: React.FC = () => {
 const { width } = useVideoConfig();
 return <AbsoluteFill style={{background:"#F4F7FD",fontFamily:FONT,color:"#24354F"}}>
  <div style={{position:"absolute",left:(width-1440)/2,top:0,width:1440,height:1080,padding:72,boxSizing:"border-box"}}>
   <div style={{fontSize:36,fontWeight:700,color:"#647FA5"}}>{brand.kicker}</div>
   <div style={{marginTop:150,fontSize:140,fontWeight:900,lineHeight:1.2}}>视频标题</div>
   <div style={{marginTop:70,fontSize:56,fontWeight:700}}>副标题与本期主视觉</div>
  </div>
 </AbsoluteFill>;
};
