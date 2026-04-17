import { useState, useEffect } from 'react';
import { useCrisis } from '../context/CrisisContext';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import '../styles/Header.css';

const PAGE_TITLES = {
  dashboard: 'Mission Dashboard',
  solar:     'Solar Forecast',
  load:      'Load Manager',
  grid:      'Grid Stability',
  map:       'Village Map',
  alerts:    'AI Alerts',
  reports:   'Reports',
};

/* Returns IST time string (UTC+5:30) */
function getISTTime() {
  const now = new Date();
  // IST = UTC + 5:30
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 5.5 * 3600000);
  const h   = String(ist.getHours()).padStart(2, '0');
  const m   = String(ist.getMinutes()).padStart(2, '0');
  const s   = String(ist.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export default function Header({ activePage, isLightMode, toggleTheme, apiConnected, role, roleLabel, roleIcon, onAdminClick, onLogout }) {
  const [time, setTime] = useState(getISTTime());

  useEffect(() => {
    const id = setInterval(() => setTime(getISTTime()), 1000);
    return () => clearInterval(id);
  }, []);

  const title = PAGE_TITLES[activePage] || 'Dashboard';

  return (
    <>
      {/* ── Main header bar ── */}
      <header className="header">
        <div className="header-main">

          {/* Left — page title */}
          <div className="header-title-wrap">
            <button 
              className="mobile-menu-btn" 
              onClick={() => document.body.classList.toggle('sidebar-open')} 
              aria-label="Toggle Menu"
            >
              ☰
            </button>
            <div className="header-page-title">{title}</div>
            <div className="header-page-subtitle">
              GRIDMIND AI · Raigad Microgrid
            </div>
          </div>

          {/* Center — LIVE + clock */}
          <div className="header-live">
            <div className="live-row">
              <div className="live-dot-wrap">
                <div className="live-dot" />
                <div className="live-dot-ring" />
              </div>
              <span className="live-label">Live</span>
            </div>
            <div className="live-time">{time}</div>
            <div className="live-ist">Indian Standard Time (IST)</div>
          </div>

          {/* FIXED: header alignment + removed simulate crisis & temperature */}
          <div className="header-right" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, flexWrap: 'nowrap', flexShrink: 0 }}>

            {/* FIXED #2: Icon-only theme toggle  */}
            <button 
              className="header-chip theme-toggle" 
              onClick={toggleTheme}
              title={`Switch to ${isLightMode ? 'Dark' : 'Light'} Mode`}
              style={{ fontSize: '1.1rem', padding: '6px 10px', lineHeight: 1 }}
            >
              {isLightMode ? '🌙' : '☀️'}
            </button>

            {/* FIXED #3: Role badge — lives here, no overlap */}
            {role && (
              <button
                onClick={role === 'admin' ? onAdminClick : undefined}
                title={role === 'admin' ? 'Open Admin Panel' : `Logged in as ${role}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 11px', borderRadius: '99px',
                  fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700,
                  cursor: role === 'admin' ? 'pointer' : 'default', border: '1.5px solid',
                  ...(role === 'admin' ? {
                    color: '#00FF88',
                    background: 'rgba(0,255,136,0.12)',
                    borderColor: '#00FF88',
                    boxShadow: '0 0 10px rgba(0,255,136,0.4)',
                  } : role === 'operator' ? {
                    color: 'var(--warning)',
                    background: 'rgba(255,196,0,0.08)',
                    borderColor: 'rgba(255,196,0,0.4)',
                  } : {
                    color: 'var(--text-muted)',
                    background: 'transparent',
                    borderColor: 'var(--border)',
                  })
                }}
              >
                {roleIcon} {roleLabel}
              </button>
            )}

            {/* FIXED logout: visible for operator + viewer only */}
            {(role === 'operator' || role === 'viewer') && (
              <button
                onClick={onLogout}
                title="Log Out"
                style={{
                  background: 'rgba(255,45,85,0.08)',
                  border: '1px solid rgba(255,45,85,0.35)',
                  color: 'var(--danger)', borderRadius: '99px',
                  padding: '5px 11px', fontSize: '0.78rem',
                  fontFamily: 'var(--font-head)', fontWeight: 600,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                🔓 Log Out
              </button>
            )}
          </div>

        </div>
      </header>

      {/* ── Thin context bar ── */}
      <div className="header-context-bar">
        <span className="context-bar-text">
          Currently monitoring:&nbsp;
          <span className="context-bar-highlight">Raigad District Microgrid, Maharashtra</span>
        </span>
        <div className="context-bar-sep" />
        <span className="context-bar-text">
          <span className="context-bar-highlight">4 villages</span>
          ,&nbsp;
          <span className="context-bar-highlight">2,400 residents</span>
        </span>
      </div>
    </>
  );
}
