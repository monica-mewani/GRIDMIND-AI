import { useEffect, useRef, useState } from 'react';

const CHARGE = 67;

export default function BatteryStatus() {
  const [animated, setAnimated] = useState(0);
  const raf = useRef(null);
  const start = useRef(null);

  useEffect(() => {
    const duration = 1200;
    const animate = (ts) => {
      if (!start.current) start.current = ts;
      const p = Math.min((ts - start.current) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setAnimated(ease * CHARGE);
      if (p < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const color = CHARGE > 60 ? '#00FF88' : CHARGE > 30 ? '#FFD60A' : '#FF2D55';

  // Battery segments (10 segments)
  const segments = 10;
  const filledCount = Math.floor((animated / 100) * segments);
  const partialFill = ((animated / 100) * segments) % 1;

  return (
    <div className="glass-card panel-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF6B35', boxShadow: '0 0 6px #FF6B35' }} />
        <span style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          Battery Status
        </span>
        <span style={{
          marginLeft: 'auto', fontSize: 10, fontFamily: 'var(--font-mono)',
          color: '#00FF88', background: 'rgba(0,255,136,0.1)',
          border: '1px solid rgba(0,255,136,0.2)', borderRadius: 99, padding: '2px 8px'
        }}>
          +2.1 kW ↑ Charging
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>
        48V Lithium Battery Bank • 20 kWh capacity
      </div>

      {/* Battery visual */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        {/* Battery body */}
        <div style={{
          position: 'relative', width: '100%',
          height: 48, borderRadius: 8,
          background: 'rgba(255,255,255,0.04)',
          border: `1.5px solid ${color}55`,
          overflow: 'hidden',
          boxShadow: `0 0 12px ${color}22`
        }}>
          {/* Segments */}
          <div style={{ display: 'flex', height: '100%', padding: 4, gap: 3 }}>
            {Array.from({ length: segments }, (_, i) => {
              const filled = i < filledCount;
              const partial = i === filledCount;
              return (
                <div key={i} style={{
                  flex: 1, borderRadius: 4, overflow: 'hidden',
                  background: filled
                    ? `linear-gradient(180deg, ${color}dd, ${color}88)`
                    : 'rgba(255,255,255,0.04)',
                  boxShadow: filled ? `0 0 6px ${color}66` : 'none',
                  transition: 'all 0.1s'
                }}>
                  {partial && (
                    <div style={{
                      width: `${partialFill * 100}%`, height: '100%',
                      background: `linear-gradient(180deg, ${color}dd, ${color}88)`,
                      boxShadow: `0 0 6px ${color}66`,
                    }} />
                  )}
                </div>
              );
            })}
          </div>
          {/* Percentage overlay */}
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, color,
            textShadow: `0 0 12px ${color}`,
          }}>
            {Math.round(animated)}%
          </div>
        </div>
        {/* Battery tip */}
        <div style={{
          width: 8, height: 20, borderRadius: '0 4px 4px 0',
          background: `${color}66`, flexShrink: 0
        }} />
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Stored', value: `${((CHARGE / 100) * 20).toFixed(1)} kWh`, color: '#00FF88' },
          { label: 'Capacity', value: '20 kWh', color: '#0EA5E9' },
          { label: 'Charge Rate', value: '+2.1 kW', color: '#FFD60A' },
          { label: 'Est. Full', value: '~3.2 hrs', color: '#FF6B35' },
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

      {/* PHC note */}
      <div style={{
        fontSize: 10, fontFamily: 'var(--font-mono)', padding: '6px 10px',
        borderRadius: 6, background: 'rgba(255,45,85,0.06)', border: '1px solid rgba(255,45,85,0.15)',
        color: 'rgba(255,45,85,0.8)', textAlign: 'center'
      }}>
        🏥 Sufficient for Somathne PHC (Primary Health Centre) for <strong style={{ color: '#FF2D55' }}>8 hours</strong>
      </div>
    </div>
  );
}
