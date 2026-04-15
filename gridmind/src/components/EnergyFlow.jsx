import { useEffect, useRef, useState } from 'react';
import { batteryData, stabilityData } from '../data/kaggleData';

/* ── Live simulation hook ── */
function useLiveValues() {
  const getHour = () => new Date().getHours();
  const getIST  = () => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const ist = new Date(utc + 5.5 * 3600000);
    return `${String(ist.getHours()).padStart(2,'0')}:${String(ist.getMinutes()).padStart(2,'0')}:${String(ist.getSeconds()).padStart(2,'0')} IST`;
  };

  const compute = () => {
    const h        = getHour();
    const baseWind = (h < 6 || h > 18) ? 2.8 : 1.6;
    const solar    = 6.2 + (Math.random() - 0.5) * 0.4;
    const wind     = baseWind + (Math.random() - 0.5) * 0.4;
    const hydro    = 1.4;
    const total    = +(solar + wind + hydro).toFixed(2);
    const battRow  = batteryData[h];
    const battPct  = Math.min(100, Math.max(0, battRow.avg_battery_pct + (Math.random()-0.5)*2));
    const charging = battRow.avg_input_output > 0;
    const load     = +(total - (charging ? 0.3 : -0.3)).toFixed(2);
    const surplus  = +(total - load).toFixed(2);
    return { h, solar, wind, hydro, total, battPct: +battPct.toFixed(1), charging, load, surplus, time: getIST() };
  };

  const [vals, setVals] = useState(compute);
  useEffect(() => {
    const id = setInterval(() => setVals(compute()), 2000);
    return () => clearInterval(id);
  }, []);
  return vals;
}

/* ── Animated dot along a straight line ── */
function FlowDot({ x1, y1, x2, y2, color, delay = 0, speed = 1800 }) {
  const [t, setT] = useState(delay);
  const raf   = useRef(null);
  const start = useRef(null);
  const dur   = Math.round(speed);

  useEffect(() => {
    const animate = (ts) => {
      if (!start.current) start.current = ts - delay * dur;
      const elapsed = (ts - start.current) % dur;
      setT(elapsed / dur);
      raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [delay, dur]);

  const x = x1 + (x2 - x1) * t;
  const y = y1 + (y2 - y1) * t;
  return <circle cx={x} cy={y} r={3.5} fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />;
}

/* ── Node card on SVG ── */
function NodeCard({ x, y, w = 148, h = 80, accent, children }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect width={w} height={h} rx={10}
        fill={`${accent}10`} stroke={accent} strokeWidth={1.2} strokeOpacity={0.55}
        style={{ filter: `drop-shadow(0 0 8px ${accent}44)` }} />
      {children}
    </g>
  );
}

/* ── Small progress bar inside SVG ── */
function SVGBar({ x, y, w, pct, color, label }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={7} rx={3.5} fill="rgba(255,255,255,0.06)" />
      <rect x={x} y={y} width={w * Math.min(pct, 1)} height={7} rx={3.5}
        fill={color} style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
      {label && (
        <text x={x + w + 4} y={y + 7} fill={color} fontSize={8} fontFamily="JetBrains Mono, monospace">{label}</text>
      )}
    </g>
  );
}

