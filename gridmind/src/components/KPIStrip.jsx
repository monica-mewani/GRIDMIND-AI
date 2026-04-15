const kpis = [
  {
    id: 'total-gen',
    label: 'Total Generation',
    value: '12.4',
    unit: 'kW',
    color: '#00FF88',
    icon: '☀️',
    sub: 'Solar + Battery'
  },
  {
    id: 'consumption',
    label: 'Consumption',
    value: '10.1',
    unit: 'kW',
    color: '#0EA5E9',
    icon: '⚡',
    sub: 'All 4 zones'
  },
  {
    id: 'saved-today',
    label: 'Saved Today',
    value: '3.2',
    unit: 'kWh',
    color: '#FFD60A',
    icon: '₹',
    sub: '₹38 saved · net surplus',
    highlight: true
  },
  {
    id: 'co2',
    label: 'CO₂ Avoided',
    value: '2.8',
    unit: 'kg',
    color: '#00FF88',
    icon: '🌿',
    sub: 'vs diesel backup'
  },
  {
    id: 'villages',
    label: 'Villages Powered',
    value: '4/4',
    unit: '',
    color: '#00FF88',
    icon: '✅',
    sub: 'All zones online'
  },
  {
    id: 'loadshed',
    label: 'Load Shedding',
    value: '3',
    unit: 'x',
    color: '#FF6B35',
    icon: '🛡️',
    sub: 'Prevented today'
  },
];

export default function KPIStrip() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(6, 1fr)',
      gap: 12,
      gridColumn: '1 / -1',
    }}>
      {kpis.map(k => (
        <div key={k.id} id={k.id} className="glass-card" style={{
          padding: '14px 16px',
          position: 'relative', overflow: 'hidden',
          borderColor: k.highlight ? `rgba(255,214,10,0.3)` : 'var(--border)',
          boxShadow: k.highlight ? '0 0 16px rgba(255,214,10,0.12)' : 'var(--shadow-card)',
        }}>
          {/* Top accent bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, transparent, ${k.color}, transparent)`
          }} />
          {/* Icon */}
          <div style={{ fontSize: 18, marginBottom: 6 }}>{k.icon}</div>
          {/* Label */}
          <div style={{
            fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4
          }}>
            {k.label}
          </div>
          {/* Value */}
          <div style={{
            fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700,
            color: k.color, lineHeight: 1,
            textShadow: `0 0 12px ${k.color}66`
          }}>
            {k.value}
            <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.6, marginLeft: 2 }}>{k.unit}</span>
          </div>
          {/* Sub */}
          <div style={{ fontSize: 9, color: k.highlight ? 'rgba(255,214,10,0.7)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4, lineHeight: 1.3 }}>
            {k.sub}
          </div>
        </div>
      ))}
    </div>
  );
}
