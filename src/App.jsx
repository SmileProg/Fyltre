import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, LabelList, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";
import { supabase } from "./supabase";

/* ─── Constants ─────────────────────────────────────────────────── */
const BASE_INSTRUMENTS = ["MNQ","NQ","ES","MES","CL","GC","EUR/USD"];
const EMOTIONS = ["Confiant","Neutre","Anxieux","Euphorique","Frustré","Patient"];
const SESSIONS = ["Asia","London","New York","Overlap"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const MONTHS_SH = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];
const KEYS = { trades:"fyltra_trades_v1", instruments:"fyltra_instr_v1", strategies:"fyltra_strategies_v1", capital:"fyltra_cap_v1", propfirms:"fyltra_propfirms_v1" };
const NAV = [
  { key:"propfirm",  icon:"◉",  label:"Compte" },
  { key:"add",       icon:"＋", label:"Trade" },
  { key:"ai",        icon:"◆",  label:"IA" },
];

/* ─── Colors ─────────────────────────────────────────────────────── */
const LIGHT_THEME = {
  bg:"#f8f7f5", bg2:"#f0ede8", bg3:"#e8e4de",
  white:"#1a1a1a", gray1:"#888", gray2:"#bbb", gray3:"#ddd",
  accent:"#111", dim:"#555",
  border:"rgba(0,0,0,0.1)", borderGold:"rgba(0,0,0,0.15)",
};
const DARK_THEME = {
  bg:"#0f0f0f", bg2:"#1a1a1a", bg3:"#242424",
  white:"#f0ede8", gray1:"#888", gray2:"#555", gray3:"#333",
  accent:"#f0ede8", dim:"#aaa",
  border:"rgba(255,255,255,0.08)", borderGold:"rgba(255,255,255,0.12)",
};
// C is set dynamically in App — default to light for components defined outside App
let C = LIGHT_THEME;

/* ─── Fonts / Global CSS ─────────────────────────────────────────── */
const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=Barlow:wght@500;600;700&display=swap');
  @font-face { font-family: 'MariellaNove'; src: url('/mariella-noeve.ttf') format('truetype'); font-weight: normal; font-style: normal; font-display: swap; }
  @font-face { font-family: 'CoolveticaHv'; src: url('/coolvetica-hv-comp.otf') format('opentype'); font-weight: normal; font-style: normal; font-display: swap; }
  @font-face { font-family: 'Coolvetica'; src: url('/coolvetica-rg.otf') format('opentype'); font-weight: normal; font-style: normal; font-display: swap; }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--bg, #f8f7f5);overflow-x:hidden;transition:background 0.3s;}
  input[type=date]::-webkit-calendar-picker-indicator,input[type=time]::-webkit-calendar-picker-indicator{filter:invert(0.4);opacity:0.5;}
  ::selection{background:#111;color:#fff;}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-track{background:var(--bg, #f8f7f5);}
  ::-webkit-scrollbar-thumb{background:#ccc;border-radius:2px;}
  textarea{font-family:'Josefin Sans',sans-serif !important;}
  @keyframes slideFromRight{from{opacity:0;transform:translateX(40px);}to{opacity:1;transform:translateX(0);}}
  @keyframes slideToRight{from{opacity:1;transform:translateX(0);}to{opacity:0;transform:translateX(40px);}}
  @keyframes fadeInUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
  @keyframes slideInAccount{from{opacity:0;transform:translateX(-24px);}to{opacity:1;transform:translateX(0);}}
  @keyframes slideOutAccount{from{opacity:1;transform:translateX(0);}to{opacity:0;transform:translateX(-24px);}}
  @keyframes fadeOutDown{from{opacity:1;transform:translateY(0);}to{opacity:0;transform:translateY(20px);}}
  @keyframes tabFadeIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
  @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
  @keyframes scaleIn{from{opacity:0;transform:scale(0.88);}to{opacity:1;transform:scale(1);}}
  @keyframes scaleOut{from{opacity:1;transform:scale(1);}to{opacity:0;transform:scale(0.88);}}
`;

/* ─── Utils ──────────────────────────────────────────────────────── */
const load = (k, f) => { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const useIsMobile = () => {
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
};

/* ─── Base UI ────────────────────────────────────────────────────── */
const iStyle = {
  width:"100%", background:C.bg3, border:`1px solid ${C.border}`,
  borderRadius:10, padding:"13px 14px", color:C.white, fontSize:16,
  fontFamily:"'Josefin Sans',sans-serif", fontWeight:300, outline:"none",
  WebkitAppearance:"none", appearance:"none", letterSpacing:"0.05em",
  boxShadow:"inset 0 2px 6px rgba(0,0,0,0.18), inset 0 1px 2px rgba(0,0,0,0.1)",
};

function Label({ children }) {
  return <div style={{ fontSize:10, color:C.dim, textTransform:"uppercase", letterSpacing:"0.18em", fontFamily:"'Josefin Sans',sans-serif", fontWeight:600, marginBottom:6 }}>{children}</div>;
}

function Field({ label, children, mb=16 }) {
  return <div style={{ marginBottom:mb }}><Label>{label}</Label>{children}</div>;
}

function Divider() {
  return <div style={{ height:1, background:`linear-gradient(to right,transparent,${C.border},transparent)`, margin:"18px 0" }} />;
}

function Chip({ label, active, onClick }) {
  const isDark = C.bg === "#0f0f0f";
  return (
    <button onClick={onClick} style={{
      padding:"8px 14px", borderRadius:20, cursor:"pointer",
      transition:"all 0.22s cubic-bezier(.4,0,.2,1)",
      border: active ? "none" : isDark ? `1px solid ${C.gray2}` : "1px solid rgba(0,0,0,0.28)",
      background: active
        ? isDark
          ? "radial-gradient(ellipse 90% 90% at 50% 38%, rgba(245,245,245,0.92) 0%, rgba(210,210,210,0.84) 55%, rgba(225,225,225,0.88) 100%)"
          : "radial-gradient(ellipse 90% 90% at 50% 38%, rgba(25,25,25,0.92) 0%, rgba(55,55,55,0.84) 55%, rgba(40,40,40,0.88) 100%)"
        : isDark ? "transparent" : C.bg3,
      color: active ? (isDark ? "#111" : "#f0ede8") : isDark ? C.gray1 : C.white,
      fontSize:11, fontFamily:"'Josefin Sans',sans-serif", fontWeight:active ? 600 : 500,
      letterSpacing:"0.08em", textTransform:"uppercase", flex:"1 1 auto", minWidth:44,
      boxShadow: active
        ? isDark
          ? "0 0 24px 7px rgba(255,255,255,0.22), 0 0 50px 14px rgba(255,255,255,0.09), 0 4px 14px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)"
          : "0 0 14px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.18)"
        : isDark ? "none" : "inset 0 2px 4px rgba(0,0,0,0.15)",
      transform: active ? "translateY(-1px)" : "translateY(0)",
    }}>
      {label}
    </button>
  );
}

function ChipGroup({ options, value, onChange }) {
  return <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>{options.map(o => <Chip key={o} label={o} active={value===o} onClick={() => onChange(o)} />)}</div>;
}

function DatePicker({ value, onChange }) {
  const isDark = C.bg === "#0f0f0f";
  return (
    <input
      type="date"
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      style={{
        width:"100%", boxSizing:"border-box",
        background: isDark ? "rgba(255,255,255,0.06)" : C.bg3,
        border: `1px solid ${C.border}`,
        borderRadius:10, padding:"10px 14px",
        color: C.white, fontSize:14,
        fontFamily:"'Josefin Sans',sans-serif",
        fontWeight:300, letterSpacing:"0.04em",
        outline:"none", cursor:"pointer",
        colorScheme: isDark ? "dark" : "light",
      }}
    />
  );
}

function TimePicker({ value, onChange }) {
  const isDark = C.bg === "#0f0f0f";
  return (
    <input
      type="time"
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      style={{
        width:"100%", boxSizing:"border-box",
        background: isDark ? "rgba(255,255,255,0.06)" : C.bg3,
        border: `1px solid ${C.border}`,
        borderRadius:10, padding:"10px 14px",
        color: C.white, fontSize:14,
        fontFamily:"'Josefin Sans',sans-serif",
        fontWeight:300, letterSpacing:"0.04em",
        outline:"none", cursor:"pointer",
        colorScheme: isDark ? "dark" : "light",
      }}
    />
  );
}

function StatCard({ label, value, color, small }) {
  const isDark = C.bg === "#0f0f0f";
  return (
    <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderTop:`2px solid ${color||C.accent}`, borderRadius:14, padding:small ? (!isMobile?"20px 22px":"16px 18px") : (!isMobile?"28px 24px":"20px 18px"), position:"relative", boxShadow: isDark ? "0 6px 32px rgba(0,0,0,0.65), 0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1), 0 -2px 28px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.36)" : "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.06)" }}>
      <div style={{ fontSize:9, color:C.dim, textTransform:"uppercase", letterSpacing:"0.18em", fontFamily:"'Josefin Sans',sans-serif", fontWeight:600, marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:small ? 16 : 24, fontWeight:300, color:color||C.white, fontFamily:"'Josefin Sans',sans-serif", lineHeight:1, letterSpacing:"0.05em" }}>{value}</div>
    </div>
  );
}

function PageTitle({ sub, title }) {
  return (
    <div style={{ marginBottom:22 }}>
      <div style={{ fontSize:11, color:C.dim, letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:4, fontFamily:"'Josefin Sans',sans-serif" }}>{sub}</div>
      <div style={{ fontFamily:"'Josefin Sans',sans-serif", fontSize:26, fontWeight:700, color:C.white, letterSpacing:"-0.025em" }}>{title}</div>
    </div>
  );
}

/* ─── Mobile Pill Nav ────────────────────────────────────────────── */
function PillNav({ view, setView, darkMode }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", zIndex:200, display:"flex", alignItems:"center", background:"linear-gradient(180deg, rgba(60,60,60,0.97) 0%, rgba(18,18,18,0.99) 55%, rgba(8,8,8,1) 100%)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderRadius:50, padding:"6px 8px", gap:2, boxShadow:"0 6px 20px rgba(0,0,0,0.5), 0 20px 50px rgba(0,0,0,0.4), 0 0 60px rgba(255,255,255,0.11), 0 0 0 1px rgba(255,255,255,0.13), inset 0 1px 0 rgba(255,255,255,0.38), inset 0 -2px 0 rgba(0,0,0,0.8)", border:"1px solid rgba(255,255,255,0.1)" }}>
      {NAV.map(item => {
        const active = view === item.key;
        const isHovered = hovered === item.key && !active;
        return (
          <button key={item.key} onClick={() => setView(item.key)} onMouseEnter={() => setHovered(item.key)} onMouseLeave={() => setHovered(null)} style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, padding:"8px 14px", borderRadius:44, border:"none", cursor:"pointer", background:active ? "radial-gradient(ellipse 90% 90% at 50% 50%, rgba(252,252,252,0.93) 0%, rgba(225,225,225,0.85) 55%, rgba(200,200,200,0.75) 100%)" : isHovered ? "rgba(255,255,255,0.05)" : "transparent", boxShadow:active ? "0 0 26px 8px rgba(255,255,255,0.22), 0 0 50px 16px rgba(255,255,255,0.09), 0 6px 20px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.3)" : "none", transform:"translateY(0)", transition:"all 0.25s cubic-bezier(.4,0,.2,1)", minWidth:52, position:"relative", zIndex:1 }}>
            <span style={{ fontSize:16, lineHeight:1, color:active ? "#111" : "rgba(255,255,255,0.4)", transition:"color 0.2s" }}>{item.icon}</span>
            <span style={{ fontSize:8, fontFamily:"'Josefin Sans',sans-serif", fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", color:active ? "#222" : "rgba(255,255,255,0.35)", transition:"color 0.2s" }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Desktop Sidebar ────────────────────────────────────────────── */
const FULL_NAV = [
  { key:"propfirm",  icon:"◉",  label:"Compte" },
  { key:"add",       icon:"＋", label:"Trade" },
  { key:"history",   icon:"≡",  label:"Statistiques" },
  { key:"strategy",  icon:"◈",  label:"Plan" },
  { key:"ai",        icon:"◆",  label:"IA" },
  { key:"settings",  icon:"◎",  label:"Paramètres" },
];
function Sidebar({ view, setView, darkMode, onSignOut }) {
  const [hovered, setHovered] = useState(null);
  const pillStyle = { background:"linear-gradient(180deg, rgba(60,60,60,0.97) 0%, rgba(18,18,18,0.99) 55%, rgba(8,8,8,1) 100%)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderRadius:24, padding:"10px", boxShadow:"0 6px 20px rgba(0,0,0,0.5), 0 20px 50px rgba(0,0,0,0.4), 0 0 60px rgba(255,255,255,0.11), 0 0 0 1px rgba(255,255,255,0.13), inset 0 1px 0 rgba(255,255,255,0.38), inset 0 -2px 0 rgba(0,0,0,0.8)", border:"1px solid rgba(255,255,255,0.1)" };

  const NavBtn = ({ item }) => {
    const active = view === item.key;
    const isHovered = hovered === item.key && !active;
    return (
      <button onClick={() => setView(item.key)} onMouseEnter={() => setHovered(item.key)} onMouseLeave={() => setHovered(null)} style={{
        display:"flex", alignItems:"center", gap:14, width:"100%",
        padding: active ? "10px 18px" : "10px 14px",
        borderRadius:16, border:"none", cursor:"pointer",
        background: active ? "radial-gradient(ellipse 110% 100% at 50% 35%, rgba(252,252,252,0.93) 0%, rgba(225,225,225,0.85) 55%, rgba(200,200,200,0.75) 100%)" : isHovered ? "rgba(255,255,255,0.05)" : "transparent",
        marginBottom:4, transition:"all 0.25s cubic-bezier(.4,0,.2,1)",
        boxShadow: active ? "0 0 26px 8px rgba(255,255,255,0.22), 0 0 50px 16px rgba(255,255,255,0.09), 0 6px 20px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.3)" : isHovered ? "0 2px 8px rgba(0,0,0,0.2)" : "none",
        transform: active ? "translateY(-1px)" : isHovered ? "translateY(-0.5px)" : "translateY(0)",
        position:"relative", zIndex:1,
      }}>
        <span style={{ fontSize:17, color:active ? "#111" : "rgba(255,255,255,0.4)", lineHeight:1, width:22, textAlign:"center", transition:"color 0.25s" }}>{item.icon}</span>
        <span style={{ fontSize:11, fontFamily:"'Josefin Sans',sans-serif", fontWeight: active ? 700 : 300, letterSpacing:"0.1em", textTransform:"uppercase", color:active ? "#222" : "rgba(255,255,255,0.4)", transition:"color 0.25s", whiteSpace:"nowrap" }}>{item.label}</span>
      </button>
    );
  };

  return (
    <div style={{ width:220, minHeight:"100vh", background:C.bg2, borderRight:`1px solid ${C.border}`, flexDirection:"column", position:"fixed", left:0, top:0, padding:"28px 0", zIndex:50, display:"flex", boxShadow:"4px 0 24px rgba(0,0,0,0.12)" }}>
      {/* Logo */}
      <div style={{ padding:"0 20px 24px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <img src={darkMode?"/fyltra-creme.svg":"/fyltra-black.svg"} style={{width:42,height:42,flexShrink:0,borderRadius:8}} alt="Fyltra"/>
          <div>
            <div style={{ fontFamily:"'MariellaNove',sans-serif", fontSize:20, color:C.white, lineHeight:1 }}>FYLTRA</div>
            <div style={{ fontSize:8, color:C.dim, letterSpacing:"0.25em", textTransform:"uppercase", fontFamily:"'Josefin Sans',sans-serif", fontWeight:300 }}>Carnet de santé trading</div>
          </div>
        </div>
      </div>

      {/* Main nav pill */}
      <div style={{ padding:"16px 12px 10px", flex:1 }}>
        <div style={pillStyle}>
          {[{key:"propfirm",icon:"◉",label:"Compte"},{key:"add",icon:"＋",label:"Trade"},{key:"history",icon:"≡",label:"Statistiques"},{key:"strategy",icon:"◈",label:"Plan"}].map(item => <NavBtn key={item.key} item={item} />)}
        </div>
      </div>

      {/* IA pill */}
      <div style={{ padding:"0 12px 10px" }}>
        <div style={pillStyle}>
          <NavBtn item={{key:"ai",icon:"◆",label:"IA"}} />
        </div>
      </div>

      {/* Settings pill */}
      <div style={{ padding:"0 12px 16px" }}>
        <div style={pillStyle}>
          <NavBtn item={{key:"settings",icon:"◎",label:"Paramètres"}} />
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding:"12px 20px", borderTop:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontSize:9, color:C.gray2, fontFamily:"'Josefin Sans',sans-serif", letterSpacing:"0.08em" }}>v1.0 · Fyltra</div>
        <button onClick={() => onSignOut()} style={{ background:"none", border:"none", cursor:"pointer", fontSize:9, color:"rgba(229,100,100,0.55)", fontFamily:"'Josefin Sans',sans-serif", letterSpacing:"0.1em", textTransform:"uppercase", padding:"4px 8px", borderRadius:6, transition:"color 0.2s" }}>
          Déconnexion
        </button>
      </div>
    </div>
  );
}

/* ─── Calendar ───────────────────────────────────────────────────── */
function Calendar({ filtered, calMonth, calYear, onPrev, onNext, onDayClick, cur }) {
  const now = new Date();
  const m = calMonth;
  const yr = calYear;
  const daysInMonth = new Date(yr, m + 1, 0).getDate();
  const firstDay = new Date(yr, m, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const byDay = {};
  filtered.forEach(t => {
    const d = new Date(t.date + "T12:00:00");
    if (d.getFullYear() === yr && d.getMonth() === m) {
      byDay[d.getDate()] = (byDay[d.getDate()] || 0) + (t.pnl || 0);
    }
  });
  const maxAbs = Math.max(...Object.values(byDay).map(Math.abs), 1);
  let cells = [...Array(offset).fill(null), ...Array.from({ length:daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let w = 0; w < cells.length / 7; w++) weeks.push(cells.slice(w * 7, (w + 1) * 7));
  const DAYS = ["L","M","M","J","V","S","D"];

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ fontSize:10, color:C.dim, letterSpacing:"0.2em", textTransform:"uppercase", fontFamily:"'Josefin Sans',sans-serif", fontWeight:600 }}>Calendrier P&L</div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={onPrev} style={{ background:"none", border:"none", cursor:"pointer", color:C.gray1, fontSize:16, lineHeight:1, padding:"0 2px" }}>‹</button>
          <div style={{ fontSize:12, color:C.white, fontFamily:"'Josefin Sans',sans-serif", fontWeight:600, letterSpacing:"0.08em", minWidth:80, textAlign:"center" }}>{MONTHS_SH[m]} {yr}</div>
          <button onClick={onNext} style={{ background:"none", border:"none", cursor:"pointer", color:C.gray1, fontSize:16, lineHeight:1, padding:"0 2px" }}>›</button>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr) 48px", gap:3, marginBottom:3 }}>
        {DAYS.map((d, i) => <div key={i} style={{ textAlign:"center", fontSize:9, color:C.gray1, fontFamily:"'Josefin Sans',sans-serif", paddingBottom:3 }}>{d}</div>)}
        <div style={{ textAlign:"center", fontSize:9, color:C.dim, fontFamily:"'Josefin Sans',sans-serif", fontWeight:600, paddingBottom:3 }}>SEM</div>
      </div>
      {weeks.map((week, w) => {
        const weekPnl = week.reduce((s, day) => s + (day && byDay[day] ? byDay[day] : 0), 0);
        const hasWeek = week.some(day => day && byDay[day] !== undefined);
        return (
          <div key={w} style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr) 48px", gap:3, marginBottom:3 }}>
            {week.map((day, i) => {
              if (!day) return <div key={i} />;
              const pnl = byDay[day]; const hasTrade = pnl !== undefined;
              const intensity = hasTrade ? Math.min(0.9, 0.2 + 0.7 * (Math.abs(pnl) / maxAbs)) : 0;
              const bg = hasTrade ? (pnl >= 0 ? `rgba(42,110,58,${intensity})` : `rgba(192,57,43,${intensity})`) : "transparent";
              const isToday = now.getDate() === day && now.getMonth() === m && now.getFullYear() === yr;
              return (
                <div key={day} onClick={()=>{ if(onDayClick&&!isToday&&hasTrade){onDayClick({day,month:m,year:yr,pnl});}}} title={hasTrade ? `${pnl >= 0 ? "+" : ""}${pnl.toFixed(0)}${cur||"€"}` : ""} style={{ aspectRatio:"1", borderRadius:8, background:bg, border:isToday ? `1px solid ${C.accent}` : `1px solid ${hasTrade ? "transparent" : C.gray3}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:hasTrade&&!isToday?"pointer":"default", boxShadow:hasTrade ? "0 3px 10px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.3)" : "none", transform:hasTrade ? "translateY(-1px)" : "none", transition:"all 0.15s" }}>
                  <span style={{ fontSize:9, color:hasTrade ? "#fff" : C.gray1, fontFamily:"'Josefin Sans',sans-serif", lineHeight:1, fontWeight:hasTrade ? 600 : 300 }}>{day}</span>
                  {hasTrade && <span style={{ fontSize:7, color:"rgba(255,255,255,0.9)", lineHeight:1, marginTop:1 }}>{pnl >= 0 ? "+" : ""}{Math.round(pnl)}</span>}
                </div>
              );
            })}
            <div style={{ borderRadius:4, border:`1px solid ${hasWeek ? (weekPnl>=0?"rgba(42,110,58,0.35)":"rgba(192,57,43,0.35)") : C.gray3}`, background:hasWeek ? (weekPnl>=0?"rgba(42,110,58,0.08)":"rgba(192,57,43,0.08)") : "transparent", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2px 0" }}>
              {hasWeek ? (
                <>
                  <span style={{ fontSize:7, color:C.gray1, fontFamily:"'Josefin Sans',sans-serif", lineHeight:1 }}>sem</span>
                  <span style={{ fontSize:8, color:weekPnl >= 0 ? "#2a6e3a" : "#c0392b", fontFamily:"'Josefin Sans',sans-serif", fontWeight:700, lineHeight:1.2 }}>{weekPnl >= 0 ? "+" : ""}{Math.round(weekPnl)}</span>
                </>
              ) : <span style={{ fontSize:8, color:C.gray3 }}>—</span>}
            </div>
          </div>
        );
      })}
      <div style={{ display:"flex", gap:12, marginTop:8, justifyContent:"flex-end" }}>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}><div style={{ width:7, height:7, borderRadius:2, background:"rgba(42,110,58,0.7)" }} /><span style={{ fontSize:9, color:C.gray1, fontFamily:"'Josefin Sans',sans-serif" }}>Gain</span></div>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}><div style={{ width:7, height:7, borderRadius:2, background:"rgba(192,57,43,0.7)" }} /><span style={{ fontSize:9, color:C.gray1, fontFamily:"'Josefin Sans',sans-serif" }}>Perte</span></div>
      </div>
    </div>
  );
}

/* ─── P&L Chart ──────────────────────────────────────────────────── */
function PnlChart({ filtered, capital, pnlSum, height, cur }) {
  if (!filtered || filtered.length < 2) return null;
  const sorted = [...filtered].sort((a,b) => { const dc=a.date.localeCompare(b.date); return dc!==0?dc:(a.id||0)-(b.id||0); });
  let cum = 0;
  const data = [
    { label:"0", v:0, pnl:0, instrument:"" },
    ...sorted.map((t,i) => {
      cum += t.pnl || 0;
      return { label:String(i+1), v:parseFloat(cum.toFixed(2)), pnl:t.pnl||0, date:t.date.slice(5), instrument:t.instrument||"" };
    })
  ];
  const vals = data.map(d => d.v);
  const minV = Math.min(...vals), maxV = Math.max(...vals);
  const pad = Math.max((maxV - minV) * 0.15, 30);
  const lineColor = pnlSum >= 0 ? "#2a6e3a" : "#c0392b";
  const absMax = Math.max(Math.abs(minV), Math.abs(maxV), 30);
  const step = Math.ceil(absMax / 2 / 50) * 50 || 50;
  const yDomain = [-step * 2, step * 2];
  const yTicks = [-step * 2, -step, 0, step, step * 2];
  return (
    <ResponsiveContainer width="100%" height={height || 150}>
      <LineChart data={data} margin={{ top:4, right:4, left:0, bottom:0 }}>
        <XAxis dataKey="label" tick={{ fontSize:9, fontFamily:"'Josefin Sans',sans-serif", fill:C.gray1 }} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(data.length/6)-1)} />
        <YAxis
          domain={yDomain}
          ticks={yTicks}
          tick={{ fontSize:9, fontFamily:"'Josefin Sans',sans-serif", fill:C.gray1 }} tickLine={false} axisLine={false} width={52}
          tickFormatter={v => v===0?`0${cur||"€"}`:v>0?`+${Math.round(v)}${cur||"€"}`:`${Math.round(v)}${cur||"€"}`}
        />
        <Tooltip
          content={({active,payload}) => active && payload?.length ? (
            <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px"}}>
              {payload[0].payload.date && <div style={{fontSize:10,color:C.gray1,marginBottom:3,fontFamily:"'Josefin Sans',sans-serif"}}>{payload[0].payload.date}{payload[0].payload.instrument?" · "+payload[0].payload.instrument:""}</div>}
              <div style={{fontSize:13,color:payload[0].payload.pnl>=0?"#2a6e3a":"#c0392b",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600}}>{payload[0].payload.pnl>=0?"+":""}{payload[0].payload.pnl?.toFixed(0)}{cur||"€"}</div>
              <div style={{fontSize:11,color:C.dim,fontFamily:"'Josefin Sans',sans-serif"}}>Cumulé : {payload[0].value>=0?"+":""}{payload[0].value?.toFixed(0)}{cur||"€"}</div>
            </div>
          ) : null}
        />
        <ReferenceLine y={0} stroke={C.gray2} strokeWidth={1} />
        <Line type="monotone" dataKey="v" stroke={lineColor} strokeWidth={2} dot={{ r:2, fill:lineColor, strokeWidth:0 }} activeDot={{ r:5, fill:lineColor, strokeWidth:0 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ─── AUTH SCREEN ────────────────────────────────────────────────── */
/* ─── Scroll reveal helper ──────────────────────────────────────── */
function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); obs.disconnect(); }
    }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, vis];
}

function Reveal({ children, delay = 0, y = 50, style = {} }) {
  const [ref, vis] = useReveal();
  return (
    <div ref={ref} style={{
      ...style,
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : `translateY(${y}px)`,
      transition: `opacity 0.95s ${delay}s cubic-bezier(0.16,1,0.3,1), transform 0.95s ${delay}s cubic-bezier(0.16,1,0.3,1)`,
    }}>
      {children}
    </div>
  );
}

