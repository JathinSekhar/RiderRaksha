  import { useState, useEffect } from 'react';
  import { C, TIERS } from '../constants/theme';
  import { GlowCard, SectionLabel, Badge, Divider, PrimaryBtn, Spinner } from '../components';
  import { api } from '../api/api';

  const PAYMENT_METHODS = [
    { id: 'gpay', name: 'GPay', icon: '🔵', color: '#3D8EF0' },
    { id: 'phonepe', name: 'PhonePe', icon: '🟣', color: '#8B5CF6' },
    { id: 'paytm', name: 'Paytm', icon: '🟠', color: '#FF6B2B' },
  ];

  const PROCESSING_STEPS = [
    'Verifying eligibility...',
    'Processing payment...',
    'Activating policy...',
  ];

  export default function PolicyScreen({ worker, vp, onToast }) {
    const [selected, setSelected] = useState('STANDARD');
    const [previews, setPreviews]  = useState({});
    const [active, setActive]      = useState(null);
    const [myPolicies, setMyPolicies] = useState([]);
    const [loading, setLoading]    = useState(true);
    const [buying, setBuying]      = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [success, setSuccess]    = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
      const load = async () => {
        try {
          const token = localStorage.getItem('token');
          const config = { headers: { Authorization: `Bearer ${token}` } };

          // 1. Load active policy and history using the authenticated API wrapper
          const [pol, all] = await Promise.all([api.activePolicy(), api.myPolicies()]);
          if (pol.ok) setActive(pol.data);
          if (all.ok) setMyPolicies(all.data);

          // 2. Load previews for all tiers with explicit Auth headers to fix 422 error
         
          const results = await Promise.all(
  TIERS.map(t => api.previewPremium(t.name))
);

const map = {};
TIERS.forEach((t, i) => {
  if (results[i].ok) {
    map[t.name] = results[i].data;
  }
});
          
          setPreviews(map);
        } catch (err) {
          console.error("Failed to load policy data:", err);
          onToast({ msg: 'Error loading premiums', sub: 'Please check your connection', color: C.red });
        } finally {
          setLoading(false);
        }
      };
      load();
    }, []);

    const handleBuyClick = () => {
      if (buying || active) return; // Prevent multiple clicks
      setShowPayment(true);
    };

    const handleConfirm = () => {
      setShowConfirm(false);
      setShowPayment(false);
      processPayment();
    };

    const processPayment = async () => {
      setBuying(true);
      setCurrentStep(0);

      try {
        // Step 1: Verify eligibility
        await new Promise(resolve => setTimeout(resolve, 800));

        // Step 2: Call API (after verification)
        const res = await api.buyPolicy({ tier: selected });
        
        if (!res.ok) {
          setBuying(false);
          setCurrentStep(0);
          onToast({ msg: res.data.message || 'Purchase failed', color: C.red });
          return;
        }

        // Step 3: Activate policy
        setCurrentStep(1);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setCurrentStep(2);
        await new Promise(resolve => setTimeout(resolve, 800));

        setActive(res.data.policy);
        setSuccess(true);
        
        setTimeout(() => {
          setSuccess(false);
          setBuying(false);
          setSelectedPayment(null);
          setCurrentStep(0);
          onToast({
            msg: 'Policy activated!',
            sub: `${selected} plan · ₹${res.data.policy.premium}/week`,
            color: C.teal
          });
        }, 3000);
      } catch (err) {
        setBuying(false);
        setCurrentStep(0);
        onToast({ msg: 'Payment failed', color: C.red });
      }
    };

    const inc = ['Income lost to heavy rain', 'Extreme heat advisory', 'Severe AQI closures', 'Curfew & local strikes', 'Flash flood alerts'];
    const exc = ['Vehicle repairs', 'Health / medical', 'Accidents', 'App downtime', 'War or pandemic'];

    if (loading) return <Spinner />;

    const preview = previews[selected] || {};

    return (
      <div style={{ padding: vp.sm ? 16 : vp.md ? 24 : 32, overflowY: 'auto', height: '100%' }}>
        <div style={{ fontFamily: 'Sora,sans-serif', fontSize: vp.sm ? 22 : 28, fontWeight: 900, color: C.text, letterSpacing: -.5, marginBottom: 4 }}>
          Choose Your Plan
        </div>
        <div style={{ fontSize: 13, color: C.sub, marginBottom: 24 }}>Weekly pricing · Cancel anytime · No lock-in</div>

        {/* Active Policy Banner */}
        {active && (
          <div style={{ background: `${C.teal}10`, border: `1px solid ${C.teal}30`, borderRadius: 14, padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.teal }}>✓ Active Policy: </span>
              <span style={{ fontSize: 13, color: C.text }}>{active.tier} — ₹{active.premium}/week</span>
            </div>
            <Badge color={C.teal} sm>Expires {new Date(active.end_date).toLocaleDateString('en-IN')}</Badge>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: vp.lg ? '1fr 1fr' : '1fr', gap: 20 }}>
          
          {/* Tier Selection Column */}
          <div>
            <SectionLabel>SELECT PLAN</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
              {TIERS.map(t => {
                const p = previews[t.name];
                const isActive = selected === t.name;
                return (
                  <div key={t.name} onClick={() => setSelected(t.name)} style={{ background: isActive ? `${t.color}14` : C.card, border: `2px solid ${isActive ? t.color : C.border}`, borderRadius: 18, padding: '16px 18px', cursor: 'pointer', transition: 'all .2s', position: 'relative', boxShadow: isActive ? `0 6px 28px ${t.color}25` : '' }}>
                    {t.popular && <div style={{ position: 'absolute', top: -11, right: 16, background: `linear-gradient(135deg,#D45A1E,${C.orange})`, color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 12px', borderRadius: 99 }}>RECOMMENDED</div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 28 }}>{t.icon}</span>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 900, color: C.text, fontFamily: 'Sora,sans-serif' }}>{t.label}</div>
                          <div style={{ fontSize: 11, color: C.sub }}>{t.desc}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: t.color, fontFamily: 'Sora,sans-serif' }}>
                          ₹{p?.dynamic_premium ?? t.premium}
                        </div>
                        <div style={{ fontSize: 11, color: C.muted }}>/week</div>
                      </div>
                    </div>
                    <Divider my={10} />
                    <div style={{ display: 'flex', gap: 16, fontSize: 11, color: C.sub }}>
                      <span>✓ ₹{t.cap.toLocaleString()} cap</span>
                      <span>✓ 5 triggers</span>
                      <span>✓ Auto UPI payout</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <PrimaryBtn 
              loading={buying} 
              disabled={buying || !!active} 
              onClick={handleBuyClick}
            >
              {active ? `${active.tier} Plan Active` : `Activate ${selected} — ₹${preview.dynamic_premium ?? ''}/week`}
            </PrimaryBtn>
          </div>

          {/* Dynamic Breakdown Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <GlowCard accent={C.orange}>
              <SectionLabel>DYNAMIC PREMIUM BREAKDOWN</SectionLabel>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}>
                <span style={{ color: C.sub }}>Base — {selected}</span>
                <span style={{ color: C.text, fontWeight: 700 }}>₹{preview.base_premium ?? '—'}</span>
              </div>
              
              {/* Show specific multipliers returned from backend */}
              {preview.zone_risk_multiplier && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 7 }}>
                  <span style={{ color: C.sub }}>Zone risk ({preview.zone} · {preview.zone_risk_level})</span>
                  <span style={{ color: C.yellow, fontWeight: 700, background: `${C.yellow}15`, padding: '2px 8px', borderRadius: 6 }}>×{preview.zone_risk_multiplier}</span>
                </div>
              )}
              {preview.city_risk_multiplier && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 7 }}>
                  <span style={{ color: C.sub }}>City risk ({preview.city} · {preview.city_risk_level})</span>
                  <span style={{ color: C.red, fontWeight: 700, background: `${C.red}15`, padding: '2px 8px', borderRadius: 6 }}>×{preview.city_risk_multiplier}</span>
                </div>
              )}
              
              <Divider />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, color: C.text, fontFamily: 'Sora,sans-serif' }}>Your weekly premium</span>
                <span style={{ fontWeight: 900, color: C.orange, fontSize: 24, letterSpacing: -.5, fontFamily: 'Sora,sans-serif' }}>
                  ₹{preview.dynamic_premium ?? '—'}
                </span>
              </div>
            </GlowCard>

            <GlowCard>
              <SectionLabel>COVERAGE SCOPE</SectionLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: C.teal, fontWeight: 700, marginBottom: 8 }}>✅ Covered</div>
                  {inc.map(i => <div key={i} style={{ fontSize: 11, color: C.sub, marginBottom: 6, lineHeight: 1.5, paddingLeft: 8, borderLeft: `2px solid ${C.teal}40` }}>{i}</div>)}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.red, fontWeight: 700, marginBottom: 8 }}>❌ Excluded</div>
                  {exc.map(i => <div key={i} style={{ fontSize: 11, color: C.muted, marginBottom: 6, lineHeight: 1.5, paddingLeft: 8, borderLeft: `2px solid ${C.red}30` }}>{i}</div>)}
                </div>
              </div>
            </GlowCard>
          </div>
        </div>

        {/* Payment Methods Modal */}
        {showPayment && !success && (
          <Modal onClose={() => setShowPayment(false)} disableClose={buying}>
            <ModalContent>
              <h2 style={{ marginTop: 0, marginBottom: 24, color: C.text, fontSize: 18, fontWeight: 800, fontFamily: 'Sora,sans-serif' }}>
                Select Payment Method
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
                {PAYMENT_METHODS.map(pm => (
                  <div
                    key={pm.id}
                    onClick={() => !buying && setSelectedPayment(pm.id)}
                    style={{
                      background: selectedPayment === pm.id ? `${pm.color}20` : C.card,
                      border: `2px solid ${selectedPayment === pm.id ? pm.color : C.border}`,
                      borderRadius: 12,
                      padding: 16,
                      cursor: buying ? 'not-allowed' : 'pointer',
                      transition: 'all .2s',
                      textAlign: 'center',
                      opacity: buying && selectedPayment !== pm.id ? 0.5 : 1,
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{pm.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{pm.name}</div>
                  </div>
                ))}
              </div>
              
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, marginBottom: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: C.sub, marginBottom: 4 }}>Pay via {selectedPayment ? PAYMENT_METHODS.find(p => p.id === selectedPayment)?.name : 'selected method'}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: C.orange, fontFamily: 'Sora,sans-serif' }}>
                  ₹{preview.dynamic_premium ?? '0'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button
                  onClick={() => !buying && setShowPayment(false)}
                  disabled={buying}
                  style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    color: C.text,
                    padding: '12px 16px',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: buying ? 'not-allowed' : 'pointer',
                    transition: 'all .2s',
                    opacity: buying ? 0.5 : 1,
                  }}
                  onMouseEnter={e => !buying && (e.target.style.background = C.cardHi)}
                  onMouseLeave={e => (e.target.style.background = C.card)}
                >
                  Cancel
                </button>
                <button
                  onClick={() => (!selectedPayment || buying) ? null : (setShowPayment(false), setShowConfirm(true))}
                  disabled={!selectedPayment || buying}
                  style={{
                    background: !selectedPayment || buying ? C.muted : C.orange,
                    color: '#fff',
                    padding: '12px 16px',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    border: 'none',
                    cursor: !selectedPayment || buying ? 'not-allowed' : 'pointer',
                    transition: 'all .2s',
                    opacity: !selectedPayment || buying ? 0.5 : 1,
                  }}
                  onMouseEnter={e => selectedPayment && !buying && (e.target.style.background = '#E55A1F')}
                  onMouseLeave={e => selectedPayment && !buying && (e.target.style.background = C.orange)}
                >
                  Continue
                </button>
              </div>
            </ModalContent>
          </Modal>
        )}

        {/* Confirmation Modal */}
        {showConfirm && !success && (
          <Modal onClose={() => setShowConfirm(false)} disableClose={buying}>
            <ModalContent>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
                <h2 style={{ margin: 0, color: C.text, fontSize: 18, fontWeight: 800, fontFamily: 'Sora,sans-serif', marginBottom: 8 }}>
                  Confirm Purchase
                </h2>
                <p style={{ margin: 0, color: C.sub, fontSize: 13 }}>
                  You're about to activate {selected} plan
                </p>
              </div>

              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 12 }}>
                  <span style={{ color: C.sub }}>Plan</span>
                  <span style={{ color: C.text, fontWeight: 700 }}>{selected}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 12 }}>
                  <span style={{ color: C.sub }}>Weekly Premium</span>
                  <span style={{ color: C.orange, fontWeight: 700, fontSize: 16, fontFamily: 'Sora,sans-serif' }}>₹{preview.dynamic_premium ?? '—'}</span>
                </div>
                <Divider />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 12 }}>
                  <span style={{ color: C.sub }}>Billing</span>
                  <span style={{ color: C.teal }}>Weekly auto-renewal</span>
                </div>
              </div>

              <div style={{ background: `${C.yellow}10`, border: `1px solid ${C.yellow}30`, borderRadius: 10, padding: 12, marginBottom: 24, fontSize: 11, color: C.yellow }}>
                ⚠️ You can cancel your policy anytime without penalty
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button
                  onClick={() => !buying && setShowConfirm(false)}
                  disabled={buying}
                  style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    color: C.text,
                    padding: '12px 16px',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: buying ? 'not-allowed' : 'pointer',
                    transition: 'all .2s',
                    opacity: buying ? 0.5 : 1,
                  }}
                  onMouseEnter={e => !buying && (e.target.style.background = C.cardHi)}
                  onMouseLeave={e => (e.target.style.background = C.card)}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={buying}
                  style={{
                    background: buying ? C.muted : C.teal,
                    color: '#000',
                    padding: '12px 16px',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    border: 'none',
                    cursor: buying ? 'not-allowed' : 'pointer',
                    transition: 'all .2s',
                    opacity: buying ? 0.5 : 1,
                  }}
                  onMouseEnter={e => !buying && (e.target.style.background = '#00B894')}
                  onMouseLeave={e => !buying && (e.target.style.background = C.teal)}
                >
                  {buying ? 'Processing...' : 'Confirm Purchase'}
                </button>
              </div>
            </ModalContent>
          </Modal>
        )}

        {/* Processing Steps */}
        {buying && !success && (
          <Modal onClose={() => null}>
            <ModalContent style={{ textAlign: 'center' }}>
              <h2 style={{ margin: '0 0 24px 0', color: C.text, fontSize: 18, fontWeight: 800, fontFamily: 'Sora,sans-serif' }}>
                Processing Payment
              </h2>

              <div style={{ marginBottom: 32 }}>
                {PROCESSING_STEPS.map((step, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: 16,
                      opacity: idx < currentStep ? 1 : idx === currentStep ? 1 : 0.4,
                      transition: 'all .3s',
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: idx < currentStep ? C.teal : idx === currentStep ? `${C.blue}30` : C.card,
                        border: `2px solid ${idx < currentStep ? C.teal : idx === currentStep ? C.blue : C.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                        fontSize: 12,
                        fontWeight: 700,
                        color: idx < currentStep ? '#000' : C.text,
                      }}
                    >
                      {idx < currentStep ? '✓' : idx === currentStep ? <Spinner size={8} /> : idx + 1}
                    </div>
                    <span style={{ color: C.text, fontSize: 14, fontWeight: idx === currentStep ? 700 : 500 }}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 12, color: C.sub }}>
                This usually takes a few seconds...
              </div>
            </ModalContent>
          </Modal>
        )}

        {/* Success Screen */}
        {success && (
          <Modal onClose={() => null}>
            <ModalContent style={{ textAlign: 'center', animation: 'fadeInScale .4s ease' }}>
              <div style={{ fontSize: 64, marginBottom: 16, animation: 'bounce .6s ease' }}>
                🎉
              </div>
              
              <h1 style={{ margin: '0 0 8px 0', color: C.teal, fontSize: 24, fontWeight: 900, fontFamily: 'Sora,sans-serif' }}>
                Policy Activated!
              </h1>
              
              <p style={{ margin: '0 0 24px 0', color: C.sub, fontSize: 13 }}>
                Your {selected} plan is now active
              </p>

              <div style={{ background: `${C.teal}15`, border: `1px solid ${C.teal}40`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ color: C.sub, fontSize: 12 }}>Plan Type</span>
                  <span style={{ color: C.text, fontWeight: 700 }}>{selected}</span>
                </div>
                <Divider />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, marginBottom: 12 }}>
                  <span style={{ color: C.sub, fontSize: 12 }}>Weekly Premium</span>
                  <span style={{ color: C.orange, fontWeight: 900, fontSize: 18, fontFamily: 'Sora,sans-serif' }}>₹{active?.premium ?? preview.dynamic_premium ?? '—'}</span>
                </div>
                {active && (
                  <>
                    <Divider />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                      <span style={{ color: C.sub, fontSize: 12 }}>Expires</span>
                      <span style={{ color: C.teal, fontWeight: 700 }}>
                        {new Date(active.end_date).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setSuccess(false)}
                style={{
                  width: '100%',
                  background: C.teal,
                  color: '#000',
                  padding: '14px 16px',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all .2s',
                }}
                onMouseEnter={e => e.target.style.background = '#00B894'}
                onMouseLeave={e => e.target.style.background = C.teal}
              >
                Continue
              </button>
            </ModalContent>
          </Modal>
        )}

        <style>{`
          @keyframes fadeInScale {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes bounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    );
  }

  function Modal({ onClose, children, disableClose }) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          backdropFilter: 'blur(6px)',
          animation: 'fadeIn .2s ease',
        }}
        onClick={() => !disableClose && onClose()}
      >
        <div onClick={e => e.stopPropagation()}>
          {children}
        </div>
      </div>
    );
  }

  function ModalContent({ children, style }) {
    return (
      <div
        style={{
          background: C.surf,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: 24,
          maxWidth: window.innerWidth < 768 ? '90%' : 520,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
          animation: 'slideUp .3s ease',
          ...style,
        }}
      >
        {children}
      </div>
    );
  }