import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

/* ─── BGPattern ──────────────────────────────────────────────────── */
const MASKS = {
  "fade-edges":  "radial-gradient(ellipse at center, black 20%, transparent 80%)",
  "fade-center": "radial-gradient(ellipse at center, transparent 20%, black 80%)",
  "fade-top":    "linear-gradient(to bottom, transparent, black)",
  "fade-bottom": "linear-gradient(to bottom, black, transparent)",
  "fade-left":   "linear-gradient(to right, transparent, black)",
  "fade-right":  "linear-gradient(to right, black, transparent)",
  "fade-x":      "linear-gradient(to right, transparent, black, transparent)",
  "fade-y":      "linear-gradient(to bottom, transparent, black, transparent)",
  "none":        "none",
};
function getBgImage(variant, fill, size) {
  switch (variant) {
    case "dots":              return `radial-gradient(${fill} 1px, transparent 1px)`;
    case "grid":              return `linear-gradient(to right,${fill} 1px,transparent 1px),linear-gradient(to bottom,${fill} 1px,transparent 1px)`;
    case "diagonal-stripes":  return `repeating-linear-gradient(45deg,${fill},${fill} 1px,transparent 1px,transparent ${size}px)`;
    case "horizontal-lines":  return `linear-gradient(to bottom,${fill} 1px,transparent 1px)`;
    case "vertical-lines":    return `linear-gradient(to right,${fill} 1px,transparent 1px)`;
    case "checkerboard":      return `linear-gradient(45deg,${fill} 25%,transparent 25%),linear-gradient(-45deg,${fill} 25%,transparent 25%),linear-gradient(45deg,transparent 75%,${fill} 75%),linear-gradient(-45deg,transparent 75%,${fill} 75%)`;
    default: return undefined;
  }
}
function BGPattern({ variant = "grid", mask = "none", size = 32, fill, style = {}, ...rest }) {
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
      backgroundImage: getBgImage(variant, fill, size),
      backgroundSize: `${size}px ${size}px`,
      WebkitMaskImage: MASKS[mask] || "none",
      maskImage: MASKS[mask] || "none",
      ...style,
    }} {...rest} />
  );
}

/* ─── Fonts & global CSS ─────────────────────────────────────────── */
const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}
  ::-webkit-scrollbar{width:3px;}
  ::-webkit-scrollbar-track{background:var(--l-bg);}
  ::-webkit-scrollbar-thumb{background:rgba(128,128,128,0.2);border-radius:2px;}

  @keyframes lFadeUp{from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:translateY(0);}}
  @keyframes lFadeIn{from{opacity:0;}to{opacity:1;}}
  @keyframes lTicker{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
  @keyframes lPulse{0%,100%{opacity:.4;transform:scale(1);}50%{opacity:1;transform:scale(1.2);}}
  @keyframes lGrad{0%{background-position:0% 50%;}50%{background-position:100% 50%;}100%{background-position:0% 50%;}}
  @keyframes lChartLine{from{stroke-dashoffset:600;}to{stroke-dashoffset:0;}}

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .l-nav-links  { display: none !important; }
    .l-hero-title { font-size: clamp(22px, 6vw, 42px) !important; }
    .l-dash-body  { grid-template-columns: 1fr !important; }
    .l-dash-right { display: none !important; }
    .l-stat-row   { grid-template-columns: repeat(2,1fr) !important; }
    .l-feat-grid  { grid-template-columns: 1fr !important; }
    .l-price-grid { grid-template-columns: 1fr !important; }
    .l-price-left { border-radius: 18px 18px 0 0 !important; }
    .l-price-right{ border-left: 1px solid var(--l-border) !important; border-top: none !important; border-radius: 0 0 18px 18px !important; }
    .l-stats-grid { grid-template-columns: repeat(2,1fr) !important; }
    .l-reveal-text{ font-size: clamp(20px, 5vw, 34px) !important; }
    .l-dash-card  { height: 460px !important; }
    .l-section    { padding: 80px 5vw !important; }
    .l-scroll-title{ padding: 0 6vw !important; }
  }
  @media (max-width: 480px) {
    .l-hero-title { font-size: clamp(20px, 6.5vw, 36px) !important; }
    .l-cta-btns   { flex-direction: column !important; }
    .l-cta-btns a, .l-cta-btns button { width: 100% !important; justify-content: center !important; }
    .l-stats-grid { grid-template-columns: 1fr 1fr !important; gap: 32px 16px !important; }
  }
