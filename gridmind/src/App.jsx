import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/Dashboard';
import SolarForecast from './pages/SolarForecast';
import LoadManager from './pages/LoadManager';
import PlaceholderPage from './pages/PlaceholderPage';
import './styles/App.css';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');

  const renderPage = () => {
    if (activePage === 'dashboard') return <DashboardPage />;
    if (activePage === 'solar') return <SolarForecast />;
    if (activePage === 'load') return <LoadManager />;
    return <PlaceholderPage pageId={activePage} />;
  };

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <Header activePage={activePage} />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}
