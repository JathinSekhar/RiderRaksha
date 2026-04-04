import { useState, useEffect } from 'react';
import { C, STATUS_COLOR, TRIGGER_META } from '../constants/theme';
import { GlowCard, StatBox, SectionLabel, Badge, Bar, Divider, Spinner, Empty } from '../components';
import { api } from '../api/api';

export default function Dashboard({ worker, vp }) {
  const [policy, setPolicy]   = useState(null);
  const [claims, setClaims]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [pol, clm] = await Promise.all([api.activePolicy(), api.myClaims()]);
      if (pol.ok) setPolicy(pol.data);
      if (clm.ok) setClaims(clm.data);
      setLoading(false);
    };
    load();
  }, []);

  const totalPaid   = claims.filter(c=>c.status==='APPROVED').reduce((s,c)=>s+c.payout_amount,0);
  const pendingAmt  = claims.filter(c=>c.status==='PENDING').reduce((s,c)=>s+c.payout_amount,0);
  const recentClaims = claims.slice(0,3);

  if (loading) return <Spinner />;

  return (
    <div style={{ padding:vp.sm?16:vp.md?24:32, overflowY:'auto', height:'100%' }}>
      {/* Welcome Banner */}
      <div style={{ background:`linear-gradient(135deg,${C.orange}18,${C.orange}05)`, border:`1px solid ${C.orange}25`, borderRadius:20, padding:vp.sm?'18px 20px':'22px 28px', marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontSize:vp.sm?18:22, fontWeight:900, color:C.text, fontFamily:'Sora,sans-serif', marginBottom:4 }}>
            Hey, {worker?.full_name?.split(' ')[0]} 👋
          </div>
          <div style={{ fontSize:13, color:C.sub }}>
            {worker?.platform} Partner · {worker?.city}, {worker?.zone}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {policy
            ? <Badge color={C.teal}>● Coverage Active</Badge>
            : <Badge color={C.yellow}>⚠ No Active Policy</Badge>}
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display:'grid', gridTemplateColumns:vp.sm?'1fr 1fr':'repeat(4,1fr)', gap:12, marginBottom:24 }}>
        {[
          { label:'Total Received',   val:`₹${totalPaid.toFixed(0)}`,   color:C.teal,   icon:'💸' },
          { label:'Pending Payout',   val:`₹${pendingAmt.toFixed(0)}`,  color:C.yellow, icon:'⏳' },
          { label:'Total Claims',     val:claims.length,                 color:C.orange, icon:'📋' },
          { label:'Hourly Rate',      val:`₹${worker?.hourly_rate}/hr`, color:C.blue,   icon:'⏱️' },
        ].map(s => (
          <GlowCard key={s.label} style={{ padding:vp.sm?14:18, textAlign:'center' }}>
            <StatBox {...s} sm={vp.sm} />
          </GlowCard>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:vp.lg?'1fr 1fr':'1fr', gap:20 }}>
        {/* Active Policy */}
        <GlowCard accent={policy ? C.teal : C.border}>
          <SectionLabel>ACTIVE POLICY</SectionLabel>
          {policy ? (
            <>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <div>
                  <div style={{ fontSize:20, fontWeight:900, color:C.text, fontFamily:'Sora,sans-serif' }}>{policy.tier}</div>
                  <div style={{ fontSize:12, color:C.sub, marginTop:2 }}>₹{policy.premium}/week · Expires {new Date(policy.end_date).toLocaleDateString('en-IN')}</div>
                </div>
                <Badge color={C.teal}>{policy.status}</Badge>
              </div>
              <Divider my={10} />
              {[
                ['Coverage Cap', `₹${policy.coverage_cap?.toLocaleString()}`],
                ['Weekly Premium', `₹${policy.premium}`],
                ['Payout Formula', `Hours × ₹${worker?.hourly_rate} × 80%`],
              ].map(([l,v]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:8 }}>
                  <span style={{ color:C.sub }}>{l}</span>
                  <span style={{ color:C.text, fontWeight:600 }}>{v}</span>
                </div>
              ))}
            </>
          ) : (
            <Empty icon="🛡️" title="No Active Policy" sub="Go to Policy tab to buy your weekly coverage plan" />
          )}
        </GlowCard>

        {/* Recent Claims */}
        <GlowCard>
          <SectionLabel>RECENT CLAIMS</SectionLabel>
          {recentClaims.length > 0 ? recentClaims.map(c => {
            const meta = TRIGGER_META[c.disruption_type] || {};
            const col  = STATUS_COLOR[c.status] || C.sub;
            return (
              <div key={c.id} style={{ background:C.cardHi, border:`1px solid ${C.border}`, borderRadius:14, padding:'12px 14px', marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:18 }}>{meta.icon}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{meta.label || c.disruption_type}</span>
                  </div>
                  <Badge color={col} sm>{c.status}</Badge>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                  <span style={{ color:C.sub }}>{c.hours_lost} hrs lost</span>
                  <span style={{ color:col, fontWeight:800 }}>₹{c.payout_amount}</span>
                </div>
                <Bar val={c.fraud_score * 100} color={c.fraud_score < 0.3 ? C.teal : c.fraud_score < 0.6 ? C.yellow : C.red} h={3} style={{ marginTop:8 }} />
                <div style={{ fontSize:10, color:C.muted, marginTop:4 }}>Fraud score: {(c.fraud_score*100).toFixed(0)}%</div>
              </div>
            );
          }) : <Empty icon="📋" title="No claims yet" sub="Claims are auto-created when a disruption triggers in your zone" />}
        </GlowCard>
      </div>

      {/* Payout Formula Card */}
      <GlowCard style={{ marginTop:20 }} accent={C.orange}>
        <SectionLabel>YOUR PAYOUT FORMULA</SectionLabel>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          {['Hours Lost', '×', `₹${worker?.hourly_rate}/hr`, '×', '80%', '=', 'Your Payout'].map((t, i) => (
            <div key={i} style={{ padding: t==='×'||t==='='?'0':'8px 14px', background:t==='×'||t==='='?'transparent':C.faint, border:t==='×'||t==='='?'none':`1px solid ${C.border}`, borderRadius:10, fontSize:t==='Your Payout'?16:13, fontWeight:700, color:t==='Your Payout'?C.orange:t==='×'||t==='='?C.muted:C.text }}>{t}</div>
          ))}
        </div>
      </GlowCard>
    </div>
  );
}
