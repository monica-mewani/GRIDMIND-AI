import { useState, useEffect } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';
import { loadData } from '../data/kaggleData';

function getZones(apiData) {
  let bhatan, somathne, palaspe, kalamboli;
  
  if (apiData && apiData.bhatan) {
    bhatan = apiData.bhatan.load_kw;
    somathne = apiData.somathne.load_kw;
    palaspe = apiData.palaspe.load_kw;
    kalamboli = apiData.kalamboli.load_kw;
  } else {
    const h   = new Date().getHours();
    const row = loadData[h];
    const noise = () => (Math.random() - 0.5) * 0.2;
    bhatan    = +(row.bhatan_kw    + noise()).toFixed(2);
    somathne  = +(row.somathne_kw  + noise()).toFixed(2);
    palaspe   = +(row.palaspe_kw   + noise()).toFixed(2);
    kalamboli = +(row.kalamboli_kw + noise()).toFixed(2);
  }
  
  const total = bhatan + somathne + palaspe + kalamboli;
  return [
    { name: 'Bhatan Village',      kw: bhatan,    pct: +((bhatan   /total)*100).toFixed(1), color: '#00FF88', sub: '680 homes · residential' },
    { name: 'Somathne PHC+School', kw: somathne,  pct: +((somathne /total)*100).toFixed(1), color: '#FF2D55', sub: 'PRIORITY ZONE 🔴', priority: true },
    { name: 'Palaspe Farm Pumps',  kw: palaspe,   pct: +((palaspe  /total)*100).toFixed(1), color: '#FF6B35', sub: 'agricultural – kharif' },
    { name: 'Kalamboli Market',    kw: kalamboli, pct: +((kalamboli/total)*100).toFixed(1), color: '#0EA5E9', sub: 'commercial' },
  ];
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: 'var(--bg-surface)', border: `1px solid ${d.color}44`,
      borderRadius: 8, padding: '8px 12px', backdropFilter: 'blur(12px)',
      boxShadow: 'var(--shadow-card)'
    }}>
      <div style={{ fontSize: 11, color: d.color, fontWeight: 700, fontFamily: 'var(--font-head)' }}>{d.name}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{d.sub}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: d.color, fontFamily: 'var(--font-head)', marginTop: 4 }}>
        {d.kw} kW · {d.pct}%
      </div>
    </div>
  );
};

export default function ZoneLoad({ apiData }) {
  const [aiOn,  setAiOn]  = useState(false);
  const [zones, setZones] = useState(() => getZones(apiData));

  useEffect(() => {
    const id = setInterval(() => setZones(getZones(apiData)), 3000);
    return () => clearInterval(id);
  }, [apiData]);

  const displayZones = aiOn
    ? zones.map(z => z.priority
        ? { ...z, kw: +(z.kw * 1.3).toFixed(2), pct: +(z.pct * 1.3).toFixed(1), sub: 'PRIORITY BOOST 🔴' }
        : { ...z, kw: +(z.kw * 0.85).toFixed(2), pct: +(z.pct * 0.85).toFixed(1), sub: z.sub + ' ↓' }
      )
    : zones;

  const chartData = displayZones.map(z => ({ ...z, value: z.pct, fill: z.color }));

  return (
    <div className="glass-card panel-card" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0EA5E9', boxShadow: '0 0 6px #0EA5E9' }} />
        <span style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          Zone Load Distribution
        </span>
        {/* AI Toggle */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: aiOn ? '#00FF88' : 'var(--text-muted)', letterSpacing: '0.06em' }}>
            AI AUTO-BALANCE
          </span>
          <button
            id="ai-auto-balance-toggle"
            onClick={() => setAiOn(v => !v)}
            style={{
              width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
              background: aiOn ? 'linear-gradient(90deg, var(--primary-dark), var(--primary))' : 'var(--border)',
              position: 'relative', transition: 'all 0.3s',
              boxShadow: aiOn ? '0 0 10px rgba(0,255,136,0.5)' : 'none'
            }}
          >
            <div style={{
              position: 'absolute', top: 2, left: aiOn ? 18 : 2,
              width: 16, height: 16, borderRadius: '50%',
              background: 'white', transition: 'left 0.3s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
            }} />
          </button>
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
        {aiOn
          ? '🤖 AI Active — Somathne PHC priority boosted'
          : 'Kaggle real-time load · 4 active zones · kW live'}
      </div>

      {/* Chart */}
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius={20} outerRadius={88}
            data={chartData} startAngle={90} endAngle={-270} barSize={14} barGap={4}>
            <RadialBar background={{ fill: 'var(--border)' }} dataKey="value" cornerRadius={6} />
            <Tooltip content={<CustomTooltip />} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>

      {/* Zone legend with kW values */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 }}>
        {displayZones.map(z => (
          <div key={z.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: z.color, flexShrink: 0, boxShadow: `0 0 4px ${z.color}88` }} />
            <div style={{ flex: 1, fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {z.name}
              {z.priority && <span style={{ marginLeft: 4, fontSize: 9, color: '#FF2D55' }}>★ PRIORITY</span>}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginRight: 6 }}>
              {z.kw} kW
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: z.color, fontFamily: 'var(--font-head)', minWidth: 36, textAlign: 'right' }}>
              {z.pct}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
