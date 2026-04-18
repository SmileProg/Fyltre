import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

/* ─── Constants ─────────────────────────────────────────────────── */
const BASE_INSTRUMENTS = ["MNQ","NQ","ES","MES","CL","GC","EUR/USD"];
const EMOTIONS = ["Confiant","Neutre","Anxieux","Euphorique","Frustré","Patient"];
const SESSIONS = ["Asia","London","New York","Overlap"];
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const MONTHS_SH = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];
const KEYS = { trades:"fyltre_trades_v1", instruments:"fyltre_instr_v1", strategy:"fyltre_strat_v1", capital:"fyltre_cap_v1", propfirms:"fyltre_propfirms_v1" };
const NAV = [
  { key:"propfirm",  icon:"◉",  label:"Compte" },
  { key:"add",       icon:"＋", label:"Trade" },
  { key:"history",   icon:"≡",  label:"Historique" },
  { key:"strategy",  icon:"◈",  label:"Plan" },
  { key:"ai",        icon:"◆",  label:"IA" },
];

/* ─── Colors ─────────────────────────────────────────────────────── */
const C = {
  bg:"#f8f7f5", bg2:"#f0ede8", bg3:"#e8e4de",
  white:"#1a1a1a", gray1:"#888", gray2:"#bbb", gray3:"#ddd",
  accent:"#111", dim:"#555",
  border:"rgba(0,0,0,0.1)", borderGold:"rgba(0,0,0,0.15)",
};

