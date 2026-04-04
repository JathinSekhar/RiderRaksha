import { useState, useEffect } from 'react';
import { C, CITIES } from '../constants/theme';
import { Field, PrimaryBtn, GlowCard } from '../components';
import { api } from '../api/api';


const STEPS = ['Welcome', 'Profile', 'Location', 'Confirm'];

const premiumCss = `
  @keyframes rainFall { 0% { transform: translateY(-100%); opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(100vh); opacity: 0; } }
  @keyframes raindrop { 0% { transform: translateY(-200%) scaleX(0.8); opacity: 0.8; } 100% { transform: translateY(100vh) scaleX(1); opacity: 0; } }
  @keyframes lightningPulse { 0%, 100% { opacity: 0.1; } 50% { opacity: 0.4; } }
  @keyframes slideInDown { 0% { opacity: 0; transform: translateY(-20px); } 100% { opacity: 1; transform: translateY(0); } }
  @keyframes slideInUp { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
  @keyframes scaleIn { 0% { opacity: 0; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }
  @keyframes shimmer { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
  @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }

  .monsoon-hero-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 300px;
    background: radial-gradient(ellipse at center, rgba(212, 90, 30, 0.15) 0%, rgba(0, 212, 170, 0.08) 50%, rgba(0, 0, 0, 0) 100%);
    overflow: hidden;
    pointer-events: none;
  }

  .rain-streaks {
    position: absolute;
    width: 100%;
    height: 400px;
    opacity: 0.1;
  }

  .rain-streak {
    position: absolute;
    width: 1px;
    height: 60px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 100%);
    animation: rainFall 2s linear infinite;
  }

  .lightning-pulse {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 300px;
    background: radial-gradient(circle at center, rgba(255, 107, 43, 0.3) 0%, transparent 70%);
    animation: lightningPulse 4s ease-in-out infinite;
    pointer-events: none;
  }

  .hero-scooter-container {
    animation: scaleIn 0.8s cubic-bezier(0.23, 1, 0.32, 1);
    position: relative;
    z-index: 2;
  }

  .hero-title {
    animation: slideInDown 0.8s cubic-bezier(0.23, 1, 0.32, 1) 0.1s both;
  }

  .hero-subtitle {
    animation: slideInUp 0.8s cubic-bezier(0.23, 1, 0.32, 1) 0.2s both;
  }

  .glass-card {
    backdrop-filter: blur(12px);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 20px 18px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
    position: relative;
    overflow: hidden;
    animation: slideInUp 0.6s cubic-bezier(0.23, 1, 0.32, 1) backwards;
  }

  .glass-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--accent-color, #FF6B2B), transparent);
  }

  .glass-card::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .glass-card:hover {
    transform: translateY(-6px);
    border-color: rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 12px 40px rgba(212, 90, 30, 0.2);
  }

  .glass-card:hover::after {
    opacity: 1;
  }

  .glass-card-icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    margin: 0 auto 12px;
    background: rgba(212, 90, 30, 0.15);
    border: 1px solid rgba(212, 90, 30, 0.3);
    transition: all 0.3s ease;
  }

  .glass-card:hover .glass-card-icon {
    background: rgba(212, 90, 30, 0.25);
    transform: scale(1.1);
  }

  .stats-ticker {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 32px;
    padding: 16px 24px;
    background: linear-gradient(90deg, rgba(212, 90, 30, 0.08) 0%, rgba(0, 212, 170, 0.08) 100%);
    border-radius: 12px;
    border: 1px solid rgba(212, 90, 30, 0.15);
    margin-top: 32px;
    animation: slideInUp 0.8s cubic-bezier(0.23, 1, 0.32, 1) 0.4s both;
  }

  .ticker-item {
    text-align: center;
    animation: shimmer 2s ease-in-out infinite;
  }

  .ticker-value {
    font-size: 16px;
    font-weight: 900;
    color: #FF6B2B;
    font-family: 'Sora', sans-serif;
  }

  .ticker-label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  @media (max-width: 640px) {
    .glass-card {
      padding: 16px 14px;
    }
    .stats-ticker {
      gap: 20px;
      flex-wrap: wrap;
    }
  }
`;