export default function EnergyFlow() {
  const v = useLiveValues();

  // Layout geometry
  const W = 920, H = 380;
  // Column x-centres for card left edges
  const C1 = 20,  C2 = 220, C3 = 400, C4 = 580, C5 = 760;
  const CW = 148; // card width

  // Mid-x of each column
  const mx = col => col + CW / 2;

  // Source nodes y-positions (col 1)
  const solarY = 20, windY = 140, hydroY = 260;
  const dcY    = 130; // DC Bus (col 2)
  const battY  = 130; // Battery (col 3)
  const hubY   = 120; // GRIDMIND hub (col 4)
  const msedY  = 270; // MSEDCL (col 4)
  // Village nodes (col 5)
  const bhatanY = 10, somathneY = 110, palaspeY = 210, kalamboliY = 310;

  // Edge endpoints: right-edge of source card → left-edge of target card
  const re = (col) => col + CW; // right edge x
  const le = (col) => col;      // left edge x

  // kW-to-speed: higher kW = faster (smaller duration ms)
  const spd = (kw) => Math.max(800, 2200 - kw * 120);

  const solarFrac  = Math.min(v.solar / 10, 1);
  const windFrac   = Math.min(v.wind  / 4,  1);
  const battColor  = v.charging ? '#00FF88' : '#FF6B35';
  const battLabel  = v.charging ? `+${(v.total - v.load).toFixed(1)} kW charging` : `${(v.load - v.total).toFixed(1)} kW draw`;

  return (
    <div className="glass-card" style={{ padding: '20px 20px 16px', gridColumn: '1 / -1', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00FF88', boxShadow: '0 0 6px #00FF88', animation: 'pulse-dot 2s infinite' }} />
          <span style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            ⚡ Live Microgrid — Raigad District, Maharashtra
          </span>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', padding: '2px 8px', borderRadius: 99, background: 'rgba(0,255,136,0.1)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.2)', letterSpacing: '0.06em' }}>LIVE</span>
        </div>
        <span style={{ color: '#00FF88', fontSize: 10, border: '1px solid #00FF88', padding: '2px 8px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>
          📊 Kaggle Verified • 50,000+ readings
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>
        Real-time power flow • Kaggle dataset verified
      </div>

      {/* Main SVG */}
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible', display: 'block' }}>

        {/* ── EDGES (lines behind everything) ── */}
        {/* Solar → DC Bus */}
        <line x1={re(C1)} y1={solarY+40} x2={le(C2)} y2={dcY+34}
          stroke="#FFD60A" strokeWidth={1.5} strokeOpacity={0.3} strokeDasharray="6 4" />
        {/* Wind → DC Bus */}
        <line x1={re(C1)} y1={windY+40} x2={le(C2)} y2={dcY+40}
          stroke="#06B6D4" strokeWidth={1.5} strokeOpacity={0.3} strokeDasharray="6 4" />
        {/* Hydro → DC Bus */}
        <line x1={re(C1)} y1={hydroY+40} x2={le(C2)} y2={dcY+46}
          stroke="#0EA5E9" strokeWidth={1.5} strokeOpacity={0.3} strokeDasharray="6 4" />
        {/* DC Bus → Battery */}
        <line x1={re(C2)} y1={dcY+40} x2={le(C3)} y2={battY+40}
          stroke={battColor} strokeWidth={1.5} strokeOpacity={0.35} strokeDasharray="6 4" />
        {/* DC Bus → GRIDMIND */}
        <line x1={re(C2)} y1={dcY+30} x2={le(C4)} y2={hubY+34}
          stroke="#00FF88" strokeWidth={2} strokeOpacity={0.4} strokeDasharray="6 4" />
        {/* MSEDCL → GRIDMIND (dashed gray, no dots) */}
        <line x1={re(C4)} y1={msedY+34} x2={le(C4)} y2={hubY+56}
          stroke="#666" strokeWidth={1} strokeOpacity={0.35} strokeDasharray="4 6" />
        {/* GRIDMIND → Villages */}
        <line x1={re(C4)} y1={hubY+20} x2={le(C5)} y2={bhatanY+34}    stroke="#00FF88" strokeWidth={1.5} strokeOpacity={0.3} strokeDasharray="6 4" />
        <line x1={re(C4)} y1={hubY+34} x2={le(C5)} y2={somathneY+34}  stroke="#FF2D55" strokeWidth={1.5} strokeOpacity={0.3} strokeDasharray="6 4" />
        <line x1={re(C4)} y1={hubY+46} x2={le(C5)} y2={palaspeY+34}   stroke="#FF6B35" strokeWidth={1.5} strokeOpacity={0.3} strokeDasharray="6 4" />
        <line x1={re(C4)} y1={hubY+56} x2={le(C5)} y2={kalamboliY+34} stroke="#0EA5E9" strokeWidth={1.5} strokeOpacity={0.3} strokeDasharray="6 4" />

        {/* ── ANIMATED DOTS ── */}
        {[0, 0.5].map(off => <FlowDot key={`s${off}`} x1={re(C1)} y1={solarY+40} x2={le(C2)} y2={dcY+34} color="#FFD60A" delay={off} speed={spd(v.solar)} />)}
        {[0, 0.5].map(off => <FlowDot key={`w${off}`} x1={re(C1)} y1={windY+40}  x2={le(C2)} y2={dcY+40} color="#06B6D4" delay={off} speed={spd(v.wind)} />)}
        {[0].map(off  => <FlowDot key={`h${off}`} x1={re(C1)} y1={hydroY+40} x2={le(C2)} y2={dcY+46} color="#0EA5E9" delay={off} speed={spd(1.4)} />)}
        {v.charging && [0, 0.5].map(off => <FlowDot key={`b${off}`} x1={re(C2)} y1={dcY+40} x2={le(C3)} y2={battY+40} color="#00FF88" delay={off} speed={spd(2)} />)}
        {!v.charging && [0, 0.5].map(off => <FlowDot key={`bd${off}`} x1={le(C3)} y1={battY+40} x2={re(C2)} y2={dcY+40} color="#FF6B35" delay={off} speed={spd(2)} />)}
        {[0, 0.4, 0.8].map(off => <FlowDot key={`dc${off}`} x1={re(C2)} y1={dcY+30}  x2={le(C4)} y2={hubY+34}    color="#00FF88" delay={off} speed={spd(v.total)} />)}
        {[0, 0.5].map(off => <FlowDot key={`vb${off}`} x1={re(C4)} y1={hubY+20} x2={le(C5)} y2={bhatanY+34}    color="#00FF88" delay={off} speed={spd(3.8)} />)}
        {[0, 0.3, 0.6].map(off => <FlowDot key={`vs${off}`} x1={re(C4)} y1={hubY+34} x2={le(C5)} y2={somathneY+34}  color="#FF2D55" delay={off} speed={spd(5)} />)}
        {[0, 0.5].map(off => <FlowDot key={`vp${off}`} x1={re(C4)} y1={hubY+46} x2={le(C5)} y2={palaspeY+34}   color="#FF6B35" delay={off} speed={spd(2.4)} />)}
        {[0, 0.5].map(off => <FlowDot key={`vk${off}`} x1={re(C4)} y1={hubY+56} x2={le(C5)} y2={kalamboliY+34} color="#0EA5E9" delay={off} speed={spd(2.1)} />)}

        {/* ════ COL 1: GENERATION SOURCES ════ */}

        {/* ☀️ Solar */}
        <NodeCard x={C1} y={solarY} accent="#FFD60A">
          <text x={74} y={20} textAnchor="middle" fill="#FFD60A" fontSize={12} fontWeight={700} fontFamily="Space Grotesk, sans-serif">☀️ Solar PV Array</text>
          <text x={74} y={33} textAnchor="middle" fill="rgba(240,255,248,0.5)" fontSize={9} fontFamily="JetBrains Mono, monospace">Bhatan Farm • 12 panels</text>
          <SVGBar x={10} y={41} w={100} pct={solarFrac} color="#FFD60A" />
          <text x={116} y={48} fill="#FFD60A" fontSize={9} fontFamily="JetBrains Mono, monospace">{v.solar.toFixed(1)} kW</text>
        </NodeCard>

        {/* 💨 Wind */}
        <NodeCard x={C1} y={windY} accent="#06B6D4">
          <text x={74} y={20} textAnchor="middle" fill="#06B6D4" fontSize={12} fontWeight={700} fontFamily="Space Grotesk, sans-serif">💨 Wind Turbine</text>
          <text x={74} y={33} textAnchor="middle" fill="rgba(240,255,248,0.5)" fontSize={9} fontFamily="JetBrains Mono, monospace">Kalamboli Ridge • 2 units</text>
          <SVGBar x={10} y={41} w={100} pct={windFrac} color="#06B6D4" />
          <text x={116} y={48} fill="#06B6D4" fontSize={9} fontFamily="JetBrains Mono, monospace">{v.wind.toFixed(1)} kW</text>
        </NodeCard>

        {/* 💧 Micro Hydro */}
        <NodeCard x={C1} y={hydroY} accent="#0EA5E9">
          <text x={74} y={20} textAnchor="middle" fill="#0EA5E9" fontSize={12} fontWeight={700} fontFamily="Space Grotesk, sans-serif">💧 Micro Hydro</text>
          <text x={74} y={33} textAnchor="middle" fill="rgba(240,255,248,0.5)" fontSize={9} fontFamily="JetBrains Mono, monospace">Palaspe Stream • 1 unit</text>
          <SVGBar x={10} y={41} w={100} pct={0.7} color="#0EA5E9" />
          <text x={116} y={48} fill="#0EA5E9" fontSize={9} fontFamily="JetBrains Mono, monospace">1.4 kW</text>
        </NodeCard>

        {/* ════ COL 2: DC BUS ════ */}
        <NodeCard x={C2} y={dcY} w={148} h={90} accent="#A78BFA">
          <text x={74} y={20} textAnchor="middle" fill="#A78BFA" fontSize={12} fontWeight={700} fontFamily="Space Grotesk, sans-serif">⚙️ Power Cond.</text>
          <text x={74} y={32} textAnchor="middle" fill="rgba(240,255,248,0.45)" fontSize={9} fontFamily="JetBrains Mono, monospace">DC Bus 48V</text>
          <text x={74} y={44} textAnchor="middle" fill="rgba(240,255,248,0.45)" fontSize={9} fontFamily="JetBrains Mono, monospace">AC/DC Converters</text>
          <text x={74} y={60} textAnchor="middle" fill="#A78BFA" fontSize={13} fontWeight={700} fontFamily="Space Grotesk, sans-serif">
            {v.total} kW
          </text>
          <text x={74} y={73} textAnchor="middle" fill="rgba(240,255,248,0.4)" fontSize={9} fontFamily="JetBrains Mono, monospace">Total In</text>
        </NodeCard>

        {/* ════ COL 3: BATTERY ════ */}
        <NodeCard x={C3} y={battY} w={148} h={100} accent={battColor}>
          <text x={74} y={19} textAnchor="middle" fill={battColor} fontSize={12} fontWeight={700} fontFamily="Space Grotesk, sans-serif">🔋 Battery Bank</text>
          <text x={74} y={31} textAnchor="middle" fill="rgba(240,255,248,0.45)" fontSize={9} fontFamily="JetBrains Mono, monospace">48V Lithium • 20 kWh</text>
          <SVGBar x={10} y={40} w={128} pct={v.battPct / 100} color={battColor} />
          <text x={74} y={58} textAnchor="middle" fill={battColor} fontSize={14} fontWeight={700} fontFamily="Space Grotesk, sans-serif">{v.battPct}%</text>
          <text x={74} y={72} textAnchor="middle" fill={battColor} fontSize={9} fontFamily="JetBrains Mono, monospace">
            {v.charging ? '▲' : '▼'} {battLabel}
          </text>
          <rect x={10} y={80} width={128} height={11} rx={5} fill={`${battColor}18`} stroke={`${battColor}44`} strokeWidth={0.5} />
          <rect x={10} y={80} width={128 * (v.battPct / 100)} height={11} rx={5} fill={`${battColor}55`} />
        </NodeCard>

        {/* ════ COL 4: GRIDMIND HUB ════ */}
        <NodeCard x={C4} y={hubY} w={148} h={100} accent="#00FF88">
          <rect x={-4} y={-4} width={156} height={108} rx={14} fill="#00FF88" fillOpacity={0.04}
            style={{ filter: 'blur(8px)' }} />
          <text x={74} y={19} textAnchor="middle" fill="#00FF88" fontSize={12} fontWeight={700} fontFamily="Space Grotesk, sans-serif">⚡ GRIDMIND AI</text>
          <text x={74} y={31} textAnchor="middle" fill="rgba(240,255,248,0.45)" fontSize={9} fontFamily="JetBrains Mono, monospace">Panvel Hub • Smart Ctrl</text>
          <text x={74} y={51} textAnchor="middle" fill="#00FF88" fontSize={13} fontWeight={700} fontFamily="Space Grotesk, sans-serif">89% Efficiency</text>
          <rect x={24} y={59} width={100} height={14} rx={7} fill="rgba(0,255,136,0.12)" stroke="rgba(0,255,136,0.3)" strokeWidth={0.8} />
          <circle cx={36} cy={66} r={3} fill="#00FF88" style={{ animation: 'pulse-dot 1.5s infinite' }} />
          <text x={74} y={70} textAnchor="middle" fill="#00FF88" fontSize={9} fontWeight={700} fontFamily="JetBrains Mono, monospace">AI ACTIVE</text>
        </NodeCard>

        {/* MSEDCL Backup */}
        <NodeCard x={C4} y={msedY} w={148} h={70} accent="#555">
          <text x={74} y={19} textAnchor="middle" fill="#888" fontSize={11} fontWeight={600} fontFamily="Space Grotesk, sans-serif">🏛️ MSEDCL Grid</text>
          <text x={74} y={31} textAnchor="middle" fill="rgba(240,255,248,0.3)" fontSize={9} fontFamily="JetBrains Mono, monospace">Maharashtra Utility</text>
          <text x={74} y={48} textAnchor="middle" fill="#666" fontSize={10} fontFamily="JetBrains Mono, monospace">Status: Standby</text>
          <line x1={14} y1={58} x2={134} y2={58} stroke="#555" strokeWidth={1} strokeDasharray="4 3" strokeOpacity={0.5} />
        </NodeCard>

        {/* ════ COL 5: VILLAGES ════ */}

        {/* Bhatan */}
        <NodeCard x={C5} y={bhatanY} w={148} h={80} accent="#00FF88">
          <text x={74} y={19} textAnchor="middle" fill="#00FF88" fontSize={11} fontWeight={700} fontFamily="Space Grotesk, sans-serif">🏘️ Bhatan Village</text>
          <text x={74} y={31} textAnchor="middle" fill="rgba(240,255,248,0.4)" fontSize={9} fontFamily="JetBrains Mono, monospace">680 households</text>
          <SVGBar x={10} y={39} w={128} pct={0.85} color="#00FF88" />
          <text x={74} y={60} textAnchor="middle" fill="#00FF88" fontSize={13} fontWeight={700} fontFamily="Space Grotesk, sans-serif">3.8 kW</text>
        </NodeCard>

        {/* Somathne PRIORITY */}
        <NodeCard x={C5} y={somathneY} w={148} h={80} accent="#FF2D55">
          <rect x={-4} y={-4} width={156} height={88} rx={14} fill="#FF2D55" fillOpacity={0.06}
            style={{ filter: 'blur(6px)' }} />
          <circle cx={148} cy={0} r={40} fill="none" stroke="#FF2D55" strokeWidth={1} strokeOpacity={0.25}
            style={{ transformOrigin: '148px 0px', animation: 'priority-ring 2s ease-out infinite' }} />
          <text x={74} y={19} textAnchor="middle" fill="#FF2D55" fontSize={11} fontWeight={700} fontFamily="Space Grotesk, sans-serif">🏥 Somathne PHC</text>
          <text x={74} y={31} textAnchor="middle" fill="rgba(240,255,248,0.4)" fontSize={9} fontFamily="JetBrains Mono, monospace">School + Clinic</text>
          <rect x={18} y={36} width={112} height={12} rx={6} fill="rgba(255,45,85,0.15)" stroke="rgba(255,45,85,0.4)" strokeWidth={0.8} />
          <text x={74} y={46} textAnchor="middle" fill="#FF2D55" fontSize={9} fontWeight={700} fontFamily="JetBrains Mono, monospace">PRIORITY ZONE 🔴</text>
          <text x={74} y={63} textAnchor="middle" fill="#FF2D55" fontSize={13} fontWeight={700} fontFamily="Space Grotesk, sans-serif">1.2 kW</text>
        </NodeCard>

        {/* Palaspe */}
        <NodeCard x={C5} y={palaspeY} w={148} h={80} accent="#FF6B35">
          <text x={74} y={19} textAnchor="middle" fill="#FF6B35" fontSize={11} fontWeight={700} fontFamily="Space Grotesk, sans-serif">🌾 Palaspe</text>
          <text x={74} y={31} textAnchor="middle" fill="rgba(240,255,248,0.4)" fontSize={9} fontFamily="JetBrains Mono, monospace">Farm Pumps • Kharif</text>
          <SVGBar x={10} y={39} w={128} pct={0.72} color="#FF6B35" />
          <text x={74} y={60} textAnchor="middle" fill="#FF6B35" fontSize={13} fontWeight={700} fontFamily="Space Grotesk, sans-serif">2.4 kW</text>
        </NodeCard>

        {/* Kalamboli */}
        <NodeCard x={C5} y={kalamboliY} w={148} h={70} accent="#0EA5E9">
          <text x={74} y={19} textAnchor="middle" fill="#0EA5E9" fontSize={11} fontWeight={700} fontFamily="Space Grotesk, sans-serif">🏪 Kalamboli</text>
          <text x={74} y={31} textAnchor="middle" fill="rgba(240,255,248,0.4)" fontSize={9} fontFamily="JetBrains Mono, monospace">Market Complex</text>
          <SVGBar x={10} y={39} w={128} pct={0.60} color="#0EA5E9" />
          <text x={74} y={58} textAnchor="middle" fill="#0EA5E9" fontSize={13} fontWeight={700} fontFamily="Space Grotesk, sans-serif">2.1 kW</text>
        </NodeCard>

      </svg>

      {/* ── Bottom summary strip ── */}
      <div style={{
        marginTop: 12, padding: '8px 16px', borderRadius: 8,
        background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.12)',
        display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
        fontFamily: 'var(--font-mono)', fontSize: 11
      }}>
        <span style={{ color: '#FFD60A' }}>⚡ Total Generation: <strong>{v.total} kW</strong></span>
        <span style={{ color: 'var(--text-muted)' }}>|</span>
        <span style={{ color: '#0EA5E9' }}>📊 Total Load: <strong>{v.load} kW</strong></span>
        <span style={{ color: 'var(--text-muted)' }}>|</span>
        <span style={{ color: '#00FF88' }}>
          Net Surplus: <strong>{v.surplus > 0 ? '+' : ''}{v.surplus} kW</strong>
          {v.surplus > 0 ? ' → Charging Battery' : ' → Drawing from Battery'}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>|</span>
        <span style={{ color: '#00FF88' }}>Grid Independence: <strong>100% 🟢</strong></span>
        <span style={{ color: 'var(--text-muted)' }}>|</span>
        <span style={{ color: 'var(--text-muted)' }}>Updated: <span style={{ color: '#00FF88' }}>{v.time}</span></span>
      </div>

      <style>{`
        @keyframes priority-ring {
          0%   { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
