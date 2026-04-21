import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";

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
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=Josefin+Sans:wght@300;400;600&family=Barlow:wght@500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--bg, #f8f7f5);overflow-x:hidden;transition:background 0.3s;}
  input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.4);opacity:0.5;}
  ::selection{background:#111;color:#fff;}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-track{background:var(--bg, #f8f7f5);}
  ::-webkit-scrollbar-thumb{background:#ccc;border-radius:2px;}
  textarea{font-family:'Josefin Sans',sans-serif !important;}
  input, textarea, select{color:#1a1a1a !important;}
  @keyframes slideFromRight{from{opacity:0;transform:translateX(40px);}to{opacity:1;transform:translateX(0);}}
  @keyframes slideToRight{from{opacity:1;transform:translateX(0);}to{opacity:0;transform:translateX(40px);}}
  @keyframes fadeInUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
  @keyframes slideInAccount{from{opacity:0;transform:translateX(-24px);}to{opacity:1;transform:translateX(0);}}
  @keyframes slideOutAccount{from{opacity:1;transform:translateX(0);}to{opacity:0;transform:translateX(-24px);}}
  @keyframes fadeOutDown{from{opacity:1;transform:translateY(0);}to{opacity:0;transform:translateY(20px);}}
  @keyframes tabFadeIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
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
  borderRadius:6, padding:"13px 14px", color:C.white, fontSize:16,
  fontFamily:"'Josefin Sans',sans-serif", fontWeight:300, outline:"none",
  WebkitAppearance:"none", appearance:"none", letterSpacing:"0.05em",
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
  return (
    <button onClick={onClick} style={{ padding:"8px 12px", borderRadius:4, cursor:"pointer", transition:"all 0.15s", border:active ? `1px solid ${C.accent}` : `1px solid ${C.gray2}`, background:active ? "rgba(0,0,0,0.08)" : "transparent", color:active ? C.accent : C.gray1, fontSize:11, fontFamily:"'Josefin Sans',sans-serif", fontWeight:active ? 600 : 300, letterSpacing:"0.08em", textTransform:"uppercase", flex:"1 1 auto", minWidth:44 }}>
      {label}
    </button>
  );
}

function ChipGroup({ options, value, onChange }) {
  return <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>{options.map(o => <Chip key={o} label={o} active={value===o} onClick={() => onChange(o)} />)}</div>;
}

function StatCard({ label, value, color, small }) {
  return (
    <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderTop:`2px solid ${color||C.accent}`, borderRadius:10, padding:small ? (!isMobile?"20px 22px":"16px 18px") : (!isMobile?"28px 24px":"20px 18px"), position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at top left,rgba(0,0,0,0.02),transparent 70%)", pointerEvents:"none" }} />
      <div style={{ fontSize:9, color:C.dim, textTransform:"uppercase", letterSpacing:"0.18em", fontFamily:"'Josefin Sans',sans-serif", fontWeight:600, marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:small ? 16 : 24, fontWeight:300, color:color||C.white, fontFamily:"'Josefin Sans',sans-serif", lineHeight:1, letterSpacing:"0.05em" }}>{value}</div>
    </div>
  );
}

function PageTitle({ sub, title }) {
  return (
    <div style={{ marginBottom:22 }}>
      <div style={{ fontSize:11, color:C.dim, letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:4, fontFamily:"'Josefin Sans',sans-serif" }}>{sub}</div>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, fontWeight:600, color:C.white }}>{title}</div>
    </div>
  );
}

