import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ─── Fonts ──────────────────────────────────────────────────────── */
const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}
  body{background:#060608;color:#fff;overflow-x:hidden;}
  ::-webkit-scrollbar{width:3px;}
  ::-webkit-scrollbar-track{background:#060608;}
  ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px;}

  @keyframes lFadeUp{from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:translateY(0);}}
  @keyframes lFadeIn{from{opacity:0;}to{opacity:1;}}
  @keyframes lTicker{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
  @keyframes lPulse{0%,100%{opacity:.4;transform:scale(1);}50%{opacity:1;transform:scale(1.2);}}
  @keyframes lGrad{0%{background-position:0% 50%;}50%{background-position:100% 50%;}100%{background-position:0% 50%;}}
  @keyframes lRise{from{opacity:0;transform:translateY(40px);}to{opacity:1;transform:translateY(0);}}
  @keyframes lChartLine{from{stroke-dashoffset:600;}to{stroke-dashoffset:0;}}
  @keyframes lDot{0%,100%{opacity:.3;}50%{opacity:1;}}
`;

/* ─── TextRevealByWord ───────────────────────────────────────────── */
function TextRevealByWord({ text }) {
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
    <div ref={containerRef} style={{ height: "280vh", position: "relative" }}>
      <div style={{
        position: "sticky", top: 0, height: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 6vw",
      }}>
        <p style={{
          fontWeight: 700,
          fontSize: "clamp(26px, 3.8vw, 52px)",
          lineHeight: 1.45,
          maxWidth: 880,
          textAlign: "center",
        }}>
          {words.map((word, i) => {
            const start = (i / words.length) * 0.85;
            const end   = ((i + 1) / words.length) * 0.85;
            const wp    = Math.max(0, Math.min(1, (progress - start) / (end - start)));
            const op    = 0.12 + wp * 0.88;
            return (
              <span key={i} style={{
                color: `rgba(255,255,255,${op})`,
                marginRight: "0.28em",
                display: "inline-block",
                transition: "color 0.05s",
              }}>{word}</span>
            );
          })}
        </p>
      </div>
    </div>
  );
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

/* ─── Reveal ─────────────────────────────────────────────────────── */
function R({ children, delay = 0 }) {
  const [ref, v] = useInView();
  return (
    <div ref={ref} style={{
      opacity: v ? 1 : 0, transform: v ? "none" : "translateY(28px)",
      transition: `opacity .9s ${delay}s cubic-bezier(.16,1,.3,1), transform .9s ${delay}s cubic-bezier(.16,1,.3,1)`,
    }}>{children}</div>
  );
}

/* ─── CountUp ────────────────────────────────────────────────────── */
function CountUp({ to, suffix = "" }) {
  const [n, setN] = useState(0);
  const [ref, v] = useInView(0.4);
  useEffect(() => {
    if (!v) return;
    let s = null;
    const tick = (ts) => {
      if (!s) s = ts;
      const p = Math.min((ts - s) / 2200, 1);
      setN(Math.round((1 - Math.pow(1 - p, 4)) * to));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [v, to]);
  return <span ref={ref}>{n.toLocaleString("fr-FR")}{suffix}</span>;
}

/* ─── ContainerScroll ────────────────────────────────────────────── */
function ContainerScroll({ titleComponent, children }) {
  const containerRef = useRef();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const total = containerRef.current.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      setProgress(Math.max(0, Math.min(1, scrolled / total)));
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  /* easing */
  const e = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

  const rotateX   = 18 * (1 - e);
  const scale     = 0.8 + 0.2 * e;
  const cardY     = 60 * (1 - e);
  const titleOp   = Math.max(0, 1 - e * 2.2);
  const titleScl  = 1 - e * 0.25;
  const titleY    = -e * 50;

  return (
    <div ref={containerRef} style={{ height: "230vh", position: "relative" }}>
      <div style={{
        position: "sticky", top: 0, height: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", overflow: "hidden",
        paddingTop: 72,
      }}>

        {/* top fade */}
        <div style={{ position:"absolute", top:0, inset:"0 0 auto 0", height:100, background:"linear-gradient(to bottom,#060608,transparent)", pointerEvents:"none", zIndex:10 }}/>
        {/* bottom fade */}
        <div style={{ position:"absolute", bottom:0, inset:"auto 0 0 0", height:140, background:"linear-gradient(to top,#060608,transparent)", pointerEvents:"none", zIndex:10 }}/>

        {/* title */}
        <div style={{
          textAlign:"center", marginBottom:40, padding:"0 24px",
          transform:`scale(${titleScl}) translateY(${titleY}px)`,
          opacity: titleOp,
          zIndex: 5,
        }}>
          {titleComponent}
        </div>

        {/* 3D card wrapper */}
        <div style={{
          width:"88%", maxWidth:1120,
          flex:1, perspective:"1200px",
          display:"flex", alignItems:"flex-start",
        }}>
          <div style={{
            width:"100%", height:"100%",
            transform:`rotateX(${rotateX}deg) scale(${scale}) translateY(${cardY}px)`,
            transformOrigin:"center top",
            willChange:"transform",
            transition:"transform 0.05s linear",
          }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Dashboard Mockup ───────────────────────────────────────────── */
function DashboardMockup() {
  const trades = [
    { pair:"NQ", dir:"LONG",  r:"+2.4R", pnl:"+$312", ok:true  },
    { pair:"XAUUSD", dir:"SHORT", r:"+1.8R", pnl:"+$241", ok:true  },
    { pair:"MNQ", dir:"LONG",  r:"-1.0R", pnl:"-$134", ok:false },
    { pair:"EUR/USD", dir:"LONG",  r:"+3.1R", pnl:"+$417", ok:true  },
    { pair:"BTC",  dir:"SHORT", r:"+0.9R", pnl:"+$122", ok:true  },
  ];

  /* equity curve SVG */
  const pts = [
    [0,80],[60,72],[120,68],[180,58],[240,62],[300,50],[360,40],[420,32],[480,20],[540,28],[600,10],
  ];
  const pathD = pts.map((p, i) => `${i===0?"M":"L"}${p[0]},${p[1]}`).join(" ");

  return (
    <div style={{
      width:"100%", height:"520px",
      background:"#0e0f12",
      border:"1px solid rgba(255,255,255,0.08)",
      borderRadius:20,
      overflow:"hidden",
      display:"flex", flexDirection:"column",
      boxShadow:"0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)",
    }}>

      {/* top bar */}
      <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,0.02)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <img src="/fyltra-white.svg" style={{ width:18, height:18, opacity:0.6 }} alt="" />
          <span style={{ fontWeight:700, fontSize:12, letterSpacing:"0.06em", opacity:0.7 }}>FYLTRA</span>
          {["Compte","Trade","IA"].map(t => (
            <div key={t} style={{ padding:"4px 12px", borderRadius:6, background: t==="Compte" ? "rgba(240,180,60,0.12)" : "transparent", border: t==="Compte" ? "1px solid rgba(240,180,60,0.2)" : "1px solid transparent", fontSize:11, color: t==="Compte" ? "#F0B43C" : "rgba(255,255,255,0.35)", cursor:"default" }}>{t}</div>
          ))}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {["#ff5f57","#febc2e","#28c840"].map(c => (
            <div key={c} style={{ width:10, height:10, borderRadius:"50%", background:c, opacity:0.7 }}/>
          ))}
        </div>
      </div>

      {/* body */}
      <div style={{ flex:1, display:"grid", gridTemplateColumns:"1fr 300px", overflow:"hidden" }}>

        {/* left */}
        <div style={{ padding:"20px", borderRight:"1px solid rgba(255,255,255,0.05)", display:"flex", flexDirection:"column", gap:16, overflow:"hidden" }}>

          {/* stat cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
            {[
              { label:"P&L Total", val:"+$4 217", sub:"+18.3%", up:true },
              { label:"Win Rate", val:"68%", sub:"34/50", up:true },
              { label:"Profit Factor", val:"2.4", sub:"bon", up:true },
              { label:"Trades", val:"50", sub:"ce mois", up:null },
            ].map(s => (
              <div key={s.label} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:"12px 14px" }}>
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginBottom:4, letterSpacing:"0.06em", textTransform:"uppercase" }}>{s.label}</div>
                <div style={{ fontSize:16, fontWeight:700, color: s.up===true?"#4ade80": s.up===false?"#f87171":"#fff" }}>{s.val}</div>
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.25)", marginTop:2 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* chart */}
          <div style={{ flex:1, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:12, padding:"16px", position:"relative", minHeight:0 }}>
            <div style={{ fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.4)", marginBottom:10, letterSpacing:"0.06em", textTransform:"uppercase" }}>Equity Curve</div>
            <svg width="100%" height="120" viewBox="0 0 600 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(240,180,60,0.25)"/>
                  <stop offset="100%" stopColor="rgba(240,180,60,0)"/>
                </linearGradient>
              </defs>
              <path d={`${pathD} L600,100 L0,100 Z`} fill="url(#chartGrad)"/>
              <path d={pathD} fill="none" stroke="#F0B43C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="600" style={{ animation:"lChartLine 2s ease forwards" }}/>
              {pts.filter((_,i)=>i%2===0).map((p,i)=>(
                <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="#F0B43C" opacity="0.6"/>
              ))}
            </svg>
          </div>
        </div>

        {/* right — trade list */}
        <div style={{ padding:"16px", display:"flex", flexDirection:"column", gap:0, overflow:"hidden" }}>
          <div style={{ fontSize:9, fontWeight:600, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:12 }}>Derniers trades</div>
          {trades.map((t, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background: t.ok ? "#4ade80" : "#f87171" }}/>
                <div>
                  <div style={{ fontSize:12, fontWeight:600 }}>{t.pair}</div>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)" }}>{t.dir}</div>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:12, fontWeight:600, color: t.ok ? "#4ade80" : "#f87171" }}>{t.pnl}</div>
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.25)", fontFamily:"'JetBrains Mono',monospace" }}>{t.r}</div>
              </div>
            </div>
          ))}

          {/* AI insight */}
          <div style={{ marginTop:12, background:"rgba(240,180,60,0.06)", border:"1px solid rgba(240,180,60,0.15)", borderRadius:10, padding:"12px" }}>
            <div style={{ fontSize:9, color:"#F0B43C", fontWeight:600, marginBottom:6, letterSpacing:"0.06em" }}>◆ IA COACH</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", lineHeight:1.6 }}>London + Confiant = 78% WR. Évite le Vendredi.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── GlassCard ──────────────────────────────────────────────────── */
function GlassCard({ icon, title, desc, delay = 0 }) {
  const [h, setH] = useState(false);
  return (
    <R delay={delay}>
      <div onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{
        background: h ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
        border:`1px solid ${h ? "rgba(240,180,60,0.35)" : "rgba(255,255,255,0.07)"}`,
        borderRadius:18, padding:"28px 24px",
        backdropFilter:"blur(10px)",
        transition:"all .32s cubic-bezier(.16,1,.3,1)",
        transform: h ? "translateY(-6px)" : "none",
        boxShadow: h ? "0 24px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(240,180,60,0.1)" : "0 4px 20px rgba(0,0,0,0.25)",
        cursor:"default", position:"relative", overflow:"hidden",
      }}>
        {h && <div style={{ position:"absolute", top:-40, right:-40, width:120, height:120, borderRadius:"50%", background:"radial-gradient(circle,rgba(240,180,60,0.1) 0%,transparent 70%)", pointerEvents:"none" }}/>}
        <div style={{ width:42, height:42, borderRadius:11, background: h ? "rgba(240,180,60,0.15)" : "rgba(255,255,255,0.05)", border:`1px solid ${h ? "rgba(240,180,60,0.25)" : "rgba(255,255,255,0.07)"}`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:18, fontSize:20, transition:"all .3s" }}>{icon}</div>
        <h3 style={{ fontWeight:600, fontSize:16, marginBottom:8, color: h ? "#fff" : "rgba(255,255,255,0.9)", transition:"color .3s" }}>{title}</h3>
        <p style={{ fontSize:13, lineHeight:1.7, color:"rgba(255,255,255,0.38)", fontWeight:400 }}>{desc}</p>
      </div>
    </R>
  );
}

/* ─── Data ───────────────────────────────────────────────────────── */
const FEATURES = [
  { icon:"◉", title:"Multi-comptes",      desc:"Prop firms, fonds propres — chaque compte avec ses règles, objectifs et equity curve." },
  { icon:"◆", title:"IA Coach",           desc:"Analyse de vos patterns. Erreurs, edge confirmé, 3 règles pour demain — LLaMA 3.3 70B." },
  { icon:"▦", title:"Stats profondes",    desc:"Win rate / session, P&L / émotion, profit factor / instrument. Brut, sans filtre." },
  { icon:"◈", title:"Plan de trading",    desc:"Documentez vos règles. L'IA les intègre à chaque analyse pour un coaching contextuel." },
  { icon:"⊞", title:"Layout custom",      desc:"Réorganisez chaque section. Votre espace, vos conditions de performance optimale." },
  { icon:"◎", title:"Sync temps réel",   desc:"Supabase. Multiappareils. Vos trades disponibles partout, instantanément." },
];

const TICKER = ["1 247 traders actifs","$2.3M analysés","IA Coach LLaMA 70B","Multi-comptes illimités","Sync temps réel","Edge confirmé"];

/* ─── Landing ────────────────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mouse, setMouse] = useState({ x:-999, y:-999 });

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive:true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div
      onMouseMove={e => setMouse({ x:e.clientX, y:e.clientY })}
      style={{ fontFamily:"'Outfit',sans-serif", background:"#060608", color:"#fff", minHeight:"100vh" }}
    >
      <style>{FONTS}</style>

      {/* cursor glow */}
      <div style={{ position:"fixed", left:mouse.x-220, top:mouse.y-220, width:440, height:440, borderRadius:"50%", background:"radial-gradient(circle,rgba(240,180,60,0.055) 0%,transparent 70%)", pointerEvents:"none", zIndex:9999, transition:"left .08s,top .08s" }}/>

      {/* ─── NAV ─── */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:500, padding:"0 5vw", height: scrolled ? 58 : 72, display:"flex", alignItems:"center", justifyContent:"space-between", transition:"all .4s cubic-bezier(.16,1,.3,1)", background: scrolled ? "rgba(6,6,8,0.88)" : "transparent", backdropFilter: scrolled ? "blur(20px)" : "none", borderBottom: scrolled ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <img src="/fyltra-white.svg" style={{ width:26, height:26 }} alt="" />
          <span style={{ fontWeight:700, fontSize:15, letterSpacing:"0.05em" }}>FYLTRA</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          {[["#features","Features"],["#tarifs","Tarifs"]].map(([href,label]) => (
            <a key={href} href={href} style={{ padding:"7px 16px", fontSize:13, fontWeight:500, color:"rgba(255,255,255,0.45)", textDecoration:"none", borderRadius:8, transition:"all .2s" }}
              onMouseEnter={e=>{ e.currentTarget.style.color="#fff"; e.currentTarget.style.background="rgba(255,255,255,0.06)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.color="rgba(255,255,255,0.45)"; e.currentTarget.style.background="transparent"; }}>
              {label}
            </a>
          ))}
          <button onClick={() => navigate("/app")} style={{ marginLeft:8, background:"rgba(240,180,60,0.1)", border:"1px solid rgba(240,180,60,0.28)", borderRadius:10, padding:"9px 22px", fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:13, color:"#F0B43C", cursor:"pointer", transition:"all .22s" }}
            onMouseEnter={e=>{ e.currentTarget.style.background="rgba(240,180,60,0.2)"; e.currentTarget.style.boxShadow="0 0 20px rgba(240,180,60,0.2)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.background="rgba(240,180,60,0.1)"; e.currentTarget.style.boxShadow="none"; }}>
            Se connecter
          </button>
        </div>
      </nav>

      {/* ─── HERO SCROLL (first thing visible) ─── */}
      <ContainerScroll
        titleComponent={
          <div style={{ textAlign:"center" }}>
            <h1 style={{
              fontWeight:900,
              fontSize:"clamp(72px, 14vw, 180px)",
              lineHeight:1,
              letterSpacing:"-0.045em",
              background:"linear-gradient(160deg,#fff 40%,rgba(255,255,255,0.5) 100%)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
              animation:"lFadeUp .9s .1s both",
            }}>
              FYLTRA
            </h1>
          </div>
        }
      >
        <DashboardMockup />
      </ContainerScroll>

      {/* ─── TEXT REVEAL ─── */}
      <TextRevealByWord text="Votre trading mérite de la structure. Chaque trade raconte une histoire. Fyltra transforme vos données en intelligence pour que vous deveniez le trader que vous méritez d'être." />

      {/* ─── TICKER ─── */}
      <div style={{ background:"rgba(240,180,60,0.03)", borderTop:"1px solid rgba(240,180,60,0.08)", borderBottom:"1px solid rgba(240,180,60,0.08)", padding:"13px 0", overflow:"hidden" }}>
        <div style={{ display:"flex", width:"max-content", animation:"lTicker 35s linear infinite" }}>
          {[1,2].map(n => TICKER.map(item => (
            <span key={`${n}-${item}`} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:500, color:"rgba(240,180,60,0.5)", letterSpacing:"0.2em", textTransform:"uppercase", paddingRight:64, whiteSpace:"nowrap" }}>{item}</span>
          )))}
        </div>
      </div>

      {/* ─── FEATURES ─── */}
      <section id="features" style={{ padding:"120px 5vw" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <R>
            <div style={{ textAlign:"center", marginBottom:68 }}>
              <div style={{ display:"inline-block", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:100, padding:"5px 16px", marginBottom:18 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"rgba(255,255,255,0.3)", letterSpacing:"0.2em", textTransform:"uppercase" }}>Fonctionnalités</span>
              </div>
              <h2 style={{ fontWeight:800, fontSize:"clamp(30px,4vw,52px)", lineHeight:1.1, letterSpacing:"-0.025em" }}>
                Tout ce qu'il faut pour<br/>
                <span style={{ background:"linear-gradient(135deg,#F0B43C,#FFD880)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>trader avec précision.</span>
              </h2>
            </div>
          </R>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))", gap:14 }}>
            {FEATURES.map((f,i) => <GlassCard key={f.title} icon={f.icon} title={f.title} desc={f.desc} delay={i*.07}/>)}
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section style={{ padding:"80px 5vw", borderTop:"1px solid rgba(255,255,255,0.05)", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:"48px 24px", textAlign:"center" }}>
          {[
            { to:1247, s:"+", l:"Traders actifs" },
            { to:84000, s:"+", l:"Trades journalisés" },
            { to:23, s:"%", l:"WR moyen amélioré" },
            { to:98, s:"%", l:"Satisfaction" },
          ].map((s,i) => (
            <R key={s.l} delay={i*.07}>
              <div>
                <div style={{ fontWeight:800, fontSize:"clamp(38px,4.5vw,58px)", lineHeight:1, marginBottom:8, background:"linear-gradient(135deg,#fff 30%,rgba(255,255,255,0.5) 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                  <CountUp to={s.to} suffix={s.s}/>
                </div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"rgba(255,255,255,0.28)", letterSpacing:"0.18em", textTransform:"uppercase" }}>{s.l}</div>
              </div>
            </R>
          ))}
        </div>
      </section>

      {/* ─── QUOTE ─── */}
      <section style={{ padding:"120px 5vw", textAlign:"center" }}>
        <div style={{ maxWidth:760, margin:"0 auto" }}>
          <R>
            <div style={{ fontSize:36, color:"rgba(240,180,60,0.35)", marginBottom:20 }}>"</div>
            <blockquote style={{ fontWeight:600, fontSize:"clamp(20px,3vw,34px)", lineHeight:1.45, letterSpacing:"-0.02em", color:"rgba(255,255,255,0.85)", marginBottom:24 }}>
              Les meilleurs traders ne sont pas ceux qui ont les meilleures entrées. Ce sont ceux qui{" "}
              <span style={{ background:"linear-gradient(135deg,#F0B43C,#FFD880)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>se connaissent le mieux.</span>
            </blockquote>
          </R>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="tarifs" style={{ padding:"110px 5vw", borderTop:"1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth:900, margin:"0 auto" }}>
          <R>
            <div style={{ textAlign:"center", marginBottom:60 }}>
              <div style={{ display:"inline-block", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:100, padding:"5px 16px", marginBottom:18 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"rgba(255,255,255,0.3)", letterSpacing:"0.2em", textTransform:"uppercase" }}>Tarif</span>
              </div>
              <h2 style={{ fontWeight:800, fontSize:"clamp(30px,4vw,50px)", letterSpacing:"-0.025em" }}>
                Simple.{" "}
                <span style={{ background:"linear-gradient(135deg,#F0B43C,#FFD880)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>Transparent.</span>
              </h2>
            </div>
          </R>

          <R delay={0.1}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:2 }}>

              {/* price card */}
              <PriceLeft navigate={navigate}/>

              {/* included */}
              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderLeft:"none", borderRadius:"0 18px 18px 0", padding:"48px 40px" }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.18)", letterSpacing:"0.28em", textTransform:"uppercase", display:"block", marginBottom:28 }}>Inclus</span>
                <div style={{ display:"flex", flexDirection:"column" }}>
                  {["Comptes illimités","Trades illimités","IA Coach — LLaMA 3.3 70B","Statistiques avancées","Sync multi-appareils","Layout personnalisable","Connexion MT5 / MetaAPI","Mises à jour incluses"].map((item,i,arr) => (
                    <div key={item} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom: i<arr.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="11" stroke="rgba(240,180,60,0.3)" strokeWidth="1.5"/>
                        <polyline points="7 12 10.5 15.5 17 9" stroke="#F0B43C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span style={{ fontSize:13, fontWeight:400, color:"rgba(255,255,255,0.5)" }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </R>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ padding:"150px 5vw", textAlign:"center", position:"relative", overflow:"hidden", borderTop:"1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(240,180,60,0.055) 0%,transparent 65%)", pointerEvents:"none" }}/>
        <R>
          <div style={{ position:"relative", zIndex:1 }}>
            <h2 style={{ fontWeight:800, fontSize:"clamp(36px,6vw,80px)", lineHeight:1.05, letterSpacing:"-0.03em", marginBottom:16 }}>
              Votre journal.<br/>
              <span style={{ background:"linear-gradient(135deg,#F0B43C 0%,#FFD880 50%,#E89020 100%)", backgroundSize:"200% 200%", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", animation:"lGrad 4s ease infinite" }}>Votre progression.</span>
            </h2>
            <p style={{ fontSize:14, color:"rgba(255,255,255,0.3)", marginBottom:44, fontWeight:400 }}>$24.99 / mois · Résiliable à tout moment.</p>
            <button onClick={() => navigate("/app")} style={{ background:"linear-gradient(135deg,#F0B43C,#E89020)", color:"#000", border:"none", borderRadius:14, padding:"17px 50px", fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:15, cursor:"pointer", boxShadow:"0 0 40px rgba(240,180,60,0.28),0 4px 20px rgba(0,0,0,0.4)", transition:"all .25s cubic-bezier(.16,1,.3,1)" }}
              onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-3px) scale(1.03)"; e.currentTarget.style.boxShadow="0 0 60px rgba(240,180,60,0.5),0 8px 28px rgba(0,0,0,0.5)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 0 40px rgba(240,180,60,0.28),0 4px 20px rgba(0,0,0,0.4)"; }}>
              Créer mon compte →
            </button>
          </div>
        </R>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ borderTop:"1px solid rgba(255,255,255,0.05)", padding:"30px 5vw", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <img src="/fyltra-white.svg" style={{ width:20, height:20, opacity:0.45 }} alt="" />
          <span style={{ fontWeight:700, fontSize:12, color:"rgba(255,255,255,0.22)", letterSpacing:"0.05em" }}>FYLTRA</span>
        </div>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"rgba(255,255,255,0.1)", letterSpacing:"0.1em" }}>© 2025 Fyltra · Trading Journal</span>
        <button onClick={() => navigate("/app")} style={{ background:"none", border:"none", fontFamily:"'Outfit',sans-serif", fontWeight:500, fontSize:12, color:"rgba(255,255,255,0.2)", cursor:"pointer", transition:"color .2s" }}
          onMouseEnter={e=>e.currentTarget.style.color="rgba(255,255,255,0.6)"}
          onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.2)"}>
          Accéder à l'app →
        </button>
      </footer>
    </div>
  );
}

/* ─── Price Left Card ────────────────────────────────────────────── */
function PriceLeft({ navigate }) {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{ padding:"48px 40px", background: h ? "rgba(240,180,60,0.04)" : "rgba(255,255,255,0.025)", border:`1px solid ${h?"rgba(240,180,60,0.3)":"rgba(240,180,60,0.15)"}`, borderRadius:"18px 0 0 18px", position:"relative", overflow:"hidden", transition:"all .4s cubic-bezier(.16,1,.3,1)", boxShadow: h ? "0 0 60px rgba(240,180,60,0.08)" : "none" }}>
      <div style={{ position:"absolute", top:-50, right:-50, width:180, height:180, borderRadius:"50%", background:"radial-gradient(circle,rgba(240,180,60,0.1) 0%,transparent 70%)", pointerEvents:"none" }}/>
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"rgba(240,180,60,0.5)", letterSpacing:"0.3em", textTransform:"uppercase", display:"block", marginBottom:32 }}>Accès complet</span>
      <div style={{ display:"flex", alignItems:"flex-start", gap:4, marginBottom:4 }}>
        <span style={{ fontSize:20, color:"rgba(255,255,255,0.3)", marginTop:16, fontWeight:300 }}>$</span>
        <span style={{ fontWeight:800, fontSize:100, lineHeight:1, letterSpacing:"-0.04em" }}>24</span>
        <span style={{ fontSize:32, color:"rgba(255,255,255,0.5)", marginTop:24, fontWeight:400 }}>.99</span>
      </div>
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.18)", letterSpacing:"0.15em", display:"block", marginBottom:40 }}>PAR MOIS · RÉSILIABLE</span>
      <button onClick={() => navigate("/app")} style={{ width:"100%", background:"linear-gradient(135deg,#F0B43C,#E89020)", color:"#000", border:"none", borderRadius:12, padding:"14px", fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:14, cursor:"pointer", boxShadow:"0 0 28px rgba(240,180,60,0.2)", transition:"all .22s cubic-bezier(.16,1,.3,1)" }}
        onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 0 44px rgba(240,180,60,0.42)"; }}
        onMouseLeave={e=>{ e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 0 28px rgba(240,180,60,0.2)"; }}>
        Commencer maintenant →
      </button>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"rgba(255,255,255,0.13)", textAlign:"center", marginTop:12, letterSpacing:"0.08em" }}>Aucune carte requise</div>
    </div>
  );
}
