import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { solarData } from '../data/kaggleData';

/* Build chart data from Kaggle — all 24 hours */
const baseChartData = solarData.map(row => ({
  time:   row.time_label,
  hour:   row.hour,
  kw:     +row.avg_solar_kw.toFixed(2),
  fcst:   +row.avg_forecast_kw.toFixed(2),
  weather: row.weather,
  action:  row.ai_action,
}));

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{
      background: 'rgba(4,15,30,0.95)', border: '1px solid rgba(0,255,136,0.25)',
      borderRadius: 10, padding: '10px 14px', backdropFilter: 'blur(12px)'
    }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontFamily: 'var(--font-head)', fontWeight: 700, color: '#00FF88' }}>
        {payload[0].value} <span style={{ fontSize: 11, fontWeight: 400 }}>kW actual</span>
      </div>
      {payload[1] && (
        <div style={{ fontSize: 12, color: '#FFD60A', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
          {payload[1].value} kW forecast
        </div>
      )}
      {d?.weather && (
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
          🌤 {d.weather} · {d.action}
        </div>
      )}
    </div>
  );
};

export default function SolarGeneration() {
  const [chartData, setChartData] = useState(baseChartData);
  const [nowHour, setNowHour]     = useState(new Date().getHours());

  useEffect(() => {
    const tick = () => {
      const h = new Date().getHours();
      setNowHour(h);
      setChartData(baseChartData.map(row => ({
        ...row,
        kw: row.hour === h
          ? +(row.kw + (Math.random() - 0.5) * 0.3).toFixed(2)
          : row.kw,
      })));
    };
    const id = setInterval(tick, 3000);
    return () => clearInterval(id);
  }, []);

  const peakRow = [...chartData].sort((a, b) => b.kw - a.kw)[0];
  const avg     = (chartData.reduce((s, r) => s + r.kw, 0) / chartData.length).toFixed(2);
  const current = chartData.find(r => r.hour === nowHour);

  const pills = [
    { label: 'Peak',    value: `${peakRow?.kw} kW at ${peakRow?.time}`, color: '#00FF88' },
    { label: 'Avg',     value: `${avg} kW`,                              color: '#0EA5E9' },
    { label: 'Now',     value: `${current?.kw ?? '--'} kW`,             color: '#FFD60A' },
  ];

  return (
    <div className="glass-card panel-card" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00FF88', boxShadow: '0 0 6px #00FF88' }} />
        <span style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          Solar Generation
        </span>
        <span style={{
          marginLeft: 'auto', color: '#00FF88', fontSize: 10,
          border: '1px solid #00FF88', padding: '2px 6px', borderRadius: 4,
          fontFamily: 'var(--font-mono)'
        }}>
          📊 Kaggle Verified
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>
        24-hr · Bhatan Solar Farm, Raigad · 50,000+ readings
      </div>

      {/* Pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
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
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#00FF88" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#00FF88" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fcstGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#FFD60A" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#FFD60A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,136,0.06)" />
            <XAxis dataKey="time"
              tick={{ fill: 'rgba(240,255,248,0.3)', fontSize: 8, fontFamily: 'JetBrains Mono' }}
              axisLine={false} tickLine={false}
              interval={5}
            />
            <YAxis
              tick={{ fill: 'rgba(240,255,248,0.3)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
              axisLine={false} tickLine={false} domain={[0, 11]} tickCount={5}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x={current?.time} stroke="rgba(0,255,136,0.4)" strokeDasharray="3 3" label={{ value: 'NOW', fill: '#00FF88', fontSize: 8 }} />
            <Area type="monotone" dataKey="kw"   stroke="#00FF88" strokeWidth={2} fill="url(#solarGrad)" dot={false}
              activeDot={{ r: 5, fill: '#00FF88', stroke: '#040f1e', strokeWidth: 2 }} />
            <Area type="monotone" dataKey="fcst" stroke="#FFD60A" strokeWidth={1} fill="url(#fcstGrad)" dot={false} strokeDasharray="4 2" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{
        marginTop: 8, fontSize: 10, color: 'rgba(255,214,10,0.7)',
        fontFamily: 'var(--font-mono)', textAlign: 'center',
        background: 'rgba(255,214,10,0.06)', borderRadius: 6, padding: '4px 10px',
        border: '1px solid rgba(255,214,10,0.12)'
      }}>
        ☁️ {current?.weather ?? 'Clear'} · AI: {current?.action ?? 'BALANCED'} · Monsoon pre-season, Raigad
      </div>
    </div>
  );
}
