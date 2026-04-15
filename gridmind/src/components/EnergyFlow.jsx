import { useEffect, useRef, useState } from 'react';

const nodes = {
  solar: { id: 'solar', x: 100, y: 130, label: '☀️ Solar Farm', sub: 'Bhatan', accent: '#FFD60A' },
  hub:   { id: 'hub',   x: 320, y: 130, label: '⚡ GRIDMIND',   sub: 'Panvel Hub', accent: '#00FF88' },
  bhatan:   { id: 'bhatan',   x: 540, y: 50,  label: '🏘️ Bhatan',   sub: '680 homes',      accent: '#00FF88', kw: '3.8 kW' },
  somathne: { id: 'somathne', x: 540, y: 115, label: '🏫 Somathne', sub: 'School+Clinic',  accent: '#FF2D55', kw: '1.2 kW', priority: true },
  palaspe:  { id: 'palaspe',  x: 540, y: 180, label: '🌾 Palaspe',  sub: 'Farm Pumps',     accent: '#FF6B35', kw: '2.4 kW' },
  kalamboli:{ id: 'kalamboli',x: 540, y: 245, label: '🏪 Kalamboli',sub: 'Market',         accent: '#0EA5E9', kw: '2.1 kW' },
};

const edges = [
  { from: 'solar', to: 'hub',       color: '#FFD60A' },
  { from: 'hub',   to: 'bhatan',    color: '#00FF88' },
  { from: 'hub',   to: 'somathne',  color: '#FF2D55' },
  { from: 'hub',   to: 'palaspe',   color: '#FF6B35' },
  { from: 'hub',   to: 'kalamboli', color: '#0EA5E9' },
];

function getCenter(node) {
  return { x: node.x + 76, y: node.y + 28 };
}

function EnergyDot({ from, to, color, delay = 0 }) {
  const [t, setT] = useState(delay);
  const raf = useRef(null);
  const start = useRef(null);

  useEffect(() => {
    const duration = 1800;
    const animate = (ts) => {
      if (!start.current) start.current = ts - delay * duration;
      const elapsed = (ts - start.current) % duration;
      setT(elapsed / duration);
      raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [delay]);

  const a = getCenter(nodes[from]);
  const b = getCenter(nodes[to]);
  const x = a.x + (b.x - a.x) * t;
  const y = a.y + (b.y - a.y) * t;

  return (
    <circle cx={x} cy={y} r={4} fill={color}
      style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
  );
}

export default function EnergyFlow() {
  const svgW = 700, svgH = 300;

  return (
    <div className="glass-card" style={{ padding: '20px 24px', gridColumn: '1 / -1', position: 'relative', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00FF88', boxShadow: '0 0 6px #00FF88' }} />
        <span style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          Energy Flow — Live
        </span>
        <span style={{
          marginLeft: 8, fontSize: 10, fontFamily: 'var(--font-mono)', padding: '2px 8px',
          borderRadius: 99, background: 'rgba(0,255,136,0.1)', color: '#00FF88',
          border: '1px solid rgba(0,255,136,0.2)', letterSpacing: '0.06em'
        }}>LIVE</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
        Real-time power distribution · Raigad District, Maharashtra
      </div>

      <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ overflow: 'visible' }}>
        <defs>
          {edges.map(e => (
            <marker key={e.from + e.to} id={`arrow-${e.from}-${e.to}`}
              markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill={e.color} opacity="0.6" />
            </marker>
          ))}
        </defs>

        {/* Edges — dashed animated lines */}
        {edges.map((e, i) => {
          const a = getCenter(nodes[e.from]);
          const b = getCenter(nodes[e.to]);
          return (
            <g key={i}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={e.color} strokeWidth={1.5} strokeOpacity={0.25}
                strokeDasharray="6 5"
                markerEnd={`url(#arrow-${e.from}-${e.to})`} />
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={e.color} strokeWidth={1} strokeOpacity={0.12} />
            </g>
          );
        })}

        {/* Moving energy dots — 2 per edge at offsets */}
        {edges.map((e, i) => (
          [0, 0.5].map((offset, j) => (
            <EnergyDot key={`${i}-${j}`} from={e.from} to={e.to} color={e.color} delay={offset} />
          ))
        ))}

        {/* Nodes */}
        {Object.values(nodes).map(n => {
          const isPriority = n.priority;
          const isHub = n.id === 'hub';
          const isSolar = n.id === 'solar';
          return (
            <g key={n.id} transform={`translate(${n.x},${n.y})`}>
              {/* Glow bg for priority/hub */}
              {(isPriority || isHub) && (
                <rect x={-4} y={-4} width={164} height={68} rx={14}
                  fill={n.accent} fillOpacity={isPriority ? 0.07 : 0.04}
                  style={isPriority ? { filter: 'blur(6px)' } : {}} />
              )}
              {/* Card */}
              <rect width={152} height={60} rx={10}
                fill={`${n.accent}12`}
                stroke={n.accent}
                strokeWidth={isPriority ? 1.5 : 1}
                strokeOpacity={isPriority ? 0.9 : 0.4}
                style={isPriority ? { filter: `drop-shadow(0 0 8px ${n.accent}99)` } : {}} />

              {/* Label */}
              <text x={76} y={21} textAnchor="middle"
                fill={n.accent} fontSize={12} fontWeight={700}
                fontFamily="Space Grotesk, sans-serif">
                {n.label}
              </text>
              <text x={76} y={37} textAnchor="middle"
                fill="rgba(240,255,248,0.55)" fontSize={10}
                fontFamily="JetBrains Mono, monospace">
                {n.sub}
              </text>

              {/* kW badge */}
              {n.kw && (
                <g>
                  <rect x={28} y={42} width={96} height={13} rx={6}
                    fill={`${n.accent}22`} stroke={`${n.accent}55`} strokeWidth={0.5} />
                  <text x={76} y={52} textAnchor="middle"
                    fill={n.accent} fontSize={9} fontFamily="JetBrains Mono, monospace" fontWeight={600}>
                    {n.kw}{isPriority ? ' · PRIORITY' : ''}
                  </text>
                </g>
              )}

              {/* Solar extra info */}
              {isSolar && (
                <g>
                  <rect x={2} y={42} width={148} height={13} rx={6}
                    fill="rgba(255,214,10,0.12)" stroke="rgba(255,214,10,0.4)" strokeWidth={0.5} />
                  <text x={76} y={52} textAnchor="middle"
                    fill="#FFD60A" fontSize={9} fontFamily="JetBrains Mono, monospace">
                    12 panels • 10 kW capacity
                  </text>
                </g>
              )}

              {/* Priority pulse ring */}
              {isPriority && (
                <circle cx={76} cy={30} r={40} fill="none"
                  stroke="#FF2D55" strokeWidth={1} strokeOpacity={0.3}
                  style={{ transformOrigin: '76px 30px', animation: 'priority-ring 2s ease-out infinite' }} />
              )}
            </g>
          );
        })}
      </svg>

      {/* Bottom location note */}
      <div style={{
        textAlign: 'center', fontSize: 10, color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)', marginTop: 4, letterSpacing: '0.04em'
      }}>
        Solar farm located at: <span style={{ color: 'rgba(255,214,10,0.7)' }}>Bhatan Village, Raigad District, Maharashtra 410207</span>
      </div>

      <style>{`
        @keyframes priority-ring {
          0%   { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2);  opacity: 0; }
        }
      `}</style>
    </div>
  );
}
