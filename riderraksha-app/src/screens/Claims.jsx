import { useState, useEffect } from 'react';
import { C, STATUS_COLOR, TRIGGER_META } from '../constants/theme';
import { GlowCard, SectionLabel, Badge, Bar, Divider, Spinner, Empty, StatBox } from '../components';
import { api } from '../api/api';

export default function Claims({ worker, vp }) {
  const [claims, setClaims]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('ALL');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.myClaims().then(res => {
      if (res.ok) setClaims(res.data);
      setLoading(false);
    });
  }, []);

  const statuses  = ['ALL', 'APPROVED', 'PENDING', 'UNDER_REVIEW', 'REJECTED'];
  const filtered  = filter === 'ALL' ? claims : claims.filter(c => c.status === filter);
  const totalPaid = claims.filter(c=>c.status==='APPROVED').reduce((s,c)=>s+c.payout_amount,0);
  const pendingAmt= claims.filter(c=>c.status==='PENDING').reduce((s,c)=>s+c.payout_amount,0);

  if (loading) return <Spinner />;

  return (
    <div style={{ padding: vp.sm ? 16 : vp.md ? 24 : 32, overflowY: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontFamily: 'Sora,sans-serif', fontSize: vp.sm ? 22 : 28, fontWeight: 900, color: C.text, letterSpacing: -.5 }}>My Claims</div>
      </div>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 22 }}>Auto-triggered · Zero paperwork</div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Received', val: `₹${totalPaid.toFixed(0)}`,  color: C.teal,   icon: '💸' },
          { label: 'Pending',        val: `₹${pendingAmt.toFixed(0)}`, color: C.yellow, icon: '⏳' },
          { label: 'Total Claims',   val: claims.length,               color: C.orange, icon: '📋' },
        ].map(s => (
          <GlowCard key={s.label} style={{ padding: vp.sm ? 12 : 16, textAlign: 'center' }}>
            <StatBox {...s} sm />
          </GlowCard>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {statuses.map(s => (
          <div key={s} onClick={() => setFilter(s)} style={{ padding: '6px 14px', borderRadius: 99, cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all .15s', background: filter === s ? `${C.orange}22` : C.faint, border: `1px solid ${filter === s ? C.orange : C.border}`, color: filter === s ? C.orange : C.sub }}>{s}</div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Empty icon="📋" title="No claims found" sub="Claims are auto-created when a disruption triggers in your zone" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(c => {
            const meta  = TRIGGER_META[c.disruption_type] || {};
            const col   = STATUS_COLOR[c.status] || C.sub;
            const isExp = expanded === c.id;
            
            // Reference derived from unique claim hash or backend ID
            const ref = c.claim_hash ? `RR-${c.claim_hash.slice(0,8).toUpperCase()}` : `RR${c.id}`;

            return (
              <GlowCard key={c.id} onClick={() => setExpanded(isExp ? null : c.id)} style={{ cursor: 'pointer', border: `1px solid ${isExp ? C.orange : C.border}`, transition: 'all .2s' }} hover>

                {/* Claim Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, background: `${col}18`, border: `1px solid ${col}30`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{meta.icon || '📋'}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{meta.label || c.disruption_type}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: col, fontFamily: 'Sora,sans-serif' }}>₹{c.payout_amount}</div>
                    <Badge color={col} sm>{c.status}</Badge>
                  </div>
                </div>

                {/* Expanded System & Payout Details */}
                {isExp && (
                  <div style={{ marginTop: 14, animation: 'fadeUp .2s ease' }}>
                    <Divider my={0} />
                    <div style={{ marginTop: 14 }}>

                      {/* Calculations */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                        {[
                          ['Hours Lost',  `${c.hours_lost} hrs`],
                          ['Hourly Rate', `₹${worker?.hourly_rate}/hr`],
                          ['Payout (80%)',`₹${c.payout_amount}`],
                          ['Policy ID',   `POL-${c.policy_id}`],
                        ].map(([l, v]) => (
                          <div key={l} style={{ background: C.cardHi, borderRadius: 10, padding: '10px 12px' }}>
                            <div style={{ fontSize: 10, color: C.muted, marginBottom: 3 }}>{l}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{v}</div>
                          </div>
                        ))}
                      </div>

                      {/* ── System Verification (Idempotency & Fraud) ── */}
                      <div style={{ marginBottom: 12, padding: '12px', background: C.faint, borderRadius: 12, border: `1px solid ${C.border}` }}>
                        <SectionLabel>Verification & Integrity</SectionLabel>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.muted, marginBottom: 4 }}>
                          <span>Fraud Score (Isolation Forest)</span>
                          <span style={{ color: c.fraud_score < 0.3 ? C.teal : c.fraud_score < 0.6 ? C.yellow : C.red }}>{(c.fraud_score * 100).toFixed(0)}%</span>
                        </div>
                        <Bar val={c.fraud_score * 100} color={c.fraud_score < 0.3 ? C.teal : c.fraud_score < 0.6 ? C.yellow : C.red} h={5} />
                        
                        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <span style={{ fontSize: 11, color: C.muted }}>Idempotency Key:</span>
                           <code style={{ fontSize: 11, color: C.orange, background: `${C.orange}10`, padding: '2px 6px', borderRadius: 4 }}>{ref}</code>
                        </div>
                      </div>

                      {/* ── Approved State with Webhook Status ── */}
                      {c.status === 'APPROVED' && (
                        <div style={{ background: `${C.teal}10`, border: `1px solid ${C.teal}30`, borderRadius: 12, padding: '14px 16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                             <div style={{ fontSize: 10, color: C.teal, fontWeight: 800, letterSpacing: 1.5 }}>✅ PAYOUT PROCESSED</div>
                             <Badge color={C.teal} sm>WEBHOOK VERIFIED</Badge>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 12, color: C.sub }}>Amount Transferred</span>
                            <span style={{ fontSize: 18, fontWeight: 900, color: C.teal, fontFamily: 'Sora,sans-serif' }}>₹{c.payout_amount}</span>
                          </div>
                          <div style={{ fontSize: 11, color: C.sub }}>
                            Transferred to <strong>{worker?.phone}@upi</strong> via Razorpay Secure Gateway.
                          </div>
                        </div>
                      )}

                      {/* ── Pending State ── */}
                      {c.status === 'PENDING' && (
                        <div style={{ background: `${C.yellow}10`, border: `1px solid ${C.yellow}30`, borderRadius: 12, padding: '14px 16px' }}>
                          <div style={{ fontSize: 10, color: C.yellow, fontWeight: 800, letterSpacing: 1.5, marginBottom: 6 }}>⏳ PROCESSING HOLD</div>
                          <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.7 }}>Claim is under a data validation hold. Payout will trigger automatically to registered UPI handle.</div>
                        </div>
                      )}

                    </div>
                  </div>
                )}
              </GlowCard>
            );
          })}
        </div>
      )}
    </div>
  );
}