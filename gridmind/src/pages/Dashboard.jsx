import {
  Sun, Zap, Activity, Map, Bell, FileText,
  LayoutDashboard, BatteryCharging, Thermometer,
  TrendingUp, AlertTriangle, CheckCircle
} from 'lucide-react';
import '../styles/App.css';

const solarBars = [
  0.05, 0.08, 0.06, 0.04, 0.03, 0.10, 0.35, 0.58, 0.72,
  0.84, 0.91, 0.95, 1.00, 0.97, 0.90, 0.78, 0.60, 0.40,
  0.20, 0.10, 0.06, 0.04, 0.03, 0.02
];

const alerts = [
  { type: 'critical', text: 'Transformer fault detected. Voltage: 218.3V. Switching to battery.', time: '14:12 IST' },
  { type: 'warning',  text: 'Overload in Bhatan sector. Load: 11.4kW. AI initiating load shedding.', time: '13:47 IST' },
];

export default function DashboardPage() {
  return (
    <div className="page-wrapper">

      {/* ── Hero tagline ── */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-tagline">Bijli Bachao. Gaon Jagao.</div>
        <div className="dashboard-hero-sub">Intelligent Power. Zero Waste.</div>
        <div className="dashboard-hero-divider" />
      </div>

      {/* ── KPI stat cards ── */}
      <div className="stat-cards-row">

        <div className="glass-card stat-card" style={{ '--card-accent': '#00FF88' }}>
          <div className="stat-card-icon"><Sun size={48} color="#00FF88" /></div>
          <div className="stat-card-label">Solar Output</div>
          <div className="stat-card-value">8.4<span className="stat-card-unit"> kW</span></div>
          <div className="stat-card-sub">↑ 12% vs yesterday</div>
        </div>

        <div className="glass-card stat-card" style={{ '--card-accent': '#FF6B35' }}>
          <div className="stat-card-icon"><BatteryCharging size={48} color="#FF6B35" /></div>
          <div className="stat-card-label">Battery Level</div>
          <div className="stat-card-value">72<span className="stat-card-unit"> %</span></div>
          <div className="stat-card-sub">Charging · 20 kWh cap</div>
        </div>

        <div className="glass-card stat-card" style={{ '--card-accent': '#0EA5E9' }}>
          <div className="stat-card-icon"><Zap size={48} color="#0EA5E9" /></div>
          <div className="stat-card-label">Current Load</div>
          <div className="stat-card-value">6.0<span className="stat-card-unit"> kW</span></div>
          <div className="stat-card-sub">4 villages · normal</div>
        </div>

        <div className="glass-card stat-card" style={{ '--card-accent': '#FFD60A' }}>
          <div className="stat-card-icon"><Activity size={48} color="#FFD60A" /></div>
          <div className="stat-card-label">Grid Stability</div>
          <div className="stat-card-value">86.6<span className="stat-card-unit"> /100</span></div>
          <div className="stat-card-sub">Stable · 50.002 Hz</div>
        </div>

      </div>

      {/* ── Bottom panels ── */}
      <div className="dashboard-grid">

        {/* Solar bar chart */}
        <div className="glass-card panel-card">
          <div className="panel-title">
            <div className="panel-title-dot" />
            24-Hour Solar Profile
          </div>
          <div className="panel-subtitle">Hourly avg kW · Raigad District</div>
          <div className="bar-placeholder">
            {solarBars.map((h, i) => (
              <div
                key={i}
                className="bar-item"
                style={{
                  height: `${h * 100}%`,
                  background: h > 0.5
                    ? `rgba(0,255,136,${0.4 + h * 0.5})`
                    : `rgba(0,255,136,${0.15 + h * 0.3})`,
                  boxShadow: h > 0.7 ? '0 0 6px rgba(0,255,136,0.4)' : 'none',
                }}
                title={`${i}:00 — ${(h * 10).toFixed(1)} kW`}
              />
            ))}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
            <span style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>12AM</span>
            <span style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>6AM</span>
            <span style={{ fontSize:10, color:'var(--primary)', fontFamily:'var(--font-mono)' }}>1PM ↑ PEAK</span>
            <span style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>6PM</span>
            <span style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>11PM</span>
          </div>
        </div>

        {/* AI Alerts panel */}
        <div className="glass-card panel-card">
          <div className="panel-title">
            <div className="panel-title-dot" style={{ background:'var(--danger)', boxShadow:'0 0 6px var(--danger)' }} />
            AI Alerts
          </div>
          <div className="panel-subtitle">Recent critical events · auto-resolved</div>
          <div className="alert-list">
            {alerts.map((a, i) => (
              <div key={i} className={`alert-row ${a.type}`}>
                <div
                  className="alert-dot"
                  style={{ background: a.type === 'critical' ? 'var(--danger)' : 'var(--secondary)',
                           boxShadow: `0 0 6px ${a.type === 'critical' ? 'var(--danger)' : 'var(--secondary)'}` }}
                />
                <div>
                  <div className="alert-text">{a.text}</div>
                  <div className="alert-time">{a.time}</div>
                </div>
              </div>
            ))}
            <div className="alert-row" style={{ background:'rgba(0,255,136,0.04)', borderColor:'rgba(0,255,136,0.12)' }}>
              <CheckCircle size={14} color="var(--primary)" style={{ flexShrink:0, marginTop:2 }} />
              <div>
                <div className="alert-text" style={{ color:'var(--primary)' }}>System nominal — all 4 villages powered</div>
                <div className="alert-time">14:15 IST</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
