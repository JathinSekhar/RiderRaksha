import { useState, useCallback, useEffect } from 'react';
import { api } from './api/api';
import { C, FONTS } from './constants/theme';
import { globalCss, Toast } from './components';
import { useViewport } from './hooks/useViewport';
import Onboarding   from './screens/Onboarding';
import Dashboard    from './screens/Dashboard';
import PolicyScreen from './screens/PolicyScreen';
import Monitor      from './screens/Monitor';
import Claims       from './screens/Claims';
import Admin        from './screens/Admin';
import Login        from './screens/Login';

export default function App() {
  const vp = useViewport();
  const [screen, setScreen] = useState('loading'); // ← start as loading
  const [nav, setNav]       = useState('dashboard');
  const [worker, setWorker] = useState(null);
  const [toast, setToast]   = useState(null);
  const [role, setRole]     = useState(null);

  const showToast = useCallback((t) => { setToast(t); }, []);

  // ── Get user role with special handling for admin-only routes ──
  const handleNavChange = useCallback((newNav) => {
    const userRole = localStorage.getItem('role');
    if (newNav === 'admin' && userRole !== 'admin') {
      showToast({ msg: 'Access denied', sub: 'Admin access required', color: C.red });
      return;
    }
    setNav(newNav);
  }, [showToast]);

  // ── Auth check on mount ──────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('visited', 'true');
    const token = localStorage.getItem('token');

    if (!token) {
      const isFirstVisit = !localStorage.getItem('visited');
      setScreen(isFirstVisit ? 'onboarding' : 'login');
      return;
    }

    // Token exists — verify it
    api.getMe().then(res => {
      console.log('ME RESPONSE:', res);
      if (res.ok && res.data) {
        setWorker(res.data);
        // Store user role for RBAC
        const userRole = res.data.role || res.data.worker?.role || 'user';
        localStorage.setItem('role', userRole);
        setRole(userRole);
        setScreen('main');
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        setScreen('login');
      }
    }).catch(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      setScreen('login');
    });
  }, []);

  const handleDone = (w) => { setWorker(w); setScreen('main'); };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setWorker(null);
    setRole(null);
    setNav('dashboard');
    setScreen('login');
  };

  // ── Navigation with role-based filtering ────────────────
  const isAdmin = role === 'admin' || localStorage.getItem('role') === 'admin';
  const NAV = [
    { id:'dashboard', label:'Home',    icon:'🏠' },
    { id:'policy',    label:'Policy',  icon:'🛡️' },
    { id:'monitor',   label:'Monitor', icon:'📡' },
    { id:'claims',    label:'Claims',  icon:'💰' },
    ...(isAdmin ? [{ id:'admin', label:'Admin', icon:'📊' }] : []),
  ];

  const renderScreen = (screenNav = nav) => {
    const props = { worker, vp, onToast: showToast };
    // Double-check admin access before rendering
    if (screenNav === 'admin' && !isAdmin) {
      return <Dashboard {...props} />;
    }
    switch(screenNav) {
      case 'dashboard': return <Dashboard {...props} />;
      case 'policy':    return <PolicyScreen {...props} />;
      case 'monitor':   return <Monitor {...props} />;
      case 'claims':    return <Claims {...props} />;
      case 'admin':     return isAdmin ? <Admin {...props} /> : <Dashboard {...props} />;
      default:          return <Dashboard {...props} />;
    }
  };

  // ── Loading ──────────────────────────────────────────────────
  if (screen === 'loading') return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <style>{FONTS + globalCss}</style>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🛵</div>
        <div style={{ width:32, height:32, border:`3px solid ${C.border}`, borderTopColor:C.orange, borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto' }} />
      </div>
    </div>
  );

  // ── Login ────────────────────────────────────────────────────
  if (screen === 'login') return (
    <>
      <style>{FONTS + globalCss}</style>
      <Login
        onLoginSuccess={(w) => { setWorker(w); setScreen('main'); }}
        onGoToRegister={() => setScreen('onboarding')}
      />
    </>
  );

  // ── Onboarding ───────────────────────────────────────────────
  if (screen === 'onboarding') return (
    <>
      <style>{FONTS + globalCss}</style>
      <Onboarding onDone={handleDone} vp={vp} onGoToLogin={() => setScreen('login')} />
    </>
  );

  // ── Topbar ───────────────────────────────────────────────────
  const topbar = (
    <div style={{ padding:vp.sm?'12px 18px':'13px 28px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:`1px solid ${C.border}`, background:C.surf, backdropFilter:'blur(8px)', flexShrink:0 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:34, height:34, background:`radial-gradient(circle,${C.orange}50,${C.orange}10)`, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:19 }}>🛵</div>
        <span style={{ fontWeight:900, color:C.orange, fontSize:18, fontFamily:'Sora,sans-serif' }}>RiderRaksha</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:12, color:C.sub }}>{worker?.full_name?.split(' ')[0]}</span>
      </div>
    </div>
  );

  // ── Protect admin route for non-admin users ───────────────────
  const screenToRender = nav === 'admin' && !isAdmin ? 'dashboard' : nav;

  // ── Desktop ──────────────────────────────────────────────────
  if (vp.lg) return (
    <div style={{ background:C.bg, height:'100vh', display:'flex', flexDirection:'column', overflow:'hidden', fontFamily:'DM Sans,sans-serif' }}>
      <style>{FONTS + globalCss}</style>
      {toast && <Toast {...toast} onClose={()=>setToast(null)} />}
      {topbar}
      <div style={{ display:'flex', flex:1, minHeight:0 }}>
        {/* Sidebar */}
        <div style={{ width:220, background:C.surf, borderRight:`1px solid ${C.border}`, padding:'18px 10px', display:'flex', flexDirection:'column', justifyContent:'space-between', overflowY:'auto', flexShrink:0 }}>
          <div>
            {NAV.map(n => (
              <div key={n.id} onClick={()=>handleNavChange(n.id)} style={{ padding:'12px 14px', cursor:'pointer', color:nav===n.id?C.orange:C.sub, background:nav===n.id?`${C.orange}15`:'transparent', borderRadius:10, marginBottom:6, fontWeight:nav===n.id?700:500, transition:'all .2s', borderLeft:`3px solid ${nav===n.id?C.orange:'transparent'}`, fontSize:14 }}>
                {n.icon} {n.label}
              </div>
            ))}
          </div>
          {/* Worker info + Logout */}
          <div>
            <div style={{ padding:'12px 14px', background:C.faint, borderRadius:12, border:`1px solid ${C.border}`, marginBottom:10 }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{worker?.full_name}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{worker?.platform} · {worker?.city}</div>
              <div style={{ fontSize:11, color:C.orange, marginTop:4, fontWeight:600 }}>₹{worker?.hourly_rate}/hr</div>
            </div>
            <button onClick={logout} style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:`1px solid ${C.orange}`, background:'transparent', color:C.orange, cursor:'pointer', fontSize:14, fontWeight:700, transition:'all .2s' }}>
              🚪 Logout
            </button>
          </div>
        </div>
        {/* Content */}
        <div style={{ flex:1, overflow:'auto' }}>{renderScreen(screenToRender)}</div>
      </div>
    </div>
  );

  // ── Mobile ───────────────────────────────────────────────────
  return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', flexDirection:'column', fontFamily:'DM Sans,sans-serif' }}>
      <style>{FONTS + globalCss}</style>
      {toast && <Toast {...toast} onClose={()=>setToast(null)} />}
      {topbar}
      <div style={{ flex:1, overflow:'auto' }}>{renderScreen(screenToRender)}</div>
      {/* Bottom Nav */}
      <div style={{ display:'flex', borderTop:`1px solid ${C.border}`, background:C.surf, paddingBottom:'env(safe-area-inset-bottom)', flexShrink:0 }}>
        {NAV.map(n => (
          <button key={n.id} onClick={()=>handleNavChange(n.id)} style={{ flex:1, padding:'10px 0', border:'none', background:'transparent', display:'flex', flexDirection:'column', alignItems:'center', gap:4, borderTop:`2px solid ${nav===n.id?C.orange:'transparent'}`, transition:'all .2s' }}>
            <span style={{ fontSize:20 }}>{n.icon}</span>
            <span style={{ fontSize:10, fontWeight:700, color:nav===n.id?C.orange:C.muted }}>{n.label}</span>
          </button>
        ))}
        <button onClick={logout} style={{ flex:1, padding:'10px 0', border:'none', background:'transparent', display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          <span style={{ fontSize:20 }}>🚪</span>
          <span style={{ fontSize:10, fontWeight:700, color:C.muted }}>Logout</span>
        </button>
      </div>
    </div>
  );
}