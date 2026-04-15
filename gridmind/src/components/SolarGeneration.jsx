import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

const data = [
  { time: '6 AM',  kw: 0.8 },
  { time: '7 AM',  kw: 1.9 },
  { time: '8 AM',  kw: 3.2 },
  { time: '9 AM',  kw: 4.8 },
  { time: '10 AM', kw: 6.1 },
  { time: '11 AM', kw: 7.6 },
  { time: '12 PM', kw: 8.8 },
  { time: '1 PM',  kw: 9.1 },
  { time: '2 PM',  kw: 8.4 },
  { time: '3 PM',  kw: 6.8 },
  { time: '4 PM',  kw: 5.2 },
  { time: '5 PM',  kw: 3.0 },
  { time: '6 PM',  kw: 1.4 },
  { time: '7 PM',  kw: 0.2 },
];

const pills = [
  { label: 'Peak', value: '9.1 kW at 12:30 IST', color: '#00FF88' },
  { label: 'Avg',  value: '5.8 kW',               color: '#0EA5E9' },
  { label: 'Confidence', value: '94%',             color: '#FFD60A' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(4,15,30,0.92)', border: '1px solid rgba(0,255,136,0.25)',
      borderRadius: 8, padding: '8px 12px', backdropFilter: 'blur(12px)'
    }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontFamily: 'var(--font-head)', fontWeight: 700, color: '#00FF88' }}>
        {payload[0].value} <span style={{ fontSize: 10, fontWeight: 400 }}>kW</span>
      </div>
    </div>
  );
};

export default function SolarGeneration() {
  return (
    <div className="glass-card panel-card" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00FF88', boxShadow: '0 0 6px #00FF88' }} />
        <span style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          Solar Generation
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
        6 AM – 7 PM IST · Bhatan Solar Farm, Raigad
      </div>

      {/* Pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {pills.map(p => (
          <div key={p.label} style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px',
            borderRadius: 99, background: `${p.color}15`, border: `1px solid ${p.color}40`,
            fontSize: 10, fontFamily: 'var(--font-mono)', color: p.color
          }}>
            <span style={{ color: 'var(--text-muted)' }}>{p.label}:</span>
            <span style={{ fontWeight: 700 }}>{p.value}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ flex: 1, height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#00FF88" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#00FF88" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,136,0.06)" />
            <XAxis dataKey="time" tick={{ fill: 'rgba(240,255,248,0.35)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
              axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(240,255,248,0.35)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
              axisLine={false} tickLine={false} domain={[0, 10]} tickCount={6} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="kw" stroke="#00FF88" strokeWidth={2}
              fill="url(#solarGrad)" dot={false}
              activeDot={{ r: 5, fill: '#00FF88', stroke: '#040f1e', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Cloud note */}
      <div style={{
        marginTop: 10, fontSize: 10, color: 'rgba(255,214,10,0.7)',
        fontFamily: 'var(--font-mono)', textAlign: 'center',
        background: 'rgba(255,214,10,0.06)', borderRadius: 6, padding: '4px 10px',
        border: '1px solid rgba(255,214,10,0.12)'
      }}>
        ☁️ Light clouds expected 3–4 PM (Monsoon pre-season, Raigad)
      </div>
    </div>
  );
}
