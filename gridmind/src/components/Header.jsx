import { useState, useEffect } from 'react';
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

export default function Header({ activePage }) {
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

          {/* Right — weather + health */}
          <div className="header-right">
            <div className="header-chip chip-weather">
              ☀️ Sunny 36°C&nbsp;&nbsp;Panvel
            </div>
            <div className="header-chip chip-health">
              <div className="chip-health-dot" />
              91% System Healthy
            </div>
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