/* ─── Mobile Pill Nav ────────────────────────────────────────────── */
function PillNav({ view, setView }) {
  return (
    <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", zIndex:200, display:"flex", alignItems:"center", background:"rgba(18,18,18,0.92)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderRadius:50, padding:"6px 8px", gap:2, boxShadow:"0 8px 32px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)", border:"1px solid rgba(255,255,255,0.08)" }}>
      {NAV.map(item => {
        const active = view === item.key;
        return (
          <button key={item.key} onClick={() => setView(item.key)} style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, padding:"8px 14px", borderRadius:44, border:"none", cursor:"pointer", background:active ? "rgba(255,255,255,0.15)" : "transparent", transition:"all 0.25s cubic-bezier(.4,0,.2,1)", minWidth:52, position:"relative" }}>
            {item.key==="ai" && <span style={{position:"absolute",top:3,right:4,background:"linear-gradient(135deg,rgba(210,180,120,0.18),rgba(210,180,120,0.06))",border:"1px solid rgba(210,180,120,0.3)",color:"rgba(210,180,120,0.9)",fontSize:6,fontFamily:"'Josefin Sans',sans-serif",fontWeight:400,letterSpacing:"0.22em",padding:"2px 5px",borderRadius:4,textTransform:"uppercase",lineHeight:1.4,backdropFilter:"blur(4px)"}}>bientôt</span>}
            <span style={{ fontSize:16, lineHeight:1, color:active ? "#fff" : "rgba(255,255,255,0.4)", transition:"color 0.2s" }}>{item.icon}</span>
            <span style={{ fontSize:8, fontFamily:"'Josefin Sans',sans-serif", fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", color:active ? "#fff" : "rgba(255,255,255,0.35)", transition:"color 0.2s" }}>{item.label}</span>
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
function Sidebar({ view, setView }) {
  return (
    <div style={{ width:220, minHeight:"100vh", background:C.bg2, borderRight:`1px solid ${C.border}`, flexDirection:"column", position:"fixed", left:0, top:0, padding:"28px 0", zIndex:50, display:"flex" }}>
      <div style={{ padding:"0 20px 24px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <div style={{ width:38, height:38, borderRadius:10, background:"#111", border:"1px solid #2a2a2a", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><svg width="28" height="28" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="10,8 56,8 50,22 10,22" fill="#f0ede8"/>
              <polygon points="10,29 46,29 40,43 10,43" fill="#f0ede8"/>
              <polygon points="10,50 30,50 24,64 10,64" fill="#f0ede8"/>
            </svg></div>
          <div>
            <div style={{ fontFamily:"'Barlow',sans-serif", fontWeight:600, fontSize:18, letterSpacing:"0.2em", color:C.white, lineHeight:1, textTransform:"uppercase" }}>FYLTRA</div>
            <div style={{ fontSize:8, color:C.dim, letterSpacing:"0.25em", textTransform:"uppercase", fontFamily:"'Josefin Sans',sans-serif", fontWeight:300 }}>Carnet de santé trading</div>
          </div>
        </div>

      </div>
      <div style={{ padding:"16px 12px", flex:1, display:"flex", flexDirection:"column", justifyContent:"center" }}>
        <div style={{ background:"rgba(15,15,15,0.95)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderRadius:24, padding:"10px", boxShadow:"0 12px 40px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)", border:"1px solid rgba(255,255,255,0.07)" }}>
          {FULL_NAV.map(item => {
            const active = view === item.key;
            return (
              <button key={item.key} onClick={() => setView(item.key)} style={{
                display:"flex", alignItems:"center", gap:14, width:"100%",
                padding: active ? "10px 18px" : "10px 14px",
                borderRadius:16, border:"none", cursor:"pointer",
                background: active ? "#ffffff" : "transparent",
                marginBottom:4,
                transition:"all 0.25s cubic-bezier(.4,0,.2,1)",
                boxShadow: active ? "0 2px 12px rgba(0,0,0,0.25)" : "none",
                position:"relative",
              }}>
                <span style={{ fontSize:17, color:active ? "#111" : "rgba(255,255,255,0.4)", lineHeight:1, width:22, textAlign:"center", transition:"color 0.25s" }}>{item.icon}</span>
                <span style={{ fontSize:11, fontFamily:"'Josefin Sans',sans-serif", fontWeight: active ? 700 : 300, letterSpacing:"0.1em", textTransform:"uppercase", color:active ? "#111" : "rgba(255,255,255,0.4)", transition:"color 0.25s", whiteSpace:"nowrap" }}>{item.label}</span>
                {item.key==="ai" && <span style={{marginLeft:"auto",background:"linear-gradient(135deg,rgba(210,180,120,0.15),rgba(210,180,120,0.05))",border:"1px solid rgba(210,180,120,0.25)",color:"rgba(210,180,120,0.85)",fontSize:8,fontFamily:"'Josefin Sans',sans-serif",fontWeight:300,letterSpacing:"0.22em",padding:"3px 8px",borderRadius:4,textTransform:"uppercase",backdropFilter:"blur(4px)"}}>bientôt</span>}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ padding:"0 20px", fontSize:9, color:C.gray2, fontFamily:"'Josefin Sans',sans-serif", letterSpacing:"0.08em" }}>v1.0 · Fyltra</div>
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
                <div key={day} onClick={()=>{ if(onDayClick&&!isToday&&hasTrade){onDayClick({day,month:m,year:yr,pnl});}}} title={hasTrade ? `${pnl >= 0 ? "+" : ""}${pnl.toFixed(0)}${cur||"€"}` : ""} style={{ aspectRatio:"1", borderRadius:4, background:bg, border:isToday ? `1px solid ${C.accent}` : `1px solid ${hasTrade ? bg : C.gray3}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:hasTrade&&!isToday?"pointer":"default" }}>
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

/* ─── MAIN APP ───────────────────────────────────────────────────── */
export default function App() {
  const isMobile = useIsMobile();
  const [trades,      setTrades]      = useState(() => load(KEYS.trades, []));
  const [extraInstr,  setExtraInstr]  = useState(() => load(KEYS.instruments, []));
  const [extraEmotions, setExtraEmotions] = useState(() => load('fyltra_emotions_v1', []));
  const [customEmotion, setCustomEmotion] = useState('');
  const [beSign, setBeSign] = useState(1);
  const [tradeMode, setTradeMode] = useState("swing");
  const [tradeFixedMode, setTradeFixedMode] = useState("variable"); // "variable" | "fixe"
  const defaultTS = { tpFixed:{enabled:false,value:""}, slFixed:{enabled:false,value:""}, rrFixed:{enabled:false,value:""}, sizeFixed:{enabled:false,value:"",unit:"contrats"} };
  const [tradeSettings, setTradeSettings] = useState(() => load("fyltra_trade_settings_v1", defaultTS));
  const [savedTS, setSavedTS] = useState(() => load("fyltra_trade_settings_v1", defaultTS));
  const [scalpFields, setScalpFields] = useState({entry:false, rr:false, emotion:false, notes:false, size:false});
  const setTS = (key, changes) => setTradeSettings(p => ({...p, [key]:{...p[key],...changes}}));
  const [tsSaved, setTsSaved] = useState(false);
  const saveTS = () => { save("fyltra_trade_settings_v1", tradeSettings); setSavedTS(tradeSettings); setTsSaved(true); setTimeout(()=>setTsSaved(false),2000); };
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
  const [view,        setView]        = useState("propfirm");
  const [aiText,      setAiText]      = useState("");
  const [aiLoading,   setAiLoading]   = useState(false);
  const [aiError,     setAiError]     = useState("");
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
  const [form, setForm] = useState({ date:new Date().toISOString().split("T")[0], instrument:"MNQ", direction:"LONG", result:"WIN", session:"New York", emotion:"Neutre", entry:"", exit:"", rr:"", size:"", sizeUnit:"contrats", notes:"", accountIds:[], strategyId:null });

  const instruments = [...BASE_INSTRUMENTS, ...extraInstr, "Autre"];
  const availableYears = Array.from({ length:now0.getFullYear() - 2019 }, (_, i) => now0.getFullYear() - i);

  useEffect(() => { save(KEYS.trades,      trades);    }, [trades]);
  useEffect(() => { save(KEYS.instruments, extraInstr);}, [extraInstr]);
  useEffect(() => { save('fyltra_emotions_v1', extraEmotions); }, [extraEmotions]);
  useEffect(() => { save(KEYS.strategies,  strategies); }, [strategies]);
  useEffect(() => { save(KEYS.capital,     capital);   }, [capital]);
  useEffect(() => { save(KEYS.propfirms,   propfirms); }, [propfirms]);
  useEffect(() => { localStorage.setItem("fyltra_currency", currency); }, [currency]);
  useEffect(() => { localStorage.setItem("fyltra_dark", darkMode); document.documentElement.style.setProperty("--bg", darkMode?"#0f0f0f":"#f8f7f5"); document.body.style.background = darkMode?"#0f0f0f":"#f8f7f5"; document.body.style.color = darkMode?"#f0ede8":"#1a1a1a"; C = darkMode ? DARK_THEME : LIGHT_THEME; }, [darkMode]);
  useEffect(() => { localStorage.setItem("fyltra_lang", lang); }, [lang]);

  const set = (k, v) => setForm(f => ({ ...f, [k]:v }));
  // Scroll to top on view change
  useEffect(() => { window.scrollTo(0,0); if (view !== "settings") setTradeSettings(savedTS); }, [view, selectedPf]);
  // Pre-fill fixed values when switching to add view
  useEffect(() => {
    if (view === "add") {
      setPnlRaw("");
      setForm(f => ({ ...f, entry:"", exit:"", rr:"", size:"", notes:"", accountIds:[], strategyId:null }));
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

  const addTrade = () => {
    const p = computedPnl();
    if (p === null) return;
    if (tradeFixedMode === "fixe") {
      const tp  = savedTS.tpFixed.enabled && savedTS.tpFixed.value ? parseFloat(savedTS.tpFixed.value) : null;
      const sl  = savedTS.slFixed.enabled && savedTS.slFixed.value ? Math.abs(parseFloat(savedTS.slFixed.value)) : null;
      const rr  = savedTS.rrFixed.enabled && savedTS.rrFixed.value ? savedTS.rrFixed.value : form.rr;
      const sz  = savedTS.sizeFixed.enabled && savedTS.sizeFixed.value ? savedTS.sizeFixed.value : form.size;
      const szu = savedTS.sizeFixed.enabled && savedTS.sizeFixed.value ? savedTS.sizeFixed.unit : form.sizeUnit;
      const pnl = form.result === "WIN" ? ((tp ?? 0) || parseFloat(pnlRaw) || 0)
                : form.result === "LOSS" ? -((sl ?? 0) || parseFloat(pnlRaw) || 0)
                : 0;
      setTrades(prev => [{ ...form, pnl, rr, size:sz, sizeUnit:szu, id:Date.now() }, ...prev]);
    } else {
      setTrades(prev => [{ ...form, pnl:p, id:Date.now() }, ...prev]);
    }
    setPnlRaw(""); setForm(f => ({ ...f, entry:"", exit:"", rr:"", size:"", notes:"", accountIds:[], strategyId:null }));
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const deleteTrade = id => setTrades(p => p.filter(t => t.id !== id));
  const updateTrade = (id, ch) => setTrades(p => p.map(t => t.id === id ? { ...t, ...ch } : t));
  const startEdit = t => { setEditingTrade({ ...t }); setEditPnlRaw(String(Math.abs(t.pnl || 0))); };
  const cancelEdit = () => { setEditingTrade(null); setEditPnlRaw(""); };
  const saveEdit = () => {
    if (!editingTrade) return;
    const a = parseFloat(editPnlRaw);
    const p = isNaN(a) ? editingTrade.pnl : (editingTrade.result === "LOSS" ? -Math.abs(a) : editingTrade.result === "BREAKEVEN" ? 0 : Math.abs(a));
    updateTrade(editingTrade.id, { ...editingTrade, pnl:p });
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

  const analyzeAI = async () => {
    if (trades.length < 3) { setAiText("Ajoute au moins 3 trades pour obtenir une analyse."); return; }
    setAiLoading(true); setAiText(""); setAiError("");
    const summary = trades.slice(0, 20).map(t => `${t.date}|${t.instrument}|${t.direction}|${t.session}|${t.emotion}|RR:${t.rr||"—"}|P&L:${t.pnl}€|${t.result}${t.notes ? `|"${t.notes}"` : ""}`).join("\n");
    const strat = strategies[0] || {};
    const stratCtx = [strat.description && "Description: " + strat.description, strat.steps && strat.steps.length > 0 && "Étapes: " + strat.steps.map((s,i)=>`${i+1}. ${s}`).join("\n"), strat.rules && "Règles: " + strat.rules, strat.notes && "Notes: " + strat.notes].filter(Boolean).join("\n");
    const systemMsg = "Tu es un coach de trading professionnel et exigeant.\n" + (stratCtx ? "\nSTRATÉGIE DU TRADER:\n" + stratCtx + "\n" : "") + "\nAnalyse le journal. Donne:\n1) Ce qui fonctionne\n2) Erreurs récurrentes" + (stratCtx ? " (déviations de la stratégie aussi)" : "") + "\n3) 3 règles concrètes pour demain\nSoyez direct, sans fioritures. Répondez en français.";
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model:"claude-sonnet-4-5", max_tokens:1024, system:systemMsg, messages:[{ role:"user", content:`${trades.length} trades:\n\n${summary}` }] }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); setAiError(`Erreur ${res.status}: ${e?.error?.message || "inconnue"}`); setAiLoading(false); return; }
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text;
      if (text) setAiText(text); else setAiError("Réponse vide. Réessaie.");
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
          <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:6, padding:"16px 14px 10px" }}>
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
          <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:6, padding:"16px 14px" }}>
            <Calendar filtered={calFiltered} calMonth={calMonth} calYear={calYear} onPrev={prevMonth} onNext={nextMonth} />
          </div>
        </div>
      ) : (
        <div>
          <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:6, padding:"16px 14px 10px", marginBottom:14 }}>
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
          <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:6, padding:"16px 14px", marginBottom:14 }}>
              <Calendar filtered={calFiltered} calMonth={calMonth} calYear={calYear} onPrev={prevMonth} onNext={nextMonth} />
            </div>
        </div>
      )}

      {sessionStats.length > 0 && (
        <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:6, padding:18 }}>
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
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:C.gray1, marginBottom:14 }}>Commencez à enregistrer vos trades</div>
          <button onClick={() => setView("add")} style={{ background:C.accent, border:"none", borderRadius:4, padding:"11px 24px", color:darkMode?"#111":"#fff", fontSize:11, fontFamily:"'Josefin Sans',sans-serif", fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", cursor:"pointer" }}>+ Premier trade</button>
        </div>
      )}
    </div>
  );

  // ── Add Trade JSX ──
  const addTradeContent = (
    <div>
      <PageTitle sub="Enregistrer" title="Nouveau Trade" />

      {/* ── MODE SWITCH ── */}
      <div style={{display:"flex",gap:8,marginBottom:20,padding:4,background:C.bg2,borderRadius:12,border:`1px solid ${C.border}`}}>
        {[
          {k:"swing", label:"Swing / Day"},
          {k:"scalping", label:"Scalping"},
        ].map(m => (
          <button key={m.k} onClick={()=>setTradeMode(m.k)} style={{flex:1,padding:"10px 12px",borderRadius:9,border:"none",background:tradeMode===m.k?C.accent:"transparent",color:tradeMode===m.k?(darkMode?"#111":"#fff"):C.gray1,fontSize:11,fontFamily:"'Josefin Sans',sans-serif",fontWeight:tradeMode===m.k?600:300,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.22s",position:"relative",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
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

      <Field label="Date"><input type="date" value={form.date} onChange={e => set("date", e.target.value)} style={iStyle} /></Field>
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
      <div style={{display:"flex",gap:6,margin:"14px 0",padding:3,background:C.bg2,borderRadius:10,border:`1px solid ${C.border}`}}>
        {[{k:"variable",l:"Variable"},{k:"fixe",l:"Fixe"}].map(opt=>(
          <button key={opt.k} onClick={()=>setTradeFixedMode(opt.k)} style={{flex:1,padding:"8px",borderRadius:8,border:"none",background:tradeFixedMode===opt.k?C.accent:"transparent",color:tradeFixedMode===opt.k?(darkMode?"#111":"#fff"):C.gray1,fontSize:11,fontFamily:"'Josefin Sans',sans-serif",fontWeight:tradeFixedMode===opt.k?600:300,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.2s"}}>
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

      {strategies.length > 0 && (
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
              <div key={sec.title} style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:10,padding:"16px",marginBottom:12}}>
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
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:C.gray1 }}>Aucun trade enregistré</div>
        </div>
      ) : [...trades].sort((a, b) => b.date.localeCompare(a.date)).map(t => {
        const pnl = t.pnl || 0; const isWin = t.result === "WIN"; const isLoss = t.result === "LOSS"; const isEditing = editingTrade?.id === t.id;
        return (
          <div key={t.id} style={{ background:C.bg2, border:`1px solid ${isEditing ? C.accent : isWin ? "rgba(0,0,0,0.15)" : isLoss ? "rgba(0,0,0,0.08)" : C.border}`, borderLeft:`3px solid ${isEditing ? C.accent : isWin ? C.accent : isLoss ? C.gray2 : C.gray3}`, borderRadius:6, padding:"13px 15px", marginBottom:8, transition:"border 0.2s" }}>
            {!isEditing && (
              <>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:7 }}>
                  <div>
                    <span style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:17, color:C.white }}>{t.instrument}</span>
                    <span style={{ marginLeft:8, fontSize:10, color:C.gray1, fontFamily:"'Josefin Sans',sans-serif", fontWeight:600, letterSpacing:"0.1em" }}>{t.direction}</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontFamily:"'Josefin Sans',sans-serif", fontSize:16, fontWeight:300, color:pnl >= 0 ? C.accent : C.gray1, letterSpacing:"0.03em" }}>{pnl >= 0 ? "+" : ""}{pnl.toFixed(0)} €</span>
                    <button onClick={() => startEdit(t)} style={{ background:"none", border:`1px solid ${C.gray3}`, borderRadius:4, color:C.gray1, cursor:"pointer", fontSize:11, padding:"2px 7px", fontFamily:"'Josefin Sans',sans-serif" }}>✎</button>
                    <button onClick={() => deleteTrade(t.id)} style={{ background:"none", border:"none", color:C.gray2, cursor:"pointer", fontSize:17, lineHeight:1, padding:0 }}>×</button>
                  </div>
                </div>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  {[t.date, t.session, t.emotion, t.rr ? `RR ${t.rr}` : null].filter(Boolean).map((tag, i) => (
                    <span key={i} style={{ fontSize:10, color:C.gray1, background:C.bg3, padding:"2px 7px", borderRadius:3, letterSpacing:"0.07em", fontFamily:"'Josefin Sans',sans-serif", border:`1px solid ${C.gray3}` }}>{tag}</span>
                  ))}
                </div>
                {t.notes && <div style={{ marginTop:7, fontSize:12, color:C.gray1, lineHeight:1.6, fontStyle:"italic", fontFamily:"'Cormorant Garamond',serif" }}>{t.notes}</div>}
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
                      <button key={r} onClick={() => setEditingTrade(p => ({ ...p, result:r }))} style={{ flex:1, padding:"7px", borderRadius:4, border:`1px solid ${editingTrade.result === r ? C.accent : C.gray3}`, background:editingTrade.result === r ? "rgba(0,0,0,0.08)" : "transparent", color:editingTrade.result === r ? C.accent : C.gray1, fontSize:10, fontFamily:"'Josefin Sans',sans-serif", fontWeight:editingTrade.result === r ? 600 : 300, cursor:"pointer", textTransform:"uppercase" }}>{r}</button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom:8 }}>
                  <Label>Direction</Label>
                  <div style={{ display:"flex", gap:5 }}>
                    {["LONG","SHORT"].map(d => (
                      <button key={d} onClick={() => setEditingTrade(p => ({ ...p, direction:d }))} style={{ flex:1, padding:"7px", borderRadius:4, border:`1px solid ${editingTrade.direction === d ? C.accent : C.gray3}`, background:editingTrade.direction === d ? "rgba(0,0,0,0.08)" : "transparent", color:editingTrade.direction === d ? C.accent : C.gray1, fontSize:10, fontFamily:"'Josefin Sans',sans-serif", fontWeight:editingTrade.direction === d ? 600 : 300, cursor:"pointer", textTransform:"uppercase" }}>{d}</button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom:8 }}>
                  <Label>Session</Label>
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                    {SESSIONS.map(s => (
                      <button key={s} onClick={() => setEditingTrade(p => ({ ...p, session:s }))} style={{ flex:"1 1 auto", padding:"7px", borderRadius:4, border:`1px solid ${editingTrade.session === s ? C.accent : C.gray3}`, background:editingTrade.session === s ? "rgba(0,0,0,0.08)" : "transparent", color:editingTrade.session === s ? C.accent : C.gray1, fontSize:10, fontFamily:"'Josefin Sans',sans-serif", fontWeight:editingTrade.session === s ? 600 : 300, cursor:"pointer", textTransform:"uppercase" }}>{s}</button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom:8 }}>
                  <Label>Émotion</Label>
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                    {EMOTIONS.map(e => (
                      <button key={e} onClick={() => setEditingTrade(p => ({ ...p, emotion:e }))} style={{ flex:"1 1 auto", padding:"7px", borderRadius:4, border:`1px solid ${editingTrade.emotion === e ? C.accent : C.gray3}`, background:editingTrade.emotion === e ? "rgba(0,0,0,0.08)" : "transparent", color:editingTrade.emotion === e ? C.accent : C.gray1, fontSize:10, fontFamily:"'Josefin Sans',sans-serif", fontWeight:editingTrade.emotion === e ? 600 : 300, cursor:"pointer", textTransform:"uppercase" }}>{e}</button>
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
                  <button onClick={saveEdit} style={{ flex:2, padding:"9px", borderRadius:4, border:"none", background:C.accent, color:darkMode?"#111":"#fff", fontSize:11, fontFamily:"'Josefin Sans',sans-serif", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", cursor:"pointer" }}>✓ Sauvegarder</button>
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
        <button onClick={()=>{ const ns={id:Date.now(),name:"Nouvelle stratégie",description:"",steps:[],rules:"",notes:""}; setStrategies(p=>[...p,ns]); setActiveStratId(ns.id); }} style={{ padding:"8px 14px", borderRadius:4, border:"none", background:C.accent, color:darkMode?"#111":"#fff", fontSize:11, fontFamily:"'Josefin Sans',sans-serif", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", cursor:"pointer", marginBottom:22 }}>+ Nouvelle</button>
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
      <div style={{textAlign:"center",padding:"40px 20px 20px",display:"flex",flexDirection:"column",alignItems:"center",gap:20}}>
        <div style={{width:64,height:64,borderRadius:16,background:"linear-gradient(135deg,rgba(210,180,120,0.12),rgba(210,180,120,0.04))",border:"1px solid rgba(210,180,120,0.2)",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(210,180,120,0.7)",fontSize:24}}>◆</div>
        <div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:300,color:C.white,marginBottom:10}}>Bientôt disponible</div>
          <div style={{fontSize:11,color:C.dim,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.1em",lineHeight:1.9,maxWidth:320,margin:"0 auto"}}>L'analyse IA croisera vos trades avec votre stratégie pour détecter chaque déviation de votre plan.</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8,width:"100%",maxWidth:340}}>
          {["Détection des déviations de stratégie","Debriefing automatique fin de journée","3 règles concrètes pour demain"].map((f,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",borderRadius:8,background:C.bg2,border:`1px solid ${C.border}`}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:"rgba(210,180,120,0.45)",flexShrink:0}}/>
              <span style={{fontSize:11,color:C.gray1,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.06em"}}>{f}</span>
            </div>
          ))}
        </div>
        <span style={{background:"linear-gradient(135deg,rgba(210,180,120,0.15),rgba(210,180,120,0.05))",border:"1px solid rgba(210,180,120,0.25)",color:"rgba(210,180,120,0.85)",fontSize:9,fontFamily:"'Josefin Sans',sans-serif",fontWeight:300,letterSpacing:"0.28em",padding:"6px 18px",borderRadius:6,textTransform:"uppercase",marginTop:4}}>Bientôt</span>
      </div>
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
          <button onClick={()=>setPfView("add-type")} style={{ padding:"9px 16px", borderRadius:4, border:"none", background:C.accent, color:darkMode?"#111":"#fff", fontSize:11, fontFamily:"'Josefin Sans',sans-serif", fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", cursor:"pointer", marginBottom:24 }}>+ Ajouter</button>
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
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:C.gray1,marginBottom:14}}>Aucun compte enregistré</div>
          <button onClick={(e)=>{e.stopPropagation();setPfView("add-type");}} style={{background:C.accent,border:"none",borderRadius:4,padding:"11px 24px",color:darkMode?"#111":"#fff",fontSize:11,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,letterSpacing:"0.15em",textTransform:"uppercase",cursor:"pointer"}}>+ Ajouter un compte</button>
        </div>
      )}

      {pfView==="list" && propfirms.map(pf => {
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
          <div key={pf.id} style={{background:C.bg2,border:`1px solid ${isInDanger?"rgba(192,57,43,0.3)":C.border}`,borderRadius:8,padding:!isMobile?"24px 20px":"18px 16px",marginBottom:!isMobile?18:14,cursor:editingPf?.id===pf.id?"default":"pointer"}} onClick={()=>{ if(!editingPf) setSelectedPf(pf); }}>
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
                  <button onClick={()=>{setPropfirms(p=>p.map(x=>x.id===editingPf.id?{...editingPf}:x));setEditingPf(null);}} style={{flex:2,padding:"9px",borderRadius:4,border:"none",background:C.accent,color:darkMode?"#111":"#fff",fontSize:11,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>✓ Sauvegarder</button>
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

    const MiniCard = ({label, value, color, sub}) => (
      <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:10,padding:!isMobile?"20px 20px":"12px 14px"}}>
        <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,marginBottom:!isMobile?10:6}}>{label}</div>
        <div style={{fontSize:!isMobile?28:20,fontWeight:300,color:color||C.white,fontFamily:"'Josefin Sans',sans-serif",lineHeight:1}}>{value}</div>
        {sub && <div style={{fontSize:11,color:C.gray1,fontFamily:"'Josefin Sans',sans-serif",marginTop:6}}>{sub}</div>}
      </div>
    );

    return (
      <div style={{animation:`${accountLeaving?"slideOutAccount":"slideInAccount"} 0.28s cubic-bezier(.4,0,.2,1)`}}>
        {/* ── HEADER ── */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
          <button onClick={closeAccount} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,padding:"6px 12px",color:C.gray1,cursor:"pointer",fontSize:11,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.1em",textTransform:"uppercase"}}>← Retour</button>
          <div>
            <div style={{fontFamily:"'Barlow',sans-serif",fontWeight:600,fontSize:18,color:C.white,letterSpacing:"0.1em"}}>{pf.firm}</div>
            {pf.name && <div style={{fontSize:11,color:C.gray1,fontFamily:"'Josefin Sans',sans-serif"}}>{pf.name}</div>}
          </div>
          <div style={{marginLeft:"auto",textAlign:"right"}}>
            <div style={{fontSize:10,color:C.dim,fontFamily:"'Josefin Sans',sans-serif",textTransform:"uppercase",letterSpacing:"0.1em"}}>{pf.type==="propfirm"?"Prop Firm":"Fond Propre"} · {cap.toLocaleString()}€</div>
            <div style={{fontSize:20,color:allPnl>=0?"#2a6e3a":"#c0392b",fontFamily:"'Josefin Sans',sans-serif",fontWeight:300}}>{allPnl>=0?"+":""}{allPnl.toFixed(0)}{currency} <span style={{fontSize:12,color:cap>0?(allPnl/cap*100>=0?"#2a6e3a":"#c0392b"):C.dim}}>{cap>0?`(${(allPnl/cap*100).toFixed(1)}%)`:"" }</span></div>
          </div>
        </div>

        {/* ── GLOBAL / TODAY TOGGLE ── */}
        <div style={{display:"flex",gap:6,marginBottom:16,background:C.bg2,borderRadius:10,padding:4,border:`1px solid ${C.border}`}}>
          {[{k:"today",l:"Aujourd'hui"},{k:"global",l:"Global"}].map(opt=>(
            <button key={opt.k} onClick={()=>setAcctView(opt.k)} style={{flex:1,padding:"9px",borderRadius:7,border:"none",background:acctView===opt.k?C.accent:"transparent",color:acctView===opt.k?(darkMode?"#111":"#fff"):C.gray1,fontSize:11,fontFamily:"'Josefin Sans',sans-serif",fontWeight:acctView===opt.k?600:300,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.2s"}}>{opt.l}</button>
          ))}
        </div>

        {/* ── ALERTS ── */}
        {alerts.map((a,i)=>(
          <div key={i} style={{padding:"8px 12px",borderRadius:6,marginBottom:8,background:a.type==="danger"?"rgba(192,57,43,0.08)":a.type==="warn"?"rgba(180,120,0,0.08)":a.type==="success"?"rgba(42,110,58,0.08)":"rgba(0,0,0,0.04)",border:`1px solid ${a.type==="danger"?"rgba(192,57,43,0.25)":a.type==="warn"?"rgba(180,120,0,0.25)":a.type==="success"?"rgba(42,110,58,0.25)":C.border}`}}>
            <div style={{fontSize:12,color:C.white,fontFamily:"'Josefin Sans',sans-serif",lineHeight:1.5}}>{a.msg}</div>
          </div>
        ))}

        {/* ── PROGRESS BARS (prop firm) ── */}
        {pf.type==="propfirm" && (
          <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:8,padding:!isMobile?"22px 20px":"14px 16px",marginBottom:!isMobile?16:12}}>
            <div style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:10,color:C.dim,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.1em",textTransform:"uppercase"}}>Profit Target</span>
                <span style={{fontSize:10,color:C.dim,fontFamily:"'Josefin Sans',sans-serif"}}>{allPnl.toFixed(0)}{currency} / {target}{currency} · {progress.toFixed(0)}%</span>
              </div>
              <div style={{height:6,background:C.gray3,borderRadius:3}}>
                <div style={{width:progress+"%",height:"100%",borderRadius:3,background:progress>=100?"#2a6e3a":"#2a6e3a",transition:"width 0.6s"}}/>
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
        )}

        {/* ── TODAY CARD ── */}
        <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:8,padding:!isMobile?"22px 20px":"14px 16px",marginBottom:!isMobile?16:12}}>
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

        {/* ── TODAY METRICS ── */}
        {(() => {
          const todayWins=statsTrades.filter(t=>t.result==="WIN").length;
          const todayLosses=statsTrades.filter(t=>t.result==="LOSS").length;
          const todayTotal=statsTrades.length;
          const todayWR=todayTotal?Math.round(todayWins/todayTotal*100):0;
          const todayAvgW=todayWins?statsTrades.filter(t=>t.result==="WIN").reduce((s,t)=>s+(t.pnl||0),0)/todayWins:0;
          const todayAvgL=todayLosses?Math.abs(statsTrades.filter(t=>t.result==="LOSS").reduce((s,t)=>s+(t.pnl||0),0)/todayLosses):0;
          const todayPF=todayAvgL>0?(todayAvgW*todayWins/(todayAvgL*todayLosses)).toFixed(2):todayWins>0?"∞":"—";
          const todayRR=todayTotal?(statsTrades.reduce((s,t)=>s+(parseFloat(t.rr)||0),0)/todayTotal).toFixed(1):"—";
          const longT=statsTrades.filter(t=>t.direction==="LONG");
          const shortT=statsTrades.filter(t=>t.direction==="SHORT");
          const longWR=longT.length?Math.round(longT.filter(t=>t.result==="WIN").length/longT.length*100):0;
          const shortWR=shortT.length?Math.round(shortT.filter(t=>t.result==="WIN").length/shortT.length*100):0;
          return (
            <div style={{marginBottom:12}}>
              <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,marginBottom:8}}>Statistiques · {acctView==="global"?"Global":"Aujourd'hui"}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:8}}>
<MiniCard label="Profit Factor" value={todayPF==="—"||todayPF==="∞"?todayPF:todayPF+"x"} color={parseFloat(todayPF)>=1||todayPF==="∞"?"#2a6e3a":"#c0392b"}/>
                <MiniCard label="RR Moyen" value={todayRR==="—"?"—":todayRR+":1"} color={C.dim}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr",gap:8}}>
                <MiniCard label="Nb Trades" value={todayTotal||"—"} color={C.white}/>
              </div>
            </div>
          );
        })()}

        {/* ── WIN/LOSS + DIRECTION ── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
          {/* Win/Loss gauge */}
          <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:10,padding:!isMobile?"30px 24px":"14px",display:"flex",flexDirection:"column",alignItems:"center"}}>
            <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,marginBottom:4,alignSelf:"flex-start"}}>Winrate · Aujourd'hui</div>
            {(() => { const tw=statsTrades.filter(t=>t.result==="WIN").length; const tl=statsTrades.filter(t=>t.result==="LOSS").length; const tt=statsTrades.length; return tt>0 ? (((wins, losses, total, size=130) => {
              const r=46, cx=size/2, cy=size*0.52, sw=13, PI=Math.PI;
              const wFrac=total>0?wins/total:0;
              const lFrac=total>0?losses/total:0;
              const wr=total?Math.round(wins/total*100):0;
              // Points: left=(cx-r,cy), right=(cx+r,cy), top=(cx,cy-r)
              // Clockwise from left to right = sweep=1, large=1 for half circle
              const LEFT={x:cx-r,y:cy}, RIGHT={x:cx+r,y:cy};
              const angleToXY=(deg)=>({x:cx+r*Math.cos(deg*PI/180), y:cy-r*Math.sin(deg*PI/180)});
              // Full bg arc: 180deg to 0deg clockwise
              const bgArc=`M${LEFT.x},${LEFT.y} A${r},${r} 0 0 1 ${RIGHT.x},${RIGHT.y}`;
              // Win arc: from 180deg, goes clockwise by wFrac*180
              const wDeg=180-wFrac*180;
              const wPt=angleToXY(wDeg);
              const winArc=wFrac>0.01?`M${LEFT.x},${LEFT.y} A${r},${r} 0 ${wFrac>=1?1:0} 1 ${wPt.x.toFixed(1)},${wPt.y.toFixed(1)}`:"";
              // Loss arc: from 0deg, goes counter-clockwise by lFrac*180
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
          {/* Direction breakdown — TODAY */}
          <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:8,padding:"14px"}}>
            <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,marginBottom:10}}>Direction · {acctView==="global"?"Global":"Aujourd'hui"}</div>
            {[{d:"LONG",color:"#2a6e3a"},{d:"SHORT",color:"#c0392b"}].map(({d,color})=>{
              const dt=(acctView==="global"?acctTrades:todayTrades).filter(t=>t.direction===d);
              const dw=dt.filter(t=>t.result==="WIN").length;
              const dpnl=dt.reduce((s,t)=>s+(t.pnl||0),0);
              const dwr=dt.length?Math.round(dw/dt.length*100):0;
              return (
                <div key={d} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:11,color:C.white,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600}}>{d}</span>
                    <span style={{fontSize:11,color:dpnl>=0?"#2a6e3a":"#c0392b",fontFamily:"'Josefin Sans',sans-serif"}}>{dpnl>=0?"+":""}{dpnl.toFixed(0)}{currency} · {dwr}%</span>
                  </div>
                  <div style={{height:4,background:C.gray3,borderRadius:2}}>
                    <div style={{width:dwr+"%",height:"100%",borderRadius:2,background:color,transition:"width 0.5s"}}/>
                  </div>
                  <div style={{fontSize:9,color:C.gray1,fontFamily:"'Josefin Sans',sans-serif",marginTop:2}}>{dt.length} trade{dt.length!==1?"s":""}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── EQUITY CURVE ── */}
        <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:8,padding:!isMobile?"24px 20px 14px":"16px 14px 10px",marginBottom:!isMobile?16:12}}>
          <div style={{fontSize:9,color:C.dim,letterSpacing:"0.2em",textTransform:"uppercase",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,marginBottom:10}}>Courbe d'équité</div>
          {(acctView==="global"?acctTrades:todayTrades).length>1 ? <PnlChart filtered={acctView==="global"?acctTrades:todayTrades} capital={pf.capital} pnlSum={acctView==="global"?allPnl:todayTrades.reduce((s,t)=>s+(t.pnl||0),0)} height={!isMobile?260:160} cur={currency}/>
          : <div style={{textAlign:"center",padding:"32px 0",color:C.gray2,fontSize:11,fontFamily:"'Josefin Sans',sans-serif"}}>Aucun trade</div>}
        </div>

        {/* ── SESSIONS today only ── */}
        {(() => { const todaySessions = SESSIONS.map(s=>{const st=(acctView==="global"?acctTrades:todayTrades).filter(t=>t.session===s);const wr=st.length?Math.round(st.filter(t=>t.result==="WIN").length/st.length*100):0;return{name:s,count:st.length,wr,pnl:st.reduce((a,t)=>a+(t.pnl||0),0)};}).filter(s=>s.count>0); return todaySessions.length>0 && (
          <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:8,padding:!isMobile?"22px 20px":"14px 16px",marginBottom:!isMobile?16:12}}>
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

        {/* ── INSTRUMENTS today only ── */}
        {(() => { const todayInstr = (() => { const byI={}; (acctView==="global"?acctTrades:todayTrades).forEach(t=>{ if(!byI[t.instrument]) byI[t.instrument]={count:0,wins:0,pnl:0}; byI[t.instrument].count++; if(t.result==="WIN") byI[t.instrument].wins++; byI[t.instrument].pnl+=t.pnl||0; }); return Object.entries(byI).map(([name,v])=>({name,count:v.count,wr:Math.round(v.wins/v.count*100),pnl:v.pnl})); })(); return todayInstr.length>0 && (
          <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:8,padding:!isMobile?"22px 20px":"14px 16px",marginBottom:!isMobile?16:12}}>
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

        {/* ── EMOTIONS today only ── */}
        {(() => {
          const todayEmotions = EMOTIONS.map(e => {
            const et = (acctView==="global"?acctTrades:todayTrades).filter(t=>t.emotion===e);
            const wr = et.length ? Math.round(et.filter(t=>t.result==="WIN").length/et.length*100) : 0;
            return { name:e, count:et.length, wr, pnl:et.reduce((a,t)=>a+(t.pnl||0),0) };
          }).filter(e=>e.count>0);
          return todayEmotions.length>0 ? (
            <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:8,padding:!isMobile?"22px 20px":"14px 16px",marginBottom:!isMobile?16:12}}>
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

        {/* ── CALENDAR ── */}
        <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:8,padding:"16px 14px",marginBottom:12}}>
          <Calendar filtered={acctTrades} calMonth={pfCalMonth} calYear={pfCalYear} onPrev={prevPfMonth} onNext={nextPfMonth} cur={currency} onDayClick={({day,month,year})=>{
              const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
              const dayTrades=acctTrades.filter(t=>t.date===dateStr);
              const dayPnl=dayTrades.reduce((s,t)=>s+(t.pnl||0),0);
              setSelectedDay({date:dateStr,trades:dayTrades,pnl:dayPnl});
          }}/>
        </div>

        {/* ── RECENT TRADES ── */}
        {true && (
          <div style={{marginBottom:12}}>
            <div style={{fontSize:9,color:C.dim,letterSpacing:"0.2em",textTransform:"uppercase",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,marginBottom:10}}>Trades · {acctView==="global"?"Global":"Aujourd'hui"}</div>
            {(acctView==="global"?acctTrades:todayTrades).length===0?<div style={{padding:"12px 0",color:C.gray2,fontSize:11,fontFamily:"'Josefin Sans',sans-serif",textAlign:"center"}}>Aucun trade aujourd'hui</div>:[...(acctView==="global"?acctTrades:todayTrades)].sort((a,b)=>b.date.localeCompare(a.date)).map(t=>{
              const pnl=t.pnl||0;
              return (
                <div key={t.id} style={{background:C.bg2,border:`1px solid ${C.border}`,borderLeft:`3px solid ${t.result==="WIN"?"#2a6e3a":t.result==="LOSS"?"#c0392b":C.gray3}`,borderRadius:6,padding:"10px 14px",marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
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
        )}

        {/* ── EOD + ACTIONS ── */}
        <button onClick={()=>{setEodText("");runEOD(pf);}} disabled={eodLoading} style={{width:"100%",padding:"13px",borderRadius:8,border:`1px solid ${C.borderGold}`,background:eodLoading?"transparent":"rgba(0,0,0,0.04)",color:eodLoading?C.gray2:C.dim,fontSize:12,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,letterSpacing:"0.15em",textTransform:"uppercase",cursor:eodLoading?"not-allowed":"pointer",marginBottom:8,transition:"all 0.3s"}}>
          {eodLoading?"◌  Analyse en cours...":"◆  Debriefing fin de journée"}
        </button>
        {eodText && <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:8,padding:20,fontSize:13,lineHeight:1.8,color:C.white,whiteSpace:"pre-wrap",fontFamily:"'Cormorant Garamond',serif",marginBottom:10}}>{eodText}</div>}

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
    const summary = todayTrades.map(t=>`${t.instrument}|${t.direction}|${t.session}|${t.emotion}|RR:${t.rr||"—"}|P&L:${t.pnl}€|${t.result}${t.notes?`|"${t.notes}"`:""}`).join("\n");
    const todayPnl = todayTrades.reduce((s,t)=>s+(t.pnl||0),0);
    const systemMsg = "Tu es un coach de trading direct et exigeant. Fais un debriefing de fin de journée. Analyse : 1) ✅ Ce qui s'est bien passé 2) ❌ Ce qui doit être amélioré 3) 📌 1 règle à appliquer demain. Sois court, direct, sans blabla. Réponds en français.";
    const userMsg = `Compte: ${pf.firm}${pf.name?" "+pf.name:""}\nP&L du jour: ${todayPnl>=0?"+":""}${todayPnl.toFixed(0)}${currency}\n${todayTrades.length} trades:\n${summary}`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-5",max_tokens:600,system:systemMsg,messages:[{role:"user",content:userMsg}]})});
      if(!res.ok){const e=await res.json().catch(()=>({}));setEodText("Erreur: "+(e?.error?.message||"inconnue"));setEodLoading(false);return;}
      const data=await res.json();
      const text=data.content?.find(b=>b.type==="text")?.text;
      if(text) setEodText(text); else setEodText("Réponse vide.");
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
                <button onClick={confirmImport} style={{flex:2,padding:"11px",borderRadius:4,border:"none",background:C.accent,color:darkMode?"#111":"#fff",fontSize:12,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>✓ Importer</button>
                <button onClick={()=>setCsvResult(null)} style={{flex:1,padding:"11px",borderRadius:4,border:`1px solid ${C.gray3}`,background:"transparent",color:C.gray1,fontSize:12,fontFamily:"'Josefin Sans',sans-serif",cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.1em"}}>Annuler</button>
              </div>
            </div>
          )}
          {!csvResult && <button onClick={importCSV} style={{width:"100%",padding:"14px",borderRadius:4,border:"none",background:C.accent,color:darkMode?"#111":"#fff",fontSize:12,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,letterSpacing:"0.2em",textTransform:"uppercase",cursor:"pointer"}}>Analyser le CSV →</button>}
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
            <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:8,padding:"20px",marginTop:8}}>
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
      <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:8,padding:"18px 16px",marginBottom:12}}>
        <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,marginBottom:14}}>Devise</div>
        <div style={{display:"flex",gap:8}}>
          {["€","$","£"].map(c=>(
            <button key={c} onClick={()=>setCurrency(c)} style={{flex:1,padding:"12px",borderRadius:8,border:`1px solid ${currency===c?C.accent:C.border}`,background:currency===c?"rgba(0,0,0,0.08)":"transparent",color:currency===c?C.accent:C.gray1,fontSize:18,cursor:"pointer",fontFamily:"'Josefin Sans',sans-serif",fontWeight:currency===c?600:300,transition:"all 0.2s"}}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:8,padding:"18px 16px",marginBottom:12}}>
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
      <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:8,padding:"18px 16px",marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
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
      <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:8,padding:"18px 16px",marginBottom:12}}>
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
      <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:8,padding:"18px 16px"}}>
        <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,marginBottom:4}}>Version</div>
        <div style={{fontSize:13,color:C.gray1,fontFamily:"'Josefin Sans',sans-serif"}}>FYLTRA v1.0 · Trading Journal</div>
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
  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.white, fontFamily:"'Josefin Sans',sans-serif" }}>
      <style>{FONTS}</style>

      {isMobile ? (
        /* ── MOBILE ── */
        <div style={{ minHeight:"100vh", paddingBottom:100 }}>
          <div style={{ padding:"16px 20px", background:`linear-gradient(180deg,${C.bg2},${C.bg})`, borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:50, backdropFilter:"blur(16px)", flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <div style={{ width:34, height:34, borderRadius:9, background:"#111", border:"1px solid #2a2a2a", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><svg width="26" height="26" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="10,8 56,8 50,22 10,22" fill="#f0ede8"/>
                <polygon points="10,29 46,29 40,43 10,43" fill="#f0ede8"/>
                <polygon points="10,50 30,50 24,64 10,64" fill="#f0ede8"/>
              </svg></div>
              <div>
                <div style={{ fontFamily:"'Barlow',sans-serif", fontWeight:600, fontSize:17, letterSpacing:"0.2em", color:C.white, lineHeight:1, textTransform:"uppercase" }}>FYLTRA</div>
                <div style={{ fontSize:7, color:C.dim, letterSpacing:"0.25em", textTransform:"uppercase", fontFamily:"'Josefin Sans',sans-serif", fontWeight:300 }}>Trading Journal</div>
              </div>
            </div>
            <button onClick={()=>showMenu?closeMenu():setShowMenu(true)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",color:C.gray1,cursor:"pointer",display:"flex",flexDirection:"column",gap:"4px",alignItems:"center",justifyContent:"center"}}>
              <div style={{width:16,height:1.5,background:C.gray1,borderRadius:1}}/>
              <div style={{width:16,height:1.5,background:C.gray1,borderRadius:1}}/>
              <div style={{width:16,height:1.5,background:C.gray1,borderRadius:1}}/>
            </button>

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
          <PillNav view={view} setView={setView} />
        </div>
      ) : (
        /* ── DESKTOP ── */
        <div style={{ display:"flex", minHeight:"100vh" }}>
          <Sidebar view={view} setView={setView} />
          <div style={{ marginLeft:220, flex:1, display:"flex", flexDirection:"column" }}>
            <div style={{ padding:"20px 36px 18px", borderBottom:`1px solid ${C.border}`, background:C.bg, position:"sticky", top:0, zIndex:40, backdropFilter:"blur(12px)" }}>
              <div style={{ fontSize:11, color:C.dim, letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:2, fontFamily:"'Josefin Sans',sans-serif" }}>{FULL_NAV.find(n => n.key === view)?.label}</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:30, fontWeight:600, color:C.white, letterSpacing:"-0.01em" }}>
                {view === "propfirm" ? (selectedPf ? selectedPf.firm + (selectedPf.name ? " · " + selectedPf.name : "") : "Mes Comptes") : view === "add" ? "Nouveau Trade" : view === "history" ? "Statistiques" : view === "strategy" ? "Plan de Trading" : view === "tools" ? "Outils" : "Analyse IA"}
              </div>
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
    </div>
  );
}
