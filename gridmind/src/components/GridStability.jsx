import { useEffect, useRef, useState } from 'react';

const VALUE = 78;
const MAX = 100;

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
  const [animated, setAnimated] = useState(0);
  const raf = useRef(null);
  const start = useRef(null);

  useEffect(() => {
    const duration = 1400;
    const target = VALUE;
    const animate = (ts) => {
      if (!start.current) start.current = ts;
      const p = Math.min((ts - start.current) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setAnimated(ease * target);
      if (p < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const cx = 100, cy = 100, r = 72;
  const startAngle = -135, totalArc = 270;
  const endAngle = startAngle + (animated / MAX) * totalArc;

  // Zone colors
  const pct = animated / MAX;
  const color = pct > 0.7 ? '#00FF88' : pct > 0.4 ? '#FFD60A' : '#FF2D55';

  return (
    <div className="glass-card panel-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFD60A', boxShadow: '0 0 6px #FFD60A' }} />
        <span style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          Grid Stability
        </span>
      </div>
      <div style={{ width: '100%', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
        MSEDCL Zone · Raigad Sub-division
      </div>

      {/* SVG Gauge */}
      <svg width={200} height={130} viewBox="0 0 200 130">
        {/* Ticks */}
        {Array.from({ length: 11 }, (_, i) => {
          const a = startAngle + (i / 10) * totalArc;
          const inner = polarToXY(cx, cy, 58, a);
          const outer = polarToXY(cx, cy, 64, a);
          return (
            <line key={i} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
              stroke="rgba(240,255,248,0.15)" strokeWidth={1} />
          );
        })}
        {/* Track */}
        <path d={arcPath(cx, cy, r, startAngle, startAngle + totalArc)}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={12} strokeLinecap="round" />
        {/* Colored zones */}
        <path d={arcPath(cx, cy, r, startAngle, startAngle + totalArc * 0.4)}
          fill="none" stroke="rgba(255,45,85,0.25)" strokeWidth={12} strokeLinecap="round" />
        <path d={arcPath(cx, cy, r, startAngle + totalArc * 0.4, startAngle + totalArc * 0.7)}
          fill="none" stroke="rgba(255,214,10,0.25)" strokeWidth={12} strokeLinecap="round" />
        <path d={arcPath(cx, cy, r, startAngle + totalArc * 0.7, startAngle + totalArc)}
          fill="none" stroke="rgba(0,255,136,0.25)" strokeWidth={12} strokeLinecap="round" />
        {/* Value arc */}
        <path d={arcPath(cx, cy, r, startAngle, endAngle)}
          fill="none" stroke={color} strokeWidth={12} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}88)` }} />
        {/* Center text */}
        <text x={cx} y={cy - 8} textAnchor="middle"
          fill={color} fontSize={28} fontWeight={700} fontFamily="Space Grotesk, sans-serif">
          {Math.round(animated)}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle"
          fill="rgba(240,255,248,0.5)" fontSize={10} fontFamily="JetBrains Mono, monospace">
          / 100
        </text>
        <text x={cx} y={cy + 24} textAnchor="middle"
          fill={color} fontSize={11} fontWeight={600} fontFamily="Space Grotesk, sans-serif">
          STABLE
        </text>
        {/* Labels */}
        <text x={30} y={118} textAnchor="middle" fill="rgba(255,45,85,0.5)" fontSize={8} fontFamily="JetBrains Mono">CRIT</text>
        <text x={cx} y={29} textAnchor="middle" fill="rgba(0,255,136,0.5)" fontSize={8} fontFamily="JetBrains Mono">PEAK</text>
        <text x={170} y={118} textAnchor="middle" fill="rgba(0,255,136,0.5)" fontSize={8} fontFamily="JetBrains Mono">MAX</text>
      </svg>

      {/* Notes */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        <div style={{
          fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
          background: 'rgba(0,255,136,0.05)', borderRadius: 6, padding: '5px 10px',
          border: '1px solid rgba(0,255,136,0.1)', textAlign: 'center'
        }}>
          ✅ Last outage: <span style={{ color: '#00FF88' }}>12 days ago</span> (load shedding avoided)
        </div>
        <div style={{
          fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
          background: 'rgba(14,165,233,0.05)', borderRadius: 6, padding: '5px 10px',
          border: '1px solid rgba(14,165,233,0.12)', textAlign: 'center'
        }}>
          ⚡ <span style={{ color: '#0EA5E9' }}>MSEDCL</span> Grid backup: Standby
        </div>
      </div>
    </div>
  );
}
