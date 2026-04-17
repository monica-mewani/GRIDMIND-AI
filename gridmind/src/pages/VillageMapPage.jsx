import { useState, useEffect } from 'react';
import { useCrisis } from '../context/CrisisContext';
import { stabilityData, loadData, alertsData } from '../data/kaggleData';
import '../styles/VillageMapPage.css';
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, Tooltip, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const locations = {
  panvelHub: { lat: 18.9894, lng: 73.1175, label: 'Panvel Hub — GRIDMIND AI' },
  bhatan: { 
    lat: 18.9672, lng: 73.0983, label: 'Bhatan Village',
    load: 3.8, households: 680, status: 'STABLE', color: '#00FF88'
  },
  somathne: { 
    lat: 18.9756, lng: 73.1089, label: 'Somathne PHC + School',
    load: 1.2, priority: true, status: 'PROTECTED', color: '#FF2D55'
  },
  palaspe: { 
    lat: 18.9923, lng: 73.1334, label: 'Palaspe Farm Zone',
    load: 2.4, type: 'Agricultural', status: 'STABLE', color: '#FF6B35'
  },
  kalamboli: { 
    lat: 18.9987, lng: 73.1398, label: 'Kalamboli Market',
    load: 2.1, type: 'Commercial', status: 'STABLE', color: '#00D4FF'
  }
};