export default function Onboarding({ onDone, vp, onGoToLogin }) {
  const [step, setStep]   = useState(0);
  const [form, setForm]   = useState({ full_name:'', phone:'', password:'', platform:'ZOMATO', city:'Hyderabad', zone:'Zone-1', daily_earnings: 950, daily_hours: 8, hourly_rate:119 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const reg = await api.register(form);
      if (!reg.ok) { setError(reg.data.message || 'Registration failed'); setLoading(false); return; }
      const log = await api.login({ phone: form.phone, password: form.password });
      if (!log.ok) { setError('Login failed after registration'); setLoading(false); return; }
      localStorage.setItem('token', log.data.token);
      onDone({ worker: { tier: 'STANDARD' } });
    } catch (e) {
      setError('Cannot connect to server. Make sure Flask is running on port 5000.');
    }
    setLoading(false);
  };

  const features = [
    { icon:'⚡', title:'Auto Claims', desc:'Zero paperwork, ever', color:'#FF6B2B' },
    { icon:'💸', title:'Instant UPI', desc:'Paid in under 60 seconds', color:'#00D4AA' },
    { icon:'📅', title:'From ₹29/week', desc:'No lock-in, cancel anytime', color:'#FF6B2B' },
    { icon:'🛡️', title:'80% Coverage', desc:'Fair & transparent payout', color:'#00D4AA' },
  ];

  const stats = [
    { value: '₹2.4L', label: 'Paid this week' },
    { value: '847', label: 'Workers protected' },
    { value: '3', label: 'Triggers active' }
  ];

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:'DM Sans,sans-serif', display:'flex', flexDirection:'column' }}>
      <style>{premiumCss}</style>
      
      {/* Header */}
      <div style={{ padding:'16px 24px', borderBottom:`1px solid ${C.border}`, background:C.surf, display:'flex', justifyContent:'space-between', alignItems:'center', position:'relative', zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, background:`radial-gradient(circle,${C.orange}50,${C.orange}10)`, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🛵</div>
          <span style={{ fontWeight:900, color:C.orange, fontSize:20, letterSpacing:-.5, fontFamily:'Sora,sans-serif' }}>RiderRaksha</span>
        </div>
        {/* Step indicator */}
        <div style={{ display:'flex', gap:8 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ width:i === step ? 28 : 8, height:8, borderRadius:99, background:i===step?C.orange:i<step?C.teal:C.border, transition:'all .4s cubic-bezier(0.23, 1, 0.32, 1)', boxShadow:i===step?`0 0 16px ${C.orange}50`:'' }} />
          ))}
        </div>
      </div>

      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding: step === 0 && vp.lg ? '0' : (vp.sm?'24px 18px':'40px 24px'), position:'relative' }}>
        <div style={{ width:'100%', maxWidth: step === 0 ? '100%' : 560 }}>

          {/* ── Step 0: Welcome ── */}
          {step === 0 && (
            <div style={{ 
              display: vp.lg ? 'flex' : 'block', 
              alignItems: 'center', 
              gap: vp.lg ? 80 : 0,
              minHeight: vp.lg ? '100vh' : 'auto',
              textAlign: vp.lg ? 'left' : 'center'
            }}>
              {/* ── Left Side: Hero Visual ── */}
              <div style={{ flex: 1, position: 'relative', minHeight: vp.lg ? '100vh' : 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: vp.lg ? 80 : 0 }}>
                {/* Gradient Background */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: `radial-gradient(ellipse at center top, ${C.orange}15 0%, transparent 70%)`,
                  pointerEvents: 'none'
                }} />
                
                {/* Decorative Elements */}
                <div style={{
                  position: 'absolute',
                  top: '10%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '300px',
                  height: '300px',
                  background: `radial-gradient(circle, ${C.orange}20, transparent 70%)`,
                  borderRadius: '50%',
                  filter: 'blur(60px)',
                  pointerEvents: 'none'
                }} />

                {/* Hero Emoji */}
                <div style={{ 
                  fontSize: vp.lg ? 180 : 120, 
                  marginBottom: 40,
                  animation: 'pulse 3s ease-in-out infinite',
                  textShadow: `0 20px 60px ${C.orange}30`,
                  zIndex: 1
                }}>🛵</div>

                {/* Headline */}
                <h1 style={{ 
                  fontFamily: 'Sora,sans-serif', 
                  fontSize: vp.lg ? 64 : 36, 
                  fontWeight: 900, 
                  color: C.text, 
                  lineHeight: 1.15,
                  marginBottom: 20,
                  zIndex: 1,
                  letterSpacing: -1.5
                }}>
                  When Disruptions <br/>
                  <span style={{ background: `linear-gradient(135deg, ${C.orange}, #FF8C42)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Stop Your Earnings</span>
                </h1>
                
                <p style={{ 
                  color: C.sub, 
                  fontSize: vp.lg ? 18 : 15, 
                  lineHeight: 1.8, 
                  maxWidth: vp.lg ? 480 : '100%',
                  marginBottom: vp.lg ? 50 : 40,
                  zIndex: 1
                }}>
                  Monsoons, curfews, heatwaves—RiderRaksha detects them instantly and pays you within minutes. <span style={{ color: C.orange, fontWeight: 700 }}>No claims, no waiting.</span>
                </p>

                {/* Trust Stats */}
                {vp.lg && (
                  <div style={{ display: 'flex', gap: 60, zIndex: 1 }}>
                    {stats.map(({ value, label }) => (
                      <div key={label}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: C.orange, marginBottom: 6 }}>{value}</div>
                        <div style={{ fontSize: 12, color: C.sub, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Right Side: Value Proposition & CTA ── */}
              <div style={{ 
                flex: 1, 
                maxWidth: vp.lg ? 'none' : '100%',
                marginTop: vp.lg ? 0 : 60,
                paddingRight: vp.lg ? 60 : 0,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.orange, marginBottom: 32, letterSpacing: 1.5, textTransform: 'uppercase' }}>Why Choose RiderRaksha?</div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr', 
                  gap: 20, 
                  marginBottom: 40
                }}>
                  {features.map(({ icon, title, desc }, i) => (
                    <div key={title} style={{
                      padding: '24px',
                      background: `linear-gradient(135deg, ${C.orange}12, ${C.orange}05)`,
                      border: `1px solid ${C.orange}25`,
                      borderRadius: 18,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      animation: `slideInUp 0.6s cubic-bezier(0.23, 1, 0.32, 1) ${0.1 + i * 0.1}s both`,
                      display: 'flex',
                      gap: 16,
                      alignItems: 'flex-start'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = `linear-gradient(135deg, ${C.orange}18, ${C.orange}08)`;
                      e.currentTarget.style.transform = 'translateX(8px)';
                      e.currentTarget.style.borderColor = `${C.orange}40`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = `linear-gradient(135deg, ${C.orange}12, ${C.orange}05)`;
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.borderColor = `${C.orange}25`;
                    }}>
                      <div style={{ fontSize: 32, flexShrink: 0 }}>{icon}</div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4 }}>{title}</div>
                        <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA Group */}
                <button 
                  onClick={() => setStep(1)}
                  style={{
                    width: '100%',
                    padding: '18px',
                    background: `linear-gradient(135deg, ${C.orange}, #D45A1E)`,
                    borderRadius: 14,
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: 900,
                    fontFamily: 'Sora,sans-serif',
                    boxShadow: `0 20px 60px ${C.orange}35`,
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
                    letterSpacing: 0.3,
                    marginBottom: 16
                  }}
                  onMouseEnter={e => {
                    e.target.style.transform = 'translateY(-4px)';
                    e.target.style.boxShadow = `0 24px 70px ${C.orange}45`;
                  }}
                  onMouseLeave={e => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = `0 20px 60px ${C.orange}35`;
                  }}
                >
                  Start Protecting Your Income →
                </button>

                <div style={{ fontSize: 13, color: C.sub, textAlign: 'center' }}>
                  Already registered? <span onClick={onGoToLogin} style={{ color: C.orange, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.target.style.opacity = '0.7'} onMouseLeave={e => e.target.style.opacity = '1'}>Sign in here</span>
                </div>

                {!vp.lg && (
                  <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, padding: '20px', borderTop: `1px solid ${C.border}` }}>
                    {stats.map(({ value, label }) => (
                      <div key={label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: C.orange, marginBottom: 4 }}>{value}</div>
                        <div style={{ fontSize: 11, color: C.sub, textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 1: Profile ── */}
          {step === 1 && (
            <div>
              <h2 style={{ fontFamily:'Sora,sans-serif', fontSize:vp.sm?22:28, fontWeight:900, color:C.text, marginBottom:6 }}>Your Profile</h2>
              <p style={{ color:C.sub, fontSize:13, marginBottom:24 }}>Tell us about your daily earnings</p>
              
              <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:24 }}>
                <Field 
                  label="Full Name" 
                  value={form.full_name} 
                  onChange={e=>{
                    const val = e.target.value.replace(/[^a-zA-Z\s]/g, ''); // Only letters and spaces
                    set('full_name', val);
                  }} 
                  placeholder="e.g. Rahul Sharma" 
                />
                <Field 
                  label="Phone Number" 
                  value={form.phone} 
                  onChange={e=>{
                    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10); // Only digits, max 10
                    set('phone', val);
                  }} 
                  placeholder="e.g. 9876543210" 
                  type="tel" 
                  maxLength="10"
                />
                <Field 
                  label="Password" 
                  value={form.password} 
                  onChange={e=>{
                    const val = e.target.value;
                    if (val.length <= 32) set('password', val); // Max 32 chars
                  }} 
                  placeholder="Create a password (min 6 chars)" 
                  type="password" 
                />

                {/* Ask for Earnings */}
                <Field 
                  label="Average Daily Earnings (₹)" 
                  value={form.daily_earnings} 
                  onChange={e => {
                    const val = +e.target.value;
                    set('daily_earnings', val);
                    set('hourly_rate', Math.round(val / form.daily_hours)); // Auto-calc
                  }} 
                  type="number" 
                />

                {/* Ask for Hours */}
                <Field 
                  label="Average Daily Hours" 
                  value={form.daily_hours} 
                  onChange={e => {
                    const val = +e.target.value;
                    set('daily_hours', val);
                    set('hourly_rate', Math.round(form.daily_earnings / val)); // Auto-calc
                  }} 
                  type="number" 
                />

                {/* Show Calculated Rate (Read-only for transparency) */}
                <div style={{ padding: '12px', background: C.faint, borderRadius: 12, border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 11, color: C.sub }}>CALCULATED HOURLY RATE</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: C.orange }}>₹{form.hourly_rate}/hr</div>
                </div>
              </div>
              <div style={{ marginBottom:24 }}>
                <div style={{ fontSize:12, color:C.sub, fontWeight:600, marginBottom:10 }}>Platform</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {[{name:'ZOMATO',icon:'🔴',c:'#EF4444'},{name:'SWIGGY',icon:'🟠',c:C.orange}].map(p=>(
                    <div key={p.name} onClick={()=>set('platform',p.name)} style={{ padding:'20px 14px', borderRadius:16, textAlign:'center', cursor:'pointer', transition:'all .2s', background:form.platform===p.name?`${p.c}18`:C.card, border:`2px solid ${form.platform===p.name?p.c:C.border}`, boxShadow:form.platform===p.name?`0 0 24px ${p.c}25`:'' }}>
                      <div style={{ fontSize:32, marginBottom:6 }}>{p.icon}</div>
                      <div style={{ fontSize:14, fontWeight:700, color:form.platform===p.name?p.c:C.sub, fontFamily:'Sora,sans-serif' }}>{p.name}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <button onClick={()=>setStep(0)} style={{ padding:'13px', background:C.faint, border:`1px solid ${C.border}`, borderRadius:14, color:C.sub, fontSize:14, fontWeight:700 }}>← Back</button>
                <PrimaryBtn style={{ width:'auto' }} onClick={()=>{ 
                  const nameRegex = /^[a-zA-Z\s]{2,}$/; // At least 2 letters/spaces
                  const phoneRegex = /^[0-9]{10}$/; // Exactly 10 digits
                  const passwordRegex = /^.{6,}$/; // At least 6 chars
                  
                  if (!nameRegex.test(form.full_name)) { setError('Full name must be at least 2 letters'); return; }
                  if (!phoneRegex.test(form.phone)) { setError('Phone number must be 10 digits'); return; }
                  if (!passwordRegex.test(form.password)) { setError('Password must be at least 6 characters'); return; }
                  
                  setError(''); 
                  setStep(2); 
                }}>Next →</PrimaryBtn>
              </div>
              {error && <div style={{ marginTop:12, padding:'10px 14px', background:C.redDim, border:`1px solid ${C.red}40`, borderRadius:10, fontSize:12, color:C.red }}>{error}</div>}
            </div>
          )}

          {/* ── Step 2: Location ── */}
          {step === 2 && (
            <div>
              <h2 style={{ fontFamily:'Sora,sans-serif', fontSize:vp.sm?22:28, fontWeight:900, color:C.text, marginBottom:6 }}>City & Zone</h2>
              <p style={{ color:C.sub, fontSize:13, marginBottom:24 }}>We monitor disruptions at the zone level</p>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:12, color:C.sub, fontWeight:600, marginBottom:10 }}>Your City</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {Object.keys(CITIES).map(city => (
                    <div key={city} onClick={()=>{set('city',city); set('zone','Zone-1');}} style={{ padding:'8px 16px', borderRadius:99, cursor:'pointer', fontSize:13, fontWeight:600, transition:'all .15s', background:form.city===city?`${C.orange}22`:C.faint, border:`1px solid ${form.city===city?C.orange:C.border}`, color:form.city===city?C.orange:C.sub }}>{city}</div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom:24 }}>
                <div style={{ fontSize:12, color:C.sub, fontWeight:600, marginBottom:10 }}>
                  Delivery Zone <span style={{ color:C.teal, fontSize:10 }}>● Auto-detected</span>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {(CITIES[form.city]||[]).map(z => (
                    <div key={z} onClick={()=>set('zone',z)} style={{ padding:'8px 16px', borderRadius:99, cursor:'pointer', fontSize:13, fontWeight:600, transition:'all .15s', background:form.zone===z?`${C.blue}22`:C.faint, border:`1px solid ${form.zone===z?C.blue:C.border}`, color:form.zone===z?C.blue:C.sub }}>{z}</div>
                  ))}
                </div>
              </div>
              <div style={{ background:`${C.orange}10`, border:`1px solid ${C.orange}25`, borderRadius:14, padding:14, marginBottom:24 }}>
                <div style={{ fontSize:11, color:C.orange, fontWeight:700, marginBottom:4 }}>ZONE RISK FACTORS APPLIED</div>
                <div style={{ fontSize:12, color:C.sub, lineHeight:1.7 }}>Your premium is dynamically adjusted based on your zone's historical flood risk, AQI data, and rainfall frequency.</div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <button onClick={()=>setStep(1)} style={{ padding:'13px', background:C.faint, border:`1px solid ${C.border}`, borderRadius:14, color:C.sub, fontSize:14, fontWeight:700 }}>← Back</button>
                <PrimaryBtn style={{ width:'auto' }} onClick={()=>setStep(3)}>Next →</PrimaryBtn>
              </div>
            </div>
          )}

          {/* ── Step 3: Confirm ── */}
          {step === 3 && (
            <div>
              <h2 style={{ fontFamily:'Sora,sans-serif', fontSize:vp.sm?22:28, fontWeight:900, color:C.text, marginBottom:6 }}>Confirm & Register</h2>
              <p style={{ color:C.sub, fontSize:13, marginBottom:24 }}>Review your details before creating your account</p>
              <GlowCard accent={C.orange} style={{ marginBottom:20 }}>
                {[
                  ['Full Name', form.full_name],
                  ['Phone', form.phone],
                  ['Platform', form.platform],
                  ['City', form.city],
                  ['Zone', form.zone],
                  ['Hourly Rate', `₹${form.hourly_rate}/hr`],
                ].map(([l, v]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:10, alignItems:'center' }}>
                    <span style={{ color:C.sub }}>{l}</span>
                    <span style={{ color:C.text, fontWeight:600 }}>{v}</span>
                  </div>
                ))}
              </GlowCard>
              {error && <div style={{ marginBottom:14, padding:'10px 14px', background:C.redDim, border:`1px solid ${C.red}40`, borderRadius:10, fontSize:12, color:C.red }}>{error}</div>}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <button onClick={()=>setStep(2)} style={{ padding:'13px', background:C.faint, border:`1px solid ${C.border}`, borderRadius:14, color:C.sub, fontSize:14, fontWeight:700 }}>← Back</button>
                <PrimaryBtn style={{ width:'auto' }} loading={loading} disabled={loading} onClick={handleSubmit}>Create Account ✓</PrimaryBtn>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
