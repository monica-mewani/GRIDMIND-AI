import { useEffect, useRef, useState } from 'react';
import { batteryData, stabilityData } from '../data/kaggleData';
import { useCrisis } from '../context/CrisisContext';

/* ── Live simulation hook ── */
function useLiveValues(apiData, crisisStep) {
  const getHour = () => new Date().getHours();
  const getIST  = () => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const ist = new Date(utc + 5.5 * 3600000);
    return `${String(ist.getHours()).padStart(2,'0')}:${String(ist.getMinutes()).padStart(2,'0')}:${String(ist.getSeconds()).padStart(2,'0')} IST`;
  };

  const compute = () => {
    const h        = getHour();
    
    // If we have live API data, use it!
    if (apiData && apiData.solar && apiData.battery && apiData.villages) {
      const s = apiData.solar;
      const b = apiData.battery;
      const totalGen = s.total_kw;
      const loadKw = apiData.kpis.total_consumption_kw;
      const surplus = +(totalGen - loadKw).toFixed(2);
      return { 
        h: apiData.ist_hour, 
        solar: s.current_kw, 
        wind: s.wind_kw, 
        hydro: s.hydro_kw, 
        total: totalGen, 
        battPct: b.percentage, 
        charging: surplus > 0, 
        load: loadKw, 
        surplus, 
        time: getIST() 
      };
    }

    // Fallback logic
    const baseWind = (h < 6 || h > 18) ? 2.8 : 1.6;
    let solar    = 6.2 + (Math.random() - 0.5) * 0.4;
    let wind     = baseWind + (Math.random() - 0.5) * 0.4;
    let hydro    = 1.4;
    let total    = +(solar + wind + hydro).toFixed(2);
    const battRow  = batteryData[h % 24];
    let battPct  = Math.min(100, Math.max(0, (battRow ? battRow.avg_battery_pct : 50) + (Math.random()-0.5)*2));
    let charging = battRow ? battRow.avg_input_output > 0 : true;
    let load     = +(total - (charging ? 0.3 : -0.3)).toFixed(2);
    let surplus  = +(total - load).toFixed(2);
    let time     = getIST();
    
    // CRISIS OVERRIDES
    if (crisisStep >= 1) {
      solar = 2.3; // Solar drops massively
    }
    if (crisisStep >= 3) {
      charging = false;
      battPct = Math.max(10, battPct - (crisisStep - 2) * 5); // Drops over time
    }
    if (crisisStep >= 5 && crisisStep < 8) {
       load = Math.max(total, load - 2.1); // Kalamboli shed
    }
    
    total = +(solar + wind + hydro).toFixed(2);
    surplus = +(total - load).toFixed(2);

    return { h, solar, wind, hydro, total, battPct: +battPct.toFixed(1), charging, load, surplus, time };
  };

  const [vals, setVals] = useState(() => compute());
  useEffect(() => {
    const id = setInterval(() => setVals(compute()), 2000);
    return () => clearInterval(id);
  }, [apiData, crisisStep]); // React to apiData and crisis changes
  
  // Always compute immediately when apiData or crisisStep changes
  useEffect(() => {
    setVals(compute());
  }, [apiData, crisisStep]);

  return vals;
}