`;

/* ─── Theme colors ───────────────────────────────────────────────── */
function getC(dark) {
  return dark ? {
    bg:           "#060608",
    bg2:          "#0e0f12",
    text:         "#ffffff",
    textDim:      "rgba(255,255,255,0.4)",
    textDimmer:   "rgba(255,255,255,0.18)",
    border:       "rgba(255,255,255,0.07)",
    cardBg:       "rgba(255,255,255,0.03)",
    cardBgH:      "rgba(255,255,255,0.07)",
    patternFill:  "rgba(232,205,169,0.35)",
    tickerBg:     "rgba(232,205,169,0.04)",
    tickerBorder: "rgba(232,205,169,0.1)",
    navBg:        "rgba(6,6,8,0.88)",
    scrollBg:     "rgba(255,255,255,0.1)",
  } : {
    bg:           "#f8f7f5",
    bg2:          "#efefeb",
    text:         "#111111",
    textDim:      "rgba(0,0,0,0.45)",
    textDimmer:   "rgba(0,0,0,0.22)",
    border:       "rgba(0,0,0,0.08)",
    cardBg:       "rgba(0,0,0,0.025)",
    cardBgH:      "rgba(0,0,0,0.055)",
    patternFill:  "rgba(0,0,0,0.13)",
    tickerBg:     "rgba(232,205,169,0.07)",
    tickerBorder: "rgba(232,205,169,0.18)",
    navBg:        "rgba(248,247,245,0.92)",
    scrollBg:     "rgba(0,0,0,0.12)",
  };
}

/* ─── Hooks ──────────────────────────────────────────────────────── */
function useInView(threshold = 0.12) {
  const ref = useRef();
  const [v, setV] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); o.disconnect(); } }, { threshold });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  return [ref, v];
}

/* ─── TextRevealByWord ───────────────────────────────────────────── */
function TextRevealByWord({ text, C }) {
  const containerRef = useRef();
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const total = containerRef.current.offsetHeight - window.innerHeight;
      setProgress(Math.max(0, Math.min(1, -rect.top / total)));
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  const words = text.split(" ");
  return (
    <div ref={containerRef} style={{ height: "280vh", position: "relative", background: C.bg }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6vw" }}>
        <BGPattern variant="dots" mask="fade-edges" size={28} fill={C.patternFill} />
        <p className="l-reveal-text" style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: "clamp(26px,3.8vw,52px)", lineHeight: 1.45, maxWidth: 880, textAlign: "center" }}>
          {words.map((word, i) => {
            const start = (i / words.length) * 0.85;
            const end   = ((i + 1) / words.length) * 0.85;
            const wp    = Math.max(0, Math.min(1, (progress - start) / (end - start)));
            return (
              <span key={i} style={{ color: C.text, opacity: 0.1 + wp * 0.9, marginRight: "0.28em", display: "inline-block", transition: "opacity 0.05s" }}>{word}</span>
            );
          })}
        </p>
      </div>
    </div>
  );
}

/* ─── Reveal wrapper ─────────────────────────────────────────────── */
function R({ children, delay = 0 }) {
  const [ref, v] = useInView();
  return (
    <div ref={ref} style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateY(28px)", transition: `opacity .9s ${delay}s cubic-bezier(.16,1,.3,1),transform .9s ${delay}s cubic-bezier(.16,1,.3,1)` }}>
      {children}
    </div>
  );
}

/* ─── CountUp ────────────────────────────────────────────────────── */
function CountUp({ to, suffix = "" }) {
  const [n, setN] = useState(0);
  const [ref, v] = useInView(0.4);
  useEffect(() => {
    if (!v) return;
    let s = null;
    const tick = (ts) => { if (!s) s = ts; const p = Math.min((ts-s)/2200,1); setN(Math.round((1-Math.pow(1-p,4))*to)); if(p<1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }, [v, to]);
  return <span ref={ref}>{n.toLocaleString("fr-FR")}{suffix}</span>;
}

/* ─── ContainerScroll ────────────────────────────────────────────── */
function ContainerScroll({ titleComponent, children, C }) {
  const containerRef = useRef();
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const total = containerRef.current.offsetHeight - window.innerHeight;
      setProgress(Math.max(0, Math.min(1, -rect.top / total)));
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  const e = progress < 0.5 ? 2*progress*progress : 1-Math.pow(-2*progress+2,2)/2;
  const rotateX = 10*(1-e), scale = 0.82+0.18*e, cardY = 50*(1-e);
  const titleOp = Math.max(0, 1-e*2.2), titleScl = 1-e*0.2, titleY = -e*40;

  return (
    <div ref={containerRef} style={{ height: "230vh", position: "relative", background: C.bg }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", overflow: "hidden", paddingTop: 72 }}>
        <BGPattern variant="grid" mask="fade-edges" size={48} fill={C.patternFill} />
        <div style={{ position:"absolute", top:0, inset:"0 0 auto 0", height:100, background:`linear-gradient(to bottom,${C.bg},transparent)`, pointerEvents:"none", zIndex:10 }}/>
        <div style={{ position:"absolute", bottom:0, inset:"auto 0 0 0", height:140, background:`linear-gradient(to top,${C.bg},transparent)`, pointerEvents:"none", zIndex:10 }}/>

        <div className="l-scroll-title" style={{ textAlign:"center", marginBottom:32, padding:"0 24px", transform:`scale(${titleScl}) translateY(${titleY}px)`, opacity:titleOp, zIndex:5, position:"relative", maxWidth:900 }}>
          {titleComponent}
        </div>

        <div style={{ width:"88%", maxWidth:1120, flex:1, perspective:"1600px", display:"flex", alignItems:"flex-start", position:"relative", zIndex:5 }}>
          <div style={{ width:"100%", height:"100%", transform:`rotateX(${rotateX}deg) scale(${scale}) translateY(${cardY}px)`, transformOrigin:"center top", willChange:"transform", transition:"transform 0.05s linear" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Dashboard Mockup ───────────────────────────────────────────── */
function DashboardMockup() {
  const BG   = "#0f0f0f";
  const BG2  = "#1a1a1a";
  const BG3  = "#242424";
  const TXT  = "#f0ede8";
  const DIM  = "rgba(240,237,232,0.45)";
  const DIM2 = "rgba(240,237,232,0.2)";
  const BDR  = "rgba(255,255,255,0.08)";
  const ACC  = "#e8cda9";

  const PILL = { background:"linear-gradient(180deg,rgba(60,60,60,0.97) 0%,rgba(18,18,18,0.99) 55%,rgba(8,8,8,1) 100%)", borderRadius:18, padding:"8px", display:"flex", flexDirection:"column", gap:3, boxShadow:"0 6px 20px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.12),inset 0 1px 0 rgba(255,255,255,0.32),inset 0 -2px 0 rgba(0,0,0,0.8)" };

  const navItems = [
    {icon:"◉",label:"Compte",active:true},
    {icon:"＋",label:"Trade",active:false},
    {icon:"≡",label:"Statistiques",active:false},
    {icon:"◈",label:"Plan",active:false},
  ];

  const trades = [
    {pair:"NQ",    dir:"LONG",  emo:"Confiant", sess:"London",   pnl:"+312$", r:"+2.4R", ok:true },
    {pair:"XAUUSD",dir:"SHORT", emo:"Neutre",   sess:"New York", pnl:"+241$", r:"+1.8R", ok:true },
    {pair:"MNQ",   dir:"LONG",  emo:"Anxieux",  sess:"London",   pnl:"-134$", r:"-1.0R", ok:false},
    {pair:"EUR/USD",dir:"LONG", emo:"Confiant", sess:"Overlap",  pnl:"+417$", r:"+3.1R", ok:true },
    {pair:"BTC",   dir:"SHORT", emo:"Patient",  sess:"Asia",     pnl:"+122$", r:"+0.9R", ok:true },
  ];

  const pts = [[0,92],[55,80],[110,74],[165,62],[220,68],[275,52],[330,42],[385,34],[440,22],[495,30],[550,12],[600,6]];
  const pathD = pts.map((p,i)=>`${i===0?"M":"L"}${p[0]},${p[1]}`).join(" ");

  const calDays = [
    {d:1,v:null},{d:2,v:1},{d:3,v:-1},{d:4,v:null},{d:5,v:1},
    {d:6,v:null},{d:7,v:null},{d:8,v:1},{d:9,v:1},{d:10,v:-1},
    {d:11,v:1},{d:12,v:null},{d:13,v:1},{d:14,v:-1},{d:15,v:1},
    {d:16,v:1},{d:17,v:null},{d:18,v:1},{d:19,v:1},{d:20,v:null},
    {d:21,v:-1},{d:22,v:1},{d:23,v:null},{d:24,v:1},{d:25,v:1},
    {d:26,v:null},{d:27,v:-1},{d:28,v:1},{d:29,v:1},{d:30,v:null},
  ];

  const sessions = [
    {name:"London",  wr:78, pnl:"+$2 140"},
    {name:"New York",wr:55, pnl:"+$893"},
    {name:"Asia",    wr:40, pnl:"-$210"},
    {name:"Overlap", wr:66, pnl:"+$580"},
  ];

  return (
    <div className="l-dash-card" style={{ width:"100%", height:660, background:BG, borderRadius:20, overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 40px 120px rgba(0,0,0,0.85),0 0 0 1px rgba(255,255,255,0.07)", fontFamily:"'Josefin Sans','Outfit',sans-serif" }}>

      {/* ── macOS window bar ── */}
      <div style={{ padding:"10px 16px", borderBottom:`1px solid ${BDR}`, display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,0.015)", flexShrink:0 }}>
        <div style={{ display:"flex", gap:7 }}>
          {["#ff5f57","#febc2e","#28c840"].map(c=><div key={c} style={{ width:10,height:10,borderRadius:"50%",background:c,opacity:0.8 }}/>)}
        </div>
        <span style={{ fontSize:10, color:DIM2, letterSpacing:"0.12em", textTransform:"uppercase" }}>Fyltra · Journal</span>
        <div style={{width:52}}/>
      </div>

      {/* ── main layout ── */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* sidebar */}
        <div className="l-dash-right" style={{ width:188, background:BG2, borderRight:`1px solid ${BDR}`, display:"flex", flexDirection:"column", padding:"16px 10px", gap:8, flexShrink:0 }}>
          {/* logo */}
          <div style={{ padding:"4px 8px 14px", borderBottom:`1px solid ${BDR}`, marginBottom:4 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <img src="/fyltra-white.svg" style={{ width:28,height:28,borderRadius:6,flexShrink:0 }} alt="" />
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:TXT, letterSpacing:"0.04em", lineHeight:1 }}>FYLTRA</div>
                <div style={{ fontSize:6.5, color:DIM2, letterSpacing:"0.18em", textTransform:"uppercase", marginTop:2 }}>Carnet de santé trading</div>
              </div>
            </div>
          </div>

          {/* main pill */}
          <div style={PILL}>
            {navItems.map(item=>(
              <div key={item.label} style={{ display:"flex", alignItems:"center", gap:10, padding:item.active?"8px 12px":"8px 10px", borderRadius:12, background:item.active?"radial-gradient(ellipse at 50% 35%,rgba(252,252,252,0.92) 0%,rgba(215,215,215,0.85) 55%,rgba(200,200,200,0.75) 100%)":"transparent", boxShadow:item.active?"0 0 24px 6px rgba(255,255,255,0.18),0 4px 14px rgba(0,0,0,0.4)":"none", transition:"all .2s" }}>
                <span style={{ fontSize:13, color:item.active?"#111":"rgba(255,255,255,0.35)", width:18, textAlign:"center", lineHeight:1 }}>{item.icon}</span>
                <span style={{ fontSize:9, letterSpacing:"0.1em", textTransform:"uppercase", fontWeight:item.active?700:300, color:item.active?"#222":"rgba(255,255,255,0.35)", whiteSpace:"nowrap" }}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* IA pill */}
          <div style={PILL}>
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:12 }}>
              <span style={{ fontSize:13, color:"rgba(255,255,255,0.35)", width:18, textAlign:"center" }}>◆</span>
              <span style={{ fontSize:9, letterSpacing:"0.1em", textTransform:"uppercase", fontWeight:300, color:"rgba(255,255,255,0.35)" }}>IA</span>
            </div>
          </div>

          {/* settings pill */}
          <div style={{ ...PILL, marginTop:"auto" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:12 }}>
              <span style={{ fontSize:13, color:"rgba(255,255,255,0.35)", width:18, textAlign:"center" }}>◎</span>
              <span style={{ fontSize:9, letterSpacing:"0.1em", textTransform:"uppercase", fontWeight:300, color:"rgba(255,255,255,0.35)" }}>Paramètres</span>
            </div>
          </div>
        </div>

        {/* main content */}
        <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
          {/* header */}
          <div style={{ padding:"10px 16px 0", flexShrink:0 }}>
            <div style={{ fontSize:8, color:DIM2, letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:2 }}>Tableau de bord</div>
            <div style={{ fontSize:14, fontWeight:700, color:TXT, letterSpacing:"-0.01em" }}>Performance</div>
          </div>

          {/* scroll area */}
          <div style={{ flex:1, padding:"10px 16px 14px", overflowY:"auto", display:"flex", gap:12, flexDirection:"column" }}>

            {/* stat cards */}
            <div className="l-stat-row" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, flexShrink:0 }}>
              {[
                {l:"P&L Total",  v:"+$4 217", sub:"+18.3%", color:"#4ade80"},
                {l:"Win Rate",   v:"68%",     sub:"34 / 50",color:"#4ade80"},
                {l:"RR Moyen",   v:"2.4:1",   sub:"bon",    color:DIM},
                {l:"Bilan",      v:"34W/16L", sub:"ce mois",color:TXT},
              ].map(s=>(
                <div key={s.l} style={{ background:BG3, border:`1px solid ${BDR}`, borderRadius:8, padding:"9px 10px", boxShadow:"0 4px 16px rgba(0,0,0,0.45),0 0 0 1px rgba(255,255,255,0.06),inset 0 1px 0 rgba(255,255,255,0.22)" }}>
                  <div style={{ fontSize:7, color:DIM2, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:3 }}>{s.l}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:s.color, lineHeight:1 }}>{s.v}</div>
                  <div style={{ fontSize:7, color:DIM2, marginTop:2 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* chart + calendar row */}
            <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:10, flexShrink:0 }}>
              {/* equity curve */}
              <div style={{ background:BG2, border:`1px solid ${BDR}`, borderRadius:10, padding:"12px", boxShadow:"0 4px 20px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.06),inset 0 1px 0 rgba(255,255,255,0.18)" }}>
                <div style={{ fontSize:7, color:DIM2, textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:8 }}>Évolution P&L</div>
                <svg width="100%" height="72" viewBox="0 0 600 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(232,205,169,0.22)"/>
                      <stop offset="100%" stopColor="rgba(232,205,169,0)"/>
                    </linearGradient>
                  </defs>
                  <path d={`${pathD} L600,100 L0,100 Z`} fill="url(#cg2)"/>
                  <path d={pathD} fill="none" stroke={ACC} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="800" style={{ animation:"lChartLine 2.2s ease forwards" }}/>
                  {pts.filter((_,i)=>i%3===0).map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill={ACC} opacity="0.5"/>)}
                </svg>
              </div>

              {/* calendar */}
              <div style={{ background:BG2, border:`1px solid ${BDR}`, borderRadius:10, padding:"10px 12px", boxShadow:"0 4px 20px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.06),inset 0 1px 0 rgba(255,255,255,0.18)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:7 }}>
                  <div style={{ fontSize:7, color:DIM2, textTransform:"uppercase", letterSpacing:"0.14em" }}>Avril 2025</div>
                  <div style={{ display:"flex", gap:6 }}>
                    <span style={{ fontSize:9, color:DIM2, cursor:"default" }}>‹</span>
                    <span style={{ fontSize:9, color:DIM2, cursor:"default" }}>›</span>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
                  {["L","M","M","J","V","S","D"].map(d=><div key={d} style={{ fontSize:6, color:DIM2, textAlign:"center", paddingBottom:2 }}>{d}</div>)}
                  {/* 2 empty cells (Tue start) */}
                  <div/><div/>
                  {calDays.map(({d,v})=>(
                    <div key={d} style={{ aspectRatio:"1", borderRadius:3, display:"flex", alignItems:"center", justifyContent:"center", fontSize:6, fontWeight:600, background:v===1?"rgba(74,222,128,0.18)":v===-1?"rgba(248,113,113,0.18)":"rgba(255,255,255,0.04)", color:v===1?"#4ade80":v===-1?"#f87171":DIM2, border:`1px solid ${v===1?"rgba(74,222,128,0.15)":v===-1?"rgba(248,113,113,0.15)":"transparent"}` }}>{d}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* sessions + trades row */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, flexShrink:0 }}>
              {/* sessions */}
              <div style={{ background:BG2, border:`1px solid ${BDR}`, borderRadius:10, padding:"12px", boxShadow:"0 4px 20px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.06),inset 0 1px 0 rgba(255,255,255,0.18)" }}>
                <div style={{ fontSize:7, color:DIM2, textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:9 }}>Performance par session</div>
                {sessions.map(s=>(
                  <div key={s.name} style={{ marginBottom:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                      <span style={{ fontSize:8, color:TXT, letterSpacing:"0.06em", textTransform:"uppercase" }}>{s.name}</span>
                      <span style={{ fontSize:8, color:s.pnl.startsWith("+")?"#4ade80":"#f87171", fontWeight:600 }}>{s.wr}% · {s.pnl}</span>
                    </div>
                    <div style={{ height:2, background:"rgba(255,255,255,0.06)", borderRadius:2 }}>
                      <div style={{ width:`${s.wr}%`, height:"100%", borderRadius:2, background:s.wr>=60?"#4ade80":"rgba(248,113,113,0.7)", transition:"width .8s" }}/>
                    </div>
                  </div>
                ))}
              </div>

              {/* trades */}
              <div style={{ background:BG2, border:`1px solid ${BDR}`, borderRadius:10, padding:"12px", boxShadow:"0 4px 20px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.06),inset 0 1px 0 rgba(255,255,255,0.18)" }}>
                <div style={{ fontSize:7, color:DIM2, textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:9 }}>Derniers trades</div>
                {trades.map((t,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingBottom:6, marginBottom:6, borderBottom:`1px solid ${i<trades.length-1?BDR:"transparent"}` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <div style={{ width:5,height:5,borderRadius:"50%",background:t.ok?"#4ade80":"#f87171",flexShrink:0 }}/>
                      <div>
                        <div style={{ fontSize:9, fontWeight:600, color:TXT, lineHeight:1 }}>{t.pair} · <span style={{ color:DIM, fontWeight:300 }}>{t.dir}</span></div>
                        <div style={{ fontSize:7, color:DIM2, marginTop:1 }}>{t.sess} · {t.emo}</div>
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:9, fontWeight:600, color:t.ok?"#4ade80":"#f87171", lineHeight:1 }}>{t.pnl}</div>
                      <div style={{ fontSize:7, color:DIM2, marginTop:1 }}>{t.r}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* IA coach banner */}
            <div style={{ background:`rgba(232,205,169,0.05)`, border:`1px solid rgba(232,205,169,0.14)`, borderRadius:10, padding:"10px 14px", display:"flex", alignItems:"flex-start", gap:10, flexShrink:0 }}>
              <span style={{ fontSize:12, color:ACC, lineHeight:1, marginTop:1 }}>◆</span>
              <div>
                <div style={{ fontSize:8, color:ACC, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:3 }}>◆ IA Coach</div>
                <div style={{ fontSize:9, color:DIM, lineHeight:1.55 }}>London + Confiant → <strong style={{color:TXT}}>78% WR</strong>. Évite le <strong style={{color:"#f87171"}}>Vendredi</strong> (P&L cumulé: -$312). Si Anxieux, passe ton tour.</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── GlassCard ──────────────────────────────────────────────────── */
function GlassCard({ icon, title, desc, delay = 0, C }) {
  const [h, setH] = useState(false);
  const isDark = C.bg === "#060608";
  const shadow3d = isDark
    ? h
      ? "0 8px 32px rgba(0,0,0,0.7), 0 2px 6px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1), 0 -2px 28px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.35), 0 24px 60px rgba(0,0,0,0.35)"
      : "0 4px 22px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.07), 0 -1px 18px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.22)"
    : h
      ? "0 8px 28px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9), 0 20px 40px rgba(0,0,0,0.07)"
      : "0 4px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)";

  return (
    <R delay={delay}>
      <div
        onMouseEnter={()=>setH(true)}
        onMouseLeave={()=>setH(false)}
        style={{
          background: isDark
            ? (h ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.025)")
            : (h ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.7)"),
          border: `1px solid ${h ? "rgba(232,205,169,0.3)" : (isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)")}`,
          borderRadius:18, padding:"28px 24px",
          transition:"all .35s cubic-bezier(.16,1,.3,1)",
          transform: h ? "translateY(-7px) perspective(600px) rotateX(1deg)" : "translateY(0) perspective(600px) rotateX(0deg)",
          boxShadow: shadow3d,
          cursor:"default", position:"relative", overflow:"hidden",
        }}>
        {h && <div style={{ position:"absolute", top:-40, right:-40, width:120, height:120, borderRadius:"50%", background:"radial-gradient(circle,rgba(232,205,169,0.08) 0%,transparent 70%)", pointerEvents:"none" }}/>}
        <div style={{ width:42, height:42, borderRadius:11,
          background: isDark ? (h ? "rgba(232,205,169,0.12)" : "rgba(255,255,255,0.04)") : (h ? "rgba(232,205,169,0.15)" : "rgba(0,0,0,0.04)"),
          border:`1px solid ${h ? "rgba(232,205,169,0.22)" : C.border}`,
          boxShadow: isDark ? "inset 0 1px 0 rgba(255,255,255,0.15)" : "inset 0 1px 0 rgba(255,255,255,0.7)",
          display:"flex", alignItems:"center", justifyContent:"center", marginBottom:18, fontSize:20, transition:"all .3s", color:C.text }}>{icon}</div>
        <h3 style={{ fontWeight:600, fontSize:16, marginBottom:8, color:C.text }}>{title}</h3>
        <p style={{ fontSize:13, lineHeight:1.7, color:C.textDim }}>{desc}</p>
      </div>
    </R>
  );
}