export default function VillageMapPage() {
  const { crisisStep } = useCrisis();
  const [currentHour, setCurrentHour] = useState(new Date().getHours());
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const id = setInterval(() => setCurrentHour(new Date().getHours()), 60000);
    return () => clearInterval(id);
  }, []);

  const stabRow = stabilityData[currentHour] || stabilityData[0];
  const loadRow = loadData[currentHour] || loadData[0];
  const nextHour = (currentHour + 1) % 24;
  const loadPredictions = loadData; // Alias to match snippet
  const activeAlerts = alertsData.filter(a => a.hour === currentHour);

  // Derive node status
  const getStatus = (villageKey) => {
    // Crisis overrides
    if (crisisStep >= 2 && crisisStep < 7) {
      if (crisisStep >= 5 && villageKey === 'kalamboli') return 'shed';
      return 'critical';
    }
    if (crisisStep >= 7 && villageKey === 'kalamboli') return 'shed';
    
    // Normal Kaggle mapping
    const score = stabRow.avg_stability;
    if (score < 40) return 'critical';
    if (score <= 70) return 'warning';
    return 'stable';
  };

  const getVillageColor = (status, defaultColor, isPriority) => {
    if (isPriority && status !== 'shed') return '#FF2D55';
    switch(status) {
      case 'stable': return '#00FF88';
      case 'warning': return '#FFD60A';
      case 'critical': return '#FF2D55';
      case 'shed': return '#444';
      default: return defaultColor;
    }
  };

  const totalLoad = Object.keys(locations).reduce((sum, key) => {
    if(key === 'panvelHub') return sum;
    const status = getStatus(key);
    if(status === 'shed') return sum;
    return sum + (loadRow[`${key}_kw`] || locations[key].load);
  }, 0);

  const isBhatanCritical = getStatus('bhatan') === 'critical';
  const isPalaspeCritical = getStatus('palaspe') === 'critical';
  const kalamboliStatus = getStatus('kalamboli');

  return (
    <div className="vm-container" style={{ position: 'relative', height: '100%', width: '100%' }}>
      {/* ── TOP OVERLAY CONTROLS ── */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 1000, display: 'flex', gap: 10 }}>
        <button className={`vm-filter-btn ${filter === 'All' ? 'active' : ''}`} onClick={() => setFilter('All')}>All Zones</button>
        <button className={`vm-filter-btn ${filter === 'Warning' ? 'active' : ''}`} onClick={() => setFilter('Warning')}>⚠️ Warning</button>
        <button className={`vm-filter-btn ${filter === 'Critical' ? 'active' : ''}`} onClick={() => setFilter('Critical')}>🔴 Critical</button>
      </div>

      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 1000, background: 'rgba(2, 8, 23, 0.85)', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-primary)', backdropFilter: 'blur(10px)' }}>
        Total: {totalLoad.toFixed(1)} kW | {kalamboliStatus === 'shed' ? '3' : '4'}/4 Online | Stability: {stabRow.avg_stability.toFixed(0)}/100
      </div>

      <MapContainer
        center={[18.9850, 73.1150]}
        zoom={13}
        style={{ height: '100%', width: '100%', background: '#020817' }}
        zoomControl={false}
      >
        <ZoomControl position="bottomright" />
        
        {/* Standard OpenStreetMap tiles (Looks like Google Maps) */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* ── POWER LINES ── */}
        <Polyline
          positions={[
            [18.9894, 73.1175],  // Panvel Hub
            [18.9672, 73.0983]   // Bhatan
          ]}
          color={getVillageColor(getStatus('bhatan'), locations.bhatan.color, false)}
          weight={3}
          opacity={0.8}
          dashArray="10 5"
        />

        <Polyline
          positions={[
            [18.9894, 73.1175],
            [18.9756, 73.1089]   // Somathne
          ]}
          color={getVillageColor(getStatus('somathne'), locations.somathne.color, true)}
          weight={4}
          opacity={0.9}
        />

        <Polyline
          positions={[
            [18.9894, 73.1175],
            [18.9923, 73.1334]   // Palaspe
          ]}
          color={getVillageColor(getStatus('palaspe'), locations.palaspe.color, false)}
          weight={3}
          opacity={0.8}
          dashArray="10 5"
        />

        <Polyline
          positions={[
            [18.9894, 73.1175],
            [18.9987, 73.1398]   // Kalamboli
          ]}
          color={getVillageColor(kalamboliStatus, locations.kalamboli.color, false)}
          weight={3}
          opacity={kalamboliStatus === 'shed' ? 0.2 : 0.8}
          dashArray="10 5"
        />

        {/* ── VILLAGE MARKERS ── */}
        <CircleMarker
          center={[18.9672, 73.0983]}
          radius={20}
          fillColor={getVillageColor(getStatus('bhatan'), locations.bhatan.color, false)}
          color={getVillageColor(getStatus('bhatan'), locations.bhatan.color, false)}
          weight={2}
          fillOpacity={isBhatanCritical ? 0.6 : 0.3}
          className={isBhatanCritical ? 'vm-pulse-red' : ''}
        >
          <Tooltip permanent direction="top">
            <div style={{background:'#020817', color:locations.bhatan.color, border:`1px solid ${locations.bhatan.color}`, padding:'4px 8px', borderRadius:'4px' }}>
              🏘️ Bhatan · {loadRow.bhatan_kw.toFixed(1)} kW
            </div>
          </Tooltip>
          <Popup>
            <div style={{background:'#020817', color:'white', minWidth:'200px', padding:'12px'}}>
              <h3 style={{color:locations.bhatan.color}}>🏘️ Bhatan Village</h3>
              <p>680 households</p>
              <p>Current Load: <b>{loadRow.bhatan_kw.toFixed(1)} kW</b></p>
              <p>ML Next Hour: <b>{loadPredictions[nextHour]?.bhatan_kw.toFixed(1)} kW</b></p>
              <p>Stability: <b style={{color:locations.bhatan.color}}>87/100 STABLE</b></p>
              <p>Battery Backup: ~8 hrs</p>
              <p style={{color:'#888'}}>Monsoon prep: shutters installed ✅</p>
            </div>
          </Popup>
        </CircleMarker>

        {/* Somathne - Priority Zone */}
        <CircleMarker
          center={[18.9756, 73.1089]}
          radius={22}
          fillColor={locations.somathne.color}
          color={locations.somathne.color}
          weight={3}
          fillOpacity={0.4}
        >
          <Tooltip permanent direction="top">
            <div style={{background:'#020817', color:locations.somathne.color, border:`1px solid ${locations.somathne.color}`, padding:'4px 8px', borderRadius:'4px' }}>
              🏥 Somathne PHC · PRIORITY · {loadRow.somathne_kw.toFixed(1)} kW
            </div>
          </Tooltip>
          <Popup>
            <div style={{background:'#020817', color:'white', minWidth:'200px', padding:'12px'}}>
              <h3 style={{color:locations.somathne.color}}>🏥 Somathne PHC + School</h3>
              <p style={{color:locations.somathne.color, fontWeight:'bold'}}>⭐ PRIORITY ZONE — Never cut</p>
              <p>PHC: 24/7 power guaranteed</p>
              <p>School: 320 students</p>
              <p>Current Load: <b>{loadRow.somathne_kw.toFixed(1)} kW</b></p>
              <p>ML Next Hour: <b>{loadPredictions[nextHour]?.somathne_kw.toFixed(1)} kW</b></p>
              <p>Battery Backup: ~11 hrs</p>
              <p>Patients/month: 1,200</p>
            </div>
          </Popup>
        </CircleMarker>

        {/* Palaspe */}
        <CircleMarker
          center={[18.9923, 73.1334]}
          radius={18}
          fillColor={getVillageColor(getStatus('palaspe'), locations.palaspe.color, false)}
          color={getVillageColor(getStatus('palaspe'), locations.palaspe.color, false)}
          weight={2}
          fillOpacity={isPalaspeCritical ? 0.6 : 0.3}
          className={isPalaspeCritical ? 'vm-pulse-red' : ''}
        >
          <Tooltip permanent direction="top">
            <div style={{background:'#020817', color:locations.palaspe.color, border:`1px solid ${locations.palaspe.color}`, padding:'4px 8px', borderRadius:'4px' }}>
              🌾 Palaspe · {loadRow.palaspe_kw.toFixed(1)} kW · Kharif
            </div>
          </Tooltip>
          <Popup>
            <div style={{background:'#020817', color:'white', minWidth:'200px', padding:'12px'}}>
              <h3 style={{color:locations.palaspe.color}}>🌾 Palaspe Agricultural Zone</h3>
              <p>42 farm pump connections</p>
              <p>Kharif Season: ACTIVE 🌱</p>
              <p>Pump window: 4:00 AM - 8:00 AM</p>
              <p>Current Load: <b>{loadRow.palaspe_kw.toFixed(1)} kW</b></p>
              <p>ML Next Hour: <b>{loadPredictions[nextHour]?.palaspe_kw.toFixed(1)} kW</b></p>
            </div>
          </Popup>
        </CircleMarker>

        {/* Kalamboli */}
        <CircleMarker
          center={[18.9987, 73.1398]}
          radius={18}
          fillColor={getVillageColor(kalamboliStatus, locations.kalamboli.color, false)}
          color={getVillageColor(kalamboliStatus, locations.kalamboli.color, false)}
          weight={2}
          fillOpacity={kalamboliStatus === 'shed' ? 0 : 0.3}
        >
          <Tooltip permanent direction="top">
            <div style={{background:'#020817', color:locations.kalamboli.color, border:`1px solid ${locations.kalamboli.color}`, padding:'4px 8px', borderRadius:'4px', opacity: kalamboliStatus === 'shed' ? 0.3 : 1 }}>
              🏪 Kalamboli · {kalamboliStatus === 'shed' ? '0.0' : loadRow.kalamboli_kw.toFixed(1)} kW
            </div>
          </Tooltip>
          <Popup>
            <div style={{background:'#020817', color:'white', minWidth:'200px', padding:'12px'}}>
              <h3 style={{color:locations.kalamboli.color}}>🏪 Kalamboli Market</h3>
              <p>Commercial zone</p>
              <p>Peak: 10 AM - 7 PM</p>
              <p>Current Load: <b>{kalamboliStatus === 'shed' ? '0.0' : loadRow.kalamboli_kw.toFixed(1)} kW</b></p>
              {kalamboliStatus === 'shed' && <p style={{color:'#FF2D55'}}><b>STATUS: LOAD SHED</b></p>}
              <p>Can tolerate: 1hr load shedding</p>
              <p>ML Next Hour: <b>{loadPredictions[nextHour]?.kalamboli_kw.toFixed(1)} kW</b></p>
            </div>
          </Popup>
        </CircleMarker>

        {/* Panvel Hub - Central Node */}
        <CircleMarker
          center={[18.9894, 73.1175]}
          radius={25}
          fillColor="#00FF88"
          color="#00FF88"
          weight={3}
          fillOpacity={0.5}
        >
          <Tooltip permanent direction="bottom">
            <div style={{background:'#020817', color:'#00FF88', border:'1px solid #00FF88', padding:'4px 8px', borderRadius:'4px', fontWeight:'bold' }}>
              ⚡ GRIDMIND AI — Panvel Hub
            </div>
          </Tooltip>
        </CircleMarker>

      </MapContainer>
    </div>
  );
}