/* ── Animated dot along a straight line ── */
function FlowDot({ x1, y1, x2, y2, color, delay = 0, speed = 1800, r = 2.5 }) {
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
  return <circle cx={x} cy={y} r={r} fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />;
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

export default function EnergyFlow({ apiData }) {
  const { crisisStep } = useCrisis();
  const v = useLiveValues(apiData, crisisStep);

  // Layout geometry
  const W = 960, H = 280;
  
  // 4-column strict layout horizontally (ignoring unused MSEDCL inline)
  // Col 1: Sources (x=10)
  // Col 2: BatteryBank (x=270)
  // Col 3: GRIDMIND Hub (x=500)
  // Col 4: Villages (x=750)
  const C1 = 15, C2 = 290, C3 = 540, C4 = 770;
  const cwSource = 145, cwBatt = 140, cwHub = 140, cwVill = 175;

  // Y calculations
  // Sources: height=52, gap=16
  const solarY = 46, windY = 114, hydroY = 182;
  // Battery: centered vertically
  const battY = 103; // height=74
  // Hub: taller
  const hubY = 70; // height=100
  const msedY = 190; // MSEDCL below it
  // Villages: height=52, gap=12
  const bhatanY = 18, somathneY = 82, palaspeY = 146, kalamboliY = 210;

  const battColor = v.charging ? '#00FF88' : '#FF6B35';

  return (
    <div className="glass-card" style={{ padding: '0px', gridColumn: '1 / -1', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '320px' }}>
      
      {/* Main SVG Area */}
      <div style={{ flex: 1, padding: '16px 20px 0', position: 'relative' }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible', display: 'block' }}>

          {/* ── EDGES ── */}
          <line x1={C1+cwSource} y1={solarY+26} x2={C2} y2={battY+37} stroke="#FFD60A" strokeWidth={1.5} strokeOpacity={0.4} />
          <line x1={C1+cwSource} y1={windY+26} x2={C2} y2={battY+37} stroke="#06B6D4" strokeWidth={1.5} strokeOpacity={0.4} />
          <line x1={C1+cwSource} y1={hydroY+26} x2={C2} y2={battY+37} stroke="#0EA5E9" strokeWidth={1.5} strokeOpacity={0.4} />
          
          <text x={(C1+cwSource + C2)/2} y={(solarY+26 + battY+37)/2 - 5} fill="#FFD60A" fontSize={10} textAnchor="middle" fontFamily="JetBrains Mono, monospace">{v.solar.toFixed(1)} kW</text>
          <text x={(C1+cwSource + C2)/2} y={(windY+26 + battY+37)/2 - 5} fill="#06B6D4" fontSize={10} textAnchor="middle" fontFamily="JetBrains Mono, monospace">{v.wind.toFixed(1)} kW</text>
          <text x={(C1+cwSource + C2)/2} y={(hydroY+26 + battY+37)/2 - 5} fill="#0EA5E9" fontSize={10} textAnchor="middle" fontFamily="JetBrains Mono, monospace">1.4 kW</text>

          <line x1={C2+cwBatt} y1={battY+37} x2={C3} y2={hubY+50} stroke={battColor} strokeWidth={2.5} strokeOpacity={0.6} />
          <text x={(C2+cwBatt + C3)/2} y={(battY+37 + hubY+50)/2 - 8} fill={battColor} fontSize={10} fontWeight={700} textAnchor="middle" fontFamily="JetBrains Mono, monospace">{v.total.toFixed(1)} kW total</text>

          <line x1={C3+cwHub/2} y1={hubY+100} x2={C3+cwHub/2} y2={msedY} stroke="#666" strokeWidth={1.5} strokeOpacity={0.5} strokeDasharray="4 4" />

          <line x1={C3+cwHub} y1={hubY+20} x2={C4} y2={bhatanY+26} stroke="#00FF88" strokeWidth={1.5} strokeOpacity={0.4} />
          <line x1={C3+cwHub} y1={hubY+40} x2={C4} y2={somathneY+26 + 2} stroke="#FF2D55" strokeWidth={2.5} strokeOpacity={0.6} />
          <line x1={C3+cwHub} y1={hubY+60} x2={C4} y2={palaspeY+26} stroke="#FF6B35" strokeWidth={1.5} strokeOpacity={0.4} />
          <line x1={C3+cwHub} y1={hubY+80} x2={C4} y2={kalamboliY+26} stroke="#0EA5E9" strokeWidth={1.5} strokeOpacity={0.4} />

          {/* ── ANIMATED DOTS ── */}
          {[0, 0.4].map(off => <FlowDot key={`s${off}`} x1={C1+cwSource} y1={solarY+26} x2={C2} y2={battY+37} color="#FFD60A" delay={off} speed={1200} r={1.5} />)}
          {[0, 0.4].map(off => <FlowDot key={`w${off}`} x1={C1+cwSource} y1={windY+26} x2={C2} y2={battY+37} color="#06B6D4" delay={off} speed={1500} r={1.5} />)}
          {[0, 0.4].map(off => <FlowDot key={`h${off}`} x1={C1+cwSource} y1={hydroY+26} x2={C2} y2={battY+37} color="#0EA5E9" delay={off} speed={1800} r={1.5} />)}
          
          {[0, 0.3, 0.6].map(off => <FlowDot key={`bh${off}`} x1={C2+cwBatt} y1={battY+37} x2={C3} y2={hubY+50} color={battColor} delay={off} speed={1000} r={2} />)}
          
          {[0, 0.5].map(off => <FlowDot key={`bha${off}`} x1={C3+cwHub} y1={hubY+20} x2={C4} y2={bhatanY+26} color="#00FF88" delay={off} speed={1300} r={1.5} />)}
          {[0, 0.25, 0.5, 0.75].map(off => <FlowDot key={`som${off}`} x1={C3+cwHub} y1={hubY+40} x2={C4} y2={somathneY+28} color="#FF2D55" delay={off} speed={800} r={3} />)}
          {[0, 0.5].map(off => <FlowDot key={`pal${off}`} x1={C3+cwHub} y1={hubY+60} x2={C4} y2={palaspeY+26} color="#FF6B35" delay={off} speed={1400} r={1.5} />)}
          {[0, 0.5].map(off => <FlowDot key={`kal${off}`} x1={C3+cwHub} y1={hubY+80} x2={C4} y2={kalamboliY+26} color="#0EA5E9" delay={off} speed={1500} r={1.5} />)}

          {/* ════ COL 1: SOURCES ════ */}
          <NodeCard x={C1} y={solarY} w={cwSource} h={52} accent="#FFD60A">
            <text x={10} y={20} fill="#FFD60A" fontSize={11} fontWeight={700} fontFamily="Space Grotesk, sans-serif">☀️ Solar PV Array</text>
            <text x={10} y={38} fill="var(--text-muted)" fontSize={10} fontFamily="JetBrains Mono, monospace">Bhatan Farm • <tspan fill="#FFD60A">{v.solar.toFixed(1)} kW</tspan></text>
          </NodeCard>

          <NodeCard x={C1} y={windY} w={cwSource} h={52} accent="#06B6D4">
            <text x={10} y={20} fill="#06B6D4" fontSize={11} fontWeight={700} fontFamily="Space Grotesk, sans-serif">💨 Wind Turbine</text>
            <text x={10} y={38} fill="var(--text-muted)" fontSize={10} fontFamily="JetBrains Mono, monospace">Kalamboli • <tspan fill="#06B6D4">{v.wind.toFixed(1)} kW</tspan></text>
          </NodeCard>

          <NodeCard x={C1} y={hydroY} w={cwSource} h={52} accent="#0EA5E9">
            <text x={10} y={20} fill="#0EA5E9" fontSize={11} fontWeight={700} fontFamily="Space Grotesk, sans-serif">💧 Micro Hydro</text>
            <text x={10} y={38} fill="var(--text-muted)" fontSize={10} fontFamily="JetBrains Mono, monospace">Palaspe • <tspan fill="#0EA5E9">1.4 kW</tspan></text>
          </NodeCard>

          {/* ════ COL 2: BATTERY ════ */}
          <NodeCard x={C2} y={battY} w={cwBatt} h={74} accent={battColor}>
            <text x={10} y={20} fill={battColor} fontSize={11} fontWeight={700} fontFamily="Space Grotesk, sans-serif">🔋 Battery Bank</text>
            <text x={10} y={36} fill="var(--text-muted)" fontSize={10} fontFamily="JetBrains Mono, monospace">48V • 20 kWh</text>
            <text x={10} y={52} fill={battColor} fontSize={10} fontFamily="JetBrains Mono, monospace" fontWeight={600}>{v.charging ? '+' : ''}{v.surplus.toFixed(1)} kW {v.charging ? 'charging' : 'draw'}</text>
            <rect x={10} y={60} width={120} height={4} rx={2} fill={`${battColor}33`} />
            <rect x={10} y={60} width={120 * (v.battPct / 100)} height={4} rx={2} fill={battColor} />
          </NodeCard>

          {/* ════ COL 3: GRIDMIND / MSEDCL ════ */}
          <NodeCard x={C3} y={hubY} w={cwHub} h={100} accent="#00FF88">
            <rect x={-4} y={-4} width={cwHub+8} height={108} rx={14} fill="#00FF88" fillOpacity={0.06} style={{ filter: 'blur(8px)', animation: 'pulse-dot 2s infinite' }} />
            <text x={cwHub/2} y={26} textAnchor="middle" fill="#00FF88" fontSize={12} fontWeight={700} fontFamily="Space Grotesk, sans-serif">⚡ GRIDMIND AI</text>
            <text x={cwHub/2} y={44} textAnchor="middle" fill="var(--text-muted)" fontSize={10} fontFamily="JetBrains Mono, monospace">Panvel Hub</text>
            <text x={cwHub/2} y={62} textAnchor="middle" fill="#00FF88" fontSize={12} fontWeight={700} fontFamily="Space Grotesk, sans-serif">89% Efficiency</text>
            <rect x={(cwHub-80)/2} y={76} width={80} height={14} rx={7} fill="#00FF8822" stroke="#00FF8855" strokeWidth={0.8} />
            <circle cx={(cwHub-80)/2 + 10} cy={83} r={3} fill="#00FF88" style={{ animation: 'pulse-dot 1s infinite' }} />
            <text x={cwHub/2 + 6} y={86} textAnchor="middle" fill="#00FF88" fontSize={9} fontWeight={700} fontFamily="JetBrains Mono, monospace">● AI ACTIVE</text>
          </NodeCard>

          <NodeCard x={C3} y={msedY} w={cwHub} h={46} accent="#555">
            <text x={cwHub/2} y={18} textAnchor="middle" fill="#888" fontSize={11} fontWeight={600} fontFamily="Space Grotesk, sans-serif">🏛 MSEDCL Grid</text>
            <text x={cwHub/2} y={34} textAnchor="middle" fill="#666" fontSize={10} fontFamily="JetBrains Mono, monospace">Status: Standby</text>
          </NodeCard>

          {/* ════ COL 4: VILLAGES ════ */}
          <NodeCard x={C4} y={bhatanY} w={cwVill} h={52} accent="#00FF88">
            <text x={10} y={20} fill="#00FF88" fontSize={11} fontWeight={700} fontFamily="Space Grotesk, sans-serif">🏘 Bhatan Village</text>
            <text x={10} y={38} fill="var(--text-muted)" fontSize={10} fontFamily="JetBrains Mono, monospace">680 homes • <tspan fill="#00FF88">3.8 kW</tspan></text>
          </NodeCard>
          
          <NodeCard x={C4} y={somathneY} w={cwVill} h={56} accent="#FF2D55">
            <rect x={-2} y={-2} width={cwVill+4} height={60} rx={12} fill="#FF2D55" fillOpacity={0.06} style={{ filter: 'blur(4px)' }} />
            <text x={10} y={22} fill="#FF2D55" fontSize={12} fontWeight={700} fontFamily="Space Grotesk, sans-serif">🏥 Somathne PHC</text>
            <text x={10} y={40} fill="var(--text-muted)" fontSize={10} fontFamily="JetBrains Mono, monospace">PRIORITY ZONE • <tspan fill="#FF2D55" fontWeight={700}>1.2 kW</tspan></text>
          </NodeCard>

          <NodeCard x={C4} y={palaspeY} w={cwVill} h={52} accent="#FF6B35">
            <text x={10} y={20} fill="#FF6B35" fontSize={11} fontWeight={700} fontFamily="Space Grotesk, sans-serif">🌾 Palaspe Farms</text>
            <text x={10} y={38} fill="var(--text-muted)" fontSize={10} fontFamily="JetBrains Mono, monospace">Kharif • <tspan fill="#FF6B35">2.4 kW</tspan></text>
          </NodeCard>

          <NodeCard x={C4} y={kalamboliY} w={cwVill} h={52} accent="#0EA5E9">
            <text x={10} y={20} fill="#0EA5E9" fontSize={11} fontWeight={700} fontFamily="Space Grotesk, sans-serif">🏪 Kalamboli Market</text>
            <text x={10} y={38} fill="var(--text-muted)" fontSize={10} fontFamily="JetBrains Mono, monospace">Commercial • <tspan fill="#0EA5E9">2.1 kW</tspan></text>
          </NodeCard>

        </svg>
      </div>

      {/* ── Bottom Strip ── */}
      <div style={{
        padding: '10px 16px',
        background: 'rgba(0,255,136,0.04)',
        borderTop: '1px solid rgba(0,255,136,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        borderBottomLeftRadius: '12px',
        borderBottomRightRadius: '12px'
      }}>
        <span style={{ color: '#FFD60A' }}>Total: <strong>{v.total.toFixed(1)} kW</strong> generated</span>
        <span style={{ color: 'var(--text-muted)' }}>·</span>
        <span style={{ color: '#0EA5E9' }}>Load: <strong>{v.load.toFixed(1)} kW</strong></span>
        <span style={{ color: 'var(--text-muted)' }}>·</span>
        <span style={{ color: '#00FF88' }}>
          Surplus: <strong>{v.surplus > 0 ? '+' : ''}{v.surplus.toFixed(1)} kW</strong> {v.surplus >= 0 ? '→ Battery' : '← Battery'}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>·</span>
        <span style={{ color: '#00FF88' }}>Grid Independence: <strong>100% 🟢</strong></span>
        <span style={{ color: 'var(--text-muted)' }}>·</span>
        <span style={{ color: '#00FF88' }}>{v.time}</span>
      </div>
    </div>
  );
}
