import { useState, useEffect } from 'react';
import { useCrisis } from '../context/CrisisContext';
import { Search, Map, Bell, FileText, Zap, Sun, LayoutDashboard, Activity, AlertTriangle } from 'lucide-react';
import '../styles/CommandSearch.css';

const COMMANDS = [
  { id: 'dashboard', title: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'solar', title: 'Solar Forecast', icon: <Sun size={18} /> },
  { id: 'load', title: 'Load Manager', icon: <Zap size={18} /> },
  { id: 'grid', title: 'Grid Stability', icon: <Activity size={18} /> },
  { id: 'map', title: 'Village Map', icon: <Map size={18} /> },
  { id: 'alerts', title: 'AI Alerts', icon: <Bell size={18} /> },
  { id: 'reports', title: 'Reports', icon: <FileText size={18} /> },
  { id: 'crisis', title: 'Simulate Grid Crisis', icon: <AlertTriangle size={18} color="var(--danger)" /> }
];

const SEARCH_TERMS = {
  'bhatan': 'Bhatan village stats',
  'solar': 'Jumps to Solar Forecast page',
  'alert': 'Shows recent alerts list',
  'stability': 'Shows current score',
  'palaspe': 'Shows Palaspe zone info',
  'crisis': 'Triggers crisis simulation!'
};

export default function CommandSearch({ navigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { triggerCrisis } = useCrisis();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = COMMANDS.filter(cmd => 
    cmd.title.toLowerCase().includes(query.toLowerCase()) || 
    cmd.id.toLowerCase().includes(query.toLowerCase()) ||
    Object.keys(SEARCH_TERMS).some(k => k.includes(query.toLowerCase()) && (
      (k === 'bhatan' && cmd.id === 'map') ||
      (k === 'palaspe' && cmd.id === 'map') ||
      (k === 'solar' && cmd.id === 'solar') ||
      (k === 'alert' && cmd.id === 'alerts') ||
      (k === 'stability' && cmd.id === 'grid') ||
      (k === 'crisis' && cmd.id === 'crisis')
    ))
  );

  const handleSelect = (id) => {
    setIsOpen(false);
    if (id === 'crisis') {
      triggerCrisis();
    } else {
      navigate(id);
    }
  };

  return (
    <div className="cmd-overlay" onClick={() => setIsOpen(false)}>
      <div className="cmd-modal" onClick={e => e.stopPropagation()}>
        <div className="cmd-input-wrap">
          <Search size={20} className="cmd-icon" />
          <input 
            autoFocus
            className="cmd-input"
            placeholder="Search villages, alerts, metrics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="cmd-esc">ESC</div>
        </div>
        <div className="cmd-results">
          {filtered.length > 0 ? (
            filtered.map((cmd) => (
              <div key={cmd.id} className="cmd-item" onClick={() => handleSelect(cmd.id)}>
                <div className="cmd-item-icon">{cmd.icon}</div>
                <div className="cmd-item-title">{cmd.title}</div>
                {query && SEARCH_TERMS[query.toLowerCase()] && cmd.id === Object.keys(SEARCH_TERMS).find(k => k.includes(query.toLowerCase())) && (
                  <div className="cmd-item-hint">{SEARCH_TERMS[query.toLowerCase()]}</div>
                )}
              </div>
            ))
          ) : (
            <div className="cmd-empty">No results found for "{query}"</div>
          )}
        </div>
      </div>
    </div>
  );
}
