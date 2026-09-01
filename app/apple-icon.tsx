import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon(){return new ImageResponse(<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(145deg,#083f2b,#01130c)",borderRadius:38,border:"5px solid #d8b45b"}}><div style={{display:"flex",alignItems:"center",fontSize:72,fontWeight:900,lineHeight:1,letterSpacing:-12}}><span style={{color:"#d8b45b"}}>P</span><span style={{color:"#ffffff"}}>N</span></div></div>,size)}
