import { useState, useEffect } from 'react';
import { masterData, loadData, solarData } from '../data/kaggleData';

const stats = masterData.summary_stats;

function getLiveKPIs() {
  const h     = new Date().getHours();
  const solar = solarData[h];
  const load  = loadData[h];
  const noise = (n) => (Math.random() - 0.5) * n;

  const solarKw = +(solar.avg_solar_kw + noise(0.3)).toFixed(2);
  const loadKw  = +(load.avg_load_kw   + noise(0.2)).toFixed(2);
  const surplus = +(solarKw - loadKw).toFixed(2);
  const savedKwh  = +(solarKw * 0.25 + noise(0.1)).toFixed(1);   // rolling 15-min
  const savedINR  = Math.round(savedKwh * stats.avg_grid_frequency * 1.8 + noise(5));
  const co2       = +(savedKwh * 0.82).toFixed(1);

  return [
    {
      id: 'total-gen', label: 'Solar Output', value: solarKw.toFixed(1), unit: 'kW',
      color: '#00FF88', icon: '☀️', sub: `Kaggle avg: ${stats.avg_solar_kw} kW`,
    },
    {
      id: 'consumption', label: 'Total Load', value: loadKw.toFixed(1), unit: 'kW',
      color: '#0EA5E9', icon: '⚡', sub: 'All 4 zones live',
    },
    {
      id: 'saved-today', label: 'Surplus', value: surplus > 0 ? `+${surplus}` : surplus, unit: 'kW',
      color: surplus >= 0 ? '#00FF88' : '#FF6B35', icon: surplus >= 0 ? '↑' : '↓',
      sub: surplus >= 0 ? 'Charging battery' : 'Drawing battery',
      highlight: true,
    },
    {
      id: 'co2', label: 'CO₂ Avoided', value: co2, unit: 'kg',
      color: '#00FF88', icon: '🌿', sub: `vs diesel · ${stats.avg_power_factor} PF`,
    },
    {
      id: 'villages', label: 'Grid Stability', value: stats.avg_stability_score, unit: '/100',
      color: '#FFD60A', icon: '📡', sub: `${stats.total_overload_events.toLocaleString()} overloads logged`,
    },
    {
      id: 'loadshed', label: 'Voltage', value: stats.avg_voltage, unit: 'V',
      color: '#FF6B35', icon: '🔌', sub: `India std: 230V · 50.002 Hz`,
    },
  ];
}

export default function KPIStrip() {
  const [kpis, setKpis] = useState(getLiveKPIs);

  useEffect(() => {
    const id = setInterval(() => setKpis(getLiveKPIs()), 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, gridColumn: '1 / -1' }}>
      {kpis.map(k => (
        <div key={k.id} id={k.id} className="glass-card" style={{
          padding: '14px 16px', position: 'relative', overflow: 'hidden',
          borderColor: k.highlight ? 'rgba(255,214,10,0.3)' : 'var(--border)',
          boxShadow: k.highlight ? '0 0 16px rgba(255,214,10,0.1)' : 'var(--shadow-card)',
          transition: 'all 0.3s',
        }}>
          {/* Top accent bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, transparent, ${k.color}, transparent)`
          }} />
          <div style={{ fontSize: 18, marginBottom: 5 }}>{k.icon}</div>
          <div style={{
            fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4
          }}>
            {k.label}
          </div>
          <div style={{
            fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700,
            color: k.color, lineHeight: 1, textShadow: `0 0 12px ${k.color}66`
          }}>
            {k.value}
            <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.6, marginLeft: 2 }}>{k.unit}</span>
          </div>
          <div style={{
            fontSize: 9, color: k.highlight ? `${k.color}99` : 'var(--text-muted)',
            fontFamily: 'var(--font-mono)', marginTop: 5, lineHeight: 1.4
          }}>
            {k.sub}
          </div>
        </div>
      ))}
    </div>
  );
}
