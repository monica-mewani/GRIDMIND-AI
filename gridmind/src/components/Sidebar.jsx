import { useState } from 'react';
import {
  Zap,
  LayoutDashboard,
  Sun,
  Activity,
  Map,
  Bell,
  FileText,
} from 'lucide-react';
import '../styles/Sidebar.css';

const navItems = [
  { id: 'dashboard',  label: 'Dashboard',     icon: LayoutDashboard },
  { id: 'solar',      label: 'Solar Forecast', icon: Sun             },
  { id: 'load',       label: 'Load Manager',   icon: Zap             },
  { id: 'grid',       label: 'Grid Stability', icon: Activity        },
  { id: 'map',        label: 'Village Map',    icon: Map             },
  { id: 'alerts',     label: 'AI Alerts',      icon: Bell,  badge: 2 },
  { id: 'reports',    label: 'Reports',        icon: FileText        },
];

export default function Sidebar({ activePage, onNavigate, alertCount }) {
  // FIXED #6: Use dynamic alertCount prop; fall back to static value if not provided
  const dynamicBadge = typeof alertCount === 'number' ? alertCount : 2;
  return (
    <aside className="sidebar">
      {/* ── Logo ── */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-row">
          <div className="logo-icon-wrap">
            <Zap size={20} strokeWidth={2.5} />
          </div>
          <div>
            <div className="logo-text">
              GRID<span>MIND</span> AI
            </div>
          </div>
        </div>
        {/* FIXED: updated location and removed temperature */}
        <div className="location-info" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
          <div className="logo-subtitle" style={{ textTransform: 'uppercase' }}>Panvel, Raigad District</div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <div
              key={item.id}
              className={`nav-item${isActive ? ' active' : ''}`}
              onClick={() => {
                onNavigate(item.id);
                document.body.classList.remove('sidebar-open');
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onNavigate(item.id)}
              id={`nav-${item.id}`}
            >
              <span className="nav-item-icon">
                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
              </span>
              <span className="nav-item-label">{item.label}</span>
              {/* FIXED #6: Use dynamic alert count from parent */}
              {item.id === 'alerts' && dynamicBadge > 0 && (
                <span className="nav-badge">{dynamicBadge}</span>
              )}
              {item.badge && item.id !== 'alerts' && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="sidebar-footer">
        <div className="sidebar-status">
          <div className="status-dot-small" />
          SYSTEM ONLINE
        </div>
        <div className="sidebar-footer-tag">Serving 2,400 residents across</div>
        <div className="sidebar-footer-villages">
          Bhatan
          <span className="sidebar-footer-dot">•</span>
          Somathne
          <span className="sidebar-footer-dot">•</span>
          Palaspe
          <span className="sidebar-footer-dot">•</span>
          Kalamboli
        </div>
      </div>
    </aside>
  );
}
