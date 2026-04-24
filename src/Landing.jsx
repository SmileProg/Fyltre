import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=Josefin+Sans:wght@300;400;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}
  body{background:#080808;color:#f0ede8;overflow-x:hidden;}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-thumb{background:#333;border-radius:2px;}
  @keyframes landOrb1{0%,100%{transform:translate(0,0) scale(1);}40%{transform:translate(80px,-60px) scale(1.1);}70%{transform:translate(-40px,70px) scale(0.92);}}
  @keyframes landOrb2{0%,100%{transform:translate(0,0) scale(1);}35%{transform:translate(-70px,50px) scale(0.9);}70%{transform:translate(90px,-40px) scale(1.08);}}
  @keyframes landParticle{0%{transform:translateY(0) translateX(0);opacity:0;}10%{opacity:1;}90%{opacity:0.5;}100%{transform:translateY(-100vh) translateX(var(--dx));opacity:0;}}
  @keyframes landFadeUp{from{opacity:0;transform:translateY(32px);}to{opacity:1;transform:translateY(0);}}
  @keyframes landLine{0%{transform:scaleX(0);opacity:0;}100%{transform:scaleX(1);opacity:1;}}
  @keyframes sweep{0%{transform:translateX(-100%);opacity:0;}20%{opacity:1;}80%{opacity:1;}100%{transform:translateX(120vw);opacity:0;}}
  @keyframes pulse{0%,100%{opacity:0.4;}50%{opacity:0.9;}}
  @keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);}}
