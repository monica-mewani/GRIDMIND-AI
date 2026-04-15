import EnergyFlow    from '../components/EnergyFlow';
import SolarGeneration from '../components/SolarGeneration';
import GridStability  from '../components/GridStability';
import BatteryStatus  from '../components/BatteryStatus';
import ZoneLoad       from '../components/ZoneLoad';
import KPIStrip       from '../components/KPIStrip';
import '../styles/App.css';
import '../styles/Dashboard.css';

export default function DashboardPage() {
  return (
    <div className="page-wrapper dash-page">

      {/* ── Hero tagline ── */}
      <div className="dash-hero">
        <span className="dash-hero-tag">Bijli Bachao. Gaon Jagao.</span>
        <span className="dash-hero-sub">Intelligent Power. Zero Waste.</span>
        <div className="dash-hero-divider" />
      </div>

      {/* ── Panel 1: Energy Flow (full width) ── */}
      <div className="dash-grid">
        <EnergyFlow />
      </div>

      {/* ── Panels 2 + 3 + 4 ── */}
      <div className="dash-grid dash-mid-row">
        <SolarGeneration />
        <GridStability />
        <BatteryStatus />
      </div>

      {/* ── Panels 5 (zone) + KPI strip ── */}
      <div className="dash-grid dash-bottom-row">
        <ZoneLoad />
        <div className="kpi-col">
          <KPIStrip />
        </div>
      </div>

    </div>
  );
}
