import { C } from '../constants/theme';
import { GlowCard, SectionLabel, Badge, Bar, StatBox } from '../components';

const WEEKLY = [
  {w:'W1',rev:42000,pay:18000},{w:'W2',rev:51000,pay:23000},
  {w:'W3',rev:48000,pay:31000},{w:'W4',rev:62000,pay:24000},
  {w:'W5',rev:57000,pay:19000},{w:'W6',rev:68000,pay:28000},
];
const ZONES = [
  {zone:'Zone-1',claims:12,ratio:68,risk:'High'},
  {zone:'Zone-2',claims:7, ratio:45,risk:'Medium'},
  {zone:'Zone-3',claims:4, ratio:28,risk:'Low'},
  {zone:'Zone-4',claims:9, ratio:54,risk:'Medium'},
];
const FRAUD = [
  {id:'WRK-4421',reason:'GPS coordinates inconsistent with claimed zone',score:94},
  {id:'WRK-2198',reason:'Duplicate claim — same event ID filed twice',score:88},
  {id:'WRK-3305',reason:'New account (<14 days) with 6 claims in one event',score:82},
];

export default function Admin({ vp }) {
  const maxR = Math.max(...WEEKLY.map(w=>w.rev));
  return (
    <div style={{ padding:vp.sm?16:vp.md?24:32, overflowY:'auto', height:'100%' }}>
      {/* Banner */}
      <div style={{ background:`linear-gradient(135deg,${C.blue}15,${C.purple}08)`, border:`1px solid ${C.blue}25`, borderRadius:18, padding:'14px 20px', marginBottom:22, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:38, height:38, background:`${C.blue}22`, border:`1px solid ${C.blue}40`, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>📊</div>
          <div>
            <div style={{ fontSize:15, fontWeight:900, color:C.text, fontFamily:'Sora,sans-serif' }}>Admin Dashboard</div>
            <div style={{ fontSize:11, color:C.sub, marginTop:1 }}>Insurer view · Hyderabad Region</div>
          </div>
        </div>
        <Badge color={C.blue}>ADMIN MODE</Badge>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:vp.sm?'1fr 1fr':'repeat(4,1fr)', gap:12, marginBottom:22 }}>
        {[
          {l:'Active Policies',v:'2,847',c:C.blue},
          {l:'Week Payouts',   v:'₹1.2L', c:C.orange},
          {l:'Loss Ratio',    v:'62%',   c:C.yellow},
          {l:'Fraud Blocked', v:'14',    c:C.teal},
        ].map(s=>(
          <GlowCard key={s.l} style={{ padding:vp.sm?14:18, textAlign:'center' }}>
            <div style={{ fontSize:vp.sm?22:28, fontWeight:900, color:s.c, letterSpacing:-.5, fontFamily:'Sora,sans-serif' }}>{s.v}</div>
            <div style={{ fontSize:11, color:C.sub, marginTop:4 }}>{s.l}</div>
          </GlowCard>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:vp.lg?'1fr 1fr':vp.md?'1fr 1fr':'1fr', gap:16, marginBottom:16 }}>
        {/* Revenue Chart */}
        <GlowCard>
          <SectionLabel>REVENUE vs PAYOUTS — 6 WEEKS</SectionLabel>
          <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:100 }}>
            {WEEKLY.map(w=>(
              <div key={w.w} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, height:'100%', justifyContent:'flex-end' }}>
                <div style={{ width:'100%', height:`${(w.rev/maxR)*100}%`, background:`${C.blue}30`, borderRadius:'5px 5px 0 0', position:'relative', minHeight:4 }}>
                  <div style={{ position:'absolute', bottom:0, width:'100%', height:`${(w.pay/w.rev)*100}%`, background:`linear-gradient(to top,${C.orange},${C.orange}aa)`, borderRadius:'5px 5px 0 0' }} />
                </div>
                <div style={{ fontSize:9, color:C.muted }}>{w.w}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:16, marginTop:12 }}>
            {[{c:`${C.blue}30`,l:'Revenue'},{c:C.orange,l:'Payouts'}].map(x=>(
              <div key={x.l} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:10, height:10, background:x.c, borderRadius:3 }} />
                <span style={{ fontSize:11, color:C.sub }}>{x.l}</span>
              </div>
            ))}
          </div>
        </GlowCard>

        {/* Zone Risk Heatmap */}
        <GlowCard>
          <SectionLabel>ZONE RISK HEATMAP</SectionLabel>
          {ZONES.map(z=>{
            const col = z.risk==='High'?C.red:z.risk==='Medium'?C.yellow:C.teal;
            return (
              <div key={z.zone} style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
                  <span style={{ color:C.text, fontWeight:600 }}>{z.zone}</span>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ color:C.muted, fontSize:11 }}>{z.claims} claims</span>
                    <Badge color={col} sm>{z.risk}</Badge>
                  </div>
                </div>
                <Bar val={z.ratio} color={col} h={7} />
              </div>
            );
          })}
        </GlowCard>
      </div>

      {/* Forecast */}
      <GlowCard accent={C.orange} style={{ marginBottom:16 }}>
        <SectionLabel>NEXT WEEK FORECAST</SectionLabel>
        <div style={{ fontSize:13, color:C.text, lineHeight:1.9 }}>
          <strong>High rain probability (78%)</strong> — Zone-1 & Zone-3, Wed–Thu<br/>
          Estimated exposure: <strong style={{ color:C.orange }}>₹38,000 – ₹52,000</strong><br/>
          Recommended adjustment: <strong style={{ color:C.red }}>+₹4–₹6/worker</strong>
        </div>
      </GlowCard>

      {/* Fraud Flags */}
      <GlowCard>
        <SectionLabel>RECENT FRAUD FLAGS</SectionLabel>
        {FRAUD.map(f=>(
          <div key={f.id} style={{ background:`${C.red}08`, border:`1px solid ${C.red}20`, borderRadius:14, padding:14, marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{f.id}</span>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <span style={{ fontSize:11, color:C.red, fontWeight:700 }}>Score: {f.score}%</span>
                <Badge color={C.red} sm>Blocked</Badge>
              </div>
            </div>
            <div style={{ fontSize:12, color:C.muted }}>{f.reason}</div>
          </div>
        ))}
      </GlowCard>
    </div>
  );
}
