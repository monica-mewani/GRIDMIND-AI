import { Sun, Zap, Activity, Map, Bell, FileText } from 'lucide-react';
import '../styles/App.css';

const PAGE_META = {
  solar:   { icon: Sun,      label: 'Solar Forecast',  desc: 'Hourly solar generation, irradiance & AI forecast — coming soon' },
  load:    { icon: Zap,      label: 'Load Manager',    desc: 'Village-wise load distribution & demand prediction — coming soon' },
  grid:    { icon: Activity, label: 'Grid Stability',  desc: 'Voltage, power factor & stability score monitor — coming soon' },
  map:     { icon: Map,      label: 'Village Map',      desc: 'Live microgrid map of Raigad District villages — coming soon' },
  alerts:  { icon: Bell,     label: 'AI Alerts',        desc: 'Real-time fault detection & AI recommendations — coming soon' },
  reports: { icon: FileText, label: 'Reports',          desc: 'Monthly energy reports & sustainability metrics — coming soon' },
};

export default function PlaceholderPage({ pageId }) {
  const meta = PAGE_META[pageId] || PAGE_META['solar'];
  const Icon = meta.icon;
  return (
    <div className="page-wrapper">
      <div className="page-coming-soon">
        <div className="coming-soon-icon">
          <Icon size={28} color="var(--primary)" />
        </div>
        <div className="coming-soon-title">{meta.label}</div>
        <div className="coming-soon-sub">{meta.desc}</div>
      </div>
    </div>
  );
}
