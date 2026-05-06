import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&display=swap');
  @font-face { font-family:'MariellaNove'; src:url('/mariella-noeve.ttf') format('truetype'); font-display:swap; }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{background:#060608;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
`;

export default function Setup() {
  const navigate  = useNavigate();
  const params     = new URLSearchParams(window.location.search);
  const rawEmail   = decodeURIComponent(params.get("email") || "");
  const sessionId  = params.get("session_id") || "";
  const [urlEmail, setUrlEmail] = useState(rawEmail);

  const [email,    setEmail]    = useState(urlEmail);
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);

  // Si session_id Stripe dans l'URL → récupérer l'email
  useEffect(() => {
    if (!sessionId || rawEmail) return;
    fetch(`/api/get-session-email?session_id=${sessionId}`)
      .then(r => r.json())
      .then(({ email: e }) => { if (e) { setUrlEmail(e); setEmail(e); } })
      .catch(() => {});
  }, [sessionId, rawEmail]);

  // Si déjà connecté → redirect app
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/app");
    });
  }, [navigate]);

  const submit = async () => {
    if (!email || !password || !confirm) { setError("Remplis tous les champs."); return; }
    if (password.length < 8)  { setError("Le mot de passe doit faire au moins 8 caractères."); return; }
    if (password !== confirm)  { setError("Les mots de passe ne correspondent pas."); return; }

    setLoading(true); setError("");

    // Vérifier l'achat
    try {
      const check = await fetch(`/api/check-purchase?email=${encodeURIComponent(email)}`);
      const { authorized } = await check.json();
      if (!authorized) {
        setError("Aucun achat trouvé pour cet email. Vérifie l'adresse ou choisis un plan.");
        setLoading(false);
        return;
      }
    } catch {
      setError("Erreur de vérification. Réessaie.");
      setLoading(false);
      return;
    }

    // Créer le compte
    const { error: signUpErr } = await supabase.auth.signUp({ email, password });
    if (signUpErr) {
      // Compte déjà existant → on essaie de se connecter directement
      if (signUpErr.message.toLowerCase().includes("already")) {
        const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
        if (!loginErr) { navigate("/app"); return; }
        setError("Ce compte existe déjà. Connecte-toi depuis la page d'accueil.");
      } else {
        setError(signUpErr.message);
      }
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  const gold = "#e8cda9";
  const fieldStyle = {
    width: "100%", background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12,
    padding: "14px 16px", color: "#fff", fontFamily: "'Outfit',sans-serif",
    fontSize: 15, outline: "none", transition: "border-color .2s", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#060608", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Outfit',sans-serif" }}>
      <style>{FONTS}</style>

      {/* glow */}
      <div style={{ position: "fixed", top: "30%", left: "50%", transform: "translateX(-50%)", width: 600, height: 400, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(232,205,169,0.07) 0%,transparent 70%)", pointerEvents: "none", filter: "blur(60px)" }} />

      <div style={{ width: "100%", maxWidth: 420, background: "#0e0f12", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 24, padding: "48px 40px", boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 40px 80px rgba(0,0,0,0.7)", position: "relative", animation: "fadeUp .4s both" }}>

        {/* logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 36 }}>
          <img src="/fyltra-logo-black.svg" style={{ height: 76, width: "auto" }} alt="Fyltra" />
        </div>

        {success ? (
          /* ── Succès ── */
          <div style={{ textAlign: "center", animation: "fadeUp .35s both" }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>✓</div>
            <h2 style={{ fontWeight: 800, fontSize: 22, color: "#fff", marginBottom: 10, letterSpacing: "-0.02em" }}>Compte activé !</h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", marginBottom: 32, lineHeight: 1.6 }}>
              Vérifie tes emails pour confirmer ton adresse,<br />puis connecte-toi.
            </p>
            <button onClick={() => navigate("/")}
              style={{ background: `linear-gradient(135deg,${gold},#c9aa82)`, color: "#000", border: "none", borderRadius: 12, padding: "14px 32px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Aller se connecter →
            </button>
          </div>
        ) : (
          /* ── Formulaire ── */
          <>
            <h2 style={{ fontWeight: 800, fontSize: 26, color: "#fff", marginBottom: 8, letterSpacing: "-0.02em" }}>
              Active ton compte
            </h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 32, lineHeight: 1.6 }}>
              {urlEmail
                ? "Merci pour ton achat ! Choisis un mot de passe pour accéder à Fyltra."
                : "Entre l'email utilisé lors de ton achat et choisis un mot de passe."}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
              {/* Email */}
              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontWeight: 600 }}>Email d'achat</div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ton@email.com"
                  readOnly={!!urlEmail}
                  style={{ ...fieldStyle, background: urlEmail ? "rgba(232,205,169,0.05)" : "rgba(255,255,255,0.04)", borderColor: urlEmail ? "rgba(232,205,169,0.25)" : "rgba(255,255,255,0.1)", color: urlEmail ? gold : "#fff", cursor: urlEmail ? "default" : "text" }}
                  onFocus={e => { if (!urlEmail) e.target.style.borderColor = "rgba(232,205,169,0.4)"; }}
                  onBlur={e => { if (!urlEmail) e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
                />
              </div>

              {/* Mot de passe */}
              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontWeight: 600 }}>Choisis un mot de passe</div>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 caractères"
                    style={{ ...fieldStyle, paddingRight: 52 }}
                    onFocus={e => e.target.style.borderColor = "rgba(232,205,169,0.4)"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                  <button onClick={() => setShowPwd(p => !p)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", fontSize: 12, padding: 4, fontFamily: "'Outfit',sans-serif" }}>
                    {showPwd ? "Cacher" : "Voir"}
                  </button>
                </div>
              </div>

              {/* Confirmer le mot de passe */}
              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontWeight: 600 }}>Confirme ton mot de passe</div>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPwd ? "text" : "password"}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && submit()}
                    placeholder="Répète ton mot de passe"
                    style={{ ...fieldStyle, paddingRight: 52, borderColor: confirm && confirm !== password ? "rgba(255,80,80,0.4)" : confirm && confirm === password ? "rgba(76,175,110,0.4)" : "rgba(255,255,255,0.1)" }}
                    onFocus={e => e.target.style.borderColor = confirm !== password ? "rgba(255,80,80,0.4)" : "rgba(232,205,169,0.4)"}
                    onBlur={e => e.target.style.borderColor = confirm && confirm !== password ? "rgba(255,80,80,0.4)" : confirm && confirm === password ? "rgba(76,175,110,0.4)" : "rgba(255,255,255,0.1)"}
                  />
                  {confirm && (
                    <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>
                      {confirm === password ? "✓" : "✗"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div style={{ background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.2)", borderRadius: 10, padding: "11px 14px", fontSize: 13, color: "#ff8888", marginBottom: 16, lineHeight: 1.5 }}>
                {error}
                {error.includes("plan") && (
                  <><br /><a href="/#tarifs" style={{ color: gold, fontWeight: 700, fontSize: 12 }}>Voir les tarifs →</a></>
                )}
              </div>
            )}

            <button onClick={submit} disabled={loading}
              style={{ width: "100%", background: loading ? "rgba(255,255,255,0.06)" : `linear-gradient(135deg,${gold},#c9aa82)`, color: loading ? "rgba(255,255,255,0.3)" : "#000", border: "none", borderRadius: 12, padding: "15px", fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", transition: "all .22s", boxShadow: loading ? "none" : "0 0 30px rgba(232,205,169,0.2)" }}>
              {loading ? "Vérification..." : "Activer mon compte →"}
            </button>

            <div style={{ textAlign: "center", marginTop: 20 }}>
              <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                ← Retour à l'accueil
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
