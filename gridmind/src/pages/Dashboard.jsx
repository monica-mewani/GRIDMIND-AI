import { useState, useEffect } from 'react';
import EnergyFlow    from '../components/EnergyFlow';
import SolarGeneration from '../components/SolarGeneration';
import GridStability  from '../components/GridStability';
import BatteryStatus  from '../components/BatteryStatus';
import ZoneLoad       from '../components/ZoneLoad';
import KPIStrip       from '../components/KPIStrip';
import { fetchDashboard } from '../api/gridmindAPI';
import '../styles/App.css';
import '../styles/Dashboard.css';

export default function DashboardPage({ setApiConnected }) {
  const [apiData, setApiData] = useState(null);

  useEffect(() => {
    const fetchLoop = () => {
      fetchDashboard()
        .then(data => {
          setApiData(data);
          if (setApiConnected) setApiConnected(true);
        })
        .catch(err => {
          console.error("API Fetch Error:", err);
          if (setApiConnected) setApiConnected(false);
          setApiData(null); // Fallback to JSON locally inside child components
        });
    };

    fetchLoop();
    const id = setInterval(fetchLoop, 5000);
    return () => clearInterval(id);
  }, [setApiConnected]);
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
        <EnergyFlow apiData={apiData} />
      </div>

      {/* ── Panels 2 + 3 + 4 ── */}
      <div className="dash-grid dash-mid-row">
        <SolarGeneration apiData={apiData?.solar} />
        <GridStability apiData={apiData?.grid} />
        <BatteryStatus apiData={apiData?.battery} />
      </div>

      {/* ── Panels 5 (zone) + KPI strip ── */}
      <div className="dash-grid dash-bottom-row">
        <ZoneLoad apiData={apiData?.villages} />
        <div className="kpi-col">
          <KPIStrip apiData={apiData} />
        </div>
      </div>

    </div>
  );
}
