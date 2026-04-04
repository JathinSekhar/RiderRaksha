import { useState, useEffect } from "react";
import axios from "axios";
import { C } from "../constants/theme";
  import { api } from "../api/api"; // ADD THIS

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600&display=swap');
  @keyframes floatUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulseGlow { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:.7;transform:scale(1.08)} }
  @keyframes spinSlow { to{transform:rotate(360deg)} }
  @keyframes slideIn { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
  @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
  @keyframes rainFall { 0% { transform: translateY(-100%); opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(100vh); opacity: 0; } }
  @keyframes heatWave { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.5; } }

  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }

  .glow-orb-1 { position:absolute; top:-120px; left:-120px; width:500px; height:500px; pointer-events:none; }
  .glow-orb-2 { position:absolute; bottom:-80px; right:-80px; width:400px; height:400px; pointer-events:none; }

  /* Mobile First Design */
  @media (max-width: 768px) {
    .glow-orb-1, .glow-orb-2 { display: none !important; }
  }

  /* Tablet and below */
  @media (max-width: 1024px) {
    .login-container { flex-direction: column !important; }
    .login-left-panel { display: none !important; }
    .login-right-panel { max-width: 100% !important; width: 100% !important; padding: 32px 24px !important; }
  }

  /* Mobile */
  @media (max-width: 640px) {
    .login-right-panel { padding: 24px 16px !important; }
    .login-heading { margin-bottom: 28px !important; }
    .login-heading h2 { font-size: 24px !important; margin: 0 !important; }
    .login-heading p { font-size: 12px !important; font-weight: 500; }
    .login-form-label { font-size: 11px !important; font-weight: 600; }
    .login-field { margin-bottom: 14px !important; }
    .login-form-input { padding: 11px 12px 11px 38px !important; font-size: 13px !important; }
    .login-button { padding: 13px !important; font-size: 14px !important; gap: 6px !important; margin-bottom: 16px !important; }
    .login-button-text { font-size: 13px !important; }
    .login-forgot { margin-bottom: 12px !important; font-size: 11px !important; }
    .login-divider { margin: 18px 0 !important; gap: 10px !important; }
    .login-register-btn { font-size: 13px !important; padding: 12px !important; }
    .trust-badges { gap: 12px !important; font-size: 9px !important; margin-top: 20px !important; }
    .live-ticker { font-size: 12px !important; }
  }

  /* Small phones */
  @media (max-width: 480px) {
    .login-right-panel { padding: 18px 12px !important; }
    .login-heading { margin-bottom: 22px !important; }
    .login-heading h2 { font-size: 20px !important; }
    .login-heading p { font-size: 11px !important; }
    .login-form-label { font-size: 10px !important; }
    .login-field { margin-bottom: 11px !important; }
    .login-form-input { padding: 10px 11px 10px 35px !important; font-size: 12px !important; }
    .login-forgot { margin-bottom: 10px !important; font-size: 10px !important; }
    .login-button { margin-bottom: 14px !important; padding: 12px !important; font-size: 13px !important; }
    .trust-badges { margin-top: 16px !important; }
  }

  /* Prevent hover effects on touch devices */
  @media (hover: none) {
    .login-register-btn { border-color: var(--border, #e5e7eb); color: inherit; }
  }

  /* Better input styling */
  .login-form-input { 
    position: relative;
    background: rgba(255,255,255,0.03);
    border: 1.5px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.95) !important;
    font-weight: 500;
  }
  .login-form-input::placeholder { 
    color: rgba(255,255,255,0.5) !important;
    opacity: 1;
    font-weight: 400;
  }
  .login-form-input:focus::placeholder { 
    color: rgba(255,255,255,0.3);
  }
  .login-form-input::-webkit-outer-spin-button,
  .login-form-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  .login-form-input[type=number] { -moz-appearance: textfield; }

  /* Better button states */
  .login-button { 
    font-weight: 900;
    letter-spacing: 0.5px;
    box-shadow: 0 12px 32px rgba(212, 90, 30, 0.35) !important;
    transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
  }
  .login-button:hover:not(:disabled) { 
    transform: translateY(-2px);
    box-shadow: 0 16px 40px rgba(212, 90, 30, 0.45) !important;
  }
  .login-button:active { transform: scale(0.98); }
  .login-button:disabled { opacity: 0.6 !important; cursor: not-allowed !important; }

  .login-register-btn {
    transition: all 0.3s ease;
    font-weight: 600;
  }
  .login-register-btn:hover {
    border-color: rgba(212, 90, 30, 0.5) !important;
    color: rgba(212, 90, 30, 0.9) !important;
  }


  /* Ensure form scrolls properly on small screens */
  @media (max-height: 600px) {
    .login-right-panel { justify-content: flex-start !important; overflow-y: auto !important; max-height: 100vh !important; padding-top: 16px !important; }
  }
`;

const TIPS = [
  { icon:"🌧️", text:"Heavy rain in Banjara Hills — 3 claims auto-paid today" },
  { icon:"⚡", text:"Rs 380 credited to Rahul's UPI in 47 seconds" },
  { icon:"🛡️", text:"2,847 workers protected across Hyderabad this week" },
  { icon:"🌡️", text:"Heat advisory triggered — 284 auto-claims processing" },
];

export default function Login({ onLoginSuccess, onGoToRegister }) {
  const [phone, setPhone]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [showPass, setShowPass] = useState(false);
  const [tipIdx, setTipIdx]     = useState(0);
  const [focused, setFocused]   = useState("");

  useEffect(() => {
    const t = setInterval(() => setTipIdx(i => (i + 1) % TIPS.length), 3000);
    return () => clearInterval(t);
  }, []);

const handleLogin = async () => {
  if (!phone || !password) {
    setError("Please enter phone and password");
    return;
  }

  setLoading(true);
  setError("");

  try {
    const res = await api.login({ phone, password });

    console.log("LOGIN RESPONSE:", res);

    if (!res.ok) {
      setError(res.data?.message || "Invalid phone or password");
      setLoading(false);
      return;
    }

    // ✅ Save token
    localStorage.setItem("token", res.data.token);

    // ✅ Move to dashboard
    onLoginSuccess(res.data.worker);

  } catch (err) {
    console.log(err);
    setError("Server error. Try again.");
  }

  setLoading(false);
};

  const handleKey = (e) => { if (e.key === "Enter") handleLogin(); };

  return (
    <div className="login-container" style={{ minHeight:"100vh", background:C.bg, fontFamily:"DM Sans,sans-serif", display:"flex", position:"relative", overflow:"hidden" }}>
      <style>{css}</style>

      {/* ── Background glow orbs ── */}
      <div className="glow-orb-1" style={{ background:`radial-gradient(circle,${C.orange}18,transparent 70%)`, borderRadius:"50%", animation:"pulseGlow 6s ease-in-out infinite" }} />
      <div className="glow-orb-2" style={{ background:`radial-gradient(circle,${C.blue}12,transparent 70%)`, borderRadius:"50%", animation:"pulseGlow 8s ease-in-out infinite reverse" }} />

      {/* ── Left panel — shown on desktop ── */}
      <div className="login-left-panel" style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"space-between", padding:"60px 56px", borderRight:`1px solid ${C.border}`, backgroundImage:`url('https://images.unsplash.com/photo-1554931670-4ebde6eba63e?w=1600&q=80')`, backgroundSize:"cover", backgroundPosition:"center", position:"relative", overflow:"hidden" }}>
        {/* Dark Gradient Overlay */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.5) 50%, rgba(212, 90, 30, 0.1) 100%)`,
          pointerEvents: "none",
          zIndex: 0
        }} />
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:12, animation:"floatUp .5s ease", position:"relative", zIndex:2 }}>
          <div style={{ width:44, height:44, background:`radial-gradient(circle,${C.orange}60,${C.orange}15)`, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, boxShadow:`0 0 24px ${C.orange}40` }}>🛵</div>
          <div>
            <div style={{ fontFamily:"Sora,sans-serif", fontWeight:900, color:C.orange, fontSize:22, letterSpacing:-.5 }}>RiderRaksha</div>
            <div style={{ fontSize:11, color:C.muted, letterSpacing:.5 }}>AI-Powered Parametric Insurance</div>
          </div>
        </div>

        {/* Hero text */}
        <div style={{ animation:"floatUp .6s ease .1s both", position:"relative", zIndex:2 }}>
          <div style={{ fontSize:13, color:C.orange, fontWeight:700, letterSpacing:2, marginBottom:16, textTransform:"uppercase" }}>Protecting India's Gig Workers</div>
          <h1 style={{ fontFamily:"Sora,sans-serif", fontSize:42, fontWeight:900, color:C.text, lineHeight:1.15, letterSpacing:-1, marginBottom:20, margin:0 }}>
            When disruption<br/>
            <span style={{ color:C.orange }}>stops your ride,</span><br/>
            we pay instantly.
          </h1>
          <p style={{ fontSize:15, color:C.sub, lineHeight:1.8, maxWidth:400 }}>
            Rain, heat, flood, curfew — any covered disruption in your zone triggers an automatic UPI payout. No forms. No waiting.
          </p>
        </div>



        {/* Live ticker */}
        <div style={{ animation:"floatUp .6s ease .2s both", position:"relative", zIndex:2 }}>
          <div style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:2, marginBottom:12, textTransform:"uppercase" }}>Live Activity</div>
          <div key={tipIdx} className="live-ticker" style={{ background:`rgba(255, 255, 255, 0.03)`, backdropFilter:"blur(10px)", border:`1px solid rgba(255, 255, 255, 0.1)`, borderRadius:16, padding:"16px 18px", display:"flex", alignItems:"center", gap:14, animation:"slideIn .4s ease", boxShadow:`0 8px 32px rgba(0, 0, 0, 0.3)` }}>
            <div style={{ width:40, height:40, background:`${C.orange}18`, border:`1px solid ${C.orange}30`, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{TIPS[tipIdx].icon}</div>
            <div style={{ fontSize:13, color:C.sub, lineHeight:1.5 }}>{TIPS[tipIdx].text}</div>
          </div>
          {/* Dots */}
          <div style={{ display:"flex", gap:6, marginTop:12 }}>
            {TIPS.map((_, i) => (
              <div key={i} onClick={() => setTipIdx(i)} style={{ width:i===tipIdx?20:6, height:6, borderRadius:99, background:i===tipIdx?C.orange:C.border, transition:"all .3s", cursor:"pointer" }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — login form ── */}
      <div className="login-right-panel" style={{ width:"100%", maxWidth:480, display:"flex", flexDirection:"column", justifyContent:"center", padding:"40px 42px", position:"relative", overflowY:"auto", maxHeight: "100vh" }}>
        <div style={{ animation:"floatUp .5s ease" }}>

          {/* Heading */}
          <div className="login-heading" style={{ marginBottom:28, position:"relative", zIndex:1 }}>
            <h2 style={{ fontFamily:"Sora,sans-serif", fontSize:28, fontWeight:900, color:C.text, letterSpacing:-.5, marginBottom:6, margin:0 }}>Welcome back</h2>
            <p style={{ fontSize:13, color:C.sub, margin:0, marginTop:6 }}>
              Sign in to your RiderRaksha account
            </p>
          </div>

          {/* Phone field */}
          <div className="login-field" style={{ marginBottom:18, position:"relative", zIndex:1 }}>
            <div className="login-form-label" style={{ fontSize:13, color:C.sub, fontWeight:600, marginBottom:8, letterSpacing:.3, textTransform:"uppercase" }}>Phone Number</div>
            <div style={{ position:"relative" }}>
              <div style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:16, pointerEvents:"none" }}>📱</div>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={handleKey}
                onFocus={() => setFocused("phone")}
                onBlur={() => setFocused("")}
                placeholder="9876543210"
                type="tel"
                className="login-form-input"
                style={{
                  width:"100%", border:`1.5px solid ${focused==="phone"?C.orange:"rgba(255,255,255,0.1)"}`,
                  borderRadius:14, padding:"14px 16px 14px 46px", color:C.text, fontSize:14,
                  transition:"all .2s ease", outline:"none",
                  boxShadow:focused==="phone"?`0 0 0 3px ${C.orange}20`:`0 4px 12px rgba(0,0,0,0.2)`,
                }}
              />
            </div>
          </div>

          {/* Password field */}
          <div className="login-field" style={{ marginBottom:14, position:"relative", zIndex:1 }}>
            <div className="login-form-label" style={{ fontSize:13, color:C.sub, fontWeight:600, marginBottom:8, letterSpacing:.3, textTransform:"uppercase" }}>Password</div>
            <div style={{ position:"relative" }}>
              <div style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:16, pointerEvents:"none" }}>🔒</div>
              <input
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKey}
                onFocus={() => setFocused("pass")}
                onBlur={() => setFocused("")}
                placeholder="Enter password"
                type={showPass ? "text" : "password"}
                className="login-form-input"
                style={{
                  width:"100%", border:`1.5px solid ${focused==="pass"?C.orange:"rgba(255,255,255,0.1)"}`,
                  borderRadius:14, padding:"14px 48px 14px 46px", color:C.text, fontSize:14,
                  transition:"all .2s ease", outline:"none",
                  boxShadow:focused==="pass"?`0 0 0 3px ${C.orange}20`:`0 4px 12px rgba(0,0,0,0.2)`,
                }}
              />
              <div onClick={() => setShowPass(v => !v)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", cursor:"pointer", fontSize:16, opacity:.7, transition:"all .2s ease", padding: "6px 8px", display:"flex", alignItems:"center", justifyContent:"center", userSelect:"none" }} onMouseEnter={e => e.target.style.opacity=".95"} onMouseLeave={e => e.target.style.opacity=".7"}>
                {showPass ? "🙈" : "👁️"}
              </div>
            </div>
          </div>

          {/* Forgot */}
          <div className="login-forgot" style={{ textAlign:"right", marginBottom:20, position:"relative", zIndex:1 }}>
            <span style={{ fontSize:12, color:C.muted, cursor:"pointer", transition:"color .2s ease", fontWeight:500 }} onMouseEnter={e => e.target.style.color=C.orange} onMouseLeave={e => e.target.style.color=C.muted}>Forgot password?</span>
          </div>

          {/* Error */}
          {error && (
            <div style={{ marginBottom:16, padding:"12px 14px", background:`${C.red}12`, border:`1px solid ${C.red}35`, borderRadius:12, fontSize:12, color:C.red, display:"flex", alignItems:"center", gap:8, animation:"slideIn .3s ease", wordBreak:"break-word", position:"relative", zIndex:1 }}>
              <span style={{ flexShrink:0 }}>⚠️</span> <span>{error}</span>
            </div>
          )}

          {/* Login button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="login-button"
            style={{
              width:"100%", padding:"16px", border:"none", borderRadius:14, cursor:loading?"not-allowed":"pointer",
              background:loading?C.faint:`linear-gradient(135deg,#D45A1E,${C.orange})`,
              color:"#fff", fontSize:16, fontWeight:900, fontFamily:"Sora,sans-serif",
              boxShadow:loading?"":` 0 12px 32px ${C.orange}35`,
              display:"flex", alignItems:"center", justifyContent:"center", gap:10,
              transition:"all .3s cubic-bezier(0.23, 1, 0.320, 1)", opacity:loading?.65:1, letterSpacing:.3,
              WebkitAppearance: "none",
              WebkitTapHighlightColor: "transparent",
              marginBottom: 20,
              position:"relative", zIndex:1
            }}
          >
            {loading
              ? <><span style={{ display:"inline-block", animation:"spinSlow 1s linear infinite" }}>⟳</span> <span>Signing in...</span></>
              : <><span className="login-button-text">Login to Dashboard →</span></>}
          </button>

          {/* Divider */}
          <div className="login-divider" style={{ display:"flex", alignItems:"center", gap:14, margin:"18px 0", position:"relative", zIndex:1 }}>
            <div style={{ flex:1, height:1, background:`rgba(255,255,255,0.08)` }} />
            <span style={{ fontSize:11, color:C.muted, whiteSpace:"nowrap", fontWeight:500 }}>New to RiderRaksha?</span>
            <div style={{ flex:1, height:1, background:`rgba(255,255,255,0.08)` }} />
          </div>

          {/* Register */}
          <button
            onClick={onGoToRegister}
            className="login-register-btn"
            style={{
              width:"100%", padding:"14px", border:`1.5px solid ${C.border}`, borderRadius:14,
              background:"transparent", color:C.text, fontSize:14, fontWeight:700,
              fontFamily:"Sora,sans-serif", cursor:"pointer", transition:"all .2s",
              WebkitAppearance: "none",
              WebkitTapHighlightColor: "transparent",
              position:"relative", zIndex:1
            }}
            onMouseEnter={e => { e.target.style.borderColor=C.orange; e.target.style.color=C.orange; }}
            onMouseLeave={e => { e.target.style.borderColor=C.border; e.target.style.color=C.text; }}
          >
            Create New Account
          </button>

          {/* Trust Badges - Enhanced */}
          <div className="trust-badges" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginTop:24, paddingTop:20, borderTop: `1px solid rgba(255,255,255,0.05)` }}>
            {[
              {icon:"🔐", label:"JWT Secured", color:"#3B82F6", bg:"#3B82F620"},
              {icon:"💸", label:"Instant Payout", color:"#10B981", bg:"#10B98120"},
              {icon:"🛡️", label:"IRDAI Aligned", color:"#FF6B2B", bg:"#FF6B2B20"}
            ].map(({icon, label, color, bg})=>(
              <div key={label} style={{
                padding: "11px 8px",
                background: bg,
                border: `1.5px solid ${color}30`,
                borderRadius: 10,
                textAlign: "center",
                transition: "all 0.3s ease",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
                overflow: "hidden"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = `${color}60`;
                e.currentTarget.style.background = `${bg}40`;
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = `${color}30`;
                e.currentTarget.style.background = bg;
                e.currentTarget.style.transform = "translateY(0)";
              }}>
                <div style={{ fontSize:18 }}>{icon}</div>
                <div style={{ fontSize:10, fontWeight:700, color, lineHeight:1.1 }}>{label}</div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}