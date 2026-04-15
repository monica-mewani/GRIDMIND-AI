import { useEffect, useRef, useState } from 'react';
import { batteryData } from '../data/kaggleData';

export default function BatteryStatus() {
  const getTarget = () => {
    const h   = new Date().getHours();
    const row = batteryData[h];
    const pct = Math.min(100, Math.max(0, row.avg_battery_pct + (Math.random() - 0.5) * 2));
    return { pct: +pct.toFixed(1), status: row.status, rate: +row.avg_input_output.toFixed(2), h };
  };

  const [live, setLive]     = useState(getTarget);
  const [animated, setAnim] = useState(0);
  const raf   = useRef(null);
  const start = useRef(null);
  const from  = useRef(0);

  const animateTo = (fromVal, toVal) => {
    cancelAnimationFrame(raf.current);
    start.current = null;
    const duration = 1200;
    const anim = (ts) => {
      if (!start.current) start.current = ts;
      const p    = Math.min((ts - start.current) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setAnim(fromVal + (toVal - fromVal) * ease);
      if (p < 1) raf.current = requestAnimationFrame(anim);
    };
    raf.current = requestAnimationFrame(anim);
  };

  useEffect(() => {
    animateTo(0, live.pct);
    from.current = live.pct;
    const id = setInterval(() => {
      const t = getTarget();
      animateTo(from.current, t.pct);
      from.current = t.pct;
      setLive(t);
    }, 3000);
    return () => { clearInterval(id); cancelAnimationFrame(raf.current); };
  }, []);

  const CHARGE    = animated;
  const color     = CHARGE > 60 ? '#00FF88' : CHARGE > 30 ? '#FFD60A' : '#FF2D55';
  const segments  = 10;
  const filled    = Math.floor((CHARGE / 100) * segments);
  const partial   = ((CHARGE / 100) * segments) % 1;
  const charging  = live.status === 'Charging';
  const stored    = ((live.pct / 100) * 20).toFixed(1);
  const hoursLeft = charging
    ? `~${((20 - live.pct / 100 * 20) / Math.abs(live.rate || 1)).toFixed(1)} hrs full`
    : `~${(live.pct / 100 * 20 / Math.abs(live.rate || 1)).toFixed(1)} hrs left`;

  return (
    <div className="glass-card panel-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF6B35', boxShadow: '0 0 6px #FF6B35' }} />
        <span style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          Battery Status
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: 10, fontFamily: 'var(--font-mono)',
          color: charging ? '#00FF88' : '#FF6B35',
          background: charging ? 'rgba(0,255,136,0.1)' : 'rgba(255,107,53,0.1)',
          border: `1px solid ${charging ? 'rgba(0,255,136,0.25)' : 'rgba(255,107,53,0.25)'}`,
          borderRadius: 99, padding: '2px 8px'
        }}>
          {charging ? `+${Math.abs(live.rate)} kW ↑ Charging` : `−${Math.abs(live.rate)} kW ↓ Discharging`}
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>
        48V Lithium Bank · 20 kWh · Kaggle verified
      </div>

      {/* Battery visual */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          position: 'relative', width: '100%', height: 48, borderRadius: 8,
          background: 'rgba(255,255,255,0.04)',
          border: `1.5px solid ${color}55`, overflow: 'hidden',
          boxShadow: `0 0 12px ${color}22`
        }}>
          <div style={{ display: 'flex', height: '100%', padding: 4, gap: 3 }}>
            {Array.from({ length: segments }, (_, i) => {
              const isFilled  = i < filled;
              const isPartial = i === filled;
              return (
                <div key={i} style={{
                  flex: 1, borderRadius: 4, overflow: 'hidden',
                  background: isFilled ? `linear-gradient(180deg, ${color}dd, ${color}88)` : 'rgba(255,255,255,0.04)',
                  boxShadow: isFilled ? `0 0 6px ${color}66` : 'none',
                  transition: 'all 0.15s'
                }}>
                  {isPartial && (
                    <div style={{
                      width: `${partial * 100}%`, height: '100%',
                      background: `linear-gradient(180deg, ${color}dd, ${color}88)`,
                      boxShadow: `0 0 6px ${color}66`,
                    }} />
                  )}
                </div>
              );
            })}
          </div>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, color,
            textShadow: `0 0 12px ${color}`,
          }}>
            {Math.round(CHARGE)}%
          </div>
        </div>
        <div style={{ width: 8, height: 20, borderRadius: '0 4px 4px 0', background: `${color}66`, flexShrink: 0 }} />
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Stored',       value: `${stored} kWh`,           color: '#00FF88' },
          { label: 'Capacity',     value: '20 kWh',                   color: '#0EA5E9' },
          { label: 'Rate',         value: `${charging ? '+' : '−'}${Math.abs(live.rate)} kW`, color: '#FFD60A' },
          { label: 'Est. Time',    value: hoursLeft,                  color: '#FF6B35' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,0.03)', borderRadius: 8,
            padding: '8px 10px', border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.color, fontFamily: 'var(--font-head)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{
        fontSize: 10, fontFamily: 'var(--font-mono)', padding: '6px 10px',
        borderRadius: 6, background: 'rgba(255,45,85,0.06)', border: '1px solid rgba(255,45,85,0.15)',
        color: 'rgba(255,45,85,0.8)', textAlign: 'center'
      }}>
        🏥 Somathne PHC backup: <strong style={{ color: '#FF2D55' }}>
          ~{(stored / 0.4).toFixed(0)} hrs
        </strong> at current draw
      </div>
    </div>
  );
}