/* ─── Fonts / Global CSS ─────────────────────────────────────────── */
const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600;700&family=Josefin+Sans:wght@300;400;600&family=Barlow:wght@500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#f8f7f5;overflow-x:hidden;}
  input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.4);opacity:0.5;}
  ::selection{background:#111;color:#fff;}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-track{background:#f8f7f5;}
  ::-webkit-scrollbar-thumb{background:#ccc;border-radius:2px;}
  textarea{font-family:'Josefin Sans',sans-serif !important;}
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
    <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderTop:`2px solid ${color||C.accent}`, borderRadius:6, padding:small ? "12px 14px" : "16px 14px", position:"relative", overflow:"hidden" }}>
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
          <button key={item.key} onClick={() => setView(item.key)} style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, padding:"8px 14px", borderRadius:44, border:"none", cursor:"pointer", background:active ? "rgba(255,255,255,0.15)" : "transparent", transition:"all 0.25s cubic-bezier(.4,0,.2,1)", minWidth:52 }}>
            <span style={{ fontSize:16, lineHeight:1, color:active ? "#fff" : "rgba(255,255,255,0.4)", transition:"color 0.2s" }}>{item.icon}</span>
            <span style={{ fontSize:8, fontFamily:"'Josefin Sans',sans-serif", fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", color:active ? "#fff" : "rgba(255,255,255,0.35)", transition:"color 0.2s" }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Desktop Sidebar ────────────────────────────────────────────── */
function Sidebar({ view, setView, total, pnlSum }) {
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
            <div style={{ fontFamily:"'Barlow',sans-serif", fontWeight:600, fontSize:18, letterSpacing:"0.2em", color:C.white, lineHeight:1, textTransform:"uppercase" }}>FYLTRE</div>
            <div style={{ fontSize:8, color:C.dim, letterSpacing:"0.25em", textTransform:"uppercase", fontFamily:"'Josefin Sans',sans-serif", fontWeight:300 }}>Trading Journal</div>
          </div>
        </div>
        {total > 0 && (
          <div style={{ background:C.bg3, borderRadius:6, padding:"10px 12px" }}>
            <div style={{ fontSize:9, color:C.dim, textTransform:"uppercase", letterSpacing:"0.12em", fontFamily:"'Josefin Sans',sans-serif", marginBottom:3 }}>{total} trade{total !== 1 ? "s" : ""}</div>
            <div style={{ fontSize:20, color:C.accent, fontFamily:"'Josefin Sans',sans-serif", fontWeight:300 }}>{pnlSum >= 0 ? "+" : ""}{pnlSum.toFixed(0)} €</div>
          </div>
        )}
      </div>
      <div style={{ padding:"16px 12px", flex:1, display:"flex", flexDirection:"column", justifyContent:"center" }}>
        <div style={{ background:"rgba(15,15,15,0.95)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderRadius:24, padding:"10px", boxShadow:"0 12px 40px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)", border:"1px solid rgba(255,255,255,0.07)" }}>
          {NAV.map(item => {
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
              }}>
                <span style={{ fontSize:17, color:active ? "#111" : "rgba(255,255,255,0.4)", lineHeight:1, width:22, textAlign:"center", transition:"color 0.25s" }}>{item.icon}</span>
                <span style={{ fontSize:11, fontFamily:"'Josefin Sans',sans-serif", fontWeight: active ? 700 : 300, letterSpacing:"0.1em", textTransform:"uppercase", color:active ? "#111" : "rgba(255,255,255,0.4)", transition:"color 0.25s", whiteSpace:"nowrap" }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ padding:"0 20px", fontSize:9, color:C.gray2, fontFamily:"'Josefin Sans',sans-serif", letterSpacing:"0.08em" }}>v1.0 · Fyltre</div>
    </div>
  );
}

/* ─── Calendar ───────────────────────────────────────────────────── */
function Calendar({ filtered, calMonth, calYear, onPrev, onNext }) {
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
                <div key={day} title={hasTrade ? `${pnl >= 0 ? "+" : ""}${pnl.toFixed(0)}€` : ""} style={{ aspectRatio:"1", borderRadius:4, background:bg, border:isToday ? `1px solid ${C.accent}` : `1px solid ${hasTrade ? bg : C.gray3}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
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
function PnlChart({ filtered, capital, pnlSum, height }) {
  if (filtered.length < 2) return null;
  const startCapital = parseFloat(capital) || 0;
  let cum = startCapital;
  const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));
  const data = [{ date:"Départ", v:0, total:startCapital }, ...sorted.map(t => { cum += t.pnl || 0; return { date:t.date.slice(5), v:parseFloat((cum - startCapital).toFixed(2)), total:parseFloat(cum.toFixed(2)) }; })];
  const vals = data.map(d => d.v);
  const minV = Math.min(...vals), maxV = Math.max(...vals);
  const pad = Math.max(Math.abs(maxV - minV) * 0.2, 50);
  return (
    <ResponsiveContainer width="100%" height={height || 150}>
      <LineChart data={data} margin={{ top:4, right:4, left:0, bottom:0 }}>
        <XAxis dataKey="date" tick={{ fontSize:9, fontFamily:"'Josefin Sans',sans-serif", fill:C.gray1 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis domain={[minV - pad, maxV + pad]} tick={{ fontSize:9, fontFamily:"'Josefin Sans',sans-serif", fill:C.gray1 }} tickLine={false} axisLine={false} width={46} tickFormatter={v => `${v > 0 ? "+" : ""}${Math.round(v)}€`} />
        <Tooltip contentStyle={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:4, fontSize:11, fontFamily:"'Josefin Sans',sans-serif", color:C.white }} formatter={(v, n, p) => [`${v >= 0 ? "+" : ""}${v.toFixed(0)}€${capital ? " · " + p.payload.total.toFixed(0) + "€" : ""}`, "P&L"]} labelStyle={{ color:C.gray1, marginBottom:4 }} />
        <ReferenceLine y={0} stroke={C.gray3} strokeDasharray="3 3" />
        <Line type="monotone" dataKey="v" stroke={C.accent} strokeWidth={2} dot={false} activeDot={{ r:4, fill:C.accent, strokeWidth:0 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ─── MAIN APP ───────────────────────────────────────────────────── */
export default function App() {
  const isMobile = useIsMobile();
  const [trades,      setTrades]      = useState(() => load(KEYS.trades, []));
  const [extraInstr,  setExtraInstr]  = useState(() => load(KEYS.instruments, []));
  const [strategy,    setStrategy]    = useState(() => { const s = load(KEYS.strategy, { description:"", steps:[], rules:"", notes:"" }); if (typeof s.steps === "string") { s.steps = s.steps ? s.steps.split("\n").filter(Boolean).map(l=>l.replace(/^\d+\.\s*/,"")) : []; } return s; });
  const [capital,     setCapital]     = useState(() => load(KEYS.capital, ""));
  const [propfirms,   setPropfirms]   = useState(() => load(KEYS.propfirms, []));
  const [pfView,      setPfView]      = useState("list"); // list | add-type | add-propfirm | add-personal
  const [pfForm,      setPfForm]      = useState({ type:"propfirm", name:"", firm:"", capital:"", target:"", dailyLoss:"", maxLoss:"", consistency:"", consistencyPct:"", hasDailyLoss:false, hasConsistency:false });
  const [activePf,    setActivePf]    = useState(null);
  const [chartAccountId, setChartAccountId] = useState("all");
  const [editingPf, setEditingPf] = useState(null);
  const [selectedPf, setSelectedPf] = useState(null);
  const [confirmDeletePf, setConfirmDeletePf] = useState(false); // null = list, pf = detail
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
  const [form, setForm] = useState({ date:new Date().toISOString().split("T")[0], instrument:"MNQ", direction:"LONG", result:"WIN", session:"New York", emotion:"Neutre", entry:"", exit:"", rr:"", notes:"", accountIds:[] });

  const instruments = [...BASE_INSTRUMENTS, ...extraInstr, "Autre"];
  const availableYears = Array.from({ length:now0.getFullYear() - 2019 }, (_, i) => now0.getFullYear() - i);

  useEffect(() => { save(KEYS.trades,      trades);    }, [trades]);
  useEffect(() => { save(KEYS.instruments, extraInstr);}, [extraInstr]);
  useEffect(() => { save(KEYS.strategy,    strategy);  }, [strategy]);
  useEffect(() => { save(KEYS.capital,     capital);   }, [capital]);
  useEffect(() => { save(KEYS.propfirms,   propfirms); }, [propfirms]);

  const set = (k, v) => setForm(f => ({ ...f, [k]:v }));

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
    const a = parseFloat(pnlRaw);
    if (isNaN(a) || pnlRaw === "") return null;
    if (form.result === "LOSS") return -Math.abs(a);
    if (form.result === "BREAKEVEN") return 0;
    return Math.abs(a);
  };

  const addTrade = () => {
    const p = computedPnl();
    if (p === null) return;
    setTrades(prev => [{ ...form, pnl:p, id:Date.now() }, ...prev]);
    setPnlRaw(""); setForm(f => ({ ...f, entry:"", exit:"", rr:"", notes:"", accountIds:[] }));
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

  const saveStrategy = () => { save(KEYS.strategy, strategy); setStratSaved(true); setTimeout(() => setStratSaved(false), 2000); };

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
    const stratCtx = [strategy.description && "Description: " + strategy.description, strategy.steps && strategy.steps.length > 0 && "Étapes: " + strategy.steps.map((s,i)=>`${i+1}. ${s}`).join("\n"), strategy.rules && "Règles: " + strategy.rules, strategy.notes && "Notes: " + strategy.notes].filter(Boolean).join("\n");
    const systemMsg = "Tu es un coach de trading professionnel et exigeant.\n" + (stratCtx ? "\nSTRATÉGIE DU TRADER:\n" + stratCtx + "\n" : "") + "\nAnalyse le journal. Donne:\n1) ✅ Ce qui fonctionne\n2) ❌ Erreurs récurrentes" + (stratCtx ? " (déviations de la stratégie aussi)" : "") + "\n3) 📌 3 règles concrètes pour demain\nSois direct, sans blabla. Réponds en français.";
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
        <StatCard label="P&L Total" value={`${pnlSum >= 0 ? "+" : ""}${pnlSum.toFixed(0)}€`} color={pnlSum >= 0 ? C.accent : C.gray1} small={desktop} />
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
            <PnlChart filtered={chartAccountId==="all" ? filtered : filtered.filter(t => !t.accountIds || t.accountIds.length===0 || t.accountIds.includes(chartAccountId))} capital={capital} pnlSum={pnlSum} height={160} />
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
              {filtered.length > 1 ? <PnlChart filtered={chartAccountId==="all" ? filtered : filtered.filter(t => !t.accountIds || t.accountIds.length===0 || t.accountIds.includes(chartAccountId))} capital={capital} pnlSum={pnlSum} height={150} /> : <div style={{ textAlign:"center", padding:"32px 0", color:C.gray2, fontSize:11, fontFamily:"'Josefin Sans',sans-serif", letterSpacing:"0.1em" }}>Aucun trade ce mois</div>}
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
                <span style={{ fontSize:12, fontFamily:"'Josefin Sans',sans-serif", fontWeight:300, color:s.pnl >= 0 ? C.accent : C.gray1, letterSpacing:"0.03em" }}>{s.pnl >= 0 ? "+" : ""}{s.pnl.toFixed(0)}€ · {s.wr}%</span>
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
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:C.gray1, marginBottom:14 }}>Commence à tracker tes trades</div>
          <button onClick={() => setView("add")} style={{ background:C.accent, border:"none", borderRadius:4, padding:"11px 24px", color:"#fff", fontSize:11, fontFamily:"'Josefin Sans',sans-serif", fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", cursor:"pointer" }}>+ Premier trade</button>
        </div>
      )}
    </div>
  );

  // ── Add Trade JSX ──
  const addTradeContent = (
    <div>
      <PageTitle sub="Enregistrer" title="Nouveau Trade" />
      <Field label="Date"><input type="date" value={form.date} onChange={e => set("date", e.target.value)} style={iStyle} /></Field>
      <Field label="Instrument">
        <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
          {instruments.map(o => <Chip key={o} label={o} active={form.instrument === o && !(o === "Autre" && showCustom) || (o === "Autre" && showCustom)} onClick={() => handleInstrument(o)} />)}
        </div>
        {showCustom && (
          <div style={{ marginTop:8, display:"flex", gap:8 }}>
            <input type="text" placeholder="Nom de l'actif" value={customInstr} onChange={e => setCustomInstr(e.target.value)} onKeyDown={e => e.key === "Enter" && saveCustomInstr()} style={{ ...iStyle, flex:1, fontSize:14 }} autoFocus />
            <button onClick={saveCustomInstr} style={{ background:C.accent, border:"none", borderRadius:6, padding:"0 14px", color:"#fff", fontSize:11, fontFamily:"'Josefin Sans',sans-serif", fontWeight:600, cursor:"pointer", textTransform:"uppercase", flexShrink:0 }}>OK</button>
          </div>
        )}
        {extraInstr.length > 0 && !showCustom && <div style={{ marginTop:6, fontSize:10, color:C.gray2, fontFamily:"'Josefin Sans',sans-serif" }}>Mémorisés: {extraInstr.join(", ")}</div>}
      </Field>
      <Divider />
      <Field label="Direction"><ChipGroup options={["LONG","SHORT"]} value={form.direction} onChange={v => set("direction", v)} /></Field>
      <Field label="Résultat"><ChipGroup options={["WIN","LOSS","BREAKEVEN"]} value={form.result} onChange={v => set("result", v)} /></Field>
      <Divider />
      <Field label="Session"><ChipGroup options={SESSIONS} value={form.session} onChange={v => set("session", v)} /></Field>
      <Field label="État émotionnel"><ChipGroup options={EMOTIONS} value={form.emotion} onChange={v => set("emotion", v)} /></Field>
      <Divider />
      <Field label={`P&L — ${form.result === "LOSS" ? "montant perte" : form.result === "WIN" ? "montant gain" : "breakeven"}`}>
        <input type="text" inputMode="numeric" placeholder="ex : 120" value={pnlRaw} onChange={e => { const v = e.target.value.replace(/[^0-9.]/g, ""); setPnlRaw(v); }} style={{ ...iStyle, fontSize:22, fontFamily:"'Cormorant Garamond',serif", fontWeight:600, color:C.white }} />
        {pnlRaw && !isNaN(parseFloat(pnlRaw)) && (
          <div style={{ marginTop:5, fontSize:12, fontFamily:"'Cormorant Garamond',serif", color:form.result === "WIN" ? C.accent : form.result === "LOSS" ? C.gray1 : C.gray1 }}>
            {form.result === "WIN" && "✓ Gain : +" + parseFloat(pnlRaw).toFixed(2) + " €"}
            {form.result === "LOSS" && "✗ Perte : −" + parseFloat(pnlRaw).toFixed(2) + " €"}
            {form.result === "BREAKEVEN" && "◎ Breakeven"}
          </div>
        )}
      </Field>
      <Field label="Prix d'entrée"><input type="text" inputMode="decimal" placeholder="ex : 21 450.25" value={form.entry} onChange={e => set("entry", e.target.value)} style={iStyle} /></Field>
      <Field label="Prix de sortie"><input type="text" inputMode="decimal" placeholder="ex : 21 530.00" value={form.exit} onChange={e => set("exit", e.target.value)} style={iStyle} /></Field>
      <Field label="Risk / Reward"><input type="text" inputMode="decimal" placeholder="ex : 4" value={form.rr} onChange={e => set("rr", e.target.value)} style={iStyle} /></Field>
      <Field label="Notes">
        <textarea rows={3} placeholder={`"Je n'ai pas attendu l'étape 3"`} value={form.notes} onChange={e => set("notes", e.target.value)} style={{ ...iStyle, resize:"vertical", lineHeight:1.6 }} />
      </Field>

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

      <button onClick={addTrade} disabled={computedPnl() === null} style={{ width:"100%", padding:"14px", borderRadius:4, border:"none", background:computedPnl() !== null ? C.accent : C.gray3, color:computedPnl() !== null ? "#fff" : C.gray2, fontSize:12, fontWeight:600, fontFamily:"'Josefin Sans',sans-serif", letterSpacing:"0.2em", textTransform:"uppercase", cursor:computedPnl() !== null ? "pointer" : "not-allowed", transition:"all 0.3s" }}>
        {saved ? "✓  Trade enregistré" : "Enregistrer  →"}
      </button>
    </div>
  );

  // ── History JSX ──
  const historyContent = (
    <div>
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
                          <div style={{ width:16, height:16, borderRadius:3, border:`1px solid ${sel?C.accent:C.gray2}`, background:sel?C.accent:"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>{sel && <span style={{ color:"#fff", fontSize:10 }}>✓</span>}</div>
                        </button>;
                      })}
                    </div>
                  </div>
                )}
                <div style={{ display:"flex", gap:7 }}>
                  <button onClick={saveEdit} style={{ flex:2, padding:"9px", borderRadius:4, border:"none", background:C.accent, color:"#fff", fontSize:11, fontFamily:"'Josefin Sans',sans-serif", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", cursor:"pointer" }}>✓ Sauvegarder</button>
                  <button onClick={cancelEdit} style={{ flex:1, padding:"9px", borderRadius:4, border:`1px solid ${C.gray3}`, background:"transparent", color:C.gray1, fontSize:11, fontFamily:"'Josefin Sans',sans-serif", letterSpacing:"0.1em", textTransform:"uppercase", cursor:"pointer" }}>Annuler</button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );

  // ── Strategy JSX ──
  const strategyContent = (
    <div>
      <PageTitle sub="Ma Stratégie" title="Plan de Trading" />
      <div style={{ fontSize:13, color:C.gray1, lineHeight:1.7, marginBottom:18 }}>Décris ta stratégie. L'IA s'en servira pour détecter chaque déviation de ton plan.</div>
      <Field label="Description générale"><textarea rows={3} placeholder="ex : Stratégie ICT sur MNQ, bias via Asia H1, entrée OB retest M5..." value={strategy.description} onChange={e => setStrategy(s => ({ ...s, description:e.target.value }))} style={{ ...iStyle, resize:"vertical", lineHeight:1.6 }} /></Field>
      <div style={{ marginBottom:16 }}>
        <Label>Étapes d'entrée</Label>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {(strategy.steps||[]).map((step, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:22, height:22, borderRadius:"50%", background:C.bg3, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:C.dim, fontFamily:"'Josefin Sans',sans-serif", fontWeight:600, flexShrink:0 }}>{i+1}</div>
              <input
                type="text"
                value={step}
                placeholder={`Étape ${i+1}...`}
                onChange={e => { const steps=[...(strategy.steps||[])]; steps[i]=e.target.value; setStrategy(s=>({...s,steps})); }}
                onKeyDown={e => { if(e.key==="Enter"){ e.preventDefault(); const steps=[...(strategy.steps||[]),""]; setStrategy(s=>({...s,steps})); setTimeout(()=>{ const inputs=document.querySelectorAll(".step-input"); if(inputs[i+1]) inputs[i+1].focus(); },50); } if(e.key==="Backspace"&&!step&&strategy.steps.length>1){ e.preventDefault(); const steps=(strategy.steps||[]).filter((_,j)=>j!==i); setStrategy(s=>({...s,steps})); } }}
                className="step-input"
                style={{ ...iStyle, flex:1, padding:"10px 12px", fontSize:14 }}
              />
              {(strategy.steps||[]).length > 1 && (
                <button onClick={() => { const steps=(strategy.steps||[]).filter((_,j)=>j!==i); setStrategy(s=>({...s,steps})); }} style={{ background:"none", border:"none", color:C.gray2, cursor:"pointer", fontSize:18, lineHeight:1, padding:"0 4px", flexShrink:0 }}>×</button>
              )}
            </div>
          ))}
          <button
            onClick={() => setStrategy(s => ({ ...s, steps:[...(s.steps||[]),""] }))}
            style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:6, border:`1px dashed ${C.gray2}`, background:"transparent", color:C.gray1, fontSize:12, fontFamily:"'Josefin Sans',sans-serif", cursor:"pointer", letterSpacing:"0.08em", marginTop:2 }}
          >
            <span style={{ fontSize:18, lineHeight:1 }}>+</span> Ajouter une étape
          </button>
          {(!strategy.steps||strategy.steps.length===0) && (
            <button
              onClick={() => setStrategy(s => ({ ...s, steps:[""] }))}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:6, border:`1px dashed ${C.gray2}`, background:"transparent", color:C.gray1, fontSize:12, fontFamily:"'Josefin Sans',sans-serif", cursor:"pointer", letterSpacing:"0.08em" }}
            >
              <span style={{ fontSize:18, lineHeight:1 }}>+</span> Ajouter une étape
            </button>
          )}
        </div>
      </div>
      <Field label="Règles strictes"><textarea rows={3} placeholder={"- Max 1 trade/jour\n- Stop après 1 win\n- Pas de trade sans bias"} value={strategy.rules} onChange={e => setStrategy(s => ({ ...s, rules:e.target.value }))} style={{ ...iStyle, resize:"vertical", lineHeight:1.9 }} /></Field>
      <Field label="Notes personnelles"><textarea rows={3} placeholder="Tout ce que tu veux que l'IA sache..." value={strategy.notes} onChange={e => setStrategy(s => ({ ...s, notes:e.target.value }))} style={{ ...iStyle, resize:"vertical", lineHeight:1.6 }} /></Field>
      <button onClick={saveStrategy} style={{ width:"100%", padding:"14px", borderRadius:4, border:`1px solid ${C.borderGold}`, background:"rgba(0,0,0,0.04)", color:C.dim, fontSize:12, fontWeight:600, fontFamily:"'Josefin Sans',sans-serif", letterSpacing:"0.2em", textTransform:"uppercase", cursor:"pointer", transition:"all 0.3s" }}>
        {stratSaved ? "✓  Stratégie sauvegardée" : "Sauvegarder  →"}
      </button>
    </div>
  );

  // ── AI JSX ──
  const aiContent = (
    <div>
      <PageTitle sub="Intelligence" title="Analyse IA" />
      <div style={{ fontSize:13, color:C.gray1, lineHeight:1.7, marginBottom:18 }}>L'IA croise tes trades avec ta stratégie pour détecter chaque déviation de ton plan.</div>
      {!strategy.description && !strategy.steps && (
        <div style={{ marginBottom:14, padding:"10px 12px", borderRadius:4, background:"rgba(0,0,0,0.04)", border:`1px solid ${C.borderGold}` }}>
          <div style={{ fontSize:11, color:C.dim, fontFamily:"'Josefin Sans',sans-serif", letterSpacing:"0.1em" }}>◆ Remplis l'onglet Stratégie pour un coaching ultra-personnalisé</div>
        </div>
      )}
      <button onClick={analyzeAI} disabled={aiLoading} style={{ width:"100%", padding:14, borderRadius:4, border:`1px solid ${C.borderGold}`, background:aiLoading ? "transparent" : "rgba(0,0,0,0.04)", color:aiLoading ? C.gray2 : C.dim, fontSize:12, fontWeight:600, fontFamily:"'Josefin Sans',sans-serif", letterSpacing:"0.2em", textTransform:"uppercase", cursor:aiLoading ? "not-allowed" : "pointer", marginBottom:18, transition:"all 0.3s" }}>
        {aiLoading ? "◌  Analyse en cours..." : "◆  Analyser mes trades"}
      </button>
      {aiError && <div style={{ marginBottom:14, padding:"10px 12px", borderRadius:4, background:"rgba(0,0,0,0.04)", border:`1px solid ${C.borderGold}`, fontSize:12, color:C.gray1, fontFamily:"'Josefin Sans',sans-serif", lineHeight:1.6 }}>{aiError}</div>}
      {aiText && <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:6, padding:20, fontSize:14, lineHeight:1.8, color:C.white, whiteSpace:"pre-wrap", fontFamily:"'Cormorant Garamond',serif", fontWeight:400 }}>{aiText}</div>}
      {!aiText && !aiLoading && !aiError && (
        <div style={{ textAlign:"center", padding:"50px 0", border:`1px solid ${C.gray3}`, borderRadius:6 }}>
          <div style={{ fontSize:34, marginBottom:10, color:C.gray2 }}>◆</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:C.gray1, marginBottom:4 }}>Prêt à analyser</div>
          <div style={{ fontSize:10, color:C.gray2, letterSpacing:"0.1em", fontFamily:"'Josefin Sans',sans-serif" }}>MINIMUM 3 TRADES REQUIS</div>
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
      if (pnl >= target) alerts.push({ type:"success", msg:"🎉 Profit target atteint ! Félicitations." });
      else if (remaining <= target * 0.2) alerts.push({ type:"warn", msg:`🟡 Encore ${remaining.toFixed(0)}€ pour valider le profit target.` });
      else alerts.push({ type:"info", msg:`📈 Il te manque ${remaining.toFixed(0)}€ pour valider.` });
      if (drawdown >= maxLoss) alerts.push({ type:"danger", msg:"🔴 Max drawdown atteint — STOP trading." });
      else if (drawdown >= maxLoss * 0.8) alerts.push({ type:"danger", msg:`🔴 Attention — tu es à ${Math.round(drawdown/maxLoss*100)}% du max drawdown.` });
    }

    if (pf.hasDailyLoss && dailyLoss > 0) {
      const todayPnl = trades.filter(t => t.date === new Date().toISOString().split("T")[0]).reduce((s,t)=>s+(t.pnl||0),0);
      const todayLoss = Math.abs(Math.min(0, todayPnl));
      if (todayLoss >= dailyLoss) alerts.push({ type:"danger", msg:"🔴 Daily loss limit atteinte aujourd'hui — ne plus trader." });
      else if (todayLoss >= dailyLoss * 0.7) alerts.push({ type:"warn", msg:`🟡 Daily loss: ${todayLoss.toFixed(0)}€ / ${dailyLoss}€ utilisés.` });
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
          <button onClick={()=>setPfView("add-type")} style={{ padding:"9px 16px", borderRadius:4, border:"none", background:C.accent, color:"#fff", fontSize:11, fontFamily:"'Josefin Sans',sans-serif", fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", cursor:"pointer", marginBottom:24 }}>+ Ajouter</button>
        )}
      </div>

      {/* ── TYPE SELECTOR ── */}
      {pfView==="add-type" && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginTop:8}}>
          <button onClick={()=>{pfSet("type","propfirm");setPfView("add-propfirm");}} style={{padding:"32px 16px",borderRadius:10,border:`1px solid ${C.border}`,background:C.bg2,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:12,transition:"all 0.2s"}}>
            <span style={{fontSize:32}}>🏢</span>
            <div style={{fontFamily:"'Josefin Sans',sans-serif",fontWeight:700,fontSize:13,color:C.white,letterSpacing:"0.1em",textTransform:"uppercase"}}>Prop Firm</div>
            <div style={{fontSize:11,color:C.gray1,fontFamily:"'Josefin Sans',sans-serif",lineHeight:1.5,textAlign:"center"}}>Compte financé avec règles d'évaluation</div>
          </button>
          <button onClick={()=>{pfSet("type","personal");setPfView("add-personal");}} style={{padding:"32px 16px",borderRadius:10,border:`1px solid ${C.border}`,background:C.bg2,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:12,transition:"all 0.2s"}}>
            <span style={{fontSize:32}}>💼</span>
            <div style={{fontFamily:"'Josefin Sans',sans-serif",fontWeight:700,fontSize:13,color:C.white,letterSpacing:"0.1em",textTransform:"uppercase"}}>Fond Propre</div>
            <div style={{fontSize:11,color:C.gray1,fontFamily:"'Josefin Sans',sans-serif",lineHeight:1.5,textAlign:"center"}}>Compte personnel avec ton propre capital</div>
          </button>
        </div>
      )}

      {/* ── PROPFIRM FORM ── */}
      {pfView==="add-propfirm" && (
        <div>
          <Field label="Nom de la Prop Firm *">
            <input type="text" placeholder="ex: Lucid Trading, FTMO, Topstep..." value={pfForm.firm} onChange={e=>pfSet("firm",e.target.value)} style={iStyle}/>
          </Field>
          <Field label="Nom du compte (optionnel)">
            <input type="text" placeholder="ex: Compte principal, Compte #2..." value={pfForm.name} onChange={e=>pfSet("name",e.target.value)} style={iStyle}/>
          </Field>
          <Divider/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Field label="Capital *">
              <input type="text" inputMode="numeric" placeholder="ex: 25000" value={pfForm.capital} onChange={e=>pfSet("capital",e.target.value.replace(/[^0-9.]/g,""))} style={iStyle}/>
            </Field>
            <Field label="Profit Target *">
              <input type="text" inputMode="numeric" placeholder="ex: 2500" value={pfForm.target} onChange={e=>pfSet("target",e.target.value.replace(/[^0-9.]/g,""))} style={iStyle}/>
            </Field>
            <Field label="Max Drawdown *">
              <input type="text" inputMode="numeric" placeholder="ex: 1500" value={pfForm.maxLoss} onChange={e=>pfSet("maxLoss",e.target.value.replace(/[^0-9.]/g,""))} style={iStyle}/>
            </Field>
          </div>
          <Divider/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600}}>Daily Loss Limit</div>
            <button onClick={()=>pfSet("hasDailyLoss",!pfForm.hasDailyLoss)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${C.border}`,background:pfForm.hasDailyLoss?C.accent:"transparent",color:pfForm.hasDailyLoss?"#fff":C.gray1,fontSize:10,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase"}}>
              {pfForm.hasDailyLoss?"Activée":"Désactivée"}
            </button>
          </div>
          {pfForm.hasDailyLoss && <Field label="Montant daily loss"><input type="text" inputMode="numeric" placeholder="ex: 500" value={pfForm.dailyLoss} onChange={e=>pfSet("dailyLoss",e.target.value.replace(/[^0-9.]/g,""))} style={iStyle}/></Field>}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,marginTop:4}}>
            <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600}}>Règle de Consistance</div>
            <button onClick={()=>pfSet("hasConsistency",!pfForm.hasConsistency)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${C.border}`,background:pfForm.hasConsistency?C.accent:"transparent",color:pfForm.hasConsistency?"#fff":C.gray1,fontSize:10,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase"}}>
              {pfForm.hasConsistency?"Activée":"Désactivée"}
            </button>
          </div>
          {pfForm.hasConsistency && (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Field label="% de consistance *">
                <input type="text" inputMode="numeric" placeholder="ex: 50" value={pfForm.consistencyPct} onChange={e=>pfSet("consistencyPct",e.target.value.replace(/[^0-9.]/g,""))} style={iStyle}/>
              </Field>
              <Field label="Description (optionnel)">
                <input type="text" placeholder="ex: Max 50% du target/jour" value={pfForm.consistency} onChange={e=>pfSet("consistency",e.target.value)} style={iStyle}/>
              </Field>
            </div>
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
            <input type="text" placeholder="ex: Mon compte principal" value={pfForm.name} onChange={e=>pfSet("name",e.target.value)} style={iStyle}/>
          </Field>
          <Field label="Capital *">
            <input type="text" inputMode="numeric" placeholder="ex: 5000" value={pfForm.capital} onChange={e=>pfSet("capital",e.target.value.replace(/[^0-9.]/g,""))} style={iStyle}/>
          </Field>
          <Divider/>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",letterSpacing:"0.15em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600}}>Daily Loss Limit</div>
            <button onClick={()=>pfSet("hasDailyLoss",!pfForm.hasDailyLoss)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${C.border}`,background:pfForm.hasDailyLoss?C.accent:"transparent",color:pfForm.hasDailyLoss?"#fff":C.gray1,fontSize:10,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase"}}>
              {pfForm.hasDailyLoss?"Activée":"Désactivée"}
            </button>
          </div>
          {pfForm.hasDailyLoss && <Field label="Montant daily loss"><input type="text" inputMode="numeric" placeholder="ex: 200" value={pfForm.dailyLoss} onChange={e=>pfSet("dailyLoss",e.target.value.replace(/[^0-9.]/g,""))} style={iStyle}/></Field>}
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
          <button onClick={(e)=>{e.stopPropagation();setPfView("add-type");}} style={{background:C.accent,border:"none",borderRadius:4,padding:"11px 24px",color:"#fff",fontSize:11,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,letterSpacing:"0.15em",textTransform:"uppercase",cursor:"pointer"}}>+ Ajouter un compte</button>
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
          <div key={pf.id} style={{background:C.bg2,border:`1px solid ${isInDanger?"rgba(192,57,43,0.3)":C.border}`,borderRadius:8,padding:"18px 16px",marginBottom:14,cursor:editingPf?.id===pf.id?"default":"pointer"}} onClick={()=>{ if(!editingPf) setSelectedPf(pf); }}>
            {/* Header */}
            {editingPf?.id === pf.id ? (
              <div style={{marginBottom:12}}>
                <div style={{fontSize:10,color:C.dim,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:12}}>Modifier le compte</div>
                {pf.type==="propfirm" && <div style={{marginBottom:8}}><Label>Prop Firm</Label><input type="text" value={editingPf.firm||""} onChange={e=>setEditingPf(p=>({...p,firm:e.target.value}))} style={{...iStyle,padding:"9px 10px",fontSize:13}}/></div>}
                <div style={{marginBottom:8}}><Label>Nom du compte</Label><input type="text" value={editingPf.name||""} onChange={e=>setEditingPf(p=>({...p,name:e.target.value}))} style={{...iStyle,padding:"9px 10px",fontSize:13}}/></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                  <div><Label>Capital</Label><input type="text" inputMode="numeric" value={editingPf.capital||""} onChange={e=>setEditingPf(p=>({...p,capital:e.target.value.replace(/[^0-9.]/g,"")}))} style={{...iStyle,padding:"9px 10px",fontSize:13}}/></div>
                  {pf.type==="propfirm" && <div><Label>Profit Target</Label><input type="text" inputMode="numeric" value={editingPf.target||""} onChange={e=>setEditingPf(p=>({...p,target:e.target.value.replace(/[^0-9.]/g,"")}))} style={{...iStyle,padding:"9px 10px",fontSize:13}}/></div>}
                  {pf.type==="propfirm" && <div><Label>Max Drawdown</Label><input type="text" inputMode="numeric" value={editingPf.maxLoss||""} onChange={e=>setEditingPf(p=>({...p,maxLoss:e.target.value.replace(/[^0-9.]/g,"")}))} style={{...iStyle,padding:"9px 10px",fontSize:13}}/></div>}
                </div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600}}>Daily Loss</div>
                  <button onClick={()=>setEditingPf(p=>({...p,hasDailyLoss:!p.hasDailyLoss}))} style={{padding:"4px 10px",borderRadius:20,border:`1px solid ${C.border}`,background:editingPf.hasDailyLoss?C.accent:"transparent",color:editingPf.hasDailyLoss?"#fff":C.gray1,fontSize:10,fontFamily:"'Josefin Sans',sans-serif",cursor:"pointer",textTransform:"uppercase"}}>{editingPf.hasDailyLoss?"Activée":"Désactivée"}</button>
                </div>
                {editingPf.hasDailyLoss && <div style={{marginBottom:8}}><Label>Montant daily loss</Label><input type="text" inputMode="numeric" value={editingPf.dailyLoss||""} onChange={e=>setEditingPf(p=>({...p,dailyLoss:e.target.value.replace(/[^0-9.]/g,"")}))} style={{...iStyle,padding:"9px 10px",fontSize:13}}/></div>}
                {pf.type==="propfirm" && <>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                    <div style={{fontSize:10,color:C.dim,textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600}}>Consistance</div>
                    <button onClick={()=>setEditingPf(p=>({...p,hasConsistency:!p.hasConsistency}))} style={{padding:"4px 10px",borderRadius:20,border:`1px solid ${C.border}`,background:editingPf.hasConsistency?C.accent:"transparent",color:editingPf.hasConsistency?"#fff":C.gray1,fontSize:10,fontFamily:"'Josefin Sans',sans-serif",cursor:"pointer",textTransform:"uppercase"}}>{editingPf.hasConsistency?"Activée":"Désactivée"}</button>
                  </div>
                  {editingPf.hasConsistency && (
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                      <div><Label>% consistance</Label><input type="text" inputMode="numeric" value={editingPf.consistencyPct||""} onChange={e=>setEditingPf(p=>({...p,consistencyPct:e.target.value.replace(/[^0-9.]/g,"")}))} style={{...iStyle,padding:"9px 10px",fontSize:13}}/></div>
                      <div><Label>Description</Label><input type="text" value={editingPf.consistency||""} onChange={e=>setEditingPf(p=>({...p,consistency:e.target.value}))} style={{...iStyle,padding:"9px 10px",fontSize:13}}/></div>
                    </div>
                  )}
                </>}
                <div style={{display:"flex",gap:7,marginTop:4}}>
                  <button onClick={()=>{setPropfirms(p=>p.map(x=>x.id===editingPf.id?{...editingPf}:x));setEditingPf(null);}} style={{flex:2,padding:"9px",borderRadius:4,border:"none",background:C.accent,color:"#fff",fontSize:11,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>✓ Sauvegarder</button>
                  <button onClick={()=>setEditingPf(null)} style={{flex:1,padding:"9px",borderRadius:4,border:`1px solid ${C.gray3}`,background:"transparent",color:C.gray1,fontSize:11,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>Annuler</button>
                </div>
              </div>
            ) : (
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                <div>
                  <div style={{fontFamily:"'Barlow',sans-serif",fontWeight:600,fontSize:16,color:C.white,letterSpacing:"0.08em"}}>{pf.firm||"Fond Propre"}</div>
                  {pf.name && <div style={{fontSize:11,color:C.gray1,fontFamily:"'Josefin Sans',sans-serif",marginTop:2}}>{pf.name}</div>}
                  <div style={{fontSize:10,color:C.dim,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.1em",marginTop:4,textTransform:"uppercase"}}>{cap.toLocaleString()}€{pf.type==="propfirm"?` · Target ${target.toLocaleString()}€`:" · Fond Propre"}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:"'Josefin Sans',sans-serif",fontWeight:300,fontSize:20,color:pnl>=0?"#2a6e3a":"#c0392b",letterSpacing:"0.03em"}}>{pnl>=0?"+":""}{pnl.toFixed(0)}€</div>
                    <div style={{fontSize:10,color:C.gray1,fontFamily:"'Josefin Sans',sans-serif"}}>P&L actuel</div>
                  </div>

                </div>
              </div>
            )}

            {editingPf?.id !== pf.id && pf.type==="propfirm" && <div style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:10,color:C.dim,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.1em",textTransform:"uppercase"}}>Profit Target</span>
                <span style={{fontSize:10,color:C.dim,fontFamily:"'Josefin Sans',sans-serif"}}>{progress.toFixed(0)}%</span>
              </div>
              <div style={{height:5,background:C.gray3,borderRadius:3}}>
                <div style={{width:progress+"%",height:"100%",borderRadius:3,background:"#2a6e3a",transition:"width 0.5s"}}/>
              </div>
            </div>}

            {pf.type==="propfirm" && <div style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:10,color:C.dim,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.1em",textTransform:"uppercase"}}>Drawdown</span>
                <span style={{fontSize:10,color:ddProgress>=80?"rgba(192,57,43,0.8)":C.dim,fontFamily:"'Josefin Sans',sans-serif"}}>{drawdown.toFixed(0)}€ / {maxLoss}€</span>
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
                          max {(parseFloat(pf.target)*parseFloat(pf.consistencyPct)/100).toFixed(0)}€
                        </div>
                      )}
                    </div>
                    <div style={{fontSize:14,color:todayPnl>=0?"#2a6e3a":"#c0392b",fontFamily:"'Josefin Sans',sans-serif",fontWeight:300,marginBottom:pf.hasConsistency&&pf.consistencyPct&&pf.target?8:0}}>{todayPnl>=0?"+":""}{todayPnl.toFixed(0)}€ · {todayTrades.length} trade{todayTrades.length!==1?"s":""}</div>
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
                            {isOver ? "🔴 Limite de consistance atteinte" : `${(maxD-todayGain).toFixed(0)}€ restants`}
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
    const pfFiltered = acctTrades.filter(t => {
      const d = new Date(t.date + "T12:00:00");
      return d.getFullYear() === pfCalYear && d.getMonth() === pfCalMonth;
    });
    const pfTotal = pfFiltered.length;
    const pfWins = pfFiltered.filter(t => t.result==="WIN").length;
    const pfPnl = pfFiltered.reduce((s,t) => s+(t.pnl||0), 0);
    const pfWinRate = pfTotal ? Math.round(pfWins/pfTotal*100) : 0;
    const pfAvgRR = pfTotal ? (pfFiltered.reduce((s,t)=>s+(parseFloat(t.rr)||0),0)/pfTotal).toFixed(1) : "—";
    const allPnl = acctTrades.reduce((s,t)=>s+(t.pnl||0),0);
    const cap = parseFloat(pf.capital)||0;
    const target = parseFloat(pf.target)||0;
    const maxLoss = parseFloat(pf.maxLoss)||0;
    const progress = target ? Math.min(100,Math.max(0,(allPnl/target)*100)) : 0;
    const drawdown = Math.abs(Math.min(0,allPnl));
    const ddProgress = maxLoss ? Math.min(100,(drawdown/maxLoss)*100) : 0;
    const alerts = getPfAlerts(pf);
    const pfSessionStats = SESSIONS.map(s => {
      const st = pfFiltered.filter(t=>t.session===s);
      const wr = st.length ? Math.round(st.filter(t=>t.result==="WIN").length/st.length*100) : 0;
      return { name:s, count:st.length, wr, pnl:st.reduce((a,t)=>a+(t.pnl||0),0) };
    }).filter(s=>s.count>0);

    return (
      <div>
        {/* Back button + header */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <button onClick={()=>setSelectedPf(null)} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,padding:"6px 12px",color:C.gray1,cursor:"pointer",fontSize:11,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.1em",textTransform:"uppercase"}}>← Retour</button>

          <div>
            <div style={{fontFamily:"'Barlow',sans-serif",fontWeight:600,fontSize:18,color:C.white,letterSpacing:"0.1em"}}>{pf.firm}</div>
            {pf.name && <div style={{fontSize:11,color:C.gray1,fontFamily:"'Josefin Sans',sans-serif"}}>{pf.name}</div>}
          </div>
          <div style={{marginLeft:"auto",textAlign:"right"}}>
            <div style={{fontSize:10,color:C.dim,fontFamily:"'Josefin Sans',sans-serif",textTransform:"uppercase",letterSpacing:"0.1em"}}>{pf.type==="propfirm"?"Prop Firm":"Fond Propre"}</div>
            <div style={{fontSize:16,color:allPnl>=0?"#2a6e3a":"#c0392b",fontFamily:"'Josefin Sans',sans-serif",fontWeight:300}}>{allPnl>=0?"+":""}{allPnl.toFixed(0)}€</div>
          </div>
        </div>

        {/* Prop firm progress bars */}
        {pf.type==="propfirm" && (
          <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:8,padding:"14px 16px",marginBottom:14}}>
            <div style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:10,color:C.dim,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.1em",textTransform:"uppercase"}}>Profit Target</span>
                <span style={{fontSize:10,color:C.dim,fontFamily:"'Josefin Sans',sans-serif"}}>{allPnl.toFixed(0)}€ / {target}€ · {progress.toFixed(0)}%</span>
              </div>
              <div style={{height:5,background:C.gray3,borderRadius:3}}>
                <div style={{width:progress+"%",height:"100%",borderRadius:3,background:"#2a6e3a",transition:"width 0.5s"}}/>
              </div>
            </div>
            <div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:10,color:C.dim,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.1em",textTransform:"uppercase"}}>Drawdown</span>
                <span style={{fontSize:10,color:ddProgress>=80?"rgba(192,57,43,0.8)":C.dim,fontFamily:"'Josefin Sans',sans-serif"}}>{drawdown.toFixed(0)}€ / {maxLoss}€</span>
              </div>
              <div style={{height:5,background:C.gray3,borderRadius:3}}>
                <div style={{width:ddProgress+"%",height:"100%",borderRadius:3,background:ddProgress>=80?"rgba(192,57,43,0.9)":ddProgress>=50?"rgba(192,57,43,0.5)":"rgba(192,57,43,0.25)",transition:"width 0.5s"}}/>
              </div>
            </div>
          </div>
        )}

        {/* Alerts */}
        {alerts.map((a,i)=>(
          <div key={i} style={{padding:"8px 12px",borderRadius:6,marginBottom:8,background:a.type==="danger"?"rgba(192,57,43,0.08)":a.type==="warn"?"rgba(180,120,0,0.08)":a.type==="success"?"rgba(42,110,58,0.08)":"rgba(0,0,0,0.04)",border:`1px solid ${a.type==="danger"?"rgba(192,57,43,0.25)":a.type==="warn"?"rgba(180,120,0,0.25)":a.type==="success"?"rgba(42,110,58,0.25)":C.border}`}}>
            <div style={{fontSize:12,color:C.white,fontFamily:"'Josefin Sans',sans-serif",lineHeight:1.5}}>{a.msg}</div>
          </div>
        ))}

        {/* Stat cards */}
        <div style={{display:"grid",gridTemplateColumns:desktop?"repeat(4,1fr)":"1fr 1fr",gap:10,marginBottom:16,marginTop:alerts.length?0:4}}>
          <StatCard label="Win Rate" value={`${pfWinRate}%`} color={pfWinRate>=50?"#2a6e3a":"#c0392b"} small={desktop}/>
          <StatCard label="P&L mois" value={`${pfPnl>=0?"+":""}${pfPnl.toFixed(0)}€`} color={pfPnl>=0?"#2a6e3a":"#c0392b"} small={desktop}/>
          <StatCard label="RR Moyen" value={`${pfAvgRR}:1`} color={C.dim} small={desktop}/>
          <StatCard label="Bilan" value={`${pfWins}W / ${pfTotal-pfWins}L`} color={C.accent} small={desktop}/>
        </div>

        {/* Chart */}
        <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:8,padding:"16px 14px 10px",marginBottom:14}}>
          <div style={{fontSize:10,color:C.dim,letterSpacing:"0.2em",textTransform:"uppercase",fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,marginBottom:10}}>Évolution P&L</div>
          {acctTrades.length > 1 ? (
            <PnlChart filtered={acctTrades} capital={pf.capital} pnlSum={allPnl} height={150}/>
          ) : (
            <div style={{textAlign:"center",padding:"32px 0",color:C.gray2,fontSize:11,fontFamily:"'Josefin Sans',sans-serif",letterSpacing:"0.1em"}}>Aucun trade sur ce compte</div>
          )}
        </div>

        {/* Calendar */}
        <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:8,padding:"16px 14px",marginBottom:14}}>
          <Calendar filtered={acctTrades} calMonth={pfCalMonth} calYear={pfCalYear} onPrev={prevPfMonth} onNext={nextPfMonth}/>
        </div>

        {/* Sessions */}
        {pfSessionStats.length > 0 && (
          <div style={{background:C.bg2,border:`1px solid ${C.border}`,borderRadius:8,padding:18}}>
            <div style={{fontSize:10,color:C.dim,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:14,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600}}>Performance par Session</div>
            {pfSessionStats.map(s=>(
              <div key={s.name} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontSize:11,color:C.white,letterSpacing:"0.06em",textTransform:"uppercase",fontFamily:"'Josefin Sans',sans-serif"}}>{s.name}</span>
                  <span style={{fontSize:12,fontFamily:"'Josefin Sans',sans-serif",fontWeight:300,color:s.pnl>=0?"#2a6e3a":"#c0392b"}}>{s.pnl>=0?"+":""}{s.pnl.toFixed(0)}€ · {s.wr}%</span>
                </div>
                <div style={{height:3,background:C.gray3,borderRadius:2}}>
                  <div style={{width:`${s.wr}%`,height:"100%",borderRadius:2,background:C.accent,transition:"width 0.7s"}}/>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Actions */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:8}}>
          <button onClick={()=>{setEditingPf({...pf});setSelectedPf(null);setPfView("list");}} style={{padding:"14px",borderRadius:8,border:`1px solid ${C.border}`,background:C.bg2,color:C.white,fontSize:12,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,letterSpacing:"0.15em",textTransform:"uppercase",cursor:"pointer"}}>✎ Modifier</button>
          {!confirmDeletePf ? (
            <button onClick={()=>setConfirmDeletePf(true)} style={{padding:"14px",borderRadius:8,border:"1px solid rgba(192,57,43,0.3)",background:"rgba(192,57,43,0.05)",color:"rgba(192,57,43,0.8)",fontSize:12,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,letterSpacing:"0.15em",textTransform:"uppercase",cursor:"pointer"}}>Supprimer</button>
          ) : (
            <div style={{borderRadius:8,border:"1px solid rgba(192,57,43,0.4)",background:"rgba(192,57,43,0.08)",padding:"10px 14px",display:"flex",flexDirection:"column",gap:8}}>
              <div style={{fontSize:11,color:"rgba(192,57,43,0.9)",fontFamily:"'Josefin Sans',sans-serif",textAlign:"center",letterSpacing:"0.05em"}}>Êtes-vous sûr ?</div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{deletePf(pf.id);setSelectedPf(null);setConfirmDeletePf(false);}} style={{flex:1,padding:"8px",borderRadius:6,border:"none",background:"rgba(192,57,43,0.8)",color:"#fff",fontSize:11,fontFamily:"'Josefin Sans',sans-serif",fontWeight:600,cursor:"pointer"}}>Oui</button>
                <button onClick={()=>setConfirmDeletePf(false)} style={{flex:1,padding:"8px",borderRadius:6,border:`1px solid ${C.border}`,background:"transparent",color:C.gray1,fontSize:11,fontFamily:"'Josefin Sans',sans-serif",cursor:"pointer"}}>Annuler</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const getContent = (desktop) => {
    if (view === "propfirm")  return selectedPf ? accountDetailContent(selectedPf, desktop) : propfirmContent;
    if (view === "add")       return addTradeContent;
    if (view === "history")   return historyContent;
    if (view === "strategy")  return strategyContent;
    if (view === "ai")        return aiContent;
    return null;
  };

  /* ── RENDER ── */
  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.white, fontFamily:"'Josefin Sans',sans-serif" }}>
      <style>{FONTS}</style>

      {isMobile ? (
        /* ── MOBILE ── */
        <div style={{ minHeight:"100vh", paddingBottom:100 }}>
          <div style={{ padding:"16px 20px", background:`linear-gradient(180deg,${C.bg2},${C.bg})`, borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:50, backdropFilter:"blur(16px)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <div style={{ width:34, height:34, borderRadius:9, background:"#111", border:"1px solid #2a2a2a", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><svg width="26" height="26" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="10,8 56,8 50,22 10,22" fill="#f0ede8"/>
                <polygon points="10,29 46,29 40,43 10,43" fill="#f0ede8"/>
                <polygon points="10,50 30,50 24,64 10,64" fill="#f0ede8"/>
              </svg></div>
              <div>
                <div style={{ fontFamily:"'Barlow',sans-serif", fontWeight:600, fontSize:17, letterSpacing:"0.2em", color:C.white, lineHeight:1, textTransform:"uppercase" }}>FYLTRE</div>
                <div style={{ fontSize:7, color:C.dim, letterSpacing:"0.25em", textTransform:"uppercase", fontFamily:"'Josefin Sans',sans-serif", fontWeight:300 }}>Trading Journal</div>
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:9, color:C.gray1, letterSpacing:"0.12em", textTransform:"uppercase" }}>{total} trade{total !== 1 ? "s" : ""}</div>
              {total > 0 && <div style={{ fontSize:12, color:C.accent, fontFamily:"'Josefin Sans',sans-serif", fontWeight:300 }}>{pnlSum >= 0 ? "+" : ""}{pnlSum.toFixed(0)} €</div>}
            </div>
          </div>
          <div style={{ padding:"22px 18px", maxWidth:560, margin:"0 auto" }}>
            {getContent(false)}
          </div>
          <PillNav view={view} setView={setView} />
        </div>
      ) : (
        /* ── DESKTOP ── */
        <div style={{ display:"flex", minHeight:"100vh" }}>
          <Sidebar view={view} setView={setView} total={total} pnlSum={pnlSum} />
          <div style={{ marginLeft:220, flex:1, display:"flex", flexDirection:"column" }}>
            <div style={{ padding:"20px 36px 18px", borderBottom:`1px solid ${C.border}`, background:C.bg, position:"sticky", top:0, zIndex:40, backdropFilter:"blur(12px)" }}>
              <div style={{ fontSize:11, color:C.dim, letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:2, fontFamily:"'Josefin Sans',sans-serif" }}>{NAV.find(n => n.key === view)?.label}</div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:30, fontWeight:600, color:C.white, letterSpacing:"-0.01em" }}>
                {view === "propfirm" ? (selectedPf ? selectedPf.firm + (selectedPf.name ? " · " + selectedPf.name : "") : "Mes Comptes") : view === "add" ? "Nouveau Trade" : view === "history" ? "Historique" : view === "strategy" ? "Plan de Trading" : "Analyse IA"}
              </div>
            </div>
            <div style={{ padding:"28px 36px", flex:1, maxWidth:1100 }}>
              {getContent(true)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