`;

function useInView(threshold = 0.15) {
  const ref = useRef();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function Section({ children, delay = 0 }) {
  const [ref, visible] = useInView();
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(40px)", transition: `opacity 0.9s ${delay}s cubic-bezier(.22,1,.36,1), transform 0.9s ${delay}s cubic-bezier(.22,1,.36,1)` }}>
      {children}
    </div>
  );
}

const FEATURES = [
  { icon: "◉", title: "Multi-comptes", desc: "Prop firms, fonds propres — gérez chaque compte séparément avec ses propres règles et objectifs." },
  { icon: "◆", title: "IA Coach", desc: "Une analyse de votre journal par intelligence artificielle. Erreurs récurrentes, forces, règles pour demain." },
  { icon: "≡", title: "Statistiques profondes", desc: "Win rate, profit factor, courbe d'équité, analyse par session, instrument et émotion." },
  { icon: "◈", title: "Plan de trading", desc: "Documentez votre stratégie, vos règles d'entrée et de sortie. L'IA les utilise pour son analyse." },
  { icon: "⊞", title: "Layout personnalisable", desc: "Réorganisez les sections de chaque compte comme vous voulez. Votre espace, vos règles." },
  { icon: "◎", title: "Sync multi-appareils", desc: "Connectez-vous depuis votre ordinateur ou téléphone. Tout est synchronisé en temps réel." },
];

export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const particles = [
    { left:"5%",  delay:"0s",   dur:"8s",  size:1.5, dx:"20px"  },
    { left:"14%", delay:"1.4s", dur:"11s", size:1,   dx:"-15px" },
    { left:"23%", delay:"0.6s", dur:"7s",  size:2,   dx:"25px"  },
    { left:"34%", delay:"2.5s", dur:"9s",  size:1,   dx:"-20px" },
    { left:"45%", delay:"0.9s", dur:"13s", size:1.5, dx:"15px"  },
    { left:"55%", delay:"3.5s", dur:"8s",  size:2,   dx:"-10px" },
    { left:"65%", delay:"1.8s", dur:"10s", size:1,   dx:"30px"  },
    { left:"74%", delay:"0.3s", dur:"7.5s",size:1.5, dx:"-25px" },
    { left:"83%", delay:"2.9s", dur:"9.5s",size:2,   dx:"18px"  },
    { left:"92%", delay:"1.2s", dur:"11s", size:1,   dx:"-12px" },
  ];

  return (
    <div style={{ fontFamily:"'Josefin Sans',sans-serif", background:"#080808", color:"#f0ede8", minHeight:"100vh" }}>
      <style>{FONTS}</style>

      {/* ── NAV ── */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, padding:"20px 40px", display:"flex", alignItems:"center", justifyContent:"space-between", transition:"all 0.4s", background: scrolled ? "rgba(8,8,8,0.85)" : "transparent", backdropFilter: scrolled ? "blur(20px)" : "none", borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <img src="/fyltra_logo_white.svg" style={{ width:28, height:28 }} alt="Fyltra" />
          <span style={{ fontFamily:"'Josefin Sans',sans-serif", fontWeight:600, fontSize:14, letterSpacing:"0.25em", textTransform:"uppercase" }}>FYLTRA</span>
        </div>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <a href="#features" style={{ fontSize:10, color:"rgba(255,255,255,0.45)", letterSpacing:"0.15em", textTransform:"uppercase", textDecoration:"none", transition:"color 0.2s" }}
            onMouseEnter={e=>e.target.style.color="rgba(255,255,255,0.9)"}
            onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.45)"}>
            Features
          </a>
          <button onClick={() => navigate("/app")} style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, padding:"8px 18px", color:"#f0ede8", fontSize:10, fontFamily:"'Josefin Sans',sans-serif", fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", cursor:"pointer", transition:"all 0.2s" }}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.14)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.3)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.15)";}}>
            Se connecter
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"120px 24px 80px", position:"relative", overflow:"hidden" }}>

        {/* Orbes hero */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
          <div style={{ position:"absolute", top:"20%", left:"15%", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)", animation:"landOrb1 20s ease-in-out infinite", filter:"blur(50px)" }}/>
          <div style={{ position:"absolute", bottom:"15%", right:"10%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle, rgba(200,185,150,0.035) 0%, transparent 70%)", animation:"landOrb2 25s ease-in-out infinite", filter:"blur(60px)" }}/>
        </div>

        {/* Particules */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
          {particles.map((p, i) => (
            <div key={i} style={{ position:"absolute", bottom:"-10px", left:p.left, width:p.size, height:p.size, borderRadius:"50%", background:"rgba(255,255,255,0.85)", boxShadow:`0 0 ${p.size*4}px rgba(255,255,255,0.5)`, animation:`landParticle ${p.dur} ${p.delay} ease-in infinite`, "--dx":p.dx }}/>
          ))}
        </div>

        {/* Lignes sweep */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:"38%", left:0, width:240, height:1, background:"linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)", animation:"sweep 7s 1s ease-in-out infinite" }}/>
          <div style={{ position:"absolute", top:"62%", left:0, width:180, height:1, background:"linear-gradient(to right, transparent, rgba(255,255,255,0.07), transparent)", animation:"sweep 9s 4s ease-in-out infinite" }}/>
        </div>

        {/* Badge */}
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, border:"1px solid rgba(255,255,255,0.12)", borderRadius:20, padding:"6px 14px", marginBottom:36, animation:"landFadeUp 0.8s 0.1s both" }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:"rgba(255,255,255,0.6)", display:"inline-block", animation:"pulse 2s infinite" }}/>
          <span style={{ fontSize:9, letterSpacing:"0.25em", textTransform:"uppercase", color:"rgba(255,255,255,0.5)" }}>Journal de trading nouvelle génération</span>
        </div>

        {/* Titre */}
        <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(48px, 8vw, 96px)", fontWeight:300, lineHeight:1.05, letterSpacing:"-0.02em", marginBottom:24, animation:"landFadeUp 0.8s 0.2s both", maxWidth:800 }}>
          Devenez le trader<br/>
          <span style={{ fontStyle:"italic", color:"rgba(255,255,255,0.55)" }}>que vous méritez</span><br/>
          d'être.
        </h1>

        {/* Sous-titre */}
        <p style={{ fontSize:13, color:"rgba(255,255,255,0.4)", letterSpacing:"0.1em", lineHeight:1.8, maxWidth:440, marginBottom:44, animation:"landFadeUp 0.8s 0.32s both", fontWeight:300 }}>
          Fyltra transforme chaque trade en donnée.<br/>Analysez, comprenez, progressez.
        </p>

        {/* CTA */}
        <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap", animation:"landFadeUp 0.8s 0.44s both" }}>
          <button onClick={() => navigate("/app")} style={{ background:"#f0ede8", color:"#080808", border:"none", borderRadius:10, padding:"16px 36px", fontSize:10, fontFamily:"'Josefin Sans',sans-serif", fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", cursor:"pointer", transition:"all 0.22s", boxShadow:"0 8px 40px rgba(240,237,232,0.18), 0 2px 8px rgba(0,0,0,0.4)" }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 14px 50px rgba(240,237,232,0.25), 0 4px 12px rgba(0,0,0,0.5)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 8px 40px rgba(240,237,232,0.18), 0 2px 8px rgba(0,0,0,0.4)";}}>
            Commencer gratuitement →
          </button>
          <a href="#features" style={{ background:"transparent", color:"rgba(255,255,255,0.5)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, padding:"16px 28px", fontSize:10, fontFamily:"'Josefin Sans',sans-serif", fontWeight:400, letterSpacing:"0.2em", textTransform:"uppercase", cursor:"pointer", textDecoration:"none", transition:"all 0.22s", display:"inline-block" }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.3)"; e.currentTarget.style.color="rgba(255,255,255,0.8)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"; e.currentTarget.style.color="rgba(255,255,255,0.5)";}}>
            En savoir plus
          </a>
        </div>

        {/* Scroll indicator */}
        <div style={{ position:"absolute", bottom:40, left:"50%", transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:8, animation:"landFadeUp 0.8s 0.8s both" }}>
          <div style={{ width:1, height:50, background:"linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)" }}/>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div style={{ height:1, background:"linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)", margin:"0 40px" }}/>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding:"120px 24px", maxWidth:1100, margin:"0 auto" }}>
        <Section>
          <div style={{ textAlign:"center", marginBottom:72 }}>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:"0.3em", textTransform:"uppercase", marginBottom:16 }}>Fonctionnalités</div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(32px, 5vw, 56px)", fontWeight:300, lineHeight:1.1 }}>
              Tout ce dont un trader<br/>
              <span style={{ fontStyle:"italic", color:"rgba(255,255,255,0.45)" }}>sérieux a besoin.</span>
            </h2>
          </div>
        </Section>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))", gap:2 }}>
          {FEATURES.map((f, i) => (
            <Section key={f.title} delay={i * 0.08}>
              <div style={{ padding:"40px 36px", borderRadius:2, transition:"background 0.3s", cursor:"default" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.025)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ fontSize:22, color:"rgba(255,255,255,0.2)", marginBottom:20 }}>{f.icon}</div>
                <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, fontWeight:400, marginBottom:12, letterSpacing:"0.02em" }}>{f.title}</h3>
                <p style={{ fontSize:11, color:"rgba(255,255,255,0.38)", lineHeight:1.9, fontWeight:300, letterSpacing:"0.05em" }}>{f.desc}</p>
              </div>
            </Section>
          ))}
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div style={{ height:1, background:"linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)", margin:"0 40px" }}/>

      {/* ── QUOTE ── */}
      <section style={{ padding:"120px 24px", textAlign:"center", maxWidth:700, margin:"0 auto" }}>
        <Section>
          <div style={{ fontSize:9, color:"rgba(255,255,255,0.2)", letterSpacing:"0.3em", textTransform:"uppercase", marginBottom:32 }}>Philosophie</div>
          <blockquote style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(24px, 4vw, 40px)", fontWeight:300, lineHeight:1.4, fontStyle:"italic", color:"rgba(255,255,255,0.75)" }}>
            "Les meilleurs traders ne sont pas ceux qui ont les meilleures entrées.<br/>Ce sont ceux qui se connaissent le mieux."
          </blockquote>
        </Section>
      </section>

      {/* ── DIVIDER ── */}
      <div style={{ height:1, background:"linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)", margin:"0 40px" }}/>

      {/* ── CTA FINAL ── */}
      <section style={{ padding:"140px 24px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle, rgba(255,255,255,0.025) 0%, transparent 65%)", filter:"blur(60px)", pointerEvents:"none" }}/>
        <Section>
          <div style={{ position:"relative", zIndex:1 }}>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(36px, 6vw, 72px)", fontWeight:300, lineHeight:1.1, marginBottom:20 }}>
              Votre journal.<br/>
              <span style={{ fontStyle:"italic", color:"rgba(255,255,255,0.45)" }}>Votre progression.</span>
            </h2>
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.3)", letterSpacing:"0.1em", marginBottom:44, fontWeight:300 }}>Gratuit. Sans carte bancaire.</p>
            <button onClick={() => navigate("/app")} style={{ background:"#f0ede8", color:"#080808", border:"none", borderRadius:10, padding:"18px 44px", fontSize:10, fontFamily:"'Josefin Sans',sans-serif", fontWeight:700, letterSpacing:"0.22em", textTransform:"uppercase", cursor:"pointer", transition:"all 0.22s", boxShadow:"0 8px 40px rgba(240,237,232,0.15)" }}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 14px 50px rgba(240,237,232,0.22)";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 8px 40px rgba(240,237,232,0.15)";}}>
              Créer mon compte →
            </button>
          </div>
        </Section>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop:"1px solid rgba(255,255,255,0.06)", padding:"40px 40px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <img src="/fyltra_logo_white.svg" style={{ width:22, height:22, opacity:0.5 }} alt="Fyltra" />
          <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)", letterSpacing:"0.2em", textTransform:"uppercase" }}>FYLTRA</span>
        </div>
        <div style={{ fontSize:9, color:"rgba(255,255,255,0.15)", letterSpacing:"0.1em" }}>
          © 2025 Fyltra · Trading Journal
        </div>
        <button onClick={() => navigate("/app")} style={{ background:"none", border:"none", fontSize:9, color:"rgba(255,255,255,0.25)", letterSpacing:"0.15em", textTransform:"uppercase", cursor:"pointer", fontFamily:"'Josefin Sans',sans-serif", transition:"color 0.2s" }}
          onMouseEnter={e=>e.target.style.color="rgba(255,255,255,0.6)"}
          onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.25)"}>
          Accéder à l'app →
        </button>
      </footer>
    </div>
  );
}