/* ─── Landing Page ───────────────────────────────────────────────── */
function TiltCard({ children, style = {} }) {
  const ref = useRef(null);
  const glRef = useRef(null);
  const onMove = (e) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width/2) / (r.width/2);
    const y = (e.clientY - r.top - r.height/2) / (r.height/2);
    el.style.transform = `perspective(900px) rotateX(${-y*8}deg) rotateY(${x*8}deg) translateZ(16px)`;
    if (glRef.current) glRef.current.style.background = `radial-gradient(circle at ${(x+1)/2*100}% ${(y+1)/2*100}%, rgba(232,205,169,0.12), transparent 65%)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
    if (glRef.current) glRef.current.style.background = "none";
  };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{ transformStyle:"preserve-3d", willChange:"transform", transition:"transform 0.18s cubic-bezier(.23,1,.32,1)", position:"relative", ...style }}>
      <div ref={glRef} style={{ position:"absolute", inset:0, borderRadius:"inherit", pointerEvents:"none", zIndex:1, transition:"background 0.1s" }} />
      <div style={{ position:"relative", zIndex:2 }}>{children}</div>
    </div>
  );
}

function AuthScreen() {
  const JF = "'Josefin Sans',sans-serif";
  const CV = "'CoolveticaHv',sans-serif";
  const MN = "'MariellaNove',sans-serif";

  const [isDark, setIsDark] = useState(true);

  const BG  = isDark ? "#0b0b0b"                    : "#f0ede8";
  const CR  = isDark ? "#f5f2ea"                    : "#0b0b0b";
  const GD  = isDark ? "#e8cda9"                    : "#7a5c1e";
  const DIM = isDark ? "rgba(245,242,234,0.45)"     : "rgba(11,11,11,0.5)";
  const BDR = isDark ? "rgba(245,242,234,0.09)"     : "rgba(11,11,11,0.1)";
  const CARD_BG   = isDark
    ? "linear-gradient(160deg,rgba(38,38,38,0.98) 0%,rgba(18,18,18,0.99) 100%)"
    : "linear-gradient(160deg,rgba(255,255,255,0.98) 0%,rgba(235,232,228,0.96) 100%)";
  const CARD_SHD  = isDark
    ? "0 20px 50px rgba(0,0,0,0.7),0 0 0 1px rgba(255,255,255,0.08),inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -2px 0 rgba(0,0,0,0.6)"
    : "0 12px 40px rgba(0,0,0,0.10),0 0 0 1px rgba(0,0,0,0.06),inset 0 1px 0 rgba(255,255,255,0.9),inset 0 -1px 0 rgba(0,0,0,0.06)";
  const CARD_BDR  = isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)";

  const [authModal, setAuthModal] = useState(null);
  const [mode, setMode]           = useState("login");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPwd, setShowPwd]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [menuOpen, setMenuOpen]   = useState(false);

  const openAuth = (m) => { setMode(m); setAuthModal(true); setError(""); setSuccess(""); setMenuOpen(false); };

  const submit = async () => {
    if (!email || !password) { setError("Remplis tous les champs."); return; }
    setLoading(true); setError(""); setSuccess("");
    if (mode === "login") {
      const { error: e } = await supabase.auth.signInWithPassword({ email, password });
      if (e) setError(e.message === "Invalid login credentials" ? "Email ou mot de passe incorrect." : e.message);
    } else {
      const { error: e } = await supabase.auth.signUp({ email, password });
      if (e) setError(e.message);
      else setSuccess("Compte créé ! Vérifie ton email pour confirmer.");
    }
    setLoading(false);
  };

  const PAD = "clamp(24px,7vw,110px)";
  const features = [
    { n:"01", title:"Pattern Detection", sub:"We find your edge before you lose it. Every pattern, quantified.", icon:"◎" },
    { n:"02", title:"Emotional Tracking", sub:"Because greed is always lying. Know your state, control your bias.", icon:"◈" },
    { n:"03", title:"AI Coaching",        sub:"Your data, turned into rules. Personalized, brutal, accurate.", icon:"◆" },
    { n:"04", title:"Multi-Account",      sub:"One journal, every strategy. Prop firms, live accounts, backtests.", icon:"◉" },
  ];

  return (
    <div style={{ background:BG, color:CR, fontFamily:JF, overflowX:"hidden", transition:"background 0.3s,color 0.3s" }}>
      <style>{FONTS}</style>

      {/* ── NAV ── */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"space-between", padding:`0 ${PAD}`, height:60, background:isDark?"rgba(11,11,11,0.9)":"rgba(240,237,232,0.92)", backdropFilter:"blur(18px)", borderBottom:`1px solid ${BDR}`, transition:"background 0.3s" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <img src={isDark?"/fyltra-creme.svg":"/fyltra-black.svg"} style={{ width:38, height:38, borderRadius:8 }} alt="" />
          <span style={{ fontFamily:MN, fontSize:20, color:CR }}>FYLTRA</span>
        </div>
        <div style={{ display:"flex", gap:32, position:"absolute", left:"50%", transform:"translateX(-50%)" }}>
          {["FEATURES","PRICING","ABOUT"].map(l => (
            <span key={l} style={{ fontSize:9, fontWeight:600, letterSpacing:"0.18em", color:DIM, cursor:"pointer", fontFamily:JF, transition:"color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.color=CR}
              onMouseLeave={e => e.currentTarget.style.color=DIM}>{l}</span>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          {/* Dark/Light toggle */}
          <button onClick={() => setIsDark(v => !v)} title={isDark?"Mode clair":"Mode sombre"} style={{ background:isDark?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.06)", border:`1px solid ${BDR}`, borderRadius:10, width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:DIM, flexShrink:0, transition:"all 0.2s" }}>
            {isDark ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
          <button onClick={() => openAuth("login")} style={{ background:"none", border:"none", color:DIM, fontSize:9, fontWeight:600, letterSpacing:"0.16em", cursor:"pointer", fontFamily:JF, transition:"color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.color=CR}
            onMouseLeave={e => e.currentTarget.style.color=DIM}>LOG IN</button>
          <button onClick={() => openAuth("signup")} style={{ background:CR, color:BG, border:"none", borderRadius:100, padding:"9px 20px", fontSize:9, fontWeight:700, letterSpacing:"0.14em", cursor:"pointer", fontFamily:JF, transition:"opacity 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.opacity="0.82"}
            onMouseLeave={e => e.currentTarget.style.opacity="1"}>START</button>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════
          SECTION 1 — HERO
      ═══════════════════════════════════════════════════════ */}
      <section style={{ position:"relative", minHeight:"100vh", overflow:"hidden" }}>
        {/* Dot pattern */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle, #E8D4C1 1.5px, transparent 1.5px)", backgroundSize:"30px 30px", opacity:isDark?0.35:0.5, pointerEvents:"none", transition:"opacity 0.3s" }} />
        {/* Fade edges */}
        <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse 70% 70% at 50% 40%, transparent 30%, ${BG} 100%)`, pointerEvents:"none", transition:"background 0.3s" }} />
        <div style={{ position:"relative", zIndex:10, minHeight:"100vh", display:"flex", flexDirection:"column", justifyContent:"center", padding:`100px ${PAD} 60px` }}>
          <div style={{ fontSize:9, color:GD, letterSpacing:"0.28em", fontFamily:JF, fontWeight:600, marginBottom:36 }}>
            Trading Journal · EST. 2025
          </div>
          <div>
            <div style={{ fontFamily:CV, fontSize:"clamp(52px,9vw,130px)", color:CR, letterSpacing:"-0.02em", lineHeight:0.90 }}>YOUR TRADING</div>
            <div style={{ fontFamily:CV, fontSize:"clamp(34px,5.5vw,80px)", color:GD, letterSpacing:"-0.02em", lineHeight:0.95, paddingLeft:"clamp(16px,3vw,48px)" }}>DESERVES</div>
            <div style={{ fontFamily:CV, fontSize:"clamp(64px,13.5vw,196px)", color:CR, letterSpacing:"-0.025em", lineHeight:0.88 }}>STRUCTURE.</div>
          </div>
          <div style={{ marginTop:"clamp(32px,4vh,56px)", display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:24 }}>
            <p style={{ fontFamily:JF, fontWeight:300, fontSize:14, color:DIM, lineHeight:1.8, maxWidth:340 }}>
              The trading journal built for traders who refuse to repeat the same mistakes twice.
            </p>
            <div style={{ display:"flex", gap:12 }}>
              <button onClick={() => openAuth("signup")} style={{ background:CR, color:BG, border:"none", borderRadius:100, padding:"14px 28px", fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", cursor:"pointer", fontFamily:JF, transition:"opacity 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.opacity="0.82"}
                onMouseLeave={e => e.currentTarget.style.opacity="1"}>Start Free →</button>
              <button onClick={() => openAuth("login")} style={{ background:"rgba(245,242,234,0.06)", color:CR, border:`1px solid ${BDR}`, borderRadius:100, padding:"14px 24px", fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", cursor:"pointer", fontFamily:JF, transition:"background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background="rgba(245,242,234,0.1)"}
                onMouseLeave={e => e.currentTarget.style.background="rgba(245,242,234,0.06)"}>Log in</button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 2 — PROOF (90%)
      ═══════════════════════════════════════════════════════ */}
      <section style={{ padding:`100px ${PAD}`, display:"flex", alignItems:"center", justifyContent:"center", gap:"clamp(40px,6vw,100px)", flexWrap:"wrap" }}>
        <Reveal delay={0}>
          <TiltCard style={{ background:CARD_BG, border:CARD_BDR, borderRadius:24, padding:"48px 56px", textAlign:"center", minWidth:280, boxShadow:CARD_SHD, transition:"background 0.3s" }}>
            <div style={{ fontFamily:CV, fontSize:"clamp(72px,11vw,148px)", color:GD, lineHeight:1, letterSpacing:"-0.03em" }}>90%</div>
            <div style={{ fontSize:9, color:DIM, fontFamily:JF, fontWeight:600, letterSpacing:"0.22em", marginTop:16, textTransform:"uppercase" }}>of traders fail</div>
          </TiltCard>
        </Reveal>
        <Reveal delay={0.15} style={{ maxWidth:400 }}>
          <div style={{ fontSize:9, color:GD, letterSpacing:"0.22em", fontFamily:JF, fontWeight:600, marginBottom:20, textTransform:"uppercase" }}>The Problem</div>
          <div style={{ fontFamily:CV, fontSize:"clamp(28px,4vw,52px)", color:CR, lineHeight:1.05, letterSpacing:"-0.02em", marginBottom:20 }}>Because of chaos.</div>
          <p style={{ fontFamily:JF, fontWeight:300, fontSize:14, color:DIM, lineHeight:1.85 }}>
            Most traders lose not because they lack skill, but because they lack structure.
            They repeat the same mistakes — different days, same patterns, same blind spots.
          </p>
          <div style={{ marginTop:32, display:"flex", gap:32 }}>
            <div>
              <div style={{ fontFamily:CV, fontSize:36, color:CR, letterSpacing:"-0.02em", lineHeight:1 }}>3.2x</div>
              <div style={{ fontSize:9, color:DIM, fontFamily:JF, fontWeight:600, letterSpacing:"0.14em", marginTop:6, textTransform:"uppercase" }}>Better WR with structure</div>
            </div>
            <div>
              <div style={{ fontFamily:CV, fontSize:36, color:CR, letterSpacing:"-0.02em", lineHeight:1 }}>12h</div>
              <div style={{ fontSize:9, color:DIM, fontFamily:JF, fontWeight:600, letterSpacing:"0.14em", marginTop:6, textTransform:"uppercase" }}>Saved per month</div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 3 — FEATURES (3D TILT CARDS)
      ═══════════════════════════════════════════════════════ */}
      <section style={{ padding:`80px ${PAD} 100px`, position:"relative" }}>
        {/* Perspective grid */}
        <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"65%", backgroundImage:"linear-gradient(rgba(232,205,169,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(232,205,169,0.06) 1px, transparent 1px)", backgroundSize:"56px 56px", transform:"perspective(380px) rotateX(58deg)", transformOrigin:"bottom", WebkitMaskImage:"linear-gradient(to top, black 20%, transparent)", maskImage:"linear-gradient(to top, black 20%, transparent)" }} />
        </div>
        <div style={{ position:"relative", zIndex:1 }}>
          <Reveal delay={0} style={{ marginBottom:56 }}>
            <div style={{ fontSize:9, color:GD, letterSpacing:"0.22em", fontFamily:JF, fontWeight:600, marginBottom:14, textTransform:"uppercase" }}>What Fyltra does</div>
            <div style={{ fontFamily:CV, fontSize:"clamp(32px,5vw,68px)", color:CR, letterSpacing:"-0.02em", lineHeight:1.0 }}>Your edge, quantified.</div>
          </Reveal>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))", gap:18 }}>
            {features.map((f, i) => (
              <Reveal key={f.n} delay={i*0.07}>
                <TiltCard style={{ background:CARD_BG, border:CARD_BDR, borderRadius:20, padding:"36px 30px", height:"100%", boxSizing:"border-box", boxShadow:CARD_SHD, transition:"background 0.3s,box-shadow 0.3s" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
                    <span style={{ fontSize:30, color:"rgba(232,205,169,0.45)", lineHeight:1 }}>{f.icon}</span>
                    <span style={{ fontSize:9, color:"rgba(245,242,234,0.16)", fontFamily:JF, fontWeight:600, letterSpacing:"0.18em" }}>{f.n}</span>
                  </div>
                  <div style={{ fontFamily:JF, fontWeight:700, fontSize:11, color:CR, letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:12 }}>{f.title}</div>
                  <p style={{ fontFamily:JF, fontWeight:300, fontSize:13, color:DIM, lineHeight:1.75 }}>{f.sub}</p>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 4 — EQUITY CURVE
      ═══════════════════════════════════════════════════════ */}
      <section style={{ padding:`80px ${PAD}` }}>
        <Reveal delay={0} style={{ marginBottom:40 }}>
          <div style={{ fontSize:9, color:GD, letterSpacing:"0.22em", fontFamily:JF, fontWeight:600, marginBottom:14, textTransform:"uppercase" }}>Your performance</div>
          <div style={{ fontFamily:CV, fontSize:"clamp(30px,4.5vw,60px)", color:CR, letterSpacing:"-0.02em", lineHeight:1.0 }}>Equity curve as art.</div>
        </Reveal>
        <Reveal delay={0.1}>
          <TiltCard style={{ background:CARD_BG, border:CARD_BDR, borderRadius:20, padding:"40px 36px", boxShadow:CARD_SHD, transition:"background 0.3s" }}>
            <svg viewBox="0 0 800 200" style={{ width:"100%", height:"auto", display:"block" }}>
              <defs>
                <linearGradient id="ecFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e8cda9" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#e8cda9" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,160 C40,155 60,145 100,130 C140,115 150,125 200,110 C250,95 260,105 300,85 C340,65 360,80 400,60 C440,40 450,55 500,35 C550,15 560,30 600,18 C640,6 660,20 700,12 C740,4 760,8 800,5 L800,200 L0,200 Z" fill="url(#ecFill)" />
              <path d="M0,160 C40,155 60,145 100,130 C140,115 150,125 200,110 C250,95 260,105 300,85 C340,65 360,80 400,60 C440,40 450,55 500,35 C550,15 560,30 600,18 C640,6 660,20 700,12 C740,4 760,8 800,5" fill="none" stroke="#e8cda9" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:28, flexWrap:"wrap", gap:20 }}>
              {[["Win Rate","68%"],["Avg RR","2.3:1"],["Max DD","-4.2%"],["Profit Factor","2.8"]].map(([l,v]) => (
                <div key={l}>
                  <div style={{ fontFamily:CV, fontSize:28, color:GD, letterSpacing:"-0.02em", lineHeight:1 }}>{v}</div>
                  <div style={{ fontSize:9, color:DIM, fontFamily:JF, fontWeight:600, letterSpacing:"0.14em", marginTop:6, textTransform:"uppercase" }}>{l}</div>
                </div>
              ))}
            </div>
          </TiltCard>
        </Reveal>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 5 — PRICING
      ═══════════════════════════════════════════════════════ */}
      <section style={{ padding:`80px ${PAD} 120px`, textAlign:"center" }}>
        <Reveal delay={0}>
          <div style={{ fontSize:9, color:GD, letterSpacing:"0.22em", fontFamily:JF, fontWeight:600, marginBottom:14, textTransform:"uppercase" }}>Pricing</div>
          <div style={{ fontFamily:CV, fontSize:"clamp(48px,8vw,110px)", color:CR, letterSpacing:"-0.025em", lineHeight:0.9, marginBottom:64 }}>SIMPLE.</div>
        </Reveal>
        <Reveal delay={0.1} style={{ display:"flex", justifyContent:"center" }}>
          <TiltCard style={{ background:CARD_BG, border:CARD_BDR, borderRadius:28, padding:"52px 60px", maxWidth:380, width:"100%", boxSizing:"border-box", boxShadow:CARD_SHD, transition:"background 0.3s" }}>
            <div style={{ fontSize:9, color:GD, fontFamily:JF, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:24 }}>Pro</div>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"center", gap:4, marginBottom:4 }}>
              <span style={{ fontFamily:JF, fontWeight:300, fontSize:22, color:DIM, marginTop:12 }}>€</span>
              <span style={{ fontFamily:CV, fontSize:88, color:CR, letterSpacing:"-0.03em", lineHeight:1 }}>24</span>
            </div>
            <div style={{ fontSize:10, color:DIM, fontFamily:JF, fontWeight:300, letterSpacing:"0.1em", marginBottom:40 }}>per month</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:40, textAlign:"left" }}>
              {["Unlimited trades","AI coaching","All analytics","All accounts","Priority support"].map(item => (
                <div key={item} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ color:GD, fontSize:10 }}>◆</span>
                  <span style={{ fontFamily:JF, fontWeight:300, fontSize:13, color:DIM }}>{item}</span>
                </div>
              ))}
            </div>
            <button onClick={() => openAuth("signup")} style={{ width:"100%", padding:"15px", borderRadius:12, border:"none", background:CR, color:BG, fontSize:10, fontFamily:JF, fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase", cursor:"pointer", transition:"opacity 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.opacity="0.88"}
              onMouseLeave={e => e.currentTarget.style.opacity="1"}>Start Now</button>
          </TiltCard>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding:`28px ${PAD}`, borderTop:`1px solid ${BDR}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
        <span style={{ fontFamily:MN, fontSize:16, color:CR, opacity:0.55 }}>FYLTRA</span>
        <span style={{ fontSize:9, color:"rgba(245,242,234,0.18)", fontFamily:JF, fontWeight:600, letterSpacing:"0.12em" }}>© 2025 — Trading Journal</span>
      </footer>

      {/* ═══ AUTH MODAL ═══ */}
      {authModal && (
        <div onClick={() => setAuthModal(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.82)", backdropFilter:"blur(12px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"rgba(18,18,18,0.97)", border:`1px solid ${BDR}`, borderRadius:20, padding:"40px 36px", maxWidth:380, width:"100%", boxShadow:"0 40px 80px rgba(0,0,0,0.6)", boxSizing:"border-box" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:32 }}>
              <span style={{ fontFamily:MN, fontSize:18, color:CR }}>FYLTRA</span>
              <button onClick={() => setAuthModal(null)} style={{ background:"none", border:"none", color:DIM, cursor:"pointer", fontSize:22, lineHeight:1, padding:0 }}>×</button>
            </div>
            <div style={{ display:"flex", gap:0, marginBottom:28, background:"rgba(255,255,255,0.05)", borderRadius:10, padding:4 }}>
              {[["login","Se connecter"],["signup","Créer un compte"]].map(([m,l]) => (
                <button key={m} onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                  style={{ flex:1, padding:"9px", borderRadius:8, border:"none", background:mode===m?CR:"transparent", color:mode===m?BG:DIM, fontSize:10, fontFamily:JF, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", cursor:"pointer", transition:"all 0.2s" }}>{l}
                </button>
              ))}
            </div>
            <div style={{ marginBottom:14 }}>
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
                style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:`1px solid ${BDR}`, borderRadius:10, padding:"14px 16px", color:CR, fontSize:14, fontFamily:JF, fontWeight:300, outline:"none", boxSizing:"border-box", letterSpacing:"0.03em" }} />
            </div>
            <div style={{ marginBottom:14, position:"relative" }}>
              <input type={showPwd?"text":"password"} placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==="Enter" && submit()}
                style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:`1px solid ${BDR}`, borderRadius:10, padding:"14px 46px 14px 16px", color:CR, fontSize:14, fontFamily:JF, fontWeight:300, outline:"none", boxSizing:"border-box", letterSpacing:"0.03em" }} />
              <button onClick={() => setShowPwd(v => !v)} style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.3)", lineHeight:1, padding:0, fontSize:13 }}>
                {showPwd
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
              </button>
            </div>
            {error   && <div style={{ marginBottom:12, fontSize:11, color:"#e05a5a", fontFamily:JF }}>{error}</div>}
            {success && <div style={{ marginBottom:12, fontSize:11, color:"#4caf6e", fontFamily:JF }}>{success}</div>}
            <button onClick={submit} disabled={loading}
              style={{ width:"100%", padding:"14px", borderRadius:10, border:"none", background:loading?"rgba(255,255,255,0.06)":CR, color:loading?"rgba(255,255,255,0.3)":BG, fontSize:10, fontFamily:JF, fontWeight:700, letterSpacing:"0.22em", textTransform:"uppercase", cursor:loading?"not-allowed":"pointer", transition:"all 0.2s" }}>
              {loading ? "···" : mode==="login" ? "Se connecter" : "Créer le compte"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── MT5 CONNECT ────────────────────────────────────────────────── */
function MT5Connect({ user, darkMode, onTradesImported }) {
  const isDark = darkMode;
  const [mt5Form, setMt5Form] = useState({ login:"", password:"", server:"", name:"", platform:"mt5" });
  const [showMt5Pwd, setShowMt5Pwd] = useState(false);
  const [mt5Account, setMt5Account] = useState(null);
  const [mt5Loading, setMt5Loading] = useState(false);
  const [mt5Syncing, setMt5Syncing] = useState(false);
  const [mt5Status, setMt5Status] = useState("");
  const [mt5Error, setMt5Error] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("mt5_accounts").select("*").eq("user_id", user.id).single()
      .then(({ data }) => { if (data) setMt5Account(data); });
  }, [user]);

  const connectMT5 = async () => {
    if (!mt5Form.login || !mt5Form.password || !mt5Form.server) { setMt5Error("Remplis tous les champs."); return; }
    setMt5Loading(true); setMt5Error(""); setMt5Status("");
    try {
      const res = await fetch("/api/connect-mt5", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify(mt5Form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur connexion");
      const { data: saved } = await supabase.from("mt5_accounts").upsert({
        user_id: user.id, metaapi_id: data.accountId,
        broker_server: mt5Form.server, login: mt5Form.login,
        name: mt5Form.name || `Compte ${mt5Form.login}`, connected: true,
      }).select().single();
      if (saved) setMt5Account(saved);
      setMt5Status("Compte connecté ! La synchronisation initiale peut prendre 2-3 minutes.");
    } catch(e) { setMt5Error(e.message); }
    setMt5Loading(false);
  };

  const syncTrades = async () => {
    if (!mt5Account) return;
    setMt5Syncing(true); setMt5Error(""); setMt5Status("");
    try {
      const res = await fetch("/api/sync-trades", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ accountId: mt5Account.metaapi_id }),
      });
      const data = await res.json();
      if (res.status === 202) { setMt5Status(data.message); setMt5Syncing(false); return; }
      if (!res.ok) throw new Error(data.error || "Erreur sync");
      if (data.trades?.length > 0 && onTradesImported) onTradesImported(data.trades);
      setMt5Status(`${data.total} trades importés avec succès.`);
    } catch(e) { setMt5Error(e.message); }
    setMt5Syncing(false);
  };

  const f = (k,v) => setMt5Form(p => ({...p, [k]:v}));
  const fieldStyle = { width:"100%", background:C.bg3, border:`1px solid ${C.border}`, borderRadius:8, padding:"11px 14px", color:C.white, fontSize:13, fontFamily:"'Josefin Sans',sans-serif", fontWeight:300, outline:"none" };

  return (
    <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:12,boxShadow:"0 4px 28px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.09), 0 -2px 24px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.32)",padding:"18px 16px",marginBottom:12}}>
      <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,marginBottom:14}}>Compte MT4 / MT5</div>

      {mt5Account ? (
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <div style={{width:8,height:8,borderRadius:4,background:"#4caf6e",flexShrink:0}}/>
            <div>
              <div style={{fontSize:13,color:C.white,fontFamily:"'Josefin Sans',sans-serif"}}>{mt5Account.name}</div>
              <div style={{fontSize:10,color:C.gray1,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.06em"}}>{mt5Account.broker_server} · #{mt5Account.login}</div>
            </div>
          </div>
          <button onClick={syncTrades} disabled={mt5Syncing} style={{width:"100%",padding:"11px",borderRadius:8,border:"none",background:mt5Syncing?"#333":C.accent,color:mt5Syncing?"#888":darkMode?"#111":"#fff",fontSize:11,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,letterSpacing:"0.15em",textTransform:"uppercase",cursor:mt5Syncing?"not-allowed":"pointer",transition:"all 0.2s"}}>
            {mt5Syncing ? "Synchronisation..." : "Synchroniser les trades →"}
          </button>
          <button onClick={()=>setMt5Account(null)} style={{width:"100%",marginTop:8,padding:"8px",borderRadius:8,border:`1px solid ${C.border}`,background:"transparent",color:C.gray2,fontSize:10,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>
            Changer de compte
          </button>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"flex",gap:6,marginBottom:4,background:C.bg3,borderRadius:8,padding:3}}>
            {["mt5","mt4"].map(p=>(
              <button key={p} onClick={()=>f("platform",p)} style={{flex:1,padding:"7px",borderRadius:6,border:"none",background:mt5Form.platform===p?C.accent:"transparent",color:mt5Form.platform===p?(darkMode?"#111":"#fff"):C.gray1,fontSize:10,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.2s"}}>
                {p.toUpperCase()}
              </button>
            ))}
          </div>
          <input placeholder="Numéro de compte (login)" value={mt5Form.login} onChange={e=>f("login",e.target.value)} style={fieldStyle}/>
          <div style={{position:"relative"}}>
            <input type={showMt5Pwd?"text":"password"} placeholder="Mot de passe investisseur" value={mt5Form.password} onChange={e=>f("password",e.target.value)} style={{...fieldStyle, paddingRight:46}}/>
            <button onClick={()=>setShowMt5Pwd(v=>!v)} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.35)",lineHeight:1,padding:0}}>
              {showMt5Pwd?(
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ):(
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
          <input placeholder="Serveur broker (ex: ICMarkets-Live)" value={mt5Form.server} onChange={e=>f("server",e.target.value)} style={fieldStyle}/>
          <input placeholder="Nom du compte (optionnel)" value={mt5Form.name} onChange={e=>f("name",e.target.value)} style={fieldStyle}/>
          <button onClick={connectMT5} disabled={mt5Loading} style={{width:"100%",padding:"12px",borderRadius:8,border:"none",background:mt5Loading?"#333":C.accent,color:mt5Loading?"#888":darkMode?"#111":"#fff",fontSize:11,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,letterSpacing:"0.15em",textTransform:"uppercase",cursor:mt5Loading?"not-allowed":"pointer",transition:"all 0.2s",marginTop:4}}>
            {mt5Loading ? "Connexion..." : "Connecter →"}
          </button>
          <div style={{fontSize:10,color:C.gray2,fontFamily:"'Josefin Sans',sans-serif",lineHeight:1.5}}>
            Utilise ton <strong style={{color:C.gray1}}>mot de passe investisseur</strong> (lecture seule) — jamais le mot de passe principal.
          </div>
        </div>
      )}

      {mt5Status && <div style={{marginTop:12,fontSize:11,color:"#4caf6e",fontFamily:"'Josefin Sans',sans-serif",lineHeight:1.5}}>{mt5Status}</div>}
      {mt5Error && <div style={{marginTop:12,fontSize:11,color:"#e05a5a",fontFamily:"'Josefin Sans',sans-serif"}}>{mt5Error}</div>}
    </div>
  );
}

/* ─── MAIN APP ───────────────────────────────────────────────────── */
export default function App() {
  const isMobile = useIsMobile();
  const [user,        setUser]        = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [trades,      setTrades]      = useState(() => load(KEYS.trades, []));
  const [extraInstr,  setExtraInstr]  = useState(() => load(KEYS.instruments, []));
  const [extraEmotions, setExtraEmotions] = useState(() => load('fyltra_emotions_v1', []));
  const [customEmotion, setCustomEmotion] = useState('');
  const [beSign, setBeSign] = useState(1);
  const [tradeMode, setTradeMode] = useState(() => localStorage.getItem("fyltra_trade_mode")||"swing");
  const [tradeFixedMode, setTradeFixedMode] = useState(() => localStorage.getItem("fyltra_trade_fixed_mode")||"variable");
  const defaultTS = { tpFixed:{enabled:false,value:""}, slFixed:{enabled:false,value:""}, rrFixed:{enabled:false,value:""}, sizeFixed:{enabled:false,value:"",unit:"contrats"} };
  const [tradeSettings, setTradeSettings] = useState(() => load("fyltra_trade_settings_v1", defaultTS));
  const [savedTS, setSavedTS] = useState(() => load("fyltra_trade_settings_v1", defaultTS));
  const [scalpFields, setScalpFields] = useState({entry:false, rr:false, emotion:false, notes:false, size:false});
  const setTS = (key, changes) => setTradeSettings(p => ({...p, [key]:{...p[key],...changes}}));
  const [tsSaved, setTsSaved] = useState(false);
  const saveTS = () => { save("fyltra_trade_settings_v1", tradeSettings); setSavedTS(tradeSettings); if (user) saveUserSettings({ trade_settings: tradeSettings }); setTsSaved(true); setTimeout(()=>setTsSaved(false),2000); };
  const toggleScalp = k => setScalpFields(p => ({...p, [k]:!p[k]}));
  const [showCustomEmotion, setShowCustomEmotion] = useState(false);
  const [strategies,  setStrategies]  = useState(() => {
    const saved = load(KEYS.strategies, null);
    if (saved && Array.isArray(saved)) return saved;
    // migrate old single strategy
    const old = load("vantage_strategy_v1", null) || load("fyltra_strat_v1", null);
    if (old) return [{ id:1, name:"Ma stratégie", description:old.description||"", steps:Array.isArray(old.steps)?old.steps:[], rules:old.rules||"", notes:old.notes||"" }];
    return [{ id:Date.now(), name:"Ma stratégie", description:"", steps:[], rules:"", notes:"" }];
  });
  const [activeStratId, setActiveStratId] = useState(null);
  const [editingStratName, setEditingStratName] = useState(false);
  const [toolTab, setToolTab] = useState("csv"); // csv | calc | eod
  const [csvText, setCsvText] = useState("");
  const [csvPlatform, setCsvPlatform] = useState("mt5");
  const [csvResult, setCsvResult] = useState(null);
  const [csvError, setCsvError] = useState("");
  const [calcEntry, setCalcEntry] = useState("");
  const [calcStop, setCalcStop] = useState("");
  const [calcRisk, setCalcRisk] = useState("");
  const [calcInstrument, setCalcInstrument] = useState("MNQ");
  const [eodLoading, setEodLoading] = useState(false);
  const [eodText, setEodText] = useState("");
  const [eodAccount, setEodAccount] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [signOutLeaving, setSignOutLeaving] = useState(false);
  const confirmSignOut = () => { setSignOutLeaving(true); setTimeout(() => { setShowSignOutConfirm(false); setSignOutLeaving(false); supabase.auth.signOut(); }, 280); };
  const cancelSignOut = () => { setSignOutLeaving(true); setTimeout(() => { setShowSignOutConfirm(false); setSignOutLeaving(false); }, 250); };
  const [currency, setCurrency] = useState(() => localStorage.getItem("fyltra_currency")||"€");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("fyltra_dark")==="true");
  C = darkMode ? DARK_THEME : LIGHT_THEME; // Dynamic theme
  const [acctView, setAcctView] = useState("today");
  const [tabKey, setTabKey] = useState(0); // "today" | "global"
  const [lang, setLang] = useState(() => localStorage.getItem("fyltra_lang")||"fr");
  const [menuClosing, setMenuClosing] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null); // {date, trades, pnl}
  const [dayClosing, setDayClosing] = useState(false);
  const closeMenu = () => { setMenuClosing(true); setTimeout(()=>{setShowMenu(false);setMenuClosing(false);},240); };
  const closeDay = () => { setDayClosing(true); setTimeout(()=>{setSelectedDay(null);setDayClosing(false);},220); };
  const [calcMode, setCalcMode] = useState("futures");
  const [calcCustomPair, setCalcCustomPair] = useState("");
  const [pfPctMode, setPfPctMode] = useState(false);
  const [pfPctValues, setPfPctValues] = useState({target:"",maxLoss:"",dailyLoss:""});
  const [capital,     setCapital]     = useState(() => load(KEYS.capital, ""));
  const [propfirms,   setPropfirms]   = useState(() => load(KEYS.propfirms, []));
  const [pfView,      setPfView]      = useState("list"); // list | add-type | add-propfirm | add-personal
  const [pfForm,      setPfForm]      = useState({ type:"propfirm", name:"", firm:"", capital:"", target:"", dailyLoss:"", maxLoss:"", consistency:"", consistencyPct:"", hasDailyLoss:false, hasConsistency:false });
  const [activePf,    setActivePf]    = useState(null);
  const [chartAccountId, setChartAccountId] = useState("all");
  const [editingPf, setEditingPf] = useState(null);
  const [selectedPf, setSelectedPf] = useState(null);
  const [confirmDeletePf, setConfirmDeletePf] = useState(false);
  const [accountLeaving, setAccountLeaving] = useState(false);
  const closeAccount = () => { setAccountLeaving(true); setTimeout(()=>{ setSelectedPf(null); setConfirmDeletePf(false); setAccountLeaving(false); setAcctView("today"); }, 260); }; // null = list, pf = detail
  const [acctCustomizing, setAcctCustomizing] = useState(false);
  const [acctLayout, setAcctLayout] = useState(() => load('fyltra_layout_v1', ['progress','today','stats','calendar','trades']));
  const [acctDragOver, setAcctDragOver] = useState(null);
  const [view,        setView]        = useState("propfirm");
  const [aiText,      setAiText]      = useState("");
  const [aiLoading,   setAiLoading]   = useState(false);
  const [aiError,     setAiError]     = useState("");
  const [coachInstructions, setCoachInstructions] = useState(() => localStorage.getItem("fyltra_coach_instr") || "");
  const [saved,       setSaved]       = useState(false);
  const [stratSaved,  setStratSaved]  = useState(false);
  const [pnlRaw,      setPnlRaw]      = useState("");
  const [customInstr, setCustomInstr] = useState("");
  const [showCustom,  setShowCustom]  = useState(false);
  const [editingTrade,setEditingTrade]= useState(null);
  const [editPnlRaw,  setEditPnlRaw]  = useState("");
  // Calendar navigation — replace period filter
  const now0 = new Date();
  const [calMonth, setCalMonth] = useState(now0.getMonth());
  const [pfCalMonth, setPfCalMonth] = useState(now0.getMonth());
  const [calYear,  setCalYear]  = useState(now0.getFullYear());
  const [pfCalYear,  setPfCalYear]  = useState(now0.getFullYear());
  const [form, setForm] = useState({ date:new Date().toISOString().split("T")[0], time:new Date().toTimeString().slice(0,5), instrument:"MNQ", direction:"LONG", result:"WIN", session:"New York", emotion:"Neutre", entry:"", exit:"", rr:"", size:"", sizeUnit:"contrats", notes:"", accountIds:[], strategyId:null });

  const instruments = [...BASE_INSTRUMENTS, ...extraInstr, "Autre"];
  const availableYears = Array.from({ length:now0.getFullYear() - 2019 }, (_, i) => now0.getFullYear() - i);

  // ── Supabase helpers ──
  const dbToTrade = r => ({
    id:r.id, date:r.date, instrument:r.instrument, direction:r.direction,
    result:r.result, pnl:r.pnl, session:r.session, emotion:r.emotion,
    notes:r.notes, tags:r.tags||[], rr:r.rr, tradeMode:r.trade_mode,
    size:r.size, entry:r.entry, exit:r.exit, sizeUnit:r.size_unit,
    accountIds:(r.account_ids||[]).map(Number), strategyId:r.strategy_id ? Number(r.strategy_id) : null,
  });
  const tradeToDb = t => ({
    user_id:user.id, date:t.date, instrument:t.instrument, direction:t.direction,
    result:t.result, pnl:t.pnl, session:t.session, emotion:t.emotion,
    notes:t.notes||"", tags:t.tags||[], rr:t.rr?parseFloat(t.rr):null,
    trade_mode:t.tradeMode||tradeMode, size:t.size?parseFloat(t.size):null,
    entry:t.entry||null, exit:t.exit||null, size_unit:t.sizeUnit||null,
    account_ids:t.accountIds||[], strategy_id:t.strategyId||null,
  });

  // ── Auth ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data:{ session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data:{ subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Load trades + settings from DB when user logs in ──
  useEffect(() => {
    if (!user) return;
    supabase.from("trades").select("*").eq("user_id", user.id).order("created_at", { ascending:false })
      .then(({ data }) => { if (data) setTrades(data.map(dbToTrade)); });
    supabase.from("user_settings").select("*").eq("user_id", user.id).single()
      .then(({ data }) => {
        if (!data) return;
        if (data.propfirms) setPropfirms(data.propfirms);
        if (data.strategies) setStrategies(data.strategies);
        if (data.capital !== undefined && data.capital !== null) setCapital(data.capital);
        if (data.extra_instruments) setExtraInstr(data.extra_instruments);
        if (data.dark_mode !== undefined && data.dark_mode !== null) setDarkMode(data.dark_mode);
        if (data.currency) setCurrency(data.currency);
        if (data.lang) setLang(data.lang);
        if (data.acct_layout) setAcctLayout(data.acct_layout);
        if (data.extra_emotions) setExtraEmotions(data.extra_emotions);
        if (data.trade_settings) { setSavedTS(data.trade_settings); setTradeSettings(data.trade_settings); }
        if (data.coach_instructions) setCoachInstructions(data.coach_instructions);
        if (data.trade_mode) setTradeMode(data.trade_mode);
        if (data.trade_fixed_mode) setTradeFixedMode(data.trade_fixed_mode);
      });
  }, [user]);

  const saveUserSettings = async (patch) => {
    if (!user) return;
    await supabase.from("user_settings").upsert({ user_id: user.id, ...patch, updated_at: new Date().toISOString() });
  };

  useEffect(() => { if (!user) save(KEYS.trades, trades); }, [trades]);
  useEffect(() => { save(KEYS.instruments, extraInstr); if (user) saveUserSettings({ extra_instruments: extraInstr }); }, [extraInstr]);
  useEffect(() => { save('fyltra_emotions_v1', extraEmotions); if (user) saveUserSettings({ extra_emotions: extraEmotions }); }, [extraEmotions]);
  useEffect(() => { save(KEYS.strategies, strategies); if (user) saveUserSettings({ strategies }); }, [strategies]);
  useEffect(() => { save(KEYS.capital, capital); if (user) saveUserSettings({ capital }); }, [capital]);
  useEffect(() => { save(KEYS.propfirms, propfirms); if (user) saveUserSettings({ propfirms }); }, [propfirms]);
  useEffect(() => { localStorage.setItem("fyltra_currency", currency); if (user) saveUserSettings({ currency }); }, [currency]);
  useEffect(() => { localStorage.setItem("fyltra_dark", darkMode); document.documentElement.style.setProperty("--bg", darkMode?"#0f0f0f":"#f8f7f5"); document.body.style.background = darkMode?"#0f0f0f":"#f8f7f5"; document.body.style.color = darkMode?"#f0ede8":"#1a1a1a"; C = darkMode ? DARK_THEME : LIGHT_THEME; if (user) saveUserSettings({ dark_mode: darkMode }); }, [darkMode]);
  useEffect(() => { localStorage.setItem("fyltra_lang", lang); if (user) saveUserSettings({ lang }); }, [lang]);
  useEffect(() => { save('fyltra_layout_v1', acctLayout); if (user) saveUserSettings({ acct_layout: acctLayout }); }, [acctLayout]);
  useEffect(() => { localStorage.setItem("fyltra_trade_mode", tradeMode); if (user) saveUserSettings({ trade_mode: tradeMode }); }, [tradeMode]);
  useEffect(() => { localStorage.setItem("fyltra_trade_fixed_mode", tradeFixedMode); if (user) saveUserSettings({ trade_fixed_mode: tradeFixedMode }); }, [tradeFixedMode]);

  const set = (k, v) => setForm(f => ({ ...f, [k]:v }));
  // Scroll to top on view change
  useEffect(() => { window.scrollTo(0,0); if (view !== "settings") setTradeSettings(savedTS); }, [view, selectedPf]);
  // Pre-fill fixed values when switching to add view
  useEffect(() => {
    if (view === "add") {
      setPnlRaw("");
      setForm(f => ({ ...f, entry:"", exit:"", rr:"", size:"", notes:"", accountIds: selectedPf ? [selectedPf.id] : [], strategyId:null }));
    }
  }, [view]);

  const handleInstrument = v => {
    if (v === "Autre") { setShowCustom(true); set("instrument", "Autre"); }
    else { setShowCustom(false); set("instrument", v); }
  };

  const saveCustomInstr = () => {
    const n = customInstr.trim().toUpperCase();
    if (!n) return;
    if (!extraInstr.includes(n)) setExtraInstr(p => [...p, n]);
    set("instrument", n); setShowCustom(false); setCustomInstr("");
  };

  const computedPnl = () => {
    if (tradeFixedMode === "fixe") {
      if (form.result === "WIN")  return savedTS.tpFixed.enabled && savedTS.tpFixed.value ? parseFloat(savedTS.tpFixed.value) : 0;
      if (form.result === "LOSS") return savedTS.slFixed.enabled && savedTS.slFixed.value ? -Math.abs(parseFloat(savedTS.slFixed.value)) : 0;
      return 0;
    }
    const a = parseFloat(pnlRaw);
    if (isNaN(a) || pnlRaw === "") return null;
    if (form.result === "LOSS") return -Math.abs(a);
    if (form.result === "BREAKEVEN") return pnlRaw ? beSign * (parseFloat(pnlRaw) || 0) : 0;
    return Math.abs(a);
  };

  const addTrade = async () => {
    const p = computedPnl();
    if (p === null) return;
    let newTrade;
    if (tradeFixedMode === "fixe") {
      const tp  = savedTS.tpFixed.enabled && savedTS.tpFixed.value ? parseFloat(savedTS.tpFixed.value) : null;
      const sl  = savedTS.slFixed.enabled && savedTS.slFixed.value ? Math.abs(parseFloat(savedTS.slFixed.value)) : null;
      const rr  = savedTS.rrFixed.enabled && savedTS.rrFixed.value ? savedTS.rrFixed.value : form.rr;
      const sz  = savedTS.sizeFixed.enabled && savedTS.sizeFixed.value ? savedTS.sizeFixed.value : form.size;
      const szu = savedTS.sizeFixed.enabled && savedTS.sizeFixed.value ? savedTS.sizeFixed.unit : form.sizeUnit;
      const pnl = form.result === "WIN" ? ((tp ?? 0) || parseFloat(pnlRaw) || 0)
                : form.result === "LOSS" ? -((sl ?? 0) || parseFloat(pnlRaw) || 0)
                : 0;
      newTrade = { ...form, pnl, rr, size:sz, sizeUnit:szu };
    } else {
      newTrade = { ...form, pnl:p };
    }
    if (user) {
      const { data, error } = await supabase.from("trades").insert(tradeToDb(newTrade)).select().single();
      if (error) { console.error("Supabase insert error:", error); return; }
      if (data) setTrades(prev => [dbToTrade(data), ...prev]);
    } else {
      setTrades(prev => [{ ...newTrade, id:Date.now() }, ...prev]);
    }
    setPnlRaw(""); setForm(f => ({ ...f, entry:"", exit:"", rr:"", size:"", notes:"", accountIds:[], strategyId:null }));
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const deleteTrade = async (id) => {
    if (user) await supabase.from("trades").delete().eq("id", id);
    setTrades(p => p.filter(t => t.id !== id));
  };
  const updateTrade = (id, ch) => setTrades(p => p.map(t => t.id === id ? { ...t, ...ch } : t));
  const startEdit = t => { setEditingTrade({ ...t }); setEditPnlRaw(String(Math.abs(t.pnl || 0))); };
  const cancelEdit = () => { setEditingTrade(null); setEditPnlRaw(""); };
  const saveEdit = async () => {
    if (!editingTrade) return;
    const a = parseFloat(editPnlRaw);
    const p = isNaN(a) ? editingTrade.pnl : (editingTrade.result === "LOSS" ? -Math.abs(a) : editingTrade.result === "BREAKEVEN" ? 0 : Math.abs(a));
    const updated = { ...editingTrade, pnl:p };
    if (user) await supabase.from("trades").update(tradeToDb(updated)).eq("id", editingTrade.id);
    updateTrade(editingTrade.id, updated);
    setEditingTrade(null); setEditPnlRaw("");
  };



  // Both stats and calendar filter by selected month
  const filterByPeriod = list => list.filter(t => {
    const d = new Date(t.date + "T12:00:00");
    return d.getFullYear() === calYear && d.getMonth() === calMonth;
  });
  const calFiltered = filterByPeriod(trades);

  const prevMonth = () => { if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else{setCalMonth(m=>m-1);} };
  const prevPfMonth = () => { if(pfCalMonth===0){setPfCalMonth(11);setPfCalYear(y=>y-1);}else{setPfCalMonth(m=>m-1);} };
  const nextPfMonth = () => {
    const now=new Date();
    if(pfCalYear>now.getFullYear()||(pfCalYear===now.getFullYear()&&pfCalMonth>=now.getMonth())) return;
    if(pfCalMonth===11){setPfCalMonth(0);setPfCalYear(y=>y+1);}else{setPfCalMonth(m=>m+1);}
  };
  const nextMonth = () => {
    const now = new Date();
    if (calYear > now.getFullYear() || (calYear === now.getFullYear() && calMonth >= now.getMonth())) return;
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else { setCalMonth(m => m + 1); }
  };

  const filtered  = filterByPeriod(trades);
  const total     = filtered.length;
  const wins      = filtered.filter(t => t.result === "WIN").length;
  const pnlSum    = filtered.reduce((s, t) => s + (t.pnl || 0), 0);
  const winRate   = total ? Math.round((wins / total) * 100) : 0;
  const avgRR     = total ? (filtered.reduce((s, t) => s + (parseFloat(t.rr) || 0), 0) / total).toFixed(1) : "—";
  const sessionStats = SESSIONS.map(s => { const st = filtered.filter(t => t.session === s); const wr = st.length ? Math.round((st.filter(t => t.result === "WIN").length / st.length) * 100) : 0; return { name:s, count:st.length, wr, pnl:st.reduce((a, t) => a + (t.pnl || 0), 0) }; }).filter(s => s.count > 0);

  // ── Discipline Score (0-100) ──
  const calcDisciplineScore = () => {
    const recent = [...trades].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 20);
    if (!recent.length) return null;
    let score = 100;
    // Pénalité émotions négatives
    const badEmotions = recent.filter(t => ["Anxieux","Euphorique","Frustré"].includes(t.emotion));
    score -= (badEmotions.length / recent.length) * 25;
    // Bonus notes remplies
    const withNotes = recent.filter(t => t.notes && t.notes.length > 5);
    score += (withNotes.length / recent.length) * 10;
    // Pénalité si trop de trades par jour
    const byDate = {};
    recent.forEach(t => { byDate[t.date] = (byDate[t.date]||0)+1; });
    const overtraded = Object.values(byDate).filter(n => n > 2).length;
    score -= overtraded * 8;
    // Bonus win rate > 50%
    const wr = recent.filter(t => t.result==="WIN").length / recent.length;
    if (wr >= 0.5) score += 10;
    // Bonus RR rempli
    const withRR = recent.filter(t => parseFloat(t.rr) >= 1);
    score += (withRR.length / recent.length) * 5;
    return Math.max(0, Math.min(100, Math.round(score)));
  };
  const disciplineScore = calcDisciplineScore();

  const buildPatternData = () => {
    const DAYS = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
    const group = (keyFn) => {
      const m = {};
      trades.forEach(t => {
        const k = keyFn(t); if (!k) return;
        if (!m[k]) m[k] = { pnl:0, count:0, wins:0 };
        m[k].pnl += t.pnl || 0; m[k].count++;
        if (t.result === "WIN") m[k].wins++;
      });
      return m;
    };
    const fmt = (m) => Object.entries(m)
      .sort((a,b) => b[1].pnl - a[1].pnl)
      .map(([k,v]) => `  ${k}: ${v.count} trades | WR ${v.count ? Math.round(v.wins/v.count*100) : 0}% | P&L ${v.pnl >= 0 ? "+" : ""}${v.pnl.toFixed(0)}${currency}`)
      .join("\n");

    const byDay     = group(t => DAYS[new Date(t.date+"T12:00:00").getDay()]);
    const bySession = group(t => t.session);
    const byEmotion = group(t => t.emotion);
    const byInstr   = group(t => t.instrument);
    const byDir     = group(t => t.direction);

    const winners = trades.filter(t => t.result === "WIN" && parseFloat(t.rr) > 0);
    const avgWinRR = winners.length ? (winners.reduce((s,t) => s + (parseFloat(t.rr)||0), 0) / winners.length).toFixed(2) : null;
    const cutWinners = winners.filter(t => parseFloat(t.rr) < 1).length;
    const losers = trades.filter(t => t.result === "LOSS" && parseFloat(t.rr) > 0);
    const avgLossRR = losers.length ? (losers.reduce((s,t) => s + (parseFloat(t.rr)||0), 0) / losers.length).toFixed(2) : null;

    const sorted = [...trades].sort((a,b) => a.date.localeCompare(b.date));
    let maxLoseStreak = 0, curLoseStreak = 0, maxWinStreak = 0, curWinStreak = 0;
    sorted.forEach(t => {
      if (t.result === "LOSS") { curLoseStreak++; maxLoseStreak = Math.max(maxLoseStreak, curLoseStreak); curWinStreak = 0; }
      else if (t.result === "WIN") { curWinStreak++; maxWinStreak = Math.max(maxWinStreak, curWinStreak); curLoseStreak = 0; }
      else { curLoseStreak = 0; curWinStreak = 0; }
    });

    const recentTrades = [...trades].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 40).reverse()
      .map(t => `${t.date}|${t.instrument}|${t.direction}|${t.session||"—"}|${t.emotion||"—"}|RR:${t.rr||"—"}|${t.pnl >= 0 ? "+" : ""}${(t.pnl||0).toFixed(0)}${currency}|${t.result}`)
      .join("\n");

    return `📅 PAR JOUR DE LA SEMAINE:
${fmt(byDay)}

⏰ PAR SESSION:
${fmt(bySession)}

🧠 PAR ÉMOTION:
${fmt(byEmotion)}

📊 PAR INSTRUMENT:
${fmt(byInstr)}

↕️ PAR DIRECTION:
${fmt(byDir)}

✂️ ANALYSE WINNERS (${winners.length} trades gagnants avec RR):
  RR moyen winners: ${avgWinRR || "—"}
  RR moyen losers: ${avgLossRR || "—"}
  Winners fermés avant 1:1 RR: ${cutWinners}/${winners.length}${winners.length ? ` (${Math.round(cutWinners/winners.length*100)}%)` : ""}

📉 SÉRIES: max ${maxLoseStreak} pertes consécutives | max ${maxWinStreak} gains consécutifs

DERNIERS 40 TRADES (date|instrument|direction|session|émotion|RR|P&L|résultat):
${recentTrades}`;
  };

  const analyzeAI = async () => {
    if (trades.length < 3) { setAiText("Ajoute au moins 3 trades pour obtenir une analyse."); return; }
    setAiLoading(true); setAiText(""); setAiError("");
    const patternData = buildPatternData();
    const strat = strategies[0] || {};
    const stratCtx = [strat.description && "Description: " + strat.description, strat.steps && strat.steps.length > 0 && "Étapes: " + strat.steps.map((s,i) => `${i+1}. ${s}`).join("\n"), strat.rules && "Règles: " + strat.rules, strat.notes && "Notes: " + strat.notes].filter(Boolean).join("\n");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patternData, stratCtx, tradeCount: trades.length, coachInstructions }),
      });
      const data = await res.json();
      if (!res.ok) { setAiError(data.error || "Erreur inconnue"); setAiLoading(false); return; }
      if (data.text) setAiText(data.text); else setAiError("Réponse vide. Réessaie.");
    } catch (e) { setAiError(`Erreur réseau: ${e.message}`); }
    setAiLoading(false);
  };


  // ── Dashboard JSX ──
  const dashboardContent = (desktop) => (
    <div>
      {!desktop && <PageTitle sub="Tableau de bord" title={total === 0 ? "Aucun trade" : "Performance"} />}
      <div style={{ display:"grid", gridTemplateColumns:desktop ? "repeat(4,1fr)" : "1fr 1fr", gap:10, marginBottom:20 }}>
        <StatCard label="Win Rate"  value={`${winRate}%`}                              color={winRate >= 50 ? C.accent : C.gray1} small={desktop} />
        <StatCard label="P&L Total" value={`${pnlSum >= 0 ? "+" : ""}${pnlSum.toFixed(0)}${currency}`} color={pnlSum >= 0 ? C.accent : C.gray1} small={desktop} />
        <StatCard label="RR Moyen"  value={`${avgRR}:1`}                               color={C.dim}   small={desktop} />
        <StatCard label="Bilan" value={`${wins}W / ${total - wins}L`} color={C.accent} small={desktop} />
      </div>

      {desktop ? (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
          <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:10, boxShadow:"0 4px 28px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.09), 0 -2px 24px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.32)", padding:"16px 14px 10px" }}>
            <div style={{ marginBottom:8 }}>
              <div style={{ fontSize:10, color:C.dim, letterSpacing:"0.2em", textTransform:"uppercase", fontFamily:"'Josefin Sans',sans-serif", fontWeight:600 }}>Évolution P&L</div>
            </div>
            {propfirms.length > 0 && (
              <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:10 }}>
                <button onClick={() => setChartAccountId("all")} style={{ padding:"4px 10px", borderRadius:4, border:"none", background:chartAccountId==="all" ? C.accent : C.bg3, color:chartAccountId==="all" ? "#fff" : C.gray1, fontSize:10, fontFamily:"'Josefin Sans',sans-serif", fontWeight:chartAccountId==="all" ? 600 : 300, letterSpacing:"0.08em", cursor:"pointer" }}>Tous</button>
                {propfirms.map(pf => (
                  <button key={pf.id} onClick={() => setChartAccountId(pf.id)} style={{ padding:"4px 10px", borderRadius:4, border:"none", background:chartAccountId===pf.id ? C.accent : C.bg3, color:chartAccountId===pf.id ? "#fff" : C.gray1, fontSize:10, fontFamily:"'Josefin Sans',sans-serif", fontWeight:chartAccountId===pf.id ? 600 : 300, letterSpacing:"0.08em", cursor:"pointer" }}>
                    {pf.firm}{pf.name ? " · " + pf.name : ""}
                  </button>
                ))}
              </div>
            )}
            <PnlChart filtered={chartAccountId==="all" ? filtered : filtered.filter(t => !t.accountIds || t.accountIds.length===0 || t.accountIds.includes(chartAccountId))} capital={capital} pnlSum={pnlSum} height={160} cur={currency}/>
            {filtered.length < 2 && <div style={{ textAlign:"center", padding:"32px 0", color:C.gray2, fontSize:11, fontFamily:"'Josefin Sans',sans-serif", letterSpacing:"0.1em" }}>Aucun trade ce mois</div>}
          </div>
          <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:10, boxShadow:"0 4px 28px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.09), 0 -2px 24px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.32)", padding:"16px 14px" }}>
            <Calendar filtered={calFiltered} calMonth={calMonth} calYear={calYear} onPrev={prevMonth} onNext={nextMonth} />
          </div>
        </div>
      ) : (
        <div>
          <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:10, boxShadow:"0 4px 28px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.09), 0 -2px 24px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.32)", padding:"16px 14px 10px", marginBottom:14 }}>
              <div style={{ marginBottom:8 }}>
                <div style={{ fontSize:10, color:C.dim, letterSpacing:"0.2em", textTransform:"uppercase", fontFamily:"'Josefin Sans',sans-serif", fontWeight:600 }}>Évolution P&L</div>
              </div>
              {propfirms.length > 0 && (
                <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:10 }}>
                  <button onClick={() => setChartAccountId("all")} style={{ padding:"4px 10px", borderRadius:4, border:"none", background:chartAccountId==="all" ? C.accent : C.bg3, color:chartAccountId==="all" ? "#fff" : C.gray1, fontSize:10, fontFamily:"'Josefin Sans',sans-serif", fontWeight:chartAccountId==="all" ? 600 : 300, letterSpacing:"0.08em", cursor:"pointer" }}>Tous</button>
                  {propfirms.map(pf => (
                    <button key={pf.id} onClick={() => setChartAccountId(pf.id)} style={{ padding:"4px 10px", borderRadius:4, border:"none", background:chartAccountId===pf.id ? C.accent : C.bg3, color:chartAccountId===pf.id ? "#fff" : C.gray1, fontSize:10, fontFamily:"'Josefin Sans',sans-serif", fontWeight:chartAccountId===pf.id ? 600 : 300, letterSpacing:"0.08em", cursor:"pointer" }}>
                      {pf.firm}{pf.name ? " · " + pf.name : ""}
                    </button>
                  ))}
                </div>
              )}
              {filtered.length > 1 ? <PnlChart filtered={chartAccountId==="all" ? filtered : filtered.filter(t => !t.accountIds || t.accountIds.length===0 || t.accountIds.includes(chartAccountId))} capital={capital} pnlSum={pnlSum} height={150} cur={currency}/> : <div style={{ textAlign:"center", padding:"32px 0", color:C.gray2, fontSize:11, fontFamily:"'Josefin Sans',sans-serif", letterSpacing:"0.1em" }}>Aucun trade ce mois</div>}
            </div>
          <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:10, boxShadow:"0 4px 28px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.09), 0 -2px 24px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.32)", padding:"16px 14px", marginBottom:14 }}>
              <Calendar filtered={calFiltered} calMonth={calMonth} calYear={calYear} onPrev={prevMonth} onNext={nextMonth} />
            </div>
        </div>
      )}

      {sessionStats.length > 0 && (
        <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:10, boxShadow:"0 4px 28px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.09), 0 -2px 24px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.32)", padding:18 }}>
          <div style={{ fontSize:10, color:C.dim, letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:14, fontFamily:"'Josefin Sans',sans-serif", fontWeight:600 }}>Performance par Session</div>
          {sessionStats.map(s => (
            <div key={s.name} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ fontSize:11, color:C.white, letterSpacing:"0.06em", textTransform:"uppercase", fontFamily:"'Josefin Sans',sans-serif" }}>{s.name}</span>
                <span style={{ fontSize:12, fontFamily:"'Josefin Sans',sans-serif", fontWeight:300, color:s.pnl >= 0 ? C.accent : C.gray1, letterSpacing:"0.03em" }}>{s.pnl >= 0 ? "+" : ""}{s.pnl.toFixed(0)}{currency} · {s.wr}%</span>
              </div>
              <div style={{ height:3, background:C.gray3, borderRadius:2 }}>
                <div style={{ width:`${s.wr}%`, height:"100%", borderRadius:2, background:C.accent, transition:"width 0.7s" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {trades.length === 0 && (
        <div style={{ textAlign:"center", padding:"48px 0" }}>
          <div style={{ fontSize:44, marginBottom:12, color:C.gray2 }}>◎</div>
          <div style={{ fontFamily:"'Josefin Sans',sans-serif", fontSize:16, fontWeight:300, color:C.gray1, marginBottom:14, letterSpacing:"0.06em" }}>Commencez à enregistrer vos trades</div>
          <button onClick={() => setView("add")} style={{ background:"radial-gradient(ellipse 90% 90% at 50% 38%, rgba(245,245,245,0.95) 0%, rgba(215,215,215,0.88) 55%, rgba(230,230,230,0.92) 100%)", border:"none", borderRadius:12, padding:"11px 24px", color:darkMode?"#111":"#fff", fontSize:11, fontFamily:"'Josefin Sans',sans-serif", fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", cursor:"pointer" }}>+ Premier trade</button>
        </div>
      )}
    </div>
  );

  // ── Add Trade JSX ──
  const addTradeContent = (
    <div>
      <PageTitle sub="Enregistrer" title="Nouveau Trade" />

      {/* ── MODE SWITCH ── */}
      <div style={{display:"flex",gap:8,marginBottom:20,padding:5,background:darkMode?"linear-gradient(180deg,rgba(85,85,85,0.98) 0%,rgba(28,28,28,0.99) 100%)":"linear-gradient(180deg,rgba(60,60,60,0.95) 0%,rgba(18,18,18,0.97) 100%)",borderRadius:16,border:darkMode?"1px solid rgba(255,255,255,0.18)":"1px solid rgba(255,255,255,0.14)",boxShadow:darkMode?"0 12px 40px rgba(0,0,0,0.75), 0 4px 10px rgba(0,0,0,0.5), 0 0 50px rgba(255,255,255,0.1), 0 0 0 1px rgba(255,255,255,0.12), inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -2px 0 rgba(0,0,0,0.75)":"0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -2px 0 rgba(0,0,0,0.55)"}}>
        {[
          {k:"swing", label:"Swing / Day"},
          {k:"scalping", label:"Scalping"},
        ].map(m => (
          <button key={m.k} onClick={()=>setTradeMode(m.k)} style={{flex:1,padding:"10px 12px",borderRadius:11,border:"none",background:tradeMode===m.k?"radial-gradient(ellipse 90% 90% at 50% 50%, rgba(252,252,252,0.96) 0%, rgba(218,218,218,0.88) 55%, rgba(235,235,235,0.92) 100%)":"transparent",color:tradeMode===m.k?"#111":"rgba(255,255,255,0.55)",fontSize:11,fontFamily:"'Josefin Sans',sans-serif",fontWeight:tradeMode===m.k?600:300,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.22s cubic-bezier(.4,0,.2,1)",position:"relative",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:tradeMode===m.k?"0 6px 20px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.12)":"none",transform:"translateY(0)"}}>
            {m.label}
            {m.k==="scalping" && tradeMode==="scalping" && (
              <span style={{background:"linear-gradient(135deg,rgba(210,180,120,0.2),rgba(210,180,120,0.06))",border:"1px solid rgba(210,180,120,0.3)",color:"rgba(210,180,120,0.9)",fontSize:7,fontFamily:"'Josefin Sans',sans-serif",fontWeight:300,letterSpacing:"0.2em",padding:"2px 7px",borderRadius:4,textTransform:"uppercase",whiteSpace:"nowrap"}}>Saisie rapide</span>
            )}
            {m.k==="scalping" && tradeMode!=="scalping" && (
              <span style={{background:"rgba(210,180,120,0.12)",border:"1px solid rgba(210,180,120,0.35)",color:"rgba(210,180,120,0.8)",fontSize:7,fontFamily:"'Josefin Sans',sans-serif",fontWeight:400,letterSpacing:"0.18em",padding:"2px 8px",borderRadius:4,textTransform:"uppercase",whiteSpace:"nowrap"}}>Saisie rapide</span>
            )}
          </button>
        ))}
      </div>

      <div style={{display:"flex",gap:8}}>
        <Field label="Date"><DatePicker value={form.date} onChange={v => set("date", v)} /></Field>
        <Field label="Heure"><TimePicker value={form.time||""} onChange={v => set("time", v)} /></Field>
      </div>
      <Field label="Instrument">
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          {instruments.map(o => <Chip key={o} label={o} active={form.instrument === o && !(o === "Autre" && showCustom) || (o === "Autre" && showCustom)} onClick={() => handleInstrument(o)} />)}
        </div>
        {showCustom && (
          <div style={{ marginTop:8, display:"flex", gap:8 }}>
            <input type="text" placeholder="Nom de l'actif" value={customInstr} onChange={e => setCustomInstr(e.target.value)} onKeyDown={e => e.key === "Enter" && saveCustomInstr()} style={{ ...iStyle, flex:1, fontSize:14 }} autoFocus />
            <button onClick={saveCustomInstr} style={{ background:C.accent, border:"none", borderRadius:6, padding:"0 14px", color:darkMode?"#111":"#fff", fontSize:11, fontFamily:"'Josefin Sans',sans-serif", fontWeight:600, cursor:"pointer", textTransform:"uppercase", flexShrink:0 }}>OK</button>
          </div>
        )}
        {extraInstr.length > 0 && !showCustom && <div style={{ marginTop:6, fontSize:10, color:C.gray2, fontFamily:"'Josefin Sans',sans-serif" }}>Mémorisés: {extraInstr.join(", ")}</div>}
      </Field>
      <Divider />
      <Field label="Direction"><ChipGroup options={["LONG","SHORT"]} value={form.direction} onChange={v => set("direction", v)} /></Field>
      <Field label="Résultat"><ChipGroup options={["WIN","LOSS","BREAKEVEN"]} value={form.result} onChange={v => { set("result", v); setBeSign(1); if (v === "BREAKEVEN") setTradeFixedMode("variable"); }} /></Field>
      <Divider />
      <Field label="Session"><ChipGroup options={SESSIONS} value={form.session} onChange={v => set("session", v)} /></Field>
      {(tradeMode==="swing" || scalpFields.emotion) && (
        <Field label="État émotionnel">
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            {[...EMOTIONS, ...extraEmotions].map(e => (
              <Chip key={e} label={e} active={form.emotion===e} onClick={()=>set("emotion",e)}/>
            ))}
            <Chip label="+ Autre" active={showCustomEmotion} onClick={()=>setShowCustomEmotion(v=>!v)}/>
          </div>
          {showCustomEmotion && (
            <div style={{display:"flex",gap:8,marginTop:8}}>
              <input type="text" placeholder="ex: Déterminé" value={customEmotion} onChange={e=>setCustomEmotion(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&customEmotion.trim()){setExtraEmotions(p=>[...p,customEmotion.trim()]);set("emotion",customEmotion.trim());setCustomEmotion('');setShowCustomEmotion(false);}}} style={{...iStyle,flex:1,fontSize:13}} autoFocus/>
              <button onClick={()=>{if(customEmotion.trim()){setExtraEmotions(p=>[...p,customEmotion.trim()]);set("emotion",customEmotion.trim());setCustomEmotion('');setShowCustomEmotion(false);}}} style={{background:C.accent,border:"none",borderRadius:6,padding:"0 14px",color:darkMode?"#111":"#fff",fontSize:11,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,cursor:"pointer"}}>OK</button>
            </div>
          )}
        </Field>
      )}
      {/* ── VARIABLE / FIXE SWITCH — after emotion ── */}
      <div style={{display:"flex",gap:6,margin:"14px 0",padding:4,background:darkMode?"linear-gradient(180deg,rgba(85,85,85,0.98) 0%,rgba(28,28,28,0.99) 100%)":"linear-gradient(180deg,rgba(60,60,60,0.95) 0%,rgba(18,18,18,0.97) 100%)",borderRadius:14,border:darkMode?"1px solid rgba(255,255,255,0.18)":"1px solid rgba(255,255,255,0.14)",boxShadow:darkMode?"0 12px 40px rgba(0,0,0,0.75), 0 4px 10px rgba(0,0,0,0.5), 0 0 50px rgba(255,255,255,0.1), 0 0 0 1px rgba(255,255,255,0.12), inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -2px 0 rgba(0,0,0,0.75)":"0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -2px 0 rgba(0,0,0,0.55)"}}>
        {[{k:"variable",l:"Variable"},{k:"fixe",l:"Fixe"}].map(opt=>(
          <button key={opt.k} onClick={()=>setTradeFixedMode(opt.k)} style={{flex:1,padding:"8px",borderRadius:10,border:"none",background:tradeFixedMode===opt.k?"radial-gradient(ellipse 90% 90% at 50% 50%, rgba(252,252,252,0.96) 0%, rgba(218,218,218,0.88) 55%, rgba(235,235,235,0.92) 100%)":"transparent",color:tradeFixedMode===opt.k?"#111":"rgba(255,255,255,0.55)",fontSize:11,fontFamily:"'Josefin Sans',sans-serif",fontWeight:tradeFixedMode===opt.k?600:300,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.22s cubic-bezier(.4,0,.2,1)",boxShadow:tradeFixedMode===opt.k?"0 6px 20px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.12)":"none",transform:"translateY(0)"}}>
            {opt.l}
          </button>
        ))}
      </div>
      {tradeFixedMode==="fixe" && (
        <div style={{marginBottom:14,padding:"12px 14px",borderRadius:8,background:C.bg2,border:`1px solid ${C.border}`}}>
          <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",marginBottom:8}}>Valeurs fixes appliquées</div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {savedTS.tpFixed.enabled&&savedTS.tpFixed.value&&<div style={{fontSize:11,fontFamily:"'Josefin Sans',sans-serif"}}><span style={{color:C.dim}}>WIN : </span><strong style={{color:"#2a6e3a"}}>+{savedTS.tpFixed.value}{currency}</strong></div>}
            {savedTS.slFixed.enabled&&savedTS.slFixed.value&&<div style={{fontSize:11,fontFamily:"'Josefin Sans',sans-serif"}}><span style={{color:C.dim}}>LOSS : </span><strong style={{color:"#c0392b"}}>-{savedTS.slFixed.value}{currency}</strong></div>}
            {savedTS.rrFixed.enabled&&savedTS.rrFixed.value&&<div style={{fontSize:11,fontFamily:"'Josefin Sans',sans-serif"}}><span style={{color:C.dim}}>R/R : </span><strong style={{color:C.white}}>{savedTS.rrFixed.value}:1</strong></div>}
            {savedTS.sizeFixed.enabled&&savedTS.sizeFixed.value&&<div style={{fontSize:11,fontFamily:"'Josefin Sans',sans-serif"}}><span style={{color:C.dim}}>Taille : </span><strong style={{color:C.white}}>{savedTS.sizeFixed.value} {savedTS.sizeFixed.unit}</strong></div>}
            {!savedTS.tpFixed.enabled&&!savedTS.slFixed.enabled&&!savedTS.rrFixed.enabled&&!savedTS.sizeFixed.enabled&&<span style={{fontSize:10,color:C.gray2,fontFamily:"'Josefin Sans',sans-serif"}}>Aucun champ activé dans les paramètres</span>}
          </div>
        </div>
      )}
      <Divider />
      {(tradeFixedMode==="variable" || !(savedTS.tpFixed.enabled&&savedTS.tpFixed.value&&savedTS.slFixed.enabled&&savedTS.slFixed.value)) && <Field label={`P&L — ${form.result === "LOSS" ? "montant perte" : form.result === "WIN" ? "montant gain" : "breakeven"}`}>
        <input type="text" inputMode="decimal" placeholder="" value={pnlRaw} onChange={e => { const v = e.target.value.replace(/,/g,".").replace(/[^0-9.]/g, ""); setPnlRaw(v); }} style={{ ...iStyle, fontSize:18, fontFamily:"'Josefin Sans',sans-serif", fontWeight:300, color:"#1a1a1a" }} />
        {/* Breakeven sign toggle — always visible in BE mode */}
        {form.result === "BREAKEVEN" && (
          <div style={{display:"flex",gap:8,marginTop:8,alignItems:"center"}}>
            <div style={{display:"flex",borderRadius:6,border:`1px solid ${C.border}`,overflow:"hidden"}}>
              <button onClick={()=>setBeSign(1)} style={{padding:"7px 16px",border:"none",background:beSign===1?"#2a6e3a":"transparent",color:beSign===1?"#fff":C.gray1,fontSize:11,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,cursor:"pointer",transition:"all 0.2s"}}>+ Positif</button>
              <button onClick={()=>setBeSign(-1)} style={{padding:"7px 16px",border:"none",background:beSign===-1?"#c0392b":"transparent",color:beSign===-1?"#fff":C.gray1,fontSize:11,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,cursor:"pointer",transition:"all 0.2s"}}>− Négatif</button>
            </div>
            {pnlRaw && <span style={{fontSize:12,color:beSign===1?"#2a6e3a":"#c0392b",fontFamily:"'Josefin Sans',sans-serif"}}>{beSign===1?"+":"-"}{parseFloat(pnlRaw).toFixed(2)}{currency}</span>}
          </div>
        )}
        {pnlRaw && !isNaN(parseFloat(pnlRaw)) && form.result !== "BREAKEVEN" && (
          <div style={{ marginTop:5, fontSize:12, fontFamily:"'Josefin Sans',sans-serif" }}>
            {form.result === "WIN" && <span style={{color:"#2a6e3a"}}>{`✓ Gain : +${parseFloat(pnlRaw).toFixed(2)} ${currency}`}</span>}
            {form.result === "LOSS" && <span style={{color:"#c0392b"}}>{`✗ Perte : −${parseFloat(pnlRaw).toFixed(2)} ${currency}`}</span>}
          </div>
        )}
      </Field>}
      {tradeMode==="swing" ? (
        <>
          <Field label="Prix d'entrée"><input type="text" inputMode="decimal" placeholder="" value={form.entry} onChange={e => set("entry", e.target.value)} style={iStyle} /></Field>
          <Field label="Prix de sortie"><input type="text" inputMode="decimal" placeholder="" value={form.exit} onChange={e => set("exit", e.target.value)} style={iStyle} /></Field>
          {!(tradeFixedMode==="fixe" && savedTS.rrFixed.enabled && savedTS.rrFixed.value) && <Field label="Risk / Reward"><input type="text" inputMode="decimal" placeholder="" value={form.rr} onChange={e => set("rr", e.target.value)} style={iStyle}/></Field>}
          {!(tradeFixedMode==="fixe" && savedTS.sizeFixed.enabled && savedTS.sizeFixed.value) && (
            <div style={{marginBottom:4}}>
              <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",letterSpacing:"0.18em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,marginBottom:6,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span>Taille de position</span>
                <div style={{display:"flex",borderRadius:5,border:`1px solid ${C.border}`,overflow:"hidden"}}>
                  {["contrats","lots"].map(u=>(
                    <button key={u} onClick={()=>set("sizeUnit",u)} style={{padding:"2px 10px",border:"none",background:form.sizeUnit===u?C.accent:"transparent",color:form.sizeUnit===u?(darkMode?"#111":"#fff"):C.gray1,fontSize:9,fontFamily:"'Josefin Sans',sans-serif",fontWeight:form.sizeUnit===u?600:300,cursor:"pointer",letterSpacing:"0.08em",transition:"all 0.18s"}}>{u}</button>
                  ))}
                </div>
              </div>
              <input type="text" inputMode="decimal" placeholder="" value={form.size} onChange={e=>set("size",e.target.value.replace(/,/g,".").replace(/[^0-9.]/g,""))} style={iStyle}/>
            </div>
          )}
        </>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:4}}>
          {/* Scalping optional toggles */}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {[
              {k:"entry", label:"Prix entrée/sortie"},
              {k:"rr", label:"R/R", hideInFixe: true},
              {k:"emotion", label:"Émotion"},
              {k:"notes", label:"Note"},
              {k:"size", label:"Taille", hideInFixe: true},
            ].filter(f => !(f.hideInFixe && tradeFixedMode==="fixe" && ((f.k==="rr" && savedTS.rrFixed.enabled && savedTS.rrFixed.value)||(f.k==="size" && savedTS.sizeFixed.enabled && savedTS.sizeFixed.value)))).map(f => (
              <button key={f.k} onClick={()=>toggleScalp(f.k)} style={{padding:"6px 12px",borderRadius:6,border:`1px solid ${scalpFields[f.k]?C.accent:C.border}`,background:scalpFields[f.k]?"rgba(255,255,255,0.06)":"transparent",color:scalpFields[f.k]?C.white:C.gray2,fontSize:10,fontFamily:"'Josefin Sans',sans-serif",fontWeight:scalpFields[f.k]?400:300,letterSpacing:"0.1em",cursor:"pointer",transition:"all 0.18s",display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:scalpFields[f.k]?C.accent:C.gray3,transition:"background 0.18s"}}/>
                {f.label}
              </button>
            ))}
          </div>
          {scalpFields.entry && (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <Field label="Prix d'entrée"><input type="text" inputMode="decimal" placeholder="" value={form.entry} onChange={e => set("entry", e.target.value)} style={iStyle}/></Field>
              <Field label="Prix de sortie"><input type="text" inputMode="decimal" placeholder="" value={form.exit} onChange={e => set("exit", e.target.value)} style={iStyle}/></Field>
            </div>
          )}
          {scalpFields.rr && !(tradeFixedMode==="fixe" && savedTS.rrFixed.enabled && savedTS.rrFixed.value) && <Field label="Risk / Reward"><input type="text" inputMode="decimal" placeholder="" value={form.rr} onChange={e => set("rr", e.target.value)} style={iStyle}/></Field>}
          {scalpFields.size && !(tradeFixedMode==="fixe" && savedTS.sizeFixed.enabled && savedTS.sizeFixed.value) && (
            <Field label={<div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"space-between",width:"100%"}}>
              <span>Taille</span>
              <div style={{display:"flex",borderRadius:5,border:`1px solid ${C.border}`,overflow:"hidden"}}>
                {["contrats","lots"].map(u=>(
                  <button key={u} onClick={()=>set("sizeUnit",u)} style={{padding:"2px 8px",border:"none",background:form.sizeUnit===u?C.accent:"transparent",color:form.sizeUnit===u?(darkMode?"#111":"#fff"):C.gray1,fontSize:9,fontFamily:"'Josefin Sans',sans-serif",cursor:"pointer",transition:"all 0.18s"}}>{u}</button>
                ))}
              </div>
            </div>}>
              <input type="text" inputMode="decimal" placeholder="" value={form.size} onChange={e=>set("size",e.target.value.replace(/,/g,".").replace(/[^0-9.]/g,""))} style={iStyle}/>
            </Field>
          )}
        </div>
      )}
      {(tradeMode==="swing" || scalpFields.notes) && (
        <Field label="Notes">
          <textarea rows={3} placeholder="ex: Parfaite exécution, j'ai suivi mon plan à la lettre." value={form.notes} onChange={e => set("notes", e.target.value)} style={{ ...iStyle, resize:"vertical", lineHeight:1.6 }} />
        </Field>
      )}

      {propfirms.length > 0 && (
        <Field label="Compte(s) concerné(s)">
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {propfirms.map(pf => {
              const selected = form.accountIds.includes(pf.id);
              return (
                <button key={pf.id} onClick={() => set("accountIds", selected ? form.accountIds.filter(id=>id!==pf.id) : [...form.accountIds, pf.id])} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 14px", borderRadius:6, border:`1px solid ${selected?C.accent:C.border}`, background:selected?"rgba(0,0,0,0.06)":"transparent", cursor:"pointer", transition:"all 0.15s" }}>
                  <div style={{ textAlign:"left" }}>
                    <div style={{ fontSize:13, fontFamily:"'Josefin Sans',sans-serif", fontWeight:selected?600:300, color:selected?C.accent:C.white, letterSpacing:"0.05em" }}>{pf.firm||"Fond Propre"}</div>
                    {pf.name && <div style={{ fontSize:10, color:C.gray1, fontFamily:"'Josefin Sans',sans-serif", marginTop:2 }}>{pf.name}</div>}
                  </div>
                  <div style={{ width:18, height:18, borderRadius:4, border:`1px solid ${selected?C.accent:C.gray2}`, background:selected?C.accent:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    {selected && <span style={{ color:"#fff", fontSize:11, lineHeight:1 }}>✓</span>}
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{ fontSize:10, color:C.gray1, fontFamily:"'Josefin Sans',sans-serif", marginTop:6 }}>
            Sélectionne plusieurs comptes pour le copy trading
          </div>
        </Field>
      )}

      {strategies.length > 0 ? (
        <Field label="Stratégie utilisée">
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {strategies.map(s => {
              const sel = form.strategyId === s.id;
              return (
                <button key={s.id} onClick={() => set("strategyId", sel ? null : s.id)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 14px", borderRadius:6, border:`1px solid ${sel?C.accent:C.border}`, background:sel?"rgba(0,0,0,0.06)":"transparent", cursor:"pointer" }}>
                  <span style={{ fontSize:13, fontFamily:"'Josefin Sans',sans-serif", fontWeight:sel?600:300, color:sel?C.accent:C.white, letterSpacing:"0.05em" }}>{s.name||"Stratégie"}</span>
                  <div style={{ width:18, height:18, borderRadius:4, border:`1px solid ${sel?C.accent:C.gray2}`, background:sel?C.accent:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{sel && <span style={{ color:darkMode?"#111":"#fff", fontSize:11 }}>✓</span>}</div>
                </button>
              );
            })}
          </div>
        </Field>
      ) : (
        <button onClick={() => setView("strategy")} style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"13px 16px", borderRadius:8, border:`1px dashed ${C.border}`, background:"transparent", cursor:"pointer", marginBottom:16, transition:"all 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.gray1}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
          <span style={{ fontSize:16, color:C.gray2 }}>◈</span>
          <div style={{ textAlign:"left" }}>
            <div style={{ fontSize:11, color:C.white, fontFamily:"'Josefin Sans',sans-serif", fontWeight:600, letterSpacing:"0.08em" }}>Créer une stratégie</div>
            <div style={{ fontSize:10, color:C.gray1, fontFamily:"'Josefin Sans',sans-serif", fontWeight:300, marginTop:2 }}>Améliore l'analyse IA et le suivi de tes trades</div>
          </div>
          <span style={{ marginLeft:"auto", fontSize:11, color:C.gray2 }}>→</span>
        </button>
      )}
      <button onClick={addTrade} disabled={computedPnl() === null} style={{ width:"100%", padding:"14px", borderRadius:4, border:"none", background:computedPnl() !== null ? C.accent : C.gray3, color:computedPnl() !== null ? (darkMode?"#111":"#fff") : C.gray2, fontSize:12, fontWeight:600, fontFamily:"'Josefin Sans',sans-serif", letterSpacing:"0.2em", textTransform:"uppercase", cursor:computedPnl() !== null ? "pointer" : "not-allowed", transition:"all 0.3s" }}>
        {saved ? "✓  Trade enregistré" : "Enregistrer  →"}
      </button>
    </div>
  );

  // ── History JSX ──
  const historyContent = (
    <div>
      <PageTitle sub="Classements" title="Statistiques" />

      {/* ══════════════════ ANALYTICS AVANCÉS ══════════════════ */}
      {trades.length >= 3 && (() => {
        const isDark = C.bg === "#0f0f0f";
        const sorted = [...trades].sort((a,b)=>a.date.localeCompare(b.date));
        const cardS = {background:C.bg2,border:`1px solid ${C.border}`,borderRadius:12,boxShadow:"0 4px 28px rgba(0,0,0,0.6),0 1px 4px rgba(0,0,0,0.22),0 0 0 1px rgba(255,255,255,0.09),inset 0 1px 0 rgba(255,255,255,0.32)"};
        const lbl = {fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600};
        const ff = "'Josefin Sans',sans-serif";

        // Equity & Drawdown
        let cum=0,peak=0,maxDD=0;
        sorted.forEach(t=>{
          cum+=t.pnl||0;
          if(cum>peak) peak=cum;
          const dd=peak>0?(peak-cum)/peak*100:0;
          if(dd>maxDD) maxDD=dd;
        });
        const currentDD = peak>0?(peak-cum)/peak*100:0;

        // Win/Loss
        const wins=sorted.filter(t=>t.result==="WIN");
        const losses=sorted.filter(t=>t.result==="LOSS");
        const wr=sorted.length?wins.length/sorted.length:0;
        const avgWin=wins.length?wins.reduce((s,t)=>s+(t.pnl||0),0)/wins.length:0;
        const avgLoss=losses.length?Math.abs(losses.reduce((s,t)=>s+(t.pnl||0),0)/losses.length):0;
        const grossW=wins.reduce((s,t)=>s+(t.pnl||0),0);
        const grossL=Math.abs(losses.reduce((s,t)=>s+(t.pnl||0),0));
        const pf=grossL>0?grossW/grossL:grossW>0?99:0;

        // Expectancy, Kelly
        const expectancy=(wr*avgWin)-((1-wr)*avgLoss);
        const kelly=avgLoss>0&&avgWin>0?((wr-(1-wr)/(avgWin/avgLoss))*100):0;

        // Consistency (% semaines positives)
        const weekMap={};
        sorted.forEach(t=>{
          const d=new Date(t.date+"T12:00:00");
          const key=`${d.getFullYear()}-${d.getMonth()}-W${Math.ceil(d.getDate()/7)}`;
          weekMap[key]=(weekMap[key]||0)+(t.pnl||0);
        });
        const wVals=Object.values(weekMap);
        const consistency=wVals.length?Math.round(wVals.filter(v=>v>0).length/wVals.length*100):0;

        // Sharpe simplifié (daily)
        const dayMap={};
        sorted.forEach(t=>{ dayMap[t.date]=(dayMap[t.date]||0)+(t.pnl||0); });
        const dVals=Object.values(dayMap);
        const avgD=dVals.reduce((s,v)=>s+v,0)/dVals.length;
        const stdD=Math.sqrt(dVals.reduce((s,v)=>s+(v-avgD)**2,0)/dVals.length)||1;
        const sharpe=avgD/stdD;

        // Streaks
        let maxWS=0,maxLS=0,tmpS=0,tmpT=null;
        sorted.forEach(t=>{
          if(t.result==="BREAKEVEN") return;
          const tp=t.result==="WIN"?"W":"L";
          if(tp===tmpT){tmpS++;}else{tmpS=1;tmpT=tp;}
          if(tp==="W"&&tmpS>maxWS) maxWS=tmpS;
          if(tp==="L"&&tmpS>maxLS) maxLS=tmpS;
        });
        let curS=0,curST=null;
        for(let i=sorted.length-1;i>=0;i--){
          const t=sorted[i];
          if(t.result==="BREAKEVEN") continue;
          const tp=t.result==="WIN"?"W":"L";
          if(curST===null){curST=tp;curS=1;}
          else if(tp===curST){curS++;}
          else break;
        }

        // Overtrading
        const avgTPD=sorted.length/Object.keys(dayMap).length;
        const dayDetails=Object.entries(dayMap).map(([date,pnl])=>({date,pnl,count:sorted.filter(t=>t.date===date).length}));
        const otDays=dayDetails.filter(d=>d.count>avgTPD*1.5).sort((a,b)=>b.count-a.count).slice(0,3);

        // R-Multiple distribution
        const rrBuckets=[
          {label:"< 0",count:0,color:"#e05a5a"},
          {label:"0–1",count:0,color:"#e0884a"},
          {label:"1–2",count:0,color:"#d4c060"},
          {label:"2–3",count:0,color:"#4caf6e"},
          {label:"3+", count:0,color:"#2a9d5c"},
        ];
        sorted.forEach(t=>{
          const r=parseFloat(t.rr);
          if(isNaN(r)) return;
          if(t.result==="LOSS"||r<0) rrBuckets[0].count++;
          else if(r<1) rrBuckets[1].count++;
          else if(r<2) rrBuckets[2].count++;
          else if(r<3) rrBuckets[3].count++;
          else rrBuckets[4].count++;
        });
        const rrTotal=rrBuckets.reduce((s,b)=>s+b.count,0);
        const rrTrades=sorted.filter(t=>parseFloat(t.rr)>0);
        const avgRR=rrTrades.length?rrTrades.reduce((s,t)=>s+parseFloat(t.rr),0)/rrTrades.length:1;
        const breakEvenWR=avgRR>0?Math.round(1/(1+avgRR)*100):50;

        // Matrice émotionnelle
        const emoList=[...new Set(sorted.map(t=>t.emotion).filter(Boolean))];
        const emoData=emoList.map(e=>{
          const et=sorted.filter(t=>t.emotion===e);
          const ew=et.filter(t=>t.result==="WIN").length;
          return{e,count:et.length,wr:et.length?Math.round(ew/et.length*100):0,pnl:et.reduce((s,t)=>s+(t.pnl||0),0)};
        }).sort((a,b)=>b.wr-a.wr);

        // Monte Carlo
        const MC=300,MCT=50;
        const mcR=[];
        for(let p=0;p<MC;p++){let eq=0;for(let i=0;i<MCT;i++){eq+=Math.random()<wr?avgWin:-avgLoss;}mcR.push(eq);}
        mcR.sort((a,b)=>a-b);
        const mcP10=mcR[Math.floor(MC*0.1)];
        const mcP50=mcR[Math.floor(MC*0.5)];
        const mcP90=mcR[Math.floor(MC*0.9)];
        const mcWin=Math.round(mcR.filter(v=>v>0).length/MC*100);

        return (
          <div style={{marginBottom:8}}>

            {/* ── MÉTRIQUES CLÉS ── */}
            <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:"0.2em",fontFamily:ff,fontWeight:600,marginBottom:8}}>Métriques Avancées</div>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(3,1fr)",gap:8,marginBottom:10}}>
              {[
                {l:"Espérance / Trade",v:`${expectancy>=0?"+":""}${expectancy.toFixed(0)}${currency}`,c:expectancy>=0?"#4caf6e":"#e05a5a",sub:"Gain moyen espéré par trade"},
                {l:"Drawdown Max",v:`${maxDD.toFixed(1)}%`,c:maxDD<10?"#4caf6e":maxDD<25?"#d4c060":"#e05a5a",sub:`Actuel : ${currentDD.toFixed(1)}%`},
                {l:"Facteur de Profit",v:pf>=99?"∞":pf.toFixed(2),c:pf>=1.5?"#4caf6e":pf>=1?"#d4c060":"#e05a5a",sub:"Gains bruts / Pertes brutes"},
                {l:"Critère de Kelly",v:`${Math.max(0,kelly).toFixed(1)}%`,c:kelly>0?"#4caf6e":"#e05a5a",sub:"Taille de position optimale"},
                {l:"Consistance",v:`${consistency}%`,c:consistency>=60?"#4caf6e":consistency>=40?"#d4c060":"#e05a5a",sub:`${wVals.filter(v=>v>0).length}/${wVals.length} semaines`},
                {l:"Ratio de Sharpe",v:sharpe.toFixed(2),c:sharpe>=1?"#4caf6e":sharpe>=0?"#d4c060":"#e05a5a",sub:"Rendement / volatilité journalière"},
              ].map(m=>(
                <div key={m.l} style={{...cardS,padding:"14px 12px"}}>
                  <div style={lbl}>{m.l}</div>
                  <div style={{fontSize:22,fontFamily:ff,fontWeight:300,color:m.c,marginTop:4,letterSpacing:"0.04em",lineHeight:1}}>{m.v}</div>
                  <div style={{fontSize:9,color:C.gray2,fontFamily:ff,marginTop:3}}>{m.sub}</div>
                </div>
              ))}
            </div>

            {/* ── R-MULTIPLE DISTRIBUTION ── */}
            <div style={{...cardS,padding:"16px",marginBottom:10}}>
              <div style={lbl}>Distribution R-Multiples</div>
              <div style={{fontSize:9,color:C.gray2,fontFamily:ff,marginBottom:14,marginTop:2}}>Où se situent tes sorties ?</div>
              <div style={{display:"flex",gap:8,alignItems:"flex-end",height:90,marginBottom:10}}>
                {rrBuckets.map(b=>{
                  const h=rrTotal>0?Math.max(4,Math.round(b.count/rrTotal*74)):4;
                  const pct=rrTotal>0?Math.round(b.count/rrTotal*100):0;
                  return (
                    <div key={b.label} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      <span style={{fontSize:9,color:C.gray1,fontFamily:ff}}>{b.count>0?pct+"%":""}</span>
                      <div style={{width:"100%",display:"flex",alignItems:"flex-end",height:64}}>
                        <div style={{width:"100%",height:b.count>0?h:2,borderRadius:"5px 5px 2px 2px",background:b.color,opacity:b.count>0?0.9:0.2,transition:"height 0.6s cubic-bezier(.4,0,.2,1)"}}/>
                      </div>
                      <span style={{fontSize:9,color:C.gray1,fontFamily:ff,letterSpacing:"0.05em"}}>{b.label}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{display:"flex",gap:12,fontSize:9,color:C.gray2,fontFamily:ff,paddingTop:8,borderTop:`1px solid ${C.border}`}}>
                <span>RR moyen : <strong style={{color:C.gray1,fontFamily:ff}}>{avgRR.toFixed(2)}</strong></span>
                <span>WR d'équilibre : <strong style={{color:C.gray1,fontFamily:ff}}>{breakEvenWR}%</strong></span>
                <span>Ton WR : <strong style={{color:Math.round(wr*100)>breakEvenWR?"#4caf6e":"#e05a5a",fontFamily:ff}}>{Math.round(wr*100)}%</strong></span>
              </div>
            </div>

            {/* ── MATRICE ÉMOTIONNELLE ── */}
            {emoData.length>0 && (
              <div style={{...cardS,padding:"16px",marginBottom:10}}>
                <div style={lbl}>Matrice Émotionnelle</div>
                <div style={{fontSize:9,color:C.gray2,fontFamily:ff,marginBottom:14,marginTop:2}}>Performance par état d'esprit</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 48px 48px 72px",gap:"10px 8px",alignItems:"center"}}>
                  {["Émotion","Nb","Réussite","P&L"].map(h=>(
                    <div key={h} style={{fontSize:8,color:C.dim,fontFamily:ff,letterSpacing:"0.1em",textTransform:"uppercase",textAlign:h==="Émotion"?"left":"center"}}>{h}</div>
                  ))}
                  {emoData.map(e=>(
                    <div key={e.e} style={{display:"contents"}}>
                      <div>
                        <div style={{fontSize:11,color:C.white,fontFamily:ff,marginBottom:3}}>{e.e}</div>
                        <div style={{height:2,background:C.gray3,borderRadius:1}}>
                          <div style={{width:e.wr+"%",height:"100%",borderRadius:1,background:e.wr>=50?"#4caf6e":"#e05a5a",transition:"width 0.5s"}}/>
                        </div>
                      </div>
                      <div style={{fontSize:11,color:C.gray1,fontFamily:ff,textAlign:"center"}}>{e.count}</div>
                      <div style={{fontSize:11,fontFamily:ff,textAlign:"center",fontWeight:600,color:e.wr>=50?"#4caf6e":"#e05a5a"}}>{e.wr}%</div>
                      <div style={{fontSize:11,fontFamily:ff,textAlign:"center",fontWeight:600,color:e.pnl>=0?"#4caf6e":"#e05a5a"}}>{e.pnl>=0?"+":""}{e.pnl.toFixed(0)}{currency}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── STREAKS + OVERTRADING ── */}
            <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:8,marginBottom:10}}>
              <div style={{...cardS,padding:"16px"}}>
                <div style={lbl}>Séries</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:12}}>
                  {[
                    {l:"Actuelle",v:`${curS}×`,sub:curST==="W"?"Victoires":"Défaites",c:curST==="W"?"#4caf6e":"#e05a5a"},
                    {l:"Meilleure série",v:`${maxWS}×`,sub:"victoires consécutives",c:"#4caf6e"},
                    {l:"Pire série",v:`${maxLS}×`,sub:"défaites consécutives",c:"#e05a5a"},
                  ].map(s=>(
                    <div key={s.l} style={{textAlign:"center",background:isDark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.03)",borderRadius:8,padding:"10px 6px"}}>
                      <div style={{fontSize:7,color:C.dim,fontFamily:ff,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>{s.l}</div>
                      <div style={{fontSize:18,fontFamily:ff,fontWeight:300,color:s.c,letterSpacing:"0.04em",lineHeight:1}}>{s.v}</div>
                      <div style={{fontSize:8,color:C.gray2,fontFamily:ff}}>{s.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{...cardS,padding:"16px"}}>
                <div style={lbl}>Détection Surtrading</div>
                <div style={{marginTop:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,alignItems:"center"}}>
                    <span style={{fontSize:9,color:C.gray1,fontFamily:ff}}>Moy. trades / jour</span>
                    <span style={{fontSize:12,color:C.white,fontFamily:ff,fontWeight:600}}>{avgTPD.toFixed(1)}</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:10,alignItems:"center"}}>
                    <span style={{fontSize:9,color:C.gray1,fontFamily:ff}}>Jours suspects détectés</span>
                    <span style={{fontSize:12,color:otDays.length>0?"#e05a5a":C.white,fontFamily:ff,fontWeight:600}}>{otDays.length}</span>
                  </div>
                  {otDays.length>0 && otDays.slice(0,2).map(d=>(
                    <div key={d.date} style={{display:"flex",justifyContent:"space-between",padding:"5px 8px",background:"rgba(224,90,90,0.08)",borderRadius:6,marginBottom:4,border:"1px solid rgba(224,90,90,0.15)"}}>
                      <span style={{fontSize:9,color:C.gray1,fontFamily:ff}}>{d.date} · <strong style={{color:"#e05a5a",fontFamily:ff}}>{d.count} trades</strong></span>
                      <span style={{fontSize:9,fontFamily:ff,fontWeight:600,color:d.pnl>=0?"#4caf6e":"#e05a5a"}}>{d.pnl>=0?"+":""}{d.pnl.toFixed(0)}{currency}</span>
                    </div>
                  ))}
                  {otDays.length===0 && <div style={{fontSize:10,color:"#4caf6e",fontFamily:ff,padding:"6px 10px",background:"rgba(76,175,110,0.08)",borderRadius:6,border:"1px solid rgba(76,175,110,0.15)"}}>✓ Aucun surtrading détecté</div>}
                </div>
              </div>
            </div>

            {/* ── MONTE CARLO ── */}
            <div style={{...cardS,padding:"16px",marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                <div>
                  <div style={lbl}>Monte Carlo — 50 prochains trades</div>
                  <div style={{fontSize:9,color:C.gray2,fontFamily:ff,marginTop:2}}>Simulation sur {MC} chemins basée sur tes stats réelles</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:24,fontFamily:ff,fontWeight:300,color:mcWin>=60?"#4caf6e":mcWin>=40?"#d4c060":"#e05a5a",letterSpacing:"0.04em",lineHeight:1}}>{mcWin}%</div>
                  <div style={{fontSize:8,color:C.gray2,fontFamily:ff}}>chances de profit</div>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {[
                  {l:"Pessimiste (P10)",v:mcP10,desc:"1 chance sur 10 de faire moins"},
                  {l:"Médian (P50)",v:mcP50,desc:"Résultat le plus probable"},
                  {l:"Optimiste (P90)",v:mcP90,desc:"1 chance sur 10 de faire mieux"},
                ].map(s=>(
                  <div key={s.l} style={{background:isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)",borderRadius:8,padding:"12px 10px",textAlign:"center"}}>
                    <div style={{fontSize:7,color:C.dim,fontFamily:ff,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>{s.l}</div>
                    <div style={{fontSize:18,fontFamily:ff,fontWeight:300,color:s.v>=0?"#4caf6e":"#e05a5a",letterSpacing:"0.04em",lineHeight:1}}>{s.v>=0?"+":""}{s.v.toFixed(0)}{currency}</div>
                    <div style={{fontSize:8,color:C.gray2,fontFamily:ff,marginTop:4}}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        );
      })()}
      {/* ══════════════════ FIN ANALYTICS ══════════════════ */}

      {(() => {
        if (trades.length === 0) return null;
        const calcBest = (groupFn) => {
          const groups = {};
          trades.forEach(t => {
            const k = groupFn(t);
            if (!k) return;
            if (!groups[k]) groups[k] = {pnl:0,wins:0,total:0};
            groups[k].pnl += t.pnl||0;
            groups[k].total++;
            if (t.result==="WIN") groups[k].wins++;
          });
          return Object.entries(groups)
            .map(([k,v]) => ({name:k, pnl:v.pnl, wr:v.total?Math.round(v.wins/v.total*100):0, count:v.total}))
            .sort((a,b) => b.pnl - a.pnl);
        };
        const sections = [
          { title:"Stratégie", sub:"Par stratégie utilisée", data: calcBest(t => { const s = strategies.find(s=>s.id===t.strategyId); return s?.name||null; }) },
          { title:"Session", sub:"Par session de trading", data: calcBest(t => t.session) },
          { title:"Instrument", sub:"Par instrument tradé", data: calcBest(t => t.instrument) },
          { title:"Émotion", sub:"Par état émotionnel", data: calcBest(t => t.emotion) },
        ];
        return (
          <div style={{marginBottom:20}}>
            {sections.map(sec => (
              <div key={sec.title} style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:14,boxShadow:"0 6px 32px rgba(0,0,0,0.65), 0 2px 8px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.1), 0 -2px 28px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.36)",padding:"16px",marginBottom:12}}>
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600}}>{sec.title}</div>
                  <div style={{fontSize:11,color:C.gray1,fontFamily:"'Josefin Sans',sans-serif",marginTop:2}}>{sec.sub}</div>
                </div>
                {sec.data.length === 0 ? (
                  <div style={{fontSize:12,color:C.gray2,fontFamily:"'Josefin Sans',sans-serif"}}>Aucune donnée</div>
                ) : sec.data.map((item,i) => {
                  const maxPnl = Math.max(...sec.data.map(d=>Math.abs(d.pnl)),1);
                  return (
                    <div key={item.name} style={{marginBottom:i<sec.data.length-1?12:0}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:11,color:C.gray2,fontFamily:"'Josefin Sans',sans-serif",minWidth:18}}>#{i+1}</span>
                          <span style={{fontSize:13,color:C.white,fontFamily:"'Josefin Sans',sans-serif",fontWeight:i===0?600:300}}>{item.name}</span>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <span style={{fontSize:13,color:item.pnl>=0?"#2a6e3a":"#c0392b",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600}}>{item.pnl>=0?"+":""}{item.pnl.toFixed(0)}{currency}</span>
                          <span style={{fontSize:10,color:C.gray1,fontFamily:"'Josefin Sans',sans-serif",marginLeft:6}}>{item.wr}% · {item.count}T</span>
                        </div>
                      </div>
                      <div style={{height:4,background:C.gray3,borderRadius:2}}>
                        <div style={{width:(Math.abs(item.pnl)/maxPnl*100)+"%",height:"100%",borderRadius:2,background:item.pnl>=0?"#2a6e3a":"#c0392b",transition:"width 0.5s"}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })()}
      <PageTitle sub="Historique" title="Mes Trades" />
      {trades.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 0" }}>
          <div style={{ fontSize:44, marginBottom:10, color:C.gray2 }}>◎</div>
          <div style={{ fontFamily:"'Josefin Sans',sans-serif", fontSize:14, fontWeight:300, color:C.gray1, letterSpacing:"0.08em" }}>Aucun trade enregistré</div>
        </div>
      ) : [...trades].sort((a, b) => b.date.localeCompare(a.date)).map(t => {
        const pnl = t.pnl || 0; const isWin = t.result === "WIN"; const isLoss = t.result === "LOSS"; const isEditing = editingTrade?.id === t.id;
        return (
          <div key={t.id} style={{ background:C.bg2, border:`1px solid ${isEditing ? C.accent : isWin ? "rgba(0,0,0,0.15)" : isLoss ? "rgba(0,0,0,0.08)" : C.border}`, borderLeft:`3px solid ${isEditing ? C.accent : isWin ? C.accent : isLoss ? C.gray2 : C.gray3}`, borderRadius:12, boxShadow:"0 4px 28px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.09), 0 -2px 24px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.32)", padding:"13px 15px", marginBottom:8, transition:"border 0.2s" }}>
            {!isEditing && (
              <>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:7 }}>
                  <div>
                    <span style={{ fontFamily:"'Josefin Sans',sans-serif", fontWeight:700, fontSize:15, color:C.white, letterSpacing:"-0.025em" }}>{t.instrument}</span>
                    <span style={{ marginLeft:8, fontSize:10, color:C.gray1, fontFamily:"'Josefin Sans',sans-serif", fontWeight:600, letterSpacing:"0.1em" }}>{t.direction}</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontFamily:"'Josefin Sans',sans-serif", fontSize:16, fontWeight:300, color:pnl >= 0 ? C.accent : C.gray1, letterSpacing:"0.03em" }}>{pnl >= 0 ? "+" : ""}{pnl.toFixed(0)} €</span>
                    <button onClick={() => startEdit(t)} style={{ background:"none", border:`1px solid ${C.gray3}`, borderRadius:4, color:C.gray1, cursor:"pointer", fontSize:11, padding:"2px 7px", fontFamily:"'Josefin Sans',sans-serif" }}>✎</button>
                    <button onClick={() => deleteTrade(t.id)} style={{ background:"none", border:"none", color:C.gray2, cursor:"pointer", fontSize:17, lineHeight:1, padding:0 }}>×</button>
                  </div>
                </div>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  {[t.date, t.time||null, t.session, t.emotion, t.rr ? `RR ${t.rr}` : null].filter(Boolean).map((tag, i) => (
                    <span key={i} style={{ fontSize:10, color:C.gray1, background:C.bg3, padding:"2px 8px", borderRadius:8, letterSpacing:"0.07em", fontFamily:"'Josefin Sans',sans-serif", border:`1px solid ${C.gray3}`, boxShadow:"0 2px 6px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)" }}>{tag}</span>
                  ))}
                </div>
                {t.notes && <div style={{ marginTop:7, fontSize:11, color:C.gray1, lineHeight:1.6, fontStyle:"italic", fontFamily:"'Josefin Sans',sans-serif", fontWeight:300, letterSpacing:"0.03em" }}>{t.notes}</div>}
              </>
            )}
            {isEditing && (
              <>
                <div style={{ fontSize:10, color:C.dim, fontFamily:"'Josefin Sans',sans-serif", fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:12 }}>Modifier le trade</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                  <div><Label>Date</Label><input type="date" value={editingTrade.date} onChange={e => setEditingTrade(p => ({ ...p, date:e.target.value }))} style={{ ...iStyle, padding:"9px 10px", fontSize:13 }} /></div>
                  <div><Label>P&L (montant)</Label><input type="text" inputMode="numeric" value={editPnlRaw} onChange={e => setEditPnlRaw(e.target.value.replace(/[^0-9.]/g, ""))} style={{ ...iStyle, padding:"9px 10px", fontSize:13 }} /></div>
                </div>
                <div style={{ marginBottom:8 }}>
                  <Label>Résultat</Label>
                  <div style={{ display:"flex", gap:5 }}>
                    {["WIN","LOSS","BREAKEVEN"].map(r => (
                      <button key={r} onClick={() => setEditingTrade(p => ({ ...p, result:r }))} style={{ flex:1, padding:"7px", borderRadius:4, border:"none", background:editingTrade.result === r ? "radial-gradient(ellipse 90% 90% at 50% 38%, rgba(245,245,245,0.9) 0%, rgba(215,215,215,0.83) 100%)" : "transparent", color:editingTrade.result === r ? "#111" : C.gray1, fontSize:10, fontFamily:"'Josefin Sans',sans-serif", fontWeight:editingTrade.result === r ? 600 : 300, cursor:"pointer", textTransform:"uppercase", boxShadow:editingTrade.result === r ? "0 0 12px 2px rgba(220,220,220,0.08), 0 3px 10px rgba(0,0,0,0.4)" : "none", transform:editingTrade.result === r ? "translateY(-1px)" : "translateY(0)", transition:"all 0.2s cubic-bezier(.4,0,.2,1)" }}>{r}</button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom:8 }}>
                  <Label>Direction</Label>
                  <div style={{ display:"flex", gap:5 }}>
                    {["LONG","SHORT"].map(d => (
                      <button key={d} onClick={() => setEditingTrade(p => ({ ...p, direction:d }))} style={{ flex:1, padding:"7px", borderRadius:4, border:"none", background:editingTrade.direction === d ? "radial-gradient(ellipse 90% 90% at 50% 38%, rgba(245,245,245,0.9) 0%, rgba(215,215,215,0.83) 100%)" : "transparent", color:editingTrade.direction === d ? "#111" : C.gray1, fontSize:10, fontFamily:"'Josefin Sans',sans-serif", fontWeight:editingTrade.direction === d ? 600 : 300, cursor:"pointer", textTransform:"uppercase", boxShadow:editingTrade.direction === d ? "0 0 12px 2px rgba(220,220,220,0.08), 0 3px 10px rgba(0,0,0,0.4)" : "none", transform:editingTrade.direction === d ? "translateY(-1px)" : "translateY(0)", transition:"all 0.2s cubic-bezier(.4,0,.2,1)" }}>{d}</button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom:8 }}>
                  <Label>Session</Label>
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                    {SESSIONS.map(s => (
                      <button key={s} onClick={() => setEditingTrade(p => ({ ...p, session:s }))} style={{ flex:"1 1 auto", padding:"7px", borderRadius:4, border:"none", background:editingTrade.session === s ? "radial-gradient(ellipse 90% 90% at 50% 38%, rgba(245,245,245,0.9) 0%, rgba(215,215,215,0.83) 100%)" : "transparent", color:editingTrade.session === s ? "#111" : C.gray1, fontSize:10, fontFamily:"'Josefin Sans',sans-serif", fontWeight:editingTrade.session === s ? 600 : 300, cursor:"pointer", textTransform:"uppercase", boxShadow:editingTrade.session === s ? "0 0 12px 2px rgba(220,220,220,0.08), 0 3px 10px rgba(0,0,0,0.4)" : "none", transform:editingTrade.session === s ? "translateY(-1px)" : "translateY(0)", transition:"all 0.2s cubic-bezier(.4,0,.2,1)" }}>{s}</button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom:8 }}>
                  <Label>Émotion</Label>
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                    {EMOTIONS.map(e => (
                      <button key={e} onClick={() => setEditingTrade(p => ({ ...p, emotion:e }))} style={{ flex:"1 1 auto", padding:"7px", borderRadius:4, border:"none", background:editingTrade.emotion === e ? "radial-gradient(ellipse 90% 90% at 50% 38%, rgba(245,245,245,0.9) 0%, rgba(215,215,215,0.83) 100%)" : "transparent", color:editingTrade.emotion === e ? "#111" : C.gray1, fontSize:10, fontFamily:"'Josefin Sans',sans-serif", fontWeight:editingTrade.emotion === e ? 600 : 300, cursor:"pointer", textTransform:"uppercase", boxShadow:editingTrade.emotion === e ? "0 0 12px 2px rgba(220,220,220,0.08), 0 3px 10px rgba(0,0,0,0.4)" : "none", transform:editingTrade.emotion === e ? "translateY(-1px)" : "translateY(0)", transition:"all 0.2s cubic-bezier(.4,0,.2,1)" }}>{e}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                  <div><Label>Instrument</Label><input type="text" value={editingTrade.instrument||""} onChange={e => setEditingTrade(p => ({ ...p, instrument:e.target.value }))} style={{ ...iStyle, padding:"9px 10px", fontSize:13 }} /></div>
                  <div><Label>RR</Label><input type="text" inputMode="decimal" value={editingTrade.rr||""} onChange={e => setEditingTrade(p => ({ ...p, rr:e.target.value }))} style={{ ...iStyle, padding:"9px 10px", fontSize:13 }} /></div>
                </div>
                <div style={{ marginBottom:8 }}><Label>Notes</Label><textarea rows={2} value={editingTrade.notes || ""} onChange={e => setEditingTrade(p => ({ ...p, notes:e.target.value }))} style={{ ...iStyle, resize:"vertical", lineHeight:1.5, padding:"9px 10px", fontSize:13 }} /></div>
                {propfirms.length > 0 && (
                  <div style={{ marginBottom:8 }}>
                    <Label>Compte(s)</Label>
                    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                      {propfirms.map(pf => {
                        const sel = (editingTrade.accountIds||[]).includes(pf.id);
                        return <button key={pf.id} onClick={() => setEditingTrade(p => ({ ...p, accountIds: sel ? (p.accountIds||[]).filter(id=>id!==pf.id) : [...(p.accountIds||[]), pf.id] }))} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", borderRadius:5, border:`1px solid ${sel?C.accent:C.gray3}`, background:sel?"rgba(0,0,0,0.06)":"transparent", cursor:"pointer" }}>
                          <span style={{ fontSize:12, fontFamily:"'Josefin Sans',sans-serif", fontWeight:sel?600:300, color:sel?C.accent:C.white }}>{pf.firm}{pf.name?" · "+pf.name:""}</span>
                          <div style={{ width:16, height:16, borderRadius:3, border:`1px solid ${sel?C.accent:C.gray2}`, background:sel?C.accent:"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>{sel && <span style={{ color:darkMode?"#111":"#fff", fontSize:10 }}>✓</span>}</div>
                        </button>;
                      })}
                    </div>
                  </div>
                )}
                <div style={{ display:"flex", gap:7 }}>
                  <button onClick={saveEdit} style={{ flex:2, padding:"9px", borderRadius:4, border:"none", background:"radial-gradient(ellipse 90% 90% at 50% 38%, rgba(245,245,245,0.95) 0%, rgba(215,215,215,0.88) 55%, rgba(230,230,230,0.92) 100%)", color:"#111", fontSize:11, fontFamily:"'Josefin Sans',sans-serif", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", cursor:"pointer" }}>✓ Sauvegarder</button>
                  <button onClick={cancelEdit} style={{ flex:1, padding:"9px", borderRadius:4, border:`1px solid ${C.gray3}`, background:"transparent", color:C.gray1, fontSize:11, fontFamily:"'Josefin Sans',sans-serif", letterSpacing:"0.1em", textTransform:"uppercase", cursor:"pointer" }}>Annuler</button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );

  // ── Strategy JSX (multi) ──
  const updateStrat = (id, changes) => setStrategies(p => p.map(s => s.id===id ? {...s,...changes} : s));
  const saveStrategy = () => { save(KEYS.strategies, strategies); setStratSaved(true); setTimeout(()=>setStratSaved(false),2000); };

  const activeSid = activeStratId || (strategies[0]?.id);
  const strat = strategies.find(s=>s.id===activeSid) || strategies[0] || { id:0, name:"", description:"", steps:[], rules:"", notes:"" };

  const strategyContent = (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:16 }}>
        <PageTitle sub="Mes Stratégies" title="Plan de Trading" />
        <button onClick={()=>{ const ns={id:Date.now(),name:"Nouvelle stratégie",description:"",steps:[],rules:"",notes:""}; setStrategies(p=>[...p,ns]); setActiveStratId(ns.id); }} style={{ padding:"8px 14px", borderRadius:4, border:"none", background:"radial-gradient(ellipse 90% 90% at 50% 38%, rgba(245,245,245,0.95) 0%, rgba(215,215,215,0.88) 55%, rgba(230,230,230,0.92) 100%)", color:"#111", fontSize:11, fontFamily:"'Josefin Sans',sans-serif", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", cursor:"pointer", marginBottom:22 }}>+ Nouvelle</button>
      </div>

      {/* Strategy tabs */}
      {strategies.length > 1 && (
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
          {strategies.map(s => (
            <button key={s.id} onClick={()=>setActiveStratId(s.id)} style={{ padding:"6px 12px", borderRadius:4, border:`1px solid ${s.id===activeSid?C.accent:C.border}`, background:s.id===activeSid?"rgba(0,0,0,0.08)":"transparent", color:s.id===activeSid?C.accent:C.gray1, fontSize:11, fontFamily:"'Josefin Sans',sans-serif", fontWeight:s.id===activeSid?600:300, cursor:"pointer", letterSpacing:"0.06em" }}>{s.name||"Sans nom"}</button>
          ))}
        </div>
      )}

      {/* Strategy name */}
      <Field label="Nom de la stratégie">
        <input type="text" value={strat.name||""} onChange={e=>updateStrat(strat.id,{name:e.target.value})} placeholder="" style={iStyle}/>
      </Field>
      <Field label="Description générale">
        <textarea rows={3} placeholder="ex: ICT sur MNQ, entrée OB retest M5, NY session..." value={strat.description||""} onChange={e=>updateStrat(strat.id,{description:e.target.value})} style={{...iStyle,resize:"vertical",lineHeight:1.6}}/>
      </Field>
      <div style={{ marginBottom:16 }}>
        <Label>Étapes d'entrée</Label>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {(strat.steps||[]).map((step, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:22, height:22, borderRadius:"50%", background:C.bg3, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:C.dim, fontFamily:"'Josefin Sans',sans-serif", fontWeight:600, flexShrink:0 }}>{i+1}</div>
              <input type="text" value={step} placeholder={`ex: Attendre le retest de l'OB`} onChange={e=>{const steps=[...(strat.steps||[])];steps[i]=e.target.value;updateStrat(strat.id,{steps});}} className="step-input" style={{...iStyle,flex:1,padding:"10px 12px",fontSize:14}}/>
              {(strat.steps||[]).length > 1 && <button onClick={()=>updateStrat(strat.id,{steps:(strat.steps||[]).filter((_,j)=>j!==i)})} style={{background:"none",border:"none",color:C.gray2,cursor:"pointer",fontSize:18,lineHeight:1,padding:"0 4px",flexShrink:0}}>×</button>}
            </div>
          ))}
          <button onClick={()=>updateStrat(strat.id,{steps:[...(strat.steps||[]),""]})} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:6,border:`1px dashed ${C.gray2}`,background:"transparent",color:C.gray1,fontSize:12,fontFamily:"'Josefin Sans',sans-serif",cursor:"pointer",letterSpacing:"0.08em",marginTop:2}}>
            <span style={{fontSize:18,lineHeight:1}}>+</span> Ajouter une étape
          </button>
        </div>
      </div>
      <Field label="Règles strictes">
        <textarea rows={3} placeholder={"- Max 1 trade/jour\n- Stop après 1 win\n- Pas de trade sans bias"} value={strat.rules||""} onChange={e=>updateStrat(strat.id,{rules:e.target.value})} style={{...iStyle,resize:"vertical",lineHeight:1.9}}/>
      </Field>
      <Field label="Notes personnelles">
        <textarea rows={3} placeholder="Tout ce que vous souhaitez que l'IA sache..." value={strat.notes||""} onChange={e=>updateStrat(strat.id,{notes:e.target.value})} style={{...iStyle,resize:"vertical",lineHeight:1.6}}/>
      </Field>
      {strategies.length > 1 && (
        <button onClick={()=>{ setStrategies(p=>p.filter(s=>s.id!==strat.id)); setActiveStratId(null); }} style={{width:"100%",padding:"11px",borderRadius:4,border:"1px solid rgba(192,57,43,0.3)",background:"rgba(192,57,43,0.05)",color:"rgba(192,57,43,0.8)",fontSize:11,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,letterSpacing:"0.15em",textTransform:"uppercase",cursor:"pointer",marginBottom:8}}>
          Supprimer cette stratégie
        </button>
      )}
      <button onClick={saveStrategy} style={{width:"100%",padding:"14px",borderRadius:4,border:`1px solid ${C.borderGold}`,background:"rgba(0,0,0,0.04)",color:C.dim,fontSize:12,fontWeight:600,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.2em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.3s"}}>
        {stratSaved ? "✓  Sauvegardé" : "Sauvegarder  →"}
      </button>
    </div>
  );

  // ── AI JSX ──
  const aiContent = (
    <div>
      <PageTitle sub="Intelligence" title="Analyse IA" />

      {/* Header card */}
      <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:12,padding:"20px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:44,height:44,borderRadius:12,background:"linear-gradient(135deg,rgba(210,180,120,0.18),rgba(210,180,120,0.06))",border:"1px solid rgba(210,180,120,0.25)",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(210,180,120,0.85)",fontSize:20,flexShrink:0}}>◆</div>
        <div>
          <div style={{fontSize:13,color:C.white,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,letterSpacing:"0.06em",marginBottom:3}}>Coach IA</div>
          <div style={{fontSize:11,color:C.dim,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.06em",lineHeight:1.6}}>Détecte les patterns dans tes {trades.length} trades — jours, sessions, émotions, instruments, winners coupés.</div>
        </div>
      </div>

      {/* Coach instructions */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:10,color:C.dim,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:6}}>Instructions du coach</div>
        <textarea
          rows={3}
          placeholder={"Ex: Je trade principalement le MNQ en scalping. Je dois travailler ma discipline sur les stops. Sois très direct et sans pitié sur mes erreurs."}
          value={coachInstructions}
          onChange={e => { setCoachInstructions(e.target.value); localStorage.setItem("fyltra_coach_instr", e.target.value); if (user) saveUserSettings({ coach_instructions: e.target.value }); }}
          style={{...iStyle, resize:"vertical", lineHeight:1.6, fontSize:13}}
        />
        <div style={{fontSize:10,color:C.gray2,fontFamily:"'Josefin Sans',sans-serif",marginTop:5,letterSpacing:"0.05em"}}>Personnalise le comportement du coach. Il en tiendra compte dans chaque analyse.</div>
      </div>

      {/* Trigger button */}
      <button onClick={analyzeAI} disabled={aiLoading} style={{width:"100%",padding:"14px",borderRadius:8,border:"none",background:aiLoading?"rgba(210,180,120,0.12)":"linear-gradient(135deg,rgba(210,180,120,0.25),rgba(210,180,120,0.1))",color:aiLoading?"rgba(210,180,120,0.5)":"rgba(210,180,120,0.95)",fontSize:12,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,letterSpacing:"0.2em",textTransform:"uppercase",cursor:aiLoading?"not-allowed":"pointer",border:"1px solid rgba(210,180,120,0.3)",marginBottom:20,transition:"all 0.2s"}}>
        {aiLoading ? "Analyse en cours…" : "Lancer l'analyse"}
      </button>

      {/* Error */}
      {aiError && (
        <div style={{padding:"14px 16px",borderRadius:8,background:"rgba(192,57,43,0.1)",border:"1px solid rgba(192,57,43,0.3)",color:"#e74c3c",fontSize:12,fontFamily:"'Josefin Sans',sans-serif",marginBottom:16}}>
          {aiError}
        </div>
      )}

      {/* Result */}
      {aiText && (
        <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:12,padding:"20px 18px"}}>
          <div style={{fontSize:10,color:"rgba(210,180,120,0.7)",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:16}}>Analyse IA</div>
          {aiText.split(/\n(?=🔍|✂️|⚠️|🏆|📌)/).map((section, i) => {
            const isPatterns = section.startsWith("🔍");
            const isCut      = section.startsWith("✂️");
            const isDanger   = section.startsWith("⚠️");
            const isEdge     = section.startsWith("🏆");
            const isRules    = section.startsWith("📌");
            const accent = isRules ? "rgba(210,180,120,0.85)" : isEdge ? "#2a6e3a" : isDanger ? "#c0392b" : isCut ? "rgba(180,140,255,0.85)" : "rgba(210,180,120,0.5)";
            const bg     = isRules ? "rgba(210,180,120,0.06)" : isEdge ? "rgba(42,110,58,0.06)" : isDanger ? "rgba(192,57,43,0.06)" : "transparent";
            const border = isRules ? "rgba(210,180,120,0.2)" : isEdge ? "rgba(42,110,58,0.2)" : isDanger ? "rgba(192,57,43,0.2)" : C.border;
            return (
              <div key={i} style={{background:bg, border:`1px solid ${border}`, borderRadius:8, padding:"14px 16px", marginBottom:10}}>
                {section.split("\n").map((line, j) => {
                  const isTitle = j === 0;
                  return (
                    <div key={j} style={{fontSize: isTitle ? 13 : 12, fontWeight: isTitle ? 600 : 300, color: isTitle ? accent : C.white, fontFamily:"'Josefin Sans',sans-serif", lineHeight:1.8, letterSpacing:"0.02em", marginBottom: isTitle ? 8 : 0}}>
                      {line}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!aiText && !aiError && !aiLoading && (
        <div style={{textAlign:"center",padding:"32px 0",color:C.gray2,fontSize:11,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.1em"}}>
          Lance l'analyse pour recevoir ton debriefing
        </div>
      )}
    </div>
  );


  // ── PropFirm JSX ──
  const pfSet = (k,v) => setPfForm(f => ({...f,[k]:v}));

  const addPropfirm = () => {
    if (pfForm.type==="propfirm" && (!pfForm.firm || !pfForm.capital || !pfForm.target || !pfForm.maxLoss)) return;
    if (pfForm.type==="personal" && !pfForm.capital) return;
    const newPf = { ...pfForm, id:Date.now(), pnl:0 };
    setPropfirms(p => [...p, newPf]);
    setPfForm({ type:"propfirm", name:"", firm:"", capital:"", target:"", dailyLoss:"", maxLoss:"", consistency:"", consistencyPct:"", hasDailyLoss:false, hasConsistency:false });
    setPfView("list");
  };

  const deletePf = id => setPropfirms(p => p.filter(pf => pf.id !== id));

  // Calcul P&L par compte — filtre les trades liés à ce compte
  const getPfPnl = (pf) => {
    const linked = trades.filter(t => !t.accountIds || t.accountIds.length === 0 || t.accountIds.includes(pf.id));
    return linked.reduce((s, t) => s + (t.pnl || 0), 0);
  };

  const getPfAlerts = (pf) => {
    const alerts = [];
    const target = parseFloat(pf.target)||0;
    const maxLoss = parseFloat(pf.maxLoss)||0;
    const dailyLoss = parseFloat(pf.dailyLoss)||0;
    const pnl = getPfPnl(pf);
    const drawdown = Math.abs(Math.min(0, pnl));

    if (pf.type === "propfirm") {
      const remaining = target - pnl;
      if (pnl >= target) alerts.push({ type:"success", msg:"Profit target atteint — Félicitations." });
      else if (remaining <= target * 0.2) alerts.push({ type:"warn", msg:`Encore ${remaining.toFixed(0)}${currency} pour valider le profit target.` });
      else alerts.push({ type:"info", msg:`Il vous manque ${remaining.toFixed(0)}${currency} pour valider.` });
      if (drawdown >= maxLoss) alerts.push({ type:"danger", msg:"Max drawdown atteint — Arrêtez de trader." });
      else if (drawdown >= maxLoss * 0.8) alerts.push({ type:"danger", msg:`Attention — vous êtes à ${Math.round(drawdown/maxLoss*100)}% du max drawdown.` });
    }

    if (pf.hasDailyLoss && dailyLoss > 0) {
      const todayPnl = trades.filter(t => t.date === new Date().toISOString().split("T")[0]).reduce((s,t)=>s+(t.pnl||0),0);
      const todayLoss = Math.abs(Math.min(0, todayPnl));
      if (todayLoss >= dailyLoss) alerts.push({ type:"danger", msg:"Daily loss limit atteinte — Arrêtez de trader aujourd'hui." });
      else if (todayLoss >= dailyLoss * 0.7) alerts.push({ type:"warn", msg:`Daily loss : ${todayLoss.toFixed(0)}${currency} / ${dailyLoss}${currency} utilisés.` });
    }
    return alerts;
  };

  const propfirmContent = (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:22 }}>
        <PageTitle sub="Mes Comptes" title={pfView==="list"?"Comptes":pfView==="add-type"?"Type de compte":pfView==="add-propfirm"?"Prop Firm":"Fond Propre"} />
        {pfView!=="list" && (
          <button onClick={()=>setPfView("list")} style={{ padding:"9px 16px", borderRadius:4, border:`1px solid ${C.border}`, background:"transparent", color:C.gray1, fontSize:11, fontFamily:"'Josefin Sans',sans-serif", letterSpacing:"0.12em", textTransform:"uppercase", cursor:"pointer", marginBottom:24 }}>← Retour</button>
        )}
        {pfView==="list" && (
          <button onClick={()=>setPfView("add-type")} style={{ padding:"9px 16px", borderRadius:4, border:"none", background:"radial-gradient(ellipse 90% 90% at 50% 38%, rgba(245,245,245,0.95) 0%, rgba(215,215,215,0.88) 55%, rgba(230,230,230,0.92) 100%)", color:"#111", fontSize:11, fontFamily:"'Josefin Sans',sans-serif", fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", cursor:"pointer", marginBottom:24 }}>+ Ajouter</button>
        )}
      </div>

      {/* ── TYPE SELECTOR ── */}
      {pfView==="add-type" && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginTop:8}}>
          <button onClick={()=>{pfSet("type","propfirm");setPfView("add-propfirm");}} style={{padding:"32px 16px",borderRadius:10,border:`1px solid ${C.border}`,background:C.bg2,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:12,transition:"all 0.2s"}}>
            <div style={{fontSize:28,color:C.dim,fontFamily:"serif"}}>▤</div>
            <div style={{fontFamily:"'Josefin Sans',sans-serif",fontWeight:700,fontSize:13,color:C.white,letterSpacing:"0.1em",textTransform:"uppercase"}}>Prop Firm</div>
            <div style={{fontSize:11,color:C.gray1,fontFamily:"'Josefin Sans',sans-serif",lineHeight:1.5,textAlign:"center"}}>Compte financé avec règles d'évaluation</div>
          </button>
          <button onClick={()=>{pfSet("type","personal");setPfView("add-personal");}} style={{padding:"32px 16px",borderRadius:10,border:`1px solid ${C.border}`,background:C.bg2,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:12,transition:"all 0.2s"}}>
            <div style={{fontSize:28,color:C.dim,fontFamily:"serif"}}>◈</div>
            <div style={{fontFamily:"'Josefin Sans',sans-serif",fontWeight:700,fontSize:13,color:C.white,letterSpacing:"0.1em",textTransform:"uppercase"}}>Fond Propre</div>
            <div style={{fontSize:11,color:C.gray1,fontFamily:"'Josefin Sans',sans-serif",lineHeight:1.5,textAlign:"center"}}>Compte personnel avec ton propre capital</div>
          </button>
          <button disabled style={{padding:"32px 16px",borderRadius:10,border:`1px solid ${C.border}`,background:C.bg2,cursor:"not-allowed",display:"flex",flexDirection:"column",alignItems:"center",gap:12,opacity:0.5,gridColumn:"1 / -1",position:"relative"}}>
            <span style={{position:"absolute",top:12,right:12,background:"linear-gradient(135deg,rgba(210,180,120,0.2),rgba(210,180,120,0.06))",border:"1px solid rgba(210,180,120,0.3)",color:"rgba(210,180,120,0.9)",fontSize:8,fontFamily:"'Josefin Sans',sans-serif",fontWeight:300,letterSpacing:"0.22em",padding:"3px 8px",borderRadius:4,textTransform:"uppercase"}}>bientôt</span>
            <div style={{fontSize:28,color:C.dim}}>⟳</div>
            <div style={{fontFamily:"'Josefin Sans',sans-serif",fontWeight:700,fontSize:13,color:C.white,letterSpacing:"0.1em",textTransform:"uppercase"}}>MT4 / MT5</div>
            <div style={{fontSize:11,color:C.gray1,fontFamily:"'Josefin Sans',sans-serif",lineHeight:1.5,textAlign:"center"}}>Importe automatiquement tes trades depuis MetaTrader</div>
          </button>
        </div>
      )}

      {/* ── PROPFIRM FORM ── */}
      {pfView==="add-propfirm" && (
        <div>
          <Field label="Nom de la Prop Firm *">
            <input type="text" placeholder="ex: Lucid Trading, FTMO..." value={pfForm.firm} onChange={e=>pfSet("firm",e.target.value)} style={iStyle}/>
          </Field>
          <Field label="Nom du compte (optionnel)">
            <input type="text" placeholder="ex: Eval 1, Compte principal..." value={pfForm.name} onChange={e=>pfSet("name",e.target.value)} style={iStyle}/>
          </Field>
          <Divider/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:6,marginBottom:8}}>
            <span style={{fontSize:10,color:C.dim,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.1em"}}>Saisir en</span>
            <button onClick={()=>{setPfPctMode(false);setPfPctValues({target:"",maxLoss:"",dailyLoss:""});}} style={{padding:"4px 10px",borderRadius:20,border:`1px solid ${!pfPctMode?C.accent:C.border}`,background:!pfPctMode?C.bg3:"transparent",color:!pfPctMode?C.white:C.gray1,fontSize:11,fontFamily:"'Josefin Sans',sans-serif",fontWeight:!pfPctMode?600:300,cursor:"pointer"}}>{currency}</button>
            <button onClick={()=>{setPfPctMode(true);setPfPctValues({target:"",maxLoss:"",dailyLoss:""});}} style={{padding:"4px 10px",borderRadius:20,border:`1px solid ${pfPctMode?C.accent:C.border}`,background:pfPctMode?C.bg3:"transparent",color:pfPctMode?C.white:C.gray1,fontSize:11,fontFamily:"'Josefin Sans',sans-serif",fontWeight:pfPctMode?600:300,cursor:"pointer"}}>%</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Capital *">
              <input type="text" inputMode="numeric" placeholder="" value={pfForm.capital} onChange={e=>pfSet("capital",e.target.value.replace(/,/g,".").replace(/[^0-9.]/g,""))} style={iStyle}/>
            </Field>
            <Field label={pfPctMode?"Profit Target * (%)":`Profit Target * (${currency})`}>
              <input type="text" inputMode="numeric" placeholder="" value={pfPctMode?pfPctValues.target:pfForm.target} onChange={e=>{const v=e.target.value.replace(/,/g,".").replace(/[^0-9.]/g,"");if(pfPctMode){setPfPctValues(p=>({...p,target:v}));pfSet("target",pfForm.capital?String((parseFloat(pfForm.capital)*(parseFloat(v)||0)/100).toFixed(0)):"");}else pfSet("target",v);}} style={iStyle}/>
              {pfPctMode&&pfPctValues.target&&pfForm.capital&&<div style={{fontSize:11,color:C.dim,fontFamily:"'Josefin Sans',sans-serif",marginTop:4}}>= {(parseFloat(pfForm.capital)*(parseFloat(pfPctValues.target)||0)/100).toFixed(0)}{currency}</div>}
            </Field>
            <Field label={pfPctMode?"Max Drawdown * (%)":`Max Drawdown * (${currency})`}>
              <input type="text" inputMode="numeric" placeholder="" value={pfPctMode?pfPctValues.maxLoss:pfForm.maxLoss} onChange={e=>{const v=e.target.value.replace(/,/g,".").replace(/[^0-9.]/g,"");if(pfPctMode){setPfPctValues(p=>({...p,maxLoss:v}));pfSet("maxLoss",pfForm.capital?String((parseFloat(pfForm.capital)*(parseFloat(v)||0)/100).toFixed(0)):"");}else pfSet("maxLoss",v);}} style={iStyle}/>
              {pfPctMode&&pfPctValues.maxLoss&&pfForm.capital&&<div style={{fontSize:11,color:C.dim,fontFamily:"'Josefin Sans',sans-serif",marginTop:4}}>= {(parseFloat(pfForm.capital)*(parseFloat(pfPctValues.maxLoss)||0)/100).toFixed(0)}{currency}</div>}
            </Field>
          </div>
          <Divider/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600}}>Daily Loss Limit</div>
            <button onClick={()=>pfSet("hasDailyLoss",!pfForm.hasDailyLoss)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${C.border}`,background:pfForm.hasDailyLoss?C.accent:"transparent",color:pfForm.hasDailyLoss?"#fff":C.gray1,fontSize:10,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase"}}>
              {pfForm.hasDailyLoss?"Activée":"Désactivée"}
            </button>
          </div>
          {pfForm.hasDailyLoss && (
            <Field label={pfPctMode?"Daily Loss (%)":"Daily Loss (€)"}>
              <input type="text" inputMode="numeric" placeholder="" value={pfPctMode?pfPctValues.dailyLoss:pfForm.dailyLoss} onChange={e=>{const v=e.target.value.replace(/,/g,".").replace(/[^0-9.]/g,"");if(pfPctMode){setPfPctValues(p=>({...p,dailyLoss:v}));pfSet("dailyLoss",pfForm.capital?String((parseFloat(pfForm.capital)*(parseFloat(v)||0)/100).toFixed(0)):"");}else pfSet("dailyLoss",v);}} style={iStyle}/>
              {pfPctMode&&pfPctValues.dailyLoss&&pfForm.capital&&<div style={{fontSize:11,color:C.dim,fontFamily:"'Josefin Sans',sans-serif",marginTop:4}}>= {(parseFloat(pfForm.capital)*(parseFloat(pfPctValues.dailyLoss)||0)/100).toFixed(0)}{currency}</div>}
            </Field>
          )}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,marginTop:4}}>
            <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600}}>Règle de Consistance</div>
            <button onClick={()=>pfSet("hasConsistency",!pfForm.hasConsistency)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${C.border}`,background:pfForm.hasConsistency?C.accent:"transparent",color:pfForm.hasConsistency?"#fff":C.gray1,fontSize:10,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase"}}>
              {pfForm.hasConsistency?"Activée":"Désactivée"}
            </button>
          </div>
          {pfForm.hasConsistency && (
            <Field label="% de consistance *">
              <input type="text" inputMode="numeric" placeholder="" value={pfForm.consistencyPct} onChange={e=>pfSet("consistencyPct",e.target.value.replace(/,/g,".").replace(/[^0-9.]/g,""))} style={iStyle}/>
            </Field>
          )}
          <Divider/>
          <button onClick={addPropfirm} disabled={!pfForm.firm||!pfForm.capital||!pfForm.target||!pfForm.maxLoss} style={{width:"100%",padding:"14px",borderRadius:4,border:"none",background:pfForm.firm&&pfForm.capital&&pfForm.target&&pfForm.maxLoss?C.accent:C.gray3,color:pfForm.firm&&pfForm.capital&&pfForm.target&&pfForm.maxLoss?"#fff":C.gray2,fontSize:12,fontWeight:600,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.2em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.3s"}}>
            Enregistrer →
          </button>
        </div>
      )}

      {/* ── FOND PROPRE FORM ── */}
      {pfView==="add-personal" && (
        <div>
          <Field label="Nom du compte (optionnel)">
            <input type="text" placeholder="ex: Eval 1, Compte principal..." value={pfForm.name} onChange={e=>pfSet("name",e.target.value)} style={iStyle}/>
          </Field>
          <Field label="Capital *">
            <input type="text" inputMode="numeric" placeholder="" value={pfForm.capital} onChange={e=>pfSet("capital",e.target.value.replace(/,/g,".").replace(/[^0-9.]/g,""))} style={iStyle}/>
          </Field>
          <Divider/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600}}>Daily Loss Limit</div>
            <button onClick={()=>pfSet("hasDailyLoss",!pfForm.hasDailyLoss)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${C.border}`,background:pfForm.hasDailyLoss?C.accent:"transparent",color:pfForm.hasDailyLoss?"#fff":C.gray1,fontSize:10,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase"}}>
              {pfForm.hasDailyLoss?"Activée":"Désactivée"}
            </button>
          </div>
          {pfForm.hasDailyLoss && (
            <Field label={pfPctMode?"Daily Loss (%)":"Daily Loss (€)"}>
              <input type="text" inputMode="numeric" placeholder="" value={pfPctMode?pfPctValues.dailyLoss:pfForm.dailyLoss} onChange={e=>{const v=e.target.value.replace(/,/g,".").replace(/[^0-9.]/g,"");if(pfPctMode){setPfPctValues(p=>({...p,dailyLoss:v}));pfSet("dailyLoss",pfForm.capital?String((parseFloat(pfForm.capital)*(parseFloat(v)||0)/100).toFixed(0)):"");}else pfSet("dailyLoss",v);}} style={iStyle}/>
              {pfPctMode&&pfPctValues.dailyLoss&&pfForm.capital&&<div style={{fontSize:11,color:C.dim,fontFamily:"'Josefin Sans',sans-serif",marginTop:4}}>= {(parseFloat(pfForm.capital)*(parseFloat(pfPctValues.dailyLoss)||0)/100).toFixed(0)}{currency}</div>}
            </Field>
          )}
          <Divider/>
          <button onClick={addPropfirm} disabled={!pfForm.capital} style={{width:"100%",padding:"14px",borderRadius:4,border:"none",background:pfForm.capital?C.accent:C.gray3,color:pfForm.capital?"#fff":C.gray2,fontSize:12,fontWeight:600,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.2em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.3s"}}>
            Enregistrer →
          </button>
        </div>
      )}

      {/* ── LIST ── */}
      {pfView==="list" && propfirms.length===0 && (
        <div style={{textAlign:"center",padding:"60px 0"}}>
          <div style={{fontSize:44,marginBottom:10,color:C.gray2}}>◉</div>
          <div style={{fontFamily:"'Josefin Sans',sans-serif",fontSize:14,fontWeight:300,color:C.gray1,marginBottom:14,letterSpacing:"0.08em"}}>Aucun compte enregistré</div>
          <button onClick={(e)=>{e.stopPropagation();setPfView("add-type");}} style={{background:C.accent,border:"none",borderRadius:4,padding:"11px 24px",color:darkMode?"#111":"#fff",fontSize:11,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,letterSpacing:"0.15em",textTransform:"uppercase",cursor:"pointer"}}>+ Ajouter un compte</button>
        </div>
      )}

      {pfView==="list" && propfirms.map((pf) => {
        const cap = parseFloat(pf.capital)||0;
        const target = parseFloat(pf.target)||0;
        const maxLoss = parseFloat(pf.maxLoss)||0;
        const pnl = getPfPnl(pf);
        const progress = Math.min(100, Math.max(0, (pnl/target)*100));
        const drawdown = Math.abs(Math.min(0,pnl));
        const ddProgress = Math.min(100, (drawdown/maxLoss)*100);
        const alerts = getPfAlerts(pf);
        const isInDanger = alerts.some(a=>a.type==="danger");
        return (
          <div key={pf.id} style={{background:C.bg2,border:`1px solid ${isInDanger?"rgba(192,57,43,0.3)":C.border}`,borderRadius:12,boxShadow:"0 4px 28px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.09), 0 -2px 24px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.32)",padding:!isMobile?"24px 20px":"18px 16px",marginBottom:!isMobile?18:14,cursor:editingPf?.id===pf.id?"default":"pointer"}} onClick={()=>{ if(!editingPf) setSelectedPf(pf); }}>
            {/* Header */}
            {editingPf?.id === pf.id ? (
              <div style={{marginBottom:12}}>
                <div style={{fontSize:10,color:C.dim,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:12}}>Modifier le compte</div>
                {pf.type==="propfirm" && <div style={{marginBottom:8}}><Label>Prop Firm</Label><input type="text" value={editingPf.firm||""} onChange={e=>setEditingPf(p=>({...p,firm:e.target.value}))} style={{...iStyle,padding:"9px 10px",fontSize:13}}/></div>}
                <div style={{marginBottom:8}}><Label>Nom du compte</Label><input type="text" value={editingPf.name||""} onChange={e=>setEditingPf(p=>({...p,name:e.target.value}))} style={{...iStyle,padding:"9px 10px",fontSize:13}}/></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                  <div><Label>Capital</Label><input type="text" inputMode="numeric" value={editingPf.capital||""} onChange={e=>setEditingPf(p=>({...p,capital:e.target.value.replace(/,/g,".").replace(/[^0-9.]/g,"")}))} style={{...iStyle,padding:"9px 10px",fontSize:13}}/></div>
                  {pf.type==="propfirm" && <div><Label>Profit Target</Label><input type="text" inputMode="numeric" value={editingPf.target||""} onChange={e=>setEditingPf(p=>({...p,target:e.target.value.replace(/,/g,".").replace(/[^0-9.]/g,"")}))} style={{...iStyle,padding:"9px 10px",fontSize:13}}/></div>}
                  {pf.type==="propfirm" && <div><Label>Max Drawdown</Label><input type="text" inputMode="numeric" value={editingPf.maxLoss||""} onChange={e=>setEditingPf(p=>({...p,maxLoss:e.target.value.replace(/,/g,".").replace(/[^0-9.]/g,"")}))} style={{...iStyle,padding:"9px 10px",fontSize:13}}/></div>}
                </div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600}}>Daily Loss</div>
                  <button onClick={()=>setEditingPf(p=>({...p,hasDailyLoss:!p.hasDailyLoss}))} style={{padding:"4px 10px",borderRadius:20,border:`1px solid ${C.border}`,background:editingPf.hasDailyLoss?C.accent:"transparent",color:editingPf.hasDailyLoss?"#fff":C.gray1,fontSize:10,fontFamily:"'Josefin Sans',sans-serif",cursor:"pointer",textTransform:"uppercase"}}>{editingPf.hasDailyLoss?"Activée":"Désactivée"}</button>
                </div>
                {editingPf.hasDailyLoss && <div style={{marginBottom:8}}><Label>Montant daily loss</Label><input type="text" inputMode="numeric" value={editingPf.dailyLoss||""} onChange={e=>setEditingPf(p=>({...p,dailyLoss:e.target.value.replace(/,/g,".").replace(/[^0-9.]/g,"")}))} style={{...iStyle,padding:"9px 10px",fontSize:13}}/></div>}
                {pf.type==="propfirm" && <>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                    <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600}}>Consistance</div>
                    <button onClick={()=>setEditingPf(p=>({...p,hasConsistency:!p.hasConsistency}))} style={{padding:"4px 10px",borderRadius:20,border:`1px solid ${C.border}`,background:editingPf.hasConsistency?C.accent:"transparent",color:editingPf.hasConsistency?"#fff":C.gray1,fontSize:10,fontFamily:"'Josefin Sans',sans-serif",cursor:"pointer",textTransform:"uppercase"}}>{editingPf.hasConsistency?"Activée":"Désactivée"}</button>
                  </div>
                  {editingPf.hasConsistency && (
                  <div style={{marginBottom:8}}><Label>% consistance</Label><input type="text" inputMode="numeric" value={editingPf.consistencyPct||""} onChange={e=>setEditingPf(p=>({...p,consistencyPct:e.target.value.replace(/,/g,".").replace(/[^0-9.]/g,"")}))} style={{...iStyle,padding:"9px 10px",fontSize:13}}/></div>
                  )}
                </>}
                <div style={{display:"flex",gap:7,marginTop:4}}>
                  <button onClick={()=>{setPropfirms(p=>p.map(x=>x.id===editingPf.id?{...editingPf}:x));setEditingPf(null);}} style={{flex:2,padding:"9px",borderRadius:4,border:"none",background:"radial-gradient(ellipse 90% 90% at 50% 38%, rgba(245,245,245,0.95) 0%, rgba(215,215,215,0.88) 55%, rgba(230,230,230,0.92) 100%)",color:"#111",fontSize:11,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>✓ Sauvegarder</button>
                  <button onClick={()=>setEditingPf(null)} style={{flex:1,padding:"9px",borderRadius:4,border:`1px solid ${C.gray3}`,background:"transparent",color:C.gray1,fontSize:11,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>Annuler</button>
                </div>
              </div>
            ) : (
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                <div>
                  <div style={{fontFamily:"'Barlow',sans-serif",fontWeight:600,fontSize:16,color:C.white,letterSpacing:"0.08em"}}>{pf.firm||"Fond Propre"}</div>
                  {pf.name && <div style={{fontSize:11,color:C.gray1,fontFamily:"'Josefin Sans',sans-serif",marginTop:2}}>{pf.name}</div>}
                  <div style={{fontSize:10,color:C.dim,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.1em",marginTop:4,textTransform:"uppercase"}}>{cap.toLocaleString()}{currency}{pf.type==="propfirm"?` · ${progress.toFixed(0)}% / ${target.toLocaleString()}${currency}`:" · Fond Propre"}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:"'Josefin Sans',sans-serif",fontWeight:300,fontSize:20,color:pnl>=0?"#2a6e3a":"#c0392b",letterSpacing:"0.03em"}}>{(cap+pnl).toFixed(0)}{currency}</div>
                    <div style={{fontSize:10,color:C.gray1,fontFamily:"'Josefin Sans',sans-serif"}}>{pnl>=0?"+":""}{pnl.toFixed(0)}{currency} · Capital actuel</div>
                  </div>

                </div>
              </div>
            )}

            {editingPf?.id !== pf.id && pf.type==="propfirm" && <div style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:10,color:C.dim,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.1em",textTransform:"uppercase"}}>Profit Target</span>
                <span style={{fontSize:10,color:C.dim,fontFamily:"'Josefin Sans',sans-serif"}}>{progress.toFixed(0)}%</span>
              </div>
              <div style={{height:5,background:C.gray3,borderRadius:3,marginBottom:pf.hasDailyLoss&&parseFloat(pf.dailyLoss)>0?8:0}}>
                <div style={{width:progress+"%",height:"100%",borderRadius:3,background:"#2a6e3a",transition:"width 0.5s"}}/>
              </div>
              {pf.hasDailyLoss && parseFloat(pf.dailyLoss)>0 && (()=>{
                const dl=parseFloat(pf.dailyLoss);
                const todayStr=new Date().toISOString().split("T")[0];
                const todayLoss=Math.abs(Math.min(0,trades.filter(t=>t.date===todayStr&&(!t.accountIds||t.accountIds.length===0||t.accountIds.includes(pf.id))).reduce((s,t)=>s+(t.pnl||0),0)));
                const dlPct=Math.min(100,(todayLoss/dl)*100);
                const over=todayLoss>=dl;
                return (
                  <div>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:10,color:over?"rgba(192,57,43,0.9)":C.dim,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.1em",textTransform:"uppercase"}}>Daily Loss</span>
                      <span style={{fontSize:10,color:over?"rgba(192,57,43,0.9)":C.dim,fontFamily:"'Josefin Sans',sans-serif"}}>{todayLoss.toFixed(0)}{currency} / {dl}€</span>
                    </div>
                    <div style={{height:5,background:C.gray3,borderRadius:3}}>
                      <div style={{width:dlPct+"%",height:"100%",borderRadius:3,background:over?"rgba(192,57,43,0.9)":dlPct>=70?"rgba(192,57,43,0.5)":"rgba(192,57,43,0.3)",transition:"width 0.5s"}}/>
                    </div>
                  </div>
                );
              })()}
            </div>}

            {pf.type==="propfirm" && <div style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:10,color:C.dim,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.1em",textTransform:"uppercase"}}>Drawdown</span>
                <span style={{fontSize:10,color:ddProgress>=80?"rgba(192,57,43,0.8)":C.dim,fontFamily:"'Josefin Sans',sans-serif"}}>{drawdown.toFixed(0)}{currency} / {maxLoss}{currency}</span>
              </div>
              <div style={{height:5,background:C.gray3,borderRadius:3}}>
                <div style={{width:ddProgress+"%",height:"100%",borderRadius:3,background:ddProgress>=80?"rgba(192,57,43,0.9)":ddProgress>=50?"rgba(192,57,43,0.5)":"rgba(192,57,43,0.25)",transition:"width 0.5s"}}/>
              </div>
            </div>}

            {editingPf?.id !== pf.id && (() => {
              const acctTrades = trades.filter(t => !t.accountIds||t.accountIds.length===0||t.accountIds.includes(pf.id));
              const acctWins = acctTrades.filter(t=>t.result==="WIN").length;
              const acctWr = acctTrades.length ? Math.round(acctWins/acctTrades.length*100) : 0;
              const acctAvgRR = acctTrades.length ? (acctTrades.reduce((s,t)=>s+(parseFloat(t.rr)||0),0)/acctTrades.length).toFixed(1) : "—";
              const todayTrades = acctTrades.filter(t=>t.date===new Date().toISOString().split("T")[0]);
              const todayPnl = todayTrades.reduce((s,t)=>s+(t.pnl||0),0);
              return (
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10,marginTop:4}}>
                  <div style={{background:C.bg3,borderRadius:6,padding:"8px 10px"}}>
                    <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:"'Josefin Sans',sans-serif",marginBottom:3}}>Trades</div>
                    <div style={{fontSize:14,color:C.white,fontFamily:"'Josefin Sans',sans-serif",fontWeight:300}}>{acctTrades.length}</div>
                  </div>
                  <div style={{background:C.bg3,borderRadius:6,padding:"8px 10px"}}>
                    <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:"'Josefin Sans',sans-serif",marginBottom:3}}>Win Rate</div>
                    <div style={{fontSize:14,color:C.white,fontFamily:"'Josefin Sans',sans-serif",fontWeight:300}}>{acctWr}%</div>
                  </div>
                  <div style={{background:C.bg3,borderRadius:6,padding:"8px 10px"}}>
                    <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:"'Josefin Sans',sans-serif",marginBottom:3}}>RR Moy.</div>
                    <div style={{fontSize:14,color:C.white,fontFamily:"'Josefin Sans',sans-serif",fontWeight:300}}>{acctAvgRR}</div>
                  </div>
                  <div style={{background:C.bg3,borderRadius:6,padding:"8px 10px",gridColumn:"1/-1"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:3}}>
                      <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:"'Josefin Sans',sans-serif"}}>Aujourd'hui</div>
                      {pf.hasConsistency && pf.consistencyPct && pf.target && (
                        <div style={{fontSize:9,color:C.dim,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.06em"}}>
                          max {(parseFloat(pf.target)*parseFloat(pf.consistencyPct)/100).toFixed(0)}{currency}
                        </div>
                      )}
                    </div>
                    <div style={{fontSize:14,color:todayPnl>=0?"#2a6e3a":"#c0392b",fontFamily:"'Josefin Sans',sans-serif",fontWeight:300,marginBottom:pf.hasConsistency&&pf.consistencyPct&&pf.target?8:0}}>{todayPnl>=0?"+":""}{todayPnl.toFixed(0)}{currency} · {todayTrades.length} trade{todayTrades.length!==1?"s":""}</div>
                    {pf.hasConsistency && pf.consistencyPct && pf.target && (() => {
                      const maxD = parseFloat(pf.target)*parseFloat(pf.consistencyPct)/100;
                      const todayGain = Math.max(0, todayPnl);
                      const gaugePct = Math.min(100, maxD>0 ? (todayGain/maxD)*100 : 0);
                      const isOver = todayGain >= maxD;
                      return (
                        <div>
                          <div style={{height:4,background:"rgba(0,0,0,0.1)",borderRadius:2,marginBottom:4}}>
                            <div style={{width:gaugePct+"%",height:"100%",borderRadius:2,background:isOver?"rgba(192,57,43,0.7)":gaugePct>=80?"rgba(180,120,0,0.6)":C.accent,transition:"width 0.5s"}}/>
                          </div>
                          <div style={{fontSize:10,color:isOver?"rgba(192,57,43,0.8)":C.gray1,fontFamily:"'Josefin Sans',sans-serif"}}>
                            {isOver ? "Limite de consistance atteinte" : `${(maxD-todayGain).toFixed(0)}${currency} restants`}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })()}
            {editingPf?.id !== pf.id && <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:alerts.length?10:0}}>
              <span style={{fontSize:9,color:pf.type==="propfirm"?C.dim:"#555",background:C.bg3,padding:"3px 8px",borderRadius:3,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.08em",border:`1px solid ${C.gray3}`}}>{pf.type==="propfirm"?"Prop Firm":"Fond Propre"}</span>
              {pf.hasDailyLoss && <span style={{fontSize:9,color:C.dim,background:C.bg3,padding:"3px 8px",borderRadius:3,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.08em",border:`1px solid ${C.gray3}`}}>Daily Loss {pf.dailyLoss}€</span>}
              {pf.hasConsistency && <span style={{fontSize:9,color:C.dim,background:C.bg3,padding:"3px 8px",borderRadius:3,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.08em",border:`1px solid ${C.gray3}`}}>Consistance</span>}
            </div>}


            {editingPf?.id !== pf.id && alerts.map((a,i) => (
              <div key={i} style={{padding:"8px 10px",borderRadius:4,marginTop:6,background:a.type==="danger"?"rgba(192,57,43,0.08)":a.type==="warn"?"rgba(180,120,0,0.08)":a.type==="success"?"rgba(42,110,58,0.08)":"rgba(0,0,0,0.04)",border:`1px solid ${a.type==="danger"?"rgba(192,57,43,0.25)":a.type==="warn"?"rgba(180,120,0,0.25)":a.type==="success"?"rgba(42,110,58,0.25)":C.border}`}}>
                <div style={{fontSize:12,color:C.white,fontFamily:"'Josefin Sans',sans-serif",lineHeight:1.5}}>{a.msg}</div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );


  // ── Account Detail JSX ──
  const accountDetailContent = (pf, desktop) => {
    const acctTrades = trades.filter(t => !t.accountIds || t.accountIds.length===0 || t.accountIds.includes(pf.id));
    const todayStr = new Date().toISOString().split("T")[0];

    // All-time stats
    const allPnl = acctTrades.reduce((s,t)=>s+(t.pnl||0),0);
    const allWins = acctTrades.filter(t=>t.result==="WIN").length;
    const allLosses = acctTrades.filter(t=>t.result==="LOSS").length;
    const allTotal = acctTrades.length;
    const allWinRate = allTotal ? Math.round(allWins/allTotal*100) : 0;
    const allAvgWin = allWins ? acctTrades.filter(t=>t.result==="WIN").reduce((s,t)=>s+(t.pnl||0),0)/allWins : 0;
    const allAvgLoss = allLosses ? Math.abs(acctTrades.filter(t=>t.result==="LOSS").reduce((s,t)=>s+(t.pnl||0),0)/allLosses) : 0;
    const profitFactor = allAvgLoss>0 ? (allAvgWin*allWins/(allAvgLoss*allLosses)).toFixed(2) : "∞";
    const allAvgRR = allTotal ? (acctTrades.reduce((s,t)=>s+(parseFloat(t.rr)||0),0)/allTotal).toFixed(1) : "—";
    const bestDay = (() => { const byD={}; acctTrades.forEach(t=>{byD[t.date]=(byD[t.date]||0)+(t.pnl||0);}); return Math.max(0,...Object.values(byD)); })();
    const worstDay = (() => { const byD={}; acctTrades.forEach(t=>{byD[t.date]=(byD[t.date]||0)+(t.pnl||0);}); return Math.min(0,...Object.values(byD)); })();

    // Drawdown calculation
    const cap = parseFloat(pf.capital)||0;
    const target = parseFloat(pf.target)||0;
    const maxLoss = parseFloat(pf.maxLoss)||0;
    const progress = target ? Math.min(100,Math.max(0,(allPnl/target)*100)) : 0;
    const drawdown = Math.abs(Math.min(0,allPnl));
    const ddProgress = maxLoss ? Math.min(100,(drawdown/maxLoss)*100) : 0;

    // Monthly stats (calendar month)
    const pfFiltered = acctTrades.filter(t => {
      const d = new Date(t.date+"T12:00:00");
      return d.getFullYear()===pfCalYear && d.getMonth()===pfCalMonth;
    });
    const pfTotal = pfFiltered.length;
    const pfWins = pfFiltered.filter(t=>t.result==="WIN").length;
    const pfPnl = pfFiltered.reduce((s,t)=>s+(t.pnl||0),0);
    const pfWinRate = pfTotal ? Math.round(pfWins/pfTotal*100) : 0;
    const pfAvgRR = pfTotal ? (pfFiltered.reduce((s,t)=>s+(parseFloat(t.rr)||0),0)/pfTotal).toFixed(1) : "—";

    // Today
    const todayTrades = acctTrades.filter(t=>t.date===todayStr);
    const statsTrades = acctView==="global" ? acctTrades : todayTrades;
    const todayPnl = todayTrades.reduce((s,t)=>s+(t.pnl||0),0);

    // Session breakdown (all time)
    const sessionData = SESSIONS.map(s => {
      const st = acctTrades.filter(t=>t.session===s);
      const wr = st.length ? Math.round(st.filter(t=>t.result==="WIN").length/st.length*100) : 0;
      return { name:s.replace(" ","\n"), fullName:s, count:st.length, wr, pnl:st.reduce((a,t)=>a+(t.pnl||0),0) };
    }).filter(s=>s.count>0);

    // Emotion breakdown
    const emotionData = EMOTIONS.map(e => {
      const et = acctTrades.filter(t=>t.emotion===e);
      const wr = et.length ? Math.round(et.filter(t=>t.result==="WIN").length/et.length*100) : 0;
      return { name:e, count:et.length, wr, pnl:et.reduce((a,t)=>a+(t.pnl||0),0) };
    }).filter(e=>e.count>0);

    // Instrument breakdown
    const instrData = (() => {
      const byI = {};
      acctTrades.forEach(t=>{ if(!byI[t.instrument]) byI[t.instrument]={count:0,wins:0,pnl:0}; byI[t.instrument].count++; if(t.result==="WIN") byI[t.instrument].wins++; byI[t.instrument].pnl+=t.pnl||0; });
      return Object.entries(byI).map(([name,v])=>({name,count:v.count,wr:Math.round(v.wins/v.count*100),pnl:v.pnl})).sort((a,b)=>b.count-a.count);
    })();

    const alerts = getPfAlerts(pf);

    const MiniCard = ({label, value, color, sub}) => {
      return (
        <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:14,boxShadow:"0 6px 32px rgba(0,0,0,0.65), 0 2px 8px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.1), 0 -2px 28px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.36)",padding:!isMobile?"20px 20px":"12px 14px"}}>
          <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,marginBottom:!isMobile?10:6}}>{label}</div>
          <div style={{fontSize:!isMobile?28:20,fontWeight:300,color:color||C.white,fontFamily:"'Josefin Sans',sans-serif",lineHeight:1}}>{value}</div>
          {sub && <div style={{fontSize:11,color:C.gray1,fontFamily:"'Josefin Sans',sans-serif",marginTop:6}}>{sub}</div>}
        </div>
      );
    };

    const SECTION_LABELS = { progress:"Progression", today:"Aujourd'hui", stats:"Statistiques", calendar:"Calendrier", trades:"Trades" };

    const dragHandlers = (id) => !acctCustomizing ? {} : {
      draggable: true,
      onDragStart: (e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", id); },
      onDragOver: (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setAcctDragOver(id); },
      onDragLeave: () => setAcctDragOver(null),
      onDrop: (e) => {
        e.preventDefault();
        const from = e.dataTransfer.getData("text/plain");
        if (from === id) { setAcctDragOver(null); return; }
        setAcctLayout(prev => {
          const arr = [...prev];
          const fi = arr.indexOf(from), ti = arr.indexOf(id);
          if (fi < 0 || ti < 0) return prev;
          arr.splice(fi, 1);
          arr.splice(ti, 0, from);
          return arr;
        });
        setAcctDragOver(null);
      },
    };

    const wrapSection = (id, content) => {
      if (!content) return null;
      const isOver = acctDragOver === id;
      return (
        <div key={id} {...dragHandlers(id)} style={{position:"relative", cursor:acctCustomizing?"grab":"default", transition:"opacity 0.18s", opacity:acctCustomizing?0.9:1, outline:isOver?`2px dashed ${C.gray2}`:"none", outlineOffset:4, borderRadius:12}}>
          {acctCustomizing && (
            <div style={{position:"absolute",top:8,right:8,zIndex:10,display:"flex",alignItems:"center",gap:6,pointerEvents:"none"}}>
              <div style={{fontSize:9,color:C.gray1,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.12em",textTransform:"uppercase",background:C.bg3,padding:"3px 8px",borderRadius:4,border:`1px solid ${C.border}`}}>{SECTION_LABELS[id]}</div>
              <span style={{color:C.gray1,fontSize:13,lineHeight:1}}>⠿</span>
            </div>
          )}
          {content}
        </div>
      );
    };

    const sectionProgress = pf.type==="propfirm" ? (
      <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:12,boxShadow:"0 4px 28px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.09), 0 -2px 24px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.32)",padding:!isMobile?"22px 20px":"14px 16px",marginBottom:!isMobile?16:12}}>
        <div style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:10,color:C.dim,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.1em",textTransform:"uppercase"}}>Profit Target</span>
            <span style={{fontSize:10,color:C.dim,fontFamily:"'Josefin Sans',sans-serif"}}>{allPnl.toFixed(0)}{currency} / {target}{currency} · {progress.toFixed(0)}%</span>
          </div>
          <div style={{height:6,background:C.gray3,borderRadius:3}}>
            <div style={{width:progress+"%",height:"100%",borderRadius:3,background:"#2a6e3a",transition:"width 0.6s"}}/>
          </div>
        </div>
        <div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:10,color:C.dim,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.1em",textTransform:"uppercase"}}>Drawdown Max</span>
            <span style={{fontSize:10,color:ddProgress>=80?"rgba(192,57,43,0.9)":C.dim,fontFamily:"'Josefin Sans',sans-serif"}}>{drawdown.toFixed(0)}{currency} / {maxLoss}{currency}</span>
          </div>
          <div style={{height:6,background:C.gray3,borderRadius:3}}>
            <div style={{width:ddProgress+"%",height:"100%",borderRadius:3,background:ddProgress>=80?"rgba(192,57,43,0.9)":ddProgress>=50?"rgba(192,57,43,0.5)":"rgba(192,57,43,0.25)",transition:"width 0.6s"}}/>
          </div>
        </div>
        {pf.hasDailyLoss && parseFloat(pf.dailyLoss)>0 && (()=>{
          const dl=parseFloat(pf.dailyLoss);
          const todayLossDL=Math.abs(Math.min(0,todayPnl));
          const dlPct=Math.min(100,(todayLossDL/dl)*100);
          const over=todayLossDL>=dl;
          return (
            <div style={{marginTop:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:10,color:over?"rgba(192,57,43,0.9)":C.dim,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.1em",textTransform:"uppercase"}}>Daily Loss</span>
                <span style={{fontSize:10,color:over?"rgba(192,57,43,0.9)":C.dim,fontFamily:"'Josefin Sans',sans-serif"}}>{todayLossDL.toFixed(0)}{currency} / {dl}€{over?" 🔴":""}</span>
              </div>
              <div style={{height:6,background:C.gray3,borderRadius:3}}>
                <div style={{width:dlPct+"%",height:"100%",borderRadius:3,background:over?"rgba(192,57,43,0.9)":dlPct>=70?"rgba(192,57,43,0.5)":"rgba(192,57,43,0.3)",transition:"width 0.6s"}}/>
              </div>
            </div>
          );
        })()}
      </div>
    ) : null;

    const sectionToday = (
      <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:12,boxShadow:"0 4px 28px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.09), 0 -2px 24px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.32)",padding:!isMobile?"22px 20px":"14px 16px",marginBottom:!isMobile?16:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:pf.hasConsistency&&pf.consistencyPct&&pf.target?10:0}}>
          <div>
            <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,marginBottom:4}}>Aujourd'hui</div>
            <div style={{fontSize:22,color:todayPnl>=0?"#2a6e3a":"#c0392b",fontFamily:"'Josefin Sans',sans-serif",fontWeight:300}}>{todayPnl>=0?"+":""}{todayPnl.toFixed(0)}{currency}</div>
            <div style={{fontSize:10,color:C.gray1,fontFamily:"'Josefin Sans',sans-serif",marginTop:2}}>{todayTrades.length} trade{todayTrades.length!==1?"s":""}</div>
          </div>
          {pf.hasConsistency&&pf.consistencyPct&&pf.target&&(()=>{
            const maxD=parseFloat(pf.target)*parseFloat(pf.consistencyPct)/100;
            const g=Math.max(0,todayPnl);
            const gp=Math.min(100,maxD>0?(g/maxD)*100:0);
            const over=g>=maxD;
            return (
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:"'Josefin Sans',sans-serif",marginBottom:4}}>Consistance · max {maxD.toFixed(0)}{currency}</div>
                <div style={{width:120,height:6,background:C.gray3,borderRadius:3,marginLeft:"auto",marginBottom:4}}>
                  <div style={{width:gp+"%",height:"100%",borderRadius:3,background:over?"rgba(192,57,43,0.8)":gp>=80?"rgba(180,120,0,0.6)":"#2a6e3a",transition:"width 0.5s"}}/>
                </div>
                <div style={{fontSize:10,color:over?"rgba(192,57,43,0.8)":C.gray1,fontFamily:"'Josefin Sans',sans-serif"}}>{over?"🔴 Limite atteinte":`${(maxD-g).toFixed(0)}${currency} restants`}</div>
              </div>
            );
          })()}
        </div>
      </div>
    );

    const sectionStats = (
      <div>
        {(() => {
          const todayWins=statsTrades.filter(t=>t.result==="WIN").length;
          const todayLosses=statsTrades.filter(t=>t.result==="LOSS").length;
          const todayTotal=statsTrades.length;
          const todayWR=todayTotal?Math.round(todayWins/todayTotal*100):0;
          const todayAvgW=todayWins?statsTrades.filter(t=>t.result==="WIN").reduce((s,t)=>s+(t.pnl||0),0)/todayWins:0;
          const todayAvgL=todayLosses?Math.abs(statsTrades.filter(t=>t.result==="LOSS").reduce((s,t)=>s+(t.pnl||0),0)/todayLosses):0;
          const todayPF=todayAvgL>0?(todayAvgW*todayWins/(todayAvgL*todayLosses)).toFixed(2):todayWins>0?"∞":"—";
          const todayRR=todayTotal?(statsTrades.reduce((s,t)=>s+(parseFloat(t.rr)||0),0)/todayTotal).toFixed(1):"—";
          return (
            <div style={{marginBottom:12}}>
              <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,marginBottom:8}}>Statistiques · {acctView==="global"?"Global":"Aujourd'hui"}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:8}}>
                <MiniCard label="Profit Factor" value={todayPF==="—"||todayPF==="∞"?todayPF:todayPF+"x"} color={parseFloat(todayPF)>=1||todayPF==="∞"?"#2a6e3a":"#c0392b"} li={0}/>
                <MiniCard label="RR Moyen" value={todayRR==="—"?"—":todayRR+":1"} color={C.dim} li={1}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr",gap:8}}>
                <MiniCard label="Nb Trades" value={todayTotal||"—"} color={C.white} li={2}/>
              </div>
            </div>
          );
        })()}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
          <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:14,boxShadow:"0 6px 32px rgba(0,0,0,0.65), 0 2px 8px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.1), 0 -2px 28px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.36)",padding:!isMobile?"30px 24px":"14px",display:"flex",flexDirection:"column",alignItems:"center"}}>
            <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,marginBottom:4,alignSelf:"flex-start"}}>Winrate · {acctView==="global"?"Global":"Aujourd'hui"}</div>
            {(() => { const tw=statsTrades.filter(t=>t.result==="WIN").length; const tl=statsTrades.filter(t=>t.result==="LOSS").length; const tt=statsTrades.length; return tt>0 ? (((wins, losses, total, size=130) => {
              const r=46, cx=size/2, cy=size*0.52, sw=13, PI=Math.PI;
              const wFrac=total>0?wins/total:0;
              const lFrac=total>0?losses/total:0;
              const wr=total?Math.round(wins/total*100):0;
              const LEFT={x:cx-r,y:cy}, RIGHT={x:cx+r,y:cy};
              const angleToXY=(deg)=>({x:cx+r*Math.cos(deg*PI/180), y:cy-r*Math.sin(deg*PI/180)});
              const bgArc=`M${LEFT.x},${LEFT.y} A${r},${r} 0 0 1 ${RIGHT.x},${RIGHT.y}`;
              const wDeg=180-wFrac*180;
              const wPt=angleToXY(wDeg);
              const winArc=wFrac>0.01?`M${LEFT.x},${LEFT.y} A${r},${r} 0 ${wFrac>=1?1:0} 1 ${wPt.x.toFixed(1)},${wPt.y.toFixed(1)}`:"";
              const lDeg=lFrac*180;
              const lPt=angleToXY(lDeg);
              const lossArc=lFrac>0.01?`M${RIGHT.x},${RIGHT.y} A${r},${r} 0 ${lFrac>=1?1:0} 0 ${lPt.x.toFixed(1)},${lPt.y.toFixed(1)}`:"";
              const labY=cy+r+16;
              return (
                <svg width={size} height={cy+r+20} style={{overflow:"visible"}}>
                  <path d={bgArc} stroke={C.gray3} strokeWidth={sw} fill="none" strokeLinecap="round"/>
                  {wFrac>0.01&&<path d={winArc} stroke="#2a6e3a" strokeWidth={sw} fill="none" strokeLinecap="round"/>}
                  {lFrac>0.01&&<path d={lossArc} stroke="#c0392b" strokeWidth={sw} fill="none" strokeLinecap="round"/>}
                  <text x={cx} y={cy-2} textAnchor="middle" fontSize={20} fontWeight={300} fill={wr>=50?"#2a6e3a":"#c0392b"} fontFamily="'Josefin Sans',sans-serif">{wr}%</text>
                  <text x={cx} y={cy+13} textAnchor="middle" fontSize={7} fill={C.dim} fontFamily="'Josefin Sans',sans-serif" letterSpacing="1.5">WIN RATE</text>
                  <text x={4} y={labY} textAnchor="start" fontSize={10} fontWeight="600" fill="#2a6e3a" fontFamily="'Josefin Sans',sans-serif">{wins}W</text>
                  <text x={cx} y={labY} textAnchor="middle" fontSize={10} fill={C.gray2} fontFamily="'Josefin Sans',sans-serif">{total-wins-losses}BE</text>
                  <text x={size-4} y={labY} textAnchor="end" fontSize={10} fontWeight="600" fill="#c0392b" fontFamily="'Josefin Sans',sans-serif">{losses}L</text>
                </svg>
              );
            })(tw,tl,tt,140)) : <div style={{padding:"20px 0",color:C.gray2,fontSize:11,fontFamily:"'Josefin Sans',sans-serif",textAlign:"center"}}>Aucun trade{acctView==="today"?" aujourd'hui":""}</div>; })()}
          </div>
          {(()=>{
            const srcTrades = acctView==="global"?acctTrades:todayTrades;
            const total = srcTrades.length;
            const isDark = C.bg === "#0f0f0f";
            const barColor = isDark ? "#e8e8e8" : "#1a1a1a";
            const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";
            const dirs = ["LONG","SHORT"].map(d=>{
              const dt=srcTrades.filter(t=>t.direction===d);
              const dw=dt.filter(t=>t.result==="WIN").length;
              const dpnl=dt.reduce((s,t)=>s+(t.pnl||0),0);
              const dwr=dt.length?Math.round(dw/dt.length*100):0;
              const usagePct=total?Math.round(dt.length/total*100):0;
              return {d,count:dt.length,dpnl,dwr,usagePct};
            });
            const chartData = dirs.map(x=>({d:x.d, pct:x.usagePct}));
            const CustomTooltip = ({active,payload})=>{
              if(!active||!payload?.length) return null;
              const label = payload[0].payload.d;
              const item = dirs.find(x=>x.d===label);
              if(!item) return null;
              return (
                <div style={{background:isDark?"rgba(18,18,18,0.95)":"rgba(255,255,255,0.97)",border:`1px solid ${isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.1)"}`,borderRadius:8,padding:"10px 14px",boxShadow:"0 8px 24px rgba(0,0,0,0.2)",fontFamily:"'Josefin Sans',sans-serif"}}>
                  <div style={{fontSize:11,color:C.white,fontWeight:700,marginBottom:4,letterSpacing:"0.1em"}}>{label}</div>
                  <div style={{fontSize:10,color:C.gray1,marginBottom:2}}>{item.count} trade{item.count!==1?"s":""} · {item.usagePct}%</div>
                  <div style={{fontSize:10,color:C.gray1,marginBottom:2}}>WR {item.dwr}%</div>
                  <div style={{fontSize:10,color:item.dpnl>=0?"#4caf6e":"#e05a5a",fontWeight:600}}>{item.dpnl>=0?"+":""}{item.dpnl.toFixed(0)}{currency}</div>
                </div>
              );
            };
            return (
              <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:12,boxShadow:"0 4px 28px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.09), 0 -2px 24px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.32)",padding:"16px 16px 12px"}}>
                <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,marginBottom:2}}>Direction · {acctView==="global"?"Global":"Aujourd'hui"}</div>
                <div style={{fontSize:9,color:C.gray2,fontFamily:"'Josefin Sans',sans-serif",marginBottom:10}}>{total} trade{total!==1?"s":""} au total</div>
                <ResponsiveContainer width="100%" height={130}>
                  <BarChart data={chartData} margin={{top:22,right:12,left:12,bottom:0}} barCategoryGap="30%">
                    <CartesianGrid vertical={false} stroke={gridColor} strokeDasharray="4 4"/>
                    <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{fontSize:10,fill:C.gray1,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,letterSpacing:"0.08em"}} dy={6}/>
                    <Tooltip content={<CustomTooltip/>} cursor={{fill:isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)",radius:6}}/>
                    <Bar dataKey="pct" fill={barColor} radius={[6,6,2,2]} maxBarSize={60}>
                      <LabelList dataKey="pct" position="top" offset={8} formatter={v=>v+"%"} style={{fontSize:11,fill:C.white,fontFamily:"'Josefin Sans',sans-serif",fontWeight:700}}/>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{display:"flex",gap:8,marginTop:8}}>
                  {dirs.map(x=>(
                    <div key={x.d} style={{flex:1,background:isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)",borderRadius:8,padding:"8px 10px"}}>
                      <div style={{fontSize:9,color:C.dim,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3}}>{x.d}</div>
                      <div style={{fontSize:12,color:C.white,fontFamily:"'Josefin Sans',sans-serif",fontWeight:700}}>{x.count}T · {x.dwr}%<span style={{fontWeight:400,color:C.gray1}}> WR</span></div>
                      <div style={{fontSize:10,color:x.dpnl>=0?"#4caf6e":"#e05a5a",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,marginTop:1}}>{x.dpnl>=0?"+":""}{x.dpnl.toFixed(0)}{currency}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
        <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:12,boxShadow:"0 4px 28px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.09), 0 -2px 24px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.32)",padding:!isMobile?"24px 20px 14px":"16px 14px 10px",marginBottom:!isMobile?16:12}}>
          <div style={{fontSize:9,color:C.dim,letterSpacing:"0.2em",textTransform:"uppercase",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,marginBottom:10}}>Courbe d'équité</div>
          {(acctView==="global"?acctTrades:todayTrades).length>1 ? <PnlChart filtered={acctView==="global"?acctTrades:todayTrades} capital={pf.capital} pnlSum={acctView==="global"?allPnl:todayTrades.reduce((s,t)=>s+(t.pnl||0),0)} height={!isMobile?260:160} cur={currency}/>
          : <div style={{textAlign:"center",padding:"32px 0",color:C.gray2,fontSize:11,fontFamily:"'Josefin Sans',sans-serif"}}>Aucun trade</div>}
        </div>
        {(() => { const todaySessions = SESSIONS.map(s=>{const st=(acctView==="global"?acctTrades:todayTrades).filter(t=>t.session===s);const wr=st.length?Math.round(st.filter(t=>t.result==="WIN").length/st.length*100):0;return{name:s,count:st.length,wr,pnl:st.reduce((a,t)=>a+(t.pnl||0),0)};}).filter(s=>s.count>0); return todaySessions.length>0 && (
          <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:12,boxShadow:"0 4px 28px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.09), 0 -2px 24px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.32)",padding:!isMobile?"22px 20px":"14px 16px",marginBottom:!isMobile?16:12}}>
            <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,marginBottom:12}}>Sessions · {acctView==="global"?"Global":"Aujourd'hui"}</div>
            {todaySessions.map(s=>(
              <div key={s.name} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:11,color:C.white,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.06em",textTransform:"uppercase"}}>{s.name}</span>
                  <span style={{fontSize:11,color:s.pnl>=0?"#2a6e3a":"#c0392b",fontFamily:"'Josefin Sans',sans-serif"}}>{s.pnl>=0?"+":""}{s.pnl.toFixed(0)}{currency} · {s.wr}% · {s.count}T</span>
                </div>
                <div style={{height:5,background:C.gray3,borderRadius:3}}>
                  <div style={{width:s.wr+"%",height:"100%",borderRadius:3,background:s.pnl>=0?"#2a6e3a":"#c0392b",transition:"width 0.5s"}}/>
                </div>
              </div>
            ))}
          </div>
        );
        })()}
        {(() => { const todayInstr = (() => { const byI={}; (acctView==="global"?acctTrades:todayTrades).forEach(t=>{ if(!byI[t.instrument]) byI[t.instrument]={count:0,wins:0,pnl:0}; byI[t.instrument].count++; if(t.result==="WIN") byI[t.instrument].wins++; byI[t.instrument].pnl+=t.pnl||0; }); return Object.entries(byI).map(([name,v])=>({name,count:v.count,wr:Math.round(v.wins/v.count*100),pnl:v.pnl})); })(); return todayInstr.length>0 && (
          <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:12,boxShadow:"0 4px 28px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.09), 0 -2px 24px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.32)",padding:!isMobile?"22px 20px":"14px 16px",marginBottom:!isMobile?16:12}}>
            <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,marginBottom:12}}>Instruments · {acctView==="global"?"Global":"Aujourd'hui"}</div>
            {todayInstr.map(i=>(
              <div key={i.name} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:11,color:C.white,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600}}>{i.name}</span>
                  <span style={{fontSize:11,color:i.pnl>=0?"#2a6e3a":"#c0392b",fontFamily:"'Josefin Sans',sans-serif"}}>{i.pnl>=0?"+":""}{i.pnl.toFixed(0)}{currency} · {i.wr}% · {i.count}T</span>
                </div>
                <div style={{height:4,background:C.gray3,borderRadius:2}}>
                  <div style={{width:i.wr+"%",height:"100%",borderRadius:2,background:i.pnl>=0?"#2a6e3a":"#c0392b",transition:"width 0.5s"}}/>
                </div>
              </div>
            ))}
          </div>
        );
        })()}
        {(() => {
          const todayEmotions = EMOTIONS.map(e => {
            const et = (acctView==="global"?acctTrades:todayTrades).filter(t=>t.emotion===e);
            const wr = et.length ? Math.round(et.filter(t=>t.result==="WIN").length/et.length*100) : 0;
            return { name:e, count:et.length, wr, pnl:et.reduce((a,t)=>a+(t.pnl||0),0) };
          }).filter(e=>e.count>0);
          return todayEmotions.length>0 ? (
            <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:12,boxShadow:"0 4px 28px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.09), 0 -2px 24px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.32)",padding:!isMobile?"22px 20px":"14px 16px",marginBottom:!isMobile?16:12}}>
              <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,marginBottom:12}}>Émotions · {acctView==="global"?"Global":"Aujourd'hui"}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {todayEmotions.map(e=>(
                  <div key={e.name} style={{background:C.bg3,borderRadius:6,padding:"10px 12px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:11,color:C.white,fontFamily:"'Josefin Sans',sans-serif"}}>{e.name}</span>
                      <span style={{fontSize:10,color:e.wr>=50?"#2a6e3a":"#c0392b",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600}}>{e.wr}%</span>
                    </div>
                    <div style={{fontSize:10,color:C.gray1,fontFamily:"'Josefin Sans',sans-serif"}}>{e.count}T · {e.pnl>=0?"+":""}{e.pnl.toFixed(0)}{currency}</div>
                    <div style={{height:3,background:C.gray2,borderRadius:2,marginTop:6}}>
                      <div style={{width:e.wr+"%",height:"100%",borderRadius:2,background:e.wr>=50?"#2a6e3a":"#c0392b"}}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null;
        })()}
      </div>
    );

    const sectionCalendar = (
      <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:12,boxShadow:"0 4px 28px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.09), 0 -2px 24px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.32)",padding:"16px 14px",marginBottom:12}}>
        <Calendar filtered={acctTrades} calMonth={pfCalMonth} calYear={pfCalYear} onPrev={prevPfMonth} onNext={nextPfMonth} cur={currency} onDayClick={({day,month,year})=>{
            const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const dayTrades=acctTrades.filter(t=>t.date===dateStr);
            const dayPnl=dayTrades.reduce((s,t)=>s+(t.pnl||0),0);
            setSelectedDay({date:dateStr,trades:dayTrades,pnl:dayPnl});
        }}/>
      </div>
    );

    const sectionTrades = (
      <div style={{marginBottom:12}}>
        <div style={{fontSize:9,color:C.dim,letterSpacing:"0.2em",textTransform:"uppercase",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,marginBottom:10}}>Trades · {acctView==="global"?"Global":"Aujourd'hui"}</div>
        {(acctView==="global"?acctTrades:todayTrades).length===0?<div style={{padding:"12px 0",color:C.gray2,fontSize:11,fontFamily:"'Josefin Sans',sans-serif",textAlign:"center"}}>Aucun trade aujourd'hui</div>:[...(acctView==="global"?acctTrades:todayTrades)].sort((a,b)=>b.date.localeCompare(a.date)).map(t=>{
          const pnl=t.pnl||0;
          return (
            <div key={t.id} style={{background:C.bg2,border:`1px solid ${C.border}`,borderLeft:`3px solid ${t.result==="WIN"?"#2a6e3a":t.result==="LOSS"?"#c0392b":C.gray3}`,borderRadius:12,boxShadow:"0 4px 28px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.09), 0 -2px 24px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.32)",padding:"10px 14px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <span style={{fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,fontSize:13,color:C.white}}>{t.instrument}</span>
                <span style={{marginLeft:6,fontSize:9,color:t.direction==="LONG"?"#2a6e3a":"#c0392b",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,letterSpacing:"0.06em"}}>{t.direction}</span>
                <div style={{fontSize:9,color:C.gray1,fontFamily:"'Josefin Sans',sans-serif",marginTop:2}}>{t.date} · {t.session} · {t.emotion}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:15,fontWeight:300,color:pnl>=0?"#2a6e3a":"#c0392b",fontFamily:"'Josefin Sans',sans-serif"}}>{pnl>=0?"+":""}{pnl.toFixed(0)}{currency}</div>
                {t.rr && <div style={{fontSize:9,color:C.gray1,fontFamily:"'Josefin Sans',sans-serif"}}>RR {t.rr}</div>}
              </div>
            </div>
          );
        })}
      </div>
    );

    const sectionMap = { progress:sectionProgress, today:sectionToday, stats:sectionStats, calendar:sectionCalendar, trades:sectionTrades };
    const layoutOrder = acctLayout.filter(id => id !== 'progress' || pf.type === "propfirm");

    return (
      <div style={{animation:`${accountLeaving?"slideOutAccount":"slideInAccount"} 0.28s cubic-bezier(.4,0,.2,1)`}}>
        {/* ── HEADER ── */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
          <button onClick={closeAccount} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,padding:"6px 12px",color:C.gray1,cursor:"pointer",fontSize:11,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.1em",textTransform:"uppercase"}}>← Retour</button>
          <div>
            <div style={{fontFamily:"'Barlow',sans-serif",fontWeight:600,fontSize:18,color:C.white,letterSpacing:"0.1em"}}>{pf.firm}</div>
            {pf.name && <div style={{fontSize:11,color:C.gray1,fontFamily:"'Josefin Sans',sans-serif"}}>{pf.name}</div>}
          </div>
          <div style={{marginLeft:"auto",display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button onClick={()=>setAcctCustomizing(v=>!v)} style={{background:acctCustomizing?(darkMode?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.08)"):"none",border:`1px solid ${acctCustomizing?C.gray1:C.border}`,borderRadius:6,padding:"5px 10px",color:acctCustomizing?C.white:C.gray2,cursor:"pointer",fontSize:9,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.12em",textTransform:"uppercase",transition:"all 0.18s"}}>
                {acctCustomizing?"✓ Terminé":"⊞ Personnaliser"}
              </button>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:10,color:C.dim,fontFamily:"'Josefin Sans',sans-serif",textTransform:"uppercase",letterSpacing:"0.1em"}}>{pf.type==="propfirm"?"Prop Firm":"Fond Propre"} · {cap.toLocaleString()}€</div>
              <div style={{fontSize:20,color:allPnl>=0?"#2a6e3a":"#c0392b",fontFamily:"'Josefin Sans',sans-serif",fontWeight:300}}>{allPnl>=0?"+":""}{allPnl.toFixed(0)}{currency} <span style={{fontSize:12,color:cap>0?(allPnl/cap*100>=0?"#2a6e3a":"#c0392b"):C.dim}}>{cap>0?`(${(allPnl/cap*100).toFixed(1)}%)`:"" }</span></div>
            </div>
          </div>
        </div>

        {/* ── GLOBAL / TODAY TOGGLE ── */}
        <div style={{display:"flex",gap:6,marginBottom:16,background:darkMode?"linear-gradient(180deg,rgba(85,85,85,0.98) 0%,rgba(28,28,28,0.99) 100%)":"linear-gradient(180deg,rgba(60,60,60,0.95) 0%,rgba(18,18,18,0.97) 100%)",borderRadius:14,padding:4,border:darkMode?"1px solid rgba(255,255,255,0.18)":"1px solid rgba(255,255,255,0.14)",boxShadow:darkMode?"0 12px 40px rgba(0,0,0,0.75), 0 4px 10px rgba(0,0,0,0.5), 0 0 50px rgba(255,255,255,0.1), 0 0 0 1px rgba(255,255,255,0.12), inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -2px 0 rgba(0,0,0,0.75)":"0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -2px 0 rgba(0,0,0,0.55)"}}>
          {[{k:"today",l:"Aujourd'hui"},{k:"global",l:"Global"}].map(opt=>(
            <button key={opt.k} onClick={()=>setAcctView(opt.k)} style={{flex:1,padding:"9px",borderRadius:10,border:"none",background:acctView===opt.k?"radial-gradient(ellipse 90% 90% at 50% 50%, rgba(252,252,252,0.96) 0%, rgba(218,218,218,0.88) 55%, rgba(235,235,235,0.92) 100%)":"transparent",color:acctView===opt.k?"#111":"rgba(255,255,255,0.55)",fontSize:11,fontFamily:"'Josefin Sans',sans-serif",fontWeight:acctView===opt.k?600:300,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.22s cubic-bezier(.4,0,.2,1)",boxShadow:acctView===opt.k?"0 6px 20px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.12)":"none",transform:"translateY(0)"}}>{opt.l}</button>
          ))}
        </div>

        {/* ── ALERTS ── */}
        {alerts.map((a,i)=>(
          <div key={i} style={{padding:"8px 12px",borderRadius:6,marginBottom:8,background:a.type==="danger"?"rgba(192,57,43,0.08)":a.type==="warn"?"rgba(180,120,0,0.08)":a.type==="success"?"rgba(42,110,58,0.08)":"rgba(0,0,0,0.04)",border:`1px solid ${a.type==="danger"?"rgba(192,57,43,0.25)":a.type==="warn"?"rgba(180,120,0,0.25)":a.type==="success"?"rgba(42,110,58,0.25)":C.border}`}}>
            <div style={{fontSize:12,color:C.white,fontFamily:"'Josefin Sans',sans-serif",lineHeight:1.5}}>{a.msg}</div>
          </div>
        ))}

        {/* ── DRAGGABLE SECTIONS ── */}
        {acctCustomizing && (
          <div style={{marginBottom:12,padding:"10px 14px",background:darkMode?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)",borderRadius:8,border:`1px dashed ${C.gray2}`,textAlign:"center",fontSize:10,color:C.gray1,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.1em"}}>
            Glisse les sections pour les réorganiser
          </div>
        )}
        {layoutOrder.map(id => wrapSection(id, sectionMap[id]))}

        {/* ── EOD + ACTIONS ── */}
        <button onClick={()=>{setEodText("");runEOD(pf);}} disabled={eodLoading} style={{width:"100%",padding:"13px",borderRadius:8,border:`1px solid ${C.borderGold}`,background:eodLoading?"transparent":"rgba(0,0,0,0.04)",color:eodLoading?C.gray2:C.dim,fontSize:12,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,letterSpacing:"0.15em",textTransform:"uppercase",cursor:eodLoading?"not-allowed":"pointer",marginBottom:8,transition:"all 0.3s"}}>
          {eodLoading?"◌  Analyse en cours...":"◆  Debriefing fin de journée"}
        </button>
        {eodText && <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:12,boxShadow:"0 4px 28px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.09), 0 -2px 24px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.32)",padding:20,fontSize:12,lineHeight:1.8,color:C.white,whiteSpace:"pre-wrap",fontFamily:"'Josefin Sans',sans-serif",fontWeight:300,letterSpacing:"0.03em",marginBottom:10}}>{eodText}</div>}

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:4}}>
          <button onClick={()=>{setEditingPf({...pf});closeAccount();setPfView("list");}} style={{padding:"13px",borderRadius:8,border:`1px solid ${C.border}`,background:C.bg2,color:C.white,fontSize:11,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer"}}>✎ Modifier</button>
          {!confirmDeletePf ? (
            <button onClick={()=>setConfirmDeletePf(true)} style={{padding:"13px",borderRadius:8,border:"1px solid rgba(192,57,43,0.3)",background:"rgba(192,57,43,0.05)",color:"rgba(192,57,43,0.8)",fontSize:11,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer"}}>Supprimer</button>
          ) : (
            <div style={{borderRadius:8,border:"1px solid rgba(192,57,43,0.4)",background:"rgba(192,57,43,0.08)",padding:"10px 14px",display:"flex",flexDirection:"column",gap:8}}>
              <div style={{fontSize:11,color:"rgba(192,57,43,0.9)",fontFamily:"'Josefin Sans',sans-serif",textAlign:"center"}}>Êtes-vous sûr ?</div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{deletePf(pf.id);closeAccount();}} style={{flex:1,padding:"8px",borderRadius:6,border:"none",background:"rgba(192,57,43,0.8)",color:"#fff",fontSize:11,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,cursor:"pointer"}}>Oui</button>
                <button onClick={()=>setConfirmDeletePf(false)} style={{flex:1,padding:"8px",borderRadius:6,border:`1px solid ${C.border}`,background:"transparent",color:C.gray1,fontSize:11,fontFamily:"'Josefin Sans',sans-serif",cursor:"pointer"}}>Annuler</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

;


  // ── CSV Import ──
  const TICK_VALUES = { MNQ:0.5, NQ:5, MES:1.25, ES:12.5, MCL:1, CL:10, MGC:1, GC:10 };

  const parseTradovateCSV = (text) => {
    const lines = text.trim().split("\n").filter(l=>l.trim());
    if (lines.length < 2) return { error:"Fichier vide ou invalide." };
    const headers = lines[0].split(",").map(h=>h.trim().replace(/"/g,""));
    const getIdx = (names) => { for(const n of names){ const i=headers.findIndex(h=>h.toLowerCase().includes(n.toLowerCase())); if(i>=0) return i; } return -1; };
    const bsIdx=getIdx(["B/S","side","buy"]);
    const contractIdx=getIdx(["Contract","Product","symbol"]);
    const priceIdx=getIdx(["avgPrice","Avg Fill","price"]);
    const qtyIdx=getIdx(["filledQty","Filled Qty","qty"]);
    const dateIdx=getIdx(["Date","Fill Time","date"]);
    const statusIdx=getIdx(["Status"]);
    const trades = [];
    const orders = [];
    for(let i=1;i<lines.length;i++){
      const cols = lines[i].split(",").map(c=>c.trim().replace(/"/g,""));
      if(statusIdx>=0 && cols[statusIdx] && !cols[statusIdx].toLowerCase().includes("fill")) continue;
      orders.push({ side:cols[bsIdx]||"", symbol:cols[contractIdx]||"", price:parseFloat(cols[priceIdx])||0, qty:parseInt(cols[qtyIdx])||1, date:cols[dateIdx]||"" });
    }
    // Pair buy/sell orders into trades
    const buys = orders.filter(o=>o.side.toUpperCase().startsWith("B"));
    const sells = orders.filter(o=>o.side.toUpperCase().startsWith("S"));
    const matched = Math.min(buys.length, sells.length);
    for(let i=0;i<matched;i++){
      const buy=buys[i], sell=sells[i];
      const sym = (buy.symbol||"").replace(/[0-9]/g,"").toUpperCase();
      const tickVal = TICK_VALUES[sym] || 2;
      const pnl = (sell.price - buy.price) * buy.qty * tickVal * 2;
      const dateStr = (buy.date||"").split(" ")[0].split("T")[0] || new Date().toISOString().split("T")[0];
      const d = new Date(dateStr);
      const formattedDate = isNaN(d) ? new Date().toISOString().split("T")[0] : d.toISOString().split("T")[0];
      trades.push({ id:Date.now()+i, date:formattedDate, instrument:sym||"MNQ", direction:pnl>=0?"LONG":"SHORT", result:pnl>0?"WIN":pnl<0?"LOSS":"BREAKEVEN", session:"New York", emotion:"Neutre", entry:buy.price, exit:sell.price, rr:"", notes:"Import Tradovate", pnl:parseFloat(pnl.toFixed(2)), accountIds:[] });
    }
    return { trades, skipped: orders.length - matched*2 };
  };

  const parseMT5CSV = (text) => {
    const lines = text.trim().split("\n").filter(l=>l.trim());
    if (lines.length < 2) return { error:"Fichier vide ou invalide." };
    const headers = lines[0].split(",").map(h=>h.trim().replace(/"/g,"").replace(/;/g,""));
    const sep = lines[0].includes(";") ? ";" : ",";
    const getIdx = (names) => { for(const n of names){ const i=headers.findIndex(h=>h.toLowerCase().includes(n.toLowerCase())); if(i>=0) return i; } return -1; };
    const openIdx=getIdx(["Open Time","open"]);
    const closeIdx=getIdx(["Close Time","close time"]);
    const symIdx=getIdx(["Symbol","symbol","Instrument"]);
    const typeIdx=getIdx(["Type","type","Direction"]);
    const openPriceIdx=getIdx(["Open Price","open price","entry"]);
    const closePriceIdx=getIdx(["Close Price","close price","exit"]);
    const profitIdx=getIdx(["Profit","profit","P&L","pnl"]);
    const trades = [];
    for(let i=1;i<lines.length;i++){
      const cols = lines[i].split(sep).map(c=>c.trim().replace(/"/g,""));
      const profit = parseFloat(cols[profitIdx]);
      if(isNaN(profit)) continue;
      const dateRaw = cols[openIdx]||cols[closeIdx]||"";
      const d = new Date(dateRaw);
      const date = isNaN(d) ? new Date().toISOString().split("T")[0] : d.toISOString().split("T")[0];
      const typeRaw = (cols[typeIdx]||"").toLowerCase();
      const direction = typeRaw.includes("sell")||typeRaw.includes("short") ? "SHORT" : "LONG";
      const sym = (cols[symIdx]||"").toUpperCase();
      trades.push({ id:Date.now()+i, date, instrument:sym||"EUR/USD", direction, result:profit>0?"WIN":profit<0?"LOSS":"BREAKEVEN", session:"New York", emotion:"Neutre", entry:parseFloat(cols[openPriceIdx])||0, exit:parseFloat(cols[closePriceIdx])||0, rr:"", notes:"Import MT4/MT5", pnl:parseFloat(profit.toFixed(2)), accountIds:[] });
    }
    return { trades, skipped:0 };
  };

  const importCSV = () => {
    setCsvError(""); setCsvResult(null);
    if(!csvText.trim()){ setCsvError("Colle ton CSV ci-dessus."); return; }
    const result = csvPlatform==="tradovate" ? parseTradovateCSV(csvText) : parseMT5CSV(csvText);
    if(result.error){ setCsvError(result.error); return; }
    if(!result.trades||result.trades.length===0){ setCsvError("Aucun trade détecté. Vérifie le format."); return; }
    setCsvResult(result);
  };

  const confirmImport = () => {
    if(!csvResult) return;
    setTrades(p => [...csvResult.trades, ...p]);
    setCsvText(""); setCsvResult(null);
    setCsvError("Import réussi — " + csvResult.trades.length + " trades ajoutés !");
    setTimeout(()=>setCsvError(""),3000);
  };

  // ── Position Calculator ──
  const calcResult = (() => {
    const entry = parseFloat(calcEntry);
    const stop = parseFloat(calcStop);
    const risk = parseFloat(calcRisk);
    if(isNaN(entry)||isNaN(stop)||isNaN(risk)||entry===stop) return null;
    const pointDiff = Math.abs(entry - stop);
    if(calcMode === "forex") {
      // Forex: pip value ~10$ per standard lot for most pairs, pip = 0.0001
      const pipSize = calcInstrument.includes("JPY") ? 0.01 : 0.0001;
      const pips = pointDiff / pipSize;
      const pipValuePerLot = calcInstrument.includes("JPY") ? 9.3 : 10;
      const riskPerLot = pips * pipValuePerLot;
      if(riskPerLot <= 0) return null;
      const lots = Math.floor((risk / riskPerLot) * 100) / 100;
      const realRisk = lots * riskPerLot;
      return { value: lots, label:"lots", realRisk: realRisk.toFixed(2), detail: Math.round(pips) + " pips" };
    } else {
      const tickVal = TICK_VALUES[calcInstrument] || 2;
      const tickSize = 0.25;
      const ticks = pointDiff / tickSize;
      const riskPerContract = ticks * tickVal;
      if(riskPerContract <= 0) return null;
      const contracts = Math.floor(risk / riskPerContract);
      const realRisk = contracts * riskPerContract;
      return { value: contracts, label:"contrats", realRisk: realRisk.toFixed(2), detail: Math.round(ticks) + " ticks" };
    }
  })();

  // ── End of Day ──
  const runEOD = async (pf) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayTrades = trades.filter(t => t.date===todayStr && (!t.accountIds||t.accountIds.length===0||t.accountIds.includes(pf.id)));
    if(todayTrades.length===0){ setEodText("Aucun trade aujourd'hui sur ce compte."); return; }
    setEodLoading(true); setEodText("");
    const summary = [...todayTrades].sort((a,b)=>a.date.localeCompare(b.date)).map(t=>`${t.instrument}|${t.direction}|${t.session}|${t.emotion}|RR:${t.rr||"—"}|P&L:${t.pnl}€|${t.result}${t.notes?`|"${t.notes}"`:""}`).join("\n");
    const todayPnl = todayTrades.reduce((s,t)=>s+(t.pnl||0),0);
    const systemMsg = "Tu es un coach de trading direct et exigeant. Fais un debriefing de fin de journée. Analyse : 1) ✅ Ce qui s'est bien passé 2) ❌ Ce qui doit être amélioré 3) 📌 1 règle à appliquer demain. Sois court, direct, sans blabla. Réponds en français.";
    const userMsg = `Compte: ${pf.firm}${pf.name?" "+pf.name:""}\nP&L du jour: ${todayPnl>=0?"+":""}${todayPnl.toFixed(0)}${currency}\n${todayTrades.length} trades:\n${summary}`;
    try {
      const res = await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({summary:userMsg,customSystem:systemMsg})});
      if(!res.ok){const e=await res.json().catch(()=>({}));setEodText("Erreur: "+(e?.error||"inconnue"));setEodLoading(false);return;}
      const data=await res.json();
      if(data.text) setEodText(data.text); else setEodText("Réponse vide.");
    } catch(e){setEodText("Erreur réseau: "+e.message);}
    setEodLoading(false);
  };

  // ── Tools Content ──
  const toolsContent = (
    <div>
      <PageTitle sub="Outils" title="Boîte à outils" />
      {/* Tab selector */}
      <div style={{display:"flex",gap:6,marginBottom:20}}>
        {[{k:"csv",l:"Import CSV"},{k:"calc",l:"Calculateur"}].map(t=>(
          <button key={t.k} onClick={()=>setToolTab(t.k)} style={{flex:1,padding:"9px",borderRadius:6,border:`1px solid ${toolTab===t.k?C.accent:C.border}`,background:toolTab===t.k?"rgba(0,0,0,0.08)":"transparent",color:toolTab===t.k?C.accent:C.gray1,fontSize:11,fontFamily:"'Josefin Sans',sans-serif",fontWeight:toolTab===t.k?600:300,cursor:"pointer",letterSpacing:"0.06em",textTransform:"uppercase"}}>{t.l}</button>
        ))}
      </div>

      {/* CSV IMPORT */}
      {toolTab==="csv" && (
        <div>
          <div style={{fontSize:13,color:C.gray1,lineHeight:1.7,marginBottom:16}}>Exporte ton historique depuis ta plateforme et colle le contenu CSV ici.</div>
          <Field label="Plateforme">
            <div style={{display:"flex",gap:6}}>
              {[{k:"mt5",l:"MT4 / MT5 (FTMO, Lucid, FundedNext...)"},{k:"tradovate",l:"Tradovate"}].map(p=>(
                <button key={p.k} onClick={()=>setCsvPlatform(p.k)} style={{flex:1,padding:"9px",borderRadius:6,border:`1px solid ${csvPlatform===p.k?C.accent:C.border}`,background:csvPlatform===p.k?"rgba(0,0,0,0.08)":"transparent",color:csvPlatform===p.k?C.accent:C.gray1,fontSize:11,fontFamily:"'Josefin Sans',sans-serif",fontWeight:csvPlatform===p.k?600:300,cursor:"pointer",letterSpacing:"0.04em"}}>{p.l}</button>
              ))}
            </div>
          </Field>
          <div style={{marginBottom:8,padding:"10px 12px",borderRadius:6,background:"rgba(0,0,0,0.03)",border:`1px solid ${C.border}`,fontSize:11,color:C.dim,fontFamily:"'Josefin Sans',sans-serif",lineHeight:1.6}}>
            {csvPlatform==="mt5" ? "MT5 : Toolbox → History → clic droit → Export CSV | MT4 : Terminal → Account History → clic droit → Save as Report" : "Tradovate : Accounts → icône paramètres → Orders → Download CSV"}
          </div>
          <Field label="Contenu CSV">
            <textarea rows={8} placeholder="Colle ici le contenu de ton fichier CSV..." value={csvText} onChange={e=>setCsvText(e.target.value)} style={{...iStyle,resize:"vertical",lineHeight:1.5,fontSize:12}}/>
          </Field>
          {csvError && <div style={{padding:"10px 12px",borderRadius:6,marginBottom:10,background:csvResult?"rgba(42,110,58,0.08)":"rgba(192,57,43,0.06)",border:`1px solid ${csvResult?"rgba(42,110,58,0.25)":"rgba(192,57,43,0.2)"}`,fontSize:12,color:csvResult?"#2a6e3a":"#c0392b",fontFamily:"'Josefin Sans',sans-serif"}}>{csvError}</div>}
          {csvResult && (
            <div style={{padding:"14px",borderRadius:6,marginBottom:12,background:"rgba(0,0,0,0.04)",border:`1px solid ${C.border}`}}>
              <div style={{fontSize:13,color:C.white,fontFamily:"'Josefin Sans',sans-serif",marginBottom:10}}><strong>{csvResult.trades.length}</strong> trade{csvResult.trades.length!==1?"s":""} détecté{csvResult.trades.length!==1?"s":""}. {csvResult.skipped>0?`(${csvResult.skipped} ligne${csvResult.skipped>1?"s":""} ignorée${csvResult.skipped>1?"s":""})`:""}
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={confirmImport} style={{flex:2,padding:"11px",borderRadius:4,border:"none",background:"radial-gradient(ellipse 90% 90% at 50% 38%, rgba(245,245,245,0.95) 0%, rgba(215,215,215,0.88) 55%, rgba(230,230,230,0.92) 100%)",color:"#111",fontSize:12,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>✓ Importer</button>
                <button onClick={()=>setCsvResult(null)} style={{flex:1,padding:"11px",borderRadius:4,border:`1px solid ${C.gray3}`,background:"transparent",color:C.gray1,fontSize:12,fontFamily:"'Josefin Sans',sans-serif",cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.1em"}}>Annuler</button>
              </div>
            </div>
          )}
          {!csvResult && <button onClick={importCSV} style={{width:"100%",padding:"14px",borderRadius:4,border:"none",background:"radial-gradient(ellipse 90% 90% at 50% 38%, rgba(245,245,245,0.95) 0%, rgba(215,215,215,0.88) 55%, rgba(230,230,230,0.92) 100%)",color:"#111",fontSize:12,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,letterSpacing:"0.2em",textTransform:"uppercase",cursor:"pointer"}}>Analyser le CSV →</button>}
        </div>
      )}

      {/* POSITION CALCULATOR */}
      {toolTab==="calc" && (
        <div>
          <div style={{fontSize:13,color:C.gray1,lineHeight:1.7,marginBottom:16}}>Entre ton prix d'entrée, stop loss et risque max — FYLTRA calcule le nombre de contrats adapté.</div>
          {/* Mode switch */}
          <div style={{display:"flex",gap:6,marginBottom:16}}>
            {[{k:"futures",l:"Futures"},{k:"forex",l:"Forex"}].map(m=>(
              <button key={m.k} onClick={()=>{setCalcMode(m.k);setCalcInstrument(m.k==="futures"?"MNQ":"EUR/USD");}} style={{flex:1,padding:"9px",borderRadius:6,border:`1px solid ${calcMode===m.k?C.accent:C.border}`,background:calcMode===m.k?"rgba(0,0,0,0.08)":"transparent",color:calcMode===m.k?C.accent:C.gray1,fontSize:12,fontFamily:"'Josefin Sans',sans-serif",fontWeight:calcMode===m.k?600:300,cursor:"pointer",letterSpacing:"0.08em",textTransform:"uppercase"}}>{m.l}</button>
            ))}
          </div>
          <Field label="Instrument">
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {(calcMode==="futures"?["MNQ","NQ","MES","ES","MCL","CL","MGC","GC"]:["EUR/USD","GBP/USD","USD/JPY","AUD/USD","USD/CHF","NAS100","US30"]).map(i=>(
                <button key={i} onClick={()=>{setCalcInstrument(i);setCalcCustomPair("");}} style={{padding:"7px 10px",borderRadius:4,border:`1px solid ${calcInstrument===i&&!calcCustomPair?C.accent:C.gray2}`,background:calcInstrument===i&&!calcCustomPair?"rgba(0,0,0,0.08)":"transparent",color:calcInstrument===i&&!calcCustomPair?C.accent:C.gray1,fontSize:10,fontFamily:"'Josefin Sans',sans-serif",fontWeight:calcInstrument===i&&!calcCustomPair?600:300,cursor:"pointer",letterSpacing:"0.04em"}}>{i}</button>
              ))}
              <input type="text" placeholder="Autre" value={calcCustomPair} onChange={e=>{setCalcCustomPair(e.target.value.toUpperCase());if(e.target.value) setCalcInstrument(e.target.value.toUpperCase());}} style={{...iStyle,width:70,padding:"5px 8px",fontSize:11,height:"auto"}}/>
            </div>
          </Field>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            <Field label="Prix d'entrée"><input type="text" inputMode="decimal" placeholder="" value={calcEntry} onChange={e=>setCalcEntry(e.target.value.replace(/,/g,".").replace(/[^0-9.]/g,""))} style={iStyle}/></Field>
            <Field label="Stop Loss"><input type="text" inputMode="decimal" placeholder="" value={calcStop} onChange={e=>setCalcStop(e.target.value.replace(/,/g,".").replace(/[^0-9.]/g,""))} style={iStyle}/></Field>
          </div>
          <Field label="Risque max (€)"><input type="text" inputMode="decimal" placeholder="" value={calcRisk} onChange={e=>setCalcRisk(e.target.value.replace(/,/g,".").replace(/[^0-9.]/g,""))} style={iStyle}/></Field>
          {calcResult ? (
            <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:12,boxShadow:"0 4px 28px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.09), 0 -2px 24px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.32)",padding:"20px",marginTop:8}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",marginBottom:6}}>{calcResult.label}</div>
                  <div style={{fontSize:32,fontWeight:300,color:C.accent,fontFamily:"'Josefin Sans',sans-serif"}}>{calcResult.value}</div>
                </div>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",marginBottom:6}}>Risque réel</div>
                  <div style={{fontSize:32,fontWeight:300,color:"#c0392b",fontFamily:"'Josefin Sans',sans-serif"}}>{calcResult.realRisk}€</div>
                </div>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",marginBottom:6}}>{calcMode==="futures"?"Ticks":"Pips"}</div>
                  <div style={{fontSize:32,fontWeight:300,color:C.white,fontFamily:"'Josefin Sans',sans-serif"}}>{calcResult.detail}</div>
                </div>
              </div>
              {calcResult.value===0 && <div style={{marginTop:12,fontSize:12,color:"#c0392b",fontFamily:"'Josefin Sans',sans-serif",textAlign:"center"}}>Risque trop faible pour ce setup — augmente ton risque ou réduis ton stop.</div>}
            </div>
          ) : (
            <div style={{textAlign:"center",padding:"32px 0",border:`1px solid ${C.gray3}`,borderRadius:8,marginTop:8}}>
              <div style={{fontSize:32,marginBottom:8,color:C.gray2}}>⬡</div>
              <div style={{fontSize:13,color:C.gray1,fontFamily:"'Josefin Sans',sans-serif"}}>Remplis les champs ci-dessus</div>
            </div>
          )}
        </div>
      )}

      )}
    </div>
  );


  // Currency helper
  const cur = (val, decimals=0) => {
    if (val === null || val === undefined) return "—";
    const v = parseFloat(val);
    if (isNaN(v)) return "—";
    return `${v>=0?"+":""}${Math.abs(v).toFixed(decimals)}${currency}`;
  };
  const curAbs = (val, decimals=0) => {
    const v = parseFloat(val);
    if (isNaN(v)) return "—";
    return `${Math.abs(v).toFixed(decimals)}${currency}`;
  };

  // ── Settings Content ──
  const settingsContent = (
    <div>
      <PageTitle sub="Paramètres" title="Réglages" />
      <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:12,boxShadow:"0 4px 28px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.09), 0 -2px 24px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.32)",padding:"18px 16px",marginBottom:12}}>
        <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,marginBottom:14}}>Devise</div>
        <div style={{display:"flex",gap:8}}>
          {["€","$","£"].map(c=>(
            <button key={c} onClick={()=>setCurrency(c)} style={{flex:1,padding:"12px",borderRadius:8,border:`1px solid ${currency===c?C.accent:C.border}`,background:currency===c?"rgba(0,0,0,0.08)":"transparent",color:currency===c?C.accent:C.gray1,fontSize:18,cursor:"pointer",fontFamily:"'Josefin Sans',sans-serif",fontWeight:currency===c?600:300,transition:"all 0.2s"}}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:12,boxShadow:"0 4px 28px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.09), 0 -2px 24px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.32)",padding:"18px 16px",marginBottom:12}}>
        <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,marginBottom:14}}>Langue</div>
        <div style={{display:"flex",gap:8}}>
          {[{k:"fr",l:"Français"},{k:"en",l:"English"},{k:"es",l:"Español"}].map(lg=>(
            <button key={lg.k} onClick={()=>setLang(lg.k)} style={{flex:1,padding:"10px",borderRadius:8,border:`1px solid ${lang===lg.k?C.accent:C.border}`,background:lang===lg.k?"rgba(0,0,0,0.08)":"transparent",color:lang===lg.k?C.accent:C.gray1,fontSize:12,cursor:"pointer",fontFamily:"'Josefin Sans',sans-serif",fontWeight:lang===lg.k?600:300,letterSpacing:"0.06em",transition:"all 0.2s"}}>
              {lg.l}
            </button>
          ))}
        </div>
        {lang!=="fr"&&<div style={{marginTop:10,padding:"8px 12px",borderRadius:6,background:"rgba(180,120,0,0.08)",border:"1px solid rgba(180,120,0,0.2)",fontSize:11,color:"rgba(180,120,0,0.9)",fontFamily:"'Josefin Sans',sans-serif"}}>La traduction complète sera disponible prochainement.</div>}
      </div>
      <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:12,boxShadow:"0 4px 28px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.09), 0 -2px 24px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.32)",padding:"18px 16px",marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,marginBottom:4}}>Apparence</div>
            <div style={{fontSize:13,color:C.gray1,fontFamily:"'Josefin Sans',sans-serif"}}>{darkMode?"Mode sombre":"Mode clair"}</div>
          </div>
          <button onClick={()=>setDarkMode(d=>!d)} style={{width:52,height:28,borderRadius:14,border:"none",background:darkMode?"#f0ede8":"#ccc",cursor:"pointer",position:"relative",transition:"background 0.3s",flexShrink:0}}>
            <div style={{position:"absolute",top:3,left:darkMode?26:3,width:22,height:22,borderRadius:11,background:darkMode?"#111":"#fff",transition:"left 0.25s",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}/>
          </button>
        </div>
      </div>

      {/* ── TRADE SETTINGS ── */}
      <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:12,boxShadow:"0 4px 28px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.09), 0 -2px 24px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.32)",padding:"18px 16px",marginBottom:12}}>
        <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,marginBottom:8}}>Réglages de trade</div>
        <div style={{fontSize:11,color:C.gray1,fontFamily:"'Josefin Sans',sans-serif",marginBottom:16,letterSpacing:"0.04em",lineHeight:1.7}}>Activez les champs à appliquer en mode <strong style={{color:C.white}}>Fixe</strong> dans l'onglet Trade.</div>
        {[
          {k:"tpFixed", label:"TP fixe", placeholder:"ex: 150"},
          {k:"slFixed", label:"SL fixe", placeholder:"ex: 75"},
          {k:"rrFixed", label:"R/R fixe", placeholder:"ex: 2"},
        ].map(f => (
          <div key={f.k} style={{marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:tradeSettings[f.k].enabled?8:0}}>
              <span style={{fontSize:11,color:C.white,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.06em"}}>{f.label}</span>
              <button onClick={()=>setTS(f.k,{enabled:!tradeSettings[f.k].enabled})} style={{width:40,height:22,borderRadius:11,border:"none",background:tradeSettings[f.k].enabled?C.accent:"rgba(255,255,255,0.1)",cursor:"pointer",position:"relative",transition:"background 0.22s",flexShrink:0}}>
                <div style={{position:"absolute",top:2,left:tradeSettings[f.k].enabled?20:2,width:18,height:18,borderRadius:9,background:tradeSettings[f.k].enabled?(darkMode?"#111":"#fff"):"#ccc",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
              </button>
            </div>
            {tradeSettings[f.k].enabled && (
              <input type="text" inputMode="decimal" placeholder={f.placeholder} value={tradeSettings[f.k].value} onChange={e=>setTS(f.k,{value:e.target.value.replace(/,/g,".").replace(/[^0-9.]/g,"")})} style={{...iStyle,fontSize:13}}/>
            )}
          </div>
        ))}
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:tradeSettings.sizeFixed.enabled?8:0}}>
            <span style={{fontSize:11,color:C.white,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.06em"}}>Taille fixe</span>
            <button onClick={()=>setTS("sizeFixed",{enabled:!tradeSettings.sizeFixed.enabled})} style={{width:40,height:22,borderRadius:11,border:"none",background:tradeSettings.sizeFixed.enabled?C.accent:"rgba(255,255,255,0.1)",cursor:"pointer",position:"relative",transition:"background 0.22s",flexShrink:0}}>
              <div style={{position:"absolute",top:2,left:tradeSettings.sizeFixed.enabled?20:2,width:18,height:18,borderRadius:9,background:tradeSettings.sizeFixed.enabled?(darkMode?"#111":"#fff"):"#ccc",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
            </button>
          </div>
          {tradeSettings.sizeFixed.enabled && (
            <div>
              <div style={{display:"flex",borderRadius:6,border:`1px solid ${C.border}`,overflow:"hidden",marginBottom:8,alignSelf:"flex-start",width:"fit-content"}}>
                {["contrats","lots"].map(u=>(
                  <button key={u} onClick={()=>setTS("sizeFixed",{unit:u})} style={{padding:"4px 12px",border:"none",background:tradeSettings.sizeFixed.unit===u?C.accent:"transparent",color:tradeSettings.sizeFixed.unit===u?(darkMode?"#111":"#fff"):C.gray1,fontSize:10,fontFamily:"'Josefin Sans',sans-serif",fontWeight:tradeSettings.sizeFixed.unit===u?600:300,cursor:"pointer",letterSpacing:"0.08em",transition:"all 0.18s"}}>{u}</button>
                ))}
              </div>
              <input type="text" inputMode="decimal" placeholder={`ex: 1 ${tradeSettings.sizeFixed.unit}`} value={tradeSettings.sizeFixed.value} onChange={e=>setTS("sizeFixed",{value:e.target.value.replace(/,/g,".").replace(/[^0-9.]/g,"")})} style={{...iStyle,fontSize:13}}/>
            </div>
          )}
        </div>
        <button onClick={saveTS} style={{width:"100%",padding:"12px",borderRadius:6,border:`1px solid ${C.border}`,background:tsSaved?C.accent:"transparent",color:tsSaved?(darkMode?"#111":"#fff"):C.dim,fontSize:11,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,letterSpacing:"0.18em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.3s"}}>
          {tsSaved?"✓ Sauvegardé":"Sauvegarder →"}
        </button>
      </div>
      {/* ── MT5 CONNECT ── */}
      <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:12,boxShadow:"0 4px 28px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.09), 0 -2px 24px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.32)",padding:"18px 16px",marginBottom:12,opacity:0.6}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600}}>Compte MT4 / MT5</div>
          <span style={{background:"linear-gradient(135deg,rgba(210,180,120,0.2),rgba(210,180,120,0.06))",border:"1px solid rgba(210,180,120,0.3)",color:"rgba(210,180,120,0.9)",fontSize:8,fontFamily:"'Josefin Sans',sans-serif",fontWeight:300,letterSpacing:"0.22em",padding:"3px 8px",borderRadius:4,textTransform:"uppercase"}}>bientôt</span>
        </div>
        <div style={{fontSize:12,color:C.gray1,fontFamily:"'Josefin Sans',sans-serif",lineHeight:1.6}}>Connecte ton compte MT4/MT5 pour importer tes trades automatiquement.</div>
      </div>

      <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:12,boxShadow:"0 4px 28px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.09), 0 -2px 24px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.32)",padding:"18px 16px"}}>
        <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,marginBottom:4}}>Version</div>
        <div style={{fontSize:13,color:C.gray1,fontFamily:"'Josefin Sans',sans-serif"}}><span style={{fontFamily:"'MariellaNove',sans-serif",fontSize:16}}>FYLTRA</span> v1.0 · Trading Journal</div>
        <div style={{fontSize:10,color:C.gray2,fontFamily:"'Josefin Sans',sans-serif",marginTop:4,letterSpacing:"0.06em"}}>Créé par Smile</div>
      </div>
    </div>
  );

  const getContent = (desktop) => {
    if (view === "propfirm")  return selectedPf ? accountDetailContent(selectedPf, desktop) : propfirmContent;
    if (view === "add")       return addTradeContent;
    if (view === "history")   return historyContent;
    if (view === "strategy")  return strategyContent;
    if (view === "ai")        return aiContent;
    if (view === "settings")  return settingsContent;
    return null;
  };

  /* ── RENDER ── */
  if (authLoading) return (
    <div style={{ minHeight:"100vh", background:"#0f0f0f", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{FONTS}</style>
      <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:"'Josefin Sans',sans-serif", letterSpacing:"0.2em", textTransform:"uppercase" }}>Chargement...</div>
    </div>
  );
  if (!user) return <AuthScreen />;

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.white, fontFamily:"'Josefin Sans',sans-serif" }}>
      <style>{FONTS}</style>

      {isMobile ? (
        /* ── MOBILE ── */
        <div style={{ minHeight:"100vh", paddingBottom:100 }}>
          <div style={{ padding:"16px 20px", background:`linear-gradient(180deg,${C.bg2},${C.bg})`, borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:50, backdropFilter:"blur(16px)", flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <img src={darkMode?"/fyltra-creme.svg":"/fyltra-black.svg"} style={{width:38,height:38,flexShrink:0,borderRadius:8}} alt="Fyltra"/>
              <div>
                <span style={{ fontFamily:"'MariellaNove',sans-serif", fontSize:18, color:C.white, display:"block", lineHeight:1, marginBottom:2 }}>FYLTRA</span>
                <div style={{ fontSize:7, color:C.dim, letterSpacing:"0.25em", textTransform:"uppercase", fontFamily:"'Josefin Sans',sans-serif", fontWeight:300 }}>Carnet de santé trading</div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button onClick={()=>setDarkMode(d=>!d)} title={darkMode?"Mode clair":"Mode sombre"} style={{background:darkMode?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.06)",border:`1px solid ${C.border}`,borderRadius:8,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:C.gray1,flexShrink:0,transition:"all 0.2s"}}>
                {darkMode ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                )}
              </button>
              <button onClick={()=>showMenu?closeMenu():setShowMenu(true)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",color:C.gray1,cursor:"pointer",display:"flex",flexDirection:"column",gap:"4px",alignItems:"center",justifyContent:"center"}}>
                <div style={{width:16,height:1.5,background:C.gray1,borderRadius:1}}/>
                <div style={{width:16,height:1.5,background:C.gray1,borderRadius:1}}/>
                <div style={{width:16,height:1.5,background:C.gray1,borderRadius:1}}/>
              </button>
            </div>

          </div>
          <div style={{ padding:"22px 18px", maxWidth:560, margin:"0 auto" }}>
            <div key={view+(selectedPf?.id||"")} style={{animation:"tabFadeIn 0.25s cubic-bezier(.4,0,.2,1)"}}>{getContent(false)}</div>
          </div>
          {showMenu && (
            <>
              <div onClick={closeMenu} style={{position:"fixed",inset:0,zIndex:298}}/>
              <div style={{position:"fixed",top:70,right:16,zIndex:299,animation:`${menuClosing?"slideToRight":"slideFromRight"} 0.24s cubic-bezier(.4,0,.2,1)`,display:"flex",flexDirection:"column",gap:6,background:"rgba(14,14,14,0.96)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderRadius:20,padding:"10px",boxShadow:"0 16px 48px rgba(0,0,0,0.35)",border:"1px solid rgba(255,255,255,0.07)",minWidth:160}}>
                {[{k:"history",l:"Statistiques",i:"≡"},{k:"strategy",l:"Plan",i:"◈"},{k:"settings",l:"Paramètres",i:"◎"}].map(item=>(
                  <button key={item.k} onClick={()=>{setView(item.k);setShowMenu(false);}} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:12,border:"none",cursor:"pointer",background:"transparent",transition:"background 0.15s"}}>
                    <span style={{fontSize:17,color:"rgba(255,255,255,0.6)",lineHeight:1,width:20,textAlign:"center"}}>{item.i}</span>
                    <span style={{fontSize:13,fontFamily:"'Josefin Sans',sans-serif",fontWeight:300,letterSpacing:"0.06em",color:"rgba(255,255,255,0.7)"}}>{item.l}</span>
                  </button>
                ))}
                <div style={{height:1,background:"rgba(255,255,255,0.06)",margin:"2px 8px"}}/>
                <button onClick={()=>{ closeMenu(); setShowSignOutConfirm(true); }} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:12,border:"none",cursor:"pointer",background:"transparent"}}>
                  <span style={{fontSize:15,color:"rgba(229,100,100,0.7)",lineHeight:1,width:20,textAlign:"center"}}>⏻</span>
                  <span style={{fontSize:12,fontFamily:"'Josefin Sans',sans-serif",fontWeight:300,color:"rgba(229,100,100,0.7)",letterSpacing:"0.06em"}}>Déconnexion</span>
                </button>
                <div style={{height:1,background:"rgba(255,255,255,0.06)",margin:"2px 8px"}}/>
                <button onClick={closeMenu} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",borderRadius:12,border:"none",cursor:"pointer",background:"transparent"}}>
                  <span style={{fontSize:17,color:"rgba(255,255,255,0.3)",lineHeight:1,width:20,textAlign:"center"}}>×</span>
                  <span style={{fontSize:12,fontFamily:"'Josefin Sans',sans-serif",fontWeight:300,color:"rgba(255,255,255,0.3)",letterSpacing:"0.06em"}}>Fermer</span>
                </button>
              </div>
            </>
          )}
          {selectedDay && (
            <div style={{position:"fixed",inset:0,zIndex:400,display:"flex",alignItems:"flex-end",justifyContent:"center",paddingBottom:90,overflowY:"auto"}} onClick={closeDay}>
              <div onClick={e=>e.stopPropagation()} style={{width:"calc(100% - 32px)",maxWidth:480,background:"rgba(14,14,14,0.97)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderRadius:24,padding:"20px",boxShadow:"0 -8px 48px rgba(0,0,0,0.4)",border:"1px solid rgba(255,255,255,0.08)",animation:`${dayClosing?"fadeOutDown":"fadeInUp"} 0.25s cubic-bezier(.4,0,.2,1)`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <div>
                    <div style={{fontSize:13,color:"rgba(255,255,255,0.9)",fontFamily:"'Barlow',sans-serif",fontWeight:600,letterSpacing:"0.08em"}}>{new Date(selectedDay.date+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</div>
                    <div style={{fontSize:20,color:selectedDay.pnl>=0?"#4caf6e":"#e05a5a",fontFamily:"'Josefin Sans',sans-serif",fontWeight:300,marginTop:2}}>{selectedDay.pnl>=0?"+":""}{selectedDay.pnl.toFixed(0)}{currency} · {selectedDay.trades.length} trade{selectedDay.trades.length!==1?"s":""}</div>
                  </div>
                  <button onClick={closeDay} style={{background:"rgba(255,255,255,0.08)",border:"none",borderRadius:50,width:32,height:32,color:"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                </div>
                {/* Day summary — gauge + stats */}
                {(() => {
                  const dW=selectedDay.trades.filter(t=>t.result==="WIN").length;
                  const dL=selectedDay.trades.filter(t=>t.result==="LOSS").length;
                  const dT=selectedDay.trades.length;
                  const r=38,cx=55,cy=42,sw=10,PI=Math.PI;
                  const wFrac=dT>0?dW/dT:0; const lFrac=dT>0?dL/dT:0;
                  const wr=dT?Math.round(dW/dT*100):0;
                  const LEFT2={x:cx-r,y:cy}, RIGHT2={x:cx+r,y:cy};
                  const a2XY=(deg)=>({x:cx+r*Math.cos(deg*PI/180),y:cy-r*Math.sin(deg*PI/180)});
                  const bgA=`M${LEFT2.x},${LEFT2.y} A${r},${r} 0 0 1 ${RIGHT2.x},${RIGHT2.y}`;
                  const wD2=180-wFrac*180; const wP2=a2XY(wD2);
                  const lD2=lFrac*180; const lP2=a2XY(lD2);
                  const wA2=wFrac>0.01?`M${LEFT2.x},${LEFT2.y} A${r},${r} 0 ${wFrac>=1?1:0} 1 ${wP2.x.toFixed(1)},${wP2.y.toFixed(1)}`:"";
                  const lA2=lFrac>0.01?`M${RIGHT2.x},${RIGHT2.y} A${r},${r} 0 ${lFrac>=1?1:0} 0 ${lP2.x.toFixed(1)},${lP2.y.toFixed(1)}`:"";
                  return (
                    <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:14,background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"12px 14px"}}>
                      <svg width={110} height={68} style={{overflow:"visible",flexShrink:0}}>
                        <path d={bgA} stroke="rgba(255,255,255,0.1)" strokeWidth={sw} fill="none" strokeLinecap="round"/>
                        {wFrac>0.01&&<path d={wA2} stroke="#4caf6e" strokeWidth={sw} fill="none" strokeLinecap="round"/>}
                        {lFrac>0.01&&<path d={lA2} stroke="#e05a5a" strokeWidth={sw} fill="none" strokeLinecap="round"/>}
                        <text x={cx} y={cy} textAnchor="middle" fontSize={14} fontWeight={300} fill={wr>=50?"#4caf6e":"#e05a5a"} fontFamily="'Josefin Sans',sans-serif">{wr}%</text>
                        <text x={cx} y={cy+12} textAnchor="middle" fontSize={6} fill="rgba(255,255,255,0.35)" fontFamily="'Josefin Sans',sans-serif" letterSpacing="1">WIN RATE</text>
                        <text x={3} y={cy+r+14} textAnchor="start" fontSize={8} fontWeight="600" fill="#4caf6e" fontFamily="'Josefin Sans',sans-serif">{dW}W</text>
                        <text x={cx} y={cy+r+14} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.35)" fontFamily="'Josefin Sans',sans-serif">{dT-dW-dL}BE</text>
                        <text x={107} y={cy+r+14} textAnchor="end" fontSize={8} fontWeight="600" fill="#e05a5a" fontFamily="'Josefin Sans',sans-serif">{dL}L</text>
                      </svg>
                      <div style={{flex:1}}>
                        {(() => {
                          const dayEmotions=EMOTIONS.map(e=>{const et=selectedDay.trades.filter(t=>t.emotion===e);const wr=et.length?Math.round(et.filter(t=>t.result==="WIN").length/et.length*100):0;return{name:e,count:et.length,wr,pnl:et.reduce((a,t)=>a+(t.pnl||0),0)};}).filter(e=>e.count>0);
                          const daySess=SESSIONS.map(s=>{const st=selectedDay.trades.filter(t=>t.session===s);const wr=st.length?Math.round(st.filter(t=>t.result==="WIN").length/st.length*100):0;return{name:s,count:st.length,wr,pnl:st.reduce((a,t)=>a+(t.pnl||0),0)};}).filter(s=>s.count>0);
                          return (
                            <div style={{display:"flex",flexDirection:"column",gap:6}}>
                              {dayEmotions.length>0&&<div style={{fontSize:7,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:"'Josefin Sans',sans-serif"}}>Émotions</div>}
                              {dayEmotions.map(e=>(
                                <div key={e.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                  <span style={{fontSize:10,color:"rgba(255,255,255,0.55)",fontFamily:"'Josefin Sans',sans-serif"}}>{e.name}</span>
                                  <span style={{fontSize:10,color:e.wr>=50?"#4caf6e":"#e05a5a",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600}}>{e.wr}% · {e.pnl>=0?"+":""}{e.pnl.toFixed(0)}{currency}</span>
                                </div>
                              ))}
                              {daySess.length>0&&<div style={{fontSize:7,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:"'Josefin Sans',sans-serif",marginTop:2}}>Sessions</div>}
                              {daySess.map(s=>(
                                <div key={s.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                  <span style={{fontSize:10,color:"rgba(255,255,255,0.45)",fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.04em"}}>{s.name}</span>
                                  <span style={{fontSize:10,color:s.pnl>=0?"#4caf6e":"#e05a5a",fontFamily:"'Josefin Sans',sans-serif"}}>{s.wr}% · {s.pnl>=0?"+":""}{s.pnl.toFixed(0)}{currency}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })()}
                {selectedDay.trades.length>=1&&(()=>{
                  let c2=0;
                  const pd=[{label:"0",v:0},...[...selectedDay.trades].sort((a,b)=>(a.id||0)-(b.id||0)).map((t,i)=>{c2+=t.pnl||0;return{label:String(i+1),v:parseFloat(c2.toFixed(2)),pnl:t.pnl||0,instrument:t.instrument||""};})];
                  const dayTotalPnl=pd[pd.length-1]?.v||0;
                  return(
                    <div style={{marginBottom:12,background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"10px 12px"}}>
                      <div style={{fontSize:7,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:"'Josefin Sans',sans-serif",marginBottom:6}}>Courbe du jour</div>
                      <ResponsiveContainer width="100%" height={70}>
                        <LineChart data={pd} margin={{top:4,right:4,left:0,bottom:0}}>
                          <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeWidth={1}/>
                          <Tooltip contentStyle={{background:"rgba(20,20,20,0.95)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:6,fontSize:10,fontFamily:"'Josefin Sans',sans-serif",color:"#fff"}} formatter={v=>[`${v>=0?"+":""}${v.toFixed(0)}${currency}`,"Cumulé"]} labelFormatter={l=>pd.find(d=>d.label===l)?.instrument||""}/>
                          <Line type="monotone" dataKey="v" stroke={dayTotalPnl>=0?"#4caf6e":"#e05a5a"} strokeWidth={2} dot={{r:2,fill:dayTotalPnl>=0?"#4caf6e":"#e05a5a",strokeWidth:0}} activeDot={{r:4,fill:dayTotalPnl>=0?"#4caf6e":"#e05a5a",strokeWidth:0}}/>
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })()}
                {/* Day mini stats */}
                {(() => {
                  const dWins=selectedDay.trades.filter(t=>t.result==="WIN").length;
                  const dLoss=selectedDay.trades.filter(t=>t.result==="LOSS").length;
                  const dTotal=selectedDay.trades.length;
                  const dWR=dTotal?Math.round(dWins/dTotal*100):0;
                  const dAvgW=dWins?selectedDay.trades.filter(t=>t.result==="WIN").reduce((s,t)=>s+(t.pnl||0),0)/dWins:0;
                  const dAvgL=dLoss?Math.abs(selectedDay.trades.filter(t=>t.result==="LOSS").reduce((s,t)=>s+(t.pnl||0),0)/dLoss):0;
                  const dPF=dAvgL>0?(dAvgW*dWins/(dAvgL*dLoss)).toFixed(2):dWins>0?"∞":"—";
                  const dRR=dTotal?(selectedDay.trades.reduce((s,t)=>s+(parseFloat(t.rr)||0),0)/dTotal).toFixed(1):"—";
                  const dLong=selectedDay.trades.filter(t=>t.direction==="LONG");
                  const dShort=selectedDay.trades.filter(t=>t.direction==="SHORT");
                  const dLW=dLong.length?Math.round(dLong.filter(t=>t.result==="WIN").length/dLong.length*100):0;
                  const dSW=dShort.length?Math.round(dShort.filter(t=>t.result==="WIN").length/dShort.length*100):0;
                  return (
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:12}}>
                      {[
                        {l:"Profit Factor",v:dPF==="—"||dPF==="∞"?dPF:dPF+"x",c:parseFloat(dPF)>=1||dPF==="∞"?"#4caf6e":"#e05a5a"},
                        {l:"RR Moyen",v:dRR==="—"?"—":dRR+":1",c:"rgba(255,255,255,0.5)"},
                        {l:"Nb Trades",v:dTotal,c:"rgba(255,255,255,0.7)"},
                        {l:"Long",v:dLong.length?dLW+"%":"—",c:dLW>=50?"#4caf6e":"#e05a5a",sub:dLong.length+"T"},
                        {l:"Short",v:dShort.length?dSW+"%":"—",c:dSW>=50?"#4caf6e":"#e05a5a",sub:dShort.length+"T"},
                      ].map(s=>(
                        <div key={s.l} style={{background:"rgba(255,255,255,0.05)",borderRadius:7,padding:"8px 10px"}}>
                          <div style={{fontSize:7,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.1em",fontFamily:"'Josefin Sans',sans-serif",marginBottom:3}}>{s.l}</div>
                          <div style={{fontSize:14,fontWeight:300,color:s.c,fontFamily:"'Josefin Sans',sans-serif"}}>{s.v}</div>
                          {s.sub&&<div style={{fontSize:8,color:"rgba(255,255,255,0.3)",fontFamily:"'Josefin Sans',sans-serif"}}>{s.sub}</div>}
                        </div>
                      ))}
                    </div>
                  );
                })()}

              </div>
            </div>
          )}
          <PillNav view={view} setView={setView} darkMode={darkMode} />
        </div>
      ) : (
        /* ── DESKTOP ── */
        <div style={{ display:"flex", minHeight:"100vh" }}>
          <Sidebar view={view} setView={setView} darkMode={darkMode} onSignOut={() => setShowSignOutConfirm(true)} />
          <div style={{ marginLeft:220, flex:1, display:"flex", flexDirection:"column" }}>
            <div style={{ padding:"20px 36px 18px", borderBottom:`1px solid ${C.border}`, background:C.bg, position:"sticky", top:0, zIndex:40, backdropFilter:"blur(12px)", display:"flex", alignItems:"flex-end", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontSize:11, color:C.dim, letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:2, fontFamily:"'Josefin Sans',sans-serif" }}>{FULL_NAV.find(n => n.key === view)?.label}</div>
                <div style={{ fontFamily:"'Josefin Sans',sans-serif", fontSize:26, fontWeight:700, color:C.white, letterSpacing:"-0.025em" }}>
                  {view === "propfirm" ? (selectedPf ? selectedPf.firm + (selectedPf.name ? " · " + selectedPf.name : "") : "Mes Comptes") : view === "add" ? "Nouveau Trade" : view === "history" ? "Statistiques" : view === "strategy" ? "Plan de Trading" : view === "tools" ? "Outils" : "Analyse IA"}
                </div>
              </div>
              <button onClick={()=>setDarkMode(d=>!d)} title={darkMode?"Mode clair":"Mode sombre"} style={{background:darkMode?"rgba(255,255,255,0.07)":"rgba(0,0,0,0.06)",border:`1px solid ${C.border}`,borderRadius:10,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:C.gray1,flexShrink:0,transition:"all 0.2s",marginBottom:4}}>
                {darkMode ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                )}
              </button>
            </div>
            <div style={{ padding:"28px 36px", flex:1 }}>
              <div key={view+(selectedPf?.id||"")} style={{animation:"tabFadeIn 0.25s cubic-bezier(.4,0,.2,1)"}}>{getContent(true)}</div>
            </div>
          </div>
          {/* Day popup for desktop — same rich content as mobile */}
          {selectedDay && (
            <div style={{position:"fixed",inset:0,zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.45)",backdropFilter:"blur(6px)"}} onClick={closeDay}>
              <div onClick={e=>e.stopPropagation()} style={{width:560,maxHeight:"90vh",overflowY:"auto",background:"rgba(14,14,14,0.97)",backdropFilter:"blur(24px)",borderRadius:24,padding:"24px",boxShadow:"0 24px 80px rgba(0,0,0,0.6)",border:"1px solid rgba(255,255,255,0.08)",animation:`${dayClosing?"fadeOutDown":"fadeInUp"} 0.25s cubic-bezier(.4,0,.2,1)`}}>
                {/* Header */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                  <div>
                    <div style={{fontSize:14,color:"rgba(255,255,255,0.9)",fontFamily:"'Barlow',sans-serif",fontWeight:600,letterSpacing:"0.08em"}}>{new Date(selectedDay.date+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</div>
                    <div style={{fontSize:24,color:selectedDay.pnl>=0?"#4caf6e":"#e05a5a",fontFamily:"'Josefin Sans',sans-serif",fontWeight:300,marginTop:4}}>{selectedDay.pnl>=0?"+":""}{selectedDay.pnl.toFixed(0)}{currency} · {selectedDay.trades.length} trade{selectedDay.trades.length!==1?"s":""}</div>
                  </div>
                  <button onClick={closeDay} style={{background:"rgba(255,255,255,0.08)",border:"none",borderRadius:50,width:36,height:36,color:"rgba(255,255,255,0.5)",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>×</button>
                </div>
                {/* Gauge + stats */}
                {(() => {
                  const dW=selectedDay.trades.filter(t=>t.result==="WIN").length;
                  const dL=selectedDay.trades.filter(t=>t.result==="LOSS").length;
                  const dT=selectedDay.trades.length;
                  const r=38,cx=55,cy=42,sw=10,PI=Math.PI;
                  const wFrac=dT>0?dW/dT:0; const lFrac=dT>0?dL/dT:0;
                  const wr=dT?Math.round(dW/dT*100):0;
                  const LEFT2={x:cx-r,y:cy}, RIGHT2={x:cx+r,y:cy};
                  const a2XY=(deg)=>({x:cx+r*Math.cos(deg*PI/180),y:cy-r*Math.sin(deg*PI/180)});
                  const bgA=`M${LEFT2.x},${LEFT2.y} A${r},${r} 0 0 1 ${RIGHT2.x},${RIGHT2.y}`;
                  const wD2=180-wFrac*180; const wP2=a2XY(wD2);
                  const lD2=lFrac*180; const lP2=a2XY(lD2);
                  const wA2=wFrac>0.01?`M${LEFT2.x},${LEFT2.y} A${r},${r} 0 ${wFrac>=1?1:0} 1 ${wP2.x.toFixed(1)},${wP2.y.toFixed(1)}`:"";
                  const lA2=lFrac>0.01?`M${RIGHT2.x},${RIGHT2.y} A${r},${r} 0 ${lFrac>=1?1:0} 0 ${lP2.x.toFixed(1)},${lP2.y.toFixed(1)}`:"";
                  const dayEmotions=EMOTIONS.map(e=>{const et=selectedDay.trades.filter(t=>t.emotion===e);const wr2=et.length?Math.round(et.filter(t=>t.result==="WIN").length/et.length*100):0;return{name:e,count:et.length,wr:wr2,pnl:et.reduce((a,t)=>a+(t.pnl||0),0)};}).filter(e=>e.count>0);
                  const daySess=SESSIONS.map(s=>{const st=selectedDay.trades.filter(t=>t.session===s);const wr2=st.length?Math.round(st.filter(t=>t.result==="WIN").length/st.length*100):0;return{name:s,count:st.length,wr:wr2,pnl:st.reduce((a,t)=>a+(t.pnl||0),0)};}).filter(s=>s.count>0);
                  const dAvgW=dW?selectedDay.trades.filter(t=>t.result==="WIN").reduce((s,t)=>s+(t.pnl||0),0)/dW:0;
                  const dAvgL=dL?Math.abs(selectedDay.trades.filter(t=>t.result==="LOSS").reduce((s,t)=>s+(t.pnl||0),0)/dL):0;
                  const dPF=dAvgL>0?(dAvgW*dW/(dAvgL*dL)).toFixed(2):dW>0?"∞":"—";
                  const dRR=dT?(selectedDay.trades.reduce((s,t)=>s+(parseFloat(t.rr)||0),0)/dT).toFixed(1):"—";
                  return (
                    <div style={{marginBottom:14}}>
                      <div style={{display:"flex",gap:16,background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"14px",marginBottom:10}}>
                        <svg width={110} height={68} style={{overflow:"visible",flexShrink:0}}>
                          <path d={bgA} stroke="rgba(255,255,255,0.1)" strokeWidth={sw} fill="none" strokeLinecap="round"/>
                          {wFrac>0.01&&<path d={wA2} stroke="#4caf6e" strokeWidth={sw} fill="none" strokeLinecap="round"/>}
                          {lFrac>0.01&&<path d={lA2} stroke="#e05a5a" strokeWidth={sw} fill="none" strokeLinecap="round"/>}
                          <text x={cx} y={cy} textAnchor="middle" fontSize={14} fontWeight={300} fill={wr>=50?"#4caf6e":"#e05a5a"} fontFamily="'Josefin Sans',sans-serif">{wr}%</text>
                          <text x={cx} y={cy+12} textAnchor="middle" fontSize={6} fill="rgba(255,255,255,0.35)" fontFamily="'Josefin Sans',sans-serif" letterSpacing="1">WIN RATE</text>
                          <text x={3} y={cy+r+14} textAnchor="start" fontSize={8} fontWeight="600" fill="#4caf6e" fontFamily="'Josefin Sans',sans-serif">{dW}W</text>
                          <text x={cx} y={cy+r+14} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.35)" fontFamily="'Josefin Sans',sans-serif">{dT-dW-dL}BE</text>
                          <text x={107} y={cy+r+14} textAnchor="end" fontSize={8} fontWeight="600" fill="#e05a5a" fontFamily="'Josefin Sans',sans-serif">{dL}L</text>
                        </svg>
                        <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
                          {dayEmotions.length>0&&<div style={{fontSize:7,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:"'Josefin Sans',sans-serif"}}>Émotions</div>}
                          {dayEmotions.map(e=>(
                            <div key={e.name} style={{display:"flex",justifyContent:"space-between"}}>
                              <span style={{fontSize:11,color:"rgba(255,255,255,0.6)",fontFamily:"'Josefin Sans',sans-serif"}}>{e.name}</span>
                              <span style={{fontSize:11,color:e.wr>=50?"#4caf6e":"#e05a5a",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600}}>{e.wr}% · {e.pnl>=0?"+":""}{e.pnl.toFixed(0)}{currency}</span>
                            </div>
                          ))}
                          {daySess.length>0&&<div style={{fontSize:7,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:"'Josefin Sans',sans-serif",marginTop:4}}>Sessions</div>}
                          {daySess.map(s=>(
                            <div key={s.name} style={{display:"flex",justifyContent:"space-between"}}>
                              <span style={{fontSize:11,color:"rgba(255,255,255,0.5)",fontFamily:"'Josefin Sans',sans-serif"}}>{s.name}</span>
                              <span style={{fontSize:11,color:s.pnl>=0?"#4caf6e":"#e05a5a",fontFamily:"'Josefin Sans',sans-serif"}}>{s.pnl>=0?"+":""}{s.pnl.toFixed(0)}{currency}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
                        {[{l:"Profit Factor",v:dPF==="—"||dPF==="∞"?dPF:dPF+"x",c:parseFloat(dPF)>=1||dPF==="∞"?"#4caf6e":"#e05a5a"},{l:"RR Moyen",v:dRR==="—"?"—":dRR+":1",c:"rgba(255,255,255,0.5)"},{l:"Nb Trades",v:dT,c:"rgba(255,255,255,0.7)"}].map(s=>(
                          <div key={s.l} style={{background:"rgba(255,255,255,0.05)",borderRadius:8,padding:"10px 12px"}}>
                            <div style={{fontSize:8,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.1em",fontFamily:"'Josefin Sans',sans-serif",marginBottom:4}}>{s.l}</div>
                            <div style={{fontSize:16,fontWeight:300,color:s.c,fontFamily:"'Josefin Sans',sans-serif"}}>{s.v}</div>
                          </div>
                        ))}
                      </div>
                      {/* Equity curve */}
                      {(()=>{
                        let dc=0;
                        const dpd=[{label:"0",v:0},...selectedDay.trades.sort((a,b)=>(a.id||0)-(b.id||0)).map((t,i)=>{dc+=t.pnl||0;return{label:String(i+1),v:parseFloat(dc.toFixed(2)),pnl:t.pnl||0,instrument:t.instrument||""};})];
                        const dtPnl=dpd[dpd.length-1]?.v||0;
                        return (
                          <div style={{background:"rgba(255,255,255,0.03)",borderRadius:10,padding:"10px 12px",marginBottom:4}}>
                            <div style={{fontSize:7,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",marginBottom:6}}>Courbe du jour</div>
                            <ResponsiveContainer width="100%" height={80}>
                              <LineChart data={dpd} margin={{top:4,right:4,left:0,bottom:0}}>
                                <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" strokeWidth={1}/>
                                <Tooltip contentStyle={{background:"rgba(20,20,20,0.95)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:6,fontSize:10,fontFamily:"'Josefin Sans',sans-serif",color:"#fff"}} formatter={v=>[`${v>=0?"+":""}${v.toFixed(0)}${currency}`,"Cumulé"]} labelFormatter={l=>dpd.find(d=>d.label===l)?.instrument||""}/>
                                <Line type="monotone" dataKey="v" stroke={dtPnl>=0?"#4caf6e":"#e05a5a"} strokeWidth={2} dot={{r:3,fill:dtPnl>=0?"#4caf6e":"#e05a5a",strokeWidth:0}} activeDot={{r:5,strokeWidth:0}}/>
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CONFIRMATION DÉCONNEXION ── */}
      {showSignOutConfirm && (
        <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.55)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",animation:"fadeIn 0.2s ease"}} onClick={cancelSignOut}>
          <div onClick={e=>e.stopPropagation()} style={{width:320,background:C.bg2,border:`1px solid ${C.border}`,borderRadius:20,padding:"32px 28px",boxShadow:"0 32px 80px rgba(0,0,0,0.6),0 8px 24px rgba(0,0,0,0.3),0 0 0 1px rgba(255,255,255,0.08),inset 0 1px 0 rgba(255,255,255,0.2)",animation:`${signOutLeaving?"scaleOut":"scaleIn"} 0.25s cubic-bezier(.4,0,.2,1)`,textAlign:"center"}}>
            <div style={{width:52,height:52,borderRadius:16,background:"rgba(229,100,100,0.1)",border:"1px solid rgba(229,100,100,0.2)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",boxShadow:"0 0 24px rgba(229,100,100,0.12)"}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(229,100,100,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <div style={{fontFamily:"'Josefin Sans',sans-serif",fontSize:20,fontWeight:700,color:C.white,marginBottom:8,letterSpacing:"-0.025em"}}>Déconnexion</div>
            <div style={{fontFamily:"'Josefin Sans',sans-serif",fontSize:11,color:C.gray1,letterSpacing:"0.04em",lineHeight:1.6,marginBottom:28}}>Êtes-vous sûr de vouloir<br/>vous déconnecter ?</div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={cancelSignOut} style={{flex:1,padding:"11px",borderRadius:10,border:`1px solid ${C.border}`,background:"transparent",color:C.gray1,fontFamily:"'Josefin Sans',sans-serif",fontSize:11,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer"}}>Annuler</button>
              <button onClick={confirmSignOut} style={{flex:1,padding:"11px",borderRadius:10,border:"1px solid rgba(229,100,100,0.4)",background:"rgba(229,100,100,0.1)",color:"rgba(229,100,100,0.9)",fontFamily:"'Josefin Sans',sans-serif",fontSize:11,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer"}}>Se déconnecter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
