import { useEffect } from 'react';
import { C } from '../constants/theme';

export const globalCss = `
  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:${C.bg}; font-family:'DM Sans',sans-serif; }
  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-thumb { background:${C.border}; border-radius:4px; }
  input, select, textarea { outline:none; font-family:'DM Sans',sans-serif; }
  input:focus, select:focus { border-color:${C.orange} !important; box-shadow:0 0 0 3px ${C.orange}18 !important; }
  button { font-family:'DM Sans',sans-serif; cursor:pointer; transition:all .15s; }
  button:hover { filter:brightness(1.08); }
  button:active { transform:scale(.97); }
  input[type=range] { -webkit-appearance:none; height:5px; border-radius:4px; background:${C.faint}; cursor:pointer; }
  input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:20px; height:20px; border-radius:50%; background:${C.orange}; box-shadow:0 0 8px ${C.orange}60; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  @keyframes glow { 0%,100%{opacity:.6} 50%{opacity:1} }
  @keyframes countUp { from{opacity:0;transform:scale(.8)} to{opacity:1;transform:scale(1)} }
  .card-hover { transition:all .2s !important; }
  .card-hover:hover { border-color:${C.orange}50 !important; transform:translateY(-2px) !important; box-shadow:0 8px 32px ${C.orange}10 !important; }
  .nav-btn:hover { background:${C.border}88 !important; }
`;

// ── Badge ──────────────────────────────────────────────────────────────────────
export const Badge = ({ color = C.teal, children, sm }) => (
  <span style={{
    display:'inline-flex', alignItems:'center', gap:4,
    background:`${color}20`, color, border:`1px solid ${color}40`,
    borderRadius:99, padding:sm ? '2px 8px' : '3px 12px',
    fontSize:sm ? 10 : 11, fontWeight:700, letterSpacing:.4, whiteSpace:'nowrap',
  }}>{children}</span>
);

// ── GlowCard ──────────────────────────────────────────────────────────────────
export const GlowCard = ({ children, style={}, onClick, accent, hover }) => (
  <div onClick={onClick} className={hover ? 'card-hover' : ''}
    style={{
      background:C.card, border:`1px solid ${accent ? `${accent}40` : C.border}`,
      borderRadius:18, padding:20, transition:'all .2s',
      boxShadow:accent ? `0 0 40px ${accent}12, inset 0 1px 0 ${accent}15` : 'none',
      cursor:onClick ? 'pointer' : 'default', ...style,
    }}>{children}</div>
);

// ── Stat Box ──────────────────────────────────────────────────────────────────
export const StatBox = ({ label, val, color=C.text, icon, sm }) => (
  <div style={{ textAlign:'center' }}>
    {icon && <div style={{ fontSize:sm?20:24, marginBottom:4 }}>{icon}</div>}
    <div style={{ fontSize:sm?20:26, fontWeight:900, color, letterSpacing:-.5, fontFamily:'Sora,sans-serif', animation:'countUp .5s ease' }}>{val}</div>
    <div style={{ fontSize:11, color:C.sub, marginTop:3, lineHeight:1.3 }}>{label}</div>
  </div>
);

// ── Bar ───────────────────────────────────────────────────────────────────────
export const Bar = ({ val, max=100, color=C.orange, h=6 }) => (
  <div style={{ height:h, background:C.faint, borderRadius:99, overflow:'hidden' }}>
    <div style={{ height:'100%', width:`${Math.min((val/max)*100,100)}%`, background:color, borderRadius:99, transition:'width .8s ease' }} />
  </div>
);

// ── Divider ───────────────────────────────────────────────────────────────────
export const Divider = ({ my=14 }) => (
  <div style={{ height:1, background:C.border, margin:`${my}px 0` }} />
);

// ── Section Label ─────────────────────────────────────────────────────────────
export const SectionLabel = ({ children }) => (
  <div style={{ fontSize:10, fontWeight:800, color:C.muted, letterSpacing:2.5, marginBottom:12, textTransform:'uppercase', fontFamily:'Sora,sans-serif' }}>{children}</div>
);

// ── Input Field ───────────────────────────────────────────────────────────────
export const Field = ({ label, ...props }) => (
  <div>
    <div style={{ fontSize:12, color:C.sub, fontWeight:600, marginBottom:6 }}>{label}</div>
    <input {...props} style={{
      width:'100%', background:C.surf, border:`1px solid ${C.border}`,
      borderRadius:12, padding:'12px 14px', color:C.text, fontSize:14,
      transition:'all .2s', ...props.style,
    }} />
  </div>
);

// ── Primary Button ────────────────────────────────────────────────────────────
export const PrimaryBtn = ({ children, loading, style={}, ...props }) => (
  <button {...props} style={{
    width:'100%', padding:'14px', background:`linear-gradient(135deg,#D45A1E,${C.orange})`,
    border:'none', borderRadius:14, color:'#fff', fontSize:15, fontWeight:800,
    boxShadow:`0 6px 24px ${C.orange}35`, letterSpacing:.2, fontFamily:'Sora,sans-serif',
    opacity:props.disabled ? .6 : 1, ...style,
  }}>
    {loading ? <span style={{ display:'inline-block', animation:'spin 1s linear infinite' }}>⟳</span> : children}
  </button>
);

// ── Toast ─────────────────────────────────────────────────────────────────────
export function Toast({ msg, sub, color=C.teal, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position:'fixed', top:16, left:'50%', transform:'translateX(-50%)',
      zIndex:9999, background:C.card, border:`1px solid ${color}50`,
      color:C.text, borderRadius:16, padding:'14px 20px', fontSize:13, fontWeight:700,
      boxShadow:`0 12px 40px ${color}30`, maxWidth:380, width:'calc(100% - 32px)',
      display:'flex', justifyContent:'space-between', alignItems:'center', gap:12,
      animation:'slideDown .3s ease',
    }}>
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ color }}>●</span> {msg}
        </div>
        {sub && <div style={{ fontSize:11, fontWeight:400, marginTop:3, color:C.sub }}>{sub}</div>}
      </div>
      <button onClick={onClose} style={{ background:C.faint, border:'none', borderRadius:8, color:C.sub, width:26, height:26, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}>✕</button>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export const Spinner = ({ color=C.orange }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:40 }}>
    <div style={{ width:32, height:32, border:`3px solid ${C.border}`, borderTopColor:color, borderRadius:'50%', animation:'spin 1s linear infinite' }} />
  </div>
);

// ── Empty State ───────────────────────────────────────────────────────────────
export const Empty = ({ icon, title, sub }) => (
  <div style={{ textAlign:'center', padding:'48px 24px' }}>
    <div style={{ fontSize:48, marginBottom:12 }}>{icon}</div>
    <div style={{ fontSize:16, fontWeight:700, color:C.text, fontFamily:'Sora,sans-serif', marginBottom:6 }}>{title}</div>
    <div style={{ fontSize:13, color:C.sub, lineHeight:1.7 }}>{sub}</div>
  </div>
);
