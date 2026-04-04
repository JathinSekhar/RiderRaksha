import { useState } from 'react';
import { C, TRIGGER_META } from '../constants/theme';
import { GlowCard, SectionLabel, Badge, Bar, Divider, Spinner } from '../components';
import { api } from '../api/api';

export default function Monitor({ worker, vp, onToast }) {
  const [result, setResult]     = useState(null);
  const [progress, setProgress] = useState(0);
  const [scanning, setScanning] = useState(false);

  const runTriggerCheck = async () => {
    setScanning(true); 
    setResult(null); 
    setProgress(0);
    
    // UI Progress Bar simulation
    let p = 0;
    const iv = setInterval(() => { 
      p += 3; 
      setProgress(Math.min(p, 95)); 
      if (p >= 95) clearInterval(iv); 
    }, 60);

    try {
      // 1. Call real backend trigger engine
      const res = await api.checkTriggers(worker.city, worker.zone);
      
      clearInterval(iv); 
      setProgress(100);

      setTimeout(() => {
        setScanning(false);
        
        // 2. Handle Success (Trigger Fired or Zone Clear)
        if (res.ok && res.data.status === 'SUCCESS') {
          setResult(res.data);
          if (res.data.triggers_fired > 0) {
            onToast({ 
              msg: 'Trigger Detected!', 
              sub: 'Claim auto-created & Payout processing', 
              color: C.orange 
            });
          } else {
            onToast({ 
              msg: 'Zone is Clear', 
              sub: 'No new disruptions detected', 
              color: C.teal 
            });
          }
        } 
        // 3. Handle Resilience (Backend API Failure Fallback)
        else if (res.ok && res.data.status === 'ERROR') {
          setResult(res.data);
          onToast({ 
            msg: 'Source Unavailable', 
            sub: 'Environmental data error. Retrying...', 
            color: C.red 
          });
        }
        // 4. Handle Idempotency / Already Protected (Optional specific backend status)
        else if (res.status === 409 || res.data?.status === 'IDEMPOTENCY_SKIP') {
          onToast({ 
            msg: 'Already Protected', 
            sub: 'Claim for this event already processed.', 
            color: C.blue 
          });
        }
      }, 400);
    } catch (err) {
      clearInterval(iv);
      setScanning(false);
      onToast({ msg: 'Connection Error', sub: 'Could not reach server', color: C.red });
    }
  };

  const triggers = Object.entries(TRIGGER_META);

  return (
    <div style={{ padding: vp.sm ? 16 : vp.md ? 24 : 32, overflowY: 'auto', height: '100%' }}>
      <div style={{ fontFamily: 'Sora,sans-serif', fontSize: vp.sm ? 22 : 28, fontWeight: 900, color: C.text, letterSpacing: -.5, marginBottom: 4 }}>
        Disruption Monitor
      </div>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 24 }}>
        Live parametric triggers · Real-time zone check
      </div>

      {/* Worker Zone Info */}
      <GlowCard accent={C.orange} style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: 1.5, marginBottom: 4 }}>MONITORING ZONE</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.text, fontFamily: 'Sora,sans-serif' }}>
              {worker?.city} · {worker?.zone}
            </div>
          </div>
          <button 
            onClick={runTriggerCheck} 
            disabled={scanning} 
            style={{ 
              padding: '12px 24px', 
              background: scanning ? C.faint : `linear-gradient(135deg,#D45A1E,${C.orange})`, 
              border: `1px solid ${scanning ? C.border : C.orange}`, 
              borderRadius: 14, 
              color: scanning ? C.sub : '#fff', 
              fontSize: 14, 
              fontWeight: 800, 
              fontFamily: 'Sora,sans-serif', 
              boxShadow: scanning ? '' : `0 4px 20px ${C.orange}40`, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8 
            }}
          >
            {scanning ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span> Scanning...</> : '🔍 Check Triggers Now'}
          </button>
        </div>
        {scanning && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.orange, marginBottom: 6 }}>
              <span>Querying weather APIs · Checking civic feeds...</span>
              <span style={{ fontWeight: 700 }}>{progress}%</span>
            </div>
            <Bar val={progress} color={C.orange} h={5} />
          </div>
        )}
      </GlowCard>

      <div style={{ display: 'grid', gridTemplateColumns: vp.lg ? '1fr 1fr' : '1fr', gap: 20 }}>
        {/* Trigger List */}
        <div>
          <SectionLabel>5 PARAMETRIC TRIGGERS</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {triggers.map(([key, t]) => {
              const fired = result?.details?.find(d => d.event_type === key);
              return (
                <GlowCard key={key} style={{ padding: '14px 16px', border: `1px solid ${fired ? C.orange : C.border}`, transition: 'all .3s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 26 }}>{t.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{t.label}</div>
                        <div style={{ fontSize: 10, color: C.muted }}>Threshold: {t.threshold}</div>
                        <div style={{ fontSize: 10, color: C.blue, marginTop: 1 }}>Triggers {t.hours}hr payout window</div>
                      </div>
                    </div>
                    {result && result.status !== 'ERROR'
                      ? fired
                        ? <Badge color={C.orange}>🔥 Triggered</Badge>
                        : <Badge color={C.teal}>✓ Clear</Badge>
                      : <Badge color={C.muted} sm>Waiting</Badge>}
                  </div>
                  {fired && (
                    <div style={{ marginTop: 10, background: `${C.orange}10`, borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ fontSize: 12, color: C.orange, fontWeight: 700 }}>Reading: {fired.reading?.toFixed(1)} · Threshold: {fired.threshold}</div>
                      <div style={{ fontSize: 11, color: C.sub, marginTop: 3 }}>{fired.hours_affected} hrs affected in {fired.zone}</div>
                    </div>
                  )}
                </GlowCard>
              );
            })}
          </div>
        </div>

        {/* Result Panel */}
        <div>
          <SectionLabel>CHECK RESULT</SectionLabel>
          {!result ? (
            <GlowCard style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📡</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: 'Sora,sans-serif', marginBottom: 8 }}>Ready to Scan</div>
              <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.7 }}>Click "Check Triggers Now" to run a real-time check. Claims are auto-created for disruptions.</div>
            </GlowCard>
          ) : result.status === 'ERROR' ? (
            <GlowCard accent={C.red} style={{ textAlign: 'center', padding: 32 }}>
               <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
               <div style={{ fontSize: 15, fontWeight: 800, color: C.red, marginBottom: 8 }}>Environmental Source Error</div>
               <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.6 }}>{result.message}</div>
            </GlowCard>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <GlowCard accent={result.triggers_fired > 0 ? C.orange : C.teal}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: C.text, fontFamily: 'Sora,sans-serif' }}>
                    {result.triggers_fired > 0 ? `🔥 ${result.triggers_fired} Trigger(s) Fired` : '✅ Zone Clear'}
                  </div>
                  <Badge color={result.triggers_fired > 0 ? C.orange : C.teal}>{result.city} · {result.zone}</Badge>
                </div>

                {result.details?.map(d => {
                  const meta   = TRIGGER_META[d.event_type] || {};
                  const payout = (d.hours_affected * (worker?.hourly_rate || 119) * 0.8).toFixed(0);
                  const ref    = `RR-WEBHOOK-ACTIVE`;
                  return (
                    <div key={d.event_type} style={{ background: C.cardHi, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{meta.icon}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{meta.label}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: C.teal }}>₹{payout} → UPI ✅</span>
                      </div>
                      <div style={{ fontSize: 11, color: C.sub, marginBottom: 10 }}>
                        {d.hours_affected} hrs × ₹{worker?.hourly_rate}/hr × 80% · Reading: {d.reading?.toFixed(1)}
                      </div>
                      <div style={{ background: `${C.teal}10`, border: `1px solid ${C.teal}25`, borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 10 }}>
                          <div style={{ fontSize: 10, color: C.teal, fontWeight: 800, letterSpacing: 1.5 }}>✅ PAYOUT PROCESSED</div>
                          <Badge color={C.teal} sm>WEBHOOK SENT</Badge>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 12, color: C.sub }}>{worker?.phone}@upi</div>
                          <div style={{ fontSize: 20, fontWeight: 900, color: C.teal, fontFamily: 'Sora,sans-serif' }}>₹{payout}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {result.triggers_fired === 0 && (
                  <div style={{ fontSize: 13, color: C.sub, textAlign: 'center', padding: '12px 0' }}>
                    No active disruptions in {result.zone} right now.
                  </div>
                )}
              </GlowCard>
              <GlowCard>
                <SectionLabel>HOW AUTO-CLAIM WORKS</SectionLabel>
                {['Threshold crossed in zone','Active policy confirmed','Payout = hrs × rate × 80%','Fraud scan (Isolation Forest)','Approved → instant UPI transfer'].map((s,i)=>(
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < 4 ? 10 : 0 }}>
                    <div style={{ width: 22, height: 22, minWidth: 22, background: `${C.orange}25`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: C.orange }}>{i+1}</div>
                    <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.6, paddingTop: 3 }}>{s}</div>
                  </div>
                ))}
              </GlowCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}