/* ─── ZoomParallaxFeatures ───────────────────────────────────────── */
function TileCard({ icon, title, shadow }) {
  return (
    <div style={{
      background: shadow.isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.84)",
      border: `1px solid ${shadow.border}`,
      borderRadius: 16, padding: "22px 22px",
      boxShadow: shadow.isDark
        ? "0 6px 24px rgba(0,0,0,0.6),0 0 0 1px rgba(255,255,255,0.08),inset 0 1px 0 rgba(255,255,255,0.26)"
        : "0 6px 20px rgba(0,0,0,0.09),0 0 0 1px rgba(0,0,0,0.05),inset 0 1px 0 rgba(255,255,255,0.95)",
    }}>
      <div style={{ fontSize: 22, marginBottom: 10, color: shadow.text }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 13, color: shadow.text, letterSpacing: "-0.01em" }}>{title}</div>
    </div>
  );
}

function ZoomParallaxFeatures({ C }) {
  const containerRef = useRef();
  const [prog, setProg] = useState(0);

  useEffect(() => {
    const fn = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollable = containerRef.current.offsetHeight - window.innerHeight;
      setProg(Math.max(0, Math.min(1, -rect.top / scrollable)));
    };
    window.addEventListener("scroll", fn, { passive: true });
    fn();
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const t  = Math.min(1, prog / 0.75);
  const e  = t < 0.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2;
  const isDark = C.bg === "#060608";

  /* Main card: closed card → full screen */
  const cW = 22 + 74 * e;     // vw: 22 → 96
  const cH = 36 + 56 * e;     // vh: 36 → 92
  const cR = 18 * (1 - e);    // border-radius → 0

  /* Side cards fade when main expands */
  const sideOp = Math.max(0, 1 - e * 1.9);

  /* Content inside main: hidden until card is almost fully open */
  const contentOp = Math.max(0, (e - 0.72) / 0.28);
  const titleOp   = Math.max(0, 1 - e * 2.5);   // closed-card title fades as it opens

  const shadow = { isDark, border: C.border, text: C.text };

  /* 6 tiles in a tight polaroid collage around the main card */
  /* bx/by = base offset from center (CSS string), dx/dy = drift on expand (px) */
  const tiles = [
    { icon:"◉", title:"Multi-comptes",   bx:"-24vw", by:"-15vh", rot:-3, dx:-70, dy:-45 },
    { icon:"◆", title:"IA Coach",        bx:"-5vw",  by:"-19vh", rot:2,  dx:-10, dy:-65 },
    { icon:"▦", title:"Stats profondes", bx:"16vw",  by:"-13vh", rot:-2, dx:65,  dy:-40 },
    { icon:"◈", title:"Plan de trading", bx:"18vw",  by:"8vh",   rot:4,  dx:70,  dy:30  },
    { icon:"⊞", title:"Layout custom",   bx:"-3vw",  by:"17vh",  rot:-2, dx:-5,  dy:65  },
    { icon:"◎", title:"Sync temps réel", bx:"-22vw", by:"8vh",   rot:3,  dx:-70, dy:30  },
  ];

  return (
    <div ref={containerRef} id="features" style={{ height:"320vh", position:"relative" }}>
      <div style={{
        position:"sticky", top:0, height:"100vh", overflow:"hidden",
        background:C.bg, display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        <BGPattern variant="dots" mask="fade-edges" size={32} fill={C.patternFill} />

        {/* ── 6 surrounding title cards (collage) ── */}
        {tiles.map(tile => (
          <div key={tile.title} style={{
            position:"absolute", top:"50%", left:"50%",
            width:"clamp(118px,16vw,190px)",
            transform:`translate(calc(-50% + ${tile.bx}), calc(-50% + ${tile.by})) translate(${tile.dx*e}px,${tile.dy*e}px) rotate(${tile.rot*(1-e)}deg) scale(${1-e*0.08})`,
            opacity: sideOp,
            zIndex: 2,
            pointerEvents: sideOp < 0.05 ? "none" : "auto",
          }}>
            <TileCard icon={tile.icon} title={tile.title} shadow={shadow} />
          </div>
        ))}

        {/* ── Main card (closed → opens on scroll) ── */}
        <div style={{
          position:"absolute", top:"50%", left:"50%",
          transform:"translate(-50%,-50%)",
          width:`${cW}vw`, height:`${cH}vh`,
          borderRadius: cR, overflow:"hidden", zIndex:5,
          background: isDark ? "#0e0f12" : "#ffffff",
          border: cR > 0.5 ? `1px solid ${C.border}` : "none",
          boxShadow: cR > 0.5
            ? isDark
              ? "0 32px 80px rgba(0,0,0,0.7),0 0 0 1px rgba(255,255,255,0.07),inset 0 1px 0 rgba(255,255,255,0.2)"
              : "0 24px 60px rgba(0,0,0,0.13),0 0 0 1px rgba(0,0,0,0.05),inset 0 1px 0 rgba(255,255,255,0.9)"
            : "none",
        }}>

          {/* Closed-card state: just the title, centered */}
          <div style={{
            position:"absolute", inset:0,
            display:"flex", alignItems:"center", justifyContent:"center",
            padding:"24px", opacity: titleOp, pointerEvents: titleOp < 0.1 ? "none" : "auto",
          }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:"clamp(13px,1.8vw,18px)", fontWeight:700, letterSpacing:"-0.02em", color:C.text, lineHeight:1.3 }}>
                Tout ce qu'il faut<br/>pour trader<br/>
                <span style={{ background:"linear-gradient(135deg,#e8cda9,#c9aa82)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>avec précision.</span>
              </div>
            </div>
          </div>

          {/* Open-card state: full feature grid */}
          <div style={{
            padding:"clamp(24px,4vw,52px)", height:"100%", overflowY:"auto",
            opacity: contentOp, pointerEvents: contentOp < 0.2 ? "none" : "auto",
          }}>
            <div style={{ marginBottom:24 }}>
              <div style={{ display:"inline-block", background:isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)", border:`1px solid ${C.border}`, borderRadius:100, padding:"5px 16px", marginBottom:12 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.textDim, letterSpacing:"0.2em", textTransform:"uppercase" }}>Fonctionnalités</span>
              </div>
              <h2 style={{ fontWeight:800, fontSize:"clamp(20px,2.8vw,38px)", lineHeight:1.1, letterSpacing:"-0.025em", color:C.text }}>
                Tout ce qu'il faut pour{" "}
                <span style={{ background:"linear-gradient(135deg,#e8cda9,#c9aa82)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>trader avec précision.</span>
              </h2>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:11 }}>
              {FEATURES.map(f => (
                <div key={f.title} style={{
                  background: isDark?"rgba(255,255,255,0.025)":"rgba(0,0,0,0.025)",
                  border:`1px solid ${C.border}`, borderRadius:12, padding:"17px",
                  boxShadow: isDark
                    ? "0 4px 14px rgba(0,0,0,0.4),0 0 0 1px rgba(255,255,255,0.06),inset 0 1px 0 rgba(255,255,255,0.18)"
                    : "0 3px 10px rgba(0,0,0,0.06),0 0 0 1px rgba(0,0,0,0.03),inset 0 1px 0 rgba(255,255,255,0.7)",
                }}>
                  <div style={{ fontSize:17, marginBottom:7, color:C.text }}>{f.icon}</div>
                  <div style={{ fontWeight:600, fontSize:13, marginBottom:5, color:C.text }}>{f.title}</div>
                  <div style={{ fontSize:11.5, color:C.textDim, lineHeight:1.6 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Data ───────────────────────────────────────────────────────── */
const FEATURES = [
  { icon:"◉", title:"Multi-comptes",   desc:"Prop firms, fonds propres — chaque compte avec ses règles, objectifs et equity curve séparés." },
  { icon:"◆", title:"IA Coach",        desc:"Analyse de vos patterns. Erreurs récurrentes, edge confirmé, 3 règles actionnables pour demain." },
  { icon:"▦", title:"Stats profondes", desc:"Win rate par session, P&L par émotion, profit factor par instrument. Brut, sans filtre." },
  { icon:"◈", title:"Plan de trading", desc:"Documentez vos règles d'entrée/sortie. L'IA les intègre pour un coaching contextuel." },
  { icon:"⊞", title:"Layout custom",   desc:"Réorganisez chaque section. Votre espace, vos conditions de performance optimale." },
  { icon:"◎", title:"Sync temps réel", desc:"Supabase. Multiappareils. Vos trades disponibles partout, instantanément." },
];
const TICKER = ["1 247 traders actifs","$2.3M analysés","IA Coach LLaMA 70B","Multi-comptes illimités","Sync temps réel","Edge confirmé"];

/* ─── Icons ──────────────────────────────────────────────────────── */
const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

/* ─── AuthModal ──────────────────────────────────────────────────── */
function AuthModal({ onClose, navigate, initialMode = "login" }) {
  const [mode, setMode]         = useState(initialMode);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const overlayRef              = useRef();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const submit = async () => {
    if (!email || !password) { setError("Remplis tous les champs."); return; }
    setLoading(true); setError(""); setSuccess("");
    if (mode === "login") {
      const { error: e } = await supabase.auth.signInWithPassword({ email, password });
      if (e) setError(e.message === "Invalid login credentials" ? "Email ou mot de passe incorrect." : e.message);
      else { onClose(); navigate("/app"); }
    } else {
      const { error: e } = await supabase.auth.signUp({ email, password });
      if (e) setError(e.message);
      else setSuccess("Compte créé ! Vérifie ton email pour confirmer.");
    }
    setLoading(false);
  };

  const gold = "#e8cda9";
  const fieldStyle = {
    width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)",
    borderRadius:10, padding:"13px 16px", color:"#fff", fontFamily:"'Outfit',sans-serif",
    fontSize:14, outline:"none", transition:"border-color .2s", boxSizing:"border-box",
  };

  return (
    <div ref={overlayRef} onClick={e=>{ if(e.target===overlayRef.current) onClose(); }}
      style={{ position:"fixed", inset:0, zIndex:9000, display:"flex", alignItems:"center", justifyContent:"center",
        background:"rgba(0,0,0,0.72)", backdropFilter:"blur(12px)", animation:"lFadeIn .22s both" }}>
      <div style={{ width:"100%", maxWidth:420, margin:"0 16px", background:"#0e0f12", border:"1px solid rgba(255,255,255,0.08)",
        borderRadius:22, padding:"44px 40px", boxShadow:"0 0 0 1px rgba(255,255,255,0.04),0 32px 80px rgba(0,0,0,0.7)",
        position:"relative", animation:"lFadeUp .28s both" }}>

        {/* close */}
        <button onClick={onClose} style={{ position:"absolute", top:16, right:16, width:32, height:32, borderRadius:8,
          background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)",
          cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>

        {/* logo */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:32 }}>
          <img src="/fyltra-white.svg" style={{ width:22, height:22 }} alt="" />
          <span style={{ fontWeight:700, fontSize:13, color:"rgba(255,255,255,0.5)", letterSpacing:"0.1em" }}>FYLTRA</span>
        </div>

        <h2 style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:24, color:"#fff", marginBottom:6, letterSpacing:"-0.02em" }}>
          {mode === "login" ? "Bon retour 👋" : "Créer un compte"}
        </h2>
        <p style={{ fontSize:13, color:"rgba(255,255,255,0.35)", marginBottom:28 }}>
          {mode === "login" ? "Connecte-toi à ton journal de trading." : "Commence ton journal de trading gratuit."}
        </p>

        {/* tabs */}
        <div style={{ display:"flex", gap:4, background:"rgba(255,255,255,0.04)", borderRadius:10, padding:4, marginBottom:24 }}>
          {[["login","Se connecter"],["signup","Créer un compte"]].map(([m,l])=>(
            <button key={m} onClick={()=>{ setMode(m); setError(""); setSuccess(""); }}
              style={{ flex:1, padding:"9px 0", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"'Outfit',sans-serif",
                fontWeight:600, fontSize:13, transition:"all .2s",
                background: mode===m ? "rgba(232,205,169,0.15)" : "transparent",
                color: mode===m ? gold : "rgba(255,255,255,0.35)",
                boxShadow: mode===m ? `inset 0 0 0 1px rgba(232,205,169,0.25)` : "none" }}>
              {l}
            </button>
          ))}
        </div>

        {/* fields */}
        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
          <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}
            style={fieldStyle} onFocus={e=>e.target.style.borderColor="rgba(232,205,169,0.4)"}
            onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.1)"}/>
          <div style={{ position:"relative" }}>
            <input type={showPwd?"text":"password"} placeholder="Mot de passe" value={password}
              onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
              style={{...fieldStyle, paddingRight:46}}
              onFocus={e=>e.target.style.borderColor="rgba(232,205,169,0.4)"}
              onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.1)"}/>
            <button onClick={()=>setShowPwd(p=>!p)} style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)",
              background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.3)", fontSize:12, padding:4 }}>
              {showPwd?"Cacher":"Voir"}
            </button>
          </div>
        </div>

        {error   && <div style={{ background:"rgba(255,80,80,0.1)", border:"1px solid rgba(255,80,80,0.2)", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#ff8080", marginBottom:14 }}>{error}</div>}
        {success && <div style={{ background:"rgba(80,200,100,0.1)", border:"1px solid rgba(80,200,100,0.2)", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#80e090", marginBottom:14 }}>{success}</div>}

        <button onClick={submit} disabled={loading}
          style={{ width:"100%", background:`linear-gradient(135deg,${gold},#c9aa82)`, color:"#000", border:"none",
            borderRadius:12, padding:"14px", fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:14,
            cursor:loading?"wait":"pointer", opacity:loading?0.7:1, transition:"all .22s",
            boxShadow:"0 0 28px rgba(232,205,169,0.2)" }}>
          {loading ? "..." : mode === "login" ? "Se connecter →" : "Créer mon compte →"}
        </button>
      </div>
    </div>
  );
}

/* ─── Landing ────────────────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mouse, setMouse] = useState({ x:-999, y:-999 });
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem("fyltra-theme") !== "light"; } catch { return true; }
  });

  const C = getC(darkMode);

  useEffect(() => {
    try { localStorage.setItem("fyltra-theme", darkMode ? "dark" : "light"); } catch {}
    document.body.style.background = C.bg;
  }, [darkMode, C.bg]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const gold = "#e8cda9";

  return (
    <div onMouseMove={e => setMouse({ x:e.clientX, y:e.clientY })} style={{ fontFamily:"'Outfit',sans-serif", background:C.bg, color:C.text, minHeight:"100vh", transition:"background .4s,color .4s" }}>
      <style>{FONTS}</style>
      <style>{`:root { --l-bg:${C.bg}; --l-border:${C.border}; }`}</style>
      {showAuth && <AuthModal onClose={()=>setShowAuth(false)} navigate={navigate} initialMode={authMode}/>}

      {/* cursor glow */}
      <div style={{ position:"fixed", left:mouse.x-220, top:mouse.y-220, width:440, height:440, borderRadius:"50%", background:`radial-gradient(circle,rgba(232,205,169,0.05) 0%,transparent 70%)`, pointerEvents:"none", zIndex:9999, transition:"left .08s,top .08s" }}/>

      {/* ─── NAV ─── */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:500, padding:"0 5vw", height:scrolled?58:72, display:"flex", alignItems:"center", justifyContent:"space-between", transition:"all .4s cubic-bezier(.16,1,.3,1)", background:scrolled?C.navBg:"transparent", backdropFilter:scrolled?"blur(20px)":"none", borderBottom:scrolled?`1px solid ${C.border}`:"none" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <img src={darkMode?"/fyltra-white.svg":"/fyltra-black.svg"} style={{ width:26, height:26 }} alt="" />
          <span style={{ fontWeight:700, fontSize:15, letterSpacing:"0.05em", color:C.text }}>FYLTRA</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <div className="l-nav-links" style={{ display:"flex", gap:4 }}>
            {[["#features","Features"],["#tarifs","Tarifs"]].map(([href,label]) => (
              <a key={href} href={href} style={{ padding:"7px 16px", fontSize:13, fontWeight:500, color:C.textDim, textDecoration:"none", borderRadius:8, transition:"all .2s" }}
                onMouseEnter={e=>{ e.currentTarget.style.color=C.text; e.currentTarget.style.background=C.cardBg; }}
                onMouseLeave={e=>{ e.currentTarget.style.color=C.textDim; e.currentTarget.style.background="transparent"; }}>
                {label}
              </a>
            ))}
          </div>

          {/* theme toggle */}
          <button onClick={() => setDarkMode(d=>!d)} style={{ width:36, height:36, borderRadius:10, background:C.cardBg, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", color:C.text, cursor:"pointer", transition:"all .22s", marginLeft:4 }}
            onMouseEnter={e=>{ e.currentTarget.style.background=C.cardBgH; e.currentTarget.style.borderColor=`rgba(232,205,169,0.35)`; }}
            onMouseLeave={e=>{ e.currentTarget.style.background=C.cardBg; e.currentTarget.style.borderColor=C.border; }}>
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>

          <button onClick={() => { setAuthMode("login"); setShowAuth(true); }} style={{ marginLeft:4, background:"rgba(232,205,169,0.12)", border:"1px solid rgba(232,205,169,0.3)", borderRadius:10, padding:"9px 20px", fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:13, color:gold, cursor:"pointer", transition:"all .22s" }}
            onMouseEnter={e=>{ e.currentTarget.style.background="rgba(232,205,169,0.22)"; e.currentTarget.style.boxShadow="0 0 20px rgba(232,205,169,0.2)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.background="rgba(232,205,169,0.12)"; e.currentTarget.style.boxShadow="none"; }}>
            Se connecter
          </button>
        </div>
      </nav>

      {/* ─── CONTAINER SCROLL HERO ─── */}
      <ContainerScroll C={C}
        titleComponent={
          <h1 className="l-hero-title" style={{ fontWeight:900, fontSize:"clamp(28px,5vw,68px)", lineHeight:1.12, letterSpacing:"-0.03em", background:`linear-gradient(160deg,${C.text} 40%,${darkMode?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.35)"} 100%)`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", animation:"lFadeUp .9s .1s both", textAlign:"center" }}>
            Votre carnet de santé trading.
          </h1>
        }
      >
        <DashboardMockup C={C} />
      </ContainerScroll>

      {/* ─── TEXT REVEAL ─── */}
      <TextRevealByWord C={C} text="Votre trading mérite de la structure. Chaque trade raconte une histoire. Fyltra transforme vos données en intelligence pour que vous deveniez le trader que vous méritez d'être." />

      {/* ─── FEATURES ZOOM PARALLAX ─── */}
      <ZoomParallaxFeatures C={C} />


      {/* ─── QUOTE ─── */}
      <section className="l-section" style={{ padding:"120px 5vw", textAlign:"center" }}>
        <div style={{ maxWidth:760, margin:"0 auto" }}>
          <R>
            <div style={{ fontSize:36, color:"rgba(232,205,169,0.35)", marginBottom:20 }}>"</div>
            <blockquote style={{ fontWeight:600, fontSize:"clamp(18px,3vw,34px)", lineHeight:1.45, letterSpacing:"-0.02em", color:C.text }}>
              Les meilleurs traders ne sont pas ceux qui ont les meilleures entrées. Ce sont ceux qui{" "}
              <span style={{ background:"linear-gradient(135deg,#e8cda9,#e8cda9)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>se connaissent le mieux.</span>
            </blockquote>
          </R>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="tarifs" className="l-section" style={{ padding:"110px 5vw", borderTop:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:900, margin:"0 auto" }}>
          <R>
            <div style={{ textAlign:"center", marginBottom:60 }}>
              <div style={{ display:"inline-block", background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:100, padding:"5px 16px", marginBottom:18 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.textDim, letterSpacing:"0.2em", textTransform:"uppercase" }}>Tarif</span>
              </div>
              <h2 style={{ fontWeight:800, fontSize:"clamp(28px,4vw,50px)", letterSpacing:"-0.025em", color:C.text }}>
                Simple.{" "}
                <span style={{ background:"linear-gradient(135deg,#e8cda9,#e8cda9)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>Transparent.</span>
              </h2>
            </div>
          </R>
          <R delay={0.1}>
            <div className="l-price-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr" }}>
              <PriceLeft onAuth={(m)=>{ setAuthMode(m); setShowAuth(true); }} C={C}/>
              <div className="l-price-right" style={{ background:C.cardBg, border:`1px solid ${C.border}`, borderLeft:"none", borderRadius:"0 18px 18px 0", padding:"48px 40px" }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.textDimmer, letterSpacing:"0.28em", textTransform:"uppercase", display:"block", marginBottom:28 }}>Inclus</span>
                <div style={{ display:"flex", flexDirection:"column" }}>
                  {["Comptes illimités","Trades illimités","IA Coach","Statistiques avancées","Sync multi-appareils","Layout personnalisable","Connexion MT5","Mises à jour incluses"].map((item,i,arr)=>(
                    <div key={item} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="11" stroke="rgba(232,205,169,0.3)" strokeWidth="1.5"/>
                        <polyline points="7 12 10.5 15.5 17 9" stroke="#e8cda9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span style={{ fontSize:13, fontWeight:400, color:C.textDim }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </R>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="l-section" style={{ padding:"150px 5vw", textAlign:"center", position:"relative", overflow:"hidden", borderTop:`1px solid ${C.border}` }}>
        <BGPattern variant="diagonal-stripes" mask="fade-y" size={24} fill={C.patternFill} />
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(232,205,169,0.055) 0%,transparent 65%)", pointerEvents:"none" }}/>
        <R>
          <div style={{ position:"relative", zIndex:1 }}>
            <h2 style={{ fontWeight:800, fontSize:"clamp(32px,6vw,80px)", lineHeight:1.05, letterSpacing:"-0.03em", marginBottom:16, color:C.text }}>
              Votre journal.<br/>
              <span style={{ background:"linear-gradient(135deg,#e8cda9 0%,#e8cda9 50%,#c9aa82 100%)", backgroundSize:"200% 200%", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", animation:"lGrad 4s ease infinite" }}>Votre progression.</span>
            </h2>
            <p style={{ fontSize:14, color:C.textDim, marginBottom:44 }}>$24.99 / mois · Résiliable à tout moment.</p>
            <div className="l-cta-btns" style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
              <button onClick={() => { setAuthMode("signup"); setShowAuth(true); }} style={{ background:"linear-gradient(135deg,#e8cda9,#c9aa82)", color:"#000", border:"none", borderRadius:14, padding:"17px 50px", fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:15, cursor:"pointer", boxShadow:"0 0 40px rgba(232,205,169,0.28),0 4px 20px rgba(0,0,0,0.2)", transition:"all .25s cubic-bezier(.16,1,.3,1)" }}
                onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-3px) scale(1.03)"; e.currentTarget.style.boxShadow="0 0 60px rgba(232,205,169,0.5),0 8px 28px rgba(0,0,0,0.3)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 0 40px rgba(232,205,169,0.28),0 4px 20px rgba(0,0,0,0.2)"; }}>
                Créer mon compte →
              </button>
            </div>
          </div>
        </R>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ borderTop:`1px solid ${C.border}`, padding:"30px 5vw", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <img src={darkMode?"/fyltra-white.svg":"/fyltra-black.svg"} style={{ width:20, height:20, opacity:0.45 }} alt="" />
          <span style={{ fontWeight:700, fontSize:12, color:C.textDimmer, letterSpacing:"0.05em" }}>FYLTRA</span>
        </div>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.textDimmer, letterSpacing:"0.1em" }}>© 2025 Fyltra · Trading Journal</span>
        <button onClick={() => { setAuthMode("login"); setShowAuth(true); }} style={{ background:"none", border:"none", fontFamily:"'Outfit',sans-serif", fontWeight:500, fontSize:12, color:C.textDimmer, cursor:"pointer", transition:"color .2s" }}
          onMouseEnter={e=>e.currentTarget.style.color=C.text}
          onMouseLeave={e=>e.currentTarget.style.color=C.textDimmer}>
          Accéder à l'app →
        </button>
      </footer>
    </div>
  );
}

/* ─── Price Left Card ────────────────────────────────────────────── */
function PriceLeft({ onAuth, C }) {
  const [h, setH] = useState(false);
  return (
    <div className="l-price-left" onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{ padding:"48px 40px", background:h?"rgba(232,205,169,0.04)":C.cardBg, border:`1px solid ${h?"rgba(232,205,169,0.3)":"rgba(232,205,169,0.15)"}`, borderRadius:"18px 0 0 18px", position:"relative", overflow:"hidden", transition:"all .4s cubic-bezier(.16,1,.3,1)", boxShadow:h?"0 0 60px rgba(232,205,169,0.08)":"none" }}>
      <div style={{ position:"absolute", top:-50, right:-50, width:180, height:180, borderRadius:"50%", background:"radial-gradient(circle,rgba(232,205,169,0.1) 0%,transparent 70%)", pointerEvents:"none" }}/>
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"rgba(232,205,169,0.5)", letterSpacing:"0.3em", textTransform:"uppercase", display:"block", marginBottom:32 }}>Accès complet</span>
      <div style={{ display:"flex", alignItems:"flex-start", gap:4, marginBottom:4 }}>
        <span style={{ fontSize:20, color:C.textDim, marginTop:16, fontWeight:300 }}>$</span>
        <span style={{ fontWeight:800, fontSize:100, lineHeight:1, letterSpacing:"-0.04em", color:C.text }}>24</span>
        <span style={{ fontSize:32, color:C.textDim, marginTop:24, fontWeight:400 }}>.99</span>
      </div>
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.textDimmer, letterSpacing:"0.15em", display:"block", marginBottom:40 }}>PAR MOIS · RÉSILIABLE</span>
      <button onClick={() => onAuth("signup")} style={{ width:"100%", background:"linear-gradient(135deg,#e8cda9,#c9aa82)", color:"#000", border:"none", borderRadius:12, padding:"14px", fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:14, cursor:"pointer", boxShadow:"0 0 28px rgba(232,205,169,0.2)", transition:"all .22s cubic-bezier(.16,1,.3,1)" }}
        onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 0 44px rgba(232,205,169,0.42)"; }}
        onMouseLeave={e=>{ e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 0 28px rgba(232,205,169,0.2)"; }}>
        Commencer maintenant →
      </button>
    </div>
  );
}
