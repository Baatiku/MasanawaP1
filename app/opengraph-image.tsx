import { ImageResponse } from "next/og";

export const alt = "Perfect Naira — Payments, Services & Digital Assets";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image(){return new ImageResponse(
  <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",justifyContent:"space-between",background:"#01130c",color:"#f8fcf9",padding:"64px",fontFamily:"Arial, sans-serif",position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",width:520,height:520,borderRadius:9999,background:"rgba(34,197,94,.15)",right:-120,top:-140,filter:"blur(60px)"}}/>
    <div style={{position:"absolute",width:360,height:360,borderRadius:9999,background:"rgba(216,180,91,.09)",left:-100,bottom:-180,filter:"blur(55px)"}}/>
    <div style={{display:"flex",alignItems:"center",gap:18}}><div style={{width:58,height:58,borderRadius:18,border:"2px solid #d8b45b",background:"linear-gradient(145deg,#0b5136,#052a1d)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:900}}><span style={{color:"#d8b45b"}}>P</span><span style={{color:"#ffffff",marginLeft:-4}}>N</span></div><div style={{fontSize:28,fontWeight:800}}>Perfect Naira</div></div>
    <div style={{display:"flex",flexDirection:"column",maxWidth:900}}><div style={{fontSize:70,lineHeight:1.02,fontWeight:900,letterSpacing:-3}}>Payments, services and digital assets in one secure wallet.</div><div style={{fontSize:26,lineHeight:1.5,color:"#9fb1c5",marginTop:28}}>Fund. Transfer. Pay bills. Track transactions. Access provider-backed digital assets.</div></div>
    <div style={{display:"flex",gap:26,color:"#a5b8ad",fontSize:18}}><span>Ledger-backed balances</span><span style={{color:"#d8b45b"}}>•</span><span>PIN-protected transactions</span><span style={{color:"#d8b45b"}}>•</span><span>Provider-verified settlement</span></div>
  </div>, size);
}
