import { ImageResponse } from "next/og";

export const alt = "Masanawa — Payments, Services & Digital Assets";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image(){return new ImageResponse(
  <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",justifyContent:"space-between",background:"#07111f",color:"#f8fbff",padding:"64px",fontFamily:"Arial, sans-serif",position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",width:520,height:520,borderRadius:9999,background:"rgba(34,195,238,.14)",right:-120,top:-140,filter:"blur(60px)"}}/>
    <div style={{display:"flex",alignItems:"center",gap:18}}><div style={{width:56,height:56,borderRadius:18,background:"linear-gradient(135deg,#22d3ee,#2563eb)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,fontWeight:900}}>M</div><div style={{fontSize:28,fontWeight:800}}>Masanawa</div></div>
    <div style={{display:"flex",flexDirection:"column",maxWidth:900}}><div style={{fontSize:70,lineHeight:1.02,fontWeight:900,letterSpacing:-3}}>Payments, services and digital assets in one secure wallet.</div><div style={{fontSize:26,lineHeight:1.5,color:"#9fb1c5",marginTop:28}}>Fund. Transfer. Pay bills. Track transactions. Access provider-backed digital assets.</div></div>
    <div style={{display:"flex",gap:26,color:"#93a7bd",fontSize:18}}><span>Ledger-backed balances</span><span>•</span><span>PIN-protected transactions</span><span>•</span><span>Provider-verified settlement</span></div>
  </div>, size);
}
