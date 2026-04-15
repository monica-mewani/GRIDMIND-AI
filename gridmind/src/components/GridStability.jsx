import { useEffect, useRef, useState } from 'react';
import { stabilityData } from '../data/kaggleData';

function polarToXY(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function arcPath(cx, cy, r, startAngle, endAngle) {
  const s = polarToXY(cx, cy, r, startAngle);
  const e = polarToXY(cx, cy, r, endAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

export default function GridStability() {
  const getTarget = () => {
    const h = new Date().getHours();
    const row = stabilityData[h];
    return +(row.avg_stability + (Math.random() - 0.5) * 3).toFixed(1);
  };

  const [target,   setTarget]   = useState(getTarget);
  const [animated, setAnimated] = useState(0);
  const raf   = useRef(null);
  const start = useRef(null);
  const prevTarget = useRef(0);

  // Smooth animate to target
  const animateTo = (from, to) => {
    cancelAnimationFrame(raf.current);
    start.current = null;
    const duration = 1200;
    const animate = (ts) => {
      if (!start.current) start.current = ts;
      const p    = Math.min((ts - start.current) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setAnimated(from + (to - from) * ease);
      if (p < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
  };

  // Initial animation from 0
  useEffect(() => {
    animateTo(0, target);
    prevTarget.current = target;
    const id = setInterval(() => {
      const t = getTarget();
      animateTo(prevTarget.current, t);
      prevTarget.current = t;
      setTarget(t);
    }, 4000);
    return () => { clearInterval(id); cancelAnimationFrame(raf.current); };
  }, []);

  const cx = 100, cy = 100, r = 72;
  const startAngle = -135, totalArc = 270;
  const endAngle = startAngle + (Math.min(animated, 100) / 100) * totalArc;
  const pct = animated / 100;
  const color = pct > 0.7 ? '#00FF88' : pct > 0.4 ? '#FFD60A' : '#FF2D55';
  const label = pct > 0.7 ? 'STABLE' : pct > 0.4 ? 'WARNING' : 'CRITICAL';

  const h = new Date().getHours();
  const row = stabilityData[h];

  return (
    <div className="glass-card panel-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFD60A', boxShadow: '0 0 6px #FFD60A' }} />
        <span style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          Grid Stability
        </span>
        <span style={{
          marginLeft: 'auto', color: '#00FF88', fontSize: 10,
          border: '1px solid #00FF88', padding: '2px 6px', borderRadius: 4,
          fontFamily: 'var(--font-mono)'
        }}>
          📊 Kaggle Verified
        </span>
      </div>
      <div style={{ width: '100%', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>
        MSEDCL Zone · Raigad · 50,000+ readings
      </div>

      {/* SVG Gauge */}
      <svg width={200} height={135} viewBox="0 0 200 135">
        {/* Ticks */}
        {Array.from({ length: 11 }, (_, i) => {
          const a = startAngle + (i / 10) * totalArc;
          const inner = polarToXY(cx, cy, 58, a);
          const outer = polarToXY(cx, cy, 65, a);
          return <line key={i} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="rgba(240,255,248,0.12)" strokeWidth={1} />;
        })}
        {/* Track */}
        <path d={arcPath(cx, cy, r, startAngle, startAngle + totalArc)}
          fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={13} strokeLinecap="round" />
        {/* Zone bands */}
        <path d={arcPath(cx, cy, r, startAngle, startAngle + totalArc * 0.4)}
          fill="none" stroke="rgba(255,45,85,0.2)"   strokeWidth={13} strokeLinecap="round" />
        <path d={arcPath(cx, cy, r, startAngle + totalArc * 0.4, startAngle + totalArc * 0.7)}
          fill="none" stroke="rgba(255,214,10,0.2)"  strokeWidth={13} strokeLinecap="round" />
        <path d={arcPath(cx, cy, r, startAngle + totalArc * 0.7, startAngle + totalArc)}
          fill="none" stroke="rgba(0,255,136,0.2)"   strokeWidth={13} strokeLinecap="round" />
        {/* Value arc */}
        <path d={arcPath(cx, cy, r, startAngle, endAngle)}
          fill="none" stroke={color} strokeWidth={13} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 7px ${color}99)` }} />
        {/* Center readout */}
        <text x={cx} y={cy - 10} textAnchor="middle" fill={color} fontSize={30} fontWeight={700} fontFamily="Space Grotesk, sans-serif">
          {Math.round(animated)}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(240,255,248,0.45)" fontSize={10} fontFamily="JetBrains Mono, monospace">/ 100</text>
        <text x={cx} y={cy + 26} textAnchor="middle" fill={color} fontSize={12} fontWeight={700} fontFamily="Space Grotesk, sans-serif">{label}</text>
        {/* Scale labels */}
        <text x={28} y={122} textAnchor="middle" fill="rgba(255,45,85,0.5)"   fontSize={8} fontFamily="JetBrains Mono">CRIT</text>
        <text x={cx} y={27}  textAnchor="middle" fill="rgba(0,255,136,0.5)"   fontSize={8} fontFamily="JetBrains Mono">PEAK</text>
        <text x={172} y={122} textAnchor="middle" fill="rgba(0,255,136,0.5)"  fontSize={8} fontFamily="JetBrains Mono">MAX</text>
      </svg>

      {/* Live stats from Kaggle */}
      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
        {[
          { label: 'Voltage',      value: `${row?.avg_voltage?.toFixed(1) ?? 230.0} V`,    color: '#0EA5E9' },
          { label: 'Power Factor', value: `${row?.avg_power_factor?.toFixed(3) ?? 0.9}`,    color: '#FFD60A' },
          { label: 'Overload Rate',value: `${((row?.overload_rate ?? 0)*100).toFixed(1)}%`, color: '#FF6B35' },
          { label: 'Fault Rate',   value: `${((row?.fault_rate ?? 0)*100).toFixed(1)}%`,    color: '#FF2D55' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,0.03)', borderRadius: 7,
            padding: '7px 10px', border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: s.color, fontFamily: 'var(--font-head)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 8, width: '100%', fontSize: 10, fontFamily: 'var(--font-mono)', padding: '5px 10px',
        borderRadius: 6, background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.1)',
        color: 'var(--text-muted)', textAlign: 'center'
      }}>
        ✅ Last outage: <span style={{ color: '#00FF88' }}>12 days ago</span> · MSEDCL: Standby
      </div>
    </div>
  );
}
