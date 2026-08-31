import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon(){return new ImageResponse(<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"#081526",borderRadius:38}}><div style={{fontSize:92,fontWeight:900,lineHeight:1,background:"linear-gradient(135deg,#22d3ee,#2563eb)",backgroundClip:"text",color:"transparent"}}>M</div></div>,size)}
