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
  .l-hero-title { animation: lFadeUp 0.9s 0.1s both; }
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
    .l-stats-grid { grid-template-columns: repeat(2,1fr) !important; }
    .l-reveal-text{ font-size: clamp(20px, 5vw, 34px) !important; }
    .l-dash-card  { height: 460px !important; }
    .l-scroll-card  { width: 94vw !important; height: 62vh !important; }
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
        <BGPattern variant="grid" mask="fade-edges" size={28} fill={C.patternFill} />
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
  const cardWrapRef  = useRef();
  const titleWrapRef = useRef();

  useEffect(() => {
    let pending = false;
    const update = () => {
      pending = false;
      if (!containerRef.current) return;
      const rect  = containerRef.current.getBoundingClientRect();
      const total = containerRef.current.offsetHeight - window.innerHeight;
      const prog  = Math.max(0, Math.min(1, -rect.top / total));
      const e     = prog < 0.5 ? 2*prog*prog : 1-Math.pow(-2*prog+2,2)/2;

      if (cardWrapRef.current) {
        const rX = 10*(1-e);
        const sc = 0.82+0.18*e;
        const cY = 200*(1-e);
        cardWrapRef.current.style.transform = `rotateX(${rX.toFixed(2)}deg) scale(${sc.toFixed(4)}) translateY(${cY.toFixed(1)}px)`;
      }
      if (titleWrapRef.current) {
        const tOp = Math.max(0, 1 - e * 2.2);
        const tY  = -e * 40;
        titleWrapRef.current.style.opacity   = tOp.toFixed(3);
        titleWrapRef.current.style.transform = `translateY(${tY.toFixed(1)}px)`;
      }
    };
    const onScroll = () => { if (!pending) { pending = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={containerRef} style={{ height:"230vh", position:"relative", background:C.bg }}>
      <div style={{ position:"sticky", top:0, height:"100vh", overflow:"hidden" }}>
        <BGPattern variant="grid" mask="fade-edges" size={48} fill={C.patternFill} />

        {/* Title */}
        <div ref={titleWrapRef} className="l-scroll-title" style={{
          position:"absolute", top:72, left:0, right:0,
          paddingTop:32, padding:"32px 24px 0",
          opacity:1, zIndex:25,
          textAlign:"center",
          willChange:"transform,opacity",
          pointerEvents:"none",
        }}>
          {titleComponent}
        </div>

        {/* Dashboard — in front of title */}
        <div style={{ position:"absolute", top:72, left:0, right:0, bottom:0, perspective:"1600px", display:"flex", alignItems:"flex-start", zIndex:5 }}>
          <div ref={cardWrapRef} style={{ width:"100%", height:"100%", transform:"rotateX(10deg) scale(0.82) translateY(200px)", transformOrigin:"center top", willChange:"transform", pointerEvents:"none", userSelect:"none" }}>
            <div style={{
              position:"relative",
              WebkitMaskImage:"linear-gradient(to top, transparent 0%, black 30%)",
              maskImage:"linear-gradient(to top, transparent 0%, black 30%)",
            }}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Dashboard Mockup ───────────────────────────────────────────── */
function DashboardMockup({ lang = "fr" }) {
  const BG  = "#0f0f0f";
  const BDR = "rgba(255,255,255,0.08)";
  const DIM2 = "rgba(240,237,232,0.2)";


  return (
    <div className="l-dash-card" style={{ width:"100%", height:860, background:BG, borderRadius:"16px 16px 0 0", overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 -2px 0 rgba(255,255,255,0.07),0 40px 120px rgba(0,0,0,0.85)" }}>

      {/* ── macOS window bar ── */}
      <div style={{ padding:"10px 16px", borderBottom:`1px solid ${BDR}`, display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,0.015)", flexShrink:0 }}>
        <div style={{ display:"flex", gap:7 }}>
          {["#ff5f57","#febc2e","#28c840"].map(c=><div key={c} style={{ width:10,height:10,borderRadius:"50%",background:c,opacity:0.8 }}/>)}
        </div>
        <span style={{ fontSize:10, color:DIM2, letterSpacing:"0.12em", textTransform:"uppercase" }}>Fyltra · Journal</span>
        <div style={{width:52}}/>
      </div>

      {/* ── real app screenshot ── */}
      <img
        src="/app-screenshot.png"
        alt="Fyltra app"
        style={{ width:"100%", flex:1, objectFit:"cover", objectPosition:"top left", display:"block" }}
      />
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
      <div style={{ fontWeight: 700, fontSize: 13, color: shadow.text, letterSpacing: "-0.01em" }}>{title}</div>
    </div>
  );
}

function ZoomParallaxFeatures({ C, lang = "fr" }) {
  const containerRef = useRef();
  const tileRefs     = useRef([]);
  const centerRef    = useRef();
  const labelRef     = useRef();
  const contentRef   = useRef();

  const isDark = C.bg === "#060608";
  const shadow = { isDark, border: C.border, text: C.text };
  const tz = T[lang].zoom;

  const tilePositions = [
    { bx:"-27vw", by:"-10vh", rot:-5, dx:-14, dy:-8  },
    { bx:"-27vw", by:"10vh",  rot:3,  dx:-14, dy:8   },
    { bx:"25vw",  by:"-10vh", rot:-3, dx:14,  dy:-8  },
    { bx:"25vw",  by:"10vh",  rot:4,  dx:14,  dy:8   },
    { bx:"-1vw",  by:"-28vh", rot:2,  dx:0,   dy:-16 },
    { bx:"-1vw",  by:"28vh",  rot:-2, dx:0,   dy:16  },
    { bx:"25vw",  by:"22vh",  rot:3,  dx:14,  dy:12  },
  ];
  const tiles = tz.tiles.map((title, i) => ({ title, ...tilePositions[i] }));

  useEffect(() => {
    let pending = false;
    const update = () => {
      pending = false;
      if (!containerRef.current) return;
      const rect     = containerRef.current.getBoundingClientRect();
      const total    = containerRef.current.offsetHeight - window.innerHeight;
      const prog     = Math.max(0, Math.min(1, -rect.top / total));
      const e        = prog < 0.5 ? 2*prog*prog : 1-Math.pow(-2*prog+2,2)/2;

      const sideOp = Math.max(0, 1 - e * 2.2).toFixed(3);
      tileRefs.current.forEach((el, i) => {
        if (!el || !tiles[i]) return;
        const t = tiles[i];
        el.style.opacity   = sideOp;
        el.style.transform = `translate(calc(-50% + ${t.bx}),calc(-50% + ${t.by})) translate(${(t.dx*e).toFixed(1)}px,${(t.dy*e).toFixed(1)}px) rotate(${t.rot}deg)`;
      });

      if (centerRef.current) {
        centerRef.current.style.width        = `min(${(16+72*e).toFixed(1)}vw,${(190+770*e).toFixed(0)}px)`;
        centerRef.current.style.height       = `${(14+54*e).toFixed(1)}vh`;
        centerRef.current.style.borderRadius = `${Math.round(16+4*e)}px`;
      }
      if (labelRef.current)
        labelRef.current.style.opacity = Math.max(0, 1-e*2.4).toFixed(3);
      if (contentRef.current) {
        const op = Math.max(0, (e-0.45)/0.55);
        contentRef.current.style.opacity      = op.toFixed(3);
        contentRef.current.style.pointerEvents = op > 0.5 ? "auto" : "none";
      }
    };
    const onScroll = () => { if (!pending) { pending = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={containerRef} id="features" style={{ height:"280vh", position:"relative" }}>
      <div style={{ position:"sticky", top:0, height:"100vh", overflow:"hidden", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <BGPattern variant="grid" mask="fade-edges" size={32} fill={C.patternFill} />

        {tiles.map((tile, i) => (
          <div key={tile.title}
            ref={el => { tileRefs.current[i] = el; }}
            className="l-collage-tile"
            style={{ position:"absolute", top:"50%", left:"50%", width:"clamp(118px,16vw,190px)",
              transform:`translate(calc(-50% + ${tile.bx}),calc(-50% + ${tile.by})) rotate(${tile.rot}deg)`,
              zIndex:2, opacity:1, pointerEvents:"none", willChange:"transform,opacity" }}
          >
            <TileCard title={tile.title} shadow={shadow} />
          </div>
        ))}

        <div ref={centerRef} style={{
          position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)",
          width:"min(16vw,190px)", height:"14vh", zIndex:5, overflow:"hidden",
          borderRadius:"16px",
          background: isDark ? "rgba(14,14,16,0.97)" : "rgba(255,255,255,0.97)",
          border:"1px solid rgba(232,205,169,0.35)",
          boxShadow: isDark
            ? "0 8px 40px rgba(0,0,0,0.7),0 0 0 1px rgba(232,205,169,0.18),inset 0 1px 0 rgba(255,255,255,0.25)"
            : "0 8px 32px rgba(0,0,0,0.1),0 0 0 1px rgba(232,205,169,0.25),inset 0 1px 0 rgba(255,255,255,1)",
          willChange:"width,height,border-radius",
        }}>
          <div ref={labelRef} style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"22px", opacity:1, pointerEvents:"none" }}>
            <div style={{ fontWeight:700, fontSize:13, color:C.text, letterSpacing:"-0.01em", lineHeight:1.4, textAlign:"center" }}>
              {tz.centerLabel}{" "}
              <span style={{ background:"linear-gradient(135deg,#e8cda9,#c9aa82)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>{tz.centerSpan}</span>
            </div>
          </div>

          <div ref={contentRef} style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", justifyContent:"center", padding:"clamp(28px,5vw,64px)", opacity:0, pointerEvents:"none" }}>
            <BGPattern variant="grid" mask="fade-edges" size={28} fill={isDark ? "rgba(232,205,169,0.04)" : "rgba(0,0,0,0.04)"} />
            <div style={{ position:"relative", zIndex:1 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 14px", borderRadius:100, background:"rgba(232,205,169,0.08)", border:"1px solid rgba(232,205,169,0.22)", marginBottom:22 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:"rgba(232,205,169,0.7)", flexShrink:0, display:"inline-block" }}/>
                <span style={{ fontSize:10, color:"rgba(232,205,169,0.75)", letterSpacing:"0.18em", textTransform:"uppercase", fontFamily:"'JetBrains Mono',monospace" }}>{tz.badge}</span>
              </div>
              <h2 style={{ fontFamily:"'Outfit',sans-serif", fontWeight:900, fontSize:"clamp(24px,3.8vw,52px)", color:C.text, lineHeight:1.1, letterSpacing:"-0.03em", marginBottom:20 }}>
                {tz.h2a}<br/>{tz.h2b}<br/>
                <span style={{ background:"linear-gradient(135deg,#e8cda9,#c9aa82)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>{tz.h2c}</span>
              </h2>
              <p style={{ fontSize:"clamp(13px,1.2vw,16px)", color:C.textDim, lineHeight:1.65, maxWidth:500, marginBottom:36 }}>
                {tz.desc}
              </p>
              <button
                onClick={() => document.getElementById("pour-tous-les-traders")?.scrollIntoView({ behavior:"smooth" })}
                style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"14px 28px", borderRadius:12, background:"rgba(232,205,169,0.12)", border:"1px solid rgba(232,205,169,0.28)", fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:13, color:"#e8cda9", cursor:"pointer", transition:"all .22s" }}
                onMouseEnter={ev=>{ ev.currentTarget.style.background="rgba(232,205,169,0.2)"; ev.currentTarget.style.boxShadow="0 0 24px rgba(232,205,169,0.18)"; }}
                onMouseLeave={ev=>{ ev.currentTarget.style.background="rgba(232,205,169,0.12)"; ev.currentTarget.style.boxShadow="none"; }}
              >
                {tz.cta}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Gallery4 (carousel screenshots) ───────────────────────────── */
function ScrollCards({ C, lang = "fr" }) {
  const [current, setCurrent] = useState(0);
  const dragStart = useRef(null);

  const GOLD     = "#e8cda9";
  const GOLDDIM  = "rgba(232,205,169,0.18)";
  const tc       = T[lang].cards;

  /* card width: responsive */
  const cardW = typeof window !== "undefined" ? Math.min(360, window.innerWidth * 0.8) : 360;
  const GAP   = 20;

  const items = tc.items;

  const goTo = i => setCurrent(Math.max(0, Math.min(items.length - 1, i)));

  const onPointerDown = e => { dragStart.current = e.clientX; };
  const onPointerUp   = e => {
    if (dragStart.current === null) return;
    const d = e.clientX - dragStart.current;
    if (d > 50) goTo(current - 1);
    else if (d < -50) goTo(current + 1);
    dragStart.current = null;
  };

  const ArrowBtn = ({ onClick, disabled, dir }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={dir}
      style={{
        width:40, height:40, borderRadius:"50%", outline:"none",
        background: disabled ? "transparent" : "rgba(255,255,255,0.04)",
        border: `1px solid ${disabled ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.14)"}`,
        color: disabled ? "rgba(255,255,255,0.18)" : C.text,
        display:"flex", alignItems:"center", justifyContent:"center",
        cursor: disabled ? "default" : "pointer",
        fontSize:18, lineHeight:1, transition:"all 0.2s",
      }}
    >{dir === "prev" ? "←" : "→"}</button>
  );

  return (
    <section id="pour-tous-les-traders" style={{ padding:"100px 0 80px", background:C.bg, overflow:"hidden" }}>
      {/* ── Header ── */}
      <div style={{ padding:"0 clamp(24px,5vw,88px)", marginBottom:48, display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:24 }}>
        <div style={{ maxWidth:560 }}>
          <div style={{ display:"inline-block", background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:100, padding:"5px 16px", marginBottom:18 }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.textDim, letterSpacing:"0.2em", textTransform:"uppercase" }}>{tc.badge}</span>
          </div>
          <h2 style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:"clamp(26px,3.5vw,46px)", color:C.text, letterSpacing:"-0.03em", lineHeight:1.1, margin:"0 0 14px" }}>
            {tc.headline}{" "}
            <span style={{ color:GOLD }}>{tc.headlineSpan}</span>
          </h2>
          <p style={{ fontSize:15, color:C.textDim, lineHeight:1.65, margin:0 }}>
            {tc.desc}
          </p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <ArrowBtn dir="prev" onClick={() => goTo(current - 1)} disabled={current === 0} />
          <ArrowBtn dir="next" onClick={() => goTo(current + 1)} disabled={current === items.length - 1} />
        </div>
      </div>

      {/* ── Carousel ── */}
      <div style={{ overflow:"hidden", paddingLeft:"clamp(24px,5vw,88px)" }}>
        <div
          style={{
            display:"flex", gap:GAP,
            transform:`translateX(-${current * (cardW + GAP)}px)`,
            transition:"transform 0.55s cubic-bezier(0.25,0.46,0.45,0.94)",
            cursor:"grab", userSelect:"none",
          }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {items.map((item, i) => (
            <div
              key={item.id}
              onClick={() => goTo(i)}
              style={{
                flexShrink:0, width:cardW, height:Math.round(cardW * 1.38),
                borderRadius:16, overflow:"hidden", position:"relative",
                cursor: i === current ? "grab" : "pointer",
                transition:"opacity 0.4s",
                opacity: Math.abs(i - current) > 2 ? 0 : 1 - Math.abs(i - current) * 0.1,
              }}
            >
              {/* Placeholder bg (shown while image loads or if missing) */}
              <div style={{ position:"absolute", inset:0, background:"#0d0d10" }} />
              {/* Screenshot */}
              <img
                src={item.image}
                alt={item.title}
                draggable={false}
                style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:"top", display:"block" }}
              />
              {/* Gradient */}
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(4,4,6,0.97) 28%, rgba(4,4,6,0.3) 60%, transparent)", pointerEvents:"none" }} />
              {/* Text */}
              <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"28px 24px", pointerEvents:"none" }}>
                <div style={{ display:"inline-flex", alignItems:"center", background:`rgba(${item.tagRgb},0.1)`, border:`1px solid rgba(${item.tagRgb},0.25)`, borderRadius:100, padding:"3px 12px", marginBottom:10 }}>
                  <span style={{ fontSize:9, letterSpacing:"0.14em", textTransform:"uppercase", color:`rgb(${item.tagRgb})`, fontFamily:"'JetBrains Mono',monospace" }}>{item.tag}</span>
                </div>
                <h3 style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:"clamp(16px,2vw,22px)", color:"#fff", letterSpacing:"-0.02em", margin:"0 0 8px", lineHeight:1.25 }}>{item.title}</h3>
                <p style={{ fontSize:12, color:"rgba(255,255,255,0.48)", lineHeight:1.6, margin:0, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Dots ── */}
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:7, marginTop:36 }}>
        {items.map((_, i) => (
          <div
            key={i}
            onClick={() => goTo(i)}
            style={{
              width: i === current ? 22 : 6,
              height:6, borderRadius:3, cursor:"pointer",
              background: i === current ? GOLD : GOLDDIM,
              transition:"all 0.3s ease",
            }}
          />
        ))}
      </div>
    </section>
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

/* ─── Translations ───────────────────────────────────────────────── */
const T = {
  fr: {
    nav: { links:[["#features","Features"],["#tarifs","Tarifs"]], signIn:"Se connecter" },
    hero: "Votre carnet de santé trading.",
    textReveal: "Votre trading mérite de la structure. Chaque trade raconte une histoire. Fyltra transforme vos données en intelligence pour que vous deveniez le trader que vous méritez d'être.",
    zoom: {
      tiles:["Prop Firm","Sync temps réel","Stats profondes","Plan de trading","IA Coach","Pour tout type de trader","Fonds propre"],
      centerLabel:"Tout ce qu'il faut pour trader", centerSpan:"avec précision.",
      badge:"Conçu pour tout type de trader",
      h2a:"Tout ce qu'il faut", h2b:"pour trader", h2c:"avec précision.",
      desc:"Journal structuré, IA Coach, multi-comptes — une seule plateforme pour analyser, progresser et trader mieux.",
      cta:"Voir les fonctionnalités →",
    },
    cards: {
      badge:"Pour tous les traders",
      headline:"Tout ce dont vous avez besoin,", headlineSpan:"au même endroit.",
      desc:"Journal, statistiques, IA Coach, gestion de prop firms — une seule app pour progresser vraiment.",
      items:[
        { id:"journal",    tag:"Journal de trading",        tagRgb:"74,222,128",  title:"Chaque trade, documenté.",        desc:"Résultat, session, émotion, instrument. Tout est là, trié et filtrable en un clic.",                           image:"/screenshots/journal.png" },
        { id:"dashboard",  tag:"Tableau de bord",           tagRgb:"232,205,169", title:"Votre performance en temps réel.", desc:"P&L cumulé, win rate, facteur de profit, equity curve — votre santé trading d'un coup d'œil.",              image:"/screenshots/dashboard.png" },
        { id:"ia",         tag:"IA Coach",                  tagRgb:"167,139,250", title:"Votre analyste personnel.",        desc:"Patterns réels, règles actionnables — tirés directement de vos propres données.",                            image:"/screenshots/ia.png" },
        { id:"comptes",    tag:"Multi-comptes & Prop Firms",tagRgb:"232,205,169", title:"Tous vos comptes, une seule vue.", desc:"Prop firms, fonds propres — chacun avec ses règles, drawdown max et equity séparée.",                        image:"/screenshots/comptes.png" },
        { id:"stats",      tag:"Statistiques",              tagRgb:"74,222,128",  title:"Vos données sans filtre.",         desc:"Win rate par session, P&L par émotion, profit factor par instrument. Brut et exploitable.",                   image:"/screenshots/stats.png" },
      ],
    },
    quote: { text:"Les meilleurs traders ne sont pas ceux qui ont les meilleures entrées. Ce sont ceux qui", highlight:"se connaissent le mieux." },
    pricing: {
      badge:"Tarifs", h2:"Simple.", h2span:"Transparent.",
      perMonth:"PAR MOIS · MENSUEL", loading:"Chargement...",
      plans:[
        { id:"starter", label:"Starter", price:"19", cents:".99",
          features:["Dashboard & statistiques avancées","Journal de trading","Multi-comptes & Prop Firm","Plan de trading intégré","Résiliable à tout moment"],
          btn:"Commencer →" },
        { id:"trader", label:"Trader", price:"24", cents:".99", badge:"Populaire",
          features:["Tout le Starter","IA Coach — analyse des patterns","Bilan fin de journée IA","Recommandations personnalisées","Résiliable à tout moment"],
          btn:"Choisir Trader →" },
        { id:"pro", label:"Pro", price:"29", cents:".99",
          features:["Tout le Trader","Sync MT5 automatique","Import depuis MetaTrader 5","Support prioritaire","Résiliable à tout moment"],
          btn:"Choisir Pro →" },
      ],
    },
    cta: { h2a:"Votre journal.", h2b:"Votre progression.", sub:"À partir de €19.99 / mois · Résiliable à tout moment.", btn:"Voir les tarifs →" },
    footer: { openApp:"Accéder à l'app →", legal:[["Mentions légales","/mentions-legales"],["CGV","/cgv"],["Confidentialité","/confidentialite"]] },
    auth: {
      title:"Bon retour 👋", sub:"Connecte-toi à ton journal de trading.",
      pwd:"Mot de passe", show:"Voir", hide:"Cacher",
      forgot:"Mot de passe oublié ?", forgotDesc:"Entre ton email pour recevoir un lien de réinitialisation.",
      sendLink:"Envoyer le lien", back:"← Retour", backLogin:"← Retour à la connexion",
      sentTitle:"Lien envoyé !", sentDesc:"Vérifie ta boîte mail et clique sur le lien pour réinitialiser ton mot de passe.",
      signIn:"Se connecter →", notMember:"Pas encore membre ?", createAcc:"Créer un compte →",
      accessTitle:"Accès réservé aux membres", accessDesc:"Cet email n'a pas de licence active. Choisis un plan pour accéder.",
      seePricing:"Voir les tarifs →",
      errEmail:"Entre ton email.", errFields:"Remplis tous les champs.", errVerif:"Erreur de vérification. Réessaie.",
      successCreate:"Compte créé ! Vérifie ton email pour confirmer.", loading:"...",
    },
    dash: {
      nav:["Compte","Trade","Statistiques","Plan"], header:"Tableau de bord", perf:"Performance",
      stats:[{l:"P&L Total",v:"+$4 217",sub:"+18.3%",color:"#4ade80"},{l:"Win Rate",v:"68%",sub:"34 / 50",color:"#4ade80"},{l:"RR Moyen",v:"2.4:1",sub:"bon",color:"rgba(240,237,232,0.45)"},{l:"Bilan",v:"34W/16L",sub:"ce mois",color:"#f0ede8"}],
      pnl:"Évolution P&L", calTitle:"Avril 2025", calDays:["L","M","M","J","V","S","D"],
      sessTitle:"Performance par session", tradesTitle:"Derniers trades",
      emotions:{Confiant:"Confiant",Neutre:"Neutre",Anxieux:"Anxieux",Patient:"Patient"},
      iaCoach:{ prefix:"London + ", mood:"Confiant", wr:" → 78% WR. ", avoid:"Évite le ", day:"Vendredi", rest:" (P&L cumulé: -$312). Si Anxieux, passe ton tour." },
      iaBadge:"◆ IA Coach",
    },
  },
  en: {
    nav: { links:[["#features","Features"],["#tarifs","Pricing"]], signIn:"Sign in" },
    hero: "Your trading health journal.",
    textReveal: "Your trading deserves structure. Every trade tells a story. Fyltra turns your data into intelligence so you become the trader you're meant to be.",
    zoom: {
      tiles:["Prop Firm","Real-time sync","Deep analytics","Trading plan","AI Coach","For every trader","Own funds"],
      centerLabel:"Everything you need to trade", centerSpan:"with precision.",
      badge:"Built for every type of trader",
      h2a:"Everything you need", h2b:"to trade", h2c:"with precision.",
      desc:"Structured journal, AI Coach, multi-accounts — one platform to analyze, improve and trade better.",
      cta:"Explore features →",
    },
    cards: {
      badge:"For every trader",
      headline:"Everything you need,", headlineSpan:"in one place.",
      desc:"Journal, stats, AI Coach, prop firm management — one app to truly improve.",
      items:[
        { id:"journal",    tag:"Trading Journal",            tagRgb:"74,222,128",  title:"Every trade, documented.",        desc:"P&L, session, emotion, instrument. All there, sorted and filterable in one click.",                          image:"/screenshots/journal.png" },
        { id:"dashboard",  tag:"Dashboard",                  tagRgb:"232,205,169", title:"Your performance in real time.",   desc:"Cumulative P&L, win rate, profit factor, equity curve — your trading health at a glance.",                  image:"/screenshots/dashboard.png" },
        { id:"ia",         tag:"AI Coach",                   tagRgb:"167,139,250", title:"Your personal analyst.",           desc:"Real patterns, actionable rules — drawn directly from your own data.",                                       image:"/screenshots/ia.png" },
        { id:"comptes",    tag:"Multi-accounts & Prop Firms",tagRgb:"232,205,169", title:"All your accounts, one view.",     desc:"Prop firms, own funds — each with their own rules, max drawdown and separate equity.",                        image:"/screenshots/comptes.png" },
        { id:"stats",      tag:"Statistics",                 tagRgb:"74,222,128",  title:"Your data, unfiltered.",           desc:"Win rate by session, P&L by emotion, profit factor by instrument. Raw and actionable.",                       image:"/screenshots/stats.png" },
      ],
    },
    quote: { text:"The best traders aren't the ones with the best entries. They're the ones who", highlight:"know themselves best." },
    pricing: {
      badge:"Pricing", h2:"Simple.", h2span:"Transparent.",
      perMonth:"PER MONTH · MONTHLY", loading:"Loading...",
      plans:[
        { id:"starter", label:"Starter", price:"19", cents:".99",
          features:["Dashboard & advanced statistics","Trading journal","Multi-accounts & Prop Firm","Integrated trading plan","Cancel anytime"],
          btn:"Get started →" },
        { id:"trader", label:"Trader", price:"24", cents:".99", badge:"Popular",
          features:["Everything in Starter","AI Coach — pattern analysis","AI end-of-day review","Personalized recommendations","Cancel anytime"],
          btn:"Choose Trader →" },
        { id:"pro", label:"Pro", price:"29", cents:".99",
          features:["Everything in Trader","Automatic MT5 sync","Import from MetaTrader 5","Priority support","Cancel anytime"],
          btn:"Choose Pro →" },
      ],
    },
    cta: { h2a:"Your journal.", h2b:"Your progress.", sub:"Starting at €19.99 / month · Cancel anytime.", btn:"View pricing →" },
    footer: { openApp:"Open app →", legal:[["Legal Notice","/mentions-legales"],["Terms","/cgv"],["Privacy","/confidentialite"]] },
    auth: {
      title:"Welcome back 👋", sub:"Sign in to your trading journal.",
      pwd:"Password", show:"Show", hide:"Hide",
      forgot:"Forgot password?", forgotDesc:"Enter your email to receive a reset link.",
      sendLink:"Send link", back:"← Back", backLogin:"← Back to sign in",
      sentTitle:"Link sent!", sentDesc:"Check your inbox and click the link to reset your password.",
      signIn:"Sign in →", notMember:"Not a member yet?", createAcc:"Create an account →",
      accessTitle:"Members only", accessDesc:"This email has no active license. Choose a plan to get access.",
      seePricing:"View pricing →",
      errEmail:"Enter your email.", errFields:"Fill in all fields.", errVerif:"Verification error. Try again.",
      successCreate:"Account created! Check your email to confirm.", loading:"...",
    },
    dash: {
      nav:["Account","Trade","Statistics","Plan"], header:"Dashboard", perf:"Performance",
      stats:[{l:"Total P&L",v:"+$4,217",sub:"+18.3%",color:"#4ade80"},{l:"Win Rate",v:"68%",sub:"34 / 50",color:"#4ade80"},{l:"Avg RR",v:"2.4:1",sub:"good",color:"rgba(240,237,232,0.45)"},{l:"Summary",v:"34W/16L",sub:"this month",color:"#f0ede8"}],
      pnl:"P&L Evolution", calTitle:"April 2025", calDays:["M","T","W","T","F","S","S"],
      sessTitle:"Performance by session", tradesTitle:"Last trades",
      emotions:{Confiant:"Confident",Neutre:"Neutral",Anxieux:"Anxious",Patient:"Patient"},
      iaCoach:{ prefix:"London + ", mood:"Confident", wr:" → 78% WR. ", avoid:"Avoid ", day:"Friday", rest:" (Cumulative P&L: -$312). If Anxious, skip." },
      iaBadge:"◆ AI Coach",
    },
  },
};

/* ─── AuthModal ──────────────────────────────────────────────────── */
function AuthModal({ onClose, navigate, initialMode = "login", lang = "fr" }) {
  const [mode, setMode]         = useState(initialMode);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent]   = useState(false);
  const overlayRef              = useRef();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const [paywall, setPaywall] = useState(false);

  const ta = T[lang].auth;
  const sendReset = async () => {
    if (!email) { setError(ta.errEmail); return; }
    setLoading(true); setError("");
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: "https://fyltra.app/app" });
    if (resetErr) { setError(resetErr.message); } else { setResetSent(true); }
    setLoading(false);
  };

  const submit = async () => {
    if (!email || !password) { setError(ta.errFields); return; }
    setLoading(true); setError(""); setSuccess(""); setPaywall(false);

    const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
    if (!loginErr) { onClose(); navigate("/app"); setLoading(false); return; }

    if (loginErr.message === "Invalid login credentials") {
      try {
        const check = await fetch(`/api/check-purchase?email=${encodeURIComponent(email)}`);
        const { authorized } = await check.json();
        if (!authorized) { setPaywall(true); setLoading(false); return; }
      } catch {
        setError(ta.errVerif);
        setLoading(false);
        return;
      }
      const { error: signUpErr } = await supabase.auth.signUp({ email, password });
      if (signUpErr) setError(signUpErr.message);
      else setSuccess(ta.successCreate);
    } else {
      setError(loginErr.message);
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
          <img src="/fyltra-logo-black.svg" style={{ height:52, width:"auto", opacity:0.8 }} alt="Fyltra"/>
        </div>

        <h2 style={{ fontFamily:"'Outfit',sans-serif", fontWeight:800, fontSize:24, color:"#fff", marginBottom:6, letterSpacing:"-0.02em" }}>
          {ta.title}
        </h2>
        <p style={{ fontSize:13, color:"rgba(255,255,255,0.35)", marginBottom:28 }}>
          {ta.sub}
        </p>

        {forgotMode ? (
          resetSent ? (
            <div style={{ textAlign:"center", padding:"16px 0" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>✉️</div>
              <div style={{ fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:16, color:"#fff", marginBottom:8 }}>{ta.sentTitle}</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", lineHeight:1.6 }}>{ta.sentDesc}</div>
              <button onClick={()=>{ setForgotMode(false); setResetSent(false); setError(""); }} style={{ marginTop:20, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"12px 24px", color:"rgba(255,255,255,0.5)", fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:13, cursor:"pointer" }}>
                {ta.back}
              </button>
            </div>
          ) : (
            <>
              <p style={{ fontSize:13, color:"rgba(255,255,255,0.35)", marginBottom:20 }}>{ta.forgotDesc}</p>
              <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendReset()}
                style={{...fieldStyle, marginBottom:14}}
                onFocus={e=>e.target.style.borderColor="rgba(232,205,169,0.4)"}
                onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.1)"}/>
              {error && <div style={{ background:"rgba(255,80,80,0.1)", border:"1px solid rgba(255,80,80,0.2)", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#ff8080", marginBottom:14 }}>{error}</div>}
              <button onClick={sendReset} disabled={loading}
                style={{ width:"100%", background:`linear-gradient(135deg,${gold},#c9aa82)`, color:"#000", border:"none", borderRadius:12, padding:"14px", fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:14, cursor:loading?"wait":"pointer", opacity:loading?0.7:1, transition:"all .22s", marginBottom:12 }}>
                {loading ? ta.loading : ta.sendLink}
              </button>
              <button onClick={()=>{ setForgotMode(false); setError(""); }} style={{ width:"100%", background:"none", border:"none", color:"rgba(255,255,255,0.35)", fontFamily:"'Outfit',sans-serif", fontSize:13, cursor:"pointer", textAlign:"center" }}>
                {ta.backLogin}
              </button>
            </>
          )
        ) : (
          <>
            {/* fields */}
            <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:14 }}>
              <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}
                style={fieldStyle} onFocus={e=>e.target.style.borderColor="rgba(232,205,169,0.4)"}
                onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.1)"}/>
              <div style={{ position:"relative" }}>
                <input type={showPwd?"text":"password"} placeholder={ta.pwd} value={password}
                  onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
                  style={{...fieldStyle, paddingRight:46}}
                  onFocus={e=>e.target.style.borderColor="rgba(232,205,169,0.4)"}
                  onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.1)"}/>
                <button onClick={()=>setShowPwd(p=>!p)} style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.3)", fontSize:12, padding:4 }}>
                  {showPwd ? ta.hide : ta.show}
                </button>
              </div>
            </div>
            <div style={{ textAlign:"right", marginBottom:16 }}>
              <button onClick={()=>{ setForgotMode(true); setError(""); setSuccess(""); }} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.45)", fontFamily:"'Outfit',sans-serif", fontSize:12, cursor:"pointer", padding:0, textDecoration:"underline", textUnderlineOffset:3 }}>
                {ta.forgot}
              </button>
            </div>
            {error   && <div style={{ background:"rgba(255,80,80,0.1)", border:"1px solid rgba(255,80,80,0.2)", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#ff8080", marginBottom:14 }}>{error}</div>}
            {paywall && (
              <div style={{ background:"rgba(232,205,169,0.07)", border:"1px solid rgba(232,205,169,0.22)", borderRadius:8, padding:"12px 14px", marginBottom:14 }}>
                <div style={{ fontSize:13, color:"#e8cda9", fontWeight:700, marginBottom:6 }}>{ta.accessTitle}</div>
                <div style={{ fontSize:12, color:"rgba(232,205,169,0.6)", marginBottom:12, lineHeight:1.5 }}>{ta.accessDesc}</div>
                <a href="#tarifs" onClick={onClose} style={{ display:"inline-block", background:"linear-gradient(135deg,#e8cda9,#c9aa82)", color:"#000", borderRadius:8, padding:"8px 18px", fontSize:12, fontWeight:700, textDecoration:"none" }}>
                  {ta.seePricing}
                </a>
              </div>
            )}
            {success && <div style={{ background:"rgba(80,200,100,0.1)", border:"1px solid rgba(80,200,100,0.2)", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#80e090", marginBottom:14 }}>{success}</div>}
            <button onClick={submit} disabled={loading}
              style={{ width:"100%", background:`linear-gradient(135deg,${gold},#c9aa82)`, color:"#000", border:"none", borderRadius:12, padding:"14px", fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:14, cursor:loading?"wait":"pointer", opacity:loading?0.7:1, transition:"all .22s", boxShadow:"0 0 28px rgba(232,205,169,0.2)" }}>
              {loading ? ta.loading : ta.signIn}
            </button>
            <div style={{ textAlign:"center", marginTop:16 }}>
              <span style={{ fontSize:13, color:"rgba(255,255,255,0.3)", fontFamily:"'Outfit',sans-serif" }}>{ta.notMember}</span>
              {" "}
              <button onClick={() => { onClose(); setTimeout(() => document.getElementById("tarifs")?.scrollIntoView({ behavior:"smooth" }), 80); }}
                style={{ background:"none", border:"none", cursor:"pointer", color:gold, fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:13, padding:0, textDecoration:"underline", textUnderlineOffset:3 }}>
                {ta.createAcc}
              </button>
            </div>
          </>
        )}
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
  const [lang, setLang] = useState(() => {
    try { const s = localStorage.getItem("fyltra_lang"); return s === "en" ? "en" : "fr"; } catch { return "fr"; }
  });
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem("fyltra-theme") !== "light"; } catch { return true; }
  });

  const C = getC(darkMode);

  useEffect(() => {
    try { localStorage.setItem("fyltra-theme", darkMode ? "dark" : "light"); } catch {}
    document.body.style.background = C.bg;
  }, [darkMode, C.bg]);

  useEffect(() => {
    try { localStorage.setItem("fyltra_lang", lang); } catch {}
  }, [lang]);

  // Handle Supabase PKCE code exchange when landing page receives a redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) return;
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (!error) navigate('/app', { replace: true });
    });
  }, [navigate]);

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
      {showAuth && <AuthModal onClose={()=>setShowAuth(false)} navigate={navigate} initialMode={authMode} lang={lang}/>}

      {/* cursor glow */}
      <div style={{ position:"fixed", left:mouse.x-220, top:mouse.y-220, width:440, height:440, borderRadius:"50%", background:`radial-gradient(circle,rgba(232,205,169,0.05) 0%,transparent 70%)`, pointerEvents:"none", zIndex:9999, transition:"left .08s,top .08s" }}/>

      {/* ─── NAV ─── */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:500, padding:"0 5vw", height:scrolled?58:72, display:"flex", alignItems:"center", justifyContent:"space-between", transition:"all .4s cubic-bezier(.16,1,.3,1)", background:scrolled?C.navBg:"transparent", backdropFilter:scrolled?"blur(20px)":"none", borderBottom:scrolled?`1px solid ${C.border}`:"none" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <img src={darkMode?"/fyltra-logo-black.svg":"/fyltra-logo-white.svg"} style={{ height:60, width:"auto" }} alt="Fyltra"/>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <div className="l-nav-links" style={{ display:"flex", gap:4 }}>
            {T[lang].nav.links.map(([href,label]) => (
              <a key={href} href={href} style={{ padding:"7px 16px", fontSize:13, fontWeight:500, color:C.textDim, textDecoration:"none", borderRadius:8, transition:"all .2s" }}
                onMouseEnter={e=>{ e.currentTarget.style.color=C.text; e.currentTarget.style.background=C.cardBg; }}
                onMouseLeave={e=>{ e.currentTarget.style.color=C.textDim; e.currentTarget.style.background="transparent"; }}>
                {label}
              </a>
            ))}
          </div>

          {/* lang toggle */}
          <button onClick={() => setLang(l => l === "fr" ? "en" : "fr")} style={{ width:36, height:36, borderRadius:10, background:C.cardBg, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", color:C.text, cursor:"pointer", transition:"all .22s", marginLeft:4, fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, letterSpacing:"0.05em" }}
            onMouseEnter={e=>{ e.currentTarget.style.background=C.cardBgH; e.currentTarget.style.borderColor=`rgba(232,205,169,0.35)`; }}
            onMouseLeave={e=>{ e.currentTarget.style.background=C.cardBg; e.currentTarget.style.borderColor=C.border; }}>
            {lang === "fr" ? "EN" : "FR"}
          </button>

          {/* theme toggle */}
          <button onClick={() => setDarkMode(d=>!d)} style={{ width:36, height:36, borderRadius:10, background:C.cardBg, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", color:C.text, cursor:"pointer", transition:"all .22s", marginLeft:4 }}
            onMouseEnter={e=>{ e.currentTarget.style.background=C.cardBgH; e.currentTarget.style.borderColor=`rgba(232,205,169,0.35)`; }}
            onMouseLeave={e=>{ e.currentTarget.style.background=C.cardBg; e.currentTarget.style.borderColor=C.border; }}>
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>

          <button onClick={() => { setAuthMode("login"); setShowAuth(true); }} style={{ marginLeft:4, background:"rgba(232,205,169,0.12)", border:"1px solid rgba(232,205,169,0.3)", borderRadius:10, padding:"9px 20px", fontFamily:"'Outfit',sans-serif", fontWeight:600, fontSize:13, color:gold, cursor:"pointer", transition:"all .22s" }}
            onMouseEnter={e=>{ e.currentTarget.style.background="rgba(232,205,169,0.22)"; e.currentTarget.style.boxShadow="0 0 20px rgba(232,205,169,0.2)"; }}
            onMouseLeave={e=>{ e.currentTarget.style.background="rgba(232,205,169,0.12)"; e.currentTarget.style.boxShadow="none"; }}>
            {T[lang].nav.signIn}
          </button>
        </div>
      </nav>

      {/* ─── CONTAINER SCROLL HERO ─── */}
      <ContainerScroll C={C}
        titleComponent={
          <h1 className="l-hero-title" style={{ fontWeight:900, fontSize:"clamp(36px,7vw,96px)", lineHeight:1.08, letterSpacing:"-0.04em", background:`linear-gradient(160deg,${C.text} 40%,${darkMode?"rgba(255,255,255,0.45)":"rgba(0,0,0,0.35)"} 100%)`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", textAlign:"center", transition:"background 0.4s" }}>
            {T[lang].hero}
          </h1>
        }
      >
        <DashboardMockup lang={lang} />
      </ContainerScroll>

      {/* ─── TEXT REVEAL ─── */}
      <TextRevealByWord C={C} text={T[lang].textReveal} />

      {/* ─── FEATURES ZOOM PARALLAX ─── */}
      <ZoomParallaxFeatures C={C} lang={lang} />

      {/* ─── SCROLL CARDS ─── */}
      <ScrollCards C={C} lang={lang} />

      {/* ─── QUOTE ─── */}
      <section className="l-section" style={{ padding:"120px 5vw", textAlign:"center" }}>
        <div style={{ maxWidth:760, margin:"0 auto" }}>
          <R>
            <div style={{ fontSize:36, color:"rgba(232,205,169,0.35)", marginBottom:20 }}>"</div>
            <blockquote style={{ fontWeight:600, fontSize:"clamp(18px,3vw,34px)", lineHeight:1.45, letterSpacing:"-0.02em", color:C.text }}>
              {T[lang].quote.text}{" "}
              <span style={{ background:"linear-gradient(135deg,#e8cda9,#e8cda9)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>{T[lang].quote.highlight}</span>
            </blockquote>
          </R>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="tarifs" className="l-section" style={{ padding:"110px 5vw", borderTop:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:960, margin:"0 auto" }}>
          <R>
            <div style={{ textAlign:"center", marginBottom:60 }}>
              <div style={{ display:"inline-block", background:C.cardBg, border:`1px solid ${C.border}`, borderRadius:100, padding:"5px 16px", marginBottom:18 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.textDim, letterSpacing:"0.2em", textTransform:"uppercase" }}>{T[lang].pricing.badge}</span>
              </div>
              <h2 style={{ fontWeight:800, fontSize:"clamp(28px,4vw,50px)", letterSpacing:"-0.025em", color:C.text }}>
                {T[lang].pricing.h2}{" "}
                <span style={{ background:"linear-gradient(135deg,#e8cda9,#c9aa82)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>{T[lang].pricing.h2span}</span>
              </h2>
            </div>
          </R>
          <R delay={0.1}>
            <div className="l-price-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
              {T[lang].pricing.plans.map(plan => (
                <PriceCard key={plan.id} plan={plan} C={C} lang={lang} />
              ))}
            </div>
          </R>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="l-section" style={{ padding:"150px 5vw", textAlign:"center", position:"relative", overflow:"hidden", borderTop:`1px solid ${C.border}` }}>
        <BGPattern variant="grid" mask="fade-y" size={24} fill={C.patternFill} />
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(232,205,169,0.055) 0%,transparent 65%)", pointerEvents:"none" }}/>
        <R>
          <div style={{ position:"relative", zIndex:1 }}>
            <h2 style={{ fontWeight:800, fontSize:"clamp(32px,6vw,80px)", lineHeight:1.05, letterSpacing:"-0.03em", marginBottom:16, color:C.text }}>
              {T[lang].cta.h2a}<br/>
              <span style={{ background:"linear-gradient(135deg,#e8cda9 0%,#e8cda9 50%,#c9aa82 100%)", backgroundSize:"200% 200%", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", animation:"lGrad 4s ease infinite" }}>{T[lang].cta.h2b}</span>
            </h2>
            <p style={{ fontSize:14, color:C.textDim, marginBottom:44 }}>{T[lang].cta.sub}</p>
            <div className="l-cta-btns" style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
              <a href="#tarifs" style={{ background:"linear-gradient(135deg,#e8cda9,#c9aa82)", color:"#000", border:"none", borderRadius:14, padding:"17px 50px", fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:15, cursor:"pointer", boxShadow:"0 0 40px rgba(232,205,169,0.28),0 4px 20px rgba(0,0,0,0.2)", transition:"all .25s cubic-bezier(.16,1,.3,1)", textDecoration:"none", display:"inline-block" }}
                onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-3px) scale(1.03)"; e.currentTarget.style.boxShadow="0 0 60px rgba(232,205,169,0.5),0 8px 28px rgba(0,0,0,0.3)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 0 40px rgba(232,205,169,0.28),0 4px 20px rgba(0,0,0,0.2)"; }}>
                {T[lang].cta.btn}
              </a>
            </div>
          </div>
        </R>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ borderTop:`1px solid ${C.border}`, padding:"30px 5vw", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <img src={darkMode?"/fyltra-logo-black.svg":"/fyltra-logo-white.svg"} style={{ height:40, width:"auto", opacity:0.5 }} alt="Fyltra"/>
        </div>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.textDimmer, letterSpacing:"0.1em" }}>© 2026 Fyltra · Trading Journal</span>
        <div style={{ display:"flex", gap:20, flexWrap:"wrap", alignItems:"center" }}>
          <a href="mailto:contact@fyltra.app" style={{ fontFamily:"'Outfit',sans-serif", fontWeight:500, fontSize:12, color:C.textDimmer, textDecoration:"none", transition:"color .2s" }}
            onMouseEnter={e=>e.currentTarget.style.color=C.text}
            onMouseLeave={e=>e.currentTarget.style.color=C.textDimmer}>Contact</a>
          {T[lang].footer.legal.map(([label, href]) => (
            <a key={href} href={href} style={{ fontFamily:"'Outfit',sans-serif", fontWeight:500, fontSize:12, color:C.textDimmer, textDecoration:"none", transition:"color .2s" }}
              onMouseEnter={e=>e.currentTarget.style.color=C.text}
              onMouseLeave={e=>e.currentTarget.style.color=C.textDimmer}>{label}</a>
          ))}
          <button onClick={() => { setAuthMode("login"); setShowAuth(true); }} style={{ background:"none", border:"none", fontFamily:"'Outfit',sans-serif", fontWeight:500, fontSize:12, color:C.textDimmer, cursor:"pointer", transition:"color .2s" }}
            onMouseEnter={e=>e.currentTarget.style.color=C.text}
            onMouseLeave={e=>e.currentTarget.style.color=C.textDimmer}>
            {T[lang].footer.openApp}
          </button>
        </div>
      </footer>
    </div>
  );
}

/* ─── Price Left Card — Early Bird ──────────────────────────────── */

async function goCheckout(plan, setLoading) {
  setLoading(true);
  try {
    const res = await fetch("/api/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      console.error("Checkout error:", data.error);
      setLoading(false);
    }
  } catch (e) {
    console.error(e);
    setLoading(false);
  }
}

function PriceCard({ plan, C, lang = "fr" }) {
  const [h, setH] = useState(false);
  const [loading, setLoading] = useState(false);
  const isDark = C.bg === "#060608";
  const tp = T[lang].pricing;
  const isHL = !!plan.badge;
  return (
    <div onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{
      padding:"36px 28px 40px",
      background: isHL
        ? isDark ? (h?"rgba(232,205,169,0.065)":"rgba(232,205,169,0.03)") : (h?"rgba(180,140,80,0.09)":"rgba(180,140,80,0.05)")
        : isDark ? (h?"rgba(255,255,255,0.04)":"transparent") : (h?"rgba(0,0,0,0.03)":"transparent"),
      border: isHL
        ? `1px solid ${h?"rgba(232,205,169,0.45)":"rgba(232,205,169,0.25)"}`
        : `1px solid ${C.border}`,
      borderRadius:16,
      position:"relative", overflow:"hidden",
      transition:"all .4s cubic-bezier(.16,1,.3,1)",
      boxShadow: isHL
        ? h ? "0 0 60px rgba(232,205,169,0.12), inset 0 1px 0 rgba(232,205,169,0.18)" : "0 0 20px rgba(232,205,169,0.06), inset 0 1px 0 rgba(232,205,169,0.08)"
        : "none",
    }}>
      {isHL && <div style={{ position:"absolute", top:-60, left:-30, width:220, height:220, borderRadius:"50%", background:"radial-gradient(circle,rgba(232,205,169,0.12) 0%,transparent 68%)", pointerEvents:"none", opacity:h?1:0.6, transition:"opacity .4s" }}/>}

      {/* top label / badge */}
      {isHL ? (
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"linear-gradient(135deg,#e8cda9,#c9aa82)", borderRadius:100, padding:"4px 12px 4px 8px", marginBottom:28 }}>
          <span style={{ fontSize:11 }}>⚡</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"#1a1208", fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase" }}>{plan.badge}</span>
        </div>
      ) : (
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:C.textDimmer, letterSpacing:"0.3em", textTransform:"uppercase", marginBottom:28, minHeight:28, display:"flex", alignItems:"center" }}>{plan.label}</div>
      )}

      {/* price */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:3, marginBottom:2 }}>
        <span style={{ fontSize:18, color:isHL?"rgba(232,205,169,0.6)":C.textDim, marginTop:14, fontWeight:300 }}>€</span>
        <span style={{ fontWeight:800, fontSize:88, lineHeight:1, letterSpacing:"-0.04em",
          ...(isHL ? { background:"linear-gradient(160deg,#e8cda9 30%,#c9aa82 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" } : { color:C.text })
        }}>{plan.price}</span>
        <span style={{ fontSize:28, color:isHL?"rgba(232,205,169,0.7)":C.textDim, marginTop:22, fontWeight:400 }}>{plan.cents}</span>
      </div>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:isHL?"rgba(232,205,169,0.5)":C.textDimmer, letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:32 }}>{tp.perMonth}</div>

      {/* features */}
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:32 }}>
        {plan.features.map((f,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:16, height:16, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
              background: isHL ? "linear-gradient(135deg,rgba(232,205,169,0.25),rgba(232,205,169,0.1))" : "transparent",
              border: isHL ? "1px solid rgba(232,205,169,0.35)" : `1px solid ${C.border}`,
            }}>
              <div style={{ width:5, height:5, borderRadius:"50%", background:isHL?"#e8cda9":C.textDim }}/>
            </div>
            <span style={{ fontSize:13, color:isHL?C.text:C.textDim, fontWeight:500, letterSpacing:"-0.01em" }}>{f}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button onClick={() => goCheckout(plan.id, setLoading)} disabled={loading}
        style={{ width:"100%", borderRadius:12, padding:"15px", fontFamily:"'Outfit',sans-serif", fontWeight:isHL?700:600, fontSize:14, cursor:loading?"not-allowed":"pointer", transition:"all .22s cubic-bezier(.16,1,.3,1)", letterSpacing:"-0.01em", opacity:loading?0.7:1,
          background: isHL ? "linear-gradient(135deg,#e8cda9,#c9aa82)" : "transparent",
          color: isHL ? "#1a1208" : C.text,
          border: isHL ? "none" : `1px solid ${C.border}`,
          boxShadow: isHL ? "0 0 36px rgba(232,205,169,0.25)" : "none",
        }}
        onMouseEnter={e=>{ if(!loading){
          if(isHL){ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 0 56px rgba(232,205,169,0.45)"; }
          else { e.currentTarget.style.background=isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.06)"; e.currentTarget.style.borderColor=C.textDim; }
        }}}
        onMouseLeave={e=>{ e.currentTarget.style.transform="none";
          if(isHL) e.currentTarget.style.boxShadow="0 0 36px rgba(232,205,169,0.25)";
          else { e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor=C.border; }
        }}>
        {loading ? tp.loading : plan.btn}
      </button>
    </div>
  );
}
