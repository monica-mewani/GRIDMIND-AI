import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/Dashboard';
import SolarForecast from './pages/SolarForecast';
import LoadManager from './pages/LoadManager';
import GridStabilityPage from './pages/GridStabilityPage';
import AIAlertsPage from './pages/AIAlertsPage';
import VillageMapPage from './pages/VillageMapPage';
import ReportsPage from './pages/ReportsPage';
import PlaceholderPage from './pages/PlaceholderPage';
import CommandSearch from './components/CommandSearch';
import { CrisisProvider, useCrisis } from './context/CrisisContext';
/* NEW: role system — isolated, does not affect existing logic */
import { RoleProvider, useRole } from './context/RoleContext';
import LoginScreen from './components/LoginScreen';
import AdminPanel from './components/AdminPanel';
import './styles/App.css';
import './styles/GridmindExtra.css';

function AppContent() {
  const [activePage, setActivePage] = useState('dashboard');
  const [apiConnected, setApiConnected] = useState(false);
  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('theme') === 'light';
  });

  /* NEW: role system state — isolated */
  const { role, setRole } = useRole();
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [operatorCodes, setOperatorCodes] = useState([]);
  /* FIXED #6 & #7: Dynamic alert count — passed to Sidebar + AIAlertsPage */
  const [alertCount, setAlertCount] = useState(8); // initial = hardcoded(3) + dynamic(5)

  /* FIXED: duplicate role icons - removed from label */
  const ROLE_LABELS = { admin: 'Admin', operator: 'Operator', viewer: 'Viewer' };
  const ROLE_ICONS  = { admin: '🛡', operator: '⚙', viewer: '👁' };

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLightMode]);

  const toggleTheme = () => setIsLightMode(prev => !prev);

  const renderPage = () => {
    if (activePage === 'dashboard') return <DashboardPage setApiConnected={setApiConnected} />;
    if (activePage === 'solar') return <SolarForecast />;
    if (activePage === 'load') return <LoadManager />;
    if (activePage === 'grid') return <GridStabilityPage />;
    /* FIXED #6: Pass setAlertCount so AIAlertsPage can update sidebar badge */
    if (activePage === 'alerts') return <AIAlertsPage alertCount={alertCount} setAlertCount={setAlertCount} />;
    if (activePage === 'map') return <VillageMapPage />;
    if (activePage === 'reports') return <ReportsPage />;
    return <PlaceholderPage pageId={activePage} />;
  };

  const { crisisStep, simulatedAlerts } = useCrisis();
  const hasCrisisFlash = crisisStep === 0;

  /* FIXED #5: simulate crisis updates alert count */
  useEffect(() => {
    if (simulatedAlerts?.length > 0) {
      setAlertCount(prev => prev + 1);
    }
  }, [simulatedAlerts?.length]);

  /* NEW: If not logged in, show login gate. Existing app untouched behind it. */
  if (!role) {
    return <LoginScreen generatedOperatorCodes={operatorCodes} />;
  }

  return (
    <div className="app-layout" style={{
      boxShadow: hasCrisisFlash ? 'inset 0 0 100px rgba(255,45,85,0.5)' : 'none',
      transition: 'box-shadow 0.2s',
      animation: hasCrisisFlash ? 'pulseRed 1.5s 3' : 'none'
    }}>
      <CommandSearch navigate={setActivePage} />
      <Sidebar activePage={activePage} onNavigate={setActivePage} alertCount={alertCount} />
      {/* FIXED #2 & #3: Role badge + logout passed INTO Header to prevent overlap */}
      <Header 
        activePage={activePage} 
        isLightMode={isLightMode} 
        toggleTheme={toggleTheme} 
        apiConnected={apiConnected}
        role={role}
        roleLabel={ROLE_LABELS[role]}
        roleIcon={ROLE_ICONS[role]}
        onAdminClick={() => setShowAdminPanel(true)}
        onLogout={() => setRole(null)}
      />
      {/* NEW: Admin Panel modal */}
      {showAdminPanel && (
        <AdminPanel
          onClose={() => setShowAdminPanel(false)}
          onNewCode={(c) => setOperatorCodes(prev => [...prev, c])}
        />
      )}
      <main className="main-content">
        {renderPage()}
      </main>

      {/* ── Global Crisis Toasts ── */}
      {crisisStep >= 0 && crisisStep < 10 && (
        <div className="crisis-toast animate-toast-up">
          <div className="toast-icon">⚠️</div>
          <div className="toast-text">
            <strong>Pre-monsoon storm detected</strong>
            <br/>AI intervention starting
          </div>
        </div>
      )}
      {crisisStep === 10 && (
        <div className="crisis-toast animate-toast-up success-toast" style={{animationDuration: '5s'}}>
          <div className="toast-icon">✅</div>
          <div className="toast-text">
            <strong>Storm managed by GRIDMIND AI</strong>
            <div style={{fontSize: '0.85em', marginTop: 4, opacity: 0.9}}>
              Somathne PHC: Protected ✅<br/>
              Bhatan Village: Power maintained ✅<br/>
              Kalamboli: Restored after 8 seconds<br/>
              Outage prevented for 2,400 residents<br/>
              ML Models used: All 4 active<br/>
              Response time: 0.3 seconds
            </div>
          </div>
        </div>
      )}
    </div>);
}

export default function App() {
  return (
    /* NEW: RoleProvider wraps everything. CrisisProvider unchanged. */
    <RoleProvider>
      <CrisisProvider>
        <AppContent />
      </CrisisProvider>
    </RoleProvider>
  );
}
